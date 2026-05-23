/**
 * Shared precision utilities for display and number_input card types.
 *
 * `precision` (10^-x):
 *   - precision = 0  -> raw value is the display value (no scaling)
 *   - precision = 2  -> raw value 1000 displays as 10.00
 *   - precision = -1 -> raw value 5 displays as 50
 *
 * `signed`:
 *   - false (default) -> raw register value is treated as unsigned 16-bit (0..65535)
 *   - true            -> raw register value is treated as signed 16-bit two's complement (-32768..32767)
 *                        e.g. raw 65535 decodes as -1, encoded -1 becomes 65535
 */

const UINT16_MAX = 65535;
const INT16_MAX = UINT16_MAX / 2;
const INT16_WRAP = UINT16_MAX + 1;

/**
 * Decode: raw register integer -> display float.
 * When signed=true, values above 32767 are reinterpreted as negative
 * (two's complement 16-bit).
 */
export function decodeValue(raw: number, precision: number, signed = false): number {
  let value = raw;
  if (signed && raw > INT16_MAX) {
    value = raw - INT16_WRAP; // e.g. 65535 -> -1
  }
  return value * Math.pow(10, -precision);
}

/**
 * Encode: display float -> raw register integer (for writing back).
 * When signed=true, negative results are wrapped as two's complement 16-bit.
 */
export function encodeValue(display: number, precision: number, signed = false): number {
  const raw = Math.round(display * Math.pow(10, precision));
  if (signed && raw < 0) {
    return raw + INT16_WRAP; // e.g. -1 -> 65535
  }
  return raw;
}

/** Format a raw register value as a display string with correct decimal places */
export function formatValue(raw: number, precision: number, signed = false): string {
  if (isNaN(raw)) return 'NaN';
  const decoded = decodeValue(raw, precision, signed);
  const places = Math.max(0, precision);
  return decoded.toFixed(places);
}

/** Step size for number inputs, derived from precision */
export function precisionStep(precision: number): number {
  return Math.pow(10, -Math.max(0, precision));
}
