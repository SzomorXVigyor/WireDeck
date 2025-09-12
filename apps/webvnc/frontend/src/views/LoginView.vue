<template>
  <div
    class="min-h-screen flex items-center justify-center px-4"
    :class="themeStore.isDark ? 'bg-gray-900' : 'bg-gray-100'"
  >
    <div class="max-w-md w-full space-y-8">
      <!-- Theme Toggle -->
      <div class="flex justify-end">
        <button
          @click="themeStore.toggleTheme"
          class="p-2 rounded-lg transition-colors"
          :class="
            themeStore.isDark
              ? 'text-gray-300 hover:text-white hover:bg-gray-800'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
          "
        >
          <SunIcon v-if="themeStore.isDark" class="w-5 h-5" />
          <MoonIcon v-else class="w-5 h-5" />
        </button>
      </div>

      <div class="card">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold mb-2" :class="themeStore.isDark ? 'text-white' : 'text-gray-900'">
            WireDeck WebVNC
          </h1>
          <p :class="themeStore.isDark ? 'text-gray-400' : 'text-gray-600'">Sign in to access your devices</p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-6">
          <div>
            <label
              for="username"
              class="block text-sm font-medium mb-2"
              :class="themeStore.isDark ? 'text-gray-300' : 'text-gray-700'"
            >
              Username
            </label>
            <input
              id="username"
              v-model="credentials.username"
              type="text"
              required
              class="input-field"
              placeholder="Enter your username"
              :disabled="authStore.loading"
            />
          </div>

          <div>
            <label
              for="password"
              class="block text-sm font-medium mb-2"
              :class="themeStore.isDark ? 'text-gray-300' : 'text-gray-700'"
            >
              Password
            </label>
            <input
              id="password"
              v-model="credentials.password"
              type="password"
              required
              class="input-field"
              placeholder="Enter your password"
              :disabled="authStore.loading"
            />
          </div>

          <div
            v-if="authStore.error"
            class="bg-red-50 border border-red-200 rounded-lg p-3 dark:bg-red-900/20 dark:border-red-800"
          >
            <p class="text-red-600 text-sm dark:text-red-400">
              {{ authStore.error }}
            </p>
          </div>

          <button
            type="submit"
            :disabled="authStore.loading"
            class="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="authStore.loading" class="flex items-center justify-center">
              <svg
                class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Signing in...
            </span>
            <span v-else>Sign in</span>
          </button>
        </form>

        <div class="mt-6 text-center">
          <p class="text-xs" :class="themeStore.isDark ? 'text-gray-500' : 'text-gray-500'">
            Secured by WireGuard • Powered by noVNC
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useThemeStore } from '../stores/theme';
import { SunIcon, MoonIcon } from '@heroicons/vue/24/outline';

const router = useRouter();
const authStore = useAuthStore();
const themeStore = useThemeStore();

const credentials = ref({
  username: '',
  password: '',
});

const handleLogin = async () => {
  const result = await authStore.login(credentials.value);
  if (result.success) router.push('/dashboard');
};
</script>
