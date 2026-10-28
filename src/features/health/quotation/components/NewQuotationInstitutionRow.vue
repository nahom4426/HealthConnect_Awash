<script setup lang="ts">
import { computed, defineProps } from "vue";
import { RouterLink } from "vue-router";
import icons from "@/utils/icons";

const emit = defineEmits(['row', 'remove']);

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

function generateQuotationPath(row: any) {
  return `/new_quotation/generate/${row?.institutionUuid}`;
}

function getStatusStyle(status: any) {
  const base =
    "inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold ring-1 ring-inset";

  switch (String(status || "").toUpperCase()) {
    case "ACTIVE":
    case "APPROVED":
    case "ACCEPTED":
      return `${base} bg-success-soft text-success-strong ring-success/20`;
    case "PENDING":
    case "SUBMITTED":
      return `${base} bg-warning-soft text-warning-strong ring-warning/20`;
    case "INACTIVE":
    case "REJECTED":
      return `${base} bg-error-soft text-error-strong ring-error/20`;
    default:
      return `${base} bg-surface-muted text-ink-muted ring-line`;
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
    :key="row?.institutionUuid || row?.id || idx"
    @click.self="(onRowClick(row), emit('row', row))"
    class="bg-white border-b transition-colors duration-150 hover:bg-surface-muted"
  >
    <td class="p-4 font-medium text-ink-subtle">
      {{ (props.currentPage - 1) * props.perPage + idx + 1 }}
    </td>

    <td class="p-3 py-4" v-for="key in rowKeys" :key="key">
      <div v-if="key === 'status'" class="truncate">
        <span :class="getStatusStyle((row as any)?.status)">
          {{ (row as any)?.status }}
        </span>
      </div>

      <span v-else class="text-ink-muted">
        {{ formatCellValue(key as any, row) }}
      </span>
    </td>

    <td v-if="hasActions" class="p-3 text-start">
      <RouterLink
        :to="generateQuotationPath(row)"
        class="inline-flex gap-2 items-center px-3 py-1.5 text-sm font-semibold text-white bg-gradient-to-r from-orange-600 to-orange-700 rounded-full shadow-sm transition-all duration-200 hover:shadow-md hover:from-orange-700 hover:to-orange-800 focus:outline-none"
        @click.stop
      >
        <span
          class="flex justify-center items-center w-6 h-6 bg-white/20 rounded-full"
        >
          <i v-html="icons.plus" class="w-4 h-4" />
        </span>
        <span class="hidden sm:inline">Generate Quotation</span>
        <span class="sm:hidden">Generate</span>
      </RouterLink>
    </td>
  </tr>
</template>
