<script setup>
import icons from '@/utils/icons';
import { openModal } from '@customizer/modal-x';
import { Plan } from '@/types/interface';

const props = defineProps({
  rowData: { type: Array, required: true },
  rowKeys: { type: Array, required: true },
  headKeys: { type: Array, default: () => [] },
  onUpdated: { type: Function, default: () => {} },
  currentPage: { type: Number, default: 1 },
  perPage: { type: Number, default: 25 },
});

function formatPlanType(planType) {
  switch (planType) {
    case Plan['Individual Plan']:
      return 'Individual Plan';
    case Plan['Family Plan']:
      return 'Family Plan';
    case Plan['Family Shared Plan']:
      return 'Family Shared Plan';
    case Plan['Dependent Shared Plan']:
      return 'Dependent Shared Plan';
    case Plan['Dual Premium Dependent Shared Plan']:
      return 'Dual Premium Dependent Shared Plan';
    default:
      return planType;
  }
}

function statusClass(status) {
  const base = 'px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full';
  return String(status || '').toUpperCase() === 'ACTIVE'
    ? `${base} bg-success-soft text-success-strong`
    : `${base} bg-error-soft text-error-strong`;
}

function handleEdit(row) {
  openModal('EditBenefitRange', {
    data: {
      ...row,
      onUpdated: props.onUpdated,
    },
  });
}
</script>

<template>
  <tr
    v-for="(row, idx) in rowData"
    :key="row?.familyBenefitRangeUuid || idx"
    class="hover:bg-surface-muted"
  >
    <td class="px-6 py-4 text-sm font-medium text-ink whitespace-nowrap">
      {{ formatPlanType(row.planType) }}
    </td>

    <td class="px-6 py-4 text-sm text-ink whitespace-nowrap">
      {{ row.familySize ?? 'N/A' }}
    </td>

    <td class="px-6 py-4 text-sm text-ink whitespace-nowrap">
      {{ row.minLimit?.toLocaleString?.() || row.minLimit || 'N/A' }}
    </td>

    <td class="px-6 py-4 text-sm text-ink whitespace-nowrap">
      {{ row.maxLimit?.toLocaleString?.() || row.maxLimit || 'N/A' }}
    </td>

    <td class="px-6 py-4 text-sm font-medium text-ink whitespace-nowrap">
      {{ row.rate?.toLocaleString?.() || row.rate || 'N/A' }}
    </td>

    <td class="px-6 py-4 text-sm text-ink">
      <div class="max-w-xs truncate" :title="row.description">
        {{ row.description || 'N/A' }}
      </div>
    </td>

    <td class="px-6 py-4 whitespace-nowrap">
      <span :class="statusClass(row.status)">
        {{ row.status || 'UNKNOWN' }}
      </span>
    </td>

    <td class="px-6 py-4 whitespace-nowrap">
      <button class="text-primary hover:text-primary-hover" type="button" @click.stop="handleEdit(row)">
        <i v-html="icons.edit" class="w-5 h-5"></i>
      </button>
    </td>
  </tr>
</template>
