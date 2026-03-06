<template>
  <div class="p-4 md:p-6">
    <!-- ── Page header ──────────────────────────────────────────────────── -->
    <div class="mb-6 flex items-start justify-between gap-4 flex-wrap">
      <h1 class="text-2xl font-bold leading-tight" :class="themeStore.isDark ? 'text-white' : 'text-gray-900'">
        Register Dictionary
      </h1>
      <button
        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700"
        @click="openCreateModal"
      >
        <PlusIcon class="w-4 h-4" />
        Create
      </button>
    </div>

    <!-- ── Loading skeleton ─────────────────────────────────────────────── -->
    <div v-if="registersStore.loading" class="space-y-2">
      <div
        v-for="i in 5"
        :key="i"
        class="h-12 rounded-xl animate-pulse"
        :class="themeStore.isDark ? 'bg-gray-700' : 'bg-gray-200'"
      />
    </div>

    <!-- ── Error ─────────────────────────────────────────────────────────── -->
    <div
      v-else-if="registersStore.error"
      class="rounded-xl border p-4 text-sm"
      :class="themeStore.isDark ? 'border-red-800 bg-red-900/20 text-red-400' : 'border-red-200 bg-red-50 text-red-600'"
    >
      {{ registersStore.error }}
    </div>

    <!-- ── Empty state ───────────────────────────────────────────────────── -->
    <div
      v-else-if="registersStore.registers.length === 0"
      class="flex flex-col items-center justify-center min-h-[40vh] gap-3"
    >
      <BookOpenIcon class="w-14 h-14" :class="themeStore.isDark ? 'text-gray-600' : 'text-gray-300'" />
      <p class="text-sm font-medium" :class="themeStore.isDark ? 'text-gray-400' : 'text-gray-500'">
        No registers defined yet.
      </p>
    </div>

    <!-- ── Register list ─────────────────────────────────────────────────── -->
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
        <span>Access type</span>
        <span>Device ID</span>
        <span class="text-right">Actions</span>
      </div>

      <!-- Rows -->
      <div
        v-for="(entry, idx) in registersStore.registers"
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
        <span class="font-mono text-xs" :class="themeStore.isDark ? 'text-gray-400' : 'text-gray-500'">
          {{ entry.id }}
        </span>
        <span class="font-medium truncate" :class="themeStore.isDark ? 'text-white' : 'text-gray-900'">
          {{ entry.name }}
        </span>
        <span
          class="inline-flex items-center gap-1 truncate"
          :class="themeStore.isDark ? 'text-gray-300' : 'text-gray-700'"
        >
          <span
            class="text-xs font-medium px-1.5 py-0.5 rounded"
            :class="themeStore.isDark ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-700'"
          >
            {{ entry.accessType }}
          </span>
        </span>
        <span class="truncate" :class="themeStore.isDark ? 'text-gray-300' : 'text-gray-700'">
          {{ entry.accessDeviceId }}
        </span>
        <div class="flex items-center justify-end gap-1">
          <button
            class="p-1.5 rounded-lg transition-colors"
            :class="
              themeStore.isDark
                ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            "
            title="Edit register"
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
            title="Delete register"
            @click="handleDelete(entry)"
          >
            <TrashIcon class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- ── Modal ─────────────────────────────────────────────────────────── -->
    <EditRegisterModal v-model="showModal" :entry="editingEntry" @set="handleSet" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useThemeStore } from '../stores/theme';
import { useRegistersStore } from '../stores/registers';
import EditRegisterModal from '../components/EditRegisterModal.vue';
import { PlusIcon, PencilIcon, TrashIcon, BookOpenIcon } from '@heroicons/vue/24/outline';
import type { RegisterDictEntry } from '../types/register';

const themeStore = useThemeStore();
const registersStore = useRegistersStore();

// ── Modal state ─────────────────────────────────────────────────────────────

const showModal = ref(false);
const editingEntry = ref<RegisterDictEntry | null>(null);

// ── Layout ──────────────────────────────────────────────────────────────────

const tableGridClass = 'grid-cols-[4rem_1fr_9rem_1fr_6rem]';

// ── Handlers ────────────────────────────────────────────────────────────────

const openCreateModal = () => {
  editingEntry.value = null;
  showModal.value = true;
};

const openEditModal = (entry: RegisterDictEntry) => {
  editingEntry.value = entry;
  showModal.value = true;
};

const handleSet = async (entry: RegisterDictEntry) => {
  try {
    if (entry.id === 0) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: _id, ...data } = entry;
      await registersStore.createRegister(data);
    } else {
      const { id, ...data } = entry;
      await registersStore.updateRegister(id, data);
    }
  } catch {
    // error already surfaced in store
  }
};

const handleDelete = async (entry: RegisterDictEntry) => {
  if (!confirm(`Delete register "${entry.name}"?\nThis cannot be undone.`)) return;
  try {
    await registersStore.deleteRegister(entry.id);
  } catch {
    // error already surfaced in store
  }
};

// ── Lifecycle ────────────────────────────────────────────────────────────────

onMounted(async () => {
  await registersStore.fetchRegisters();
});
</script>
