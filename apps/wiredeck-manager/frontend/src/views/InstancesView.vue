<template>
  <div class="p-4 md:p-6">
    <!-- -- Page header ---------------------------------------------------- -->
    <div class="mb-6 flex items-start justify-between gap-4 flex-wrap">
      <h1 class="text-2xl font-bold leading-tight" :class="themeStore.isDark ? 'text-white' : 'text-gray-900'">
        Instances
      </h1>
      <button
        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        @click="openCreateModal"
        :disabled="loading"
      >
        <PlusIcon class="w-4 h-4" />
        Add Instance
      </button>
    </div>

    <!-- -- Loading skeleton ----------------------------------------------- -->
    <div v-if="loading" class="space-y-2">
      <div
        v-for="i in 4"
        :key="i"
        class="h-12 rounded-xl animate-pulse"
        :class="themeStore.isDark ? 'bg-gray-700' : 'bg-gray-200'"
      />
    </div>

    <!-- -- Error ----------------------------------------------------------- -->
    <div
      v-else-if="error"
      class="rounded-xl border p-4 text-sm"
      :class="themeStore.isDark ? 'border-red-800 bg-red-900/20 text-red-400' : 'border-red-200 bg-red-50 text-red-600'"
    >
      {{ error }}
    </div>

    <!-- -- Empty state ----------------------------------------------------- -->
    <div v-else-if="instances.length === 0" class="flex flex-col items-center justify-center min-h-[40vh] gap-3">
      <ServerStackIcon class="w-14 h-14" :class="themeStore.isDark ? 'text-gray-600' : 'text-gray-300'" />
      <p class="text-sm font-medium" :class="themeStore.isDark ? 'text-gray-400' : 'text-gray-500'">
        No WireGuard instances found. Create one.
      </p>
    </div>

    <!-- -- Instance list ----------------------------------------------------- -->
    <div
      v-else
      class="rounded-xl border overflow-hidden flex flex-col"
      :class="themeStore.isDark ? 'border-gray-700' : 'border-gray-200'"
    >
      <!-- Table header -->
      <div
        class="grid items-center gap-3 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider border-b"
        :class="[
          themeStore.isDark
            ? 'bg-gray-800/80 border-gray-700 text-gray-400'
            : 'bg-gray-50 border-gray-200 text-gray-500',
          tableGridClass,
        ]"
      >
        <span>Name</span>
        <span class="hidden md:block">Local IPv4 Address</span>
        <span class="hidden md:block">Status</span>
        <span class="text-right">Actions</span>
      </div>

      <!-- Rows -->
      <template v-for="(instance, idx) in instances" :key="instance.id">
        <div
          class="grid items-center gap-3 px-4 py-3 text-sm border-b transition-colors cursor-pointer"
          :class="[
            idx % 2 === 0
              ? themeStore.isDark
                ? 'bg-gray-800/40'
                : 'bg-white'
              : themeStore.isDark
                ? 'bg-gray-800/70'
                : 'bg-gray-50',
            themeStore.isDark ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-100',
            tableGridClass,
          ]"
          @click="toggleInstanceDetails(instance.id)"
        >
          <div class="flex items-center gap-2">
            <span class="font-medium truncate" :class="themeStore.isDark ? 'text-white' : 'text-gray-900'">
              {{ instance.name || instance.id }}
            </span>
          </div>

          <span
            class="hidden md:block font-mono text-xs truncate"
            :class="themeStore.isDark ? 'text-gray-300' : 'text-gray-700'"
          >
            {{ instance.ipv4 }}
          </span>

          <span class="hidden md:block">
            <span
              class="text-xs font-medium px-1.5 py-0.5 rounded flex items-center w-max gap-1"
              :class="
                instance.status === 'running' || instance.status === 'online'
                  ? themeStore.isDark
                    ? 'bg-green-900/50 text-green-300'
                    : 'bg-green-100 text-green-700'
                  : themeStore.isDark
                    ? 'bg-red-900/50 text-red-300'
                    : 'bg-red-100 text-red-700'
              "
            >
              <div
                class="w-1.5 h-1.5 rounded-full"
                :class="instance.status === 'running' || instance.status === 'online' ? 'bg-green-500' : 'bg-red-500'"
              ></div>
              {{ instance.status === 'running' || instance.status === 'online' ? 'Online' : 'Offline' }}
            </span>
          </span>

          <div class="flex items-center justify-end gap-2" @click.stop>
            <ChevronDownIcon
              class="w-4 h-4 transition-transform"
              :class="[
                expandedInstanceId === instance.id ? 'rotate-180' : '',
                themeStore.isDark ? 'text-gray-400' : 'text-gray-500',
              ]"
            />
          </div>
        </div>

        <!-- Expanded Details -->
        <div
          v-if="expandedInstanceId === instance.id"
          class="px-4 py-3 border-b border-l-4"
          :class="[
            themeStore.isDark
              ? 'bg-gray-800/90 border-gray-700 border-l-blue-500'
              : 'bg-gray-50 border-gray-200 border-l-blue-500',
          ]"
        >
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Details for Modules -->
            <div class="space-y-4">
              <h4
                class="text-xs font-semibold uppercase tracking-wider"
                :class="themeStore.isDark ? 'text-gray-400' : 'text-gray-500'"
              >
                Modules
              </h4>

              <!-- WebVNC Module -->
              <div
                v-if="instance.modules?.webVNC"
                class="rounded-lg border p-3 flex flex-col gap-2"
                :class="themeStore.isDark ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-white'"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <ComputerDesktopIcon
                      class="w-4 h-4"
                      :class="themeStore.isDark ? 'text-gray-400' : 'text-gray-500'"
                    />
                    <span class="text-sm font-medium" :class="themeStore.isDark ? 'text-white' : 'text-gray-900'"
                      >WebVNC</span
                    >
                    <span
                      class="text-xs px-1.5 py-0.5 rounded-full"
                      :class="
                        instance.modules.webVNC.status === 'running'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      "
                      >{{ instance.modules.webVNC.status }}</span
                    >
                  </div>
                  <button
                    @click.stop="openEditModule(instance, 'webVNC')"
                    class="text-xs text-blue-500 hover:text-blue-600 font-medium"
                  >
                    Manage
                  </button>
                </div>
                <div class="flex gap-4 text-xs" :class="themeStore.isDark ? 'text-gray-400' : 'text-gray-500'">
                  <span
                    >Users
                    <span class="font-semibold" :class="themeStore.isDark ? 'text-gray-200' : 'text-gray-700'">{{
                      instance.modules.webVNC.loginUsers?.length ?? 0
                    }}</span></span
                  >
                  <span
                    >Devices
                    <span class="font-semibold" :class="themeStore.isDark ? 'text-gray-200' : 'text-gray-700'">{{
                      instance.modules.webVNC.vncDevices?.length ?? 0
                    }}</span></span
                  >
                  <a
                    v-if="instance.modules.webVNC.subdomain"
                    :href="'https://' + instance.modules.webVNC.subdomain"
                    target="_blank"
                    class="text-blue-500 hover:underline flex items-center gap-0.5"
                  >
                    {{ instance.modules.webVNC.subdomain }}
                    <ArrowTopRightOnSquareIcon class="w-3 h-3" />
                  </a>
                </div>
              </div>
              <div
                v-else
                class="text-xs text-gray-500 flex items-center justify-between border rounded-lg p-3"
                :class="themeStore.isDark ? 'border-gray-700 bg-gray-900/30' : 'border-gray-200 bg-gray-50'"
              >
                <span class="italic">No WebVNC module active.</span>
                <button
                  @click.stop="openCreateModule(instance, 'webVNC')"
                  class="text-blue-500 hover:text-blue-600 font-medium px-2 py-1 bg-blue-500/10 rounded hover:bg-blue-500/20 transition-colors"
                >
                  Create WebVNC
                </button>
              </div>

              <!-- WebView Module -->
              <div
                v-if="instance.modules?.webView"
                class="rounded-lg border p-3 flex flex-col gap-2"
                :class="themeStore.isDark ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-white'"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <GlobeAltIcon class="w-4 h-4" :class="themeStore.isDark ? 'text-gray-400' : 'text-gray-500'" />
                    <span class="text-sm font-medium" :class="themeStore.isDark ? 'text-white' : 'text-gray-900'"
                      >WebView</span
                    >
                    <span
                      class="text-xs px-1.5 py-0.5 rounded-full"
                      :class="
                        instance.modules.webView.status === 'running'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      "
                      >{{ instance.modules.webView.status }}</span
                    >
                  </div>
                  <button
                    @click.stop="openEditModule(instance, 'webView')"
                    class="text-xs text-blue-500 hover:text-blue-600 font-medium"
                  >
                    Manage
                  </button>
                </div>
                <div class="flex gap-4 text-xs" :class="themeStore.isDark ? 'text-gray-400' : 'text-gray-500'">
                  <span
                    >Users
                    <span class="font-semibold" :class="themeStore.isDark ? 'text-gray-200' : 'text-gray-700'">{{
                      instance.modules.webView.loginUsers?.length ?? 0
                    }}</span></span
                  >
                  <a
                    v-if="instance.modules.webView.subdomain"
                    :href="'https://' + instance.modules.webView.subdomain"
                    target="_blank"
                    class="text-blue-500 hover:underline flex items-center gap-0.5"
                  >
                    {{ instance.modules.webView.subdomain }}
                    <ArrowTopRightOnSquareIcon class="w-3 h-3" />
                  </a>
                </div>
              </div>
              <div
                v-else
                class="text-xs text-gray-500 flex items-center justify-between border rounded-lg p-3"
                :class="themeStore.isDark ? 'border-gray-700 bg-gray-900/30' : 'border-gray-200 bg-gray-50'"
              >
                <span class="italic">No WebView module active.</span>
                <button
                  @click.stop="openCreateModule(instance, 'webView')"
                  class="text-blue-500 hover:text-blue-600 font-medium px-2 py-1 bg-blue-500/10 rounded hover:bg-blue-500/20 transition-colors"
                >
                  Create WebView
                </button>
              </div>

              <div class="space-y-4 pt-2">
                <h4
                  class="text-xs font-semibold uppercase tracking-wider"
                  :class="themeStore.isDark ? 'text-gray-400' : 'text-gray-500'"
                >
                  Controls
                </h4>
                <div class="flex gap-2 flex-wrap mb-4">
                  <button
                    class="px-3 py-1.5 rounded text-xs font-medium text-white shadow-sm"
                    :class="
                      instance.status === 'running' || instance.status === 'online'
                        ? 'bg-orange-600 hover:bg-orange-700'
                        : 'bg-green-600 hover:bg-green-700'
                    "
                    @click="
                      handleAction(
                        instance.status === 'running' || instance.status === 'online' ? 'stop' : 'start',
                        instance.id
                      )
                    "
                  >
                    {{ instance.status === 'running' || instance.status === 'online' ? 'Stop' : 'Start' }}
                  </button>
                  <button
                    class="px-3 py-1.5 rounded text-xs font-medium text-white shadow-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    :disabled="!(instance.status === 'running' || instance.status === 'online')"
                    @click="handleAction('restart', instance.id)"
                  >
                    Restart
                  </button>
                  <button
                    class="px-3 py-1.5 rounded text-xs font-medium text-white shadow-sm bg-gray-600 hover:bg-gray-700"
                    @click="handleAction('recreate', instance.id)"
                  >
                    Recreate
                  </button>
                  <button
                    class="px-3 py-1.5 rounded text-xs font-medium text-white shadow-sm bg-red-600 hover:bg-red-700 flex items-center gap-1.5"
                    @click="handleDelete(instance)"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>

            <div
              class="mt-4 md:mt-0 md:border-l md:pl-4"
              :class="themeStore.isDark ? 'border-gray-700' : 'border-gray-200'"
            >
              <h4
                class="text-xs font-semibold uppercase tracking-wider mb-3"
                :class="themeStore.isDark ? 'text-gray-400' : 'text-gray-500'"
              >
                Technical Details
              </h4>
              <div
                class="rounded-lg border p-3 grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4 text-xs"
                :class="
                  themeStore.isDark
                    ? 'border-gray-700 bg-gray-900/50 text-gray-300'
                    : 'border-gray-200 bg-white text-gray-700'
                "
              >
                <div class="col-span-full">
                  <span class="font-semibold block mb-0.5 text-gray-500">ID</span>
                  <span class="font-mono break-all">{{ instance.id }}</span>
                </div>
                <div class="col-span-full">
                  <span class="font-semibold block mb-0.5 text-gray-500">Domain</span>
                  <a
                    v-if="instance.subdomain"
                    :href="'https://' + instance.subdomain"
                    target="_blank"
                    class="font-mono break-all text-blue-500 hover:underline inline-flex items-center gap-1 group"
                  >
                    {{ instance.subdomain }}
                    <ArrowTopRightOnSquareIcon
                      class="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </a>
                  <span v-else class="font-mono break-all">N/A</span>
                </div>
                <div>
                  <span class="font-semibold block mb-0.5 text-gray-500">Container local IPv4</span>
                  <span class="font-mono">{{ instance.ipv4 || 'N/A' }}</span>
                </div>
                <div>
                  <span class="font-semibold block mb-0.5 text-gray-500">Public Port</span>
                  <span class="font-mono">{{ instance.publicPort || 'N/A' }}</span>
                </div>
                <div>
                  <span class="font-semibold block mb-0.5 text-gray-500">Internal CIDR</span>
                  <span class="font-mono">{{ instance.internal_ipv4Cidr || 'N/A' }}</span>
                </div>
                <div>
                  <span class="font-semibold block mb-0.5 text-gray-500">Created At</span>
                  <span class="font-mono">{{
                    instance.createdAt ? new Date(instance.createdAt).toLocaleString() : 'N/A'
                  }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Instance Create Modal -->
    <InstanceCreateModal v-if="showCreateModal" @close="showCreateModal = false" @created="onInstanceCreated" />

    <!-- Module Create Modal -->
    <ModuleCreateModal
      v-if="moduleCreateTarget"
      :module-type="moduleCreateTarget.type"
      :instance="moduleCreateTarget.instance"
      @close="moduleCreateTarget = null"
      @created="onModuleCreated"
    />

    <!-- Module Edit Modal -->
    <ModuleEditModal
      v-if="moduleEditTarget"
      :module-type="moduleEditTarget.type"
      :instance="moduleEditTarget.instance"
      @close="moduleEditTarget = null"
      @updated="onModuleUpdated"
    />

    <!-- Instance Delete Confirmation Modal -->
    <DeleteConfirmModal
      v-if="deleteTarget"
      title="Delete Instance"
      :subject="deleteTarget.name || deleteTarget.id"
      description="This operation will remove the entire VPN service and wipe all connected modules. Your configured remote-access devices will become unreachable."
      :busy="deleting"
      @confirm="executeDelete"
      @cancel="deleteTarget = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useThemeStore } from '../stores/theme';
import { useToastStore } from '../stores/toast';
import type { Instance } from '../types/api';
import type { InstanceAction, ModuleType } from '../services/instanceService';
import { fetchInstances as apiFetchInstances, deleteInstance, instanceAction } from '../services/instanceService';
import InstanceCreateModal from '../components/InstanceCreateModal.vue';
import ModuleCreateModal from '../components/ModuleCreateModal.vue';
import ModuleEditModal from '../components/ModuleEditModal.vue';
import DeleteConfirmModal from '../components/DeleteConfirmModal.vue';
import {
  PlusIcon,
  ServerStackIcon,
  ChevronDownIcon,
  ComputerDesktopIcon,
  GlobeAltIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/vue/24/outline';

const themeStore = useThemeStore();
const toastStore = useToastStore();

const tableGridClass = 'grid-cols-[1fr_auto_100px] md:grid-cols-[2fr_1.5fr_100px_100px]';

const loading = ref(false);
const error = ref('');
const instances = ref<Instance[]>([]);
const expandedInstanceId = ref<string | null>(null);

const showCreateModal = ref(false);

// Module modal state
type ModuleTarget = { instance: Instance; type: ModuleType };
const moduleCreateTarget = ref<ModuleTarget | null>(null);
const moduleEditTarget = ref<ModuleTarget | null>(null);

// Delete confirmation state
const deleteTarget = ref<Instance | null>(null);
const deleting = ref(false);

const toggleInstanceDetails = (id: string) => {
  expandedInstanceId.value = expandedInstanceId.value === id ? null : id;
};

const openCreateModal = () => {
  showCreateModal.value = true;
};

const onInstanceCreated = async () => {
  showCreateModal.value = false;
  await fetchInstances();
};

const openCreateModule = (instance: Instance, type: ModuleType) => {
  moduleCreateTarget.value = { instance, type };
};

const openEditModule = (instance: Instance, type: ModuleType) => {
  moduleEditTarget.value = { instance, type };
};

const onModuleCreated = async () => {
  moduleCreateTarget.value = null;
  await fetchInstances();
};

const onModuleUpdated = async () => {
  await fetchInstances();
};

const fetchInstances = async () => {
  loading.value = true;
  error.value = '';
  try {
    instances.value = await apiFetchInstances();
  } catch (err: any) {
    error.value = err.response?.data?.message || err.message || 'Error loading instances';
  } finally {
    loading.value = false;
  }
};

const handleDelete = (instance: Instance) => {
  deleteTarget.value = instance;
};

const executeDelete = async () => {
  if (!deleteTarget.value) return;
  deleting.value = true;
  try {
    const data = await deleteInstance(deleteTarget.value.id);
    toastStore.push(data.message || `Deleted instance ${deleteTarget.value.name || deleteTarget.value.id}`, 'success');
    if (expandedInstanceId.value === deleteTarget.value.id) expandedInstanceId.value = null;
    await fetchInstances();
  } catch (err: any) {
    toastStore.push(err.response?.data?.message || err.message || 'Error deleting instance', 'error');
  } finally {
    deleting.value = false;
    deleteTarget.value = null;
  }
};

const handleAction = async (action: InstanceAction, instanceId: string) => {
  try {
    const data = await instanceAction(action, instanceId);
    toastStore.push(data.message || `Successfully triggered ${action} on ${instanceId}`, 'success');
    await fetchInstances();
  } catch (err: any) {
    toastStore.push(err.response?.data?.message || err.message || `Error with action ${action}`, 'error');
  }
};

onMounted(() => {
  fetchInstances();
});
</script>
