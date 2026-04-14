import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { RegisterCacheService } from './register-cache.service';
import { ConnectionManagerService } from './connection-manager.service';
import { ModbusTcpProtocolAttributesEntity } from '../registers/entities/protocol-attributes';
import { WriteOnlyRegisterError } from './drivers/modbus-tcp.driver';

/**
 * Handler function called when a register value changes.
 *
 * @param regId  - The register ID whose value changed.
 * @param value  - The new register value.
 * @param self   - The context object supplied when the handler was registered.
 */
export type RegisterValueChangeHandler<T = unknown> = (regId: number, value: number, self: T) => void | Promise<void>;

/** Internal storage entry for a single registered handler. */
interface HandlerEntry {
  /** Unique key within the regId bucket (e.g. "notification:42"). */
  key: string;
  /** Caller-supplied context object, passed back as `self` to the handler. */
  selfAttr: unknown;
  handler: RegisterValueChangeHandler<unknown>;
}

/**
 * DataCollectorService
 *
 * Runs a fixed-rate scheduled job that iterates every known register,
 * reads its current value from the physical device, and stores the result
 * in the RegisterCacheService.
 *
 * Design rules:
 *  - REST-API queries NEVER trigger this collector - they only read from the cache.
 *  - If a collection cycle is already running when the next tick fires, the new
 *    tick is skipped to prevent overlapping I/O.
 *  - Registers are grouped by device and read sequentially within each device to
 *    honour the ModbusTcpDriver's internal serial queue (one in-flight request
 *    per TCP socket at a time).
 *  - Failures on individual registers are logged and skipped; they do not abort
 *    the rest of the cycle.
 */
@Injectable()
export class DataCollectorService {
  private readonly logger = new Logger(DataCollectorService.name);
  private running = false;
  private readonly valueChangeHandlers = new Map<number, HandlerEntry[]>();

  constructor(
    private readonly connectionManager: ConnectionManagerService,
    private readonly cache: RegisterCacheService
  ) {}

  /**
   * Register a value-change handler for a specific register.
   *
   * @param regId    - Register ID to watch.
   * @param key      - Unique identifier within this regId bucket (e.g. "notification:42").
   *                   Adding a handler with an already-existing key replaces the previous one.
   * @param selfAttr - Arbitrary context object forwarded to `handler` as the `self` param.
   * @param fn       - Callback invoked whenever the register value changes.
   */
  addRegisterValueChangeHandler<T>(regId: number, key: string, selfAttr: T, fn: RegisterValueChangeHandler<T>): void {
    if (!this.valueChangeHandlers.has(regId)) {
      this.valueChangeHandlers.set(regId, []);
    }
    const bucket = this.valueChangeHandlers.get(regId)!;

    // Replace if same key already exists
    const existingIdx = bucket.findIndex((e) => e.key === key);
    const entry: HandlerEntry = { key, selfAttr, handler: fn as RegisterValueChangeHandler<unknown> };
    if (existingIdx !== -1) {
      bucket[existingIdx] = entry;
    } else {
      bucket.push(entry);
    }
  }

  /**
   * Remove a previously registered handler by its key.
   * No-op if the regId or key is not found.
   */
  removeRegisterValueChangeHandler(regId: number, key: string): void {
    const bucket = this.valueChangeHandlers.get(regId);
    if (!bucket) return;
    const filtered = bucket.filter((e) => e.key !== key);
    if (filtered.length === 0) {
      this.valueChangeHandlers.delete(regId);
    } else {
      this.valueChangeHandlers.set(regId, filtered);
    }
  }

  /** Runs every 5 seconds.  Adjust the cron expression to change the rate. */
  @Cron('*/5 * * * * *')
  async collect(): Promise<void> {
    if (this.running) {
      this.logger.warn('Previous collection cycle still in progress - skipping tick');
      return;
    }

    this.running = true;
    try {
      await this.runCycle();
    } finally {
      this.running = false;
    }
  }

  private async runCycle(): Promise<void> {
    const registers = this.connectionManager.getRegisters();

    // --- group register IDs by their owning device ---
    const byDevice = new Map<number, number[]>(); // deviceId → [registerId, ...]
    for (const [regId, reg] of registers) {
      if (!byDevice.has(reg.deviceId)) byDevice.set(reg.deviceId, []);
      byDevice.get(reg.deviceId)!.push(regId);
    }

    // --- poll device by device (sequential within each device) ---
    for (const [deviceId, regIds] of byDevice) {
      const driver = this.connectionManager.getDriver(deviceId);
      if (!driver) {
        this.logger.warn(`[Device ${deviceId}] No driver found - skipping ${regIds.length} register(s)`);
        continue;
      }

      for (const regId of regIds) {
        const reg = registers.get(regId);
        if (!reg) continue;

        try {
          // Currently only ModbusTCP is supported; extend here for future protocols.
          const attrs = reg.protocolAttributes as unknown as ModbusTcpProtocolAttributesEntity;
          const value = await driver.readRegister(attrs);
          const changed = this.cache.set(regId, value);

          if (changed === 1) {
            const bucket = this.valueChangeHandlers.get(regId);
            if (bucket) {
              for (const entry of bucket) {
                // Execute handler asynchronously so it doesn't block the collection cycle
                Promise.resolve(entry.handler(regId, value, entry.selfAttr)).catch((err) => {
                  this.logger.error(
                    `Error in register value change handler (key="${entry.key}") for regId ${regId}: ${err}`
                  );
                });
              }
            }
          }
        } catch (err) {
          if (err instanceof WriteOnlyRegisterError) {
            // Write-only register - skip silently, no cache entry produced.
            continue;
          }
          this.logger.error(`[Device ${deviceId}] Failed to read register ${regId}: ${String(err)}`);
        }
      }
    }
  }
}
