<script setup lang="ts">
import { computed, defineProps } from "vue";
import { RouterLink } from "vue-router";
import icons from "@/utils/icons";

const props = defineProps({
  rowData: {
    type: Array,
    required: true,
  },
  rowKeys: {
    type: Array,
    required: true,
  },
  headKeys: {
    type: Array,
    required: true,
  },
  cells: {
    type: Object,
    default: () => ({}),
  },
  onRowClick: {
    type: Function,
    default: () => {},
  },
  currentPage: { type: Number, default: 1 },
  perPage: { type: Number, default: 25 },
  isMobile: { type: Boolean, default: false },
});

function getStatusStyle(status: any) {
  const base =
    "inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold ring-1 ring-inset";

  switch (String(status || "").toUpperCase()) {
    case "ACTIVE":
    case "APPROVED":
    case "ACCEPTED":
      return `${base} bg-emerald-50 text-emerald-700 ring-emerald-200`;
    case "PENDING":
    case "SUBMITTED":
      return `${base} bg-amber-50 text-amber-700 ring-amber-200`;
    case "INACTIVE":
    case "REJECTED":
      return `${base} bg-rose-50 text-rose-700 ring-rose-200`;
    default:
      return `${base} bg-slate-50 text-slate-700 ring-slate-200`;
  }
}

function formatCellValue(key: string, row: any) {
  const cellFn = (props.cells as any)?.[key];
  if (typeof cellFn === "function") {
    return cellFn(row?.[key], row);
  }

  return key.split(".").reduce((all: any, el: string) => {
    return all?.[el];
  }, row);
}

const hasActions = computed(() =>
  (props.headKeys || []).some(
    (h: any) => String(h || "").toLowerCase() === "actions"
  )
);
</script>

<template>
  <tr
    v-for="(row, idx) in (rowData || []).filter((r: any) => r !== null)"
    :key="row?.quotationUuid || row?.id || idx"
    @click.self="onRowClick(row)"
    class="bg-white border-b transition-colors duration-150 hover:bg-gray-50"
  >
    <td class="p-4 font-medium text-gray-500">
      {{ (props.currentPage - 1) * props.perPage + idx + 1 }}
    </td>

    <td class="p-3 py-4" v-for="key in rowKeys" :key="key">
      <div v-if="key === 'status'" class="truncate">
        <span :class="getStatusStyle((row as any)?.status)">
          {{ (row as any)?.status }}
        </span>
      </div>

      <span v-else class="text-gray-700">
        {{ formatCellValue(key as any, row) }}
      </span>
    </td>

    <td v-if="hasActions" class="p-3 text-start">
      <RouterLink
        :to="{ name: 'ViewAcceptedQuotation', params: { quotationUuid: (row as any)?.quotationUuid } }"
        class="inline-flex gap-1.5 items-center px-3.5 py-1.5 text-xs font-semibold text-primary bg-primary/5 hover:bg-primary hover:text-white rounded-full transition-all duration-150 shadow-sm outline-none border border-primary/20 hover:border-primary"
        @click.stop
      >
        <i v-html="icons.details" class="w-3.5 h-3.5" />
        <span class="hidden sm:inline">View</span>
        <span class="sm:hidden">Open</span>
      </RouterLink>
    </td>
  </tr>
</template>
