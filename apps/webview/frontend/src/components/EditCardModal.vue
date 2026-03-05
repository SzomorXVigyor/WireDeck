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
                <option value="number-input">Number Input</option>
              </select>
            </div>

            <!-- Register -->
            <div>
              <label class="block text-sm font-medium mb-1" :class="labelClass">Register address</label>
              <input
                v-model.number="draft.register"
                type="number"
                min="1"
                class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                :class="inputClass"
              />
            </div>

            <!-- Order -->
            <div>
              <label class="block text-sm font-medium mb-1" :class="labelClass">Display order</label>
              <input
                v-model.number="draft.order"
                type="number"
                min="1"
                class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                :class="inputClass"
              />
            </div>

            <hr :class="themeStore.isDark ? 'border-gray-700' : 'border-gray-200'" />

            <!-- ── BUTTON ────────────────────────────────────────────── -->
            <template v-if="draft.type === 'button'">
              <div>
                <label class="block text-sm font-medium mb-1" :class="labelClass">Button label</label>
                <input
                  v-model="draft.extra.label"
                  type="text"
                  class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  :class="inputClass"
                  placeholder="Leave empty to use card name"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1" :class="labelClass">Color</label>
                <select
                  v-model="draft.style.color"
                  class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  :class="inputClass"
                >
                  <option value="primary">Primary (blue)</option>
                  <option value="secondary">Secondary (gray)</option>
                  <option value="danger">Danger (red)</option>
                  <option value="success">Success (green)</option>
                  <option value="warning">Warning (yellow)</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium mb-1" :class="labelClass">Size</label>
                <select
                  v-model="draft.style.size"
                  class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  :class="inputClass"
                >
                  <option value="sm">Small</option>
                  <option value="md">Medium</option>
                  <option value="lg">Large</option>
                </select>
              </div>
              <label class="flex items-center gap-2 cursor-pointer select-none">
                <input v-model="draft.extra.confirmAction" type="checkbox" class="rounded" />
                <span class="text-sm" :class="labelClass">Require confirmation before firing</span>
              </label>
            </template>

            <!-- ── SWITCH ────────────────────────────────────────────── -->
            <template v-else-if="draft.type === 'switch'">
              <div>
                <label class="block text-sm font-medium mb-1" :class="labelClass">Active color</label>
                <select
                  v-model="draft.style.color"
                  class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  :class="inputClass"
                >
                  <option value="green">Green</option>
                  <option value="blue">Blue</option>
                  <option value="red">Red</option>
                  <option value="yellow">Yellow</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium mb-1" :class="labelClass">ON label</label>
                <input
                  v-model="draft.extra.onLabel"
                  type="text"
                  class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  :class="inputClass"
                  placeholder="ON"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1" :class="labelClass">OFF label</label>
                <input
                  v-model="draft.extra.offLabel"
                  type="text"
                  class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  :class="inputClass"
                  placeholder="OFF"
                />
              </div>
            </template>

            <!-- ── DISPLAY ───────────────────────────────────────────── -->
            <template v-else-if="draft.type === 'display'">
              <div>
                <label class="block text-sm font-medium mb-1" :class="labelClass">Value font size</label>
                <select
                  v-model="draft.style.fontSize"
                  class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  :class="inputClass"
                >
                  <option value="sm">Small</option>
                  <option value="md">Medium</option>
                  <option value="lg">Large</option>
                  <option value="xl">Extra large</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium mb-1" :class="labelClass">Unit (shown after value)</label>
                <input
                  v-model="draft.style.unit"
                  type="text"
                  class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  :class="inputClass"
                  placeholder="e.g. °C, V, %"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1" :class="labelClass">Prefix (shown before value)</label>
                <input
                  v-model="draft.extra.prefix"
                  type="text"
                  class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  :class="inputClass"
                  placeholder="e.g. ≈"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1" :class="labelClass">Decimal places</label>
                <input
                  v-model.number="draft.extra.precision"
                  type="number"
                  min="0"
                  max="10"
                  class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  :class="inputClass"
                />
              </div>
            </template>

            <!-- ── NUMBER INPUT ──────────────────────────────────────── -->
            <template v-else-if="draft.type === 'number-input'">
              <div>
                <label class="block text-sm font-medium mb-1" :class="labelClass">Unit label</label>
                <input
                  v-model="draft.style.unit"
                  type="text"
                  class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  :class="inputClass"
                  placeholder="e.g. rpm, W"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1" :class="labelClass">Minimum value</label>
                <input
                  v-model.number="draft.style.min"
                  type="number"
                  class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  :class="inputClass"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1" :class="labelClass">Maximum value</label>
                <input
                  v-model.number="draft.style.max"
                  type="number"
                  class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  :class="inputClass"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1" :class="labelClass">Step</label>
                <input
                  v-model.number="draft.extra.step"
                  type="number"
                  min="0.001"
                  step="any"
                  class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  :class="inputClass"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1" :class="labelClass">Placeholder text</label>
                <input
                  v-model="draft.extra.placeholder"
                  type="text"
                  class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  :class="inputClass"
                />
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
import { useThemeStore } from '../stores/theme';
import type { Card, CardType } from '../types/view';

interface DraftCard {
  id: number;
  name: string;
  type: CardType;
  order: number;
  register: number;
  style: Record<string, any>;
  extra: Record<string, any>;
}

const TYPE_DEFAULTS: Record<CardType, { style: Record<string, any>; extra: Record<string, any> }> = {
  button: { style: { color: 'primary', size: 'md' }, extra: { label: '', confirmAction: false } },
  switch: { style: { color: 'green' }, extra: { onLabel: 'ON', offLabel: 'OFF' } },
  display: { style: { fontSize: 'lg', unit: '' }, extra: { precision: 2, prefix: '' } },
  'number-input': { style: { min: 0, max: 100, unit: '' }, extra: { step: 1, placeholder: '' } },
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

const isNew = computed(() => !props.card);

const draft = ref<DraftCard>(makeDraft());

function makeDraft(): DraftCard {
  if (props.card) {
    return JSON.parse(
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
  }
  const type: CardType = 'display';
  const defaults = TYPE_DEFAULTS[type];
  return {
    id: 0,
    name: 'New Card',
    type,
    order: props.defaultOrder ?? 1,
    register: 1,
    style: { ...defaults.style },
    extra: { ...defaults.extra },
  };
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) draft.value = makeDraft();
  }
);

const onTypeChange = () => {
  const defaults = TYPE_DEFAULTS[draft.value.type];
  draft.value.style = { ...defaults.style };
  draft.value.extra = { ...defaults.extra };
};

const cancel = () => emit('update:modelValue', false);

const handleSet = () => {
  const card: Card = {
    id: draft.value.id === 0 ? Date.now() : draft.value.id,
    name: draft.value.name,
    type: draft.value.type,
    order: draft.value.order,
    register: draft.value.register,
    style: draft.value.style as any,
    extra: draft.value.extra as any,
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
