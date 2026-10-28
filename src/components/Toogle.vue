<script setup lang="ts">
// Two-option segmented control. (File name kept for existing imports.)
import { ref, watch, type PropType } from "vue";

const props = defineProps({
  modelVale: String,
  items: {
    type: Array as PropType<{ name: string }[]>,
    required: true,
  },
});
const emit = defineEmits(["update:modelValue"]);
const active = ref(props.items[0].name);

watch(active, () => emit("update:modelValue", active.value));
</script>

<template>
  <div class="inline-flex p-1 w-64 rounded-lg bg-surface-muted ring-1 ring-inset ring-line" role="radiogroup">
    <button
      v-for="item in items"
      :key="item.name"
      type="button"
      role="radio"
      :aria-checked="active === item.name"
      class="flex-1 h-8 text-sm font-medium rounded-md transition-colors"
      :class="active === item.name ? 'bg-surface text-ink shadow-card ring-1 ring-line' : 'text-ink-muted hover:text-ink'"
      @click="active = item.name"
    >
      {{ item.name }}
    </button>
  </div>
</template>
