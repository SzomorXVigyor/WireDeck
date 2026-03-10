<template>
  <teleport to="body">
    <div
      class="fixed bottom-4 right-4 z-[9999] flex flex-col-reverse gap-2 w-80 max-w-[calc(100vw-2rem)] pointer-events-none"
      aria-live="assertive"
      aria-atomic="false"
    >
      <transition-group name="toast" tag="div" class="flex flex-col-reverse gap-2">
        <div
          v-for="toast in toastStore.toasts"
          :key="toast.id"
          class="flex items-start gap-3 rounded-xl px-4 py-3 shadow-lg pointer-events-auto select-none"
          :class="toastClasses(toast.type)"
          role="alert"
        >
          <!-- Icon -->
          <component :is="toastIcon(toast.type)" class="w-5 h-5 flex-shrink-0 mt-0.5" />

          <!-- Message -->
          <span class="flex-1 text-sm font-medium leading-snug break-words">{{ toast.message }}</span>

          <!-- Dismiss button -->
          <button
            class="flex-shrink-0 rounded-md p-0.5 opacity-70 hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-white/50"
            :aria-label="'Dismiss notification'"
            @click="toastStore.remove(toast.id)"
          >
            <XMarkIcon class="w-4 h-4" />
          </button>
        </div>
      </transition-group>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { useToastStore, type ToastType } from '../stores/toast';
import {
  XMarkIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
} from '@heroicons/vue/24/solid';

const toastStore = useToastStore();

function toastClasses(type: ToastType): string {
  switch (type) {
    case 'error':
      return 'bg-red-600 text-white';
    case 'warning':
      return 'bg-amber-500 text-white';
    case 'success':
      return 'bg-green-600 text-white';
    case 'info':
      return 'bg-blue-600 text-white';
  }
}

function toastIcon(type: ToastType) {
  switch (type) {
    case 'error':
      return ExclamationCircleIcon;
    case 'warning':
      return ExclamationTriangleIcon;
    case 'success':
      return CheckCircleIcon;
    case 'info':
      return InformationCircleIcon;
  }
}
</script>

<style scoped>
.toast-enter-active {
  transition:
    transform 0.25s ease,
    opacity 0.25s ease;
}

.toast-leave-active {
  transition:
    transform 0.2s ease,
    opacity 0.2s ease;
}

.toast-enter-from {
  transform: translateX(110%);
  opacity: 0;
}

.toast-leave-to {
  transform: translateX(110%);
  opacity: 0;
}
</style>
