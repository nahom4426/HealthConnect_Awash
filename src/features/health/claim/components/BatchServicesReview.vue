<script setup>
// Review the services of one claim batch (Process / Verify / Reject claim detail pages):
// summary, searchable selectable table (cards on phones), bulk action and the batch action.
import { computed, ref, watch } from "vue";
import { formatCurrency, secondDateFormat } from "@/utils/utils";
import { claimStatusOf, claimStatusLabel, claimStatusTone } from "../utils/claimStatus";

const props = defineProps({
  rows: { type: Array, default: () => [] },
  pending: { type: Boolean, default: false },
  modelValue: { type: Array, default: () => [] }, // selected serviceProvidedUuids
  actionLabel: { type: String, default: "Process Claim" }, // whole-batch action
  canRunAction: { type: Boolean, default: false },
  // Statuses that still need a decision before the whole batch can move on
  blockingStatuses: { type: Array, default: () => ["PENDING"] },
});
const emit = defineEmits(["update:modelValue", "view-items", "bulk", "action"]);

const idOf = (row) => row?.serviceProvidedUuid;
const insuredOf = (row) => (row?.insuredName || "").trim() || (row?.dependantName || "").trim() || "—";
const itemsOf = (row) => (Array.isArray(row?.providedItemResponses) ? row.providedItemResponses.length : 0);
const initials = (name) =>
  String(name || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
// Paid services can't be selected again
const isSelectable = (row) => !["PAID", "PAYED"].includes(claimStatusOf(row));

/* ---------- Summary ---------- */
const totalAmount = computed(() => props.rows.reduce((sum, r) => sum + (Number(r?.amount) || 0), 0));
const institutions = computed(() => [...new Set(props.rows.map((r) => r?.institutionName).filter(Boolean))]);
const providers = computed(() => [...new Set(props.rows.map((r) => r?.providerName).filter(Boolean))]);
const statusCounts = computed(() => {
  const counts = {};
  props.rows.forEach((r) => {
    const s = claimStatusOf(r);
    counts[s] = (counts[s] || 0) + 1;
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
});
const blockingCount = computed(
  () => props.rows.filter((r) => props.blockingStatuses.includes(claimStatusOf(r))).length
);

/* ---------- Search ---------- */
const query = ref("");
const visibleRows = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return props.rows;
  return props.rows.filter((r) =>
    [insuredOf(r), r?.institutionName, r?.providerName, claimStatusLabel(r)].some((v) => String(v || "").toLowerCase().includes(q))
  );
});

/* ---------- Selection ---------- */
const selected = ref([...props.modelValue]);
watch(
  () => props.modelValue,
  (v) => {
    if (JSON.stringify(v) !== JSON.stringify(selected.value)) selected.value = [...(v || [])];
  }
);
function commit(next) {
  selected.value = next;
  emit("update:modelValue", [...next]);
}
// Rows can disappear (rejected services are removed); never keep their ids selected
watch(
  () => props.rows.map(idOf),
  (ids) => {
    const kept = selected.value.filter((id) => ids.includes(id));
    if (kept.length !== selected.value.length) commit(kept);
  }
);
const selectableVisibleIds = computed(() => visibleRows.value.filter(isSelectable).map(idOf).filter(Boolean));
const allVisibleSelected = computed(
  () => selectableVisibleIds.value.length > 0 && selectableVisibleIds.value.every((id) => selected.value.includes(id))
);
const someVisibleSelected = computed(
  () => !allVisibleSelected.value && selectableVisibleIds.value.some((id) => selected.value.includes(id))
);
function toggleAll() {
  if (allVisibleSelected.value) commit(selected.value.filter((id) => !selectableVisibleIds.value.includes(id)));
  else commit([...new Set([...selected.value, ...selectableVisibleIds.value])]);
}
function toggle(row) {
  const id = idOf(row);
  if (!id || !isSelectable(row)) return;
  commit(selected.value.includes(id) ? selected.value.filter((x) => x !== id) : [...selected.value, id]);
}
const selectedTotal = computed(() =>
  props.rows.filter((r) => selected.value.includes(idOf(r))).reduce((sum, r) => sum + (Number(r?.amount) || 0), 0)
);
</script>

<template>
  <div class="space-y-5">
    <!-- Summary -->
    <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <div class="p-4 rounded-xl border shadow-card bg-surface border-line">
        <p class="text-xs font-medium tracking-wide uppercase text-ink-subtle">Services</p>
        <p class="mt-1 text-2xl font-semibold tabular-nums text-ink">{{ rows.length }}</p>
      </div>
      <div class="p-4 rounded-xl border shadow-card bg-surface border-line">
        <p class="text-xs font-medium tracking-wide uppercase text-ink-subtle">Total amount</p>
        <p class="mt-1 text-2xl font-semibold tabular-nums text-ink">{{ formatCurrency(totalAmount) }}</p>
      </div>
      <div class="p-4 rounded-xl border shadow-card bg-surface border-line">
        <p class="text-xs font-medium tracking-wide uppercase text-ink-subtle">
          {{ institutions.length > 1 ? "Institutions" : "Institution" }}
        </p>
        <p class="mt-1 text-sm font-semibold truncate text-ink" :title="institutions.join(', ')">
          {{ institutions.length > 1 ? `${institutions.length} institutions` : institutions[0] || "—" }}
        </p>
        <p v-if="providers.length" class="text-xs truncate text-ink-muted" :title="providers.join(', ')">
          {{ providers.length > 1 ? `${providers.length} providers` : providers[0] }}
        </p>
      </div>
      <div class="p-4 rounded-xl border shadow-card bg-surface border-line">
        <p class="text-xs font-medium tracking-wide uppercase text-ink-subtle">Status</p>
        <div class="flex flex-wrap gap-1.5 mt-2">
          <span
            v-for="[status, count] in statusCounts"
            :key="status"
            :class="['inline-flex gap-1.5 items-center px-2 py-0.5 text-xs font-semibold rounded-full border', claimStatusTone(status).badge]"
          >
            <span :class="['w-1.5 h-1.5 rounded-full', claimStatusTone(status).dot]"></span>
            {{ claimStatusLabel(status) }} · {{ count }}
          </span>
          <span v-if="!statusCounts.length" class="text-sm text-ink-subtle">—</span>
        </div>
      </div>
    </div>

    <!-- Table card -->
    <div class="overflow-hidden rounded-xl border shadow-card bg-surface border-line">
      <!-- Toolbar / selection bar -->
      <div class="flex flex-wrap gap-3 justify-between items-center px-4 py-3 border-b border-line">
        <div v-if="selected.length" class="flex flex-wrap gap-3 items-center">
          <span class="inline-flex gap-2 items-center px-3 h-9 text-sm font-medium rounded-lg bg-primary/10 text-primary">
            {{ selected.length }} selected · {{ formatCurrency(selectedTotal) }}
          </span>
          <button type="button" class="text-sm font-medium text-ink-muted hover:text-ink" @click="commit([])">Clear</button>
        </div>
        <div v-else class="relative w-full sm:w-72">
          <svg class="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 pointer-events-none text-ink-subtle" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
            <circle cx="9" cy="9" r="5.5" /><path d="m13.5 13.5 3 3" />
          </svg>
          <input
            v-model="query"
            type="search"
            placeholder="Search insured, institution, status..."
            aria-label="Search services"
            class="pr-3 pl-9 w-full h-9 text-sm rounded-lg border bg-surface border-line-strong focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        </div>
        <button
          v-if="selected.length"
          type="button"
          class="inline-flex gap-2 items-center px-4 h-9 text-sm font-semibold text-white rounded-lg shadow-sm transition-colors bg-primary hover:bg-primary-hover"
          @click="emit('bulk')"
        >
          <svg class="w-4 h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 10.5 3 3 7-7" /></svg>
          Process / Reject selected
        </button>
      </div>

      <!-- Desktop table -->
      <div class="hidden overflow-x-auto md:block">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-xs font-medium tracking-wide text-left uppercase border-b bg-surface-muted text-ink-subtle border-line">
              <th class="py-3 pr-2 pl-4 w-10">
                <input
                  type="checkbox"
                  class="w-4 h-4 cursor-pointer accent-primary"
                  :checked="allVisibleSelected"
                  :indeterminate="someVisibleSelected"
                  :disabled="!selectableVisibleIds.length"
                  aria-label="Select all services"
                  @change="toggleAll"
                />
              </th>
              <th class="px-3 py-3">Insured</th>
              <th class="px-3 py-3">Institution</th>
              <th class="px-3 py-3 text-center">Items</th>
              <th class="px-3 py-3 text-right">Amount</th>
              <th class="px-3 py-3">Provided</th>
              <th class="px-3 py-3">Status</th>
              <th class="py-3 pr-4 pl-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-line">
            <template v-if="pending && !rows.length">
              <tr v-for="n in 4" :key="`sk-${n}`">
                <td v-for="c in 8" :key="c" class="px-3 py-4"><div class="h-3.5 rounded skeleton"></div></td>
              </tr>
            </template>
            <tr
              v-for="row in visibleRows"
              :key="idOf(row)"
              :class="['transition-colors', selected.includes(idOf(row)) ? 'bg-primary/5' : 'hover:bg-surface-muted']"
            >
              <td class="py-3 pr-2 pl-4">
                <input
                  type="checkbox"
                  class="w-4 h-4 cursor-pointer accent-primary disabled:cursor-not-allowed disabled:opacity-40"
                  :checked="selected.includes(idOf(row))"
                  :disabled="!isSelectable(row)"
                  :aria-label="`Select ${insuredOf(row)}`"
                  @change="toggle(row)"
                />
              </td>
              <td class="px-3 py-3">
                <div class="flex gap-3 items-center min-w-0">
                  <span class="grid place-items-center w-9 h-9 text-xs font-semibold rounded-full shrink-0 bg-primary/10 text-primary" aria-hidden="true">
                    {{ initials(insuredOf(row)) }}
                  </span>
                  <div class="min-w-0">
                    <p class="font-medium truncate text-ink">{{ insuredOf(row) }}</p>
                    <p class="text-xs truncate text-ink-subtle">
                      {{ row?.personType === "DEPENDANT" || row?.dependantUuid ? "Dependant" : "Principal" }}
                      <template v-if="row?.providerName"> · {{ row.providerName }}</template>
                    </p>
                  </div>
                </div>
              </td>
              <td class="px-3 py-3 max-w-[14rem]">
                <p class="truncate text-ink-muted" :title="row?.institutionName">{{ row?.institutionName || "—" }}</p>
              </td>
              <td class="px-3 py-3 text-center">
                <span class="inline-grid place-items-center px-2 min-w-[1.75rem] h-7 text-xs font-semibold rounded-full bg-surface-muted text-ink">
                  {{ itemsOf(row) }}
                </span>
              </td>
              <td class="px-3 py-3 font-semibold text-right whitespace-nowrap tabular-nums text-ink">{{ formatCurrency(row?.amount || 0) }}</td>
              <td class="px-3 py-3 whitespace-nowrap text-ink-muted">{{ secondDateFormat(row?.providedDate) }}</td>
              <td class="px-3 py-3">
                <span :class="['inline-flex gap-1.5 items-center px-2.5 py-1 text-xs font-semibold rounded-full border whitespace-nowrap', claimStatusTone(row).badge]">
                  <span :class="['w-1.5 h-1.5 rounded-full', claimStatusTone(row).dot]"></span>
                  {{ claimStatusLabel(row) }}
                </span>
              </td>
              <td class="py-3 pr-4 pl-3 text-right">
                <button
                  type="button"
                  class="inline-flex gap-1.5 items-center px-3 h-8 text-xs font-semibold rounded-lg border transition-colors text-primary border-primary/25 hover:bg-primary/5 hover:border-primary/40"
                  @click="emit('view-items', row)"
                >
                  <svg class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M1.5 10S4.5 4 10 4s8.5 6 8.5 6-3 6-8.5 6-8.5-6-8.5-6Z" /><circle cx="10" cy="10" r="2.5" />
                  </svg>
                  Review items
                </button>
              </td>
            </tr>
            <tr v-if="!pending && !visibleRows.length">
              <td colspan="8" class="px-4 py-14 text-center">
                <p class="font-medium text-ink">{{ rows.length ? "No services match your search" : "No services in this claim" }}</p>
                <p v-if="rows.length" class="mt-1 text-sm text-ink-muted">Try another name or status.</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Phone cards -->
      <ul class="divide-y md:hidden divide-line">
        <li v-for="row in visibleRows" :key="idOf(row)" :class="['p-4', selected.includes(idOf(row)) ? 'bg-primary/5' : '']">
          <div class="flex gap-3 items-start">
            <input
              type="checkbox"
              class="mt-1 w-4 h-4 accent-primary"
              :checked="selected.includes(idOf(row))"
              :disabled="!isSelectable(row)"
              :aria-label="`Select ${insuredOf(row)}`"
              @change="toggle(row)"
            />
            <div class="flex-1 min-w-0">
              <div class="flex gap-2 justify-between items-start">
                <p class="font-medium truncate text-ink">{{ insuredOf(row) }}</p>
                <span class="font-semibold whitespace-nowrap tabular-nums text-ink">{{ formatCurrency(row?.amount || 0) }}</span>
              </div>
              <p class="text-xs truncate text-ink-muted">{{ row?.institutionName }} · {{ secondDateFormat(row?.providedDate) }}</p>
              <div class="flex gap-2 justify-between items-center mt-2">
                <span :class="['inline-flex gap-1.5 items-center px-2 py-0.5 text-xs font-semibold rounded-full border', claimStatusTone(row).badge]">
                  <span :class="['w-1.5 h-1.5 rounded-full', claimStatusTone(row).dot]"></span>
                  {{ claimStatusLabel(row) }}
                </span>
                <button type="button" class="px-3 h-8 text-xs font-semibold rounded-lg border text-primary border-primary/25" @click="emit('view-items', row)">
                  Review {{ itemsOf(row) }} item{{ itemsOf(row) === 1 ? "" : "s" }}
                </button>
              </div>
            </div>
          </div>
        </li>
        <li v-if="!pending && !visibleRows.length" class="p-8 text-sm text-center text-ink-muted">
          {{ rows.length ? "No services match your search" : "No services in this claim" }}
        </li>
      </ul>
    </div>

    <!-- Batch action -->
    <div class="flex flex-wrap gap-3 justify-between items-center p-4 rounded-xl border bg-surface border-line">
      <p class="text-sm text-ink-muted">
        <template v-if="canRunAction">All services have a decision. You can {{ actionLabel.toLowerCase() }} now.</template>
        <template v-else-if="blockingCount">
          <span class="font-semibold text-warning-strong">{{ blockingCount }}</span>
          service{{ blockingCount === 1 ? "" : "s" }} still need{{ blockingCount === 1 ? "s" : "" }} a decision — review the items, or select and process/reject them.
        </template>
      </p>
      <button
        type="button"
        :disabled="!canRunAction"
        class="inline-flex gap-2 items-center px-5 h-10 text-sm font-semibold text-white rounded-lg shadow-sm transition-colors bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
        @click="emit('action')"
      >
        {{ actionLabel }}
        <svg class="w-4 h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 10h10m-4-4 4 4-4 4" /></svg>
      </button>
    </div>
  </div>
</template>
