<template>
  <div class="space-y-1.5">
    <!-- Optional label -->
    <label
      v-if="label"
      class="block text-sm font-medium"
      :class="themeStore.isDark ? 'text-gray-300' : 'text-gray-700'"
    >
      {{ label }}
      <span v-if="unit" class="font-normal opacity-60">({{ unit }})</span>
    </label>

    <!-- Input -->
    <input
      ref="inputRef"
      v-model="inputRaw"
      type="text"
      inputmode="numeric"
      :placeholder="placeholder ?? ''"
      class="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition-colors"
      :class="[
        inputBorderClass,
        themeStore.isDark
          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500'
          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400',
      ]"
      @input="onInput"
      @keydown="onKeyDown"
      @keydown.enter.prevent="onEnter"
    />

    <!-- Validation error -->
    <p v-if="fieldTouched && validationError" class="text-xs text-red-500 flex items-center gap-1">
      <ExclamationCircleIcon class="w-3.5 h-3.5 flex-shrink-0" />
      {{ validationError }}
    </p>

    <!-- Min / Max hint -->
    <div
      v-if="min !== undefined || max !== undefined"
      class="flex gap-4 text-xs"
      :class="themeStore.isDark ? 'text-gray-500' : 'text-gray-400'"
    >
      <span v-if="min !== undefined">
        Min:
        <span class="font-medium tabular-nums" :class="themeStore.isDark ? 'text-gray-300' : 'text-gray-600'">
          {{ min }}
        </span>
      </span>
      <span v-if="max !== undefined">
        Max:
        <span class="font-medium tabular-nums" :class="themeStore.isDark ? 'text-gray-300' : 'text-gray-600'">
          {{ max }}
        </span>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useThemeStore } from '../../stores/theme';
import { normalizeNumericInput, validateNumericInput } from '../../utils/numericInput';
import { ExclamationCircleIcon } from '@heroicons/vue/24/outline';

// --- Props (constraints only) ---

const props = withDefaults(
  defineProps<{
    /** Decimal scaling exponent (10^-x). 0 = integer, 2 = two decimal places. */
    precision?: number;
    /** Allow negative values (signed mode). Blocks the minus key when false. */
    signed?: boolean;
    /** Minimum allowed value (inclusive, in display units). */
    min?: number;
    /** Maximum allowed value (inclusive, in display units). */
    max?: number;
    /** Input placeholder text. */
    placeholder?: string;
    /** Optional label rendered above the input. */
    label?: string;
    /** Unit appended to the label in parentheses, e.g. "°C". */
    unit?: string;
    /** Two-way value binding (in display units). When provided enables v-model. */
    modelValue?: number | null;
  }>(),
  {
    precision: 0,
    signed: false,
  }
);

// --- Emits ---

const emit = defineEmits<{
  /** Fired when Enter is pressed and the current value passes all validation. */
  (e: 'submit', value: number): void;
  (e: 'update:modelValue', value: number | null): void;
}>();

// --- Internal state ---

const themeStore = useThemeStore();
const inputRef = ref<HTMLInputElement | null>(null);
const inputRaw = ref<string>('');
const fieldTouched = ref(false);

// --- Derived ---

const _normalize = (s: string) => normalizeNumericInput(s, props.precision, props.signed);

const parsedValue = computed<number | null>(() => {
  const n = parseFloat(inputRaw.value);
  return isNaN(n) ? null : n;
});

const validationError = computed<string | null>(() => {
  const v = parsedValue.value;
  if (v === null) return null;
  return validateNumericInput(v, props.signed, props.precision > 0, props.min, props.max);
});

// Sync parsedValue -> parent (v-model out)
watch(parsedValue, (v) => {
  if (props.modelValue !== undefined && v !== props.modelValue) {
    emit('update:modelValue', v);
  }
});

// Sync parent -> inputRaw (v-model in) - show value as-is, no precision padding
watch(
  () => props.modelValue,
  (v) => {
    if (v === undefined) return;
    const raw = v !== null && !isNaN(Number(v)) ? String(Number(v)) : '';
    if (inputRaw.value !== raw) inputRaw.value = raw;
  },
  { immediate: true }
);

const isValid = computed<boolean>(() => parsedValue.value !== null && !validationError.value);

const inputBorderClass = computed(() =>
  fieldTouched.value && validationError.value ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'
);

// --- Handlers ---

/** Whitelist keydown guard - blocks invalid characters before insertion. */
const onKeyDown = (e: KeyboardEvent) => {
  if (
    e.ctrlKey ||
    e.metaKey ||
    e.key === 'Backspace' ||
    e.key === 'Delete' ||
    e.key === 'ArrowLeft' ||
    e.key === 'ArrowRight' ||
    e.key === 'ArrowUp' ||
    e.key === 'ArrowDown' ||
    e.key === 'Tab' ||
    e.key === 'Home' ||
    e.key === 'End' ||
    e.key === 'Enter'
  )
    return;

  if (e.key >= '0' && e.key <= '9') return;

  if (e.key === '-') {
    const el = e.target as HTMLInputElement;
    if (props.signed && el.selectionStart === 0 && !el.value.startsWith('-')) return;
    e.preventDefault();
    return;
  }

  if (e.key === '.' || e.key === ',') {
    if (props.precision > 0) return;
    e.preventDefault();
    return;
  }

  e.preventDefault();
};

/** Live input handler - normalises the string and restores cursor position. */
const onInput = (e: Event) => {
  fieldTouched.value = true;
  const el = e.target as HTMLInputElement;
  const pos = el.selectionStart ?? el.value.length;
  const original = el.value;
  const normalized = _normalize(original);

  inputRaw.value = normalized;

  if (normalized !== original) {
    el.value = normalized;
    const dotsRemovedBefore =
      (original.slice(0, pos).match(/\./g) ?? []).length -
      (normalized.slice(0, Math.min(pos, normalized.length)).match(/\./g) ?? []).length;
    el.setSelectionRange(Math.max(0, pos - dotsRemovedBefore), Math.max(0, pos - dotsRemovedBefore));
  }
};

/** Enter key handler - flushes DOM value, marks touched, emits submit if valid. */
const onEnter = () => {
  if (inputRef.value) inputRaw.value = _normalize(inputRef.value.value);
  fieldTouched.value = true;
  const v = parsedValue.value;
  if (v !== null && !validateNumericInput(v, props.signed, props.precision > 0, props.min, props.max)) {
    emit('submit', v);
  }
};

// --- Public API ---

defineExpose({
  /** Current parsed numeric value; null when input is empty or non-numeric. */
  parsedValue,
  /** True when parsedValue exists and passes all constraints. */
  isValid,
  /** Current validation error message, or null. */
  validationError,
  /** Reset input to a given string and clear touched state. */
  reset(str = '') {
    inputRaw.value = str;
    fieldTouched.value = false;
  },
  /** Mark the field as touched (reveals validation errors). */
  markTouched() {
    fieldTouched.value = true;
  },
  /** Flush and normalise the native DOM value (use before reading on mobile). */
  flush() {
    if (inputRef.value) inputRaw.value = _normalize(inputRef.value.value);
  },
  /** Focus the input element. */
  focus() {
    inputRef.value?.focus();
  },
  /** Select all text in the input. */
  select() {
    inputRef.value?.select();
  },
});
</script>
