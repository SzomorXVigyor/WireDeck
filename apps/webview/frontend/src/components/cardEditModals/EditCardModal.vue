<template>
  <Teleport to="body">
    <Transition name="ecm-fade">
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
            <h2 class="text-lg font-semibold">{{ isNew ? 'Add Card' : 'Edit Card' }}</h2>
            <button
              v-if="!isNew"
              class="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
              @click="handleDelete"
            >
              Delete
            </button>
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
                placeholder="Card name"
              />
            </div>

            <!-- Type -->
            <div>
              <label class="block text-sm font-medium mb-1" :class="labelClass">Type</label>
              <select
                v-model="draft.type"
                class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                :class="inputClass"
                @change="onTypeChange"
              >
                <option value="button">Button</option>
                <option value="switch">Switch</option>
                <option value="display">Display</option>
                <option value="number_input">Number Input</option>
              </select>
            </div>

            <!-- Register -->
            <div>
              <label class="block text-sm font-medium mb-1" :class="labelClass">Register</label>
              <select
                v-model.number="draft.register"
                class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                :class="registerSelectClass"
                @blur="registerTouched = true"
                @change="registerTouched = true"
              >
                <option :value="0" disabled>- Select a register -</option>
                <option v-if="registerOptions.length === 0" :value="-1" disabled>No registers defined</option>
                <option v-for="r in registerOptions" :key="r.id" :value="r.id">{{ r.id }} - {{ r.name }}</option>
              </select>
              <p v-if="registerError" class="mt-1 text-xs text-red-500">A register must be selected</p>
            </div>

            <hr :class="themeStore.isDark ? 'border-gray-700' : 'border-gray-200'" />

            <!-- Type-specific fields -->
            <EditButtonFields
              v-if="draft.type === 'button'"
              v-model:style="draft.style"
              v-model:extra="draft.extra"
              :input-class="inputClass"
              :label-class="labelClass"
            />
            <EditSwitchFields
              v-else-if="draft.type === 'switch'"
              v-model:style="draft.style"
              v-model:extra="draft.extra"
              :input-class="inputClass"
              :label-class="labelClass"
            />
            <EditDisplayFields
              v-else-if="draft.type === 'display'"
              v-model:style="draft.style"
              v-model:extra="draft.extra"
              :input-class="inputClass"
              :label-class="labelClass"
              @update:valid="fieldValid = $event"
            />
            <EditNumberInputFields
              v-else-if="draft.type === 'number_input'"
              v-model:style="draft.style"
              v-model:extra="draft.extra"
              :input-class="inputClass"
              :label-class="labelClass"
              @update:valid="fieldValid = $event"
            />
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
              Set
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useThemeStore } from '../../stores/theme';
import { useRegistersStore } from '../../stores/registers';
import { validateNumericInput } from '../../utils/numericInput';
import type { Card, CardType } from '../../types/view';
import EditButtonFields from './EditButtonFields.vue';
import EditSwitchFields from './EditSwitchFields.vue';
import EditDisplayFields from './EditDisplayFields.vue';
import EditNumberInputFields from './EditNumberInputFields.vue';

type DraftFields = Record<string, unknown>;

interface DraftCard {
  id: number;
  name: string;
  type: CardType;
  order: number;
  register: number;
  style: DraftFields;
  extra: DraftFields;
}

const TYPE_DEFAULTS: Record<CardType, { style: DraftFields; extra: DraftFields }> = {
  button: { style: { color: 'primary', size: 'md' }, extra: { label: '', confirmAction: false } },
  switch: { style: { color: 'green' }, extra: { onLabel: 'ON', offLabel: 'OFF' } },
  display: { style: { fontSize: 'lg' }, extra: { unit: '', prefix: '', precision: 0, signed: false } },
  number_input: {
    style: { fontSize: 'lg' },
    extra: { unit: '', prefix: '', precision: 0, min: 0, max: 100, placeholder: '', signed: false },
  },
};

const props = defineProps<{
  modelValue: boolean;
  card: Card | null;
  defaultOrder?: number;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void;
  (e: 'set', card: Card): void;
  (e: 'delete', cardId: number): void;
}>();

const themeStore = useThemeStore();
const registersStore = useRegistersStore();

const registerOptions = computed(() => registersStore.registers);
const isNew = computed(() => !props.card);
const draft = ref<DraftCard>(makeDraft());

function makeDraft(): DraftCard {
  if (props.card) {
    const d = JSON.parse(
      JSON.stringify({
        id: props.card.id,
        name: props.card.name,
        type: props.card.type,
        order: props.card.order,
        register: props.card.register,
        style: props.card.style,
        extra: props.card.extra,
      })
    );
    // Ensure precision exists for both display and number_input
    if ((d.type === 'display' || d.type === 'number_input') && d.extra.precision == null) {
      d.extra.precision = 0;
    }
    return d;
  }
  const type: CardType = 'display';
  const defaults = TYPE_DEFAULTS[type];
  return {
    id: 0,
    name: 'New Card',
    type,
    order: props.defaultOrder ?? 1,
    register: 0,
    style: { ...defaults.style },
    extra: { ...defaults.extra },
  };
}

watch(
  () => props.modelValue,
  async (open) => {
    if (open) {
      draft.value = makeDraft();
      registerTouched.value = false;
      if (registersStore.registers.length === 0) {
        await registersStore.fetchRegisters();
      }
    }
  }
);

watch(
  () => draft.value.register,
  () => {
    registerTouched.value = true;
  }
);

const onTypeChange = () => {
  const defaults = TYPE_DEFAULTS[draft.value.type];
  draft.value.style = { ...defaults.style };
  draft.value.extra = { ...defaults.extra };
};

const canSubmit = computed(() => draft.value.register > 0 && fieldValid.value);
const registerTouched = ref(false);

/** True when all numeric extra fields in the current draft pass their constraints. */
const fieldValid = computed(() => {
  const type = draft.value.type;
  if (type !== 'display' && type !== 'number_input') return true;

  const p = Number(draft.value.extra.precision ?? 0);
  if (validateNumericInput(p, true, false, -5, 5)) return false;

  if (type === 'number_input') {
    const s = Boolean(draft.value.extra.signed ?? false);
    const f = Math.pow(10, -p);
    const lo = s ? -32768 * f : 0;
    const hi = s ? 32767 * f : 65535 * f;
    const min = draft.value.extra.min;
    if (min !== null && min !== undefined && validateNumericInput(Number(min), s, p > 0, lo, hi)) return false;
    const max = draft.value.extra.max;
    if (max !== null && max !== undefined && validateNumericInput(Number(max), s, p > 0, lo, hi)) return false;
  }

  return true;
});
const registerError = computed(() => registerTouched.value && draft.value.register <= 0);

const registerSelectClass = computed(() => {
  const base = themeStore.isDark
    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
    : 'bg-white border-gray-300 text-gray-900';
  if (registerError.value) return `${base} border-red-500 focus:ring-red-500`;
  return `${base} focus:ring-blue-500`;
});

const cancel = () => emit('update:modelValue', false);

const handleSet = () => {
  if (!canSubmit.value) {
    registerTouched.value = true;
    return;
  }
  const card: Card = {
    id: draft.value.id === 0 ? Date.now() : draft.value.id,
    name: draft.value.name,
    type: draft.value.type,
    order: draft.value.order,
    register: draft.value.register,
    style: draft.value.style as Card['style'],
    extra: draft.value.extra as Card['extra'],
  };
  emit('set', card);
  emit('update:modelValue', false);
};

const handleDelete = () => {
  emit('delete', draft.value.id);
  emit('update:modelValue', false);
};

const labelClass = computed(() => (themeStore.isDark ? 'text-gray-300' : 'text-gray-700'));
const inputClass = computed(() =>
  themeStore.isDark
    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
    : 'bg-white border-gray-300 text-gray-900'
);
</script>

<style scoped>
.ecm-fade-enter-active,
.ecm-fade-leave-active {
  transition: opacity 0.15s ease;
}
.ecm-fade-enter-from,
.ecm-fade-leave-to {
  opacity: 0;
}
</style>
