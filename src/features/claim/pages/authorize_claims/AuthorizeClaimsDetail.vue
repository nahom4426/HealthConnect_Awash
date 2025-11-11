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

// show Process Claim button only if there is NO pending serviceClaimStatus in table
const canProcessWholeClaim = computed(() => {
  const rows = store.claims || [];
  if (!rows.length) return false;
  return rows.every((r) => (r?.serviceClaimStatus || '').toUpperCase() !== 'PROCESSED');
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
    title: 'Authorize Claim', 
    batchCode,
    claimUuid: String(claimUuid),
    onSuccess: () => {
      toasted(true, 'Claim authorized successfully');
      router.push('/authorize_claims');
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
      router.push('/authorize_claims');
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

</script>

<template>
  <DefaultPage>
    <template #more>
      <Button :pending="processedClaimReq.pending.value" class="ml-auto" @click="batchProcessed" type="primary" v-if="checked.length">
        Check/Reject Selected
      </Button>
    </template>

    <Table
      :pending="pagination.pending.value"
      :headers="{
        head: ['#', 'Institution','Insured Name','Items','Amount','Provided Date','Status','Actions'],
        row: ['', 'institutionName','insuredName','itemsCount','amount','providedDate','serviceClaimStatus']
      }"
      :rows="store.claims"
      :rowCom="ClaimDetailTableRow"
      placeholder="No claims found"
    >
      <template #row>
        <ClaimDetailTableRow
          :rowData="store.claims"
          :rowKeys="['institutionName','insuredName','itemsCount','amount','providedDate','serviceClaimStatus']"
          :headKeys="['#', 'Institution','Insured Name','Items','Amount','Provided Date','Status','Actions']"
          @viewItems="openItemsModal"
        />
      </template>
    </Table>

    <div class="pb-8 flex justify-end gap-3" v-if="canProcessWholeClaim">
      <Button :pending="processWholeReq.pending.value" type="danger" @click="openRejectWholeClaim">
        <div class="flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
          Reject Claim
        </div>
      </Button>
      <Button :pending="processWholeReq.pending.value" type="primary" @click="openProcessWholeClaim">
        <div class="flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
          Authorize Claim
        </div>
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