<script setup lang="ts">
type PremiumReceiptQuotationRow = {
  quotationUuid?: string;
  id?: string;
  institutionUuid?: string;
  quotationCode?: string;
  policyDebitNumber?: string;
  institutionName?: string;
  insuredName?: string;
  institutionPhone?: string;
  description?: string;
  totalPremium?: number;
  totalSumInsured?: number;
  createdDate?: string;
  paidDate?: string;
  acceptedDate?: string;
  issuedDate?: string;
  poDate?: string;
  status?: string;
  type?: string;
  policyType?: string;
};

const props = withDefaults(
  defineProps<{
    rowData: PremiumReceiptQuotationRow[];
    rowKeys: string[];
    headKeys: string[];
    cells?: Record<string, any>;
    isMobile?: boolean;
    currentPage?: number;
    perPage?: number;
    onPay?: (row: PremiumReceiptQuotationRow) => void;
  }>(),
  {
    cells: () => ({}),
    isMobile: false,
    currentPage: 1,
    perPage: 25,
    onPay: undefined,
  }
);

function formatCellValue(key: string, row: any) {
  const cellFn = (props.cells as any)?.[key];
  if (typeof cellFn === 'function') {
    return cellFn(row?.[key], row);
  }
  return row?.[key];
}

function initials(name?: string) {
  if (!name) return "—";
  return name.trim().slice(0, 2).toUpperCase();
}

function avatarColor(name?: string) {
  const palette = [
    "bg-violet-100 text-violet-700",
    "bg-blue-100 text-blue-700",
    "bg-emerald-100 text-emerald-700",
    "bg-amber-100 text-amber-700",
    "bg-rose-100 text-rose-700",
    "bg-cyan-100 text-cyan-700",
  ];
  if (!name) return palette[0];
  const code = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return palette[code % palette.length];
}

function getStatusStyle(status: any) {
  const base = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm";

  switch (String(status || "").toUpperCase()) {
    case "PAID":
      return `${base} bg-emerald-50 text-emerald-700 border border-emerald-200`;
    case "UNPAID":
      return `${base} bg-amber-50 text-amber-700 border border-amber-200`;
    case "OVERDUE":
      return `${base} bg-rose-50 text-rose-700 border border-rose-200`;
    default:
      return `${base} bg-slate-50 text-slate-700 border border-slate-200`;
  }
}

function getStatusDot(status: any) {
  switch (String(status || "").toUpperCase()) {
    case "PAID":
      return "bg-emerald-500";
    case "UNPAID":
      return "bg-amber-500";
    case "OVERDUE":
      return "bg-rose-500";
    default:
      return "bg-slate-500";
  }
}

function getPolicyTypeStyle(policyType: any) {
  const base = "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium";

  switch (String(policyType || "").toUpperCase()) {
    case "INDIVIDUAL":
      return `${base} bg-purple-50 text-purple-700 border border-purple-200`;
    case "GENERAL":
    case "CORPORATE":
      return `${base} bg-indigo-50 text-indigo-700 border border-indigo-200`;
    case "GROUP":
      return `${base} bg-teal-50 text-teal-700 border border-teal-200`;
    default:
      return `${base} bg-gray-50 text-gray-700 border border-gray-200`;
  }
}

function handlePay(row: PremiumReceiptQuotationRow) {
  const fn = props.cells?.onPay || props.onPay;
  if (typeof fn === "function") fn(row);
}
</script>

<template>
  <!-- Desktop -->
  <template v-if="!isMobile">
    <tr
      v-for="(row, idx) in rowData.filter((r) => r !== null)"
      :key="row?.quotationUuid || row?.id || idx"
      class="group bg-white border-b border-gray-100 transition-all duration-200 hover:bg-gradient-to-r hover:from-amber-50/50 hover:to-transparent cursor-pointer"
    >
      <!-- Index -->
      <td class="px-4 py-4 text-sm font-medium text-gray-400 whitespace-nowrap">
        {{ (props.currentPage - 1) * props.perPage + idx + 1 }}
      </td>

      <!-- Data Columns -->
      <td class="px-4 py-4 text-sm whitespace-nowrap" v-for="key in rowKeys.filter(k => k !== 'actions')" :key="key">
        <!-- Quotation Code with Debit Number -->
        <div v-if="key === 'quotationCode'" class="flex flex-col gap-1">
          <span class="font-mono text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg inline-block">
            {{ row?.quotationCode || "—" }}
          </span>
          <span class="text-xs text-gray-400">{{ row?.policyDebitNumber || "—" }}</span>
        </div>

        <!-- Policy Holder Info -->
        <div v-else-if="key === 'policyHolderInfo'" class="flex items-center gap-3">
          <div
            class="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-sm"
            :class="avatarColor(formatCellValue(key, row)?.name)"
          >
            {{ initials(formatCellValue(key, row)?.name) }}
          </div>
          <div class="flex flex-col gap-1">
            <div class="text-sm font-semibold text-gray-900">
              {{ formatCellValue(key, row)?.name || '—' }}
            </div>
            <div class="flex items-center gap-2">
              <span v-if="formatCellValue(key, row)?.phone && formatCellValue(key, row)?.phone !== '—'" class="text-xs text-gray-500">
                📞 {{ formatCellValue(key, row)?.phone }}
              </span>
              <span :class="getPolicyTypeStyle(formatCellValue(key, row)?.policyType)">
                {{ formatCellValue(key, row)?.policyType || 'N/A' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Premium & Sum Insured - Stacked -->
        <div v-else-if="key === 'premiumInfo'" class="flex flex-col gap-1.5">
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <div>
              <span class="text-xs text-gray-500 font-medium">Premium:</span>
              <span class="text-sm font-bold text-green-700 ml-1 tabular-nums">
                {{ formatCellValue(key, row)?.totalPremium || '—' }}
              </span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
            <div>
              <span class="text-xs text-gray-500 font-medium">Sum Insured:</span>
              <span class="text-sm font-bold text-blue-700 ml-1 tabular-nums">
                {{ formatCellValue(key, row)?.totalSumInsured || '—' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Issue Date & Status - Stacked -->
        <div v-else-if="key === 'dateStatusInfo'" class="flex flex-col gap-1.5">
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
            <div>
              <span class="text-xs text-gray-500 font-medium">Issued:</span>
              <span class="text-sm font-medium text-gray-900 ml-1">
                {{ formatCellValue(key, row)?.issuedDate || '—' }}
              </span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span :class="getStatusStyle(formatCellValue(key, row)?.status)">
              <span :class="['w-2 h-2 rounded-full', getStatusDot(formatCellValue(key, row)?.status)]"></span>
              {{ formatCellValue(key, row)?.status || 'N/A' }}
            </span>
          </div>
        </div>

        <!-- Default Text -->
        <span v-else class="text-sm text-gray-700">
          {{ formatCellValue(key, row) }}
        </span>
      </td>

      <!-- Actions Column -->
      <td class="px-4 py-4 text-start whitespace-nowrap">
        <button
          type="button"
          class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl shadow-md transition-all duration-200 hover:shadow-lg hover:from-emerald-700 hover:to-emerald-800 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 active:scale-95"
          @click.stop.prevent="handlePay(row)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span>Pay Now</span>
        </button>
      </td>
    </tr>
  </template>

  <!-- Mobile -->
  <template v-else>
    <div
      v-for="(row, idx) in rowData.filter((r) => r !== null)"
      :key="row?.quotationUuid || row?.id || idx"
      class="p-4 mx-1 mb-3 bg-white rounded-2xl border border-gray-100 shadow-sm transition-all duration-200 hover:shadow-md"
    >
      <div class="flex items-start justify-between gap-2 mb-3">
        <div class="flex items-center gap-3 min-w-0">
          <div
            class="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-sm"
            :class="avatarColor(row?.institutionName || row?.insuredName)"
          >
            {{ initials(row?.institutionName || row?.insuredName) }}
          </div>
          <div class="min-w-0">
            <h3 class="text-sm font-bold text-gray-900 truncate">{{ row?.quotationCode || "—" }}</h3>
            <p class="text-xs text-gray-500 truncate">{{ row?.institutionName || row?.insuredName || "—" }}</p>
            <p class="text-[11px] text-gray-400 truncate">{{ row?.policyDebitNumber || "—" }}</p>
          </div>
        </div>
        <span :class="getStatusStyle(row?.status)" class="shrink-0">
          <span :class="['w-1.5 h-1.5 rounded-full', getStatusDot(row?.status)]"></span>
          {{ row?.status || "—" }}
        </span>
      </div>

      <div class="grid grid-cols-2 gap-3 py-3 border-t border-gray-100">
        <div>
          <p class="text-[11px] text-gray-400 font-medium flex items-center gap-1">
            <svg class="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Premium
          </p>
          <p class="text-sm font-bold text-green-700 mt-0.5">
            {{ new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB' }).format(row?.totalPremium || 0) }}
          </p>
        </div>
        <div>
          <p class="text-[11px] text-gray-400 font-medium flex items-center gap-1">
            <svg class="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
            Sum Insured
          </p>
          <p class="text-sm font-semibold text-blue-700 mt-0.5">
            {{ new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB' }).format(row?.totalSumInsured || 0) }}
          </p>
        </div>
        <div>
          <p class="text-[11px] text-gray-400 font-medium">Issued Date</p>
          <p class="text-xs text-gray-700 mt-0.5">
            {{ row?.issuedDate ? new Date(row.issuedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—' }}
          </p>
        </div>
        <div>
          <p class="text-[11px] text-gray-400 font-medium">Policy Type</p>
          <span :class="getPolicyTypeStyle(row?.policyType)" class="inline-flex mt-0.5">
            {{ row?.policyType || 'N/A' }}
          </span>
        </div>
      </div>

      <button
        type="button"
        class="w-full mt-3 flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-sm font-semibold shadow-md hover:shadow-lg hover:from-emerald-700 hover:to-emerald-800 active:scale-95 transition-all duration-200"
        @click.stop.prevent="handlePay(row)"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        Pay Now
      </button>
    </div>
  </template>
</template>