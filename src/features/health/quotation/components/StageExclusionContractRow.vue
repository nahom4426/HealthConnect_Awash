<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  rowData: { type: Array, required: true },
  rowKeys: { type: Array, required: true },
  headKeys: { type: Array, required: true },
  onSelect: { type: Function, default: () => {} },
  currentPage: { type: Number, default: 1 },
  perPage: { type: Number, default: 25 },
});

const emit = defineEmits(['row']);

function onRowClick(row) {
  emit('row', row);
}

function getStatusStyle(status) {
  const base = 'px-2.5 py-0.5 rounded-full text-center text-xs border';
  switch ((status || '').toUpperCase()) {
    case 'ACTIVE':
      return `${base} bg-green-50 text-green-700 border-green-200`;
    case 'PENDING':
      return `${base} bg-yellow-50 text-yellow-700 border-yellow-200`;
    case 'CLOSED':
      return `${base} bg-red-50 text-red-700 border-red-200`;
    default:
      return `${base} bg-gray-50 text-gray-600 border-gray-200`;
  }
}
</script>

<template>
  <tr
    v-for="(row, idx) in rowData"
    :key="row?.payerInstitutionContractUuid || idx"
    class="bg-white border-b border-gray-100 transition-colors cursor-pointer group hover:bg-primary/5"
    @click.self="onRowClick(row)"
  >
    <!-- # -->
    <td class="px-3 py-3 text-xs font-semibold text-gray-400 select-none">
      {{ ((props.currentPage || 1) - 1) * (props.perPage || 25) + idx + 1 }}
    </td>

    <!-- Policy -->
    <td class="px-3 py-3 font-medium text-gray-900">
      {{ row?.contractName || 'Unnamed' }}
      <div v-if="row?.contractCode" class="text-[11px] text-gray-500">Code: {{ row?.contractCode }}</div>
    </td>

    <!-- Institution -->
    <td class="px-3 py-3 text-gray-700">
      {{ row?.institutionName || '—' }}
    </td>

    <!-- Code / Number -->
    <td class="px-3 py-3">
      <div class="flex flex-col">
        <span class="text-gray-700">{{ row?.contractCode || '—' }}</span>
        <span class="text-[11px] text-gray-400">{{ row?.policyNumber || '' }}</span>
      </div>
    </td>

    <!-- Status -->
    <td class="px-3 py-3">
      <span :class="getStatusStyle(row?.status)">{{ row?.status || '—' }}</span>
    </td>

    <!-- Actions -->
    <td class="px-3 py-3 text-left  ">
      <button
        class="inline-flex gap-1 items-center px-3 py-1.5 text-xs font-semibold text-white rounded-full shadow-sm animate-none bg-primary hover:bg-primary/90"
        @click.stop="props.onSelect && props.onSelect(row)"
      >
        <span>Select</span>
      </button>
    </td>
  </tr>
</template>
