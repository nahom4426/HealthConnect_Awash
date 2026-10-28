<script setup>
import icons from '@/utils/icons';
import { openModal } from '@customizer/modal-x';
import { useApiRequest } from '@/composables/useApiRequest';
import { toasted } from '@/utils/utils';
import { useServiceListStore } from '../store/serviceListStore';
import { removeService as apiRemoveService, undoDeleteService } from '../api/serviceApi';
import ServiceStatusCell from './ServiceStatusCell.vue';

const props = defineProps({
  rowData: { type: Array, required: true },
  rowKeys: { type: Array, required: true },
  headKeys: { type: Array, required: true },
  cells: { type: [Array, Object], default: null },
  isMobile: { type: Boolean, default: false },
  currentPage: { type: Number, default: 1 },
  perPage: { type: Number, default: 25 }
});

defineEmits(['row', 'remove']);

const api = useApiRequest();
const serviceListStore = useServiceListStore();

function priceClass(price) {
  const p = Number(price || 0);
  const base = 'inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold';
  if (p < 200) return `${base} bg-success-soft text-success-strong border border-success/20`;
  if (p < 500) return `${base} bg-warning-soft text-warning-strong border border-warning/20`;
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

function formatUsageLimit(row) {
  if (!row.limitedPerYear) {
    return {
      text: 'Unlimited',
      class: 'inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-surface-muted text-ink-muted border border-line'
    };
  }
  
  const limit = row.limitedNumber || 0;
  return {
    text: `${limit}/year`,
    class: 'inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-warning-soft text-warning-strong border border-warning/20'
  };
}

function safeText(value) {
  if (value == null) return '';
  return String(value);
}

function isInactive(row) {
  return String(row?.status || '').toUpperCase() === 'INACTIVE';
}

function handleRemove(eligibleServiceUuid) {
  if (!eligibleServiceUuid) return;
  openModal(
    'Confirmation',
    {
      title: 'Deactivate service',
      message: 'Are you sure you want to deactivate this service?',
    },
    (res) => {
      if (!res) return;
      api.send(
        () => apiRemoveService(eligibleServiceUuid),
        (response) => {
          if (response.success) {
            const existing = serviceListStore.serviceList?.find(
              (el) => el.eligibleServiceUuid === eligibleServiceUuid
            );

            serviceListStore.update(eligibleServiceUuid, {
              ...(existing || {}),
              status: 'INACTIVE',
            });
          }
          toasted(response.success, 'Service deactivated successfully', response.error);
        }
      );
    }
  );
}

function handleReactivate(row) {
  const eligibleServiceUuid = row?.eligibleServiceUuid;
  if (!eligibleServiceUuid) return;

  openModal(
    'Confirmation',
    {
      title: 'Reactivate service',
      message: 'Are you sure you want to reactivate this service?',
    },
    (res) => {
      if (!res) return;
      api.send(
        () => undoDeleteService(eligibleServiceUuid),
        (response) => {
          if (response.success) {
            serviceListStore.update(eligibleServiceUuid, {
              ...row,
              status: 'ACTIVE',
            });
          }
          toasted(response.success, 'Service reactivated successfully', response.error);
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
    class="bg-white border-b transition-colors duration-150 ease-in-out hover:bg-surface-muted"
    :class="isInactive(row) ? 'opacity-80' : ''"
  >
    <td class="px-4 py-3 text-sm font-medium text-ink-subtle">{{ (props.currentPage - 1) * props.perPage + idx + 1 }}</td>

    <td class="p-3 py-4" v-for="key in rowKeys" :key="key">
      <template v-if="key === 'status'">
        <ServiceStatusCell :row="row" />
      </template>
         <template v-else-if="key === 'item'">
        <div class="max-w-[220px]">
          <div
            class="text-sm font-medium text-ink truncate"
            :title="safeText(row?.item || row?.serviceitem || '')"
          >
            {{ row?.item || row?.serviceitem || '—' }}
          </div>
        </div>
      </template>
      <template v-else-if="key === 'itemCode'">
        <div class="flex flex-col gap-1">
          <div class="text-sm font-semibold" :class="isInactive(row) ? 'text-error-strong' : 'text-ink'">
            {{ row?.itemCode ?? 'N/A' }}
          </div>
          <div>
            <span :class="formatUsageLimit(row).class">{{ formatUsageLimit(row).text }}</span>
          </div>
        </div>
      </template>
      <template v-else-if="key === 'price'">
        <span :class="priceClass(row.price)">{{ formatPrice(row.price) }}</span>
      </template>
      <template v-else-if="key === 'category'">
        <div class="max-w-[220px]">
          <div
            class="text-sm font-medium text-ink truncate"
            :title="safeText(row?.category || row?.serviceCategory || '')"
          >
            {{ row?.category || row?.serviceCategory || '—' }}
          </div>
          <div
            class="text-xs text-ink-subtle truncate"
            :title="safeText(row?.subCategory || row?.serviceSubCategory || '')"
          >
            {{ row?.subCategory || row?.serviceSubCategory || '—' }}
          </div>
        </div>
      </template>
      
      <template v-else>
        <span class="text-ink-muted">{{ row?.[key] ?? 'N/A' }}</span>
      </template>
    </td>

    <td v-if="headKeys.find(h => h.toLowerCase() === 'actions')" class="p-3">
      <div class="flex flex-wrap gap-2 justify-start items-center">
        <button
          @click="openModal('ServiceManagement', row?.eligibleServiceUuid)"
          class="flex gap-2 items-center px-3 py-1.5 text-sm font-semibold text-primary bg-primary/5 rounded-xl border border-primary/20 transition-all duration-200 hover:bg-primary/10 hover:shadow-sm"
        >
          <i v-html="icons.edit" class="text-primary" />
          <span>Edit</span>
        </button>
        
        <button
       
            @click="openModal('SetServiceLimit', row)"
          class="flex gap-2 items-center px-3 py-1.5 text-sm font-semibold text-purple-600 bg-purple-50 rounded-xl border border-purple-200 transition-all duration-200 hover:bg-purple-100 hover:shadow-sm"
        >
          <i v-html="icons.settings || icons.gear" class="text-purple-500" />
          <span>Usage Limits</span>
        </button>
        
        <button
          v-if="!isInactive(row)"
          @click="handleRemove(row?.eligibleServiceUuid)"
          class="flex gap-2 items-center px-3 py-1.5 text-sm font-semibold text-error-strong bg-error-soft rounded-xl border border-error/20 transition-all duration-200 hover:bg-error-soft hover:shadow-sm"
        >
          <i v-html="icons.deactivate|| '🚫'"  class="text-error" />
          <span>Deactivate</span>
        </button>

        <button
          v-else
          @click="handleReactivate(row)"
          class="flex gap-2 items-center px-3 py-1.5 text-sm font-semibold text-success-strong bg-success-soft rounded-xl border border-success/20 transition-all duration-200 hover:bg-success-soft hover:shadow-sm"
        >
          <i v-html="icons.activate || '✅'" class="text-success" />
          <span>Reactivate</span>
        </button>
      </div>
    </td>
  </tr>
</template>
