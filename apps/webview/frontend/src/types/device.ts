// ── Protocol types ─────────────────────────────────────────────────────────
export type Protocol = 'ModbusTCP';

// ── Device entry ───────────────────────────────────────────────────────────
export interface Device {
  /** Unique identifier assigned by the backend. */
  id: number;
  /** Human-readable device name. */
  name: string;
  /** Device IP address (IPv4). */
  ip: string;
  /** TCP port for device communication (1–65535). */
  port: number;
  /** Communication protocol used by this device. */
  protocol: Protocol;
}
