import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { DeviceProtocol } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import { RegisterCacheService } from './register-cache.service';
import { ModbusTcpDriver } from './drivers/modbus-tcp.driver';
import { ModbusTcpProtocolAttributesEntity } from '../registers/entities/protocol-attributes';

// ---------------------------------------------------------------------------
// Lightweight shapes used internally by the connection layer.
// These intentionally mirror the DTO fields rather than importing
// from the Devices / Registers modules (which import this module),
// to avoid circular NestJS module dependencies.
// ---------------------------------------------------------------------------

export interface IDeviceRef {
  id: number;
  ip: string;
  port: number;
  protocol: DeviceProtocol;
}

export interface IRegisterRef {
  id: number;
  deviceId: number;
  /** Raw JSON stored in the database - cast per-protocol as needed. */
  protocolAttributes: unknown;
}

/** Signature for an overridable write strategy. */
export type WriterFn = (value: number) => Promise<void>;

/**
 * ConnectionManagerService
 *
 * Owns the runtime state of every device connection and register dictionary.
 *
 * Responsibilities:
 *  - Bootstrap on startup (load devices + registers from DB, open TCP connections).
 *  - Receive CRUD events from DevicesService / RegistersService and keep the
 *    in-memory state consistent.
 *  - Expose `writeRegister()` for immediate writes to the physical device,
 *    also updating the register cache.
 *  - Allow per-register custom writer functions to be installed/removed at
 *    runtime (`setCustomWriter` / `clearCustomWriter`).
 */
@Injectable()
export class ConnectionManagerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ConnectionManagerService.name);

  /** deviceId → driver instance */
  private readonly drivers = new Map<number, ModbusTcpDriver>();
  /** registerId → register descriptor */
  private readonly registers = new Map<number, IRegisterRef>();
  /** registerId → optional custom writer (overrides default protocol write) */
  private readonly customWriters = new Map<number, WriterFn>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: RegisterCacheService
  ) {}

  async onModuleInit(): Promise<void> {
    const [devices, registers] = await Promise.all([
      this.prisma.device.findMany({
        select: { id: true, ip: true, port: true, protocol: true },
      }),
      this.prisma.registerDictEntry.findMany({
        select: { id: true, deviceId: true, protocolAttributes: true },
      }),
    ]);

    for (const d of devices) {
      this.createDriver(d);
    }
    for (const r of registers) {
      this.registers.set(r.id, r);
    }

    // Connect all drivers in parallel (errors are logged, not thrown).
    await Promise.allSettled([...this.drivers.values()].map((drv) => drv.connect()));

    this.logger.log(`Initialised ${devices.length} device(s) and ${registers.length} register(s).`);
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.allSettled([...this.drivers.values()].map((drv) => drv.disconnect()));
  }

  private createDriver(device: IDeviceRef): void {
    if (device.protocol === DeviceProtocol.ModbusTCP) {
      this.drivers.set(device.id, new ModbusTcpDriver(device.id, device.ip, device.port));
    } else {
      this.logger.warn(`[Device ${device.id}] Unsupported protocol: ${device.protocol}`);
    }
  }

  async onDeviceCreated(device: IDeviceRef): Promise<void> {
    this.createDriver(device);
    await this.drivers.get(device.id)?.connect();
  }

  async onDeviceUpdated(device: IDeviceRef): Promise<void> {
    const old = this.drivers.get(device.id);
    if (old) await old.disconnect();
    this.drivers.delete(device.id);
    this.createDriver(device);
    await this.drivers.get(device.id)?.connect();
  }

  async onDeviceDeleted(deviceId: number): Promise<void> {
    const driver = this.drivers.get(deviceId);
    if (driver) {
      await driver.disconnect();
      this.drivers.delete(deviceId);
    }
    // Evict all registers belonging to this device.
    for (const [regId, reg] of this.registers) {
      if (reg.deviceId === deviceId) {
        this.registers.delete(regId);
        this.cache.delete(regId);
        this.customWriters.delete(regId);
      }
    }
  }

  onRegisterCreated(reg: IRegisterRef): void {
    this.registers.set(reg.id, reg);
  }

  onRegisterUpdated(reg: IRegisterRef): void {
    this.registers.set(reg.id, reg);
    this.cache.delete(reg.id);
  }

  onRegisterDeleted(regId: number): void {
    this.registers.delete(regId);
    this.cache.delete(regId);
    this.customWriters.delete(regId);
  }

  getRegisters(): ReadonlyMap<number, IRegisterRef> {
    return this.registers;
  }

  getDriver(deviceId: number): ModbusTcpDriver | undefined {
    return this.drivers.get(deviceId);
  }

  /**
   * Writes `value` to the physical device immediately and updates the cache.
   *
   * If a custom writer has been installed for `registerId` it is used instead
   * of the default protocol handler.
   *
   * Throws if the register or driver is unknown, the register is read-only,
   * or the transport returns an error.
   */
  async writeRegister(registerId: number, value: number): Promise<void> {
    const custom = this.customWriters.get(registerId);
    if (custom) {
      await custom(value);
      this.cache.set(registerId, value);
      return;
    }

    const reg = this.registers.get(registerId);
    if (!reg) {
      throw new Error(`Register ${registerId} is not tracked by the connection manager`);
    }

    const driver = this.drivers.get(reg.deviceId);
    if (!driver) {
      throw new Error(`No driver available for device ${reg.deviceId} (register ${registerId})`);
    }

    const attrs = reg.protocolAttributes as unknown as ModbusTcpProtocolAttributesEntity;
    await driver.writeRegister(attrs, value);
    this.cache.set(registerId, value);
  }

  /**
   * Installs a custom writer function for a register.
   *
   * The custom writer is called instead of the default protocol write when
   * `writeRegister()` is invoked for this register.  This allows runtime
   * overrides (e.g. simulation, data transformation, fan-out writes).
   */
  setCustomWriter(registerId: number, writer: WriterFn): void {
    this.customWriters.set(registerId, writer);
    this.logger.debug(`Custom writer installed for register ${registerId}`);
  }

  /** Removes a previously installed custom writer, restoring default behaviour. */
  clearCustomWriter(registerId: number): void {
    this.customWriters.delete(registerId);
    this.logger.debug(`Custom writer removed for register ${registerId}`);
  }
}
