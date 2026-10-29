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
    <div role="tablist" class="mb-4 marine-tabs">
      <button
        v-for="(t, i) in tabs"
        :key="t.key"
        role="tab"
        type="button"
        :aria-selected="active === t.key"
        :tabindex="active === t.key ? 0 : -1"
        :class="['marine-tab px-4 py-1.5 text-sm font-semibold whitespace-nowrap rounded-[10px] transition-colors', active === t.key ? '' : 'text-ink-muted hover:text-ink hover:bg-surface-muted']"
        @click="select(t.key)"
        @keydown="onKey($event, i)"
      >
        {{ t.label }}<span v-if="t.count !== undefined" :class="['ml-1.5 px-1.5 py-px rounded-full text-[11px] tabular-nums', active === t.key ? 'bg-white/20 text-white' : 'bg-surface-raised text-ink-muted']">{{ t.count }}</span>
      </button>
    </div>
    <fieldset role="tabpanel" :disabled="panelDisabled" class="min-w-0">
      <slot :name="active" />
    </fieldset>
  </div>
</template>
