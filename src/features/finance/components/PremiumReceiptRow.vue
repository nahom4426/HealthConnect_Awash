<script setup lang="ts">
type PremiumReceiptQuotationRow = {
  quotationUuid?: string;
  id?: string;
  quotationCode?: string;
  institutionName?: string;
  institutionPhone?: string;
  totalPremium?: number;
  totalSumInsured?: number;
  createdDate?: string;
  status?: string;
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
  return new Date(val).toLocaleDateString();
}

function handlePay(row: PremiumReceiptQuotationRow) {
  const fn = props.cells?.onPay || props.onPay;
  if (typeof fn === "function") fn(row);
}
</script>

<template>
  <template v-if="!isMobile">
    <tr
      v-for="(row, idx) in rowData.filter((r) => r !== null)"
      :key="row?.quotationUuid || row?.id || idx"
      class="bg-white border-b transition-colors duration-150 ease-in-out hover:bg-gray-50"
    >
      <td class="p-4 font-medium text-gray-500">{{ (props.currentPage - 1) * props.perPage + idx + 1 }}</td>
      <td class="p-4 text-gray-900">{{ row?.quotationCode || "—" }}</td>
      <td class="p-4 text-gray-900">{{ row?.institutionName || "—" }}</td>
      <td class="p-4 text-gray-700">{{ row?.institutionPhone || "—" }}</td>
      <td class="p-4 font-semibold text-gray-900">{{ formatCurrency(row?.totalPremium) }}</td>
      <td class="p-4 font-semibold text-gray-900">{{ formatCurrency(row?.totalSumInsured) }}</td>
      <td class="p-4 text-gray-700">{{ formatDate(row?.createdDate) }}</td>
      <td class="p-4 text-gray-700">{{ row?.status || "—" }}</td>
      <td class="p-4">
        <button
          type="button"
          class="text-blue-600 hover:text-blue-800 text-sm font-semibold"
          @click.stop.prevent="handlePay(row)"
        >
          Pay
        </button>
      </td>
    </tr>
  </template>

  <template v-else>
    <div
      v-for="(row, idx) in rowData.filter((r) => r !== null)"
      :key="row?.quotationUuid || row?.id || idx"
      class="p-2 mx-0.5 mb-2 bg-white rounded-lg border border-gray-200 shadow-sm transition-all duration-200 sm:p-3 hover:shadow-md sm:mb-3 sm:mx-2"
    >
      <div class="flex flex-col mb-2 space-y-1 sm:flex-row sm:justify-between sm:items-start sm:space-y-0 sm:mb-3">
        <div class="flex-1 min-w-0">
          <h3 class="text-xs font-semibold text-gray-900 truncate sm:text-sm">{{ row?.quotationCode || "—" }}</h3>
          <p class="text-xs text-gray-500 truncate">{{ row?.institutionName || "—" }}</p>
        </div>
        <div class="flex-shrink-0 mt-1 sm:mt-0">
          <span class="inline-flex justify-center items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
            {{ row?.status || "—" }}
          </span>
        </div>
      </div>

      <div class="py-2 mb-2 space-y-1 border-t border-gray-100 sm:py-2 sm:mb-2">
        <div class="flex justify-between items-start py-0.5">
          <span class="flex-shrink-0 text-xs font-medium text-gray-500">Phone:</span>
          <span class="ml-2 text-xs text-right text-gray-900 truncate">{{ row?.institutionPhone || "—" }}</span>
        </div>
        <div class="flex justify-between items-start py-0.5">
          <span class="flex-shrink-0 text-xs font-medium text-gray-500">Total Premium:</span>
          <span class="ml-2 text-xs font-semibold text-right text-gray-900 truncate">{{ formatCurrency(row?.totalPremium) }}</span>
        </div>
        <div class="flex justify-between items-start py-0.5">
          <span class="flex-shrink-0 text-xs font-medium text-gray-500">Total Sum Insured:</span>
          <span class="ml-2 text-xs font-semibold text-right text-gray-900 truncate">{{ formatCurrency(row?.totalSumInsured) }}</span>
        </div>
        <div class="flex justify-between items-start py-0.5">
          <span class="flex-shrink-0 text-xs font-medium text-gray-500">Created Date:</span>
          <span class="ml-2 text-xs text-right text-gray-900 truncate">{{ formatDate(row?.createdDate) }}</span>
        </div>
      </div>

      <div class="flex flex-col gap-1.5 pt-2 border-t border-gray-100 sm:flex-row sm:gap-2 sm:pt-2">
        <button
          type="button"
          class="flex flex-1 gap-1 justify-center items-center px-2 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-md border border-blue-200 transition-all duration-200 hover:bg-blue-100"
          @click.stop.prevent="handlePay(row)"
        >
          Pay
        </button>
      </div>
    </div>
  </template>
</template>
