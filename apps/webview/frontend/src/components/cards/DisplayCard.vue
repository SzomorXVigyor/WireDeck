<template>
  <div class="rounded-xl border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 p-4 flex flex-col gap-2">
    <!-- Card header -->
    <div class="flex items-start justify-between gap-2">
      <p class="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate leading-tight">
        {{ card.name }}
      </p>
    </div>

    <!-- Value display -->
    <div class="mt-auto flex items-baseline gap-1 pt-1">
      <span v-if="extra.prefix" :class="valueSizeClass" class="text-sm text-gray-900 dark:text-white leading-none">
        {{ extra.prefix }}
      </span>
      <span :class="valueSizeClass" class="font-bold tabular-nums text-gray-900 dark:text-white leading-none">
        {{ displayValue }}
      </span>
      <span
        v-if="extra.unit"
        :class="valueSizeClass"
        class="font-bold text-gray-900 dark:text-white leading-none ml-0.5"
      >
        {{ extra.unit }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Card, DisplayStyle, DisplayExtra } from '../../types/view';
import { useViewsStore } from '../../stores/views';
import { formatValue } from '../../utils/precision';

const props = defineProps<{ card: Card }>();

const viewsStore = useViewsStore();
const style = computed(() => props.card.style as DisplayStyle);
const extra = computed(() => props.card.extra as DisplayExtra);

/** Live value from register data, falls back to NaN until first poll arrives */
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
