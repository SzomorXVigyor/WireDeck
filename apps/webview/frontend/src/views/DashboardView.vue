<template>
  <div class="min-h-screen flex" :class="themeStore.isDark ? 'bg-gray-900' : 'bg-gray-100'">
    <!-- ───────────── Mobile overlay backdrop ───────────── -->
    <transition name="fade">
      <div
        v-if="sidebarStore.isOpen"
        class="fixed inset-0 z-20 bg-black/50 md:hidden"
        aria-hidden="true"
        @click="sidebarStore.isOpen = false"
      />
    </transition>

    <!-- ───────────────── Sidebar ───────────────── -->
    <aside
      class="fixed md:sticky top-0 z-30 md:z-auto h-screen flex-shrink-0 flex flex-col border-r transition-all duration-300 ease-in-out w-64 md:w-60"
      :class="[
        themeStore.isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
        sidebarStore.isOpen ? 'translate-x-0' : '-translate-x-full',
        sidebarStore.isHidden ? 'md:-translate-x-full md:-mr-60 md:pointer-events-none' : 'md:translate-x-0 md:mr-0',
      ]"
    >
      <!-- Logo / App name -->
      <div
        class="px-4 py-4 border-b flex items-center justify-between flex-shrink-0"
        :class="themeStore.isDark ? 'border-gray-700' : 'border-gray-200'"
      >
        <span class="text-base font-bold tracking-tight" :class="themeStore.isDark ? 'text-white' : 'text-gray-900'">
          WireDeck
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

          <!-- Hide sidebar on desktop -->
          <button
            class="p-1.5 rounded-lg transition-colors hidden md:inline-flex"
            :class="
              themeStore.isDark
                ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            "
            title="Hide sidebar"
            @click="sidebarStore.isHidden = true"
          >
            <XMarkIcon class="w-4 h-4" />
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
            @click="sidebarStore.isOpen = false"
          >
            <XMarkIcon class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Views navigation -->
      <nav class="flex-1 overflow-y-auto p-3">
        <!-- Section title -->
        <div class="flex items-center justify-between mb-2 px-2">
          <p
            class="text-xs font-semibold uppercase tracking-wider"
            :class="themeStore.isDark ? 'text-gray-400' : 'text-gray-500'"
          >
            Views
          </p>
          <!-- Create view (admin only) -->
          <button
            v-if="authStore.user?.role === 'admin'"
            class="p-0.5 rounded transition-colors"
            :class="
              themeStore.isDark
                ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            "
            title="Create new view"
            @click="handleCreateView"
          >
            <PlusIcon class="w-4 h-4" />
          </button>
        </div>

        <!-- Loading skeleton -->
        <div v-if="viewsStore.loadingViews" class="space-y-1">
          <div
            v-for="i in 4"
            :key="i"
            class="h-8 rounded-lg animate-pulse"
            :class="themeStore.isDark ? 'bg-gray-700' : 'bg-gray-200'"
          />
        </div>

        <!-- Error -->
        <p v-else-if="viewsStore.error && viewsStore.views.length === 0" class="text-xs text-red-500 px-2 py-1">
          Failed to load views.
        </p>

        <!-- Empty state -->
        <p
          v-else-if="viewsStore.views.length === 0"
          class="text-xs px-2 py-1"
          :class="themeStore.isDark ? 'text-gray-500' : 'text-gray-400'"
        >
          No views available.
        </p>

        <!-- View list -->
        <ul v-else class="space-y-1">
          <li v-for="view in viewsStore.views" :key="view.id">
            <router-link
              :to="{ name: 'ViewDetail', params: { id: view.id } }"
              class="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full"
              :class="
                isActiveView(view.id)
                  ? 'bg-blue-600 text-white'
                  : themeStore.isDark
                    ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              "
              @click="sidebarStore.isOpen = false"
            >
              <ViewColumnsIcon class="w-4 h-4 flex-shrink-0" />
              <span class="truncate">{{ view.name }}</span>
            </router-link>
          </li>
        </ul>

        <!-- Admin section: Register dictionary -->
        <div v-if="authStore.user?.role === 'admin'" class="mt-4">
          <p
            class="text-xs font-semibold uppercase tracking-wider mb-2 px-2"
            :class="themeStore.isDark ? 'text-gray-400' : 'text-gray-500'"
          >
            Admin
          </p>
          <ul class="space-y-1">
            <li>
              <router-link
                :to="{ name: 'RegisterDictionary' }"
                class="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full"
                :class="
                  route.name === 'RegisterDictionary'
                    ? 'bg-blue-600 text-white'
                    : themeStore.isDark
                      ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                "
                @click="sidebarStore.isOpen = false"
              >
                <BookOpenIcon class="w-4 h-4 flex-shrink-0" />
                <span class="truncate">Register dictionary</span>
              </router-link>
            </li>
            <li>
              <router-link
                :to="{ name: 'Devices' }"
                class="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full"
                :class="
                  route.name === 'Devices'
                    ? 'bg-blue-600 text-white'
                    : themeStore.isDark
                      ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                "
                @click="sidebarStore.isOpen = false"
              >
                <ServerStackIcon class="w-4 h-4 flex-shrink-0" />
                <span class="truncate">Devices</span>
              </router-link>
            </li>
          </ul>
        </div>
      </nav>

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
          @click="sidebarStore.isOpen = true"
        >
          <Bars3Icon class="w-5 h-5" />
        </button>
        <span class="font-semibold text-sm" :class="themeStore.isDark ? 'text-white' : 'text-gray-900'">
          {{ viewsStore.currentView?.name ?? 'WireDeck' }}
        </span>
      </header>

      <!-- Desktop top bar (show when sidebar is hidden) -->
      <header
        v-if="sidebarStore.isHidden"
        class="hidden md:flex items-center gap-3 px-4 py-3 border-b flex-shrink-0"
        :class="themeStore.isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'"
      >
        <button
          class="p-1.5 rounded-lg transition-colors"
          :class="themeStore.isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'"
          aria-label="Show sidebar"
          @click="sidebarStore.isHidden = false"
        >
          <Bars3Icon class="w-5 h-5" />
        </button>
        <span class="font-semibold text-sm" :class="themeStore.isDark ? 'text-white' : 'text-gray-900'">
          {{ viewsStore.currentView?.name ?? 'WireDeck' }}
        </span>
      </header>

      <main class="flex-1 overflow-y-auto">
        <!-- Routed view page -->
        <router-view />

        <!-- Empty state shown when no view is selected and not on an admin sub-page -->
        <div
          v-if="route.name !== 'ViewDetail' && route.name !== 'RegisterDictionary' && route.name !== 'Devices'"
          class="flex flex-col items-center justify-center min-h-[60vh] gap-4"
        >
          <ViewColumnsIcon class="w-16 h-16" :class="themeStore.isDark ? 'text-gray-600' : 'text-gray-300'" />
          <p class="text-base font-medium" :class="themeStore.isDark ? 'text-gray-400' : 'text-gray-500'">
            Select a view from the sidebar
          </p>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useThemeStore } from '../stores/theme';
import { useViewsStore } from '../stores/views';
import { useSidebarStore } from '../stores/sidebar';
import {
  SunIcon,
  MoonIcon,
  ArrowRightOnRectangleIcon,
  ViewColumnsIcon,
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon,
  PlusIcon,
  BookOpenIcon,
  ServerStackIcon,
} from '@heroicons/vue/24/outline';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const themeStore = useThemeStore();
const viewsStore = useViewsStore();
const sidebarStore = useSidebarStore();

const isActiveView = (id: number) => route.name === 'ViewDetail' && String(route.params.id) === String(id);

const handleLogout = async () => {
  await authStore.logout();
  router.push('/login');
};

const handleCreateView = async () => {
  try {
    const newView = await viewsStore.createView();
    router.push({ name: 'ViewDetail', params: { id: newView.id } });
  } catch {
    // error already set in store
  }
};

onMounted(async () => {
  themeStore.initializeTheme();
  await viewsStore.fetchViews();

  // Auto-navigate to the first view when landing on bare /dashboard (but not on an admin sub-page)
  if (
    route.name !== 'ViewDetail' &&
    route.name !== 'RegisterDictionary' &&
    route.name !== 'Devices' &&
    viewsStore.views.length > 0
  ) {
    router.replace({ name: 'ViewDetail', params: { id: viewsStore.views[0]!.id } });
  }
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
