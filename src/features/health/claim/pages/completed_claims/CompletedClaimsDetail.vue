<!-- CompletedClaimsDetail.vue - Updated with institution name handling -->
<script setup>
import DefaultPage from '@/components/DefaultPage.vue';
import { usePagination } from "@/composables/usePagination";
import { approveClaimProcessedBy, claimProccessed, getRequestedClaimByBatchDetail, updateServiceProvidedClaimStatus, settleClaimPayment } from '../../api/claimApi';
import Table from '@/components/Table.vue';
import { useRoute, useRouter } from 'vue-router';
import { PaymentStatus } from '@/types/interface';
import { formatCurrency, toasted, secondDateFormat } from '@/utils/utils';
import Button from '@/components/Button.vue';
import TableWithCheckBox from '@/components/TableWithCheckBox.vue';
import { ref, onMounted, computed, watch } from 'vue';
import { useApiRequest } from '@/composables/useApiRequest';
import { openModal } from '@customizer/modal-x';
import { useClaimByInstitutionBatch } from '../../store/claimByInstitutionBatchStore';
import CheckProvidedItemsMdl from '../../modal/checkProvidedItems.mdl.vue';
import ClaimDetailTableRow from '../../components/ClaimDetailTableRow.vue';
import { useExportExcel } from '@/composables/useExportExcel';
import { useExportPdf } from '@/composables/useExportPdf';
import icons from "@/utils/icons";

const router = useRouter();
const route = useRoute();

// Get institution name from multiple sources with priority
const institutionName = computed(() => {
  // 1. Try to get from route state (passed via router.push or RouterLink)
  if (route.state?.institutionName) {
    return route.state.institutionName;
  }
  
  // 2. Try to get from query params
  if (route.query.institutionName) {
    return route.query.institutionName;
  }
  
  // 3. Try to get from the first claim in the store
  const firstClaim = store.claims?.[0];
  if (firstClaim?.institutionName) {
    return firstClaim.institutionName;
  }
  
  // 4. Try to get from route params (if institution name is in the URL)
  if (route.params.institutionName) {
    return route.params.institutionName;
  }
  
  // 5. Fallback to N/A
  return 'N/A';
});

const batchCode = route.params.batchCode;
const claimUuid = route.params.claimUuid;

const store = useClaimByInstitutionBatch();

const pagination = usePagination({
  store,
  auto: true,
  reset: true,
  perPage: 1000,
  cb: (data) => {
    const query = { ...data, limit: 1000 };
    if (query.search === "" || query.search == null) delete query.search;
    return getRequestedClaimByBatchDetail(query, claimUuid);
  },
});

onMounted(() => {
  if (!store.claims?.length) pagination.send();
});

const checked = ref([]);
const processedClaimReq = useApiRequest();
const processWholeReq = useApiRequest();

// Format date to display only YYYY-MM-DD
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  return dateString.split('T')[0];
}

// Export functionality - updated date formatting
const { exporting: exportingExcel, exportExcel } = useExportExcel({
  reportTitle: 'COMPLETED CLAIM DETAILS REPORT',
  fileName: `Completed_Claim_${batchCode}`,
  worksheetName: 'Claim Details',
  claimInfo: {
    batchCode,
    claimUuid
  },
  headers: [
    '#',
    'Institution',
    'Insured Name',
    'Item Code',
    'Item Name',
    'Quantity',
    'Unit Price',
    'Total Price',
    'Amount',
    'Provided Date',
    'Status'
  ],
  mergeColumns: [1, 2, 9, 10],
  columnWidths: [
    { width: 8 },
    { width: 20 },
    { width: 45 },
    { width: 15 },
    { width: 30 },
    { width: 12 },
    { width: 25 },
    { width: 25 },
    { width: 22 },
    { width: 15 },
    { width: 15 },
  ],
  fetchDataFn: async () => {
    if (store.claims?.length) {
      return store.claims;
    }
    
    const response = await getRequestedClaimByBatchDetail({}, claimUuid);
    return response?.content || [];
  },
  mapRowData: (row, item, isFirstItem, rowIndex) => {
    const providerName = store.claims?.[0]?.providerName || row.providerName;
    const institutionName = store.claims?.[0]?.institutionName || row.institutionName;
    
    const providedDate = formatDate(row.providedDate);
    
    return [
      isFirstItem ? rowIndex : '',
      isFirstItem ? institutionName : '',
      isFirstItem ? (row.insuredName || 'N/A') : '',
      item?.itemCode || 'N/A',
      item?.itemName || 'N/A',
      item?.quantity || 0,
      formatCurrency(item?.unitPrice || 0),
      formatCurrency(item?.totalPrice || 0),
      isFirstItem ? formatCurrency(row.amount || 0) : '',
      isFirstItem ? providedDate : '',
      isFirstItem ? (row.serviceClaimStatus || 'PENDING') : ''
    ];
  }
});

// ─── Currency helper ──────────────────────────────────────────────────────────
function formatBirr(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return '0.00 Br';
  return `${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Br`;
}

const { exporting: exportingPdf, exportPdf } = useExportPdf({
  reportTitle: 'COMPLETED CLAIM DETAILS REPORT',
  fileName: `Completed_Claim_${batchCode}`,
  claimInfo: {
    batchCode,
    claimUuid
  },
  orientation: 'landscape',
  showClaimId: false,
  showDocumentId: false,

  margins: {
    left: 12,
    right: 12,
    bottom: 40
  },

  styles: {
    fontSize: 7.5,
    cellPadding: { top: 2, right: 2, bottom: 2, left: 2 },
    overflow: 'linebreak'
  },
  headStyles: {
    fontSize: 8.5,
    cellPadding: { top: 4, right: 2, bottom: 4, left: 2 }
  },
  bodyStyles: {
    fontSize: 7.5,
    minCellHeight: 14
  },

  headers: [
    '#',
    'Provider Name',
    'Insured / Dependant',
    'Provided Date',
    'Amount',
    'Item Code',
    'Item Name',
    'Item Type',
    'Qty',
    'Unit Price',
    'Total Price',
    'Excess Used'
  ],

  columnStyles: {
    0:  { cellWidth: 20 },
    1:  { cellWidth: 65 },
    2:  { cellWidth: 120 },
    3:  { cellWidth: 52 },
    4:  { cellWidth: 90 },
    5:  { cellWidth: 38 },
    6:  { cellWidth: 95 },
    7:  { cellWidth: 42 },
    8:  { cellWidth: 26 },
    9:  { cellWidth: 68 },
    10: { cellWidth: 70 },
    11: { cellWidth: 70 },
  },

  mergeColumns: [0, 1, 2, 3, 4],

  fetchDataFn: async () => {
    if (store.claims?.length) return store.claims;
    const response = await getRequestedClaimByBatchDetail({}, claimUuid);
    return response?.content || [];
  },

  mapRowData: (row, item, isFirstItem, rowIndex) => {
    const providedDate = formatDate(row.providedDate);

    const insuredAndDep = (() => {
      const insured   = row.insuredName   || '';
      const dependant = row.dependantName || '';
      if (insured && dependant && dependant !== 'N/A') return `${insured} / ${dependant}`;
      return insured || dependant || 'N/A';
    })();

    return [
      isFirstItem ? rowIndex                        : '',
      isFirstItem ? (row.providerName    || 'N/A')  : '',
      isFirstItem ? insuredAndDep                   : '',
      isFirstItem ? providedDate                    : '',
      isFirstItem ? formatBirr(row.amount || 0)     : '',
      item?.itemCode   || 'N/A',
      item?.itemName   || 'N/A',
      item?.itemType   || 'N/A',
      item?.quantity   ?? 0,
      formatBirr(item?.unitPrice  || 0),
      formatBirr(item?.totalPrice || 0),
      typeof item?.excessUsed === 'number'
        ? formatBirr(item.excessUsed)
        : 'N/A',
    ];
  }
});

// show Process Claim button only if there is NO pending serviceClaimStatus in table
const canProcessWholeClaim = computed(() => {
  const rows = store.claims || [];
  if (!rows.length) return false;
  return rows.every((r) => (r?.serviceClaimStatus || '').toUpperCase() !== 'PROCESSED');
});

// open modal to process entire claim (approve processedBy/{claimUuid})
function openProcessWholeClaim() {
  openModal('CompleteClaim', { 
    title: 'Check Claim', 
    batchCode,
    claimUuid: String(claimUuid),
    onSuccess: () => {
      toasted(true, 'Claim CHECKED successfully');
      router.push('/verify_claims');
      pagination.send();
    }
  });
}

// open settle payment modal with selected services
function openSettlePayment() {
  if (!checked.value.length) {
    toasted(false, 'Please select at least one service to settle');
    return;
  }

  // Gather the full service objects for the selected UUIDs
  const selectedServices = (store.claims || []).filter(c =>
    checked.value.includes(c.serviceProvidedUuid)
  );

  // Get institution info from first claim
  const firstClaim = store.claims?.[0];

  openModal('SettlePayment', {
    title: 'Settle Payment',
    claimUuid: String(claimUuid),
    selectedServices,
    institutionUuid: firstClaim?.institutionUuid || '',
    institutionName: firstClaim?.institutionName || institutionName.value || '',
    onSuccess: () => {
      toasted(true, 'Payment settled successfully');
      
      // Update local state immediately for fast feedback
      const updatedClaims = (store.claims || []).map((claim) => {
        if (checked.value.includes(claim.serviceProvidedUuid)) {
          return { ...claim, serviceClaimStatus: 'PAYED' };
        }
        return claim;
      });
      store.set ? store.set(updatedClaims) : (store.claims = updatedClaims);
      
      checked.value = [];
    }
  });
}

// modal state
const showItemsModal = ref(false);
const modalRow = ref(null);
const modalItems = ref([]);
const modalTitle = ref('Provided Items');

// Computed to determine if the modal should be view-only
const isViewOnly = computed(() => {
  if (!modalRow.value) return false;
  const status = (modalRow.value?.serviceClaimStatus || '').toUpperCase();
  return status === 'PROCESSED' || status === 'CHECKED' || status === 'REJECTED' || status === 'COMPLETED';
});

function openItemsModal(row) {
  modalRow.value = row;
  modalItems.value = row?.providedItemResponses || [];
  modalTitle.value = `Provided Items — ${row?.insuredName || row?.institutionName || ''}`;
  showItemsModal.value = true;
}

function getInitials(name) {
  if (!name || name === 'N/A') return 'I';
  return name.charAt(0).toUpperCase();
}

// Handle checkbox selection
function handleCheckboxChange(selected) {
  checked.value = selected.map(item => item.serviceProvidedUuid);
}

// Watcher to ensure 'PAYED' items are not selectable
watch(checked, (newVal) => {
  const payedUuids = (store.claims || [])
    .filter(c => c.serviceClaimStatus === 'PAYED' || c.serviceClaimStatus === 'PAID')
    .map(c => c.serviceProvidedUuid);
  
  const filtered = newVal.filter(id => !payedUuids.includes(id));
  if (filtered.length !== newVal.length) {
    checked.value = filtered;
  }
});

// Calculate totals for display
const totals = computed(() => {
  const rows = store.claims || [];
  
  // Sum ALL claims in the batch for totalAmount
  const totalAmount = rows.reduce((sum, row) => sum + (row.amount || 0), 0);
  
  const totalItems = rows.reduce((sum, row) => {
    const items = row.providedItemResponses || [];
    return sum + items.reduce((itemSum, item) => itemSum + (item.quantity || 0), 0);
  }, 0);
  
  const processedCount = rows.filter(r => r.serviceClaimStatus === 'PROCESSED').length;
  const pendingCount = rows.filter(r => r.serviceClaimStatus === 'PENDING').length;
  const checkedCount = rows.filter(r => r.serviceClaimStatus === 'CHECKED').length;
  const rejectedCount = rows.filter(r => r.serviceClaimStatus === 'REJECTED').length;
  const completedCount = rows.filter(r => r.serviceClaimStatus === 'COMPLETED').length;
  
  return {
    totalAmount,
    totalItems,
    processedCount,
    pendingCount,
    checkedCount,
    rejectedCount,
    completedCount,
    totalCount: rows.length
  };
});

// Log for debugging
</script>

<template>
  <DefaultPage>
    <!-- Header with Institution Name -->
    <template #header>
      <div class="flex items-center justify-between w-full">
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary flex items-center justify-center text-white font-bold shadow-lg">
              {{ getInitials(institutionName) }}
            </div>
            <div>
              <h1 class="text-xl font-bold text-ink">{{ institutionName }}</h1>
              <p class="text-sm text-ink-subtle">Completed Claim Details</p>
            </div>
          </div>
          <div class="flex items-center gap-2 px-3 py-1.5 bg-surface-muted rounded-lg border border-line">
            <span class="text-xs font-medium text-ink-muted">Batch:</span>
            <span class="text-xs font-mono text-ink">{{ batchCode || 'N/A' }}</span>
          </div>
          <div class="flex items-center gap-2 px-3 py-1.5 bg-success-soft rounded-lg border border-success/20">
            <span class="text-xs font-medium text-success">Status:</span>
            <span class="text-xs font-semibold text-success-strong">COMPLETED</span>
          </div>
        </div>
      </div>
    </template>

    <template #more>
      <div class="flex gap-3 items-center ml-auto">
        <!-- Export Buttons -->
        <Button
          @click="exportExcel"
          :pending="exportingExcel"
          type="elevated"
          size="sm"
          class="flex gap-2 items-center text-white bg-gradient-to-r from-success to-success hover:from-success hover:to-success-strong shadow-emerald-200"
        >
          <div v-html="icons.documentArrowDown" class="w-4 h-4"></div>
          Export Excel
        </Button>
        
        <Button
          @click="exportPdf"
          :pending="exportingPdf"
          type="elevated"
          size="sm"
          class="flex gap-2 items-center text-white bg-gradient-to-r from-error to-error hover:from-error hover:to-error-strong shadow-rose-200"
        >
          <div v-html="icons.documentPdf" class="w-4 h-4"></div>
          Export PDF
        </Button>

        <Button
          @click="openSettlePayment"
          type="elevated"
          size="sm"
          v-if="checked.length"
          class="flex gap-2 items-center text-white bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 shadow-teal-200"
        >
          <div v-html="icons.currencyDollar" class="w-4 h-4"></div>
          Settle Payment ({{ checked.length }})
        </Button>
      </div>
    </template>

    <!-- Summary Cards with Modern Design -->
    <div class="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2 lg:grid-cols-4">
      <div class="p-4 bg-gradient-to-br from-white to-surface-muted rounded-xl border border-line shadow-sm transition-all duration-200 hover:shadow-md">
        <div class="flex items-center">
          <div class="p-3 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl border border-primary/20">
            <div v-html="icons.documentText" class="w-6 h-6 text-primary"></div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-ink-muted">Total Claims</p>
            <div class="flex items-baseline">
              <p class="text-2xl font-bold text-ink">{{ totals.totalCount }}</p>
              <span class="px-2 py-0.5 ml-2 text-xs font-medium text-primary-hover bg-primary/10 rounded-full">
                {{ Math.round((totals.totalCount / totals.totalCount) * 100) || 0 }}%
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="p-4 bg-gradient-to-br from-white to-surface-muted rounded-xl border border-line shadow-sm transition-all duration-200 hover:shadow-md">
        <div class="flex items-center">
          <div class="p-3 bg-gradient-to-br from-success-soft to-success-soft rounded-xl border border-success/20">
            <div v-html="icons.currencyDollar" class="w-6 h-6 text-success"></div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-ink-muted">Total Amount</p>
            <div class="flex items-baseline">
              <p class="text-2xl font-bold text-ink">ETB {{ formatCurrency(totals.totalAmount) }}</p>
            </div>
            <p class="mt-1 text-xs text-ink-subtle">
              Across all {{ totals.totalCount }} claims
            </p>
          </div>
        </div>
      </div>
      
      <div class="p-4 bg-gradient-to-br from-white to-surface-muted rounded-xl border border-line shadow-sm transition-all duration-200 hover:shadow-md">
        <div class="flex items-center">
          <div class="p-3 bg-gradient-to-br from-warning-soft to-warning-soft rounded-xl border border-warning/20">
            <div v-html="icons.shoppingBag" class="w-6 h-6 text-warning"></div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-ink-muted">Total Items</p>
            <div class="flex items-baseline">
              <p class="text-2xl font-bold text-ink">{{ totals.totalItems }}</p>
              <span class="px-2 py-0.5 ml-2 text-xs font-medium text-warning-strong bg-warning-soft rounded-full">
                {{ Math.round((totals.totalItems / totals.totalCount) || 0) }}/claim
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="p-4 bg-gradient-to-br from-white to-surface-muted rounded-xl border border-line shadow-sm transition-all duration-200 hover:shadow-md">
        <div class="flex items-center">
          <div class="p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
            <div v-html="icons.chartBar" class="w-6 h-6 text-purple-600"></div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-ink-muted">Status Overview</p>
            <div class="flex items-center mt-1 space-x-3">
              <span class="inline-flex items-center px-2 py-1 text-xs font-medium text-primary-hover bg-primary/10 rounded-full">
                <div v-html="icons.clock" class="mr-1 w-3 h-3"></div>
                {{ totals.pendingCount }}
              </span>
              <span class="inline-flex items-center px-2 py-1 text-xs font-medium text-success-strong bg-success-soft rounded-full">
                <div v-html="icons.checkCircle" class="mr-1 w-3 h-3"></div>
                {{ totals.processedCount }}
              </span>
              <span class="inline-flex items-center px-2 py-1 text-xs font-medium text-success-strong bg-success-soft rounded-full">
                <div v-html="icons.shieldCheck" class="mr-1 w-3 h-3"></div>
                {{ totals.checkedCount }}
              </span>
              <span class="inline-flex items-center px-2 py-1 text-xs font-medium text-error-strong bg-error-soft rounded-full">
                <div v-html="icons.xCircle" class="mr-1 w-3 h-3"></div>
                {{ totals.rejectedCount }}
              </span>
              <span class="inline-flex items-center px-2 py-1 text-xs font-medium text-primary-hover bg-primary/10 rounded-full">
                <div v-html="icons.checkCircle" class="mr-1 w-3 h-3"></div>
                {{ totals.completedCount }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Selection Info Banner -->
    <div v-if="checked.length" class="p-4 mb-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl border border-primary/20">
      <div class="flex justify-between items-center">
        <div class="flex items-center">
          <div v-html="icons.informationCircle" class="mr-3 w-5 h-5 text-primary"></div>
          <div>
            <p class="text-sm font-semibold text-primary-hover">
              {{ checked.length }} claim{{ checked.length > 1 ? 's' : '' }} selected
            </p>
            <p class="text-sm text-primary-hover">
              Click "Settle Payment" to settle the selected claims
            </p>
          </div>
        </div>
        <Button
          @click="checked = []"
          type="text"
          size="sm"
          class="text-primary-hover hover:text-primary-hover"
        >
          <div v-html="icons.xCircle" class="w-4 h-4"></div>
          Clear Selection
        </Button>
      </div>
    </div>

    <!-- Main Table Area -->
    <div class="overflow-hidden bg-white rounded-xl border border-line shadow-sm">
      <TableWithCheckBox
        :pending="pagination.pending.value"
        :show-pagination="false"
        v-model="checked"
        to-be-selected="serviceProvidedUuid"
        :headers="{
          head: ['Institution', 'Insured Name', 'Items', 'Amount', 'Provided Date', 'Status', 'Actions'],
          row: [ 'institutionName', 'insuredName', 'itemsCount', 'amount', 'providedDate', 'serviceClaimStatus']
        }"
        :rows="store.claims"
        :rowCom="ClaimDetailTableRow"
        :rowComProps="{ selectable: true }"
        placeholder="No claims found in this batch"
      />
      
      <!-- Empty State -->
      <div v-if="!store.claims?.length && !pagination.pending.value" class="p-12 text-center">
        <div class="inline-flex p-4 mb-4 bg-gradient-to-br from-surface-muted to-surface-muted rounded-2xl border border-line">
          <div v-html="icons.documentSearch" class="w-12 h-12 text-ink-subtle"></div>
        </div>
        <h3 class="mb-2 text-lg font-semibold text-ink">No Claims Found</h3>
        <p class="mx-auto max-w-md text-ink-muted">
          There are no claims available for this batch. Please check if the batch code is correct or if claims have been submitted.
        </p>
      </div>
    </div>



    <CheckProvidedItemsMdl
      v-if="showItemsModal"
      :row="modalRow"
      :items="modalItems"
      :title="modalTitle"
      :isServiceClaimRejected="modalRow?.serviceClaimStatus === 'REJECTED'"
      :isServiceClaimCompleted="modalRow?.serviceClaimStatus === 'CHECKED' || modalRow?.serviceClaimStatus === 'PROCESSED' || modalRow?.serviceClaimStatus === 'COMPLETED'"
      @close="showItemsModal = false"
    />
  </DefaultPage>
</template>

<style scoped>
/* Smooth transitions */
* {
  transition-property: background-color, border-color, color, fill, stroke, opacity, box-shadow, transform;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 200ms;
}

/* Custom scrollbar for better UX */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: rgb(var(--surface-muted));
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: rgb(var(--line-strong));
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgb(var(--ink-subtle));
}

/* Gradient text for special elements */
.gradient-text {
  background: linear-gradient(135deg, rgb(var(--primary)) 0%, rgb(var(--primary-hover)) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
</style>