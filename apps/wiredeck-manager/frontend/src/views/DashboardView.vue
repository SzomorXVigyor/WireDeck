<template>
  <div class="min-h-screen flex" :class="themeStore.isDark ? 'bg-gray-900' : 'bg-gray-100'">
    <!-- ───────────── Mobile overlay backdrop ───────────── -->
    <transition name="fade">
      <div
        v-if="sidebarOpen"
        class="fixed inset-0 z-20 bg-black/50 md:hidden"
        aria-hidden="true"
        @click="sidebarOpen = false"
      />
    </transition>

    <!-- ───────────────── Sidebar ───────────────── -->
    <aside
      class="fixed md:sticky top-0 z-30 md:z-auto h-screen flex-shrink-0 flex flex-col border-r transition-transform duration-300 ease-in-out md:translate-x-0 w-64 md:w-60"
      :class="[
        themeStore.isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
      ]"
    >
      <!-- Logo / App name -->
      <div
        class="px-4 py-4 border-b flex items-center justify-between flex-shrink-0"
        :class="themeStore.isDark ? 'border-gray-700' : 'border-gray-200'"
      >
        <span class="text-base font-bold tracking-tight" :class="themeStore.isDark ? 'text-white' : 'text-gray-900'">
          WireDeck Admin
        </span>

        <div class="flex items-center gap-0.5">
          <!-- Theme toggle -->
          <button
            class="p-1.5 rounded-lg transition-colors"
            :class="
              themeStore.isDark
                ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            "
            title="Toggle theme"
            @click="themeStore.toggleTheme"
          >
            <SunIcon v-if="themeStore.isDark" class="w-4 h-4" />
            <MoonIcon v-else class="w-4 h-4" />
          </button>

          <!-- Close on mobile -->
          <button
            class="p-1.5 rounded-lg transition-colors md:hidden"
            :class="
              themeStore.isDark
                ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            "
            title="Close menu"
            @click="sidebarOpen = false"
          >
            <XMarkIcon class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- User footer -->
      <div class="p-3 border-t flex-shrink-0" :class="themeStore.isDark ? 'border-gray-700' : 'border-gray-200'">
        <div class="flex items-center gap-2 px-2 py-1">
          <UserCircleIcon
            class="w-5 h-5 flex-shrink-0"
            :class="themeStore.isDark ? 'text-gray-400' : 'text-gray-500'"
          />
          <span class="text-sm truncate flex-1" :class="themeStore.isDark ? 'text-gray-300' : 'text-gray-700'">
            {{ authStore.user?.username ?? 'User' }}
          </span>
          <!-- Logout -->
          <button
            class="p-1.5 rounded-lg transition-colors flex-shrink-0"
            :class="
              themeStore.isDark
                ? 'text-gray-400 hover:text-red-400 hover:bg-gray-700'
                : 'text-gray-500 hover:text-red-600 hover:bg-gray-100'
            "
            title="Logout"
            @click="handleLogout"
          >
            <ArrowRightOnRectangleIcon class="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>

    <!-- ───────────────── Main content ───────────────── -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- Mobile top bar -->
      <header
        class="md:hidden flex items-center gap-3 px-4 py-3 border-b flex-shrink-0"
        :class="themeStore.isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'"
      >
        <button
          class="p-1.5 rounded-lg transition-colors"
          :class="themeStore.isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'"
          aria-label="Open menu"
          @click="sidebarOpen = true"
        >
          <Bars3Icon class="w-5 h-5" />
        </button>
        <span class="font-semibold text-sm" :class="themeStore.isDark ? 'text-white' : 'text-gray-900'">
          WireDeck Dashboard
        </span>
      </header>

      <main class="flex-1 overflow-y-auto">
        <!-- Routed view page -->
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useThemeStore } from '../stores/theme';
import {
  SunIcon,
  MoonIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/vue/24/outline';

const router = useRouter();
const authStore = useAuthStore();
const themeStore = useThemeStore();

const sidebarOpen = ref(false);

const handleLogout = async () => {
  await authStore.logout();
  router.push('/login');
};

onMounted(async () => {
  themeStore.initializeTheme();
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
