// --- Primitives ---
export type CardType = 'button' | 'switch' | 'display' | 'number_input';
export type LayoutType = 'fill' | 'fixed';

// --- Style schemas — visual/presentation only ---

/** Style for `button` cards */
export interface ButtonStyle {
  /**
   * Colour variant applied to the button.
   * @default "primary"
   */
  color?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
  /**
   * Size variant.
   * @default "md"
   */
  size?: 'sm' | 'md' | 'lg';
}

/** Style for `switch` cards */
export interface SwitchStyle {
  /**
   * Colour of the active (ON) state indicator.
   * @default "green"
   */
  color?: 'green' | 'blue' | 'red' | 'yellow';
}

/** Style for `display` cards */
export interface DisplayStyle {
  /**
   * Text size applied to the displayed value.
   * @default "lg"
   */
  fontSize?: 'sm' | 'md' | 'lg' | 'xl';
}

/** Style for `number_input` cards */
export interface NumberInputStyle {
  /**
   * Text size applied to the displayed value.
   * @default "lg"
   */
  fontSize?: 'sm' | 'md' | 'lg' | 'xl';
}

// --- Extra schemas — data / behaviour ---

/** Extra behaviour config for `button` cards */
export interface ButtonExtra {
  /**
   * Override the button label text.
   * Falls back to `card.name` when omitted.
   */
  label?: string;
  /**
   * When `true` a confirmation dialog is shown before firing the register write.
   * @default false
   */
  confirmAction?: boolean;
}

/** Extra behaviour config for `switch` cards */
export interface SwitchExtra {
  /**
   * Label displayed alongside the toggle when state is ON.
   * @default "On"
   */
  onLabel?: string;
  /**
   * Label displayed alongside the toggle when state is OFF.
   * @default "Off"
   */
  offLabel?: string;
}

/** Extra behaviour config for `display` cards */
export interface DisplayExtra {
  /**
   * Decimal scaling exponent (10^-x).
   * precision = 0  → raw value is displayed as-is.
   * precision = 2  → raw 1000 displays as "10.00".
   * @default 0
   */
  precision?: number;
  /** Optional text prefix shown before the numeric value (e.g. `"≈"`). */
  prefix?: string;
  /** Physical / logical unit rendered after the value (e.g. `"°C"`, `"V"`, `"%"`). */
  unit?: string;
  /**
   * When true the value may be negative (signed register).
   * @default false
   */
  signed?: boolean;
}

/** Extra behaviour config for `number_input` cards */
export interface NumberInputExtra {
  /**
   * Decimal scaling exponent (10^-x) — same semantics as DisplayExtra.precision.
   * Step size is computed automatically as Math.pow(10, -precision).
   * @default 0
   */
  precision?: number;
  /** Optional text prefix shown before the numeric value (e.g. `"≈"`). */
  prefix?: string;
  /** Physical / logical unit rendered after the value (e.g. `"rpm"`, `"W"`). */
  unit?: string;
  /** Minimum allowed value (in display units). */
  min?: number;
  /** Maximum allowed value (in display units). */
  max?: number;
  /** Placeholder text shown inside the input when it is empty. */
  placeholder?: string;
  /**
   * When true the user may enter negative values (signed register).
   * When false (default) the minus key and negative values are blocked.
   * @default false
   */
  signed?: boolean;
}

// --- Card ---

export interface Card {
  /** Unique card identifier within the view. */
  id: number;
  /** Human-readable display name shown as the card title. */
  name: string;
  /** Widget type that determines how the card is rendered. */
  type: CardType;
  /** Render order (ascending). Cards with a lower `order` value appear first. */
  order: number;
  /** Device register ID used for reading / writing the card value. */
  register: number;
  /** Style configuration (visual/presentation). Schema is defined by `type`. */
  style: ButtonStyle | SwitchStyle | DisplayStyle | NumberInputStyle;
  /** Behaviour configuration (data / behaviour). Schema is defined by `type`. */
  extra: ButtonExtra | SwitchExtra | DisplayExtra | NumberInputExtra;
}

// --- Register data ---

/** A single register value entry as returned by `GET /api/view/:id/data`. */
export interface RegisterEntry {
  /** Register address (matches `Card.register`). */
  register: number;
  /** Current value stored in the register. */
  value: number;
}

// --- Layout ---

export interface Layout {
  /**
   * `fill`  - Cards stretch to fill the horizontal space of each row.
   *           Excess cards wrap to the next row.
   *
   * `fixed` - Each card occupies only its minimum intrinsic width.
   *           Excess cards wrap to the next row.
   */
  type: LayoutType;
}

// --- View ---

/** Lightweight view entry returned by `GET /api/views`. */
export interface ViewSummary {
  id: number;
  name: string;
}

/** Full view detail returned by `GET /api/view/:id`. */
export interface ViewDetail {
  id: number;
  name: string;
  layout: Layout;
  updateInterval: number;
  allowedUsernames: string[];
  components: Card[];
}
