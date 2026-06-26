<script setup lang="ts">
type PremiumReceiptQuotationRow = {
  quotationUuid?: string;
  id?: string;
  institutionUuid?: string;
  quotationCode?: string;
  policyDebitNumber?: string;
  institutionName?: string;
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

function formatCurrency(val: any) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "ETB" }).format(Number(val || 0));
}

function formatDate(val: any) {
  if (!val) return "—";
  return new Date(val).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
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

function statusBadge(status?: string) {
  switch (status) {
    case "UNPAID":
      return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
    case "PAID":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
    case "OVERDUE":
      return "bg-red-50 text-red-700 ring-1 ring-red-200";
    default:
      return "bg-gray-100 text-gray-600 ring-1 ring-gray-200";
  }
}

function typeBadge(type?: string) {
  return type === "EXCLUSION"
    ? "bg-purple-50 text-purple-700 ring-1 ring-purple-200"
    : "bg-sky-50 text-sky-700 ring-1 ring-sky-200";
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
      class="bg-white border-b border-gray-100 transition-colors duration-150 hover:bg-gray-50/80"
    >
      <td class="p-4 font-medium text-gray-400 text-sm">{{ (props.currentPage - 1) * props.perPage + idx + 1 }}</td>

      <td class="p-4">
        <div class="flex flex-col">
          <span class="font-semibold text-gray-900 text-sm">{{ row?.quotationCode || "—" }}</span>
          <span class="text-xs text-gray-400 mt-0.5">{{ row?.policyDebitNumber || "—" }}</span>
        </div>
      </td>

      <td class="p-4">
        <div class="flex items-center gap-2.5">
          <div
            class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            :class="avatarColor(row?.institutionName)"
          >
            {{ initials(row?.institutionName) }}
          </div>
          <div class="min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate">{{ row?.institutionName || "—" }}</p>
            <p class="text-xs text-gray-400 truncate">{{ row?.institutionPhone || "No phone" }}</p>
          </div>
        </div>
      </td>

      <td class="p-4">
        <span class="inline-flex px-2.5 py-1 rounded-md text-xs font-semibold" :class="typeBadge(row?.type)">
          {{ row?.type || "—" }}
        </span>
      </td>

      <td class="p-4 font-semibold text-gray-900 text-sm">{{ formatCurrency(row?.totalPremium) }}</td>
      <td class="p-4 text-gray-700 text-sm">{{ formatCurrency(row?.totalSumInsured) }}</td>

      <td class="p-4 text-gray-600 text-sm">{{ formatDate(row?.issuedDate) }}</td>

      <td class="p-4">
        <span class="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold" :class="statusBadge(row?.status)">
          <span class="w-1.5 h-1.5 rounded-full bg-current opacity-60 mr-1.5 self-center" />
          {{ row?.status || "—" }}
        </span>
      </td>

      <td class="p-4">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold shadow-sm shadow-emerald-200 hover:bg-emerald-700 hover:shadow-md transition-all duration-150 active:scale-95"
          @click.stop.prevent="handlePay(row)"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Pay
        </button>
      </td>
    </tr>
  </template>

  <!-- Mobile -->
  <template v-else>
    <div
      v-for="(row, idx) in rowData.filter((r) => r !== null)"
      :key="row?.quotationUuid || row?.id || idx"
      class="p-3.5 mx-1 mb-3 bg-white rounded-2xl border border-gray-100 shadow-sm transition-all duration-200 hover:shadow-md"
    >
      <div class="flex items-start justify-between gap-2 mb-3">
        <div class="flex items-center gap-2.5 min-w-0">
          <div
            class="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            :class="avatarColor(row?.institutionName)"
          >
            {{ initials(row?.institutionName) }}
          </div>
          <div class="min-w-0">
            <h3 class="text-sm font-bold text-gray-900 truncate">{{ row?.quotationCode || "—" }}</h3>
            <p class="text-xs text-gray-500 truncate">{{ row?.institutionName || "—" }}</p>
          </div>
        </div>
        <span class="inline-flex shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold" :class="statusBadge(row?.status)">
          {{ row?.status || "—" }}
        </span>
      </div>

      <div class="grid grid-cols-2 gap-2.5 py-3 border-t border-gray-100">
        <div>
          <p class="text-[11px] text-gray-400 font-medium">Total Premium</p>
          <p class="text-sm font-bold text-gray-900 mt-0.5">{{ formatCurrency(row?.totalPremium) }}</p>
        </div>
        <div>
          <p class="text-[11px] text-gray-400 font-medium">Sum Insured</p>
          <p class="text-sm font-semibold text-gray-700 mt-0.5">{{ formatCurrency(row?.totalSumInsured) }}</p>
        </div>
        <div>
          <p class="text-[11px] text-gray-400 font-medium">Issued</p>
          <p class="text-xs text-gray-700 mt-0.5">{{ formatDate(row?.issuedDate) }}</p>
        </div>
        <div>
          <p class="text-[11px] text-gray-400 font-medium">Type</p>
          <span class="inline-flex mt-0.5 px-2 py-0.5 rounded text-[11px] font-semibold" :class="typeBadge(row?.type)">
            {{ row?.type || "—" }}
          </span>
        </div>
      </div>

      <button
        type="button"
        class="w-full mt-2 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold shadow-sm shadow-emerald-200 active:scale-95 transition-all duration-150"
        @click.stop.prevent="handlePay(row)"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Pay Now
      </button>
    </div>
  </template>
</template>