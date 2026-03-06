<template>
  <Teleport to="body">
    <Transition name="edm-fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        @click.self="cancel"
      >
        <div
          class="w-full max-w-md rounded-xl shadow-2xl flex flex-col max-h-[90vh]"
          :class="themeStore.isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'"
        >
          <!-- Header -->
          <div class="flex items-center justify-between px-6 pt-6 pb-3 flex-shrink-0">
            <h2 class="text-lg font-semibold">{{ isNew ? 'Add Device' : 'Edit Device' }}</h2>
          </div>

          <!-- Scrollable form body -->
          <div class="overflow-y-auto px-6 pb-2 space-y-3 flex-1">
            <!-- Name -->
            <div>
              <label class="block text-sm font-medium mb-1" :class="labelClass">Name</label>
              <input
                v-model="draft.name"
                type="text"
                class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                :class="fieldClass('name')"
                placeholder="e.g. PLC-1"
                @blur="touch('name')"
              />
              <p v-if="touched.has('name') && errors.name" class="mt-1 text-xs text-red-500">
                {{ errors.name }}
              </p>
            </div>

            <!-- Protocol -->
            <div>
              <label class="block text-sm font-medium mb-1" :class="labelClass">Protocol</label>
              <select
                v-model="draft.protocol"
                class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                :class="inputClass"
              >
                <option value="ModbusTCP">ModbusTCP</option>
              </select>
            </div>

            <!-- IP address -->
            <div>
              <label class="block text-sm font-medium mb-1" :class="labelClass">IP address</label>
              <input
                v-model="draft.ip"
                type="text"
                inputmode="decimal"
                class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                :class="fieldClass('ip')"
                placeholder="192.168.1.1"
                @blur="touch('ip')"
              />
              <p v-if="touched.has('ip') && errors.ip" class="mt-1 text-xs text-red-500">
                {{ errors.ip }}
              </p>
            </div>

            <!-- Port -->
            <div>
              <label class="block text-sm font-medium mb-1" :class="labelClass">Port</label>
              <input
                v-model="draft.port"
                type="text"
                inputmode="numeric"
                class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                :class="fieldClass('port')"
                placeholder="502"
                @blur="touch('port')"
              />
              <p v-if="touched.has('port') && errors.port" class="mt-1 text-xs text-red-500">
                {{ errors.port }}
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div
            class="flex justify-end gap-2 px-6 py-4 border-t flex-shrink-0"
            :class="themeStore.isDark ? 'border-gray-700' : 'border-gray-200'"
          >
            <button
              type="button"
              class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              :class="
                themeStore.isDark
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              "
              @click="cancel"
            >
              Cancel
            </button>
            <button
              type="button"
              class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              :class="
                canSubmit
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-blue-400 text-white cursor-not-allowed opacity-60'
              "
              :disabled="!canSubmit"
              @click="handleSet"
            >
              {{ isNew ? 'Create' : 'Save' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import { useThemeStore } from '../stores/theme';
import type { Device, Protocol } from '../types/device';

// ── Draft type (port kept as string for free-form input with real validation) ─

interface DraftDevice {
  id: number;
  name: string;
  ip: string;
  port: string;
  protocol: Protocol;
}

// ── Props / emits ─────────────────────────────────────────────────────────────

const props = defineProps<{
  modelValue: boolean;
  device: Device | null;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void;
  (e: 'set', device: Device): void;
}>();

// ── State ─────────────────────────────────────────────────────────────────────

const themeStore = useThemeStore();
const isNew = computed(() => !props.device);
const draft = ref<DraftDevice>(makeDraft());
const touched = reactive(new Set<string>());

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeDraft(): DraftDevice {
  if (props.device) {
    return {
      id: props.device.id,
      name: props.device.name,
      ip: props.device.ip,
      port: String(props.device.port),
      protocol: props.device.protocol,
    };
  }
  return { id: 0, name: '', ip: '', port: '502', protocol: 'ModbusTCP' };
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      draft.value = makeDraft();
      touched.clear();
    }
  }
);

// ── Validation ────────────────────────────────────────────────────────────────

const isValidIp = (ip: string): boolean => {
  const parts = ip.trim().split('.');
  if (parts.length !== 4) return false;
  return parts.every((p) => /^\d+$/.test(p) && Number(p) >= 0 && Number(p) <= 255);
};

const isValidPort = (val: string): boolean => {
  const s = val.trim();
  if (!/^\d+$/.test(s)) return false;
  const n = Number(s);
  return Number.isInteger(n) && n >= 1 && n <= 65535;
};

const errors = computed<Record<string, string>>(() => {
  const e: Record<string, string> = {};
  if (!draft.value.name.trim()) e.name = 'Name is required';
  if (!isValidIp(draft.value.ip)) e.ip = 'Enter a valid IPv4 address (e.g. 192.168.1.1)';
  if (!isValidPort(draft.value.port)) e.port = 'Must be an integer between 1 and 65535';
  return e;
});

const canSubmit = computed(() => Object.keys(errors.value).length === 0);

// ── Style helpers ─────────────────────────────────────────────────────────────

const touch = (field: string) => touched.add(field);

const labelClass = computed(() => (themeStore.isDark ? 'text-gray-300' : 'text-gray-700'));
const inputClass = computed(() =>
  themeStore.isDark
    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
    : 'bg-white border-gray-300 text-gray-900'
);

const fieldClass = (field: string): string => {
  const hasError = !!errors.value[field];
  const base = themeStore.isDark ? 'bg-gray-700 text-white placeholder-gray-400' : 'bg-white text-gray-900';
  if (hasError) return `${base} border-red-500 focus:ring-red-500`;
  return `${base} ${themeStore.isDark ? 'border-gray-600' : 'border-gray-300'} focus:ring-blue-500`;
};

// ── Handlers ──────────────────────────────────────────────────────────────────

const cancel = () => emit('update:modelValue', false);

const handleSet = () => {
  if (!canSubmit.value) return;
  const device: Device = {
    id: draft.value.id,
    name: draft.value.name.trim(),
    ip: draft.value.ip.trim(),
    port: Number(draft.value.port),
    protocol: draft.value.protocol,
  };
  emit('set', device);
  emit('update:modelValue', false);
};
</script>

<style scoped>
.edm-fade-enter-active,
.edm-fade-leave-active {
  transition: opacity 0.15s ease;
}
.edm-fade-enter-from,
.edm-fade-leave-to {
  opacity: 0;
}
</style>
