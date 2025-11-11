<script setup>
import { defineProps, ref } from 'vue';
import { formatCurrency, secondDateFormat } from '@/utils/utils';
import icons from "@/utils/icons";
import Button from '@/components/Button.vue';
import CheckProvidedItemsMdl from '../modal/checkProvidedItems.mdl.vue';

const props = defineProps({
  rowData: { type: Array, required: true },
  rowKeys: { type: Array, required: true },
  headKeys: { type: Array, default: () => [] },
  onViewItems: { type: Function, default: () => {} },
});

const emit = defineEmits(['viewItems']);

// Modal state
const showItemsModal = ref(false);
const modalRow = ref(null);
const modalItems = ref([]);
const modalTitle = ref('Provided Items');

function getStatusStyle(status) {
  const base = "px-3 py-1 rounded-full text-xs font-semibold";
  switch (status?.toUpperCase()) {
    case "PENDING": return `${base} bg-yellow-100 text-yellow-800`;
    case "PROCESSED": return `${base} bg-blue-100 text-blue-800`;
    case "CHECKED": return `${base} bg-purple-100 text-purple-800`;
    case "APPROVED": return `${base} bg-green-100 text-green-800`;
    case "AUTHORIZED": return `${base} bg-teal-100 text-teal-800`;
    case "REJECTED": return `${base} bg-red-100 text-red-800`;
    case "COMPLETED": return `${base} bg-gray-100 text-gray-800`;
    default: return `${base} bg-gray-100 text-gray-800`;
  }
}

function getItemsCount(row) {
  return (row?.providedItemResponses || []).length;
}
function openItemsModal(row) {
  modalRow.value = row;
  modalItems.value = row?.providedItemResponses || [];
  modalTitle.value = `Provided Items — ${row?.insuredName || row?.institutionName || ''}`;
  showItemsModal.value = true;
}
</script>

<template>
  <tr
    v-for="(row, idx) in rowData"
    :key="row.serviceProvidedUuid"
    class="bg-white border-b transition-colors duration-150 ease-in-out hover:bg-gray-50"
  >
    <!-- Index -->
    <td class="p-4 font-medium text-gray-500">{{ idx + 1 }}</td>

    <!-- Institution Name -->
    <td class="p-3 py-4">
      <div class="flex gap-2 items-center">
        <div class="flex justify-center items-center w-8 h-8 bg-blue-100 rounded-lg">
          <i v-html="icons.briefcase" class="w-4 h-4 text-blue-600"></i>
        </div>
        <span class="text-sm font-medium text-gray-900">{{ row.institutionName }}</span>
      </div>
    </td>

    <!-- Insured Name -->
    <td class="p-3 py-4">
      <div class="flex gap-2 items-center">
        <div class="flex justify-center items-center w-8 h-8 bg-green-100 rounded-lg">
          <i v-html="icons.user" class="w-4 h-4 text-green-600"></i>
        </div>
        <div>
          <p class="text-sm font-medium text-gray-900">
            {{ row.insuredName || row.dependantName || 'N/A' }}
          </p>
          <p v-if="row.dependantName" class="text-xs text-gray-500">
            (Dependant)
          </p>
        </div>
      </div>
    </td>

    <!-- Items Count -->
    <td class="p-3 py-4">
      <div class="flex gap-2 items-center">
        <div class="flex justify-center items-center w-8 h-8 bg-purple-100 rounded-lg">
          <i v-html="icons.list" class="w-4 h-4 text-purple-600"></i>
        </div>
        <span class="text-sm font-semibold text-gray-900">
          {{ getItemsCount(row) }} {{ getItemsCount(row) === 1 ? 'item' : 'items' }}
        </span>
      </div>
    </td>

    <!-- Amount -->
    <td class="p-3 py-4">
      <div class="flex gap-2 items-center">
        <div class="flex justify-center items-center w-8 h-8 bg-emerald-100 rounded-lg">
          <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <span class="text-sm font-bold text-gray-900">
          ETB {{ formatCurrency(row.amount) }}
        </span>
      </div>
    </td>

    <!-- Provided Date -->
    <td class="p-3 py-4">
      <div class="flex gap-2 items-center">
        <div class="flex justify-center items-center w-8 h-8 bg-orange-100 rounded-lg">
          <svg class="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
        </div>
        <span class="text-sm text-gray-700">
          {{ secondDateFormat(row.providedDate) }}
        </span>
      </div>
    </td>

    <!-- Status -->
    <td class="p-3 py-4">
      <span :class="getStatusStyle(row.serviceClaimStatus)">
        {{ row.serviceClaimStatus }}
      </span>
    </td>

    <!-- Actions -->
    <td class="p-3 py-4">
      <Button size="xs" type="elevated" @click="openItemsModal(row)">
        <div class="flex gap-1 items-center">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
          </svg>
          View Items
        </div>
      </Button>
    </td>
  </tr>

  <!-- Items Modal -->
  <CheckProvidedItemsMdl
    v-if="showItemsModal"
    :row="modalRow"
    :items="modalItems"
    :title="modalTitle"
    @close="showItemsModal = false"
  />
</template>

<style scoped>
/* Add any custom styles if needed */
</style>
