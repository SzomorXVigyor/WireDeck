<template>
  <div class="min-h-screen" :class="themeStore.isDark ? 'bg-gray-900' : 'bg-gray-50'">
    <!-- Header -->
    <header :class="themeStore.isDark ? 'bg-gray-800 shadow-lg' : 'bg-white shadow-sm'">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-4">
          <div class="flex items-center">
            <h1 class="text-2xl font-bold" :class="themeStore.isDark ? 'text-white' : 'text-gray-900'">
              WireDeck WebVNC Dashboard
            </h1>
          </div>
          <div class="flex items-center space-x-4">
            <!-- WireGuard Status -->
            <div class="flex items-center space-x-2">
              <div :class="wireguardStatusClass" class="w-2 h-2 rounded-full"></div>
              <span class="text-sm" :class="themeStore.isDark ? 'text-gray-300' : 'text-gray-600'">
                WireGuard {{ wireguardStatus }}
              </span>
            </div>
            
            <span :class="themeStore.isDark ? 'text-gray-300' : 'text-gray-700'">
              Welcome, {{ authStore.user?.username }}
            </span>
            
            <!-- Theme Toggle -->
            <button
              @click="themeStore.toggleTheme"
              class="p-2 rounded-lg transition-colors"
              :class="themeStore.isDark ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'"
            >
              <SunIcon v-if="themeStore.isDark" class="w-5 h-5" />
              <MoonIcon v-else class="w-5 h-5" />
            </button>
            
            <button @click="handleLogout" class="btn-secondary flex items-center">
              <ArrowRightOnRectangleIcon class="w-4 h-4 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>

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
      <div v-else-if="devicesStore.error" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 dark:bg-red-900/20 dark:border-red-800">
        <p class="text-red-600 dark:text-red-400">{{ devicesStore.error }}</p>
        <button @click="devicesStore.fetchDevices" class="btn-primary mt-2">
          Try Again
        </button>
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
            <button class="w-full btn-primary">
              Connect
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-12">
        <ComputerDesktopIcon class="w-12 h-12 mx-auto mb-4" :class="themeStore.isDark ? 'text-gray-600' : 'text-gray-400'" />
        <h3 class="text-lg font-medium mb-2" :class="themeStore.isDark ? 'text-white' : 'text-gray-900'">
          No devices available
        </h3>
        <p :class="themeStore.isDark ? 'text-gray-400' : 'text-gray-600'">
          No VNC devices are currently configured.
        </p>
      </div>
    </main>
  </div>
</template>

<script setup>
import { onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useDevicesStore } from '../stores/devices'
import { useThemeStore } from '../stores/theme'
import { useHealthStore } from '../stores/health'
import {
  ComputerDesktopIcon,
  ArrowTopRightOnSquareIcon,
  ArrowRightOnRectangleIcon,
  SunIcon,
  MoonIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()
const authStore = useAuthStore()
const devicesStore = useDevicesStore()
const themeStore = useThemeStore()
const healthStore = useHealthStore()

const wireguardStatus = computed(() => {
  return healthStore.health?.environment?.wireguard?.status || 'unknown'
})

const wireguardStatusClass = computed(() => {
  switch (wireguardStatus.value) {
    case 'connected':
      return 'bg-green-500'
    case 'disconnected':
      return 'bg-red-500'
    default:
      return 'bg-gray-500'
  }
})

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

const connectToDevice = (device) => {
  // Include the JWT token in the URL as a query parameter for authentication
  const vncUrl = `/api/vnc/connect/${device.path}?autoconnect=1&reconnect=1&resize=scale&token=${authStore.token}`
  window.open(vncUrl, '_blank')
}

onMounted(() => {
  devicesStore.fetchDevices()
  healthStore.fetchHealth()
})
</script>