<script setup lang="ts">
import type { PropType } from "vue";
import { computed, defineProps } from "vue";
import { RouterLink } from "vue-router";
import icons from "@/utils/icons";

const props = defineProps({
  rowData: {
    type: Array as PropType<any[]>,
    required: true,
  },
  rowKeys: {
    type: Array as PropType<any[]>,
    required: true,
  },
  headKeys: {
    type: Array as PropType<any[]>,
    required: true,
  },
  cells: {
    type: Object as PropType<Record<string, any>>,
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
  const base = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm";

  switch (String(status || "").toUpperCase()) {
    case "ACTIVE":
    case "APPROVED":
    case "ACCEPTED":
      return `${base} bg-success-soft text-success-strong border border-success/20`;
    case "PENDING":
    case "SUBMITTED":
      return `${base} bg-warning-soft text-warning-strong border border-warning/20`;
    case "INACTIVE":
    case "REJECTED":
      return `${base} bg-error-soft text-error-strong border border-error/20`;
    default:
      return `${base} bg-surface-muted text-ink-muted border border-line`;
  }
}

function getStatusDot(status: any) {
  switch (String(status || "").toUpperCase()) {
    case "ACTIVE":
    case "APPROVED":
    case "ACCEPTED":
      return "bg-success";
    case "PENDING":
    case "SUBMITTED":
      return "bg-warning";
    case "INACTIVE":
    case "REJECTED":
      return "bg-error";
    default:
      return "bg-ink-subtle";
  }
}

function getTypeStyle(type: any) {
  const base = "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium";

  switch (String(type || "").toUpperCase()) {
    case "QUOTATION":
      return `${base} bg-primary/5 text-primary-hover border border-primary/20`;
    case "INCLUSION":
      return `${base} bg-success-soft text-success-strong border border-success/20`;
    case "EXCLUSION":
      return `${base} bg-orange-50 text-orange-700 border border-orange-200`;
    default:
      return `${base} bg-surface-muted text-ink-muted border border-line`;
  }
}

function getPolicyTypeStyle(policyType: any) {
  const base = "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium";

  switch (String(policyType || "").toUpperCase()) {
    case "INDIVIDUAL":
      return `${base} bg-purple-50 text-purple-700 border border-purple-200`;
    case "GENERAL":
      return `${base} bg-primary/5 text-primary-hover border border-primary/20`;
    case "GROUP":
      return `${base} bg-teal-50 text-teal-700 border border-teal-200`;
    default:
      return `${base} bg-surface-muted text-ink-muted border border-line`;
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
    class="group bg-white border-b border-line transition-all duration-200 hover:bg-gradient-to-r hover:from-primary/[0.025] hover:to-transparent cursor-pointer"
  >
    <!-- Index Column -->
    <td class="px-4 py-4 text-sm font-medium text-ink-subtle whitespace-nowrap">
      {{ (props.currentPage - 1) * props.perPage + idx + 1 }}
    </td>

    <!-- Data Columns -->
    <td class="px-4 py-4 text-sm whitespace-nowrap" v-for="key in rowKeys.filter(k => k !== 'actions')" :key="key">
      <!-- Status Badge -->
      <div v-if="key === 'status'" class="flex items-center">
        <span :class="getStatusStyle((row as any)?.status)">
          <span :class="['w-2 h-2 rounded-full', getStatusDot((row as any)?.status)]"></span>
          {{ (row as any)?.status }}
        </span>
      </div>

      <!-- Quotation Code - Highlighted -->
      <div v-else-if="key === 'quotationCode'" class="font-mono text-sm font-semibold text-primary bg-primary/5 px-3 py-1 rounded-lg inline-block">
        {{ formatCellValue(key as any, row) }}
      </div>

      <!-- Policy Holder Info - Name with Policy Type below -->
      <div v-else-if="key === 'policyHolderInfo'" class="flex flex-col gap-1.5">
        <div class="text-sm font-semibold text-ink">
          {{ formatCellValue(key as any, row)?.name || '—' }}
        </div>
        <span :class="getPolicyTypeStyle(formatCellValue(key as any, row)?.policyType)">
          {{ formatCellValue(key as any, row)?.policyType || 'N/A' }}
        </span>
      </div>

      <!-- Premium & Sum Insured - Stacked -->
      <div v-else-if="key === 'premiumInfo'" class="flex flex-col gap-1.5">
        <div class="flex items-center gap-2">
          <svg class="w-4 h-4 text-success flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <div>
            <span class="text-xs text-ink-subtle font-medium">Premium:</span>
            <span class="text-sm font-bold text-success-strong ml-1 tabular-nums">
              {{ formatCellValue(key as any, row)?.totalPremium || '—' }}
            </span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <svg class="w-4 h-4 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
          </svg>
          <div>
            <span class="text-xs text-ink-subtle font-medium">Sum Insured:</span>
            <span class="text-sm font-bold text-primary-hover ml-1 tabular-nums">
              {{ formatCellValue(key as any, row)?.totalSumInsured || '—' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Accepted Date & Type - Stacked -->
      <div v-else-if="key === 'dateTypeInfo'" class="flex flex-col gap-1.5">
        <div class="flex items-center gap-2">
          <svg class="w-4 h-4 text-ink-subtle flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          <div>
            <span class="text-xs text-ink-subtle font-medium">Accepted:</span>
            <span class="text-sm font-medium text-ink ml-1">
              {{ formatCellValue(key as any, row)?.acceptedDate || '—' }}
            </span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span :class="getTypeStyle(formatCellValue(key as any, row)?.type)">
            {{ formatCellValue(key as any, row)?.type || 'N/A' }}
          </span>
        </div>
      </div>

      <!-- Default Text -->
      <span v-else class="text-sm text-ink-muted">
        {{ formatCellValue(key as any, row) }}
      </span>
    </td>

    <!-- Actions Column - Last column with text-start (no gap) -->
    <td v-if="hasActions" class="px-4 py-4 text-start whitespace-nowrap">
      <RouterLink
        :to="{ name: 'ViewAcceptedQuotation', params: { quotationUuid: (row as any)?.quotationUuid } }"
        class="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-success to-success-strong rounded-xl shadow-md transition-all duration-200 hover:shadow-lg hover:from-success-strong hover:to-success-strong hover:scale-105 focus:outline-none focus:ring-2 focus:ring-success/50"
        @click.stop
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
        </svg>
        <span class="hidden sm:inline">View Details</span>
        <span class="sm:hidden">👁️</span>
      </RouterLink>
    </td>
  </tr>
</template>