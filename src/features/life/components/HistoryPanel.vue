<script setup>
// Status changes and edits of a quotation, group policy or individual policy, oldest first
// (HistoryEntryResponse, contract 2026-10 G13).
import { useLifeResource } from "../composables/useLifeResource";
import { formatDate } from "../constants/labels";

const props = defineProps({
  /** () => Promise — getQuotationHistory / getPolicyHistory / getBenefitHistory bound to the record */
  fetcher: { type: Function, required: true },
});
const history = useLifeResource(() => props.fetcher(), { initial: [], map: (d) => (Array.isArray(d) ? d : []) });
history.load();
const label = (s) => (s ? s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, " ") : "");
defineExpose({ reload: () => history.load() });
</script>

<template>
  <section class="p-5 rounded-2xl border bg-surface border-line shadow-card">
    <h2 class="text-sm font-semibold text-ink">History</h2>
    <p v-if="history.error.value && !history.loading.value" class="mt-3 text-sm text-ink-muted">{{ history.error.value }} <button type="button" class="font-semibold text-primary" @click="history.load()">Try again</button></p>
    <ol v-else class="grid gap-3 mt-3">
      <li v-if="history.loading.value && !history.data.value.length" class="h-4 rounded animate-pulse bg-surface-raised"></li>
      <li v-else-if="!history.data.value.length" class="text-sm text-ink-subtle">No history yet.</li>
      <li v-for="h in history.data.value" v-else :key="h.historyUuid" class="flex gap-3 items-start">
        <span class="mt-1.5 w-2 h-2 rounded-full bg-primary shrink-0"></span>
        <span class="text-sm">
          <span class="text-ink">{{ label(h.action) }}</span>
          <span v-if="h.fromStatus || h.toStatus" class="text-ink-muted"> · {{ [label(h.fromStatus), label(h.toStatus)].filter(Boolean).join(" → ") }}</span>
          <span class="block text-xs text-ink-subtle">{{ [formatDate(h.occurredAt), h.actorName].filter(Boolean).join(" · ") }}</span>
          <span v-if="h.detail" class="block mt-0.5 text-xs whitespace-pre-line text-ink-muted">{{ h.detail }}</span>
        </span>
      </li>
    </ol>
  </section>
</template>
