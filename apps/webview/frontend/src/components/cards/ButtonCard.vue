<template>
  <div class="rounded-xl border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 p-4 flex flex-col gap-3">
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

    <!-- Button -->
    <button
      class="mt-auto w-full font-medium rounded-lg transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 disabled:opacity-60 disabled:cursor-not-allowed"
      :class="[colorClass, sizeClass]"
      :disabled="justClicked"
      @click="handleClick"
    >
      <span v-if="justClicked" class="flex items-center justify-center gap-1">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        Done
      </span>
      <span v-else>{{ label }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { Card, ButtonStyle, ButtonExtra } from '../../types/view';
import { useViewsStore } from '../../stores/views';

const props = defineProps<{ card: Card; viewId: string | number }>();

const viewsStore = useViewsStore();
const style = computed(() => props.card.style as ButtonStyle);
const extra = computed(() => props.card.extra as ButtonExtra);

const label = computed(() => extra.value.label || props.card.name);
const justClicked = ref(false);

const colorMap: Record<string, string> = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
  secondary:
    'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 focus:ring-gray-400',
  danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
  success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500',
  warning: 'bg-yellow-500 hover:bg-yellow-600 text-white focus:ring-yellow-400',
};

const sizeMap: Record<string, string> = {
  sm: 'py-1.5 px-3 text-xs',
  md: 'py-2 px-4 text-sm',
  lg: 'py-3 px-5 text-base',
};

const colorClass = computed(() => colorMap[style.value.color ?? 'primary']);
const sizeClass = computed(() => sizeMap[style.value.size ?? 'md']);

const handleClick = async () => {
  if (extra.value.confirmAction) {
    if (!confirm(`Are you sure you want to trigger "${label.value}"?`)) return;
  }
  justClicked.value = true;
  // Write a pulse value (1) to the register
  await viewsStore.writeRegisterData(props.viewId, props.card.register, 1);
  setTimeout(() => {
    justClicked.value = false;
  }, 1500);
};
</script>
