<template>
  <template v-for="(row, idx) in rowData" :key="getRowKey(row, idx)">
    <!-- Main Row with Dynamic Status Classes -->
    <tr 
      @click="handleRowClick(row)" 
      :class="getRowStatusClass(row)"
    >  
      <!-- Row Number with Status Indicator -->
      <td class="p-4">
        <div class="flex gap-3 items-center">
          <!-- Status Badge Dot with Pulse for Inactive/Suspended -->
          <div class="flex relative justify-center items-center">
            <span 
              v-if="isInactiveOrSuspended(row)"
              class="inline-flex absolute w-full h-full rounded-full opacity-75 animate-ping bg-red-400"
            ></span>
            <span 
              class="inline-flex relative w-2.5 h-2.5 rounded-full"
              :class="getStatusDotClass(row)"
            ></span>
          </div>
          
          <!-- Row Number -->
          <span 
            class="font-medium transition-colors duration-200"
            :class="getTextStatusClass(row)"
          >
            {{ getRowNumber(idx) }}
          </span>
        </div>
      </td>  

      <!-- Dynamic Columns -->
      <td class="p-3 py-4" v-for="key in rowKeys" :key="key">  
        <!-- Status Column -->
        <div v-if="key === 'status'" class="truncate">  
          <span 
            class="inline-flex gap-1.5 items-center px-3 py-1.5 text-xs font-semibold rounded-lg shadow-sm"
            :class="getStatusBadgeClass(row)"
          >
            <span class="w-1.5 h-1.5 rounded-full" :class="getStatusInnerDotClass(row)"></span>
            {{ formatStatus(row?.status) }}
          </span>
        </div>
        
        <!-- Rule Name Column -->
        <div v-else-if="key === 'name'" class="truncate">
          <div class="font-semibold text-sm" :class="getTextStatusClass(row)">{{ row.ruleName || row.name }}</div>
          <div class="text-xs mt-0.5" :class="getMutedTextStatusClass(row)">
            {{ row.description || 'No description' }}
          </div>
        </div>

        <!-- Stakeholder Type Column -->
        <div v-else-if="key === 'stakeholderType'" class="truncate">
          <span class="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold" :class="getStakeholderTypeClass(row.stakeholderType)">
            {{ formatStakeholderType(row.stakeholderType) }}
          </span>
        </div>

        <!-- Policy Type Column -->
        <div v-else-if="key === 'policyType'" class="truncate">
          <span class="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold" :class="getPolicyTypeClass(row.policyType)">
            {{ formatPolicyType(row.policyType) }}
          </span>
        </div>

        <!-- Commission % Column -->
        <div v-else-if="key === 'commissionPercentage'" class="truncate">
          <span class="text-lg font-bold" :class="getTextStatusClass(row)">
            {{ formatCommission(row.commissionValue) }}
          </span>
        </div>

        <!-- Effective Dates -->
        <div v-else-if="key === 'effectivePeriod'" class="truncate">
          <div class="text-xs" :class="getTextStatusClass(row)">
            <div class="font-medium">{{ formatDate(row.effectiveFrom) }}</div>
            <div class="text-[10px] opacity-75">→ {{ formatDate(row.effectiveTo) }}</div>
          </div>
        </div>

        <!-- Other Columns -->
        <span v-else :class="getTextStatusClass(row)">
          {{ formatValue(row?.[key]) }}
        </span>
      </td>  

      <!-- Actions Column -->
      <td class="p-3 text-left">
        <div class="flex flex-row gap-1 items-center justify-end">
          <button
            @click.stop="handleEdit(row)"
            title="Edit Rule"
            :disabled="isRowToggling(row)"
            class="flex gap-1.5 items-center justify-center w-8 h-8 rounded-lg transition-all duration-200"
            :class="getActionButtonClass(row, 'edit')"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            @click.stop="handleToggle(row)"
            :title="row.status === 'ACTIVE' ? 'Deactivate' : 'Activate'"
            :disabled="isRowToggling(row)"
            class="flex gap-1.5 items-center justify-center w-8 h-8 rounded-lg transition-all duration-200"
            :class="getActionButtonClass(row, 'toggle')"
          >
            <!-- Loading Spinner for this specific row -->
            <svg v-if="isRowToggling(row)" class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <svg v-else-if="row.status === 'ACTIVE'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      </td>
    </tr>
  </template>
</template>

<script setup>
import { defineProps, defineEmits, ref } from 'vue';

const emit = defineEmits(['row', 'edit', 'toggleStatus']);

const props = defineProps({
  rowData: { type: Array, required: true },
  rowKeys: { type: Array, required: true },
  headKeys: { type: Array, required: true },
  cells: { type: [Object, Array], default: () => ({}) },
  isMobile: { type: Boolean, default: false },
  onRowClick: { type: Function, default: () => {} },
  onEditClick: { type: Function, default: () => {} },
  onToggleStatus: { type: Function, default: () => {} },
  currentPage: { type: Number, default: 1 },
  perPage: { type: Number, default: 25 },
  hideIndex: { type: Boolean, default: false },
});

// Per-row loading state using a Map
const togglingRows = ref(new Map());

// Get row number with proper pagination
function getRowNumber(index) {
  // Default values if props are not provided
  const page = props.currentPage || 1;
  const perPage = props.perPage || 25;
  
  // Calculate the row number
  // If hideIndex is true, return just the index + 1
  if (props.hideIndex) {
    return index + 1;
  }
  
  // Calculate with pagination: (page - 1) * perPage + index + 1
  const rowNumber = (page - 1) * perPage + index + 1;
  
  // Ensure we never return a negative number
  return Math.max(1, rowNumber);
}

// Check if a specific row is toggling
function isRowToggling(row) {
  const rowId = getRowId(row);
  return rowId ? togglingRows.value.get(rowId) || false : false;
}

// Status helper functions
const isActive = (row) => row?.status?.toUpperCase() === 'ACTIVE';
const isInactiveOrSuspended = (row) => {
  const status = row?.status?.toUpperCase();
  return status === 'INACTIVE' || status === 'REJECTED' || status === 'SUSPENDED';
};
const isPending = (row) => row?.status?.toUpperCase() === 'PENDING' || row?.status?.toUpperCase() === 'SUBMITTED';

// Formatting functions
function formatStatus(status) {
  if (!status) return 'UNKNOWN';
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

function formatStakeholderType(type) {
  if (!type) return 'N/A';
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
}

function formatPolicyType(type) {
  if (!type) return 'N/A';
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
}

function formatCommission(value) {
  if (value === undefined || value === null) return '0%';
  const percentage = (value * 100).toFixed(1);
  return `${percentage}%`;
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return 'Invalid date';
  }
}

function formatValue(value) {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'string' && value.includes('T')) {
    return formatDate(value);
  }
  return value;
}

// Styling functions
function getStakeholderTypeClass(type) {
  const base = 'px-2.5 py-0.5 rounded-full text-[11px] font-semibold';
  switch(type?.toUpperCase()) {
    case 'BROKER':
      return `${base} bg-purple-100 text-purple-700`;
    case 'AGENT':
      return `${base} bg-blue-100 text-blue-700`;
    default:
      return `${base} bg-gray-100 text-gray-700`;
  }
}

function getPolicyTypeClass(type) {
  const base = 'px-2.5 py-0.5 rounded-full text-[11px] font-semibold';
  switch(type?.toUpperCase()) {
    case 'GENERAL':
      return `${base} bg-blue-100 text-blue-700`;
    case 'MOTOR':
      return `${base} bg-amber-100 text-amber-700`;
    case 'HEALTH':
      return `${base} bg-green-100 text-green-700`;
    case 'LIFE':
      return `${base} bg-pink-100 text-pink-700`;
    default:
      return `${base} bg-gray-100 text-gray-700`;
  }
}

// Event handlers
function handleRowClick(row) {
  if (typeof props.onRowClick === 'function') {
    props.onRowClick(row);
  }
  emit('row', row);
}

function handleEdit(row) {
  const rowId = getRowId(row);
  if (rowId && togglingRows.value.get(rowId)) return;
  if (typeof props.onEditClick === 'function') {
    props.onEditClick(row);
  }
  emit('edit', row);
}

async function handleToggle(row) {
  const rowId = getRowId(row);
  if (!rowId) return;
  
  // Check if this specific row is already toggling
  if (togglingRows.value.get(rowId)) return;
  
  // Set loading state for this specific row
  togglingRows.value.set(rowId, true);
  
  try {
    if (typeof props.onToggleStatus === 'function') {
      await props.onToggleStatus(row);
    }
    emit('toggleStatus', row);
  } catch (err) {
    // Error is handled by parent
  } finally {
    // Clear loading state for this row after a delay
    setTimeout(() => {
      togglingRows.value.delete(rowId);
    }, 300);
  }
}

function getRowId(row) {
  if (!row) return null;
  return row.ruleUuid || row.id || row.uuid || null;
}

function getRowKey(row, idx) {
  const rowId = getRowId(row);
  return rowId ? rowId : `row-${idx}`;
}

// MAIN ROW STATUS CLASS
function getRowStatusClass(row) {
  const baseClasses = 'bg-white border-b transition-all duration-200 cursor-pointer';
  
  if (isInactiveOrSuspended(row)) {
    return `${baseClasses} bg-red-50/50 hover:bg-red-100/70 border-red-200`;
  }
  
  if (isActive(row)) {
    return `${baseClasses} hover:bg-green-50/70 border-green-200`;
  }
  
  if (isPending(row)) {
    return `${baseClasses} bg-yellow-50/50 hover:bg-yellow-100/70 border-yellow-200`;
  }
  
  return `${baseClasses} hover:bg-gray-50/70 border-gray-200`;
}

function getStatusDotClass(row) {
  if (isInactiveOrSuspended(row)) return 'bg-red-500';
  if (isActive(row)) return 'bg-green-500';
  if (isPending(row)) return 'bg-yellow-500';
  return 'bg-gray-400';
}

function getTextStatusClass(row) {
  if (isInactiveOrSuspended(row)) return 'text-red-800';
  if (isActive(row)) return 'text-gray-900';
  if (isPending(row)) return 'text-yellow-800';
  return 'text-gray-700';
}

function getMutedTextStatusClass(row) {
  if (isInactiveOrSuspended(row)) return 'text-red-600/70';
  if (isPending(row)) return 'text-yellow-600/70';
  return 'text-gray-500';
}

function getStatusBadgeClass(row) {
  const base = "px-3 py-1.5 text-xs font-semibold rounded-lg shadow-sm inline-flex items-center gap-1.5";
  
  if (isInactiveOrSuspended(row)) return `${base} bg-red-200 text-red-800 border border-red-300`;
  if (isActive(row)) return `${base} bg-green-200 text-green-800 border border-green-300`;
  if (isPending(row)) return `${base} bg-yellow-200 text-yellow-800 border border-yellow-300`;
  
  return `${base} bg-gray-200 text-gray-800 border border-gray-300`;
}

function getStatusInnerDotClass(row) {
  if (isInactiveOrSuspended(row)) return 'bg-red-600';
  if (isActive(row)) return 'bg-green-600';
  if (isPending(row)) return 'bg-yellow-600';
  return 'bg-gray-600';
}

function getActionButtonClass(row, type) {
  if (type === 'toggle') {
    if (row.status === 'ACTIVE') {
      return 'text-red-700 bg-red-100 hover:bg-red-200 border border-red-200';
    } else if (isInactiveOrSuspended(row)) {
      return 'text-green-700 bg-green-100 hover:bg-green-200 border border-green-200';
    }
    return 'text-gray-600 bg-gray-100 hover:bg-gray-200 border border-gray-200';
  }
  
  if (isInactiveOrSuspended(row)) {
    return 'text-red-700 bg-red-100 hover:bg-red-200 border border-red-200';
  }
  
  if (isPending(row)) {
    return 'text-yellow-700 bg-yellow-100 hover:bg-yellow-200 border border-yellow-200';
  }
  
  return 'text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-200';
}
</script>

<style scoped>
tr {
  transition: all 0.2s ease-in-out;
}

tr.bg-red-50\/50:hover {
  background-color: #fee2e2 !important;
}

tr.bg-yellow-50\/50:hover {
  background-color: #fef9c3 !important;
}

tr.bg-green-50\/50:hover {
  background-color: #dcfce7 !important;
}

@keyframes ping {
  75%, 100% {
    transform: scale(2);
    opacity: 0;
  }
}

.animate-ping {
  animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

button:active {
  transform: translateY(1px);
}

button:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}

span.inline-flex {
  transition: all 0.2s ease;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>