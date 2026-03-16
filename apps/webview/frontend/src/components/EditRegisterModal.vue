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
                class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                :class="fieldClass('name')"
                placeholder="Register name"
                @blur="touch('name')"
              />
              <p v-if="touched.has('name') && errors.name" class="mt-1 text-xs text-red-500">
                {{ errors.name }}
              </p>
            </div>

            <!-- Device -->
            <div>
              <label class="block text-sm font-medium mb-1" :class="labelClass">Device</label>
              <select
                v-model.number="draft.deviceId"
                class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                :class="fieldClass('deviceId')"
                @change="touch('deviceId')"
                @blur="touch('deviceId')"
              >
                <option :value="0" disabled>- Select a device -</option>
                <option v-for="d in devicesStore.devices" :key="d.id" :value="d.id">{{ d.id }} - {{ d.name }}</option>
              </select>
              <p v-if="touched.has('deviceId') && errors.deviceId" class="mt-1 text-xs text-red-500">
                {{ errors.deviceId }}
              </p>
            </div>

            <hr :class="themeStore.isDark ? 'border-gray-700' : 'border-gray-200'" />

            <!-- ── Protocol attributes (shown once a device is selected) ─── -->
            <template v-if="selectedDevice">
              <p
                class="text-xs font-semibold uppercase tracking-wider"
                :class="themeStore.isDark ? 'text-gray-400' : 'text-gray-500'"
              >
                Protocol attributes
                <span
                  class="ml-1 px-1.5 py-0.5 rounded text-xs font-medium normal-case tracking-normal"
                  :class="themeStore.isDark ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-700'"
                >
                  {{ selectedDevice.protocol }}
                </span>
              </p>

              <!-- ── ModbusTCP ───────────────────────────────────────────── -->
              <template v-if="selectedDevice.protocol === 'ModbusTCP'">
                <!-- Slave address -->
                <div>
                  <label class="block text-sm font-medium mb-1" :class="labelClass">Slave address</label>
                  <input
                    v-model="modbusAttrs.slaveAddress"
                    type="text"
                    inputmode="numeric"
                    class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                    :class="fieldClass('slaveAddress')"
                    @blur="touch('slaveAddress')"
                  />
                  <p v-if="touched.has('slaveAddress') && errors.slaveAddress" class="mt-1 text-xs text-red-500">
                    {{ errors.slaveAddress }}
                  </p>
                </div>

                <!-- Register type -->
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

                <!-- Register address -->
                <div>
                  <label class="block text-sm font-medium mb-1" :class="labelClass">Register address</label>
                  <input
                    v-model="modbusAttrs.registerAddress"
                    type="text"
                    inputmode="numeric"
                    class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                    :class="fieldClass('registerAddress')"
                    @blur="touch('registerAddress')"
                  />
                  <p v-if="touched.has('registerAddress') && errors.registerAddress" class="mt-1 text-xs text-red-500">
                    {{ errors.registerAddress }}
                  </p>
                </div>

                <!-- Operation -->
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

                <!-- Value Type -->
                <div
                  v-if="
                    modbusAttrs.registerType === 'holding-register' || modbusAttrs.registerType === 'input-register'
                  "
                >
                  <label class="block text-sm font-medium mb-1" :class="labelClass">Value Type (16-bit)</label>
                  <select
                    v-model="modbusAttrs.valueType"
                    class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    :class="inputClass"
                  >
                    <option value="unsigned">Unsigned (0 to 65535)</option>
                    <option value="signed">Signed (-32768 to 32767)</option>
                  </select>
                </div>
              </template>
            </template>

            <!-- No device selected yet -->
            <p v-else class="text-sm text-center py-2" :class="themeStore.isDark ? 'text-gray-500' : 'text-gray-400'">
              Select a device to configure protocol attributes.
            </p>
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
import { useDevicesStore } from '../stores/devices';
import type {
  RegisterDictEntry,
  ModbusTCPAttributes,
  ModbusRegisterType,
  ModbusOperation,
  ModbusValueType,
} from '../types/register';

// ── Draft types ───────────────────────────────────────────────────────────────

interface DraftEntry {
  id: number;
  name: string;
  deviceId: number;
}

// Modbus attrs stored as strings for real validation, converted to numbers on submit
interface ModbusAttrsDraft {
  slaveAddress: string;
  registerType: ModbusRegisterType;
  registerAddress: string;
  operation: ModbusOperation;
  valueType: ModbusValueType;
}

// ── Props / emits ─────────────────────────────────────────────────────────────

const props = defineProps<{
  modelValue: boolean;
  /** `null` when creating a new entry. */
  entry: RegisterDictEntry | null;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void;
  (e: 'set', entry: RegisterDictEntry): void;
}>();

// ── State ─────────────────────────────────────────────────────────────────────

const themeStore = useThemeStore();
const devicesStore = useDevicesStore();

const isNew = computed(() => !props.entry);

const draft = ref<DraftEntry>(makeDraft());
const modbusAttrs = ref<ModbusAttrsDraft>(defaultModbus());
const touched = reactive(new Set<string>());

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeDraft(): DraftEntry {
  if (props.entry) {
    return { id: props.entry.id, name: props.entry.name, deviceId: props.entry.deviceId };
  }
  return { id: 0, name: '', deviceId: 0 };
}

function defaultModbus(): ModbusAttrsDraft {
  return {
    slaveAddress: '1',
    registerType: 'holding-register',
    registerAddress: '0',
    operation: 'RW',
    valueType: 'unsigned',
  };
}

function makeAttrs(): ModbusAttrsDraft {
  const src = props.entry?.protocolAttributes as ModbusTCPAttributes | undefined;
  if (!src) return defaultModbus();
  return {
    slaveAddress: String(src.slaveAddress),
    registerType: src.registerType,
    registerAddress: String(src.registerAddress),
    operation: src.operation,
    valueType: src.valueType ?? 'unsigned',
  };
}

// ── Watchers ──────────────────────────────────────────────────────────────────

watch(
  () => props.modelValue,
  async (open) => {
    if (open) {
      draft.value = makeDraft();
      modbusAttrs.value = makeAttrs();
      touched.clear();
      if (devicesStore.devices.length === 0) {
        await devicesStore.fetchDevices();
      }
    }
  }
);

// ── Derived ───────────────────────────────────────────────────────────────────

const selectedDevice = computed(() => devicesStore.devices.find((d) => d.id === draft.value.deviceId) ?? null);

// ── Validation ────────────────────────────────────────────────────────────────

const isValidInt = (val: string, min: number, max: number): boolean => {
  const s = val.trim();
  if (!/^-?\d+$/.test(s)) return false;
  const n = Number(s);
  return Number.isInteger(n) && n >= min && n <= max;
};

const errors = computed<Record<string, string>>(() => {
  const e: Record<string, string> = {};
  if (!draft.value.name.trim()) e.name = 'Name is required';
  if (!draft.value.deviceId) e.deviceId = 'Select a device';
  if (selectedDevice.value?.protocol === 'ModbusTCP') {
    if (!isValidInt(modbusAttrs.value.slaveAddress, 0, 247)) e.slaveAddress = 'Must be an integer between 0 and 247';
    if (!isValidInt(modbusAttrs.value.registerAddress, 0, 65535))
      e.registerAddress = 'Must be an integer between 0 and 65535';
  }
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

  const protocolAttributes: ModbusTCPAttributes = {
    slaveAddress: Number(modbusAttrs.value.slaveAddress),
    registerType: modbusAttrs.value.registerType,
    registerAddress: Number(modbusAttrs.value.registerAddress),
    operation: modbusAttrs.value.operation,
    valueType: modbusAttrs.value.valueType,
  };

  const entry: RegisterDictEntry = {
    id: draft.value.id,
    name: draft.value.name.trim(),
    deviceId: draft.value.deviceId,
    protocolAttributes,
  };

  emit('set', entry);
  emit('update:modelValue', false);
};
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
