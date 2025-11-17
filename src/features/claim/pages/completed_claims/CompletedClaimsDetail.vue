<script setup>
import DefaultPage from '@/components/DefaultPage.vue';
import { usePagination } from "@/composables/usePagination";
import { getRequestedClaimByBatchDetail } from '../../api/claimApi';
import { useRoute, useRouter } from 'vue-router';
import { PaymentStatus } from '@/types/interface';
import { formatCurrency, toasted, secondDateFormat } from '@/utils/utils';
import Button from '@/components/Button.vue';
import TableWithCheckBox from '@/components/TableWithCheckBox.vue';
import { ref, onMounted, computed } from 'vue';
import { useApiRequest } from '@/composables/useApiRequest';
import { openModal } from '@customizer/modal-x';
import { useCompletedClaimByInstitutionBatch } from '../../store/completedClaimByInstitutionBatchStore';
import CheckProvidedItemsMdl from '../../modal/checkProvidedItems.mdl.vue';

const router = useRouter();
const route = useRoute();
const batchCode = route.params.batchCode;
const claimUuid = route.params.claimUuid;

const store = useCompletedClaimByInstitutionBatch();

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

// show View Details button only if there are items in the table
const hasClaims = computed(() => {
  return (store.claims || []).length > 0;
});

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
    <TableWithCheckBox
      v-model="checked"
      toBeSelected="serviceProvidedUuid"
      :pending="pagination.pending.value"
      :headers="{
        head: ['Institution', 'Insured Name', 'Items', 'Amount', 'Provided Date', 'Status', 'actions'],
        row: ['institutionName', 'insuredName', 'itemsCount', 'amount', 'providedDate', 'serviceClaimStatus']
      }"
      :cells="{
        insuredName: (_, row) => row?.insuredName || row?.dependantName || '',
        itemsCount: (_, row) => (row?.providedItemResponses || []).length,
        amount: formatCurrency,
        providedDate: secondDateFormat,
        serviceClaimStatus: (status) => status || 'APPROVED'
      }"
      :rows="store.claims"
    >
      <template #actions="{ row }">
        <Button size="xs" type="elevated" @click="openItemsModal(row)">View Items</Button>
      </template>
    </TableWithCheckBox>

    <div v-if="!hasClaims" class="text-center py-8 text-gray-500">
      No completed claims found for this batch.
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