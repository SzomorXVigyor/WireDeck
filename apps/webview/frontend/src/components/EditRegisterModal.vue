<template>
  <Teleport to="body">
    <Transition name="erm-fade">
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
            <h2 class="text-lg font-semibold">{{ isNew ? 'Create Register' : 'Edit Register' }}</h2>
          </div>

          <!-- Scrollable form body -->
          <div class="overflow-y-auto px-6 pb-2 space-y-3 flex-1">
            <!-- Name -->
            <div>
              <label class="block text-sm font-medium mb-1" :class="labelClass">Name</label>
              <input
                v-model="draft.name"
                type="text"
                class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                :class="inputClass"
                placeholder="Register name"
              />
            </div>

            <!-- Access type -->
            <div>
              <label class="block text-sm font-medium mb-1" :class="labelClass">Access type</label>
              <select
                v-model="draft.accessType"
                class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                :class="inputClass"
                @change="onAccessTypeChange"
              >
                <option value="ModbusTCP">ModbusTCP</option>
              </select>
            </div>

            <!-- Device ID -->
            <div>
              <label class="block text-sm font-medium mb-1" :class="labelClass">Device ID</label>
              <input
                v-model="draft.accessDeviceId"
                type="text"
                class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                :class="inputClass"
                placeholder="e.g. plc-1"
              />
            </div>

            <hr :class="themeStore.isDark ? 'border-gray-700' : 'border-gray-200'" />

            <!-- ── ModbusTCP Protocol Attributes ─────────────────────────── -->
            <template v-if="draft.accessType === 'ModbusTCP'">
              <p
                class="text-xs font-semibold uppercase tracking-wider"
                :class="themeStore.isDark ? 'text-gray-400' : 'text-gray-500'"
              >
                Protocol attributes
              </p>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-medium mb-1" :class="labelClass">IP address</label>
                  <input
                    v-model="modbusAttrs.ip"
                    type="text"
                    class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    :class="inputClass"
                    placeholder="192.168.1.1"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1" :class="labelClass">Port</label>
                  <input
                    v-model.number="modbusAttrs.port"
                    type="number"
                    min="1"
                    max="65535"
                    class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    :class="inputClass"
                    placeholder="502"
                  />
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium mb-1" :class="labelClass">Slave address</label>
                <input
                  v-model.number="modbusAttrs.slaveAddress"
                  type="number"
                  min="0"
                  max="247"
                  class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  :class="inputClass"
                />
              </div>

              <div>
                <label class="block text-sm font-medium mb-1" :class="labelClass">Register type</label>
                <select
                  v-model="modbusAttrs.registerType"
                  class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  :class="inputClass"
                >
                  <option value="coil">Coil</option>
                  <option value="discrete-input">Discrete input</option>
                  <option value="holding-register">Holding register</option>
                  <option value="input-register">Input register</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium mb-1" :class="labelClass">Register address</label>
                <input
                  v-model.number="modbusAttrs.registerAddress"
                  type="number"
                  min="0"
                  class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  :class="inputClass"
                />
              </div>

              <div>
                <label class="block text-sm font-medium mb-1" :class="labelClass">Operation</label>
                <select
                  v-model="modbusAttrs.operation"
                  class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  :class="inputClass"
                >
                  <option value="R">R - Read only</option>
                  <option value="W">W - Write only</option>
                  <option value="RW">RW - Read &amp; Write</option>
                </select>
              </div>
            </template>
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
              class="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
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
import { ref, computed, watch } from 'vue';
import { useThemeStore } from '../stores/theme';
import type { RegisterDictEntry, AccessType, ModbusTCPAttributes } from '../types/register';

// ── Types ───────────────────────────────────────────────────────────────────

interface DraftEntry {
  id: number;
  name: string;
  accessType: AccessType;
  accessDeviceId: string;
}

// ── Defaults ────────────────────────────────────────────────────────────────

const defaultModbus = (): ModbusTCPAttributes => ({
  ip: '',
  port: 502,
  slaveAddress: 1,
  registerType: 'holding-register',
  registerAddress: 0,
  operation: 'RW',
});

// ── Props / emits ───────────────────────────────────────────────────────────

const props = defineProps<{
  modelValue: boolean;
  /** `null` when creating a new entry. */
  entry: RegisterDictEntry | null;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void;
  (e: 'set', entry: RegisterDictEntry): void;
}>();

// ── State ───────────────────────────────────────────────────────────────────

const themeStore = useThemeStore();

const isNew = computed(() => !props.entry);

const draft = ref<DraftEntry>(makeDraft());
const modbusAttrs = ref<ModbusTCPAttributes>(defaultModbus());

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeDraft(): DraftEntry {
  if (props.entry) {
    return {
      id: props.entry.id,
      name: props.entry.name,
      accessType: props.entry.accessType,
      accessDeviceId: props.entry.accessDeviceId,
    };
  }
  return { id: 0, name: '', accessType: 'ModbusTCP', accessDeviceId: '' };
}

function makeAttrs(): ModbusTCPAttributes {
  if (props.entry?.accessType === 'ModbusTCP') {
    return { ...defaultModbus(), ...(props.entry.protocolAttributes as ModbusTCPAttributes) };
  }
  return defaultModbus();
}

// ── Watchers ─────────────────────────────────────────────────────────────────

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      draft.value = makeDraft();
      modbusAttrs.value = makeAttrs();
    }
  }
);

// ── Handlers ─────────────────────────────────────────────────────────────────

const onAccessTypeChange = () => {
  modbusAttrs.value = defaultModbus();
};

const cancel = () => emit('update:modelValue', false);

const handleSet = () => {
  const entry: RegisterDictEntry = {
    id: draft.value.id,
    name: draft.value.name,
    accessType: draft.value.accessType,
    accessDeviceId: draft.value.accessDeviceId,
    protocolAttributes: { ...modbusAttrs.value },
  };
  emit('set', entry);
  emit('update:modelValue', false);
};

// ── Style helpers ────────────────────────────────────────────────────────────

const labelClass = computed(() => (themeStore.isDark ? 'text-gray-300' : 'text-gray-700'));
const inputClass = computed(() =>
  themeStore.isDark
    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
    : 'bg-white border-gray-300 text-gray-900'
);
</script>

<style scoped>
.erm-fade-enter-active,
.erm-fade-leave-active {
  transition: opacity 0.15s ease;
}
.erm-fade-enter-from,
.erm-fade-leave-to {
  opacity: 0;
}
</style>
