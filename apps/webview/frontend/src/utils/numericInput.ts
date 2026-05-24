/**
 * Utilities for numeric text input handling.
 * Used by number_input card action modals.
 */

/**
 * Normalizes a raw text input string to a valid numeric string.
 *
 * - Replaces all "," with "." (European decimal separator -> JS decimal separator)
 * - In decimal mode: collapses multiple dots to the first one only
 * - In integer mode: strips all decimal points
 * - Strips any character that is not a digit, ".", or a leading "-"
 * - If canBeNegative is false, strips any "-" sign
 */
export function normalizeNumericInput(s: string, precision: number, canBeNegative: boolean): string {
  // Replace all commas with dots
  let result = s.replace(/,/g, '.');

  if (precision <= 0) {
    // Integer mode: keep only digits and leading minus
    result = result.replace(/[^0-9-]/g, '');
    // Minus only at position 0
    result = result.replace(/(?!^)-/g, '');
  } else {
    // Decimal mode: keep only the first dot
    const firstDot = result.indexOf('.');
    if (firstDot !== -1) {
      result = result.slice(0, firstDot + 1) + result.slice(firstDot + 1).replace(/\./g, '');
    }
    // Strip non-numeric characters (keep digits, dot, leading minus)
    result = result.replace(/[^0-9.-]/g, '');
    // Minus only at position 0
    result = result.replace(/(?!^)-/g, '');
  }

  // If negative values are not allowed, strip minus
  if (!canBeNegative) {
    result = result.replace(/-/g, '');
  }

  return result;
}

/**
 * Validates a parsed numeric value against type constraints.
 *
 * @param value        - The parsed numeric value to validate
 * @param canBeNegative - Whether negative values are allowed (signed mode)
 * @param canBeDecimal  - Whether decimal (non-integer) values are allowed
 * @param min          - Optional minimum allowed value (inclusive)
 * @param max          - Optional maximum allowed value (inclusive)
 * @returns An error message string if invalid, or null if valid
 */
export function validateNumericInput(
  value: number,
  canBeNegative: boolean,
  canBeDecimal: boolean,
  min?: number,
  max?: number
): string | null {
  if (isNaN(value)) return 'Invalid number';
  if (!canBeNegative && value < 0) return 'Value must be positive (\u2265 0)';
  if (!canBeDecimal && !Number.isInteger(value)) return 'Value must be a whole number';
  if (min !== undefined && value < min) return `Value must be ≥ ${min}`;
  if (max !== undefined && value > max) return `Value must be ≤ ${max}`;
  return null;
}
