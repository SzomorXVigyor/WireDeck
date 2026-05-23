<template>
  <div
    class="rounded-xl border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 p-4 flex flex-col gap-2 cursor-pointer group transition-all hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700"
    @click="showActionModal = true"
  >
    <!-- Card header -->
    <div class="flex items-start justify-between gap-2">
      <p class="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate leading-tight">
        {{ card.name }}
      </p>
      <span
        class="text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 px-1.5 py-0.5 rounded flex-shrink-0"
      >
        R{{ card.register }}
      </span>
    </div>

    <!-- Value row -->
    <div class="mt-auto flex items-baseline justify-between gap-2 pt-1">
      <!-- Value display (matches DisplayCard layout) -->
      <div class="flex items-baseline gap-1 min-w-0">
        <span v-if="extra.prefix" class="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">
          {{ extra.prefix }}
        </span>
        <span
          :class="valueSizeClass"
          class="font-bold tabular-nums text-gray-900 dark:text-white leading-none truncate"
        >
          {{ displayValue }}
        </span>
        <span v-if="extra.unit" class="text-sm text-gray-500 dark:text-gray-400 ml-0.5 flex-shrink-0">
          {{ extra.unit }}
        </span>
      </div>

      <!-- Write icon -->
      <button
        class="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 group-hover:text-blue-500 dark:group-hover:text-blue-400"
        title="Set value"
        @click.stop="showActionModal = true"
      >
        <PencilSquareIcon class="w-4 h-4" />
      </button>
    </div>

    <!-- Action modal -->
    <NumberInputActionModal v-model="showActionModal" :card="card" :view-id="viewId" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { Card, NumberInputStyle, NumberInputExtra } from '../../types/view';
import { useViewsStore } from '../../stores/views';
import { formatValue } from '../../utils/precision';
import NumberInputActionModal from '../cardActionModals/NumberInputActionModal.vue';
import { PencilSquareIcon } from '@heroicons/vue/24/outline';

const props = defineProps<{ card: Card; viewId: string | number }>();

const viewsStore = useViewsStore();
const style = computed(() => props.card.style as NumberInputStyle);
const extra = computed(() => props.card.extra as NumberInputExtra);

const showActionModal = ref(false);

/** Raw register value */
const rawValue = computed<number>(() => {
  const v = viewsStore.registerData.get(props.card.register);
  return v !== undefined ? v : NaN;
});

const displayValue = computed(() =>
  formatValue(rawValue.value, extra.value.precision ?? 0, extra.value.signed ?? false)
);

const fontSizeMap: Record<string, string> = {
  sm: 'text-xl',
  md: 'text-2xl',
  lg: 'text-3xl',
  xl: 'text-4xl',
};

const valueSizeClass = computed(() => fontSizeMap[style.value.fontSize ?? 'lg']);
</script>
