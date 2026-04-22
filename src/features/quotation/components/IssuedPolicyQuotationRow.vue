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

function getStatusStyle(status) {
  const base =
    "inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold ring-1 ring-inset";

  switch (String(status || "").toUpperCase()) {
    case "PAID":
    case "ACCEPTED":
    case "ISSUED":
    case "APPROVED":
      return `${base} bg-emerald-50 text-emerald-700 ring-emerald-200`;
    case "PENDING":
    case "SUBMITTED":
      return `${base} bg-amber-50 text-amber-700 ring-amber-200`;
    case "REJECTED":
    case "CANCELLED":
    case "INACTIVE":
      return `${base} bg-rose-50 text-rose-700 ring-rose-200`;
    default:
      return `${base} bg-slate-50 text-slate-700 ring-slate-200`;
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
    class="bg-white border-b transition-colors duration-150 hover:bg-gray-50"
  >
    <td class="p-4 font-medium text-gray-500">
      {{ (props.currentPage - 1) * props.perPage + idx + 1 }}
    </td>

    <td class="p-3 py-4" v-for="key in rowKeys" :key="key">
      <div v-if="key === 'status'" class="truncate">
        <span :class="getStatusStyle(row?.status)">
          {{ row?.status }}
        </span>
      </div>
      <span v-else class="text-gray-700">
        {{ formatCellValue(key, row) }}
      </span>
    </td>

    <td v-if="hasActions" class="p-3 text-start">
      <button
        v-if="isPaid(row)"
        class="inline-flex items-center px-3 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        @click.prevent="props.onInsured(row)"
      >
        Insured Persons
      </button>
    </td>
  </tr>
</template>
