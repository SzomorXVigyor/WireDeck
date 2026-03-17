<template>
  <div
    class="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    @click.self="$emit('cancel')"
  >
    <div
      class="rounded-xl w-full max-w-sm overflow-hidden shadow-2xl"
      :class="dark ? 'bg-gray-800 border border-gray-700' : 'bg-white'"
    >
      <!-- Header -->
      <div class="px-5 py-4 border-b flex items-center gap-3" :class="dark ? 'border-gray-700' : 'border-gray-200'">
        <div class="shrink-0 w-9 h-9 rounded-full flex items-center justify-center bg-red-500/15">
          <TrashIcon class="w-5 h-5 text-red-400" />
        </div>
        <div class="min-w-0">
          <h3 class="text-base font-semibold leading-tight" :class="dark ? 'text-white' : 'text-gray-900'">
            {{ title }}
          </h3>
          <p class="text-xs font-mono truncate mt-0.5" :class="dark ? 'text-gray-400' : 'text-gray-500'">
            {{ subject }}
          </p>
        </div>
      </div>

      <!-- Body -->
      <div class="px-5 py-4">
        <p class="text-sm leading-relaxed" :class="dark ? 'text-gray-300' : 'text-gray-600'">
          {{ description }}
        </p>

        <div
          class="mt-3 rounded-lg px-3 py-2 text-xs flex gap-2 items-start"
          :class="
            dark
              ? 'bg-red-900/20 border border-red-800/50 text-red-300'
              : 'bg-red-50 border border-red-200 text-red-700'
          "
        >
          <ExclamationTriangleIcon class="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>This action <strong>cannot be undone</strong>.</span>
        </div>
      </div>

      <!-- Footer -->
      <div
        class="px-5 py-3 border-t flex justify-end gap-2"
        :class="dark ? 'border-gray-700 bg-gray-800/60' : 'border-gray-200 bg-gray-50'"
      >
        <button
          type="button"
          class="px-4 py-2 text-sm font-medium rounded-lg border transition-colors"
          :class="
            dark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'
          "
          @click="$emit('cancel')"
        >
          Cancel
        </button>
        <button
          type="button"
          :disabled="busy"
          class="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
          @click="$emit('confirm')"
        >
          <span v-if="busy" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Delete
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { TrashIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline';
import { useThemeStore } from '../stores/theme';

defineProps<{
  /** Short heading, e.g. "Delete Instance" */
  title: string;
  /** The name/id of the resource being deleted */
  subject: string;
  /** A sentence describing what will be lost */
  description: string;
  /** Show spinner on the confirm button while async work is running */
  busy?: boolean;
}>();

defineEmits<{
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}>();

const dark = useThemeStore().isDark;
</script>
