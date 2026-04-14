// ── Condition operator ─────────────────────────────────────────────────────
export type ConditionOperator = 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'neq';

// ── Notification dispatch mode ────────────────────────────────────────────
export type NotificationMode = 'immediate' | 'delayed';

// ── Notification entry ────────────────────────────────────────────────────
export interface NotificationEntry {
  /** Unique identifier assigned by the backend. */
  id: number;
  /** Human-readable name for this notification rule. */
  name: string;
  /** ID of the register to monitor (references RegisterDictEntry.id). */
  registerId: number;

  /* ── Condition ─────────────────────────────────────────────────────────── */
  /** Comparison operator applied to the register value. */
  operator: ConditionOperator;
  /** Threshold / comparison constant. */
  conditionValue: number;

  /* ── Notification mode ─────────────────────────────────────────────────── */
  /** Whether the email is sent immediately or after a delay. */
  mode: NotificationMode;
  /** Re-check delay in seconds (only used when mode === 'delayed'). */
  delaySeconds: number;

  /* ── Email content ─────────────────────────────────────────────────────── */
  /** Array of destination email addresses. */
  recipients: string[];
  /** Email subject line (supports template syntax). */
  subject: string;
  /** Email body (supports template syntax). */
  body: string;
}

// ── Display helpers ───────────────────────────────────────────────────────

/** Map operator code → mathematical symbol for table display. */
export const OPERATOR_SYMBOLS: Record<ConditionOperator, string> = {
  gt: '>',
  lt: '<',
  eq: '=',
  gte: '≥',
  lte: '≤',
  neq: '≠',
};

/** Map operator code → human-readable label for dropdown. */
export const OPERATOR_LABELS: Record<ConditionOperator, string> = {
  gt: 'Greater than (>)',
  lt: 'Less than (<)',
  eq: 'Equal (=)',
  gte: 'Greater than or equal (≥)',
  lte: 'Less than or equal (≤)',
  neq: 'Not equal (≠)',
};
