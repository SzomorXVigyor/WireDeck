<template>
  <div class="space-y-2">
    <!-- Confirmed device rows -->
    <div
      v-for="(dev, idx) in modelValue"
      :key="idx"
      class="flex items-center gap-2 px-3 py-2 rounded-lg text-xs border"
      :class="dark ? 'border-gray-700 bg-gray-900/50 text-gray-300' : 'border-gray-200 bg-gray-50 text-gray-700'"
    >
      <span class="flex-1 font-mono truncate">{{ dev.name }}</span>
      <span class="font-mono text-[11px] opacity-75">{{ dev.ip }}:{{ dev.port ?? '—' }}</span>
      <button
        type="button"
        class="text-red-400 hover:text-red-300 transition-colors ml-1 shrink-0"
        title="Remove device"
        @click="removeDevice(idx)"
      >
        <XMarkIcon class="w-3.5 h-3.5" />
      </button>
    </div>

    <!-- Inline add row -->
    <div
      v-if="adding"
      class="flex flex-wrap items-start gap-2 px-3 py-2 rounded-lg border"
      :class="dark ? 'border-blue-700 bg-blue-900/20' : 'border-blue-300 bg-blue-50'"
    >
      <!-- Name -->
      <input
        v-model="draft.name"
        type="text"
        placeholder="Name"
        class="flex-1 min-w-[80px] rounded px-2 py-1 text-xs border outline-none focus:ring-1"
        :class="inputClass"
      />

      <!-- IP with validation -->
      <div class="flex-1 min-w-[110px] flex flex-col gap-0.5">
        <input
          v-model="draft.ip"
          type="text"
          placeholder="IP (e.g. 192.168.1.1)"
          class="w-full rounded px-2 py-1 text-xs border outline-none focus:ring-1"
          :class="[inputClass, draft.ip && !isValidIpv4(draft.ip) ? 'border-red-500 focus:ring-red-500' : '']"
        />
        <span v-if="draft.ip && !isValidIpv4(draft.ip)" class="text-[10px] text-red-400">Invalid IPv4 address</span>
      </div>

      <!-- Port as text with validation -->
      <div class="w-[88px] flex flex-col gap-0.5">
        <input
          v-model="draft.portStr"
          type="text"
          placeholder="Port"
          class="w-full rounded px-2 py-1 text-xs border outline-none focus:ring-1"
          :class="[inputClass, draft.portStr && !isValidPort(draft.portStr) ? 'border-red-500 focus:ring-red-500' : '']"
        />
        <span v-if="draft.portStr && !isValidPort(draft.portStr)" class="text-[10px] text-red-400">1-65535</span>
      </div>

      <!-- VNC password -->
      <input
        v-model="draft.password"
        type="password"
        placeholder="VNC Password"
        class="flex-1 min-w-[110px] rounded px-2 py-1 text-xs border outline-none focus:ring-1"
        :class="inputClass"
      />

      <button
        type="button"
        class="px-2 py-1 rounded text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        :disabled="!canConfirm"
        @click="confirmAdd"
      >
        Add
      </button>
      <button
        type="button"
        class="px-2 py-1 rounded text-xs font-medium transition-colors"
        :class="dark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'"
        @click="cancelAdd"
      >
        Cancel
      </button>
    </div>

    <!-- Add device button -->
    <button
      v-if="!adding"
      type="button"
      class="flex items-center gap-1.5 text-xs font-medium transition-colors"
      :class="dark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'"
      @click="startAdd"
    >
      <PlusIcon class="w-3.5 h-3.5" />
      Add device
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { PlusIcon, XMarkIcon } from '@heroicons/vue/24/outline';
import type { VncDevice } from '../types/module';

const DEFAULT_PORT = 5900;

const props = defineProps<{
  modelValue: VncDevice[];
  dark?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: VncDevice[]): void;
}>();

const inputClass = computed(() =>
  props.dark
    ? 'bg-gray-900 border-gray-700 text-white focus:ring-blue-500'
    : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-400'
);

// Draft uses string for port so we can validate without number coercion quirks
const adding = ref(false);
const draft = ref({ name: '', ip: '', portStr: String(DEFAULT_PORT), password: '' });

function isValidIpv4(val: string): boolean {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(val) && val.split('.').every((n) => Number(n) >= 0 && Number(n) <= 255);
}

function isValidPort(val: string): boolean {
  const n = Number(val);
  return /^\d+$/.test(val) && n >= 1 && n <= 65535;
}

const canConfirm = computed(
  () => draft.value.name.trim() !== '' && isValidIpv4(draft.value.ip) && isValidPort(draft.value.portStr)
);

function startAdd() {
  draft.value = { name: '', ip: '', portStr: String(DEFAULT_PORT), password: '' };
  adding.value = true;
}

function cancelAdd() {
  adding.value = false;
}

function confirmAdd() {
  if (!canConfirm.value) return;
  const entry: VncDevice = {
    name: draft.value.name.trim(),
    ip: draft.value.ip.trim(),
    port: Number(draft.value.portStr),
    ...(draft.value.password?.trim() ? { password: draft.value.password.trim() } : {}),
  };
  emit('update:modelValue', [...props.modelValue, entry]);
  adding.value = false;
}

function removeDevice(idx: number) {
  const next = [...props.modelValue];
  next.splice(idx, 1);
  emit('update:modelValue', next);
}
</script>
