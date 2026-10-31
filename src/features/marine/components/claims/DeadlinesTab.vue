<script setup>
// Deadlines (plan 8.3, MAR-45): kind, base date, due date and chip, alerts sent, escalation; Mark
// met (with a note) for deadlines no task closes.
import { openModal } from "@customizer/modal-x";
import DeadlineChip from "../DeadlineChip.vue";
import PageState from "../PageState.vue";
import { cardClass } from "../styles";
import { DEADLINE_BASES, DEADLINE_KINDS } from "../../constants";
import { formatDate, formatDateTime } from "../../utils/format";

const props = defineProps({ claim: { type: Object, required: true }, canWork: { type: Boolean, default: false } });
const emit = defineEmits(["updated"]);
const markMet = (d) => openModal("MarineConfirm", { title: `Mark ${DEADLINE_KINDS[d.kind].toLowerCase()} met?`, message: "Say how it was met. Use this only when no task closes the deadline.", confirmLabel: "Mark met", requireReason: true, reasonLabel: "Note" }, async (r) => {
  if (!r?.confirmed) return;
  const { markDeadlineMet } = await import("../../api/marineApi");
  const res = await markDeadlineMet(d.id, { note: r.reason });
  if (res.ok) emit("updated");
});
</script>

<template>
  <section :class="[cardClass, 'overflow-x-auto']">
    <PageState v-if="!claim.deadlines.length" kind="empty" title="No deadlines yet" message="Deadlines appear once their base date is known (for example the delivery date)." />
    <table v-else class="w-full text-sm">
      <thead class="bg-surface-muted"><tr class="text-xs font-semibold text-left uppercase text-ink-subtle"><th class="px-4 py-2">Kind</th><th class="px-4 py-2">Base date</th><th class="px-4 py-2">Due</th><th class="px-4 py-2">Status</th><th class="px-4 py-2">Alerts sent</th><th class="px-4 py-2">Escalated</th><th class="px-4 py-2"></th></tr></thead>
      <tbody>
        <tr v-for="d in claim.deadlines" :key="d.id" class="align-top border-t border-line">
          <td class="px-4 py-2 font-medium text-ink">{{ DEADLINE_KINDS[d.kind] }}</td>
          <td class="px-4 py-2 whitespace-nowrap">{{ DEADLINE_BASES[d.base] }}: {{ formatDate(d.baseDate) }}</td>
          <td class="px-4 py-2 whitespace-nowrap">{{ formatDate(d.dueDate) }}</td>
          <td class="px-4 py-2">
            <DeadlineChip :due-date="d.dueDate" :status="d.status" />
            <p v-if="d.status === 'MET'" class="mt-1 text-xs text-ink-subtle">{{ d.metNote }} · {{ d.metBy }}, {{ formatDateTime(d.metAt) }}</p>
          </td>
          <td class="px-4 py-2 text-xs text-ink-muted">{{ d.alertsSent.length ? d.alertsSent.map(formatDate).join(", ") : "—" }}</td>
          <td class="px-4 py-2 text-xs" :class="d.escalatedAt ? 'text-error-strong font-semibold' : 'text-ink-subtle'">{{ d.escalatedAt ? formatDate(d.escalatedAt) : "—" }}</td>
          <td class="px-4 py-2 text-right"><button v-if="canWork && d.status === 'OPEN'" type="button" class="text-sm font-medium text-primary hover:underline whitespace-nowrap" @click="markMet(d)">Mark met</button></td>
        </tr>
      </tbody>
    </table>
  </section>
</template>
