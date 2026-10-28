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
      return `${base} bg-success-soft text-success-strong border-success/20`;
    case 'PENDING':
      return `${base} bg-warning-soft text-warning-strong border-warning/20`;
    case 'CLOSED':
      return `${base} bg-error-soft text-error-strong border-error/20`;
    default:
      return `${base} bg-surface-muted text-ink-muted border-line`;
  }
}
</script>

<template>
  <tr
    v-for="(row, idx) in rowData"
    :key="row?.payerInstitutionContractUuid || idx"
    class="bg-white border-b border-line transition-colors cursor-pointer group hover:bg-primary/5"
    @click.self="onRowClick(row)"
  >
    <!-- # -->
    <td class="px-3 py-3 text-xs font-semibold text-ink-subtle select-none">
      {{ ((props.currentPage || 1) - 1) * (props.perPage || 25) + idx + 1 }}
    </td>

    <!-- Policy -->
    <td class="px-3 py-3 font-medium text-ink">
      {{ row?.contractName || 'Unnamed' }}
      <div v-if="row?.contractCode" class="text-[11px] text-ink-subtle">Code: {{ row?.contractCode }}</div>
    </td>

    <!-- Institution -->
    <td class="px-3 py-3 text-ink-muted">
      {{ row?.institutionName || '—' }}
    </td>

    <!-- Code / Number -->
    <td class="px-3 py-3">
      <div class="flex flex-col">
        <span class="text-ink-muted">{{ row?.contractCode || '—' }}</span>
        <span class="text-[11px] text-ink-subtle">{{ row?.policyNumber || '' }}</span>
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
