// ── ModbusTCP protocol attributes ─────────────────────────────────────────
// Note: IP and port live on the Device entry, not here.
export type ModbusRegisterType = 'coil' | 'discrete-input' | 'holding-register' | 'input-register';
export type ModbusOperation = 'R' | 'W' | 'RW';
export type ModbusValueType = 'unsigned' | 'signed';

export interface ModbusTCPAttributes {
  /** Modbus slave / unit address (0-247). */
  slaveAddress: number;
  /** Modbus register table. */
  registerType: ModbusRegisterType;
  /** Register address within the selected table. */
  registerAddress: number;
  /** Allowed operations for this register. */
  operation: ModbusOperation;
  /** Value interpretation type (16-bit). */
  valueType?: ModbusValueType;
}

// ── Union of all possible protocol attributes ─────────────────────────────
export type ProtocolAttributes = ModbusTCPAttributes;

// ── Register dictionary entry ─────────────────────────────────────────────
export interface RegisterDictEntry {
  /** Unique identifier assigned by the backend. */
  id: number;
  /** Human-readable name for this register. */
  name: string;
  /** ID of the device this register belongs to (references Device.id). */
  deviceId: number;
  /** Protocol-specific addressing details (protocol determined by the device). */
  protocolAttributes: ProtocolAttributes;
}
