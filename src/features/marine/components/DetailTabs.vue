<script setup>
// Tabs for detail pages; the active tab lives in the URL (?tab=audit) so links and Back land on it.
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";

const props = defineProps({
  tabs: { type: Array, required: true }, // [{ key, label, count? }]
  /** Disables every control in the panel (read-only records); the tabs stay usable */
  panelDisabled: { type: Boolean, default: false },
});
const route = useRoute();
const router = useRouter();
const active = computed(() => (props.tabs.some((t) => t.key === route.query.tab) ? route.query.tab : props.tabs[0].key));
const select = (key) => router.replace({ query: { ...route.query, tab: key === props.tabs[0].key ? undefined : key } });

function onKey(e, i) {
  const n = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : null;
  if (n === null) return;
  const t = props.tabs[(n + props.tabs.length) % props.tabs.length];
  select(t.key);
  e.currentTarget.parentElement.children[(n + props.tabs.length) % props.tabs.length]?.focus();
}
</script>

<template>
  <div>
    <div role="tablist" class="flex overflow-x-auto gap-1 mb-4 border-b border-line">
      <button
        v-for="(t, i) in tabs"
        :key="t.key"
        role="tab"
        type="button"
        :aria-selected="active === t.key"
        :tabindex="active === t.key ? 0 : -1"
        :class="['px-4 py-2 -mb-px text-sm font-medium whitespace-nowrap border-b-2', active === t.key ? 'border-primary text-primary' : 'border-transparent text-ink-muted hover:text-ink']"
        @click="select(t.key)"
        @keydown="onKey($event, i)"
      >
        {{ t.label }}<span v-if="t.count !== undefined" class="ml-1.5 text-xs text-ink-subtle">{{ t.count }}</span>
      </button>
    </div>
    <fieldset role="tabpanel" :disabled="panelDisabled" class="min-w-0">
      <slot :name="active" />
    </fieldset>
  </div>
</template>
