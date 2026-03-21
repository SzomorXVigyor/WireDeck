<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
    @click.self="$emit('close')"
  >
    <div
      class="rounded-xl w-full max-w-md overflow-hidden shadow-xl"
      :class="dark ? 'bg-gray-800 border border-gray-700' : 'bg-white'"
    >
      <!-- Header -->
      <div class="p-4 border-b flex justify-between items-center" :class="dark ? 'border-gray-700' : 'border-gray-200'">
        <h3 class="text-lg font-semibold" :class="dark ? 'text-white' : 'text-gray-900'">Add WireGuard Instance</h3>
        <button
          @click="$emit('close')"
          :class="dark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'"
        >
          <XMarkIcon class="w-5 h-5" />
        </button>
      </div>

      <!-- Form -->
      <form @submit.prevent="submit">
        <div class="p-4 space-y-4">
          <!-- Name -->
          <div>
            <label class="block text-sm font-medium mb-1" :class="dark ? 'text-gray-300' : 'text-gray-700'">
              Name <span class="text-red-400">*</span>
            </label>
            <input
              v-model="form.name"
              type="text"
              required
              placeholder="e.g. my-wg-network"
              class="w-full rounded-lg px-3 py-2 text-sm border focus:ring-2 outline-none transition-shadow"
              :class="inputCls"
            />
            <p v-if="form.name" class="mt-1 text-xs" :class="dark ? 'text-gray-500' : 'text-gray-400'">
              Will be sanitized to:
              <span class="font-mono font-semibold" :class="dark ? 'text-gray-300' : 'text-gray-600'">
                {{ sanitizeName(form.name) }}
              </span>
            </p>
          </div>

          <!-- Subnet CIDR -->
          <div>
            <label class="block text-sm font-medium mb-1" :class="dark ? 'text-gray-300' : 'text-gray-700'">
              Subnet CIDR
            </label>
            <input
              v-model="form.cidr"
              type="text"
              placeholder="172.21.0.0/24"
              class="w-full rounded-lg px-3 py-2 text-sm border focus:ring-2 outline-none transition-shadow"
              :class="[
                inputCls,
                form.cidr && !validCidr ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : '',
              ]"
            />
            <p v-if="form.cidr && !validCidr" class="mt-1 text-xs text-red-400">
              Invalid subnet format (e.g. 172.21.0.0/24)
            </p>
            <p v-else class="mt-1 text-xs" :class="dark ? 'text-amber-500/80' : 'text-amber-600'">
              Leave empty to use default (172.21.0.0/24). Only change if necessary.
            </p>
          </div>

          <!-- Admin credentials -->
          <div class="space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium mb-1" :class="dark ? 'text-gray-300' : 'text-gray-700'">
                  Admin Username <span class="text-red-400">*</span>
                </label>
                <input
                  v-model="form.username"
                  type="text"
                  required
                  placeholder="admin"
                  class="w-full rounded-lg px-3 py-2 text-sm border focus:ring-2 outline-none transition-shadow"
                  :class="inputCls"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1" :class="dark ? 'text-gray-300' : 'text-gray-700'">
                  Admin Password <span class="text-red-400">*</span>
                </label>
                <input
                  v-model="form.password"
                  type="password"
                  required
                  placeholder="••••••••••••"
                  class="w-full rounded-lg px-3 py-2 text-sm border focus:ring-2 outline-none transition-shadow"
                  :class="[
                    inputCls,
                    form.password && !validPassword ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : '',
                  ]"
                />
                <p v-if="form.password && !validPassword" class="mt-0.5 text-xs text-red-400">
                  Must be 12-64 characters
                </p>
              </div>
            </div>

            <!-- Credential loss warning -->
            <div
              class="rounded-lg px-3 py-2 text-xs flex gap-2 items-start"
              :class="
                dark
                  ? 'bg-red-900/20 border border-red-800/50 text-red-300'
                  : 'bg-red-50 border border-red-200 text-red-700'
              "
            >
              <span>
                If you lose your admin credentials, you will have to
                <strong>recreate the instance</strong> and lose connected devices.
              </span>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div
          class="p-4 border-t flex justify-end gap-2"
          :class="dark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'"
        >
          <button
            type="button"
            @click="$emit('close')"
            class="px-4 py-2 text-sm font-medium rounded-lg transition-colors border"
            :class="
              dark
                ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-100'
            "
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="busy || !isValid"
            class="px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-blue-600 text-white hover:bg-blue-700 items-center flex gap-2 disabled:opacity-50"
          >
            <span v-if="busy" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Create
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { XMarkIcon } from '@heroicons/vue/24/outline';
import { useThemeStore } from '../stores/theme';
import { useToastStore } from '../stores/toast';
import { createInstance } from '../services/instanceService';
import type { CreateInstanceDto } from '../types/instance';

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'created'): void;
}>();

const themeStore = useThemeStore();
const toastStore = useToastStore();
const dark = themeStore.isDark;

const inputCls = computed(() =>
  dark
    ? 'bg-gray-900 border-gray-700 text-white focus:border-blue-500 focus:ring-blue-500/20'
    : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500/20'
);

const form = ref<CreateInstanceDto>({
  name: '',
  cidr: '',
  username: '',
  password: '',
});

const busy = ref(false);

function sanitizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\-_]/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

const validCidr = computed(() => {
  const v = form.value.cidr;
  if (!v) return true;
  const [ip, prefix] = v.split('/');

  return (
    v.split('/').length === 2 &&
    /^(\b25[0-5]|\b2[0-4][0-9]|\b[01]?[0-9][0-9]?)(\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/.test(ip) &&
    /^\d+$/.test(prefix) &&
    Number(prefix) >= 0 &&
    Number(prefix) <= 32
  );
});

const validPassword = computed(() => {
  const p = form.value.password;
  return p.length >= 12 && p.length <= 64;
});

const isValid = computed(
  () => form.value.name.trim() !== '' && form.value.username.trim() !== '' && validPassword.value && validCidr.value
);

async function submit() {
  if (!isValid.value) return;
  busy.value = true;
  try {
    const payload: CreateInstanceDto = {
      name: form.value.name,
      username: form.value.username,
      password: form.value.password,
      ...(form.value.cidr ? { cidr: form.value.cidr } : {}),
    };
    const data = await createInstance(payload);
    toastStore.push(data.message || 'Instance created successfully', 'success');
    emit('created');
    emit('close');
  } catch (err: any) {
    toastStore.push(err.response?.data?.message || err.message || 'Error creating instance', 'error');
  } finally {
    busy.value = false;
  }
}
</script>
