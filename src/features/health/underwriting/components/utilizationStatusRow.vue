<script setup>
import { defineProps } from 'vue';
import { useRouter } from 'vue-router';
import { useNavigationState } from '@/composables/useNavigationState';

const props = defineProps({
  rowData: { type: Array, required: true },
  rowKeys: { type: Array, required: true },
  headKeys: { type: Array, required: true },
  cells: {
    type: [Object, Array],
    default: () => ({}),
  },
  payerInstitutionContractUuid: {
    type: String,
    required: false,
    default: '',
  },
  isMobile: { type: Boolean, default: false },
  onView: { type: Function, default: () => {} },
  onEdit: { type: Function, default: () => {} },
  onDelete: { type: Function, default: () => {} },
  onRowClick: { type: Function, default: () => {} },
  currentPage: { type: Number, default: 1 },
  perPage: { type: Number, default: 25 },
});

const router = useRouter();
const { setShowActionButtons } = useNavigationState();

function navigateTo(path) {
  setShowActionButtons(false);
  router.push(path);
}

function getStatusStyle(status) {
  const base = 'px-3 py-0.5 rounded-full text-center';
  switch (status?.toUpperCase()) {
    case 'ACTIVE':
      return `${base} bg-success-soft text-success`;
    case 'PENDING':
      return `${base} bg-warning-soft text-warning`;
    case 'CLOSED':
      return `${base} bg-error-soft text-error`;
    default:
      return `${base} bg-surface-muted text-ink-muted`;
  }
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
</script>

<template>
  <tr
    v-for="(row, idx) in rowData"
    :key="row.payerInstitutionContractUuid || idx"
    @click.self="props.onRowClick(row)"
    class="bg-white rounded-lg border-b transition-all duration-200 cursor-pointer hover:shadow-md hover:bg-primary/5 group"
  >
    <td class="p-4 text-sm font-semibold text-ink-subtle select-none">
      {{ (props.currentPage - 1) * props.perPage + idx + 1 }}
    </td>

    <td class="p-4">
      <div class="flex flex-col">
        <span class="px-3 py-1 text-sm font-medium text-primary-hover bg-primary/5 rounded-md shadow-sm w-fit">
          {{ row.institutionName || '—' }}
        </span>
      </div>
    </td>

    <td class="p-4 font-medium text-ink-subtle">
      {{ row.contractName }}
      <div class="text-xs text-ink-subtle">
        {{ formatDate(row.beginDate) }} <span class="text-orange-500">→</span> {{ formatDate(row.endDate) }}
      </div>
    </td>

    <td class="p-4">
      <span :class="getStatusStyle(row.status)">
        {{ row.status }}
      </span>
    </td>

  <td class="flex gap-3 items-center py-4">
  <div class="flex gap-2 pt-2 border-line">
    <button
      @click.stop="navigateTo(`/insured_persons/${row?.payerInstitutionContractUuid}/${row?.institutionUuid}/${row?.institutionName}?pageContext=utilization`)"
      class="flex gap-2 items-center px-3 py-2 text-primary bg-primary/5 rounded-full transition-colors hover:bg-primary/10 hover:text-primary-hover"
      title="Utilization"
    >
      <svg xmlns="http://www.w3.org/2000/svg"
           class="w-5 h-5"
           fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M9 17v-6h13v6M9 5v6h13V5M5 5h.01M5 11h.01M5 17h.01" />
      </svg>
      <span class="text-sm font-medium">Utilization</span>
    </button>
  </div>
</td>
  </tr>
</template>
