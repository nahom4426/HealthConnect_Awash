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
  openModal('CompleteClaim', { title: 'Check Claim', batchCode }, async (payload) => {
    if (!payload) return;
    const body = { comment: payload.comment, batchCode: payload.batchCode };
    processWholeReq.send(
      () => checkClaimProcessedBy(String(claimUuid), body),
      (res) => {
        if (res && res.status >= 200 && res.status < 300) {
          toasted(true, 'Claim CHECKED successfully');
          router.push('/verify_claims')
          // optionally refresh current table
          pagination.send();
        }
      }
    );
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
      toBeSelected="serviceProvidedUuid"
      :pending="pagination.pending.value"
      :headers="{
        head: ['Institution','Insured Name','Items','Amount','Provided Date','Status','actions'],
        row: ['institutionName','insuredName','itemsCount','amount','providedDate','serviceClaimStatus']
      }"
      :cells="{
        insuredName: (_, row) => row?.insuredName || row?.dependantName || '',
        itemsCount: (_, row) => (row?.providedItemResponses || []).length,
        amount: formatCurrency,
        providedDate: secondDateFormat
      }"
      :rows="store.claims"
    >
      <template #actions="{ row }">
        <Button size="xs" type="elevated" @click="openItemsModal(row)">View Items</Button>
      </template>
    </Table>

    <div class="pb-8 flex justify-end" v-if="canProcessWholeClaim">
      <Button :pending="processWholeReq.pending.value" type="primary" @click="openProcessWholeClaim">
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