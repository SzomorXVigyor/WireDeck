<template>
  <div class="p-6 md:p-8 max-w-2xl mx-auto">
    <!-- Page header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold tracking-tight" :class="themeStore.isDark ? 'text-white' : 'text-gray-900'">
        Profile
      </h1>
      <p class="mt-1 text-sm" :class="themeStore.isDark ? 'text-gray-400' : 'text-gray-500'">
        Manage your account settings
      </p>
    </div>

    <!-- Profile card -->
    <div
      class="rounded-xl border shadow-sm overflow-hidden"
      :class="themeStore.isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'"
    >
      <!-- Loading state -->
      <div v-if="loading" class="p-8 flex items-center justify-center">
        <svg
          class="animate-spin h-6 w-6"
          :class="themeStore.isDark ? 'text-gray-400' : 'text-gray-500'"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span class="ml-3 text-sm" :class="themeStore.isDark ? 'text-gray-400' : 'text-gray-500'">
          Loading profile…
        </span>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="p-8 text-center">
        <ExclamationTriangleIcon class="w-10 h-10 mx-auto mb-3 text-red-400" />
        <p class="text-sm text-red-500">{{ error }}</p>
        <button
          class="mt-4 px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-blue-600 hover:bg-blue-700 text-white"
          @click="fetchProfile"
        >
          Retry
        </button>
      </div>

      <!-- Profile content -->
      <template v-else-if="profile">
        <!-- Info rows -->
        <div class="divide-y" :class="themeStore.isDark ? 'divide-gray-700' : 'divide-gray-100'">
          <div class="px-6 py-4 flex items-center gap-3">
            <div
              class="w-9 h-9 rounded-lg flex items-center justify-center"
              :class="themeStore.isDark ? 'bg-gray-700' : 'bg-gray-100'"
            >
              <UserCircleIcon class="w-5 h-5" :class="themeStore.isDark ? 'text-gray-400' : 'text-gray-500'" />
            </div>
            <div>
              <p class="text-xs font-medium uppercase tracking-wider" :class="themeStore.isDark ? 'text-gray-500' : 'text-gray-400'">
                Username
              </p>
              <p class="text-sm font-medium" :class="themeStore.isDark ? 'text-gray-200' : 'text-gray-800'">
                {{ profile.username }}
              </p>
            </div>
          </div>

          <div class="px-6 py-4 flex items-center gap-3">
            <div
              class="w-9 h-9 rounded-lg flex items-center justify-center"
              :class="themeStore.isDark ? 'bg-gray-700' : 'bg-gray-100'"
            >
              <ShieldCheckIcon class="w-5 h-5" :class="themeStore.isDark ? 'text-gray-400' : 'text-gray-500'" />
            </div>
            <div>
              <p class="text-xs font-medium uppercase tracking-wider" :class="themeStore.isDark ? 'text-gray-500' : 'text-gray-400'">
                Role
              </p>
              <p class="text-sm font-medium capitalize" :class="themeStore.isDark ? 'text-gray-200' : 'text-gray-800'">
                {{ profile.role }}
              </p>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div
          class="px-6 py-5 border-t"
          :class="themeStore.isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-100 bg-gray-50/50'"
        >
          <button
            class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2"
            :class="
              themeStore.isDark
                ? 'bg-blue-600 hover:bg-blue-500 text-white focus:ring-blue-500 focus:ring-offset-gray-800'
                : 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 focus:ring-offset-white'
            "
            :disabled="changingPassword"
            @click="handleChangePassword"
          >
            <svg
              v-if="changingPassword"
              class="animate-spin -ml-0.5 h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <KeyIcon v-else class="w-4 h-4" />
            {{ changingPassword ? 'Opening…' : 'Change Password' }}
          </button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useThemeStore } from '../stores/theme';
import api from '../services/api';
import {
  UserCircleIcon,
  ShieldCheckIcon,
  KeyIcon,
  ExclamationTriangleIcon,
} from '@heroicons/vue/24/outline';

interface ProfileData {
  username: string;
  role: string;
}

const themeStore = useThemeStore();

const profile = ref<ProfileData | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const changingPassword = ref(false);

const fetchProfile = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await api.get<{ user: ProfileData }>('/auth/profile');
    profile.value = response.data.user;
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to load profile';
  } finally {
    loading.value = false;
  }
};

const handleChangePassword = async () => {
  changingPassword.value = true;
  try {
    const response = await api.post('/auth/changepassword');
    const { redirectUrl } = response.data;

    // Open password change URL in a new window
    const passwordWindow = window.open(redirectUrl, '_blank', 'width=500,height=700,scrollbars=yes,resizable=yes');

    const checkClosed = setInterval(() => {
      if (passwordWindow?.closed) {
        clearInterval(checkClosed);
        console.log('Password change window closed');
      }
    }, 1000);

    // Clean up the interval after 5 minutes
    setTimeout(() => clearInterval(checkClosed), 300000);
  } catch (err: any) {
    console.error('Password change error:', err);
    // Toast is already handled by the API interceptor
  } finally {
    changingPassword.value = false;
  }
};

onMounted(() => {
  fetchProfile();
});
</script>
