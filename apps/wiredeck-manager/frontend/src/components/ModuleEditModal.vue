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
            {{ moduleType === 'webVNC' ? 'WebVNC' : 'WebView' }} — {{ instance.name }}
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
        <form @submit.prevent="save" id="module-edit-form">
          <div class="px-5 py-4 space-y-5">
            <!-- Actions -->
            <div>
              <label
                class="block text-xs font-semibold uppercase tracking-wider mb-2"
                :class="dark ? 'text-gray-400' : 'text-gray-500'"
                >Actions</label
              >
              <div class="flex gap-2 flex-wrap">
                <button
                  type="button"
                  class="px-3 py-1.5 rounded text-xs font-medium text-white shadow-sm transition-colors"
                  :class="
                    moduleData?.status === 'running'
                      ? 'bg-orange-600 hover:bg-orange-700'
                      : 'bg-green-600 hover:bg-green-700'
                  "
                  :disabled="actionBusy"
                  @click="doAction(moduleData?.status === 'running' ? 'stop' : 'start')"
                >
                  {{ moduleData?.status === 'running' ? 'Stop' : 'Start' }}
                </button>
                <button
                  type="button"
                  class="px-3 py-1.5 rounded text-xs font-medium text-white shadow-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  :disabled="moduleData?.status !== 'running' || actionBusy"
                  @click="doAction('restart')"
                >
                  Restart
                </button>
                <button
                  type="button"
                  class="px-3 py-1.5 rounded text-xs font-medium text-white shadow-sm bg-gray-600 hover:bg-gray-700 transition-colors"
                  :disabled="actionBusy"
                  @click="doAction('recreate')"
                >
                  Recreate
                </button>
                <button
                  type="button"
                  class="px-3 py-1.5 rounded text-xs font-medium text-white shadow-sm bg-red-600 hover:bg-red-700 transition-colors"
                  :disabled="actionBusy"
                  @click="deleteModalOpen = true"
                >
                  Delete
                </button>
              </div>
            </div>

            <!-- Technical details — styled like instance details panel -->
            <div>
              <label
                class="block text-xs font-semibold uppercase tracking-wider mb-2"
                :class="dark ? 'text-gray-400' : 'text-gray-500'"
                >Technical Details</label
              >
              <div
                class="rounded-lg border p-3 grid grid-cols-2 gap-y-3 gap-x-4 text-xs"
                :class="
                  dark ? 'border-gray-700 bg-gray-900/50 text-gray-300' : 'border-gray-200 bg-white text-gray-700'
                "
              >
                <div>
                  <span class="font-semibold block mb-0.5 text-gray-500">Status</span>
                  <span
                    class="inline-flex items-center gap-1 font-medium"
                    :class="moduleData?.status === 'running' ? 'text-green-400' : 'text-red-400'"
                  >
                    <span
                      class="w-1.5 h-1.5 rounded-full inline-block"
                      :class="moduleData?.status === 'running' ? 'bg-green-500' : 'bg-red-500'"
                    />
                    {{ moduleData?.status ?? 'unknown' }}
                  </span>
                </div>
                <div>
                  <span class="font-semibold block mb-0.5 text-gray-500">Version</span>
                  <span class="font-mono">{{ moduleData?.version ?? 'N/A' }}</span>
                </div>
                <div>
                  <span class="font-semibold block mb-0.5 text-gray-500">Container local IPv4</span>
                  <span class="font-mono">{{ moduleData?.ipv4 ?? 'N/A' }}</span>
                </div>
                <div>
                  <span class="font-semibold block mb-0.5 text-gray-500">Domain</span>
                  <a
                    v-if="moduleData?.subdomain"
                    :href="'https://' + moduleData.subdomain"
                    target="_blank"
                    class="font-mono text-blue-400 hover:underline inline-flex items-center gap-0.5"
                  >
                    {{ moduleData.subdomain }}
                    <ArrowTopRightOnSquareIcon class="w-3 h-3" />
                  </a>
                  <span v-else class="font-mono">N/A</span>
                </div>
                <div>
                  <span class="font-semibold block mb-0.5 text-gray-500">Created</span>
                  <span class="font-mono">{{
                    moduleData?.createdAt ? new Date(moduleData.createdAt).toLocaleString() : 'N/A'
                  }}</span>
                </div>
                <div>
                  <span class="font-semibold block mb-0.5 text-gray-500">Updated</span>
                  <span class="font-mono">{{
                    moduleData?.updatedAt ? new Date(moduleData.updatedAt).toLocaleString() : 'N/A'
                  }}</span>
                </div>
              </div>
            </div>

            <!-- Users -->
            <div>
              <label class="block text-sm font-medium mb-2" :class="dark ? 'text-gray-300' : 'text-gray-700'">
                Login Users
              </label>
              <UserListEditor v-model="editUsers" :show-role="moduleType === 'webView'" :dark="dark" />
            </div>

            <!-- VNC Devices (WebVNC only) -->
            <div v-if="moduleType === 'webVNC'">
              <label class="block text-sm font-medium mb-2" :class="dark ? 'text-gray-300' : 'text-gray-700'">
                VNC Devices
              </label>
              <VncDeviceListEditor v-model="editDevices" :dark="dark" />
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
          form="module-edit-form"
          :disabled="saveBusy"
          class="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
        >
          <span v-if="saveBusy" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Save Changes
        </button>
      </div>
    </div>
  </div>

  <!-- Delete Confirmation Modal -->
  <DeleteConfirmModal
    v-if="deleteModalOpen"
    :title="`Delete ${moduleType === 'webVNC' ? 'WebVNC' : 'WebView'} Module`"
    :subject="instance.name"
    description="This operation will remove this module and all associated data."
    :busy="actionBusy"
    @confirm="executeDelete"
    @cancel="deleteModalOpen = false"
  />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { XMarkIcon, ComputerDesktopIcon, GlobeAltIcon, ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/outline';
import { useThemeStore } from '../stores/theme';
import { useToastStore } from '../stores/toast';
import UserListEditor from './UserListEditor.vue';
import VncDeviceListEditor from './VncDeviceListEditor.vue';
import DeleteConfirmModal from './DeleteConfirmModal.vue';
import { updateWebViewModule, updateWebVncModule, moduleAction, deleteModule } from '../services/instanceService';
import type { InstanceAction } from '../services/instanceService';
import type { Instance } from '../types/instance';
import type { CreateModuleUserDto, VncDevice } from '../types/module';

const props = defineProps<{
  moduleType: 'webVNC' | 'webView';
  instance: Instance;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'updated'): void;
}>();

const themeStore = useThemeStore();
const toastStore = useToastStore();
const dark = themeStore.isDark;

const moduleData = computed(() =>
  props.moduleType === 'webVNC' ? props.instance.modules?.webVNC : props.instance.modules?.webView
);

// Pre-fill from existing data — map ModuleUser → CreateModuleUserDto (password unknown, cleared)
const editUsers = ref<CreateModuleUserDto[]>(
  (moduleData.value?.loginUsers ?? []).map((u: any) => ({
    username: u.username,
    password: '',
    ...(u.role ? { role: u.role } : { role: 'user' }),
  }))
);

const editDevices = ref<VncDevice[]>(props.moduleType === 'webVNC' ? [...(moduleData.value?.vncDevices ?? [])] : []);

const saveBusy = ref(false);
const actionBusy = ref(false);
const deleteModalOpen = ref(false);

async function save() {
  saveBusy.value = true;
  try {
    if (props.moduleType === 'webView') {
      await updateWebViewModule(props.instance.id, { loginUsers: editUsers.value });
    } else {
      await updateWebVncModule(props.instance.id, {
        loginUsers: editUsers.value,
        vncDevices: editDevices.value,
      });
    }
    toastStore.push('Module updated', 'success');
    emit('updated');
  } catch (err: any) {
    toastStore.push(err.response?.data?.message || err.message || 'Error updating module', 'error');
  } finally {
    saveBusy.value = false;
  }
}

async function doAction(action: InstanceAction) {
  actionBusy.value = true;
  try {
    const data = await moduleAction(props.instance.id, props.moduleType, action);
    toastStore.push(data.message || `${action} triggered`, 'success');
    emit('updated');
  } catch (err: any) {
    toastStore.push(err.response?.data?.message || err.message || `Error: ${action}`, 'error');
  } finally {
    actionBusy.value = false;
  }
}

async function executeDelete() {
  actionBusy.value = true;
  try {
    const data = await deleteModule(props.instance.id, props.moduleType);
    toastStore.push(data.message || 'Module deleted', 'success');
    emit('updated');
    emit('close');
  } catch (err: any) {
    toastStore.push(err.response?.data?.message || err.message || 'Error deleting module', 'error');
  } finally {
    actionBusy.value = false;
    deleteModalOpen.value = false;
  }
}
</script>
