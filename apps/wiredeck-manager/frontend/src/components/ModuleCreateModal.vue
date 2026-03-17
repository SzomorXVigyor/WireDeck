<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    @click.self="$emit('close')"
  >
    <div
      class="rounded-xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      :class="dark ? 'bg-gray-800 border border-gray-700' : 'bg-white'"
    >
      <!-- Header -->
      <div
        class="px-5 py-4 border-b flex items-center justify-between shrink-0"
        :class="dark ? 'border-gray-700' : 'border-gray-200'"
      >
        <div class="flex items-center gap-2">
          <component :is="moduleType === 'webVNC' ? ComputerDesktopIcon : GlobeAltIcon" class="w-5 h-5 text-blue-500" />
          <h3 class="text-base font-semibold" :class="dark ? 'text-white' : 'text-gray-900'">
            Create {{ moduleType === 'webVNC' ? 'WebVNC' : 'WebView' }} Module
          </h3>
        </div>
        <button
          @click="$emit('close')"
          :class="dark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'"
        >
          <XMarkIcon class="w-5 h-5" />
        </button>
      </div>

      <!-- Body -->
      <div class="overflow-y-auto flex-1">
        <form @submit.prevent="submit" id="module-create-form">
          <div class="px-5 py-4 space-y-5">
            <!-- WireGuard Config File -->
            <div>
              <label class="block text-sm font-medium mb-1.5" :class="dark ? 'text-gray-300' : 'text-gray-700'">
                WireGuard Config <span class="text-red-400">*</span>
              </label>
              <label
                class="flex flex-col items-center justify-center gap-2 w-full h-24 border-2 border-dashed rounded-xl cursor-pointer transition-colors"
                :class="[
                  dark
                    ? 'border-gray-600 hover:border-blue-500 bg-gray-900/40'
                    : 'border-gray-300 hover:border-blue-400 bg-gray-50',
                  configFileName ? (dark ? 'border-green-600' : 'border-green-400') : '',
                ]"
              >
                <ArrowUpTrayIcon
                  class="w-6 h-6"
                  :class="configFileName ? 'text-green-500' : dark ? 'text-gray-500' : 'text-gray-400'"
                />
                <span class="text-xs" :class="dark ? 'text-gray-400' : 'text-gray-500'">
                  {{ configFileName || 'Click to upload .conf file' }}
                </span>
                <input type="file" accept=".conf" class="hidden" @change="onConfigFile" />
              </label>
            </div>

            <!-- Users -->
            <div>
              <label class="block text-sm font-medium mb-2" :class="dark ? 'text-gray-300' : 'text-gray-700'">
                Login Users
              </label>
              <UserListEditor v-model="form.loginUsers" :show-role="moduleType === 'webView'" :dark="dark" />
            </div>

            <!-- VNC Devices (WebVNC only) -->
            <div v-if="moduleType === 'webVNC'">
              <label class="block text-sm font-medium mb-2" :class="dark ? 'text-gray-300' : 'text-gray-700'">
                VNC Devices
              </label>
              <VncDeviceListEditor v-model="vncDevices" :dark="dark" />
            </div>
          </div>
        </form>
      </div>

      <!-- Footer -->
      <div
        class="px-5 py-3 border-t flex justify-end gap-2 shrink-0"
        :class="dark ? 'border-gray-700 bg-gray-800/60' : 'border-gray-200 bg-gray-50'"
      >
        <button
          type="button"
          @click="$emit('close')"
          class="px-4 py-2 text-sm font-medium rounded-lg border transition-colors"
          :class="
            dark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'
          "
        >
          Cancel
        </button>
        <button
          type="submit"
          form="module-create-form"
          :disabled="submitting || !form.wireguardConfig"
          class="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
        >
          <span v-if="submitting" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Create
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { XMarkIcon, ArrowUpTrayIcon, ComputerDesktopIcon, GlobeAltIcon } from '@heroicons/vue/24/outline';
import { useThemeStore } from '../stores/theme';
import { useToastStore } from '../stores/toast';
import UserListEditor from './UserListEditor.vue';
import VncDeviceListEditor from './VncDeviceListEditor.vue';
import { createWebViewModule, createWebVncModule } from '../services/instanceService';
import type { Instance } from '../types/instance';
import type { CreateModuleUserDto, VncDevice } from '../types/module';

const props = defineProps<{
  moduleType: 'webVNC' | 'webView';
  instance: Instance;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'created'): void;
}>();

const themeStore = useThemeStore();
const toastStore = useToastStore();
const dark = themeStore.isDark;

const configFileName = ref('');
const submitting = ref(false);

const form = reactive<{
  wireguardConfig: string;
  loginUsers: CreateModuleUserDto[];
}>({
  wireguardConfig: '',
  loginUsers: [],
});

const vncDevices = ref<VncDevice[]>([]);

function onConfigFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  configFileName.value = file.name;
  const reader = new FileReader();
  reader.onload = (ev) => {
    form.wireguardConfig = (ev.target?.result as string) ?? '';
  };
  reader.readAsText(file);
}

async function submit() {
  if (!form.wireguardConfig) return;
  submitting.value = true;
  try {
    if (props.moduleType === 'webView') {
      await createWebViewModule(props.instance.id, {
        wireguardConfig: form.wireguardConfig,
        loginUsers: form.loginUsers.length ? form.loginUsers : undefined,
      });
    } else {
      await createWebVncModule(props.instance.id, {
        wireguardConfig: form.wireguardConfig,
        loginUsers: form.loginUsers,
        vncDevices: vncDevices.value,
      });
    }
    toastStore.push(`${props.moduleType} module created`, 'success');
    emit('created');
  } catch (err: any) {
    toastStore.push(err.response?.data?.message || err.message || 'Error creating module', 'error');
  } finally {
    submitting.value = false;
  }
}
</script>
