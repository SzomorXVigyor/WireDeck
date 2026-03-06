// ── Access types ──────────────────────────────────────────────────────────
export type AccessType = 'ModbusTCP';

// ── ModbusTCP protocol attributes ─────────────────────────────────────────
export type ModbusRegisterType = 'coil' | 'discrete-input' | 'holding-register' | 'input-register';
export type ModbusOperation = 'R' | 'W' | 'RW';

export interface ModbusTCPAttributes {
  /** Device IP address. */
  ip: string;
  /** TCP port (default 502). */
  port: number;
  /** Modbus slave / unit address (0–247). */
  slaveAddress: number;
  /** Modbus register table. */
  registerType: ModbusRegisterType;
  /** Register address within the selected table. */
  registerAddress: number;
  /** Allowed operations for this register. */
  operation: ModbusOperation;
}

// ── Union of all possible protocol attributes ─────────────────────────────
export type ProtocolAttributes = ModbusTCPAttributes;

// ── Register dictionary entry ─────────────────────────────────────────────
export interface RegisterDictEntry {
  /** Unique identifier assigned by the backend. */
  id: number;
  /** Human-readable name for this register. */
  name: string;
  /** Protocol / access technology. */
  accessType: AccessType;
  /** Logical device identifier (e.g. "plc-1", "drive-2"). */
  accessDeviceId: string;
  /** Protocol-specific connection and addressing details. */
  protocolAttributes: ProtocolAttributes;
}
