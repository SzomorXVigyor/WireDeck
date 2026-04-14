<template>
  <Teleport to="body">
    <Transition name="enm-fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        @click.self="cancel"
      >
        <div
          class="w-full max-w-3xl rounded-xl shadow-2xl flex flex-col max-h-[90vh]"
          :class="themeStore.isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'"
        >
          <!-- Header -->
          <div class="flex items-center justify-between px-6 pt-6 pb-3 flex-shrink-0">
            <h2 class="text-lg font-semibold">{{ isNew ? 'Create Notification' : 'Edit Notification' }}</h2>
          </div>

          <!-- Scrollable form body -->
          <div class="overflow-y-auto px-6 pb-2 space-y-4 flex-1">
            <!-- ── General: Name + Register side-by-side ─────────────── -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Name -->
              <div>
                <label class="block text-sm font-medium mb-1" :class="labelClass">Name</label>
                <input
                  v-model="draft.name"
                  type="text"
                  class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                  :class="fieldClass('name')"
                  placeholder="Notification name"
                  @blur="touch('name')"
                />
                <p v-if="touched.has('name') && errors.name" class="mt-1 text-xs text-red-500">
                  {{ errors.name }}
                </p>
              </div>

              <!-- Register -->
              <div>
                <label class="block text-sm font-medium mb-1" :class="labelClass">Register</label>
                <select
                  v-model.number="draft.registerId"
                  class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                  :class="fieldClass('registerId')"
                  @change="touch('registerId')"
                  @blur="touch('registerId')"
                >
                  <option :value="0" disabled>- Select a register -</option>
                  <option v-if="registerOptions.length === 0" :value="-1" disabled>No registers defined</option>
                  <option v-for="r in registerOptions" :key="r.id" :value="r.id">{{ r.id }} - {{ r.name }}</option>
                </select>
                <p v-if="touched.has('registerId') && errors.registerId" class="mt-1 text-xs text-red-500">
                  {{ errors.registerId }}
                </p>
              </div>
            </div>

            <!-- ── Condition & Mode panel ─────────────────────────────── -->
            <div
              class="rounded-lg border p-4 space-y-4"
              :class="themeStore.isDark ? 'border-gray-700 bg-gray-800/60' : 'border-gray-200 bg-gray-50/50'"
            >
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <!-- Left column: Condition -->
                <div class="space-y-3">
                  <p
                    class="text-xs font-semibold uppercase tracking-wider"
                    :class="themeStore.isDark ? 'text-gray-400' : 'text-gray-500'"
                  >
                    Condition
                  </p>

                  <!-- Operator -->
                  <div>
                    <label class="block text-sm font-medium mb-1" :class="labelClass">Operator</label>
                    <select
                      v-model="draft.operator"
                      class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      :class="inputClass"
                    >
                      <option v-for="(label, key) in OPERATOR_LABELS" :key="key" :value="key">{{ label }}</option>
                    </select>
                  </div>

                  <!-- Condition value -->
                  <div>
                    <label class="block text-sm font-medium mb-1" :class="labelClass">Value</label>
                    <input
                      v-model="draft.conditionValue"
                      type="text"
                      inputmode="numeric"
                      class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                      :class="fieldClass('conditionValue')"
                      placeholder="Threshold value"
                      @blur="touch('conditionValue')"
                    />
                    <p v-if="touched.has('conditionValue') && errors.conditionValue" class="mt-1 text-xs text-red-500">
                      {{ errors.conditionValue }}
                    </p>
                  </div>
                </div>

                <!-- Right column: Notification mode -->
                <div class="space-y-3">
                  <p
                    class="text-xs font-semibold uppercase tracking-wider"
                    :class="themeStore.isDark ? 'text-gray-400' : 'text-gray-500'"
                  >
                    Notification mode
                  </p>

                  <!-- Type -->
                  <div>
                    <label class="block text-sm font-medium mb-1" :class="labelClass">Type</label>
                    <select
                      v-model="draft.mode"
                      class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      :class="inputClass"
                    >
                      <option value="immediate">Immediate</option>
                      <option value="delayed">Delayed</option>
                    </select>
                  </div>

                  <!-- Delay (visible only when mode = delayed) -->
                  <div v-if="draft.mode === 'delayed'">
                    <label class="block text-sm font-medium mb-1" :class="labelClass">Delay (seconds)</label>
                    <input
                      v-model="draft.delaySeconds"
                      type="text"
                      inputmode="numeric"
                      class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                      :class="fieldClass('delaySeconds')"
                      placeholder="e.g. 300"
                      @blur="touch('delaySeconds')"
                    />
                    <p v-if="touched.has('delaySeconds') && errors.delaySeconds" class="mt-1 text-xs text-red-500">
                      {{ errors.delaySeconds }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- ── Email content panel ────────────────────────────────── -->
            <div
              class="rounded-lg border p-4 space-y-3"
              :class="themeStore.isDark ? 'border-gray-700 bg-gray-800/60' : 'border-gray-200 bg-gray-50/50'"
            >
              <div class="flex items-center justify-between">
                <p
                  class="text-xs font-semibold uppercase tracking-wider"
                  :class="themeStore.isDark ? 'text-gray-400' : 'text-gray-500'"
                >
                  Email content
                </p>
                <button
                  type="button"
                  class="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded transition-colors"
                  :class="themeStore.isDark ? 'text-blue-400 hover:bg-gray-700' : 'text-blue-600 hover:bg-blue-50'"
                  @click="showTemplateHelp = !showTemplateHelp"
                >
                  <InformationCircleIcon class="w-3.5 h-3.5" />
                  {{ showTemplateHelp ? 'Hide help' : 'Template syntax' }}
                </button>
              </div>

              <!-- Template help -->
              <Transition name="enm-slide">
                <div
                  v-if="showTemplateHelp"
                  class="rounded-lg border p-3 text-xs space-y-1"
                  :class="
                    themeStore.isDark
                      ? 'border-blue-800/50 bg-blue-900/20 text-gray-300'
                      : 'border-blue-200 bg-blue-50 text-gray-600'
                  "
                >
                  <p class="font-semibold mb-1.5" :class="themeStore.isDark ? 'text-blue-300' : 'text-blue-700'">
                    Available template variables
                  </p>
                  <p><code class="font-mono bg-black/10 px-1 rounded">#REG</code> - trigger register value</p>
                  <p>
                    <code class="font-mono bg-black/10 px-1 rounded">#REG:&lt;id&gt;</code> - value of any register by
                    ID
                  </p>
                  <p>
                    <code class="font-mono bg-black/10 px-1 rounded">#TIME</code> - occurrence time
                    <span class="opacity-70">(YYYY. MM. DD. hh. mm. ss.)</span>
                  </p>
                  <p>
                    Escape with
                    <code class="font-mono bg-black/10 px-1 rounded">/#</code> to output a literal
                    <code class="font-mono">#</code>
                  </p>
                </div>
              </Transition>

              <!-- Recipients + Subject in a 2-col row -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <!-- Recipients -->
                <div>
                  <label class="block text-sm font-medium mb-1" :class="labelClass">Recipients</label>
                  <input
                    v-model="draft.recipients"
                    type="text"
                    class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                    :class="fieldClass('recipients')"
                    placeholder="email@example.com, other@example.com"
                    @blur="touch('recipients')"
                  />
                  <p v-if="touched.has('recipients') && errors.recipients" class="mt-1 text-xs text-red-500">
                    {{ errors.recipients }}
                  </p>
                </div>

                <!-- Subject -->
                <div>
                  <label class="block text-sm font-medium mb-1" :class="labelClass">Subject</label>
                  <input
                    v-model="draft.subject"
                    type="text"
                    class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                    :class="fieldClass('subject')"
                    placeholder="System Alert"
                    @blur="touch('subject')"
                  />
                  <p v-if="touched.has('subject') && errors.subject" class="mt-1 text-xs text-red-500">
                    {{ errors.subject }}
                  </p>
                </div>
              </div>

              <!-- Body (full width) -->
              <div>
                <label class="block text-sm font-medium mb-1" :class="labelClass">Body</label>
                <textarea
                  v-model="draft.body"
                  rows="6"
                  class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 resize-y"
                  :class="fieldClass('body')"
                  placeholder="Register value is #REG at #TIME."
                  @blur="touch('body')"
                />
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div
            class="flex justify-end gap-2 px-6 py-4 border-t flex-shrink-0"
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
              class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              :class="
                canSubmit
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-blue-400 text-white cursor-not-allowed opacity-60'
              "
              :disabled="!canSubmit"
              @click="handleSet"
            >
              {{ isNew ? 'Create' : 'Save' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import { useThemeStore } from '../stores/theme';
import { useRegistersStore } from '../stores/registers';
import { InformationCircleIcon } from '@heroicons/vue/24/outline';
import type { NotificationEntry, ConditionOperator, NotificationMode } from '../types/notification';
import { OPERATOR_LABELS } from '../types/notification';

// ── Draft type ────────────────────────────────────────────────────────────────

interface DraftEntry {
  id: number;
  name: string;
  registerId: number;
  operator: ConditionOperator;
  conditionValue: string;
  mode: NotificationMode;
  delaySeconds: string;
  recipients: string;
  subject: string;
  body: string;
}

// ── Props / emits ─────────────────────────────────────────────────────────────

const props = defineProps<{
  modelValue: boolean;
  /** `null` when creating a new entry. */
  entry: NotificationEntry | null;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void;
  (e: 'set', entry: NotificationEntry): void;
}>();

// ── State ─────────────────────────────────────────────────────────────────────

const themeStore = useThemeStore();
const registersStore = useRegistersStore();

const isNew = computed(() => !props.entry);
const showTemplateHelp = ref(false);

const draft = ref<DraftEntry>(makeDraft());
const touched = reactive(new Set<string>());

const registerOptions = computed(() => registersStore.registers);

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeDraft(): DraftEntry {
  if (props.entry) {
    return {
      id: props.entry.id,
      name: props.entry.name,
      registerId: props.entry.registerId,
      operator: props.entry.operator,
      conditionValue: String(props.entry.conditionValue),
      mode: props.entry.mode,
      delaySeconds: String(props.entry.delaySeconds),
      recipients: props.entry.recipients.join(', '),
      subject: props.entry.subject,
      body: props.entry.body,
    };
  }
  return {
    id: 0,
    name: '',
    registerId: 0,
    operator: 'gt',
    conditionValue: '',
    mode: 'immediate',
    delaySeconds: '300',
    recipients: '',
    subject: '',
    body: '',
  };
}

// ── Watchers ──────────────────────────────────────────────────────────────────

watch(
  () => props.modelValue,
  async (open) => {
    if (open) {
      draft.value = makeDraft();
      touched.clear();
      showTemplateHelp.value = false;
      if (registersStore.registers.length === 0) {
        await registersStore.fetchRegisters();
      }
    }
  }
);

// ── Validation ────────────────────────────────────────────────────────────────

const isNumeric = (val: string): boolean => {
  const s = val.trim();
  return s !== '' && !isNaN(Number(s));
};

const isPositiveInt = (val: string): boolean => {
  const s = val.trim();
  if (!/^\d+$/.test(s)) return false;
  return Number(s) > 0;
};

const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{1,}$/;

/** Validate a comma-separated list of emails. Returns an error string or null. */
const validateRecipients = (raw: string): string | null => {
  const trimmed = raw.trim();
  if (!trimmed) return 'At least one recipient is required';
  const addresses = trimmed
    .split(',')
    .map((a) => a.trim())
    .filter(Boolean);
  if (addresses.length === 0) return 'At least one recipient is required';
  const invalid = addresses.filter((a) => !EMAIL_RE.test(a));
  if (invalid.length > 0) return `Invalid email${invalid.length > 1 ? 's' : ''}: ${invalid.join(', ')}`;
  return null;
};

const errors = computed<Record<string, string>>(() => {
  const e: Record<string, string> = {};
  if (!draft.value.name.trim()) e.name = 'Name is required';
  if (!draft.value.registerId) e.registerId = 'Select a register';
  if (!isNumeric(draft.value.conditionValue)) e.conditionValue = 'Must be a valid number';
  if (draft.value.mode === 'delayed' && !isPositiveInt(draft.value.delaySeconds))
    e.delaySeconds = 'Must be a positive integer (seconds)';
  const recipientsErr = validateRecipients(draft.value.recipients);
  if (recipientsErr) e.recipients = recipientsErr;
  if (!draft.value.subject.trim()) e.subject = 'Subject is required';
  return e;
});

const canSubmit = computed(() => Object.keys(errors.value).length === 0);

// ── Style helpers ─────────────────────────────────────────────────────────────

const touch = (field: string) => touched.add(field);

const labelClass = computed(() => (themeStore.isDark ? 'text-gray-300' : 'text-gray-700'));
const inputClass = computed(() =>
  themeStore.isDark
    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
    : 'bg-white border-gray-300 text-gray-900'
);

const fieldClass = (field: string): string => {
  const hasError = touched.has(field) && !!errors.value[field];
  const base = themeStore.isDark ? 'bg-gray-700 text-white placeholder-gray-400' : 'bg-white text-gray-900';
  if (hasError) return `${base} border-red-500 focus:ring-red-500`;
  return `${base} ${themeStore.isDark ? 'border-gray-600' : 'border-gray-300'} focus:ring-blue-500`;
};

// ── Handlers ──────────────────────────────────────────────────────────────────

const cancel = () => emit('update:modelValue', false);

const handleSet = () => {
  if (!canSubmit.value) return;

  const entry: NotificationEntry = {
    id: draft.value.id,
    name: draft.value.name.trim(),
    registerId: draft.value.registerId,
    operator: draft.value.operator,
    conditionValue: Number(draft.value.conditionValue),
    mode: draft.value.mode,
    delaySeconds: draft.value.mode === 'delayed' ? Number(draft.value.delaySeconds) : 0,
    recipients: draft.value.recipients
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean),
    subject: draft.value.subject.trim(),
    body: draft.value.body,
  };

  emit('set', entry);
  emit('update:modelValue', false);
};
</script>

<style scoped>
.enm-fade-enter-active,
.enm-fade-leave-active {
  transition: opacity 0.15s ease;
}
.enm-fade-enter-from,
.enm-fade-leave-to {
  opacity: 0;
}
.enm-slide-enter-active,
.enm-slide-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}
.enm-slide-enter-from,
.enm-slide-leave-to {
  opacity: 0;
  max-height: 0;
  margin-top: 0;
  margin-bottom: 0;
  padding-top: 0;
  padding-bottom: 0;
}
.enm-slide-enter-to,
.enm-slide-leave-from {
  max-height: 200px;
}
</style>
