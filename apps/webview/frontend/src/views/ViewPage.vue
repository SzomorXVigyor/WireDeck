<template>
  <div class="p-4 md:p-6">
    <!-- Page header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold leading-tight" :class="themeStore.isDark ? 'text-white' : 'text-gray-900'">
        {{ viewsStore.currentView?.name ?? '\u00a0' }}
      </h1>
    </div>

    <!-- Loading skeleton -->
    <div v-if="viewsStore.loadingView" class="flex flex-wrap gap-4">
      <div
        v-for="i in 4"
        :key="i"
        class="flex-1 min-w-[220px] h-32 rounded-xl animate-pulse"
        :class="themeStore.isDark ? 'bg-gray-700' : 'bg-gray-200'"
      />
    </div>

    <!-- Error -->
    <div
      v-else-if="viewsStore.error"
      class="rounded-xl border p-4 text-sm"
      :class="themeStore.isDark ? 'border-red-800 bg-red-900/20 text-red-400' : 'border-red-200 bg-red-50 text-red-600'"
    >
      {{ viewsStore.error }}
    </div>

    <!--
      Cards container.
      items-stretch ensures every card in a row grows to the same height.
    -->
    <div v-else-if="viewsStore.currentView" class="flex flex-wrap items-stretch gap-4">
      <CardWrapper
        v-for="card in sortedCards"
        :key="card.id"
        :card="card"
        :view-id="currentViewId"
        :layout-type="viewsStore.currentView.layout.type"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { useThemeStore } from '../stores/theme';
import { useViewsStore } from '../stores/views';
import CardWrapper from '../components/cards/CardWrapper.vue';

const route = useRoute();
const themeStore = useThemeStore();
const viewsStore = useViewsStore();

const currentViewId = computed(() => route.params.id as string);

/** Cards sorted by `order` ascending */
const sortedCards = computed(() => {
  if (!viewsStore.currentView) return [];
  return [...viewsStore.currentView.components].sort((a, b) => a.order - b.order);
});

/** Load view + register data, start polling whenever the route id changes */
watch(
  () => route.params.id,
  async (id) => {
    if (!id) return;
    viewsStore.stopPolling();
    await viewsStore.fetchView(id as string);
    if (!viewsStore.currentView) return;

    const interval = viewsStore.currentView.layout.updateInterval ?? 0;
    if (interval > 0) {
      viewsStore.startPolling(id as string, interval);
    } else {
      // Fetch once even without polling
      await viewsStore.fetchRegisterData(id as string);
    }
  },
  { immediate: true }
);

onUnmounted(() => {
  viewsStore.stopPolling();
});
</script>
