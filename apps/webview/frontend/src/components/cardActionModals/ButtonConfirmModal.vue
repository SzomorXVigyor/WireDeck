<template>
  <Teleport to="body">
    <Transition name="bcm-fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        style="background: rgba(0, 0, 0, 0.55); backdrop-filter: blur(4px)"
        @click.self="emit('update:modelValue', false)"
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
                :class="themeStore.isDark ? 'bg-yellow-500/20' : 'bg-yellow-50'"
              >
                <ExclamationTriangleIcon class="w-5 h-5 text-yellow-500" />
              </div>
              <h2 class="text-base font-semibold">Confirm Action</h2>
            </div>
            <button
              class="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
              :class="themeStore.isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'"
              @click="emit('update:modelValue', false)"
            >
              <XMarkIcon class="w-4 h-4" />
            </button>
          </div>

          <!-- Body -->
          <div class="px-6 py-5">
            <p class="text-sm leading-relaxed" :class="themeStore.isDark ? 'text-gray-300' : 'text-gray-600'">
              Are you sure you want to trigger
              <span class="font-semibold" :class="themeStore.isDark ? 'text-white' : 'text-gray-900'">
                "{{ label }}" </span
              >?
            </p>
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
              @click="emit('update:modelValue', false)"
            >
              Cancel
            </button>
            <button
              type="button"
              class="px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
              @click="handleConfirm"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useThemeStore } from '../../stores/theme';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/vue/24/outline';

defineProps<{
  modelValue: boolean;
  label: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void;
  (e: 'confirm'): void;
}>();

const themeStore = useThemeStore();

const handleConfirm = () => {
  emit('confirm');
  emit('update:modelValue', false);
};
</script>

<style scoped>
.bcm-fade-enter-active,
.bcm-fade-leave-active {
  transition: opacity 0.15s ease;
}
.bcm-fade-enter-from,
.bcm-fade-leave-to {
  opacity: 0;
}
</style>
