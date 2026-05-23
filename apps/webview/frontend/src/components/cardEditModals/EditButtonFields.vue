<template>
  <div>
    <!-- Button label -->
    <div>
      <label class="block text-sm font-medium mb-1" :class="labelClass">Button label</label>
      <input
        v-model="localExtra.label"
        type="text"
        class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        :class="inputClass"
        placeholder="Leave empty to use card name"
      />
    </div>

    <!-- Color -->
    <div>
      <label class="block text-sm font-medium mb-1" :class="labelClass">Color</label>
      <select
        v-model="localStyle.color"
        class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        :class="inputClass"
      >
        <option value="primary">Primary (blue)</option>
        <option value="secondary">Secondary (gray)</option>
        <option value="danger">Danger (red)</option>
        <option value="success">Success (green)</option>
        <option value="warning">Warning (yellow)</option>
      </select>
    </div>

    <!-- Size -->
    <div>
      <label class="block text-sm font-medium mb-1" :class="labelClass">Size</label>
      <select
        v-model="localStyle.size"
        class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        :class="inputClass"
      >
        <option value="sm">Small</option>
        <option value="md">Medium</option>
        <option value="lg">Large</option>
      </select>
    </div>

    <!-- Confirm action -->
    <label class="flex items-center gap-2 cursor-pointer select-none">
      <input v-model="localExtra.confirmAction" type="checkbox" class="rounded" />
      <span class="text-sm" :class="labelClass">Require confirmation before firing</span>
    </label>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue';

type S = Record<string, unknown>;

const props = defineProps<{ style: S; extra: S; inputClass: string; labelClass: string }>();
const emit = defineEmits<{ 'update:style': [S]; 'update:extra': [S] }>();

const localStyle = reactive({ ...props.style });
const localExtra = reactive({ ...props.extra });

watch(
  () => props.style,
  (s) => Object.assign(localStyle, s),
  { deep: true }
);
watch(
  () => props.extra,
  (e) => Object.assign(localExtra, e),
  { deep: true }
);
watch(localStyle, () => emit('update:style', { ...localStyle }), { deep: true });
watch(localExtra, () => emit('update:extra', { ...localExtra }), { deep: true });
</script>
