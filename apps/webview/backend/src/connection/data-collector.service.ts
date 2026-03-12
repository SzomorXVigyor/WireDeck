import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { RegisterCacheService } from './register-cache.service';
import { ConnectionManagerService } from './connection-manager.service';
import { ModbusTcpProtocolAttributesEntity } from '../registers/entities/protocol-attributes';
import { WriteOnlyRegisterError } from './drivers/modbus-tcp.driver';

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

  constructor(
    private readonly connectionManager: ConnectionManagerService,
    private readonly cache: RegisterCacheService
  ) {}

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
          this.cache.set(regId, value);
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
