<template>
  <Teleport to="body">
    <Transition name="evom-fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        @click.self="cancel"
      >
        <div
          class="w-full max-w-sm rounded-xl shadow-2xl"
          :class="themeStore.isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'"
        >
          <div class="px-6 pt-6 pb-4">
            <h2 class="text-lg font-semibold">View Options</h2>
          </div>

          <div class="px-6 pb-4 space-y-4">
            <!-- Name -->
            <div>
              <label class="block text-sm font-medium mb-1" :class="labelClass">Name</label>
              <input
                v-model="draftName"
                type="text"
                class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                :class="inputClass"
                placeholder="View name"
              />
            </div>

            <!-- Layout type -->
            <div>
              <label class="block text-sm font-medium mb-1" :class="labelClass">Layout type</label>
              <select
                v-model="draftLayoutType"
                class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                :class="inputClass"
              >
                <option value="fill">Fill - cards stretch to fill each row</option>
                <option value="fixed">Fixed - cards have a fixed width</option>
              </select>
            </div>

            <!-- Update interval -->
            <div>
              <label class="block text-sm font-medium mb-1" :class="labelClass">
                Update interval (seconds, 0 = no polling)
              </label>
              <input
                v-model.number="draftInterval"
                type="number"
                min="0"
                class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                :class="inputClass"
                placeholder="0"
              />
            </div>
          </div>

          <!-- Footer -->
          <div
            class="flex justify-end gap-2 px-6 py-4 border-t"
            :class="themeStore.isDark ? 'border-gray-700' : 'border-gray-200'"
          >
            <button
              type="button"
              class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              :class="
                themeStore.isDark
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              "
              @click="cancel"
            >
              Cancel
            </button>
            <button
              type="button"
              class="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              @click="handleSet"
            >
              Set
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useThemeStore } from '../stores/theme';
import type { Layout, LayoutType } from '../types/view';

const props = defineProps<{
  modelValue: boolean;
  viewName: string;
  layout: Layout;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void;
  (e: 'set', name: string, layout: Layout): void;
}>();

const themeStore = useThemeStore();

const draftName = ref('');
const draftLayoutType = ref<LayoutType>('fill');
const draftInterval = ref(0);

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      draftName.value = props.viewName;
      draftLayoutType.value = props.layout.type;
      draftInterval.value = props.layout.updateInterval ?? 0;
    }
  }
);

const cancel = () => emit('update:modelValue', false);

const handleSet = () => {
  emit('set', draftName.value, {
    type: draftLayoutType.value,
    updateInterval: draftInterval.value,
  });
  emit('update:modelValue', false);
};

const labelClass = computed(() => (themeStore.isDark ? 'text-gray-300' : 'text-gray-700'));
const inputClass = computed(() =>
  themeStore.isDark
    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
    : 'bg-white border-gray-300 text-gray-900'
);
</script>

<style scoped>
.evom-fade-enter-active,
.evom-fade-leave-active {
  transition: opacity 0.15s ease;
}
.evom-fade-enter-from,
.evom-fade-leave-to {
  opacity: 0;
}
</style>
