<script setup>
// The debit and credit notes raised for a policy or certificate, with what's still outstanding.
// Finance staff get links to each note.
import StatusBadge from "./StatusBadge.vue";
import { useCan } from "../composables/useCan";
import { NOTE_SOURCES } from "../constants";
import { formatAmount } from "../utils/money";
import { formatDate } from "../utils/format";

defineProps({ notes: { type: Array, default: () => [] } });
const { roles } = useCan();
const finance = () => roles.value.some((r) => ["FINANCE", "ADMIN"].includes(r));
</script>

<template>
  <div>
    <p v-if="!notes.length" class="text-sm text-ink-subtle">No debit or credit notes.</p>
    <ul v-else class="text-sm divide-y divide-line">
      <li v-for="n in notes" :key="n.id" class="flex flex-wrap gap-2 justify-between items-center py-2">
        <span class="min-w-0">
          <RouterLink v-if="finance()" :to="`/marine/finance/notes/${n.id}`" class="font-semibold text-ink hover:text-primary">{{ n.noteNo }}</RouterLink>
          <span v-else class="font-semibold text-ink">{{ n.noteNo }}</span>
          <span class="text-ink-muted"> · {{ NOTE_SOURCES[n.source] }} · {{ formatDate(n.issuedAt) }}</span>
        </span>
        <span class="flex gap-2 items-center">
          <span class="tabular-nums">{{ n.kind === "CREDIT" ? "−" : "" }}ETB {{ formatAmount(n.total) }}</span>
          <StatusBadge entity="note" :status="n.status" />
        </span>
      </li>
    </ul>
  </div>
</template>
