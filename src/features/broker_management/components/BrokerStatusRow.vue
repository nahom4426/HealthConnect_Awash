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
          <!-- Status Badge Dot with Pulse for Inactive -->
          <div class="flex relative justify-center items-center">
            <span 
              v-if="isInactive(row) || isSuspended(row)"
              class="inline-flex absolute w-full h-full rounded-full opacity-75 animate-ping"
              :class="getStatusPingClass(row)"
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
            {{ (props.currentPage - 1) * props.perPage + idx + 1 }}
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
            {{ row?.status }}
          </span>
        </div>
        
        <!-- Broker Name Column (firstName) -->
        <div v-else-if="key === 'firstName'" 
             class="flex gap-3 items-center"
             :class="getTextStatusClass(row)"
        >
          <!-- Broker Avatar with Initials -->
          <div 
            class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 border-2 transition-all duration-200"
            :class="getAvatarClass(row)"
          >
            {{ row.firstName?.[0] }}{{ row.lastName?.[0] }}
          </div>
          
          <div class="leading-tight truncate">
            <div class="font-semibold" :class="getTextStatusClass(row)">
              {{ row?.firstName || '' }} {{ row?.lastName || '' }}
            </div>
            <div class="text-xs" :class="getMutedTextStatusClass(row)" v-if="row?.email">
              {{ row.email }}
            </div>
          </div>
        </div>

        <!-- License / Contact Column -->
        <div v-else-if="key === 'licenseNumber'" :class="getTextStatusClass(row)">
          <div class="text-sm font-medium">{{ row?.licenseNumber || '—' }}</div>
          <div class="text-xs" :class="getMutedTextStatusClass(row)">{{ row?.phoneNumber }}</div>
        </div>

        <!-- Date Column -->
        <div v-else-if="key === 'createdAt'" :class="getTextStatusClass(row)">
          <span class="text-sm">{{ formatDate(row?.createdAt) }}</span>
        </div>

        <!-- Balance Column -->
        <div v-else-if="key === 'currentBalance'" :class="getTextStatusClass(row)">
          <span class="text-sm font-semibold">{{ formatCurrency(row?.currentBalance) }}</span>
        </div>

        <!-- Other Columns -->
        <span v-else :class="getTextStatusClass(row)">
          {{ row?.[key] }}
        </span>
      </td>  

      <!-- Actions Column -->
      <td class="p-3 text-left">
        <div class="flex flex-row gap-2 items-center justify-start">
          <button
            @click.stop="$router.push(`/brokers/${getRowId(row)}`)"
            class="flex gap-1.5 items-center px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200"
            :class="getActionButtonClass(row, 'view')"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View
          </button>
          <button
            @click.stop="$router.push(`/brokers/${getRowId(row)}/edit`)"
            class="flex gap-1.5 items-center px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200"
            :class="getActionButtonClass(row, 'edit')"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
          <button
            @click.stop="handleToggle(row)"
            :title="row.status === 'ACTIVE' ? 'Suspend' : 'Activate'"
            :disabled="isRowToggling(row)"
            class="flex gap-1.5 items-center justify-center px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200"
            :class="getActionButtonClass(row, 'toggle')"
          >
            <!-- Loading Spinner for this specific row -->
            <svg v-if="isRowToggling(row)" class="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <template v-else>
              <!-- Suspend Icon -->
              <svg v-if="row.status === 'ACTIVE'" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <!-- Activate Icon -->
              <svg v-else class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </template>
            <span v-if="!isRowToggling(row)">{{ row.status === 'ACTIVE' ? 'Suspend' : 'Activate' }}</span>
            <span v-else>Wait...</span>
          </button>
        </div>
      </td>
    </tr>
  </template>
</template>

<script setup>
import { defineProps, defineEmits, ref } from 'vue';
import { useRouter } from 'vue-router';
import { formatCurrency, formatDate } from '../api/utils';

const emit = defineEmits(['row', 'remove', 'toggleStatus']);

const props = defineProps({
  rowData: { type: Array, required: true },
  rowKeys: { type: Array, required: true },
  headKeys: { type: Array, required: true },
  cells: { type: [Object, Array], default: () => ({}) },
  isMobile: { type: Boolean, default: false },
  onRowClick: { type: Function, default: () => {} },
  onToggleStatus: { type: Function, default: () => {} },
  currentPage: { type: Number, default: 1 },
  perPage: { type: Number, default: 25 },
  hideIndex: { type: Boolean, default: false },
});

const router = useRouter();

// Per-row loading state using a Map
const togglingRows = ref(new Map());

// Check if a specific row is toggling
function isRowToggling(row) {
  const rowId = getRowId(row);
  return rowId ? togglingRows.value.get(rowId) || false : false;
}

// Status helper functions
const isActive = (row) => row?.status?.toUpperCase() === 'ACTIVE';
const isInactive = (row) => row?.status?.toUpperCase() === 'INACTIVE' || row?.status?.toUpperCase() === 'REJECTED';
const isSuspended = (row) => row?.status?.toUpperCase() === 'SUSPENDED';
const isPending = (row) => row?.status?.toUpperCase() === 'PENDING' || row?.status?.toUpperCase() === 'SUBMITTED';

// Row click handler
function handleRowClick(row) {
  if (typeof props.onRowClick === 'function') {
    props.onRowClick(row);
  }
  emit('row', row);
}

// Toggle handler
async function handleToggle(row) {
  const rowId = getRowId(row);
  if (!rowId) return;
  
  // Check if already toggling
  if (togglingRows.value.get(rowId)) return;
  
  // Set loading state for this specific row
  togglingRows.value.set(rowId, true);
  
  try {
    if (typeof props.onToggleStatus === 'function') {
      await props.onToggleStatus(row);
    }
    emit('toggleStatus', row);
  } catch (err) {
    // Error handled by parent
  } finally {
    // Clear loading state after a slight delay
    setTimeout(() => {
      togglingRows.value.delete(rowId);
    }, 300);
  }
}

// Row key
function getRowId(row) {
  if (!row) return null;
  return row.stakeholderUuid || row.id || row.uuid || null;
}

function getRowKey(row, idx) {
  const rowId = getRowId(row);
  return rowId ? rowId : `row-${idx}`;
}

// MAIN ROW STATUS CLASS - Controls row background color
function getRowStatusClass(row) {
  const baseClasses = 'bg-white border-b transition-all duration-200 cursor-pointer';
  
  if (isInactive(row)) {
    return `${baseClasses} bg-red-100 hover:bg-red-200 border-red-300`;
  }
  
  if (isSuspended(row)) {
    return `${baseClasses} bg-orange-100 hover:bg-orange-200 border-orange-300`;
  }
  
  if (isPending(row)) {
    return `${baseClasses} bg-yellow-50 hover:bg-yellow-100 border-yellow-200`;
  }
  
  if (isActive(row)) {
    return `${baseClasses} hover:bg-green-50 border-green-200`;
  }
  
  return `${baseClasses} hover:bg-gray-50 border-gray-200`;
}

// Status dot colors
function getStatusDotClass(row) {
  if (isInactive(row)) return 'bg-red-500';
  if (isSuspended(row)) return 'bg-orange-500';
  if (isPending(row)) return 'bg-yellow-500';
  if (isActive(row)) return 'bg-green-500';
  return 'bg-gray-400';
}

// Status ping animation
function getStatusPingClass(row) {
  if (isInactive(row)) return 'bg-red-400';
  if (isSuspended(row)) return 'bg-orange-400';
  return 'bg-gray-400';
}

// Text color based on status
function getTextStatusClass(row) {
  if (isInactive(row)) return 'text-red-800';
  if (isSuspended(row)) return 'text-orange-800';
  if (isPending(row)) return 'text-yellow-800';
  if (isActive(row)) return 'text-gray-900';
  return 'text-gray-700';
}

// Muted text color
function getMutedTextStatusClass(row) {
  if (isInactive(row)) return 'text-red-600/70';
  if (isSuspended(row)) return 'text-orange-600/70';
  if (isPending(row)) return 'text-yellow-600/70';
  return 'text-gray-500';
}

// Status badge class
function getStatusBadgeClass(row) {
  const base = "px-3 py-1.5 text-xs font-semibold rounded-lg shadow-sm inline-flex items-center gap-1.5";
  
  if (isInactive(row)) return `${base} bg-red-200 text-red-800 border border-red-300`;
  if (isSuspended(row)) return `${base} bg-orange-200 text-orange-800 border border-orange-300`;
  if (isPending(row)) return `${base} bg-yellow-200 text-yellow-800 border border-yellow-300`;
  if (isActive(row)) return `${base} bg-green-200 text-green-800 border border-green-300`;
  
  return `${base} bg-gray-200 text-gray-800 border border-gray-300`;
}

// Inner dot for status badge
function getStatusInnerDotClass(row) {
  if (isInactive(row)) return 'bg-red-600';
  if (isSuspended(row)) return 'bg-orange-600';
  if (isPending(row)) return 'bg-yellow-600';
  if (isActive(row)) return 'bg-green-600';
  return 'bg-gray-600';
}

// Avatar class with status border
function getAvatarClass(row) {
  if (isInactive(row)) return 'bg-red-100 text-red-700 border-red-300';
  if (isSuspended(row)) return 'bg-orange-100 text-orange-700 border-orange-300';
  if (isPending(row)) return 'bg-yellow-100 text-yellow-700 border-yellow-300';
  if (isActive(row)) return 'bg-primary/10 text-primary border-green-300';
  return 'bg-gray-100 text-gray-600 border-gray-200';
}

// Action button classes
function getActionButtonClass(row, type) {
  if (type === 'toggle') {
    if (row.status === 'ACTIVE') {
      return 'text-orange-700 bg-orange-100 hover:bg-orange-200 border border-orange-200';
    } else if (isInactive(row) || isSuspended(row) || isPending(row)) {
      return 'text-green-700 bg-green-100 hover:bg-green-200 border border-green-200';
    }
    return 'text-gray-600 bg-gray-100 hover:bg-gray-200 border border-gray-200';
  }

  if (isInactive(row)) {
    return 'text-red-700 bg-red-100 hover:bg-red-200 border border-red-200';
  }
  if (isSuspended(row)) {
    return 'text-orange-700 bg-orange-100 hover:bg-orange-200 border border-orange-200';
  }
  if (type === 'view') {
    return 'text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-200';
  }
  return 'text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-200';
}
</script>

<style scoped>
/* Smooth transitions */
tr {
  transition: all 0.2s ease-in-out;
}

/* Hover effects for status rows */
tr.bg-red-100:hover {
  background-color: #fee2e2 !important;
}

tr.bg-orange-100:hover {
  background-color: #fed7aa !important;
}

tr.bg-yellow-50:hover {
  background-color: #fef9c3 !important;
}

/* Pulse animation for status dots */
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
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* Button press effect */
button:active {
  transform: translateY(1px);
}

/* Focus styles */
button:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}
</style>
