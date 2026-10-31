<script setup lang="ts">
import { ref, watch } from "vue";

const props = defineProps({
  tabs: {
    type: Array as () => string[],
    required: true,
  },
  modelValue: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["update:modelValue"]);

const active = ref(props.modelValue || props.tabs[0] || "");
const tabEls = ref<HTMLButtonElement[]>([]);

watch(
  () => props.modelValue,
  (v) => {
    if (v) active.value = v;
  }
);

function select(tab: string) {
  active.value = tab;
  emit("update:modelValue", tab);
}

// Arrow-key navigation between tabs (WAI-ARIA tabs pattern)
function onKeydown(e: KeyboardEvent, index: number) {
  const last = props.tabs.length - 1;
  const next =
    e.key === "ArrowRight" ? (index === last ? 0 : index + 1)
    : e.key === "ArrowLeft" ? (index === 0 ? last : index - 1)
    : e.key === "Home" ? 0
    : e.key === "End" ? last
    : -1;
  if (next < 0) return;
  e.preventDefault();
  select(props.tabs[next]);
  tabEls.value[next]?.focus();
}
</script>

<template>
  <div class="flex overflow-x-auto gap-1 border-b border-line" role="tablist">
    <button
      v-for="(tab, i) in tabs"
      :key="tab"
      :ref="(el) => (tabEls[i] = el as HTMLButtonElement)"
      type="button"
      role="tab"
      :aria-selected="active === tab"
      :tabindex="active === tab ? 0 : -1"
      class="relative px-3 -mb-px h-10 text-sm font-medium whitespace-nowrap border-b-2 transition-colors"
      :class="active === tab ? 'border-primary text-primary' : 'border-transparent text-ink-muted hover:text-ink hover:border-line-strong'"
      @click="select(tab)"
      @keydown="onKeydown($event, i)"
    >
      {{ tab }}
    </button>
  </div>
</template>
