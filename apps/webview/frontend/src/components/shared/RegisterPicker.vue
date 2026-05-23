<template>
  <!-- 30 / 70 two-column grid on sm+, stacked on mobile -->
  <div class="grid grid-cols-1 sm:grid-cols-[3fr_7fr] gap-3 items-start">
    <!-- Device filter -->
    <div>
      <label class="block text-sm font-medium mb-1" :class="labelClass">Device</label>
      <select
        v-model="selectedDeviceId"
        @change="onDeviceChange"
        class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        :class="baseInputClass"
      >
        <option :value="0">All</option>
        <option v-for="d in deviceOptions" :key="d.id" :value="d.id">{{ d.name }}</option>
      </select>
    </div>

    <!-- Register selector (filtered by device) -->
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
        <option v-if="filteredRegisters.length === 0" :value="-1" disabled>
          No registers{{ selectedDeviceId > 0 ? ' for this device' : '' }}
        </option>
        <option v-for="r in filteredRegisters" :key="r.id" :value="r.id">{{ r.id }} - {{ r.name }}</option>
      </select>
      <p v-if="showError" class="mt-1 text-xs text-red-500">A register must be selected</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useDevicesStore } from '../../stores/devices';
import { useRegistersStore } from '../../stores/registers';
import { useThemeStore } from '../../stores/theme';

const props = withDefaults(
  defineProps<{
    modelValue: number;
    label?: string;
  }>(),
  { label: 'Register' }
);
const emit = defineEmits<{ 'update:modelValue': [number] }>();

const themeStore = useThemeStore();
const registersStore = useRegistersStore();
const devicesStore = useDevicesStore();

// --- Selected device (internal filter state) ---
const selectedDeviceId = ref(0);
let isInternalClear = false;

onMounted(async () => {
  await Promise.all([
    registersStore.registers.length === 0 ? registersStore.fetchRegisters() : undefined,
    devicesStore.devices.length === 0 ? devicesStore.fetchDevices() : undefined,
  ]);

  // Initialize device filter from currently selected register after loading
  if (props.modelValue > 0) {
    const reg = registersStore.registers.find((r) => r.id === props.modelValue);
    if (reg) {
      selectedDeviceId.value = reg.deviceId;
    }
  }
});

// 1. Handle USER explicitly changing the Device dropdown
const onDeviceChange = () => {
  if (props.modelValue > 0 && selectedDeviceId.value > 0) {
    // Check if the current register still belongs to the newly selected device
    const reg = registersStore.registers.find((r) => r.id === props.modelValue);
    if (!reg || reg.deviceId !== selectedDeviceId.value) {
      isInternalClear = true; // Flag so the watcher knows WE caused the reset
      emit('update:modelValue', 0);
    }
  }
  // If selectedDeviceId === 0 ('All'), we leave the current register alone
};

// 2. Handle PARENT changing the register (form clear, prop update)
watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal <= 0) {
      if (isInternalClear) {
        // The register cleared because the user just changed the device dropdown.
        // Consume the flag, and leave the device dropdown exactly as they set it.
        isInternalClear = false;
      } else {
        // The parent component explicitly cleared the form from the outside.
        // Reset the device filter back to "All".
        selectedDeviceId.value = 0;
      }
    } else {
      // Parent provided a valid register ID. Sync the device dropdown to match it.
      const reg = registersStore.registers.find((r) => r.id === newVal);
      if (reg) {
        selectedDeviceId.value = reg.deviceId;
      }
    }
  }
);

// --- Options ---
const deviceOptions = computed(() => {
  const ids = new Set(registersStore.registers.map((r) => r.deviceId));
  return devicesStore.devices.filter((d) => ids.has(d.id));
});

const filteredRegisters = computed(() =>
  selectedDeviceId.value > 0
    ? registersStore.registers.filter((r) => r.deviceId === selectedDeviceId.value)
    : registersStore.registers
);

// --- Validation ---
const touched = ref(false);
const showError = computed(() => touched.value && props.modelValue <= 0);

const onChange = (e: Event) => {
  touched.value = true;
  emit('update:modelValue', Number((e.target as HTMLSelectElement).value));
};

// --- Styling ---
const labelClass = computed(() => (themeStore.isDark ? 'text-gray-300' : 'text-gray-700'));
const baseInputClass = computed(() =>
  themeStore.isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
);
const selectClass = computed(() => {
  const base = baseInputClass.value;
  return showError.value ? `${base} border-red-500 focus:ring-red-500` : `${base} focus:ring-blue-500`;
});

defineExpose({
  markTouched: () => {
    touched.value = true;
  },
});
</script>
