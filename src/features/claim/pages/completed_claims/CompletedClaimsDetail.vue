<script setup>
import DefaultPage from '@/components/DefaultPage.vue';
import { usePagination } from "@/composables/usePagination";
import { approveClaimProcessedBy, claimProccessed, getRequestedClaimByBatchDetail, updateServiceProvidedClaimStatus } from '../../api/claimApi';
import Table from '@/components/Table.vue';
import { useRoute, useRouter } from 'vue-router';
import { PaymentStatus } from '@/types/interface';
import { formatCurrency, toasted, secondDateFormat } from '@/utils/utils';
import Button from '@/components/Button.vue';
import TableWithCheckBox from '@/components/TableWithCheckBox.vue';
import { ref, onMounted, computed } from 'vue';
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
const batchCode = route.params.batchCode;
const claimUuid = route.params.claimUuid;

const store = useClaimByInstitutionBatch();

const pagination = usePagination({
  store,
  auto: true,
  reset: true,
  cb: (data) => {
    const query = { ...data };
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
  reportTitle: 'CLAIM DETAILS REPORT',
  fileName: `Claim_Details_${batchCode}`,
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
  mergeColumns: [1, 2, 9, 10], // Columns to merge across multiple items (0-indexed)
  columnWidths: [
    { width: 8 },  // #
    { width: 20 }, // Institution
    { width: 45 }, // Insured Name
    { width: 15 }, // Item Code
    { width: 30 }, // Item Name
    { width: 12 }, // Quantity
    { width: 25 }, // Unit Price
    { width: 25 }, // Total Price
    { width: 22 }, // Amount
    { width: 15 }, // Provided Date
    { width: 15 }, // Status
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
    
    // Updated date formatting
    const providedDate = formatDate(row.providedDate);
    
    return [
      isFirstItem ? rowIndex : '', // #
      isFirstItem ? institutionName : '', // Institution
      isFirstItem ? (row.insuredName || 'N/A') : '', // Insured Name
      item?.itemCode || 'N/A', // Item Code
      item?.itemName || 'N/A', // Item Name
      item?.quantity || 0, // Quantity
      formatCurrency(item?.unitPrice || 0), // Unit Price
      formatCurrency(item?.totalPrice || 0), // Total Price
      isFirstItem ? formatCurrency(row.amount || 0) : '', // Amount
      isFirstItem ? providedDate : '', // Provided Date
      isFirstItem ? (row.serviceClaimStatus || 'PENDING') : '' // Status
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
  reportTitle: 'CLAIM DETAILS REPORT',
  fileName: `Claim_Details_${batchCode}`,
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

// process/reject multiple selected
function batchProcessed() {
  if (processedClaimReq.pending.value) return;

  openModal('CompleteSelectedClaim', { title: 'Complete Selected Claims' }, (result) => {
    const body = checked.value.slice();
    if (!body.length) return;
    
    const action = result?.action || 'CHECKED';
    const comment = result?.comment;

    processedClaimReq.send(
      () => updateServiceProvidedClaimStatus(claimUuid, action, body, comment),
      (res) => {
        if (res && res.status >= 200 && res.status < 300) {
          const actionText = action === 'CHECKED' ? 'CHECKED' : 'REJECTED';
          toasted(true, `Selected services marked ${actionText}`);
          
          const updatedClaims = (store.claims || []).map((claim) => {
            if (body.includes(claim.serviceProvidedUuid)) {
              return { ...claim, serviceClaimStatus: action };
            }
            return claim;
          });
          
          store.set ? store.set(updatedClaims) : (store.claims = updatedClaims);
          checked.value = [];
        }
      }
    );
  });
}

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

// modal state
const showItemsModal = ref(false);
const modalRow = ref(null);
const modalItems = ref([]);
const modalTitle = ref('Provided Items');

// Computed to determine if the modal should be view-only
const isViewOnly = computed(() => {
  if (!modalRow.value) return false;
  const status = (modalRow.value?.serviceClaimStatus || '').toUpperCase();
  return status === 'PROCESSED' || status === 'CHECKED' || status === 'REJECTED';
});

function openItemsModal(row) {
  modalRow.value = row;
  modalItems.value = row?.providedItemResponses || [];
  modalTitle.value = `Provided Items — ${row?.insuredName || row?.institutionName || ''}`;
  showItemsModal.value = true;
}

// Handle checkbox selection
function handleCheckboxChange(selected) {
  checked.value = selected.map(item => item.serviceProvidedUuid);
}

// Calculate totals for display - Updated to only count PROCESSED and CHECKED
const totals = computed(() => {
  const rows = store.claims || [];
  
  // Only include PROCESSED and CHECKED claims for amount calculation
  const approvedClaims = rows.filter(r => 
    r.serviceClaimStatus === 'PROCESSED' || r.serviceClaimStatus === 'CHECKED'
  );
  
  const totalAmount = approvedClaims.reduce((sum, row) => sum + (row.amount || 0), 0);
  
  const totalItems = rows.reduce((sum, row) => {
    const items = row.providedItemResponses || [];
    return sum + items.reduce((itemSum, item) => itemSum + (item.quantity || 0), 0);
  }, 0);
  
  const processedCount = rows.filter(r => r.serviceClaimStatus === 'PROCESSED').length;
  const pendingCount = rows.filter(r => r.serviceClaimStatus === 'PENDING').length;
  const checkedCount = rows.filter(r => r.serviceClaimStatus === 'CHECKED').length;
  const rejectedCount = rows.filter(r => r.serviceClaimStatus === 'REJECTED').length;
  
  return {
    totalAmount,
    totalItems,
    processedCount,
    pendingCount,
    checkedCount,
    rejectedCount,
    totalCount: rows.length
  };
});
</script>

<template>
  <DefaultPage>
    <template #more>
      <div class="flex gap-3 items-center ml-auto">
        <!-- Export Buttons -->
        <Button
          @click="exportExcel"
          :pending="exportingExcel"
          type="elevated"
          size="sm"
          class="flex gap-2 items-center text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-200"
        >
          <div v-html="icons.documentArrowDown" class="w-4 h-4"></div>
          Export Excel
        </Button>
        
        <Button
          @click="exportPdf"
          :pending="exportingPdf"
          type="elevated"
          size="sm"
          class="flex gap-2 items-center text-white bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 shadow-rose-200"
        >
          <div v-html="icons.documentPdf" class="w-4 h-4"></div>
          Export PDF
        </Button>

        <Button 
          :pending="processedClaimReq.pending.value" 
          @click="batchProcessed" 
          type="elevated" 
          size="sm"
          v-if="checked.length"
          class="text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-blue-200"
        >
          <div v-html="icons.checkCircle" class="w-4 h-4"></div>
          Process Selected ({{ checked.length }})
        </Button>
      </div>
    </template>

    <!-- Summary Cards with Modern Design -->
    <div class="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2 lg:grid-cols-4">
      <div class="p-4 bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 shadow-sm transition-all duration-200 hover:shadow-md">
        <div class="flex items-center">
          <div class="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
            <div v-html="icons.documentText" class="w-6 h-6 text-blue-600"></div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Total Claims</p>
            <div class="flex items-baseline">
              <p class="text-2xl font-bold text-gray-900">{{ totals.totalCount }}</p>
              <span class="px-2 py-0.5 ml-2 text-xs font-medium text-blue-700 bg-blue-100 rounded-full">
                {{ Math.round((totals.totalCount / totals.totalCount) * 100) || 0 }}%
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="p-4 bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 shadow-sm transition-all duration-200 hover:shadow-md">
        <div class="flex items-center">
          <div class="p-3 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200">
            <div v-html="icons.currencyDollar" class="w-6 h-6 text-emerald-600"></div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Approved Amount</p>
            <div class="flex items-baseline">
              <p class="text-2xl font-bold text-gray-900">ETB {{ formatCurrency(totals.totalAmount) }}</p>
            </div>
            <p class="mt-1 text-xs text-gray-500">
              {{ totals.processedCount + totals.checkedCount }} approved claims ({{ totals.rejectedCount }} rejected excluded)
            </p>
          </div>
        </div>
      </div>
      
      <div class="p-4 bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 shadow-sm transition-all duration-200 hover:shadow-md">
        <div class="flex items-center">
          <div class="p-3 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border border-amber-200">
            <div v-html="icons.shoppingBag" class="w-6 h-6 text-amber-600"></div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Total Items</p>
            <div class="flex items-baseline">
              <p class="text-2xl font-bold text-gray-900">{{ totals.totalItems }}</p>
              <span class="px-2 py-0.5 ml-2 text-xs font-medium text-amber-700 bg-amber-100 rounded-full">
                {{ Math.round((totals.totalItems / totals.totalCount) || 0) }}/claim
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="p-4 bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 shadow-sm transition-all duration-200 hover:shadow-md">
        <div class="flex items-center">
          <div class="p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
            <div v-html="icons.chartBar" class="w-6 h-6 text-purple-600"></div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Status Overview</p>
            <div class="flex items-center mt-1 space-x-3">
              <span class="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full">
                <div v-html="icons.clock" class="mr-1 w-3 h-3"></div>
                {{ totals.pendingCount }}
              </span>
              <span class="inline-flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                <div v-html="icons.checkCircle" class="mr-1 w-3 h-3"></div>
                {{ totals.processedCount }}
              </span>
              <span class="inline-flex items-center px-2 py-1 text-xs font-medium text-emerald-700 bg-emerald-100 rounded-full">
                <div v-html="icons.shieldCheck" class="mr-1 w-3 h-3"></div>
                {{ totals.checkedCount }}
              </span>
              <span class="inline-flex items-center px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-full">
                <div v-html="icons.xCircle" class="mr-1 w-3 h-3"></div>
                {{ totals.rejectedCount }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Selection Info Banner -->
    <div v-if="checked.length" class="p-4 mb-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
      <div class="flex justify-between items-center">
        <div class="flex items-center">
          <div v-html="icons.informationCircle" class="mr-3 w-5 h-5 text-blue-600"></div>
          <div>
            <p class="text-sm font-semibold text-blue-800">
              {{ checked.length }} claim{{ checked.length > 1 ? 's' : '' }} selected
            </p>
            <p class="text-sm text-blue-700">
              Click "Process Selected" to mark as CHECKED or REJECTED
            </p>
          </div>
        </div>
        <Button
          @click="checked = []"
          type="text"
          size="sm"
          class="text-blue-700 hover:text-blue-900"
        >
          <div v-html="icons.xCircle" class="w-4 h-4"></div>
          Clear Selection
        </Button>
      </div>
    </div>

    <!-- Main Table Area -->
    <div class="overflow-hidden bg-white rounded-xl border border-gray-200 shadow-sm">
      <Table
        :pending="pagination.pending.value"
        :headers="{
          head: [ 'Institution', 'Insured Name', 'Items', 'Amount', 'Provided Date', 'Status', 'Actions'],
          row: ['', 'institutionName', 'insuredName', 'itemsCount', 'amount', 'providedDate', 'serviceClaimStatus']
        }"
        :rows="store.claims"
        :selectedRows="checked"
        :rowCom="ClaimDetailTableRow"
        @selection-change="handleCheckboxChange"
        placeholder="No claims found in this batch"
      >
        <template #row>
          <ClaimDetailTableRow
            :rowData="store.claims"
            :rowKeys="['', 'institutionName','insuredName','itemsCount','amount','providedDate','serviceClaimStatus']"
            :headKeys="['#', 'Institution','Insured Name','Items','Amount','Provided Date','Status','Actions']"
            @viewItems="openItemsModal"
          />
        </template>
      </Table>
      
      <!-- Empty State -->
      <div v-if="!store.claims?.length && !pagination.pending.value" class="p-12 text-center">
        <div class="inline-flex p-4 mb-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200">
          <div v-html="icons.documentSearch" class="w-12 h-12 text-gray-400"></div>
        </div>
        <h3 class="mb-2 text-lg font-semibold text-gray-900">No Claims Found</h3>
        <p class="mx-auto max-w-md text-gray-600">
          There are no claims available for this batch. Please check if the batch code is correct or if claims have been submitted.
        </p>
      </div>
    </div>

    <!-- Export Info Card -->
    <div v-if="store.claims?.length" class="p-5 mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 shadow-sm">
      <div class="flex items-start">
        <div class="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl border border-blue-300">
          <div v-html="icons.documentDownload" class="w-6 h-6 text-blue-700"></div>
        </div>
        <div class="flex-1 ml-4">
          <div class="flex justify-between items-start">
            <div>
              <p class="text-sm font-bold text-blue-900">Export Options Available</p>
              <p class="mt-1 text-sm text-blue-800">
                Download this claim data for reporting, auditing, or analysis purposes.
              </p>
            </div>
            <div class="flex gap-2">
              <button 
                @click="exportExcel"
                class="inline-flex gap-2 items-center px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-lg border border-emerald-200 transition-colors hover:bg-emerald-100"
              >
                <div v-html="icons.documentArrowDown" class="w-3 h-3"></div>
                Excel
              </button>
              <button 
                @click="exportPdf"
                class="inline-flex gap-2 items-center px-3 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 rounded-lg border border-rose-200 transition-colors hover:bg-rose-100"
              >
                <div v-html="icons.documentPdf" class="w-3 h-3"></div>
                PDF
              </button>
            </div>
          </div>
          
          <!-- Feature List -->
          <div class="grid grid-cols-1 gap-3 mt-4 md:grid-cols-2">
            <div class="flex items-start">
              <div v-html="icons.checkCircle" class="mt-0.5 mr-2 w-4 h-4 text-emerald-500"></div>
              <div>
                <p class="text-xs font-medium text-blue-900">Excel Features</p>
                <p class="text-xs text-blue-700">Formatted calculations, summary sheets, itemized details</p>
              </div>
            </div>
            <div class="flex items-start">
              <div v-html="icons.checkCircle" class="mt-0.5 mr-2 w-4 h-4 text-emerald-500"></div>
              <div>
                <p class="text-xs font-medium text-blue-900">PDF Features</p>
                <p class="text-xs text-blue-700">Professional header, pagination, audit-ready format</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

<CheckProvidedItemsMdl
  v-if="showItemsModal"
  :row="modalRow"
  :items="modalItems"
  :title="modalTitle"
  :isServiceClaimRejected="modalRow?.serviceClaimStatus === 'REJECTED'"
  :isServiceClaimCompleted="modalRow?.serviceClaimStatus === 'CHECKED' || modalRow?.serviceClaimStatus === 'PROCESSED'"
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
  background: #f1f1f1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}

/* Gradient text for special elements */
.gradient-text {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
</style>