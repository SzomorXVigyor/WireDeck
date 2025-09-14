<template>
  <div class="min-h-screen" :class="themeStore.isDark ? 'bg-gray-900' : 'bg-gray-50'">
    <!-- Header -->
    <header :class="themeStore.isDark ? 'bg-gray-800 shadow-lg' : 'bg-white shadow-sm'">
      <div class="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 space-y-3 sm:space-y-0">
          <div class="flex items-center justify-between">
            <h1 class="text-xl sm:text-2xl font-bold" :class="themeStore.isDark ? 'text-white' : 'text-gray-900'">
              WireDeck WebVNC Dashboard
            </h1>
          </div>
          <div class="flex flex-wrap w-full sm:w-auto items-center justify-end gap-2 sm:gap-4">
            <!-- WireGuard Status -->
            <div class="flex items-center space-x-2">
              <div :class="wireguardStatusClass" class="w-2 h-2 rounded-full"></div>
              <span class="text-xs sm:text-sm" :class="themeStore.isDark ? 'text-gray-300' : 'text-gray-600'">
                WireGuard {{ wireguardStatus }}
              </span>
            </div>

            <!-- User Menu -->
            <div class="relative" ref="userMenuRef">
              <button
                @click="toggleUserMenu"
                class="flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors"
                :class="
                  themeStore.isDark
                    ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                "
              >
                <UserIcon class="w-5 h-5" />
                <span class="text-xs font-semibold sm:text-sm truncate max-w-[100px] sm:max-w-none">
                  {{ authStore.user?.username }}
                </span>
                <ChevronDownIcon class="w-4 h-4" />
              </button>

              <!-- User Menu Dropdown -->
              <div
                v-if="showUserMenu"
                class="absolute right-0 mt-2 w-56 rounded-lg shadow-lg z-50"
                :class="themeStore.isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'"
              >
                <div class="py-1">
                  <div
                    class="px-4 py-2 border-b"
                    :class="themeStore.isDark ? 'border-gray-700 text-gray-300' : 'border-gray-200 text-gray-600'"
                  >
                    <p class="text-sm font-semibold">{{ authStore.user?.username }}</p>
                  </div>

                  <!-- Password Change Option -->
                  <button
                    v-if="configStore.config.features.passwordChange"
                    @click="handlePasswordChange"
                    class="w-full text-left px-4 py-2 text-sm transition-colors flex items-center"
                    :class="
                      themeStore.isDark
                        ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    "
                  >
                    <KeyIcon class="w-4 h-4 mr-3" />
                    Change Password
                  </button>

                  <div class="border-t" :class="themeStore.isDark ? 'border-gray-700' : 'border-gray-200'">
                    <button
                      @click="handleLogout"
                      class="w-full text-left px-4 py-2 text-sm transition-colors flex items-center"
                      :class="
                        themeStore.isDark
                          ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      "
                    >
                      <ArrowRightOnRectangleIcon class="w-4 h-4 mr-3" />
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Theme Toggle -->
            <button
              @click="themeStore.toggleTheme"
              class="p-2 rounded-lg transition-colors"
              :class="
                themeStore.isDark
                  ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              "
              aria-label="Toggle theme"
            >
              <SunIcon v-if="themeStore.isDark" class="w-5 h-5" />
              <MoonIcon v-else class="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Password Change Loading Modal -->
    <div
      v-if="passwordChangeLoading"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="card max-w-sm mx-4">
        <div class="flex items-center space-x-3">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
          <p :class="themeStore.isDark ? 'text-white' : 'text-gray-900'">Redirecting to password change...</p>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="mb-6">
        <h2 class="text-lg font-semibold mb-2" :class="themeStore.isDark ? 'text-white' : 'text-gray-900'">
          Available Devices
        </h2>
      </div>

      <!-- Loading State -->
      <div v-if="devicesStore.loading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>

      <!-- Error State -->
      <div
        v-else-if="devicesStore.error"
        class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 dark:bg-red-900/20 dark:border-red-800"
      >
        <p class="text-red-600 dark:text-red-400">{{ devicesStore.error }}</p>
        <button @click="devicesStore.fetchDevices" class="btn-primary mt-2">Try Again</button>
      </div>

      <!-- Devices Grid -->
      <div v-else-if="devicesStore.devices.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="device in devicesStore.devices"
          :key="device.name"
          class="card hover:shadow-lg transition-shadow duration-200 cursor-pointer"
          @click="connectToDevice(device)"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center mb-2">
                <ComputerDesktopIcon class="w-6 h-6 text-primary-600 mr-2" />
                <h3 class="text-lg font-semibold" :class="themeStore.isDark ? 'text-white' : 'text-gray-900'">
                  {{ device.name }}
                </h3>
              </div>
              <p class="text-sm mb-2" :class="themeStore.isDark ? 'text-gray-400' : 'text-gray-600'">
                {{ device.ip }}:{{ device.port }}
              </p>
            </div>
            <ArrowTopRightOnSquareIcon class="w-5 h-5" :class="themeStore.isDark ? 'text-gray-500' : 'text-gray-400'" />
          </div>

          <div class="mt-4 pt-4 border-t" :class="themeStore.isDark ? 'border-gray-700' : 'border-gray-200'">
            <button class="w-full btn-primary">Connect</button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-12">
        <ComputerDesktopIcon
          class="w-12 h-12 mx-auto mb-4"
          :class="themeStore.isDark ? 'text-gray-600' : 'text-gray-400'"
        />
        <h3 class="text-lg font-medium mb-2" :class="themeStore.isDark ? 'text-white' : 'text-gray-900'">
          No devices available
        </h3>
        <p :class="themeStore.isDark ? 'text-gray-400' : 'text-gray-600'">No VNC devices are currently configured.</p>
      </div>
    </main>
  </div>
</template>

<script setup>
import { onMounted, computed, ref, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useDevicesStore } from '../stores/devices';
import { useThemeStore } from '../stores/theme';
import { useHealthStore } from '../stores/health';
import { useConfigStore } from '../stores/config';
import api from '../services/api';
import {
  ComputerDesktopIcon,
  ArrowTopRightOnSquareIcon,
  ArrowRightOnRectangleIcon,
  SunIcon,
  MoonIcon,
  UserIcon,
  ChevronDownIcon,
  KeyIcon,
} from '@heroicons/vue/24/outline';

const router = useRouter();
const authStore = useAuthStore();
const devicesStore = useDevicesStore();
const themeStore = useThemeStore();
const healthStore = useHealthStore();
const configStore = useConfigStore();

const showUserMenu = ref(false);
const userMenuRef = ref(null);
const passwordChangeLoading = ref(false);

const wireguardStatus = computed(() => {
  return healthStore.health?.environment?.wireguard?.status || 'unknown';
});

const wireguardStatusClass = computed(() => {
  switch (wireguardStatus.value) {
    case 'connected':
      return 'bg-green-500';
    case 'disconnected':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
});

const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value;
};

const handleClickOutside = (event) => {
  if (userMenuRef.value && !userMenuRef.value.contains(event.target)) {
    showUserMenu.value = false;
  }
};

const handleLogout = async () => {
  showUserMenu.value = false;
  await authStore.logout();
  router.push('/login');
};

const handlePasswordChange = async () => {
  showUserMenu.value = false;
  passwordChangeLoading.value = true;

  try {
    const response = await api.post('/auth/changepassword');
    const { redirectUrl } = response.data;

    // Open password change URL in a new window
    const passwordWindow = window.open(redirectUrl, '_blank', 'width=500,height=700,scrollbars=yes,resizable=yes');

    const checkClosed = setInterval(() => {
      if (passwordWindow.closed) {
        clearInterval(checkClosed);
        console.log('Password change window closed');
      }
    }, 1000);

    // Clean up the interval after 5 minutes
    setTimeout(() => clearInterval(checkClosed), 300000);
  } catch (error) {
    console.error('Password change error:', error);
    alert('Failed to initiate password change. Please try again.');
  } finally {
    passwordChangeLoading.value = false;
  }
};

const connectToDevice = async (device) => {
  const response = await api.get(`/vnc/connect/${device.path}`);
  const data = response.data;
  window.open(data.url, '_blank');
};

onMounted(() => {
  devicesStore.fetchDevices();
  healthStore.fetchHealth();
  configStore.fetchConfig();
  document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>
