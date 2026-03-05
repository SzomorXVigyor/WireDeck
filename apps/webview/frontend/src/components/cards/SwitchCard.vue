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

    <!-- Switch row -->
    <div class="mt-auto flex items-center justify-between gap-3">
      <span
        class="text-sm transition-colors"
        :class="isOn ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'"
      >
        {{ isOn ? onLabel : offLabel }}
      </span>

      <!-- Toggle pill -->
      <button
        type="button"
        role="switch"
        :aria-checked="isOn"
        class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
        :class="switchBgClass"
        @click="toggle"
      >
        <span
          class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
          :class="isOn ? 'translate-x-5' : 'translate-x-0'"
        />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Card, SwitchStyle, SwitchExtra } from '../../types/view';
import { useViewsStore } from '../../stores/views';

const props = defineProps<{ card: Card; viewId: string | number }>();

const viewsStore = useViewsStore();
const style = computed(() => props.card.style as SwitchStyle);
const extra = computed(() => props.card.extra as SwitchExtra);

const isOn = computed<boolean>(() => {
  const v = viewsStore.registerData.get(props.card.register);
  return v !== undefined ? v !== 0 : false;
});

const onLabel = computed(() => extra.value.onLabel ?? 'On');
const offLabel = computed(() => extra.value.offLabel ?? 'Off');

const activeColorMap: Record<string, string> = {
  green: 'bg-green-500 focus:ring-green-500',
  blue: 'bg-blue-600 focus:ring-blue-500',
  red: 'bg-red-600 focus:ring-red-500',
  yellow: 'bg-yellow-500 focus:ring-yellow-400',
};

const switchBgClass = computed(() =>
  isOn.value ? activeColorMap[style.value.color ?? 'green'] : 'bg-gray-200 dark:bg-gray-600 focus:ring-gray-400'
);

const toggle = () => {
  const newValue = isOn.value ? 0 : 1;
  viewsStore.writeRegisterData(props.viewId, props.card.register, newValue);
};
</script>
