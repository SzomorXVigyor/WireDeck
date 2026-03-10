<template>
  <div class="p-4 md:p-6">
    <!-- ── Page header ──────────────────────────────────────────────────── -->
    <div class="mb-6 flex items-start justify-between gap-4 flex-wrap">
      <h1 class="text-2xl font-bold leading-tight" :class="themeStore.isDark ? 'text-white' : 'text-gray-900'">
        Devices
      </h1>
      <button
        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700"
        @click="openCreateModal"
      >
        <PlusIcon class="w-4 h-4" />
        Add Device
      </button>
    </div>

    <!-- ── Loading skeleton ─────────────────────────────────────────────── -->
    <div v-if="devicesStore.loading" class="space-y-2">
      <div
        v-for="i in 4"
        :key="i"
        class="h-12 rounded-xl animate-pulse"
        :class="themeStore.isDark ? 'bg-gray-700' : 'bg-gray-200'"
      />
    </div>

    <!-- ── Error ─────────────────────────────────────────────────────────── -->
    <div
      v-else-if="devicesStore.error"
      class="rounded-xl border p-4 text-sm"
      :class="themeStore.isDark ? 'border-red-800 bg-red-900/20 text-red-400' : 'border-red-200 bg-red-50 text-red-600'"
    >
      {{ devicesStore.error }}
    </div>

    <!-- ── Empty state ───────────────────────────────────────────────────── -->
    <div
      v-else-if="devicesStore.devices.length === 0"
      class="flex flex-col items-center justify-center min-h-[40vh] gap-3"
    >
      <ServerStackIcon class="w-14 h-14" :class="themeStore.isDark ? 'text-gray-600' : 'text-gray-300'" />
      <p class="text-sm font-medium" :class="themeStore.isDark ? 'text-gray-400' : 'text-gray-500'">
        No devices defined yet.
      </p>
    </div>

    <!-- ── Device list ───────────────────────────────────────────────────── -->
    <div
      v-else
      class="rounded-xl border overflow-hidden"
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
        <span class="hidden md:block">ID</span>
        <span>Name</span>
        <span class="hidden md:block">Protocol</span>
        <span class="hidden md:block">IP address</span>
        <span class="hidden md:block">Port</span>
        <span class="md:hidden">Address</span>
        <span class="text-right">Actions</span>
      </div>

      <!-- Rows -->
      <div
        v-for="(device, idx) in devicesStore.devices"
        :key="device.id"
        class="grid items-center gap-3 px-4 py-3 text-sm border-b last:border-0 transition-colors"
        :class="[
          idx % 2 === 0
            ? themeStore.isDark
              ? 'bg-gray-800/40'
              : 'bg-white'
            : themeStore.isDark
              ? 'bg-gray-800/70'
              : 'bg-gray-50',
          themeStore.isDark ? 'border-gray-700' : 'border-gray-200',
          tableGridClass,
        ]"
      >
        <span class="hidden md:block font-mono text-xs" :class="themeStore.isDark ? 'text-gray-400' : 'text-gray-500'">
          {{ device.id }}
        </span>
        <span class="font-medium truncate" :class="themeStore.isDark ? 'text-white' : 'text-gray-900'">
          {{ device.name }}
        </span>
        <span class="hidden md:block">
          <span
            class="text-xs font-medium px-1.5 py-0.5 rounded"
            :class="themeStore.isDark ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-700'"
          >
            {{ device.protocol }}
          </span>
        </span>
        <span
          class="hidden md:block font-mono text-xs truncate"
          :class="themeStore.isDark ? 'text-gray-300' : 'text-gray-700'"
        >
          {{ device.ip }}
        </span>
        <span class="hidden md:block font-mono text-xs" :class="themeStore.isDark ? 'text-gray-300' : 'text-gray-700'">
          {{ device.port }}
        </span>
        <span
          class="md:hidden font-mono text-xs truncate"
          :class="themeStore.isDark ? 'text-gray-300' : 'text-gray-700'"
        >
          {{ device.ip }}:{{ device.port }}
        </span>
        <div class="flex items-center justify-end gap-1">
          <button
            class="p-1.5 rounded-lg transition-colors"
            :class="
              themeStore.isDark
                ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            "
            title="Edit device"
            @click="openEditModal(device)"
          >
            <PencilIcon class="w-4 h-4" />
          </button>
          <button
            class="p-1.5 rounded-lg transition-colors"
            :class="
              themeStore.isDark
                ? 'text-red-400 hover:text-red-300 hover:bg-red-900/30'
                : 'text-red-500 hover:text-red-700 hover:bg-red-50'
            "
            title="Delete device"
            @click="handleDelete(device)"
          >
            <TrashIcon class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- ── Modal ─────────────────────────────────────────────────────────── -->
    <EditDeviceModal v-model="showModal" :device="editingDevice" @set="handleSet" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useThemeStore } from '../stores/theme';
import { useDevicesStore } from '../stores/devices';
import EditDeviceModal from '../components/EditDeviceModal.vue';
import { PlusIcon, PencilIcon, TrashIcon, ServerStackIcon } from '@heroicons/vue/24/outline';
import type { Device } from '../types/device';

const themeStore = useThemeStore();
const devicesStore = useDevicesStore();

// ── Modal state ───────────────────────────────────────────────────────────────

const showModal = ref(false);
const editingDevice = ref<Device | null>(null);

// ── Layout ────────────────────────────────────────────────────────────────────

// Mobile: Name | IP:Port | Actions (3 cols)
// Desktop: ID | Name | Protocol | IP | Port | Actions (6 cols)
const tableGridClass = 'grid-cols-[1fr_9rem_5rem] md:grid-cols-[3.5rem_1fr_8rem_11rem_5rem_6rem]';

// ── Handlers ──────────────────────────────────────────────────────────────────

const openCreateModal = () => {
  editingDevice.value = null;
  showModal.value = true;
};

const openEditModal = (device: Device) => {
  editingDevice.value = device;
  showModal.value = true;
};

const handleSet = async (device: Device) => {
  try {
    if (device.id === 0) {
      const { id: _id, ...data } = device;
      await devicesStore.createDevice(data);
    } else {
      const { id, ...data } = device;
      await devicesStore.updateDevice(id, data);
    }
  } catch {
    // error already surfaced in store
  }
};

const handleDelete = async (device: Device) => {
  if (!confirm(`Delete device "${device.name}"?\nThis cannot be undone.`)) return;
  try {
    await devicesStore.deleteDevice(device.id);
  } catch {
    // error already surfaced in store
  }
};

// ── Lifecycle ─────────────────────────────────────────────────────────────────

onMounted(async () => {
  await devicesStore.fetchDevices();
});
</script>
