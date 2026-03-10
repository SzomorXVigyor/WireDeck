import { defineStore } from 'pinia';
import { ref, type Ref } from 'vue';

export type ToastType = 'error' | 'warning' | 'success' | 'info';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

const DEFAULT_DURATION_MS = 5000;

let _nextId = 0;

export const useToastStore = defineStore('toast', () => {
  const toasts: Ref<Toast[]> = ref([]);

  const remove = (id: number): void => {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  };

  const push = (message: string, type: ToastType = 'error', duration = DEFAULT_DURATION_MS): number => {
    const id = _nextId++;
    toasts.value.push({ id, message, type });
    if (duration > 0) {
      setTimeout(() => remove(id), duration);
    }
    return id;
  };

  return { toasts, push, remove };
});
