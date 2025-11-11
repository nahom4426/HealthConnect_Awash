<script setup>
import icons from '@/utils/icons';
import { openModal } from '@customizer/modal-x';
import { useApiRequest } from '@/composables/useApiRequest';
import { toasted } from '@/utils/utils';
import { useServiceListStore } from '../store/serviceListStore';
import { removeService as apiRemoveService } from '../api/serviceApi';
import ServiceStatusCell from './ServiceStatusCell.vue';

const props = defineProps({
  rowData: { type: Array, required: true },
  rowKeys: { type: Array, required: true },
  headKeys: { type: Array, required: true },
});

const api = useApiRequest();
const serviceListStore = useServiceListStore();

function priceClass(price) {
  const p = Number(price || 0);
  const base = 'inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold';
  if (p < 200) return `${base} bg-green-50 text-green-700 border border-green-200`;
  if (p < 500) return `${base} bg-amber-50 text-amber-700 border border-amber-200`;
  return `${base} bg-purple-50 text-purple-700 border border-purple-200`;
}

function formatPrice(price) {
  if (price == null || price === '') return '—';
  try {
    return new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', maximumFractionDigits: 2 }).format(Number(price));
  } catch (_) {
    return `ETB ${price}`;
  }
}

function handleRemove(eligibleServiceUuid) {
  if (!eligibleServiceUuid) return;
  openModal(
    'Confirmation',
    {
      title: 'Remove service',
      message: 'Are you sure you want to remove this service from the contract?',
    },
    (res) => {
      if (!res) return;
      api.send(
        () => apiRemoveService(eligibleServiceUuid),
        (response) => {
          if (response.success) {
            serviceListStore.remove(eligibleServiceUuid);
          }
          toasted(response.success, 'Service removed successfully', response.error);
        }
      );
    }
  );
}
</script>

<template>
  <tr
    v-for="(row, idx) in rowData"
    :key="row?.eligibleServiceUuid || idx"
    class="bg-white border-b hover:bg-gray-50 transition-colors duration-150 ease-in-out"
  >
    <td class="p-4 font-medium text-gray-500">{{ idx + 1 }}</td>

    <td class="p-3 py-4" v-for="key in rowKeys" :key="key">
      <template v-if="key === 'status'">
        <ServiceStatusCell :row="row" />
      </template>
      <template v-else-if="key === 'price'">
        <span :class="priceClass(row.price)">{{ formatPrice(row.price) }}</span>
      </template>
      <template v-else>
        <span class="text-gray-700">{{ row?.[key] ?? 'N/A' }}</span>
      </template>
    </td>

    <td v-if="headKeys.find(h => h.toLowerCase() === 'actions')" class="p-3">
      <div class="flex flex-wrap gap-2 items-center justify-start">
        <button
          @click="openModal('ServiceManagement', row?.eligibleServiceUuid)"
          class="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 hover:shadow-sm transition-all duration-200"
        >
          <i v-html="icons.edits" class="text-blue-500" />
          <span>Edit</span>
        </button>
        <button
          @click="handleRemove(row?.eligibleServiceUuid)"
          class="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 hover:shadow-sm transition-all duration-200"
        >
          <i v-html="icons.deactivate" class="text-red-500" />
          <span>Remove</span>
        </button>
      </div>
    </td>
  </tr>
</template>
