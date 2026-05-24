<template>
  <div class="flex items-center gap-3">
    <span
      class="text-xs font-semibold uppercase tracking-widest"
      :class="themeStore.isDark ? 'text-gray-500' : 'text-gray-400'"
    >
      {{ label }}
    </span>
    <div class="flex-1 h-px" :class="themeStore.isDark ? 'bg-gray-700' : 'bg-gray-200'" />
  </div>
</template>

<script setup lang="ts">
import { useThemeStore } from '../../stores/theme';

defineProps<{ label: string }>();

const themeStore = useThemeStore();
</script>
