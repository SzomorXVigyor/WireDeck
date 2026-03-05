<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useAuthStore } from './stores/auth';
import { useThemeStore } from './stores/theme';

const authStore = useAuthStore();
const themeStore = useThemeStore();

onMounted(() => {
  // Restore theme from localStorage / system preference before first render
  themeStore.initializeTheme();
  // Restore auth state from localStorage
  authStore.initializeAuth();
});
</script>
