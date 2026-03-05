<template>
  <!--
    Wrapper that:
    - Picks the correct card component based on card.type
    - Applies layout-aware sizing classes (fill vs fixed)
    - Uses `self-stretch` so every card in a row grows to the row's height
  -->
  <div :class="wrapperClass">
    <ButtonCard v-if="card.type === 'button'" :card="card" :view-id="viewId" class="h-full" />
    <SwitchCard v-else-if="card.type === 'switch'" :card="card" :view-id="viewId" class="h-full" />
    <DisplayCard v-else-if="card.type === 'display'" :card="card" class="h-full" />
    <NumberInputCard v-else-if="card.type === 'number-input'" :card="card" :view-id="viewId" class="h-full" />
    <!-- Fallback for unknown types -->
    <div
      v-else
      class="h-full rounded-xl border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 p-4 text-sm text-yellow-700 dark:text-yellow-400"
    >
      Unknown card type: <code class="font-mono">{{ card.type }}</code>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Card, LayoutType } from '../../types/view';
import ButtonCard from './ButtonCard.vue';
import SwitchCard from './SwitchCard.vue';
import DisplayCard from './DisplayCard.vue';
import NumberInputCard from './NumberInputCard.vue';

const props = defineProps<{
  card: Card;
  viewId: string | number;
  layoutType: LayoutType;
}>();

/**
 * fill  → cards share the row width equally; each grows but never shrinks
 *         below 220 px, wrapping when needed.
 * fixed → each card occupies a fixed 208 px (w-52), wrapping naturally.
 * self-stretch ensures the card fills the full row height in both modes.
 */
const wrapperClass = computed(() =>
  props.layoutType === 'fill' ? 'flex-1 min-w-[220px] self-stretch' : 'w-52 flex-shrink-0 self-stretch'
);
</script>
