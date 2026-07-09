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
  return `/new_quotation/individual/${row?.insuranceId || row?.id || row?.insuredUuid}`;
}

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

  if (key === 'fullName') {
    return `${row?.firstName || ''} ${row?.fatherName || ''} ${row?.grandFatherName || ''}`.trim();
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
    :key="row?.insuranceId || row?.id || row?.insuredUuid || idx"
    @click.self="(onRowClick(row), emit('row', row))"
    class="bg-white border-b transition-colors duration-150 hover:bg-gray-50"
  >
    <!-- Row Number -->
    <td class="p-4 font-medium text-gray-500">
      {{ (props.currentPage - 1) * props.perPage + idx + 1 }}
    </td>

    <!-- Dynamic Columns -->
    <td class="p-3 py-4" v-for="key in rowKeys" :key="key">
      
      <!-- Full Name & Avatar -->
      <div v-if="key === 'fullName'" class="flex gap-3 items-center">
        <!-- Avatar Fallback -->
        <div class="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold text-sm">
          {{ (row?.firstName?.charAt(0) || '') + (row?.fatherName?.charAt(0) || '') || '?' }}
        </div>
        <div class="leading-tight truncate">
          <div class="font-semibold text-gray-900">
            {{ row?.firstName || '' }} {{ row?.fatherName || '' }} {{ row?.grandFatherName || '' }}
          </div>
          <div class="text-xs text-gray-500" v-if="row?.idNumber || row?.insuranceId">
            <span class="text-sm">{{ row?.gender?.toLowerCase() === 'female' ? '👩' : '👨' }}</span>
            <span class="mx-1">•</span>
            <span>ID: {{ row?.idNumber || row?.insuranceId || 'N/A' }}</span>
          </div>
        </div>
      </div>

      <!-- Dependents -->
      <div v-else-if="key === 'dependents'" class="text-start">
        <span 
          v-if="row?.dependantResponses && row.dependantResponses.length > 0"
          class="inline-flex gap-1.5 items-center px-3 py-1.5 text-sm font-semibold rounded-lg shadow-sm bg-blue-100 text-blue-700"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
          </svg>
          {{ row.dependantResponses.length }}
        </span>
        <span v-else class="inline-flex gap-1.5 items-center px-3 py-1.5 text-sm font-semibold rounded-lg bg-gray-100 text-gray-600">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
          </svg>
          0
        </span>
      </div>

      <!-- Status -->
      <div v-else-if="key === 'status'" class="truncate">
        <span :class="getStatusStyle((row as any)?.status)">
          {{ (row as any)?.status }}
        </span>
      </div>

      <!-- Default -->
      <span v-else class="text-gray-700">
        {{ formatCellValue(key as any, row) }}
      </span>
    </td>

    <!-- Actions -->
    <td v-if="hasActions" class="p-3 text-start">
      <RouterLink
        :to="generateQuotationPath(row)"
        class="inline-flex gap-2 items-center px-3 py-1.5 text-sm font-semibold text-white bg-gradient-to-r from-orange-600 to-orange-700 rounded-full shadow-sm transition-all duration-200 hover:shadow-md hover:from-orange-700 hover:to-orange-800 focus:outline-none"
        @click.stop
      >
        <span class="flex justify-center items-center w-6 h-6 bg-white/20 rounded-full">
          <i v-html="icons.plus" class="w-4 h-4" />
        </span>
        <span class="hidden sm:inline">Generate Quotation</span>
        <span class="sm:hidden">Generate</span>
      </RouterLink>
    </td>
  </tr>
</template>
