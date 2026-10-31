<script setup>
import { computed } from "vue";

const props = defineProps({
  rowData: { type: Array, required: true },
  rowKeys: { type: Array, required: true },
  headKeys: { type: Array, required: true },
  cells: { type: Object, default: () => ({}) },
  currentPage: { type: Number, default: 1 },
  perPage: { type: Number, default: 25 },
  onInsured: { type: Function, default: () => {} },
  onDetails: { type: Function, default: () => {} },
});

function formatCellValue(key, row) {
  const cellFn = props.cells?.[key];
  if (typeof cellFn === "function") {
    return cellFn(row?.[key], row);
  }

  return String(key)
    .split(".")
    .reduce((all, el) => all?.[el], row);
}

function toText(v) {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function formatDateOnly(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString();
}

function formatDateTime(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}

function getStatusStyle(status) {
  const base =
    "inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold ring-1 ring-inset";

  switch (String(status || "").toUpperCase()) {
    case "PAID":
    case "ACCEPTED":
    case "ISSUED":
    case "APPROVED":
      return `${base} bg-success-soft text-success-strong ring-success/20`;
    case "PENDING":
    case "SUBMITTED":
      return `${base} bg-warning-soft text-warning-strong ring-warning/20`;
    case "REJECTED":
    case "CANCELLED":
    case "INACTIVE":
      return `${base} bg-error-soft text-error-strong ring-error/20`;
    default:
      return `${base} bg-surface-muted text-ink-muted ring-line`;
  }
}

const hasActions = computed(() =>
  (props.headKeys || []).some((h) => String(h || "").toLowerCase() === "actions")
);

function isPaid(row) {
  return String(row?.status || "").toUpperCase() === "PAID";
}
</script>

<template>
  <tr
    v-for="(row, idx) in (rowData || []).filter((r) => r !== null)"
    :key="row?.quotationUuid || row?.id || idx"
    class="bg-white border-b transition-colors duration-150 hover:bg-surface-muted"
  >
    <td class="p-4 font-medium text-ink-subtle">
      {{ (props.currentPage - 1) * props.perPage + idx + 1 }}
    </td>

    <td class="p-3 py-4" v-for="key in rowKeys" :key="key">
      <div v-if="key === 'status'" class="truncate">
        <span :class="getStatusStyle(row?.status)">
          {{ row?.status }}
        </span>
      </div>

      <div
        v-else-if="key === 'dates'"
        class="max-w-[220px]"
        :title="[formatDateTime(row?.dates?.issuedDate), formatDateTime(row?.dates?.acceptedDate), formatDateTime(row?.dates?.poDate)].filter(Boolean).join('\n')"
      >
        <div class="space-y-1 text-xs text-ink-muted">
          <div class="flex gap-2 justify-between items-center">
            <span class="text-ink-subtle">Issued</span>
            <span class="font-medium">{{ formatDateOnly(row?.dates?.issuedDate) }}</span>
          </div>
          <div class="flex gap-2 justify-between items-center">
            <span class="text-ink-subtle">Accepted</span>
            <span class="font-medium">{{ formatDateOnly(row?.dates?.acceptedDate) }}</span>
          </div>
          <div class="flex gap-2 justify-between items-center">
            <span class="text-ink-subtle">PO</span>
            <span class="font-medium">{{ formatDateOnly(row?.dates?.poDate) }}</span>
          </div>
        </div>
      </div>

      <div
        v-else-if="key === 'quoatedServices'"
        class="max-w-[240px]"
        :title="toText(formatCellValue(key, row))"
      >
        <span class="font-medium text-ink-muted">
          {{ Array.isArray(row?.quoatedServices) ? `${row.quoatedServices.length} service(s)` : '' }}
        </span>
      </div>

      <span
        v-else
        class="text-ink-muted block max-w-[220px] truncate"
        :title="toText(formatCellValue(key, row))"
      >
        {{ formatCellValue(key, row) }}
      </span>
    </td>

    <td v-if="hasActions" class="p-3 text-start">
      <div class="flex flex-wrap gap-2 items-center">
        <button
          class="inline-flex items-center px-3 py-2 text-sm font-semibold text-white rounded-lg bg-primary"
          @click.prevent="props.onDetails(row)"
        >
          Details
        </button>

        <button
          v-if="isPaid(row)"
          class="inline-flex items-center px-3 py-2 text-sm font-semibold text-white rounded-lg bg-primary"
          @click.prevent="props.onInsured(row)"
        >
          Insured Persons
        </button>
      </div>
    </td>
  </tr>
</template>
