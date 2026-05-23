<template>
  <div>
    <label class="block text-sm font-medium mb-1" :class="labelClass">{{ label }}</label>
    <select
      :value="modelValue"
      class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
      :class="selectClass"
      @blur="touched = true"
      @change="onChange"
    >
      <option :value="0" disabled>- Select a register -</option>
      <option v-if="options.length === 0" :value="-1" disabled>No registers defined</option>
      <option v-for="r in options" :key="r.id" :value="r.id">{{ r.id }} - {{ r.name }}</option>
    </select>
    <p v-if="showError" class="mt-1 text-xs text-red-500">A register must be selected</p>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useThemeStore } from '../../stores/theme';
import { useRegistersStore } from '../../stores/registers';

const props = withDefaults(
  defineProps<{
    modelValue: number;
    /** Label shown above the select. Defaults to "Register". */
    label?: string;
  }>(),
  { label: 'Register' }
);
const emit = defineEmits<{ 'update:modelValue': [number] }>();

const themeStore = useThemeStore();
const registersStore = useRegistersStore();

onMounted(async () => {
  if (registersStore.registers.length === 0) {
    await registersStore.fetchRegisters();
  }
});

const options = computed(() => registersStore.registers);
const touched = ref(false);
const showError = computed(() => touched.value && props.modelValue <= 0);

const onChange = (e: Event) => {
  touched.value = true;
  emit('update:modelValue', Number((e.target as HTMLSelectElement).value));
};

const labelClass = computed(() => (themeStore.isDark ? 'text-gray-300' : 'text-gray-700'));
const selectClass = computed(() => {
  const base = themeStore.isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900';
  return showError.value ? `${base} border-red-500 focus:ring-red-500` : `${base} focus:ring-blue-500`;
});

/** Allow parent to force-show the error (e.g. on failed submit). */
defineExpose({
  markTouched: () => {
    touched.value = true;
  },
});
</script>
