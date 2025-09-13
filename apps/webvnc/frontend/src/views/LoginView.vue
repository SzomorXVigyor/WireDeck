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
            <div class="relative">
              <input
                :type="showPassword ? 'text' : 'password'"
                id="password"
                v-model="credentials.password"
                required
                class="input-field pr-10"
                placeholder="Enter your password"
                :disabled="authStore.loading"
              />
              <button
                type="button"
                class="absolute inset-y-0 right-2 flex items-center text-gray-400 hover:text-gray-700"
                @click="showPassword = !showPassword"
                tabindex="-1"
                aria-label="Toggle password visibility"
              >
                <svg
                  v-if="showPassword"
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                <svg
                  v-else
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.955 9.955 0 012.293-3.95m1.706-1.706C7.732 7.057 9.797 6 12 6c4.478 0 8.268 2.943 9.542 7a9.959 9.959 0 01-4.572 5.569M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3l18 18" />
                </svg>
              </button>
            </div>
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

const showPassword = ref(false);

const handleLogin = async () => {
  const result = await authStore.login(credentials.value);
  if (result.success) router.push('/dashboard');
};
</script>
