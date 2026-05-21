import { RegisterCacheService } from '../../connection/register-cache.service';

// ---------------------------------------------------------------------------
// Injector contract
// ---------------------------------------------------------------------------

export type Injector = {
  /** Pattern to search for in the email body. */
  pattern: RegExp;
  /** Returns the replacement string. Receives the full match and capture groups. */
  resolve: (match: string, ...groups: string[]) => string;
};

// ---------------------------------------------------------------------------
// Numeric format helpers
// ---------------------------------------------------------------------------

/**
 * Apply optional numeric formatting to a raw 16-bit register value.
 *
 * Format spec – placed inside `[]` in the template:
 *
 *   u | s     Interpretation: unsigned uint16 (default) or signed int16.
 *   N | +N    Shift decimal point N places LEFT  -> divide by 10^N (result has N decimal digits).
 *   -N        Shift decimal point N places RIGHT -> multiply by 10^N (integer result).
 *
 * Combinations are allowed, sign flag first: [s3], [u-2], [3], [s].
 *
 * @param raw       Raw numeric value from the register / trigger (uint16, 0–65535).
 * @param signFlag  '' / 'u' = unsigned (default), 's' = signed int16 (two's complement).
 * @param shiftStr  Decimal shift string, e.g. '3', '+3', '-2'. Empty = no shift.
 */
function applyNumericFormat(raw: number, signFlag = '', shiftStr = ''): string {
  let value: number = raw;

  // Two's-complement reinterpretation as int16
  if (signFlag === 's' && value > 32767) {
    value -= 65536;
  }

  const shift = shiftStr ? parseInt(shiftStr, 10) : 0;

  if (shift > 0) {
    // LEFT: 12345 with shift=3 -> "12.345"
    return (value / Math.pow(10, shift)).toFixed(shift);
  }
  if (shift < 0) {
    // RIGHT: 12 with shift=-3 -> "12000"
    return String(Math.round(value * Math.pow(10, -shift)));
  }

  return String(value);
}

// ---------------------------------------------------------------------------
// Date / time formatting helpers
// ---------------------------------------------------------------------------

const pad = (n: number): string => String(n).padStart(2, '0');

/** `hh-mm-ss` */
const formatTime1 = (d: Date): string =>
  `${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;

/** `hh. mm. ss.` */
const formatTime2 = (d: Date): string =>
  `${pad(d.getHours())}. ${pad(d.getMinutes())}. ${pad(d.getSeconds())}.`;

/** `yyyy-MM-dd` */
const formatDate1 = (d: Date): string =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** `yyyy. MM. dd.` */
const formatDate2 = (d: Date): string =>
  `${d.getFullYear()}. ${pad(d.getMonth() + 1)}. ${pad(d.getDate())}.`;

// ---------------------------------------------------------------------------
// Injector factories
// ---------------------------------------------------------------------------

/**
 * `#REG:<id>` / `#REG:<id>[fmt]`
 *
 * Replaced by the cached value of register `<id>` with optional format spec.
 * **Must be registered before `makeTriggerValueInjector`** to prevent the plain
 * `#REG` pattern from consuming the `#REG:` prefix first.
 *
 * Format spec inside `[]` (all parts optional):
 * ```
 *   u | s        unsigned uint16 (default) or signed int16
 *   N | +N       shift decimal N places LEFT  (N ∈ 1–9, result has N decimal digits)
 *   -N           shift decimal N places RIGHT (N ∈ 1–9, integer result)
 * ```
 * Examples: `#REG:5`, `#REG:5[s]`, `#REG:5[3]`, `#REG:5[s3]`, `#REG:5[u-2]`
 */
export function makeRegisterRefInjector(cache: RegisterCacheService): Injector {
  return {
    // Capture groups: (id, signFlag?, shiftStr?)
    pattern: /#REG:(\d+)(?:\[([su]?)([+-]?\d)?\])?/g,
    resolve: (_match, id, signFlag = '', shiftStr = '') =>
      applyNumericFormat(cache.get(parseInt(id, 10)), signFlag, shiftStr),
  };
}

/**
 * `#REG` / `#REG[fmt]`
 *
 * Replaced by the value that triggered the notification, with an optional
 * format spec. See `makeRegisterRefInjector` for valid format syntax.
 *
 * Examples: `#REG`, `#REG[s]`, `#REG[3]`, `#REG[s3]`, `#REG[u-2]`
 */
export function makeTriggerValueInjector(triggerValue: number): Injector {
  return {
    // Capture groups: (signFlag?, shiftStr?)
    pattern: /#REG(?:\[([su]?)([+-]?\d)?\])?/g,
    resolve: (_match, signFlag = '', shiftStr = '') =>
      applyNumericFormat(triggerValue, signFlag, shiftStr),
  };
}

/**
 * `#TIME2` -> `hh. mm. ss.`
 *
 * **Must be registered before `makeTime1Injector`** to prevent the
 * `#TIME` sub-pattern from consuming the prefix of `#TIME2`.
 */
export function makeTime2Injector(): Injector {
  return {
    pattern: /#TIME2/g,
    resolve: () => formatTime2(new Date()),
  };
}

/**
 * `#TIME` / `#TIME1` -> `hh-mm-ss`
 *
 * The negative lookahead `(?!\d)` ensures `#TIME2` (already replaced) is
 * never partially matched here even if ordering changes.
 */
export function makeTime1Injector(): Injector {
  return {
    pattern: /#TIME1?(?!\d)/g,
    resolve: () => formatTime1(new Date()),
  };
}

/**
 * `#DATE2` -> `yyyy. MM. dd.`
 *
 * **Must be registered before `makeDate1Injector`.**
 */
export function makeDate2Injector(): Injector {
  return {
    pattern: /#DATE2/g,
    resolve: () => formatDate2(new Date()),
  };
}

/**
 * `#DATE` / `#DATE1` -> `yyyy-MM-dd`
 *
 * The negative lookahead `(?!\d)` ensures `#DATE2` is never partially matched.
 */
export function makeDate1Injector(): Injector {
  return {
    pattern: /#DATE1?(?!\d)/g,
    resolve: () => formatDate1(new Date()),
  };
}
