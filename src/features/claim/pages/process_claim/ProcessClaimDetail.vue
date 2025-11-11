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
  return rows.every((r) => (r?.serviceClaimStatus || '').toUpperCase() !== 'PENDING');
});

// process/reject multiple selected
function batchProcessed() {
  if (!checked.value.length) return;

  openModal('ProcessSelectedClaim', { 
    title: 'Process Selected Claims',
    claimUuid,
    selectedUuids: checked.value.slice(),
    onSuccess: () => {
      // Refresh the table data
      pagination.send();
      checked.value = [];
    }
  });
}

// open modal to process entire claim (approve processedBy/{claimUuid})
function openProcessWholeClaim() {
  openModal('ProcessClaim', { 
    title: 'Process Claim', 
    batchCode,
    claimUuid,
    onSuccess: () => {
      // Optionally refresh current table
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
      <Button class="ml-auto" @click="batchProcessed" type="primary" v-if="checked.length">
        Process/Reject Selected
      </Button>
    </template>

    <TableWithCheckBox
      v-model="checked"
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
    </TableWithCheckBox>

    <div class="pb-8 flex justify-end" v-if="canProcessWholeClaim">
      <Button type="primary" @click="openProcessWholeClaim">
        Process Claim
      </Button>
    </div>

    <ProvidedItemsModal
      v-if="showItemsModal"
      :row="modalRow"
      :items="modalItems"
      :title="modalTitle"
      @close="showItemsModal = false"
    />
  </DefaultPage>
</template>