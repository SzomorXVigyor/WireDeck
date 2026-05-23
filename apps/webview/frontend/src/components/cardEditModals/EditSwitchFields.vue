<template>
  <!-- REGISTER -->
  <section class="space-y-3">
    <SectionHeader label="Register" />
    <RegisterPicker v-model="localRegister" />
  </section>

  <!-- STYLE -->
  <section class="space-y-3">
    <SectionHeader label="Style" />
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
    </div>
  </section>

  <!-- EXTRA -->
  <section class="space-y-3">
    <SectionHeader label="Extra" />
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
  </section>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import RegisterPicker from '../shared/RegisterPicker.vue';
import SectionHeader from '../shared/SectionHeader.vue';

type S = Record<string, unknown>;

const props = defineProps<{ style: S; extra: S; register: number; inputClass: string; labelClass: string }>();
const emit = defineEmits<{ 'update:style': [S]; 'update:extra': [S]; 'update:register': [number] }>();

const localStyle = reactive({ ...props.style });
const localExtra = reactive({ ...props.extra });
const localRegister = ref(props.register);

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
watch(
  () => props.register,
  (v) => {
    localRegister.value = v;
  }
);

watch(localStyle, () => emit('update:style', { ...localStyle }), { deep: true });
watch(localExtra, () => emit('update:extra', { ...localExtra }), { deep: true });
watch(localRegister, (v) => emit('update:register', v));
</script>
