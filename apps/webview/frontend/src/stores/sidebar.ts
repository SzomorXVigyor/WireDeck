import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

export const useSidebarStore = defineStore('sidebar', () => {
  const isOpen = ref(false);
  const isHidden = ref(localStorage.getItem('sidebar_hidden') === 'true');

  watch(isHidden, (newValue) => {
    localStorage.setItem('sidebar_hidden', String(newValue));
  });

  const toggleMobile = () => {
    isOpen.value = !isOpen.value;
  };

  const toggleDesktop = () => {
    isHidden.value = !isHidden.value;
  };

  return {
    isOpen,
    isHidden,
    toggleMobile,
    toggleDesktop,
  };
});
