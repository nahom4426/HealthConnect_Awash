<!-- ApproveLevel1ClaimDetail.vue - Updated with institution name handling -->
<script setup>
import DefaultPage from '@/components/DefaultPage.vue';
import { usePagination } from "@/composables/usePagination";
import { checkClaimProcessedBy, claimProccessed, getRequestedClaimByBatchDetail, updateServiceProvidedClaimStatus } from '../../api/claimApi';
import Table from '@/components/Table.vue';
import { useRoute, useRouter } from 'vue-router';
import { PaymentStatus } from '@/types/interface';
import { formatCurrency, toasted, secondDateFormat } from '@/utils/utils';
import Button from '@/components/Button.vue';
import { ref, onMounted, computed } from 'vue';
import { useApiRequest } from '@/composables/useApiRequest';
import { openModal } from '@customizer/modal-x';
import { useClaimByInstitutionBatch } from '../../store/claimByInstitutionBatchStore';
import CheckProvidedItemsMdl from '../../modal/checkProvidedItems.mdl.vue';
import ClaimDetailTableRow from '../../components/ClaimDetailTableRow.vue';

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
const processedClaimReq = useApiRequest();
const processWholeReq = useApiRequest();

// show Process Claim button only if there is NO pending serviceClaimStatus in table
const canProcessWholeClaim = computed(() => {
  const rows = store.claims || [];
  if (!rows.length) return false;
  return rows.every((r) => (r?.serviceClaimStatus || '').toUpperCase() !== 'PENDING');
});

// process/reject multiple selected
function batchProcessed() {
  if (processedClaimReq.pending.value) return;

  // remark optional with action selection
  openModal('CompleteSelectedClaim', { title: 'Complete Selected Claims' }, (result) => {
    const body = checked.value.slice(); // these are serviceProvidedUuid
    if (!body.length) return;
    
    const action = result?.action || 'CHECKED';
    const comment = result?.comment;

    processedClaimReq.send(
      () => updateServiceProvidedClaimStatus(claimUuid, action, body, comment),
      (res) => {
        if (res && res.status >= 200 && res.status < 300) {
          const actionText = action === 'CHECKED' ? 'CHECKED' : 'REJECTED';
          toasted(true, `Selected services marked ${actionText}`);
          
          // Update status in store instead of removing items
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
      toasted(true, 'Claim checked successfully');
      router.push('/approveL1_claims');
      pagination.send();
    }
  });
}

// open modal to reject entire claim
function openRejectWholeClaim() {
  openModal('RejectClaim', { 
    title: 'Reject Claim', 
    batchCode,
    claimUuid: String(claimUuid),
    onSuccess: () => {
      toasted(true, 'Claim rejected successfully');
      router.push('/approveL1_claims');
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

function getInitials(name) {
  if (!name || name === 'N/A') return 'I';
  return name.charAt(0).toUpperCase();
}

// Log for debugging
console.log('Approve Level 1 Detail - Institution name:', institutionName.value);
console.log('Approve Level 1 Detail - Route state:', route.state);
console.log('Approve Level 1 Detail - Route query:', route.query);
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
              <p class="text-sm text-gray-500">Approve Level 1 Claim Details</p>
            </div>
          </div>
          <div class="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg border border-gray-200">
            <span class="text-xs font-medium text-gray-600">Batch:</span>
            <span class="text-xs font-mono text-gray-800">{{ batchCode || 'N/A' }}</span>
          </div>
          <div class="flex items-center gap-2 px-3 py-1.5 bg-purple-50 rounded-lg border border-purple-200">
            <span class="text-xs font-medium text-purple-600">Status:</span>
            <span class="text-xs font-semibold text-purple-700">VERIFIED</span>
          </div>
        </div>
      </div>
    </template>

    <template #more>
      <Button :pending="processedClaimReq.pending.value" class="ml-auto" @click="batchProcessed" type="primary" v-if="checked.length">
        <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
        </svg>
        Check/Reject Selected ({{ checked.length }})
      </Button>
    </template>

    <Table
      :pending="pagination.pending.value"
      :headers="{
        head: [ 'Institution', 'Insured Name', 'Items', 'Amount', 'Provided Date', 'Status', 'Actions'],
        row: [ 'institutionName', 'insuredName', 'itemsCount', 'amount', 'providedDate', 'serviceClaimStatus']
      }"
      :rows="store.claims"
      :rowCom="ClaimDetailTableRow"
      placeholder="No claims found"
    >
      <template #row>
        <ClaimDetailTableRow
          :rowData="store.claims"
          :rowKeys="[ 'institutionName', 'insuredName', 'itemsCount', 'amount', 'providedDate', 'serviceClaimStatus']"
          :headKeys=" [ 'Institution', 'Insured Name', 'Items', 'Amount', 'Provided Date', 'Status', 'Actions']"
          :institutionName="institutionName"
          @viewItems="openItemsModal"
        />
      </template>
    </Table>

    <div class="flex gap-3 justify-end pb-8" v-if="canProcessWholeClaim">
      <Button :pending="processWholeReq.pending.value" type="danger" @click="openRejectWholeClaim">
        <div class="flex gap-2 items-center">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
          Reject Claim
        </div>
      </Button>
      <Button :pending="processWholeReq.pending.value" type="primary" @click="openProcessWholeClaim">
        <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        Complete Claim
      </Button>
    </div>

    <CheckProvidedItemsMdl
      v-if="showItemsModal"
      :row="modalRow"
      :items="modalItems"
      :title="modalTitle"
      @close="showItemsModal = false"
    />
  </DefaultPage>
</template>