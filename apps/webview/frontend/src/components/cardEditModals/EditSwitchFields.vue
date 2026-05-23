<template>
  <div>
    <!-- Active color -->
    <div>
      <label class="block text-sm font-medium mb-1" :class="labelClass">Active color</label>
      <select
        v-model="localStyle.color"
        class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        :class="inputClass"
      >
        <option value="green">Green</option>
        <option value="blue">Blue</option>
        <option value="red">Red</option>
        <option value="yellow">Yellow</option>
      </select>
    </div>

    <!-- ON label -->
    <div>
      <label class="block text-sm font-medium mb-1" :class="labelClass">ON label</label>
      <input
        v-model="localExtra.onLabel"
        type="text"
        class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        :class="inputClass"
        placeholder="ON"
      />
    </div>

    <!-- OFF label -->
    <div>
      <label class="block text-sm font-medium mb-1" :class="labelClass">OFF label</label>
      <input
        v-model="localExtra.offLabel"
        type="text"
        class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        :class="inputClass"
        placeholder="OFF"
      />
    </div>
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
