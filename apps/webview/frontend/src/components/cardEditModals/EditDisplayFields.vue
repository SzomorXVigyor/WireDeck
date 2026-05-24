<template>
  <!-- REGISTER -->
  <section class="space-y-3">
    <SectionHeader label="Register" />
    <RegisterPicker v-model="localRegister" />
  </section>

  <!-- STYLE -->
  <section class="space-y-3">
    <SectionHeader label="Style" />
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
    </div>
  </section>

  <!-- EXTRA -->
  <section class="space-y-4">
    <SectionHeader label="Extra" />
    <!-- Pre / suffix -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium mb-1" :class="labelClass">Prefix</label>
        <input
          v-model="localExtra.prefix"
          type="text"
          class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          :class="inputClass"
          placeholder="e.g. ≈"
        />
      </div>
      <div>
        <label class="block text-sm font-medium mb-1" :class="labelClass">Unit</label>
        <input
          v-model="localExtra.unit"
          type="text"
          class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          :class="inputClass"
          placeholder="e.g. °C, V, %"
        />
      </div>
    </div>
    <!-- Numeric config -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
      <label class="flex items-start gap-2 pt-6 cursor-pointer select-none">
        <input v-model="localExtra.signed" type="checkbox" class="rounded mt-0.5" />
        <span class="text-sm" :class="labelClass">Signed (allow negative values)</span>
      </label>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { validateNumericInput } from '../../utils/numericInput';
import NumericInputField from '../shared/NumericInputField.vue';
import RegisterPicker from '../shared/RegisterPicker.vue';
import SectionHeader from '../shared/SectionHeader.vue';

type S = Record<string, unknown>;

const props = defineProps<{ style: S; extra: S; register: number; inputClass: string; labelClass: string }>();
const emit = defineEmits<{
  'update:style': [S];
  'update:extra': [S];
  'update:register': [number];
  'update:valid': [boolean];
}>();

const localStyle = reactive({ ...props.style });
const localExtra = reactive({ ...props.extra });
const localRegister = ref(props.register);

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
watch(
  () => props.register,
  (v) => {
    localRegister.value = v;
  }
);

watch(localStyle, () => emit('update:style', { ...localStyle }), { deep: true });
watch(localExtra, () => emit('update:extra', { ...localExtra }), { deep: true });
watch(localRegister, (v) => emit('update:register', v));

const multiplierHint = computed(() => {
  const p = Number(localExtra.precision ?? 0);
  return Math.pow(10, -p).toFixed(Math.max(0, p));
});

const numericPrecision = computed({
  get: () => (localExtra.precision ?? null) as number | null,
  set: (v: number | null) => {
    localExtra.precision = v;
  },
});

const formValid = computed(() => validateNumericInput(Number(localExtra.precision ?? 0), true, false, -5, 5) === null);
watch(formValid, (v) => emit('update:valid', v), { immediate: true });
</script>
