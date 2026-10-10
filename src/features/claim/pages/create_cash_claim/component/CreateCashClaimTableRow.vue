<script setup>
import { defineProps, onMounted, onUnmounted } from 'vue';
import Button from "@/components/Button.vue";
import { formatCurrency, secondDateFormat } from "@/utils/utils";

const props = defineProps({
  rowData: { type: Array, required: true },
  rowKeys: { type: Array, required: true },
  headKeys: { type: Array, required: true },
  cells: { type: Object, default: () => ({}) },
  isMobile: { type: Boolean, default: false },
  currentPage: { type: Number, default: 1 },
  perPage: { type: Number, default: 25 }
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

function getRowExtraAmount(row) {
  const items = Array.isArray(row?.providedItemResponses) ? row.providedItemResponses : [];
  return items.reduce((s, it) => s + (Number(it?.extraAmount) || 0), 0);
}

function getStatusStyle(status) {
  const s = (status || '').toString().toUpperCase();
  if (s === 'APPROVED' || s === 'PAID' || s === 'COMPLETED') {
    return {
      bg: 'bg-success-soft',
      text: 'text-success-strong',
      border: 'border-success/20',
      dot: 'bg-success',
      label: status
    };
  }
  if (s === 'REJECTED' || s === 'CANCELLED') {
    return {
      bg: 'bg-error-soft',
      text: 'text-error-strong',
      border: 'border-error/20',
      dot: 'bg-error',
      label: status
    };
  }
  if (s === 'VERIFIED' || s === 'AUTHORIZED' || s === 'PROCESSED') {
    return {
      bg: 'bg-primary/10',
      text: 'text-primary-hover',
      border: 'border-primary/20',
      dot: 'bg-primary',
      label: status
    };
  }
  return {
    bg: 'bg-warning-soft',
    text: 'text-warning-strong',
    border: 'border-warning/20',
    dot: 'bg-warning',
    label: status || 'PENDING'
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

function handleRemove(row) {
  emit('remove', row.serviceProvidedUuid);
}
</script>

<template>
  <tr 
    v-for="(row, idx) in rowData" 
    :key="row.serviceProvidedUuid"
    @click.self="emit('row', row)" 
    class="relative bg-white border-b transition-colors duration-150 ease-in-out cursor-pointer hover:bg-surface-muted"
  >  
    <td class="px-4 py-3 text-sm font-medium text-ink-subtle">{{ (props.currentPage - 1) * props.perPage + idx + 1 }}</td>
    
    <td class="p-4" v-for="key in rowKeys" :key="key">  
      <!-- Insured Name -->
      <div v-if="key === 'insuredName' || key === 'fullname'" class="max-w-[200px]">
        <span class="block text-sm font-medium text-ink truncate">
          {{ getDisplayPersonName(row) }}
        </span>
        <span v-if="row.personType === 'DEPENDENT' || row.dependantUuid" class="text-xs text-ink-subtle">
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
            </li>
          </ul>
          <div class="pt-2 mt-2 border-t border-line">
            <div class="flex justify-between items-center text-xs">
              <span class="font-semibold text-ink-muted">Total Amount:</span>
              <span class="font-bold text-primary-hover">ETB {{ formatCurrency(row.amount) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Total Amount -->
      <div v-else-if="key === 'amount'" class="text-right">
        <span class="text-sm font-semibold text-ink">
          ETB {{ formatCurrency(row.amount) }}
        </span>
      </div>

      <!-- Extra Amount -->
      <div v-else-if="key === 'extraAmount'" class="text-right">
        <span class="text-sm font-semibold text-error">
          ETB {{ formatCurrency(getRowExtraAmount(row)) }}
        </span>
      </div>

      <!-- Status -->
      <div v-else-if="key === 'status'">
        <span
          :class="[
            'inline-flex gap-1.5 items-center px-3 py-1.5 text-xs font-semibold rounded-full border',
            getStatusStyle(row.status || row.serviceClaimStatus).bg,
            getStatusStyle(row.status || row.serviceClaimStatus).text,
            getStatusStyle(row.status || row.serviceClaimStatus).border,
          ]"
        >
          <span
            class="w-1.5 h-1.5 rounded-full"
            :class="getStatusStyle(row.status || row.serviceClaimStatus).dot"
          ></span>
          {{ getStatusStyle(row.status || row.serviceClaimStatus).label }}
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
        <!-- <Button 
          type="link" 
          @click.stop="handleViewDetails(row)" 
          class="!text-primary hover:!text-primary-hover font-medium transition-colors"
        >
          View Details
        </Button> -->
        <Button 
          type="link" 
          @click.stop="handleRemove(row)" 
          class="!text-error hover:!text-error-strong font-medium transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </Button>
      </div>
    </td>
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
