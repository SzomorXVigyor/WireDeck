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

    <!-- Input row -->
    <div class="mt-auto flex items-center gap-2">
      <div class="relative flex-1">
        <input
          v-model.number="localValue"
          type="number"
          :min="style.min"
          :max="style.max"
          :step="extra.step ?? 1"
          :placeholder="extra.placeholder ?? ''"
          class="w-full py-2 pl-3 text-sm rounded-lg border bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          :class="style.unit ? 'pr-10' : 'pr-3'"
        />
        <span
          v-if="style.unit"
          class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400 pointer-events-none select-none"
        >
          {{ style.unit }}
        </span>
      </div>
      <button
        class="flex-shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
        @click="apply"
      >
        Set
      </button>
    </div>

    <!-- Range hint -->
    <p
      v-if="style.min !== undefined || style.max !== undefined"
      class="text-xs text-gray-400 dark:text-gray-500 flex gap-3"
    >
      <span v-if="style.min !== undefined">Min: {{ style.min }}</span>
      <span v-if="style.max !== undefined">Max: {{ style.max }}</span>
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { Card, NumberInputStyle, NumberInputExtra } from '../../types/view';
import { useViewsStore } from '../../stores/views';

const props = defineProps<{ card: Card; viewId: string | number }>();

const viewsStore = useViewsStore();
const style = computed(() => props.card.style as NumberInputStyle);
const extra = computed(() => props.card.extra as NumberInputExtra);

/** Local input value — initialised from register data when it arrives */
const localValue = ref<number | null>(null);

watch(
  () => viewsStore.registerData.get(props.card.register),
  (v) => {
    if (v !== undefined && localValue.value === null) {
      localValue.value = v;
    }
  },
  { immediate: true }
);

const apply = async () => {
  if (localValue.value === null) return;
  await viewsStore.writeRegisterData(props.viewId, props.card.register, localValue.value);
};
</script>
