<script setup>
import { computed, defineProps, onMounted, onUnmounted } from 'vue';
import { canEditServiceProvided, editLockReason } from "../utils/serviceEditLock";
import { claimStatusLabel, claimStatusTone } from "../utils/claimStatus";
import Button from "@/components/Button.vue";
import { formatCurrency, secondDateFormat } from "@/utils/utils";

const props = defineProps({
  rowData: { type: Array, required: true },
  rowKeys: { type: Array, required: true },
  headKeys: { type: Array, required: true },
  cells: { type: Object, default: () => ({}) },
  isMobile: { type: Boolean, default: false },
  currentPage: { type: Number, default: 1 },
  perPage: { type: Number, default: 25 },
  // Append a row totalling the claimable amount under the 'amount' column
  showTotal: { type: Boolean, default: false }
});

const emit = defineEmits(['row', 'remove']);
// Truncate long text
function truncateText(text, maxLength = 25) {
  if (!text) return '-';
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
}

function normalizeName(name) {
  if (typeof name !== 'string') return '';
  return name.trim();
}

function getDisplayPersonName(row) {
  const insuredName = normalizeName(row?.insuredName);
  const dependantName = normalizeName(row?.dependantName);

  if (row?.personType === 'DEPENDENT' || row?.dependantUuid) {
    return dependantName || insuredName || '-';
  }

  return insuredName || dependantName || '-';
}

function getServiceTypeStyle(itemType) {
  if (itemType === 'SERVICE') {
    return {
      bgColor: 'bg-primary/10',
      textColor: 'text-primary-hover',
      borderColor: 'border-primary/20',
      dotColor: 'bg-primary',
      label: 'Credit Service'
    };
  }
  return {
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-200',
    dotColor: 'bg-purple-500',
    label: itemType || 'Service'
  };
}

function toggleDropdown(event, rowId) {
  event.stopPropagation();
  closeAllDropdowns();
  const dropdown = document.getElementById(`dropdown-${rowId}`);
  if (dropdown) dropdown.classList.toggle('hidden');
}

function closeAllDropdowns() {
  document.querySelectorAll('.dropdown-menu').forEach(el => el.classList.add('hidden'));
}

function handleClickOutside(event) {
  if (!event.target.closest('.dropdown-container')) {
    closeAllDropdowns();
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

function handleViewDetails(row) {
  closeAllDropdowns();
  if (props.cells?.onView && typeof props.cells.onView === 'function') {
    props.cells.onView(row);
  }
}

// Status badge: serviceClaimStatus is the source of truth
const statusLabel = claimStatusLabel;
const statusTone = claimStatusTone;

function handleEdit(row) {
  closeAllDropdowns();
  if (props.cells?.onEdit && typeof props.cells.onEdit === 'function') {
    props.cells.onEdit(row);
  }
}

function handleRemove(row) {
  emit('remove', row.serviceProvidedUuid);
}

function getCoverageLabel(item) {
  if (!item) return '-';
  if (item.authorizationUuid) return 'AUTHORIZED';
  const ex = Number(item.excessUsed);
  if (!Number.isNaN(ex) && ex > 0) return 'EXCESS';
  return '-';
}

function getRowTotalExcessUsed(row) {
  const items = Array.isArray(row?.providedItemResponses) ? row.providedItemResponses : [];
  return items.reduce((s, it) => s + (Number(it?.extraAmount) || 0), 0);
}

// claimableAmount is what the claim is validated against. service-provided/new returns it as null,
// so fall back to the items' total (which matches the backend's figure), then to amount.
function getClaimableAmount(row) {
  if (row?.claimableAmount != null) return row.claimableAmount;
  const items = Array.isArray(row?.providedItemResponses) ? row.providedItemResponses : [];
  if (items.length) return items.reduce((s, it) => s + (Number(it?.totalPrice) || 0), 0);
  return row?.amount;
}

const totalClaimable = computed(() =>
  props.rowData.reduce((sum, row) => sum + (Number(getClaimableAmount(row)) || 0), 0)
);
const amountColIndex = computed(() => props.rowKeys.indexOf('amount'));
// Columns after 'amount', plus the actions column when present
const totalTrailingCols = computed(() =>
  props.rowKeys.length - amountColIndex.value - 1 +
  (props.headKeys.some((head) => head.toLowerCase() === 'actions') ? 1 : 0)
);

function hasBilledDifference(row) {
  return Number(getClaimableAmount(row)) !== Number(row?.amount);
}

function getSourceIndicator(source) {
  const s = String(source || '').toUpperCase();
  if (s === 'MANUAL') {
    return {
      dot: 'bg-warning',
      ring: 'ring-warning/20',
      title: 'MANUAL',
    };
  }
  return {
    dot: 'bg-success',
    ring: 'ring-success/20',
    title: s || 'SYSTEM',
  };
}
</script>

<template>
  <tr 
    v-for="(row, idx) in rowData" 
    :key="row.serviceProvidedUuid"
    @click.self="emit('row', row)" 
    class="relative bg-white border-b transition-colors duration-150 ease-in-out cursor-pointer hover:bg-surface-muted"
  >  
    <td class="px-4 py-3 text-sm font-medium text-ink-subtle">
      <div class="flex gap-2 items-center">
        <span
          class="inline-flex w-2.5 h-2.5 rounded-full ring-4"
          :class="[getSourceIndicator(row.source).dot, getSourceIndicator(row.source).ring]"
          :title="`Source: ${getSourceIndicator(row.source).title}`"
        ></span>
        <span>{{ (props.currentPage - 1) * props.perPage + idx + 1 }}</span>
      </div>
    </td>
    
    <td class="p-4" v-for="key in rowKeys" :key="key">  
      <!-- Insured Name -->
      <div v-if="key === 'fullname'" class="max-w-[200px]">
        <span class="block text-sm font-medium text-ink truncate">
          {{ getDisplayPersonName(row) }}
        </span>
        <span v-if="row.dependantUuid" class="text-xs text-ink-subtle">
          (Dependant)
        </span>
      </div>

      <!-- Provider Name -->
      <div v-else-if="key === 'providerName'" class="max-w-[180px]">
        <span class="block text-sm text-ink truncate">
          {{ truncateText(row.providerName, 25) }}
        </span>
      </div>

      <!-- Institution Name -->
      <div v-else-if="key === 'institutionName'" class="max-w-[150px]">
        <span class="block text-sm text-ink-muted truncate">
          {{ truncateText(row.institutionName, 20) }}
        </span>
      </div>

      <!-- Record Number -->
      <div v-else-if="key === 'recordNumber'">
        <span
          class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-surface-muted text-ink border border-line"
          :title="`Record No: ${row.recordNumber}`"
        >
          {{ row.recordNumber || '—' }}
        </span>
      </div>

      <!-- Service Type / Item Type -->
      <div v-else-if="key === 'itemType'">
        <span 
          :class="[
            'px-3 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5',
            getServiceTypeStyle(row.itemType).bgColor,
            getServiceTypeStyle(row.itemType).textColor,
            getServiceTypeStyle(row.itemType).borderColor,
            'border'
          ]"
        >
          <span 
            class="w-1.5 h-1.5 rounded-full" 
            :class="getServiceTypeStyle(row.itemType).dotColor"
          ></span>
          {{ getServiceTypeStyle(row.itemType).label }}
        </span>
      </div>

      <!-- Provided Items Count with Hover Tooltip -->
      <div v-else-if="key === 'providedItems'" class="flex overflow-visible relative justify-center items-center group">
        <span 
          class="inline-flex justify-center items-center w-8 h-8 text-sm font-semibold text-primary-hover bg-primary/10 rounded-full border border-primary/20 cursor-help"
          :title="`${row.providedItemResponses ? row.providedItemResponses.length : 0} service items`"
        >
          {{ row.providedItemResponses ? row.providedItemResponses.length : 0 }}
        </span>
        <div
          v-if="row.providedItemResponses && row.providedItemResponses.length"
          class="hidden absolute bottom-full left-1/2 z-50 p-3 mb-2 w-80 text-left bg-white rounded-lg border border-line shadow-xl transform -translate-x-1/2 group-hover:block"
        >
          <div class="flex gap-2 items-center mb-2 text-xs font-semibold text-ink-muted">
            <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            Services ({{ row.providedItemResponses.length }})
          </div>
          <ul class="overflow-auto max-h-64 divide-y divide-line">
            <li v-for="(item, i) in row.providedItemResponses" :key="i" class="py-2.5">
              <div class="flex gap-2 justify-between items-start">
                <div class="flex-1 min-w-0">
                  <div class="text-xs font-medium text-ink truncate" :title="item.itemName">
                    {{ item.itemName }}
                  </div>
                  <div class="text-[11px] text-ink-subtle mt-0.5">
                    Code: <span class="font-mono">{{ item.itemCode }}</span>
                  </div>
                </div>
                <div class="text-xs font-semibold text-primary-hover whitespace-nowrap">
                  ETB {{ formatCurrency(item.totalPrice) }}
                </div>
              </div>
              <div class="text-[11px] text-ink-subtle mt-1 flex items-center gap-3">
                <span>Qty: <span class="font-medium text-ink-muted">{{ item.quantity }}</span></span>
                <span>Unit: <span class="font-medium text-ink-muted">ETB {{ formatCurrency(item.unitPrice) }}</span></span>
              </div>
              <div class="text-[11px] text-ink-subtle mt-1 flex items-center gap-2 flex-wrap">
                <span
                  class="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full"
                  :class="getCoverageLabel(item) === 'AUTHORIZED' ? 'bg-success-soft text-success-strong' : (getCoverageLabel(item) === 'EXCESS' ? 'bg-warning-soft text-warning-strong' : 'bg-surface-muted text-ink-muted')"
                >
                  {{ getCoverageLabel(item) }}
                </span>
                <span class="text-[11px]">
                  Auth: <span class="font-mono text-[10px]">{{ item.authorizationUuid || '-' }}</span>
                </span>
                <span class="text-[11px]">
                  Excess: <span class="font-medium text-ink-muted">ETB {{ formatCurrency(item.excessUsed) }}</span>
                </span>
              </div>
            </li>
          </ul>
          <div class="pt-2 mt-2 border-t border-line">
            <div class="flex justify-between items-center text-xs">
              <span class="font-semibold text-ink-muted">Total Amount:</span>
              <span class="font-bold text-primary-hover">ETB {{ formatCurrency(getClaimableAmount(row)) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Total Amount -->
      <div v-else-if="key === 'amount'" class="text-right">
        <div class="flex flex-col items-end gap-1">
          <span class="inline-flex items-baseline gap-1 px-2.5 py-1 rounded-lg border border-primary/20 bg-primary/5 whitespace-nowrap">
            <span class="text-[11px] font-semibold text-primary-hover">ETB</span>
            <span class="text-sm font-bold tabular-nums text-ink">{{ formatCurrency(getClaimableAmount(row)) }}</span>
          </span>
          <div v-if="hasBilledDifference(row)" class="text-xs text-ink-subtle whitespace-nowrap">
            Billed: <span class="font-medium tabular-nums">ETB {{ formatCurrency(row.amount) }}</span>
          </div>
          <div v-if="getRowTotalExcessUsed(row)" class="text-xs text-warning-strong">
            Extra Amount: <span class="font-semibold">ETB {{ formatCurrency(getRowTotalExcessUsed(row)) }}</span>
          </div>
        </div>
      </div>

      <!-- Status -->
      <div v-else-if="key === 'status'">
        <span
          :class="[
            'inline-flex gap-1.5 items-center px-3 py-1.5 text-xs font-semibold rounded-full border whitespace-nowrap',
            statusTone(row).badge,
          ]"
        >
          <span :class="['w-1.5 h-1.5 rounded-full', statusTone(row).dot]"></span>
          {{ statusLabel(row) }}
        </span>
      </div>

      <!-- Provided Date -->
      <div v-else-if="key === 'providedDate'" class="text-sm text-ink-muted">
        {{ secondDateFormat(row.providedDate) }}
      </div>

      <!-- Default case for other fields -->
      <span v-else class="text-sm text-ink-muted">
        {{ row[key] || '-' }}
      </span>
    </td> 
 
    <!-- Actions Column -->
    <td class="p-3" v-if="headKeys.find((head) => head.toLowerCase() === 'actions')">
      <div class="flex items-center space-x-3">
        <template v-if="props.cells?.onEdit && String(row?.source || '').toUpperCase() === 'MANUAL'">
          <Button
            v-if="canEditServiceProvided(row)"
            type="link"
            @click.stop="handleEdit(row)"
            class="!text-success hover:!text-success-strong font-medium transition-colors"
          >
            Edit
          </Button>
          <span
            v-else
            class="inline-flex gap-1 items-center text-xs font-medium cursor-help text-ink-subtle"
            :title="editLockReason(row)"
            :aria-label="editLockReason(row)"
          >
            <svg class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="4.5" y="9" width="11" height="8" rx="1.5" /><path d="M7 9V6.5a3 3 0 0 1 6 0V9" /></svg>
            Locked
          </span>
        </template>
        <Button 
          type="link" 
          @click.stop="handleViewDetails(row)" 
          class="!text-primary hover:!text-primary-hover font-medium transition-colors"
        >
          View Details
        </Button>
        <!-- <Button 
          type="link" 
          @click.stop="handleRemove(row)" 
          class="!text-error hover:!text-error-strong font-medium transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </Button> -->
      </div>
    </td>
  </tr>

  <tr
    v-if="showTotal && rowData.length && amountColIndex >= 0"
    class="border-t-2 border-primary/20 bg-primary/5"
  >
    <!-- +1 for the index column -->
    <td :colspan="amountColIndex + 1" class="px-4 py-3 text-right">
      <span class="text-xs font-semibold tracking-wide uppercase text-primary-hover">Total Claimable</span>
      <span class="ml-2 text-xs text-ink-subtle">({{ rowData.length }} services)</span>
    </td>
    <td class="p-4 text-right">
      <span class="inline-flex items-baseline gap-1 px-3 py-1.5 rounded-lg shadow-sm bg-primary text-white whitespace-nowrap">
        <span class="text-[11px] font-semibold opacity-80">ETB</span>
        <span class="text-sm font-bold tabular-nums">{{ formatCurrency(totalClaimable) }}</span>
      </span>
    </td>
    <td v-if="totalTrailingCols > 0" :colspan="totalTrailingCols"></td>
  </tr>
</template>

<style scoped>
.dropdown-container {
  position: relative;
}

.dropdown-menu {
  transition: all 0.2s ease-out;
  transform-origin: top right;
}

.dropdown-menu.hidden {
  opacity: 0;
  transform: scale(0.95);
  pointer-events: none;
}

.dropdown-menu:not(.hidden) {
  opacity: 1;
  transform: scale(1);
  animation: dropdownAppear 0.2s ease-out;
}

@keyframes dropdownAppear {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

tr:hover {
  background-color: rgb(var(--surface-muted));
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

tr {
  transition: background-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}

td {
  vertical-align: middle;
}

/* Smooth scroll for service items list */
ul {
  scrollbar-width: thin;
  scrollbar-color: rgb(var(--line-strong)) rgb(var(--surface-muted));
}

ul::-webkit-scrollbar {
  width: 6px;
}

ul::-webkit-scrollbar-track {
  background: rgb(var(--surface-muted));
  border-radius: 3px;
}

ul::-webkit-scrollbar-thumb {
  background: rgb(var(--line-strong));
  border-radius: 3px;
}

ul::-webkit-scrollbar-thumb:hover {
  background: rgb(var(--ink-subtle));
}
</style>
