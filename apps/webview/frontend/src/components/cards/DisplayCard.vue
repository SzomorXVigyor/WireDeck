<template>
  <div class="rounded-xl border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 p-4 flex flex-col gap-2">
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

    <!-- Value display -->
    <div class="mt-auto flex items-baseline gap-1 pt-1">
      <span v-if="extra.prefix" class="text-sm text-gray-500 dark:text-gray-400">
        {{ extra.prefix }}
      </span>
      <span :class="valueSizeClass" class="font-bold tabular-nums text-gray-900 dark:text-white leading-none">
        {{ displayValue }}
      </span>
      <span v-if="style.unit" class="text-sm text-gray-500 dark:text-gray-400 ml-0.5">
        {{ style.unit }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Card, DisplayStyle, DisplayExtra } from '../../types/view';
import { useViewsStore } from '../../stores/views';

const props = defineProps<{ card: Card }>();

const viewsStore = useViewsStore();
const style = computed(() => props.card.style as DisplayStyle);
const extra = computed(() => props.card.extra as DisplayExtra);

/** Live value from register data, falls back to a seed value when not yet loaded */
const rawValue = computed<number>(() => {
  const v = viewsStore.registerData.get(props.card.register);
  if (v !== undefined) return v;
  // Seed fallback until first poll arrives
  return NaN;
});

const displayValue = computed(() => {
  const precision = extra.value.precision ?? 0;
  return rawValue.value.toFixed(precision);
});

const fontSizeMap: Record<string, string> = {
  sm: 'text-xl',
  md: 'text-2xl',
  lg: 'text-3xl',
  xl: 'text-4xl',
};

const valueSizeClass = computed(() => fontSizeMap[style.value.fontSize ?? 'lg']);
</script>
