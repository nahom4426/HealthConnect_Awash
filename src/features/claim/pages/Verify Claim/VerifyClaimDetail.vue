<!-- VerifyClaimDetail.vue - Updated with better institution name retrieval -->
<script setup>
import DefaultPage from '@/components/DefaultPage.vue';
import { usePagination } from "@/composables/usePagination";
import { getRequestedClaimByBatchDetail } from '../../api/claimApi';
import Table from '@/components/Table.vue';
import { useRoute, useRouter } from 'vue-router';
import { PaymentStatus } from '@/types/interface';
import { formatCurrency, secondDateFormat } from '@/utils/utils';
import Button from '@/components/Button.vue';
import TableWithCheckBox from '@/components/TableWithCheckBox.vue';
import { ref, onMounted, computed } from 'vue';
import { openModal } from '@customizer/modal-x';
import { useClaimByInstitutionBatch } from '../../store/claimByInstitutionBatchStore';
import ProvidedItemsModal from '../../components/ProvidedItems.mdl.vue';

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

// show Process Claim button only if there is NO pending serviceClaimStatus in table
const canProcessWholeClaim = computed(() => {
  const rows = store.claims || [];
  if (!rows.length) return false;
  return rows.every((r) =>
    !['PENDING', 'REJECTION_REQUESTED'].includes(
      (r?.serviceClaimStatus || '').toUpperCase()
    )
  );
});

// process/reject multiple selected
function batchProcessed() {
  if (!checked.value.length) return;

  openModal('ProcessSelectedClaim', { 
    title: 'Process Selected Claims',
    claimUuid,
    selectedUuids: checked.value.slice(),
    store,
    onSuccess: () => {
      pagination.send();
      checked.value = [];
    }
  });
}

// open modal to process entire claim (approve processedBy/{claimUuid})
function openProcessWholeClaim() {
  openModal('VerifyClaim', { 
    title: 'Verify Claim', 
    batchCode,
    claimUuid,
    onSuccess: () => {
      pagination.send();
    }
  });
}

// modal state
const showItemsModal = ref(false);
const modalRow = ref(null);
const modalItems = ref([]);
const modalTitle = ref('Provided Items');

function openItemsModal(row) {
  modalRow.value = row;
  modalItems.value = row?.providedItemResponses || [];
  modalTitle.value = `Provided Items — ${row?.insuredName || row?.institutionName || ''}`;
  showItemsModal.value = true;
}

// Enhanced status styling for detail table
function getStatusStyle(status) {
  const base = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 shadow-sm";

  switch (status?.toUpperCase()) {
    case "ACTIVE":
      return `${base} bg-emerald-50 text-emerald-700 border border-emerald-200`;
    case "PENDING":
      return `${base} bg-amber-50 text-amber-700 border border-amber-200`;
    case "PROCESSED":
      return `${base} bg-purple-50 text-purple-700 border border-purple-200`;
    case "VERIFIED":
      return `${base} bg-blue-50 text-blue-700 border border-blue-200`;
    case "APPROVED":
      return `${base} bg-sky-50 text-sky-700 border border-sky-200`;
    case "REJECTED":
      return `${base} bg-rose-50 text-rose-700 border border-rose-200`;
    case "COMPLETED":
      return `${base} bg-indigo-50 text-indigo-700 border border-indigo-200`;
    case "REJECTION_REQUESTED":
      return `${base} bg-orange-50 text-orange-700 border border-orange-200`;
    default:
      return `${base} bg-gray-50 text-gray-600 border border-gray-200`;
  }
}

function getStatusIcon(status) {
  switch (status?.toUpperCase()) {
    case "ACTIVE":
      return "✓";
    case "PENDING":
      return "⏳";
    case "PROCESSED":
      return "🔄";
    case "VERIFIED":
      return "✅";
    case "APPROVED":
      return "⭐";
    case "REJECTED":
      return "❌";
    case "COMPLETED":
      return "🎯";
    case "REJECTION_REQUESTED":
      return "↩️";
    default:
      return "●";
  }
}

function getInitials(name) {
  if (!name || name === 'N/A') return 'I';
  return name.charAt(0).toUpperCase();
}

function getStatusBadge(status) {
  return `${getStatusIcon(status)} ${status || 'Unknown'}`;
}

// Log for debugging
console.log('Institution name:', institutionName.value);
console.log('Route state:', route.state);
console.log('Route query:', route.query);
</script>

<template>
  <DefaultPage>
    <!-- Header with Institution Name -->
    <template #header>
      <div class="flex items-center justify-between w-full">
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg">
              {{ getInitials(institutionName) }}
            </div>
            <div>
              <h1 class="text-xl font-bold text-gray-800">{{ institutionName }}</h1>
              <p class="text-sm text-gray-500">Verify Claim Details</p>
            </div>
          </div>
          <div class="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg border border-gray-200">
            <span class="text-xs font-medium text-gray-600">Batch:</span>
            <span class="text-xs font-mono text-gray-800">{{ batchCode || 'N/A' }}</span>
          </div>
        </div>
      </div>
    </template>

    <template #more>
      <Button class="ml-auto" @click="batchProcessed" type="primary" v-if="checked.length">
        <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
        </svg>
        Process/Reject Selected ({{ checked.length }})
      </Button>
    </template>

    <TableWithCheckBox
      v-model="checked"
      toBeSelected="serviceProvidedUuid"
      :pending="pagination.pending.value"
      :headers="{
        head: [ 'Insured Name', 'Items', 'Amount', 'Provided Date', 'Status', 'Actions'],
        row: [ 'insuredName', 'itemsCount', 'amount', 'providedDate', 'serviceClaimStatus', 'actions']
      }"
      :cells="{
        insuredName: (_, row) => row?.insuredName || row?.dependantName || 'N/A',
        itemsCount: (_, row) => (row?.providedItemResponses || []).length,
        amount: (value) => `$${formatCurrency(value)}`,
        providedDate: secondDateFormat,
        serviceClaimStatus: (status) => {
          return getStatusBadge(status);
        }
      }"
      :rows="store.claims"
      class="modern-table"
    >
      <template #actions="{ row }">
        <div class="flex items-center gap-2">
          <Button 
            size="xs" 
            type="elevated" 
            @click="openItemsModal(row)"
            class="px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <svg class="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
            View Items
          </Button>
        </div>
      </template>

      <!-- Custom status cell using scoped slot -->
      <template #cell-serviceClaimStatus="{ row }">
        <span :class="getStatusStyle(row.serviceClaimStatus)">
          <span class="text-xs">{{ getStatusIcon(row.serviceClaimStatus) }}</span>
          {{ row.serviceClaimStatus || 'Unknown' }}
        </span>
      </template>
    </TableWithCheckBox>

    <div class="flex justify-end pb-8 mt-4" v-if="canProcessWholeClaim">
      <Button type="primary" @click="openProcessWholeClaim" class="px-6 py-2.5 text-sm font-medium bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
        <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        Verify Claim
      </Button>
    </div>

    <ProvidedItemsModal
      v-if="showItemsModal"
      :row="modalRow"
      :items="modalItems"
      :title="modalTitle"
      @close="showItemsModal = false; pagination.send()"
    />
  </DefaultPage>
</template>

<style scoped>
.modern-table :deep(table) {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.modern-table :deep(th) {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  padding: 12px 16px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #475569;
  border-bottom: 2px solid #e2e8f0;
}

.modern-table :deep(td) {
  padding: 12px 16px;
  border-bottom: 1px solid #f1f5f9;
  transition: all 0.2s ease;
}

.modern-table :deep(tbody tr) {
  transition: all 0.2s ease;
}

.modern-table :deep(tbody tr:hover) {
  background-color: #f8fafc;
  transform: scale(1.001);
}

.modern-table :deep(tbody tr:last-child td) {
  border-bottom: none;
}

/* Status badge styles */
.modern-table :deep(.status-badge) {
  transition: all 0.3s ease;
}

.modern-table :deep(.status-badge:hover) {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* Checkbox styling */
.modern-table :deep(input[type="checkbox"]) {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 2px solid #cbd5e1;
  transition: all 0.2s ease;
  cursor: pointer;
}

.modern-table :deep(input[type="checkbox"]:checked) {
  background-color: #3b82f6;
  border-color: #3b82f6;
}

.modern-table :deep(input[type="checkbox"]:hover) {
  border-color: #3b82f6;
}

/* Status badge inline styles */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}
</style>