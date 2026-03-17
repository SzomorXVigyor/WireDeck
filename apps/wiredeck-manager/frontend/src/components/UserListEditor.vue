<template>
  <div class="space-y-2">
    <!-- Confirmed user rows -->
    <div
      v-for="(user, idx) in confirmed"
      :key="idx"
      class="flex items-center gap-2 px-3 py-2 rounded-lg text-xs border"
      :class="dark ? 'border-gray-700 bg-gray-900/50 text-gray-300' : 'border-gray-200 bg-gray-50 text-gray-700'"
    >
      <span class="flex-1 font-mono truncate">{{ user.username }}</span>
      <span
        v-if="showRole"
        class="px-1.5 py-0.5 rounded text-[10px] font-medium"
        :class="user.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-500/20 text-gray-400'"
        >{{ user.role || 'user' }}</span
      >
      <button
        type="button"
        class="text-red-400 hover:text-red-300 transition-colors ml-1 shrink-0"
        title="Remove user"
        @click="removeUser(idx)"
      >
        <XMarkIcon class="w-3.5 h-3.5" />
      </button>
    </div>

    <!-- Inline add row -->
    <div
      v-if="adding"
      class="flex flex-wrap items-center gap-2 px-3 py-2 rounded-lg border"
      :class="dark ? 'border-blue-700 bg-blue-900/20' : 'border-blue-300 bg-blue-50'"
    >
      <input
        v-model="draft.username"
        type="text"
        placeholder="Username"
        class="flex-1 min-w-[100px] rounded px-2 py-1 text-xs border outline-none focus:ring-1"
        :class="
          dark
            ? 'bg-gray-900 border-gray-700 text-white focus:ring-blue-500'
            : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-400'
        "
      />
      <input
        v-model="draft.password"
        type="password"
        placeholder="Password"
        class="flex-1 min-w-[100px] rounded px-2 py-1 text-xs border outline-none focus:ring-1"
        :class="
          dark
            ? 'bg-gray-900 border-gray-700 text-white focus:ring-blue-500'
            : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-400'
        "
      />
      <select
        v-if="showRole"
        v-model="draft.role"
        class="rounded px-2 py-1 text-xs border outline-none focus:ring-1"
        :class="
          dark
            ? 'bg-gray-900 border-gray-700 text-white focus:ring-blue-500'
            : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-400'
        "
      >
        <option value="user">user</option>
        <option value="admin">admin</option>
      </select>
      <button
        type="button"
        class="px-2 py-1 rounded text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        :disabled="!draft.username.trim() || !draft.password.trim()"
        @click="confirmAdd"
      >
        Add
      </button>
      <button
        type="button"
        class="px-2 py-1 rounded text-xs font-medium transition-colors"
        :class="dark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'"
        @click="cancelAdd"
      >
        Cancel
      </button>
    </div>

    <!-- Add user button -->
    <button
      v-if="!adding"
      type="button"
      class="flex items-center gap-1.5 text-xs font-medium transition-colors"
      :class="dark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'"
      @click="startAdd"
    >
      <PlusIcon class="w-3.5 h-3.5" />
      Add user
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { PlusIcon, XMarkIcon } from '@heroicons/vue/24/outline';
import type { CreateModuleUserDto } from '../types/module';

const props = defineProps<{
  modelValue: CreateModuleUserDto[];
  showRole?: boolean;
  dark?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: CreateModuleUserDto[]): void;
}>();

const confirmed = computed(() => props.modelValue);

const adding = ref(false);
// Default role to 'user' when roles are shown
const draft = ref<CreateModuleUserDto>({ username: '', password: '', role: 'user' });

function startAdd() {
  draft.value = { username: '', password: '', role: 'user' };
  adding.value = true;
}

function cancelAdd() {
  adding.value = false;
}

function confirmAdd() {
  if (!draft.value.username.trim() || !draft.value.password.trim()) return;
  const entry: CreateModuleUserDto = {
    username: draft.value.username.trim(),
    password: draft.value.password.trim(),
    ...(props.showRole ? { role: draft.value.role || 'user' } : {}),
  };
  emit('update:modelValue', [...props.modelValue, entry]);
  adding.value = false;
}

function removeUser(idx: number) {
  const next = [...props.modelValue];
  next.splice(idx, 1);
  emit('update:modelValue', next);
}
</script>
