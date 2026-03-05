<template>
  <div class="p-4 md:p-6">
    <!-- ── Page header ──────────────────────────────────────────────────── -->
    <div class="mb-6 flex items-start justify-between gap-4 flex-wrap">
      <!-- View name -->
      <h1 class="text-2xl font-bold leading-tight" :class="themeStore.isDark ? 'text-white' : 'text-gray-900'">
        {{ isEditing ? (editDraft?.name ?? '\u00a0') : (viewsStore.currentView?.name ?? '\u00a0') }}
      </h1>

      <!-- Read-mode buttons (admin only) -->
      <div v-if="!isEditing && isAdmin" class="flex items-center gap-2 flex-shrink-0">
        <button
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border"
          :class="
            themeStore.isDark
              ? 'border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white'
              : 'border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900'
          "
          @click="startEdit"
        >
          <PencilIcon class="w-4 h-4" />
          Edit
        </button>
        <button
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border"
          :class="
            themeStore.isDark
              ? 'border-red-800 text-red-400 hover:bg-red-900/30 hover:text-red-300'
              : 'border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700'
          "
          @click="handleDelete"
        >
          <TrashIcon class="w-4 h-4" />
          Delete
        </button>
      </div>

      <!-- Edit-mode buttons -->
      <div v-if="isEditing" class="flex items-center gap-2 flex-shrink-0">
        <button
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border"
          :class="
            themeStore.isDark
              ? 'border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white'
              : 'border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900'
          "
          @click="showOptionsModal = true"
        >
          <Cog6ToothIcon class="w-4 h-4" />
          Options
        </button>
        <button
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700"
          :disabled="saving"
          @click="saveEdit"
        >
          <CheckIcon class="w-4 h-4" />
          {{ saving ? 'Saving…' : 'Save' }}
        </button>
        <button
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border"
          :class="
            themeStore.isDark
              ? 'border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white'
              : 'border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900'
          "
          @click="cancelEdit"
        >
          <XMarkIcon class="w-4 h-4" />
          Cancel
        </button>
      </div>
    </div>

    <!-- ── Loading skeleton ─────────────────────────────────────────────── -->
    <div v-if="viewsStore.loadingView" class="flex flex-wrap gap-4">
      <div
        v-for="i in 4"
        :key="i"
        class="flex-1 min-w-[220px] h-32 rounded-xl animate-pulse"
        :class="themeStore.isDark ? 'bg-gray-700' : 'bg-gray-200'"
      />
    </div>

    <!-- ── Error ─────────────────────────────────────────────────────────── -->
    <div
      v-else-if="viewsStore.error && !isEditing"
      class="rounded-xl border p-4 text-sm"
      :class="themeStore.isDark ? 'border-red-800 bg-red-900/20 text-red-400' : 'border-red-200 bg-red-50 text-red-600'"
    >
      {{ viewsStore.error }}
    </div>

    <!-- ── Read-mode card grid ───────────────────────────────────────────── -->
    <div v-else-if="viewsStore.currentView && !isEditing" class="flex flex-wrap items-stretch gap-4">
      <CardWrapper
        v-for="card in sortedCards"
        :key="card.id"
        :card="card"
        :view-id="currentViewId"
        :layout-type="viewsStore.currentView.layout.type"
      />
    </div>

    <!-- ── Edit-mode card grid ───────────────────────────────────────────── -->
    <div v-else-if="editDraft && isEditing" class="flex flex-wrap items-stretch gap-4">
      <!-- Existing cards with click overlay -->
      <div
        v-for="card in sortedDraftCards"
        :key="card.id"
        class="relative group cursor-pointer"
        :class="
          editDraft.layout.type === 'fill' ? 'flex-1 min-w-[220px] self-stretch' : 'w-52 flex-shrink-0 self-stretch'
        "
        @click="openCardModal(card)"
      >
        <!-- Card rendered as preview (non-interactive) -->
        <CardWrapper
          class="w-full h-full pointer-events-none"
          :card="card"
          :view-id="currentViewId"
          :layout-type="editDraft.layout.type"
        />
        <!-- Hover overlay -->
        <div
          class="absolute inset-0 z-10 rounded-xl flex items-center justify-center transition-all group-hover:bg-blue-500/10 group-hover:ring-2 group-hover:ring-blue-500/60 ring-inset"
        >
          <span
            class="opacity-0 group-hover:opacity-100 transition-opacity bg-blue-600 text-white text-xs font-medium px-2 py-1 rounded-md inline-flex items-center gap-1"
          >
            <PencilIcon class="w-3 h-3" /> Edit
          </span>
        </div>
      </div>

      <!-- Ghost card: add new component -->
      <div
        class="cursor-pointer"
        :class="
          editDraft.layout.type === 'fill' ? 'flex-1 min-w-[220px] self-stretch' : 'w-52 flex-shrink-0 self-stretch'
        "
        @click="openNewCardModal"
      >
        <div
          class="w-full h-full min-h-[130px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors"
          :class="
            themeStore.isDark
              ? 'border-gray-600 text-gray-500 hover:border-blue-500 hover:text-blue-400'
              : 'border-gray-300 text-gray-400 hover:border-blue-400 hover:text-blue-500'
          "
        >
          <PlusIcon class="w-8 h-8" />
          <span class="text-sm font-medium">Add card</span>
        </div>
      </div>
    </div>

    <!-- ── Modals ─────────────────────────────────────────────────────────── -->
    <EditViewOptionsModal
      v-model="showOptionsModal"
      :view-name="editDraft?.name ?? ''"
      :layout="editDraft?.layout ?? { type: 'fill' }"
      @set="handleOptionsSet"
    />

    <EditCardModal
      v-model="showCardModal"
      :card="editingCard"
      :default-order="nextCardOrder"
      @set="handleCardSet"
      @delete="handleCardDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useThemeStore } from '../stores/theme';
import { useViewsStore } from '../stores/views';
import { useAuthStore } from '../stores/auth';
import CardWrapper from '../components/cards/CardWrapper.vue';
import EditViewOptionsModal from '../components/EditViewOptionsModal.vue';
import EditCardModal from '../components/EditCardModal.vue';
import { PencilIcon, TrashIcon, Cog6ToothIcon, CheckIcon, XMarkIcon, PlusIcon } from '@heroicons/vue/24/outline';
import type { Card, ViewDetail, Layout } from '../types/view';

const route = useRoute();
const router = useRouter();
const themeStore = useThemeStore();
const viewsStore = useViewsStore();
const authStore = useAuthStore();

// ── Basic computed ──────────────────────────────────────────────────────────

const currentViewId = computed(() => route.params.id as string);
const isAdmin = computed(() => authStore.user?.role === 'admin');

// ── Edit-mode state ─────────────────────────────────────────────────────────

const isEditing = ref(false);
const editDraft = ref<ViewDetail | null>(null);
const saving = ref(false);
const showOptionsModal = ref(false);
const editingCard = ref<Card | null>(null);
const showCardModal = ref(false);

// ── Sorted card lists ───────────────────────────────────────────────────────

const sortedCards = computed(() => {
  if (!viewsStore.currentView) return [];
  return [...viewsStore.currentView.components].sort((a, b) => a.order - b.order);
});

const sortedDraftCards = computed(() => {
  if (!editDraft.value) return [];
  return [...editDraft.value.components].sort((a, b) => a.order - b.order);
});

const nextCardOrder = computed(() => {
  if (!editDraft.value || editDraft.value.components.length === 0) return 1;
  return Math.max(...editDraft.value.components.map((c) => c.order)) + 1;
});

// ── Edit-mode actions ───────────────────────────────────────────────────────

const startEdit = () => {
  if (!viewsStore.currentView) return;
  editDraft.value = JSON.parse(JSON.stringify(viewsStore.currentView));
  isEditing.value = true;
};

const cancelEdit = () => {
  isEditing.value = false;
  editDraft.value = null;
};

const saveEdit = async () => {
  if (!editDraft.value) return;
  saving.value = true;
  try {
    await viewsStore.updateView(currentViewId.value, editDraft.value);
    isEditing.value = false;
    editDraft.value = null;
    // Restart polling with the (possibly updated) interval
    const interval = viewsStore.currentView?.layout.updateInterval ?? 0;
    if (interval > 0) {
      viewsStore.startPolling(currentViewId.value, interval);
    } else {
      viewsStore.fetchRegisterData(currentViewId.value);
    }
  } finally {
    saving.value = false;
  }
};

const handleDelete = async () => {
  if (!viewsStore.currentView) return;
  if (!confirm(`Delete view "${viewsStore.currentView.name}"?\nThis cannot be undone.`)) return;
  await viewsStore.deleteView(currentViewId.value);
  if (viewsStore.views.length > 0) {
    router.replace({ name: 'ViewDetail', params: { id: viewsStore.views[0].id } });
  } else {
    router.replace('/dashboard');
  }
};

const handleOptionsSet = (name: string, layout: Layout) => {
  if (!editDraft.value) return;
  editDraft.value.name = name;
  editDraft.value.layout = layout;
};

// ── Card-modal actions ──────────────────────────────────────────────────────

const openCardModal = (card: Card) => {
  editingCard.value = card;
  showCardModal.value = true;
};

const openNewCardModal = () => {
  editingCard.value = null;
  showCardModal.value = true;
};

const handleCardSet = (updatedCard: Card) => {
  if (!editDraft.value) return;
  const idx = editDraft.value.components.findIndex((c) => c.id === updatedCard.id);
  if (idx !== -1) {
    editDraft.value.components[idx] = updatedCard;
  } else {
    editDraft.value.components.push(updatedCard);
  }
};

const handleCardDelete = (cardId: number) => {
  if (!editDraft.value) return;
  editDraft.value.components = editDraft.value.components.filter((c) => c.id !== cardId);
};

// ── Route watcher ───────────────────────────────────────────────────────────

watch(
  () => route.params.id,
  async (id) => {
    if (!id) return;
    if (isEditing.value) cancelEdit();
    viewsStore.stopPolling();
    await viewsStore.fetchView(id as string);
    if (!viewsStore.currentView) return;

    const interval = viewsStore.currentView.layout.updateInterval ?? 0;
    if (interval > 0) {
      viewsStore.startPolling(id as string, interval);
    } else {
      await viewsStore.fetchRegisterData(id as string);
    }
  },
  { immediate: true }
);

onUnmounted(() => {
  viewsStore.stopPolling();
});
</script>
