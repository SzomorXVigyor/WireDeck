import ModbusRTU from 'modbus-serial';
import { Logger } from '@nestjs/common';
import {
  ModbusTcpProtocolAttributesEntity,
  RegisterOperation,
  RegisterType,
} from '../../registers/entities/protocol-attributes';

/**
 * Wraps a single `modbus-serial` TCP client for one physical device.
 *
 * All read and write operations are **serialised** through an internal
 * promise-queue so that concurrent callers never send overlapping
 * Modbus frames on the same TCP socket.
 *
 * Auto-reconnects on the next operation if the socket was closed.
 */
export class ModbusTcpDriver {
  private readonly client: ModbusRTU;
  private readonly logger = new Logger(ModbusTcpDriver.name);

  /** Tail of the serialisation queue; always resolved (never rejects). */
  private queue: Promise<void> = Promise.resolve();

  constructor(
    readonly deviceId: number,
    private readonly host: string,
    private readonly port: number
  ) {
    this.client = new ModbusRTU();
  }

  async connect(): Promise<void> {
    if (this.client.isOpen) return;
    try {
      await this.client.connectTCP(this.host, { port: this.port });
      this.logger.log(`[Device ${this.deviceId}] Connected to ${this.host}:${this.port}`);
    } catch (err) {
      this.logger.warn(`[Device ${this.deviceId}] Connection failed - ${String(err)}`);
    }
  }

  async disconnect(): Promise<void> {
    if (!this.client.isOpen) return;
    await new Promise<void>((resolve) => this.client.close(() => resolve()));
    this.logger.log(`[Device ${this.deviceId}] Disconnected`);
  }

  /**
   * Appends `fn` to the serial queue.  The queue tail never rejects so
   * subsequent items are always executed even when `fn` throws.
   */
  private enqueue<T>(fn: () => Promise<T>): Promise<T> {
    const result = this.queue.then(fn);
    // Swallow the error for the queue chain only; the caller still gets it.
    this.queue = result.then(
      () => {},
      () => {}
    );
    return result;
  }

  private async ensureConnected(): Promise<void> {
    if (!this.client.isOpen) {
      await this.connect();
    }
    if (!this.client.isOpen) {
      throw new Error(`[Device ${this.deviceId}] Not connected to ${this.host}:${this.port}`);
    }
  }

  readRegister(attrs: ModbusTcpProtocolAttributesEntity): Promise<number> {
    return this.enqueue(() => this._read(attrs));
  }

  private async _read(attrs: ModbusTcpProtocolAttributesEntity): Promise<number> {
    await this.ensureConnected();
    this.client.setID(attrs.slaveAddress);

    this.logger.debug(
      `[Device ${this.deviceId}] Reading register at address ${attrs.registerAddress} (type=${attrs.registerType}, operation=${attrs.operation})`
    );

    switch (attrs.registerType) {
      case RegisterType.COIL: {
        const r = await this.client.readCoils(attrs.registerAddress, 1);
        return r.data[0] ? 1 : 0;
      }
      case RegisterType.DISCRETE_INPUT: {
        const r = await this.client.readDiscreteInputs(attrs.registerAddress, 1);
        return r.data[0] ? 1 : 0;
      }
      case RegisterType.HOLDING_REGISTER: {
        const r = await this.client.readHoldingRegisters(attrs.registerAddress, 1);
        return r.data[0];
      }
      case RegisterType.INPUT_REGISTER: {
        const r = await this.client.readInputRegisters(attrs.registerAddress, 1);
        return r.data[0];
      }
      default:
        throw new Error(`Unknown register type: ${String(attrs.registerType)}`);
    }
  }

  writeRegister(attrs: ModbusTcpProtocolAttributesEntity, value: number): Promise<void> {
    return this.enqueue(() => this._write(attrs, value));
  }

  private async _write(attrs: ModbusTcpProtocolAttributesEntity, value: number): Promise<void> {
    if (attrs.operation === RegisterOperation.R) {
      throw new Error(`Register address ${attrs.registerAddress} is read-only (operation=R)`);
    }

    await this.ensureConnected();
    this.client.setID(attrs.slaveAddress);

    this.logger.debug(
      `[Device ${this.deviceId}] Writing value ${value} to register at address ${attrs.registerAddress} (type=${attrs.registerType}, operation=${attrs.operation})`
    );

    switch (attrs.registerType) {
      case RegisterType.COIL:
        await this.client.writeCoil(attrs.registerAddress, value !== 0);
        return;

      case RegisterType.HOLDING_REGISTER:
        await this.client.writeRegister(attrs.registerAddress, value);
        return;

      case RegisterType.DISCRETE_INPUT:
      case RegisterType.INPUT_REGISTER:
        throw new Error(`Cannot write to ${attrs.registerType} register (read-only Modbus area)`);

      default:
        throw new Error(`Unknown register type: ${String(attrs.registerType)}`);
    }
  }
}
