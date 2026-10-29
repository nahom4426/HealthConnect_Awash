<script setup>
// Filters above a list. Writes straight into useListQuery's reactive filters, which debounce
// 300 ms and sync to the URL.
// fields: [{ type: "search", key, label }
//          { type: "multi", key, label, options: [{ value, label }] }
//          { type: "select", key, label, options }
//          { type: "dateRange", from, to, label }
//          { type: "toggle", key, label }]
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { inputClass } from "./styles";

defineProps({
  fields: { type: Array, required: true },
  list: { type: Object, required: true },
});

const { t } = useI18n();
const openMulti = ref("");
const root = ref(null);
const closeOutside = (e) => {
  if (root.value && !root.value.contains(e.target)) openMulti.value = "";
};
onMounted(() => document.addEventListener("pointerdown", closeOutside));
onBeforeUnmount(() => document.removeEventListener("pointerdown", closeOutside));

function toggle(list, key, value) {
  const cur = list.filters[key];
  list.filters[key] = cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value];
}
const labelFor = (f, v) => f.options.find((o) => o.value === v)?.label ?? v;
</script>

<template>
  <div ref="root" class="flex flex-wrap gap-2 items-end mb-4 marine-filters">
    <template v-for="f in fields" :key="f.key || f.from">
      <div v-if="f.type === 'search'" class="relative">
        <svg class="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 pointer-events-none text-ink-subtle" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="9" cy="9" r="5.5" /><path d="m13.5 13.5 3 3" stroke-linecap="round" /></svg>
        <input
          v-model="list.filters[f.key]"
          type="search"
          :placeholder="f.label"
          :aria-label="f.label"
          :class="[inputClass, 'border-line !w-72 !h-9 !pl-9']"
        />
      </div>

      <div v-else-if="f.type === 'multi'" class="relative">
        <button
          type="button"
          :aria-expanded="openMulti === f.key"
          class="inline-flex gap-2 items-center px-3 h-9 text-sm rounded-lg border bg-surface border-line text-ink hover:border-line-strong"
          @click="openMulti = openMulti === f.key ? '' : f.key"
        >
          <span class="text-ink-muted">{{ f.label }}:</span>
          <span class="font-medium truncate max-w-[12rem]">{{ list.filters[f.key].length ? list.filters[f.key].map((v) => labelFor(f, v)).join(", ") : t("common.any") }}</span>
          <svg class="w-3.5 h-3.5 text-ink-subtle" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 8 4 4 4-4" /></svg>
        </button>
        <div v-if="openMulti === f.key" class="absolute left-0 top-full z-30 p-1 mt-1 w-56 rounded-xl border shadow-pop bg-surface border-line">
          <label v-for="o in f.options" :key="o.value" class="flex gap-2 items-center px-2.5 py-1.5 text-sm rounded-lg cursor-pointer hover:bg-surface-muted">
            <input type="checkbox" class="accent-[rgb(var(--primary))]" :checked="list.filters[f.key].includes(o.value)" @change="toggle(list, f.key, o.value)" />
            {{ o.label }}
          </label>
        </div>
      </div>

      <select
        v-else-if="f.type === 'select'"
        v-model="list.filters[f.key]"
        :aria-label="f.label"
        :class="[inputClass, 'border-line !w-auto !h-9 pr-8']"
      >
        <option value="">{{ t("common.anyFor", { label: f.label }) }}</option>
        <option v-for="o in f.options" :key="o.value" :value="o.value">{{ o.label }}</option>
      </select>

      <div v-else-if="f.type === 'dateRange'" class="inline-flex gap-1 items-center text-sm">
        <span class="text-ink-muted">{{ f.label }}</span>
        <input v-model="list.filters[f.from]" type="date" :aria-label="`${f.label} from`" :max="list.filters[f.to] || undefined" :class="[inputClass, 'border-line !w-auto !h-9']" />
        <span class="text-ink-subtle">{{ t("common.to") }}</span>
        <input v-model="list.filters[f.to]" type="date" :aria-label="`${f.label} to`" :min="list.filters[f.from] || undefined" :class="[inputClass, 'border-line !w-auto !h-9']" />
      </div>

      <label v-else-if="f.type === 'toggle'" class="inline-flex gap-2 items-center px-3 h-9 text-sm rounded-lg border cursor-pointer border-line bg-surface">
        <input v-model="list.filters[f.key]" type="checkbox" true-value="true" false-value="" class="accent-[rgb(var(--primary))]" />
        {{ f.label }}
      </label>
    </template>
    <button v-if="list.isFiltered.value" type="button" class="px-2 h-9 text-sm font-medium text-primary hover:underline" @click="list.reset()">{{ t("common.reset") }}</button>
    <div class="flex flex-1 gap-2 justify-end"><slot /></div>
  </div>
</template>
