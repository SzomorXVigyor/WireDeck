<template>
  <Teleport to="body">
    <Transition name="nim-fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        style="background: rgba(0, 0, 0, 0.55); backdrop-filter: blur(4px)"
        @click.self="cancel"
      >
        <div
          class="w-full max-w-sm rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          :class="themeStore.isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'"
        >
          <!-- Header -->
          <div
            class="flex items-center justify-between px-6 py-4 border-b"
            :class="themeStore.isDark ? 'border-gray-700' : 'border-gray-100'"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-9 h-9 rounded-xl flex items-center justify-center"
                :class="themeStore.isDark ? 'bg-blue-500/20' : 'bg-blue-50'"
              >
                <PencilSquareIcon class="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h2 class="text-base font-semibold leading-tight">Set Value</h2>
                <p class="text-xs leading-none mt-0.5" :class="themeStore.isDark ? 'text-gray-400' : 'text-gray-500'">
                  {{ card.name }}
                </p>
              </div>
            </div>
            <button
              class="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
              :class="themeStore.isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'"
              @click="cancel"
            >
              <XMarkIcon class="w-4 h-4" />
            </button>
          </div>

          <!-- Current value display -->
          <div class="px-6 pt-5 pb-4">
            <p
              class="text-xs font-medium mb-2 uppercase tracking-wide"
              :class="themeStore.isDark ? 'text-gray-500' : 'text-gray-400'"
            >
              Current value
            </p>
            <div class="flex items-baseline gap-1.5">
              <span v-if="extra.prefix" class="text-sm" :class="themeStore.isDark ? 'text-gray-400' : 'text-gray-500'">
                {{ extra.prefix }}
              </span>
              <span
                :class="[
                  fontSizeClass,
                  'font-bold tabular-nums leading-none',
                  themeStore.isDark ? 'text-white' : 'text-gray-900',
                ]"
              >
                {{ currentDisplayValue }}
              </span>
              <span v-if="extra.unit" class="text-sm" :class="themeStore.isDark ? 'text-gray-400' : 'text-gray-500'">
                {{ extra.unit }}
              </span>
            </div>
          </div>

          <!-- Divider -->
          <div class="mx-6 border-t" :class="themeStore.isDark ? 'border-gray-700' : 'border-gray-100'" />

          <!-- Input area -->
          <div class="px-6 py-5">
            <NumericInputField
              ref="numericInputRef"
              :precision="precision"
              :signed="signed"
              :min="extra.min"
              :max="extra.max"
              :placeholder="extra.placeholder"
              label="New value"
              :unit="extra.unit"
              @submit="handleWrite"
            />
          </div>

          <!-- Footer -->
          <div
            class="flex justify-end gap-2 px-6 py-4 border-t"
            :class="themeStore.isDark ? 'border-gray-700' : 'border-gray-100'"
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
                canSet
                  ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
                  : 'bg-blue-400 text-white cursor-not-allowed opacity-60'
              "
              :disabled="!canSet"
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
import { ref, computed, watch, nextTick } from 'vue';
import { useThemeStore } from '../../stores/theme';
import { useViewsStore } from '../../stores/views';
import { formatValue, encodeValue } from '../../utils/precision';
import { validateNumericInput } from '../../utils/numericInput';
import type { Card, NumberInputStyle, NumberInputExtra } from '../../types/view';
import { PencilSquareIcon, XMarkIcon } from '@heroicons/vue/24/outline';
import NumericInputField from '../shared/NumericInputField.vue';

const props = defineProps<{
  modelValue: boolean;
  card: Card;
  viewId: string | number;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void;
}>();

const themeStore = useThemeStore();
const viewsStore = useViewsStore();

const style = computed(() => props.card.style as NumberInputStyle);
const extra = computed(() => props.card.extra as NumberInputExtra);

const precision = computed(() => extra.value.precision ?? 0);
const signed = computed(() => extra.value.signed ?? false);

// --- Current value display ---

const rawValue = computed<number>(() => {
  const v = viewsStore.registerData.get(props.card.register);
  return v !== undefined ? v : NaN;
});

const currentDisplayValue = computed(() => formatValue(rawValue.value, precision.value, signed.value));

const fontSizeMap: Record<string, string> = { sm: 'text-xl', md: 'text-2xl', lg: 'text-3xl', xl: 'text-4xl' };
const fontSizeClass = computed(() => fontSizeMap[style.value.fontSize ?? 'lg']);

// --- NumericInputField ref ---

const numericInputRef = ref<InstanceType<typeof NumericInputField> | null>(null);

const canSet = computed(() => numericInputRef.value?.isValid ?? false);

// --- Lifecycle ---

watch(
  () => props.modelValue,
  async (open) => {
    if (open) {
      await nextTick(); // ensure component is mounted
      const str = isNaN(rawValue.value) ? '' : formatValue(rawValue.value, precision.value, signed.value);
      numericInputRef.value?.reset(str);
      numericInputRef.value?.select();
    }
  }
);

// --- Actions ---

const cancel = () => emit('update:modelValue', false);

/** Write the validated value to the register and close. */
const handleWrite = async (v: number) => {
  const raw = encodeValue(v, precision.value, signed.value);
  await viewsStore.writeRegisterData(props.viewId, props.card.register, raw);
  emit('update:modelValue', false);
};

/** Set button handler — flushes mobile DOM lag, shows errors, then writes. */
const handleSet = async () => {
  numericInputRef.value?.flush();
  numericInputRef.value?.markTouched();

  const v = numericInputRef.value?.parsedValue ?? null;
  if (v === null) return;
  if (validateNumericInput(v, signed.value, precision.value > 0, extra.value.min, extra.value.max)) return;

  await handleWrite(v);
};
</script>

<style scoped>
.nim-fade-enter-active,
.nim-fade-leave-active {
  transition: opacity 0.15s ease;
}
.nim-fade-enter-from,
.nim-fade-leave-to {
  opacity: 0;
}
</style>
