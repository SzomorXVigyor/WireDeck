<template>
  <div class="p-4 md:p-6">
    <!-- ── Page header ──────────────────────────────────────────────────── -->
    <div class="mb-6 flex items-start justify-between gap-4 flex-wrap">
      <h1 class="text-2xl font-bold leading-tight" :class="themeStore.isDark ? 'text-white' : 'text-gray-900'">
        Notifications
      </h1>
      <button
        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700"
        @click="openCreateModal"
      >
        <PlusIcon class="w-4 h-4" />
        Add notification
      </button>
    </div>

    <!-- ── Loading skeleton ─────────────────────────────────────────────── -->
    <div v-if="notificationsStore.loading" class="space-y-2">
      <div
        v-for="i in 5"
        :key="i"
        class="h-12 rounded-xl animate-pulse"
        :class="themeStore.isDark ? 'bg-gray-700' : 'bg-gray-200'"
      />
    </div>

    <!-- ── Error ─────────────────────────────────────────────────────────── -->
    <div
      v-else-if="notificationsStore.error"
      class="rounded-xl border p-4 text-sm"
      :class="themeStore.isDark ? 'border-red-800 bg-red-900/20 text-red-400' : 'border-red-200 bg-red-50 text-red-600'"
    >
      {{ notificationsStore.error }}
    </div>

    <!-- ── Empty state ───────────────────────────────────────────────────── -->
    <div
      v-else-if="notificationsStore.notifications.length === 0"
      class="flex flex-col items-center justify-center min-h-[40vh] gap-3"
    >
      <BellIcon class="w-14 h-14" :class="themeStore.isDark ? 'text-gray-600' : 'text-gray-300'" />
      <p class="text-sm font-medium" :class="themeStore.isDark ? 'text-gray-400' : 'text-gray-500'">
        No notifications defined yet.
      </p>
    </div>

    <!-- ── Notification list ─────────────────────────────────────────────── -->
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
        <span>ID</span>
        <span>Name</span>
        <span>Register</span>
        <span>Condition</span>
        <span>Mode</span>
        <span class="text-right">Actions</span>
      </div>

      <!-- Rows -->
      <div
        v-for="(entry, idx) in notificationsStore.notifications"
        :key="entry.id"
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
        <!-- ID -->
        <span class="font-mono text-xs" :class="themeStore.isDark ? 'text-gray-400' : 'text-gray-500'">
          {{ entry.id }}
        </span>

        <!-- Name -->
        <span class="font-medium truncate" :class="themeStore.isDark ? 'text-white' : 'text-gray-900'">
          {{ entry.name }}
        </span>

        <!-- Register -->
        <span class="truncate" :class="themeStore.isDark ? 'text-gray-300' : 'text-gray-700'">
          {{ registersStore.registers.find((r) => r.id === entry.registerId)?.name ?? String(entry.registerId) }}
        </span>

        <!-- Condition -->
        <span class="font-mono text-xs" :class="themeStore.isDark ? 'text-gray-300' : 'text-gray-700'">
          {{ OPERATOR_SYMBOLS[entry.operator] }} {{ entry.conditionValue }}
        </span>

        <!-- Mode -->
        <span>
          <span
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
            :class="
              entry.mode === 'immediate'
                ? themeStore.isDark
                  ? 'bg-green-900/40 text-green-400'
                  : 'bg-green-100 text-green-700'
                : themeStore.isDark
                  ? 'bg-amber-900/40 text-amber-400'
                  : 'bg-amber-100 text-amber-700'
            "
          >
            {{ entry.mode === 'immediate' ? 'Immediate' : `Delayed (${entry.delaySeconds}s)` }}
          </span>
        </span>

        <!-- Actions -->
        <div class="flex items-center justify-end gap-1">
          <button
            class="p-1.5 rounded-lg transition-colors"
            :class="
              themeStore.isDark
                ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            "
            title="Edit notification"
            @click="openEditModal(entry)"
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
            title="Delete notification"
            @click="handleDelete(entry)"
          >
            <TrashIcon class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- ── Modal ─────────────────────────────────────────────────────────── -->
    <EditNotificationModal v-model="showModal" :entry="editingEntry" @set="handleSet" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useThemeStore } from '../stores/theme';
import { useNotificationsStore } from '../stores/notifications';
import { useRegistersStore } from '../stores/registers';
import EditNotificationModal from '../components/EditNotificationModal.vue';
import { PlusIcon, PencilIcon, TrashIcon, BellIcon } from '@heroicons/vue/24/outline';
import type { NotificationEntry } from '../types/notification';
import { OPERATOR_SYMBOLS } from '../types/notification';

const themeStore = useThemeStore();
const notificationsStore = useNotificationsStore();
const registersStore = useRegistersStore();

// ── Modal state ─────────────────────────────────────────────────────────────

const showModal = ref(false);
const editingEntry = ref<NotificationEntry | null>(null);

// ── Layout ──────────────────────────────────────────────────────────────────

const tableGridClass = 'grid-cols-[4rem_1fr_1fr_7rem_8rem_6rem]';

// ── Handlers ────────────────────────────────────────────────────────────────

const openCreateModal = () => {
  editingEntry.value = null;
  showModal.value = true;
};

const openEditModal = (entry: NotificationEntry) => {
  editingEntry.value = entry;
  showModal.value = true;
};

const handleSet = async (entry: NotificationEntry) => {
  try {
    if (entry.id === 0) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: _id, ...data } = entry;
      await notificationsStore.createNotification(data);
    } else {
      const { id, ...data } = entry;
      await notificationsStore.updateNotification(id, data);
    }
  } catch {
    // error already surfaced in store
  }
};

const handleDelete = async (entry: NotificationEntry) => {
  if (!confirm(`Delete notification "${entry.name}"?\nThis cannot be undone.`)) return;
  try {
    await notificationsStore.deleteNotification(entry.id);
  } catch {
    // error already surfaced in store
  }
};

// ── Lifecycle ────────────────────────────────────────────────────────────────

onMounted(async () => {
  await Promise.all([
    notificationsStore.fetchNotifications(),
    registersStore.registers.length === 0 ? registersStore.fetchRegisters() : Promise.resolve(),
  ]);
});
</script>
