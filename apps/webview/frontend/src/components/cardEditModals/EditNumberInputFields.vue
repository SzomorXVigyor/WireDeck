<template>
  <div>
    <!-- Font size -->
    <div>
      <label class="block text-sm font-medium mb-1" :class="labelClass">Value font size</label>
      <select
        v-model="localStyle.fontSize"
        class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        :class="inputClass"
      >
        <option value="sm">Small</option>
        <option value="md">Medium</option>
        <option value="lg">Large</option>
        <option value="xl">Extra large</option>
      </select>
    </div>

    <!-- Unit -->
    <div>
      <label class="block text-sm font-medium mb-1" :class="labelClass">Unit (shown after value)</label>
      <input
        v-model="localExtra.unit"
        type="text"
        class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        :class="inputClass"
        placeholder="e.g. rpm, W"
      />
    </div>

    <!-- Prefix -->
    <div>
      <label class="block text-sm font-medium mb-1" :class="labelClass">Prefix (shown before value)</label>
      <input
        v-model="localExtra.prefix"
        type="text"
        class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        :class="inputClass"
        placeholder="e.g. ≈"
      />
    </div>

    <!-- Precision -->
    <div>
      <NumericInputField
        v-model="numericPrecision"
        label="Decimal places (10⁻ˣ)"
        :precision="0"
        :signed="true"
        :min="-5"
        :max="5"
      />
      <p class="mt-1 text-xs opacity-60" :class="labelClass">Value multiplied by {{ multiplierHint }}</p>
    </div>

    <!-- Min -->
    <NumericInputField
      ref="minFieldRef"
      v-model="numericMin"
      label="Minimum value"
      :precision="precision"
      :signed="signed"
      :min="absMin"
      :max="absMax"
    />

    <!-- Max -->
    <NumericInputField
      ref="maxFieldRef"
      v-model="numericMax"
      label="Maximum value"
      :precision="precision"
      :signed="signed"
      :min="absMin"
      :max="absMax"
    />

    <!-- Placeholder -->
    <div>
      <label class="block text-sm font-medium mb-1" :class="labelClass">Placeholder text</label>
      <input
        v-model="localExtra.placeholder"
        type="text"
        class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        :class="inputClass"
      />
    </div>

    <!-- Signed -->
    <label class="flex items-center gap-2 cursor-pointer select-none">
      <input v-model="localExtra.signed" type="checkbox" class="rounded" />
      <span class="text-sm" :class="labelClass">Signed (allow negative values)</span>
    </label>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { validateNumericInput } from '../../utils/numericInput';
import NumericInputField from '../shared/NumericInputField.vue';

type S = Record<string, unknown>;

const props = defineProps<{ style: S; extra: S; inputClass: string; labelClass: string }>();
const emit = defineEmits<{ 'update:style': [S]; 'update:extra': [S]; 'update:valid': [boolean] }>();

const localStyle = reactive({ ...props.style });
const localExtra = reactive({ ...props.extra });

watch(
  () => props.style,
  (s) => Object.assign(localStyle, s),
  { deep: true }
);
watch(
  () => props.extra,
  (e) => Object.assign(localExtra, e),
  { deep: true }
);
watch(localStyle, () => emit('update:style', { ...localStyle }), { deep: true });
watch(localExtra, () => emit('update:extra', { ...localExtra }), { deep: true });

const precision = computed(() => Number(localExtra.precision ?? 0));
const signed = computed(() => Boolean(localExtra.signed ?? false));

// Typed computed wrappers for NumericInputField v-model (unknown -> number | null)
const numericPrecision = computed({
  get: () => (localExtra.precision ?? null) as number | null,
  set: (v: number | null) => {
    localExtra.precision = v;
  },
});
const numericMin = computed({
  get: () => (localExtra.min ?? null) as number | null,
  set: (v: number | null) => {
    localExtra.min = v;
  },
});
const numericMax = computed({
  get: () => (localExtra.max ?? null) as number | null,
  set: (v: number | null) => {
    localExtra.max = v;
  },
});

const multiplierHint = computed(() => {
  const p = precision.value;
  return Math.pow(10, -p).toFixed(Math.max(0, p));
});

const absMin = computed(() => (signed.value ? -32768 : 0) * Math.pow(10, -precision.value));
const absMax = computed(() => (signed.value ? 32767 : 65535) * Math.pow(10, -precision.value));

const formValid = computed(() => {
  const p = precision.value;
  const s = signed.value;
  if (validateNumericInput(p, true, false, -5, 5)) return false;
  const min = localExtra.min;
  if (min !== null && min !== undefined && validateNumericInput(Number(min), s, p > 0, absMin.value, absMax.value))
    return false;
  const max = localExtra.max;
  if (max !== null && max !== undefined && validateNumericInput(Number(max), s, p > 0, absMin.value, absMax.value))
    return false;
  return true;
});
watch(formValid, (v) => emit('update:valid', v), { immediate: true });

const minFieldRef = ref<InstanceType<typeof NumericInputField> | null>(null);
const maxFieldRef = ref<InstanceType<typeof NumericInputField> | null>(null);
watch(
  () => localExtra.signed,
  () => {
    minFieldRef.value?.markTouched();
    maxFieldRef.value?.markTouched();
  }
);
</script>
