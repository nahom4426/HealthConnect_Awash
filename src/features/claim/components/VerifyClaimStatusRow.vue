<script setup>
import { openModal } from '@customizer/modal-x';
import { useToast } from '@/toast/store/toast';
import icons from "@/utils/icons";
import { onUnmounted } from 'vue';
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { toasted } from '@/utils/utils';
import { approveContractStatus } from '@/features/provider_contracts/api/contractApi';
import { usecontracts } from '@/features/provider_contracts/store/cotractStore';
import { useProcessClaimByInstitutionBatch } from '../store/processClaimByInstitutionBatchStore';

const router = useRouter();
const claims = useProcessClaimByInstitutionBatch();
const props = defineProps({
  rowData: {
    type: Array,
    required: true
  },
  rowKeys: {
    type: Array,
    required: true
  },
  headKeys: {
    type: Array,
    required: true
  },
  onRowClick: {
    type: Function,
    default: () => {}
  },
  onView: {
    type: Function,
    default: () => {}
  },
  currentPage: { type: Number, default: 1 },
  perPage: { type: Number, default: 25 },
  serviceType: { type: String, default: 'CREDIT' }
});

const { addToast } = useToast();

// Format date to "Mon DD YYYY" format
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
}

// Enhanced status styling with icons
function getStatusStyle(status) {
  const base = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 shadow-sm";

  switch (status?.toUpperCase()) {
    case "ACTIVE":
      return `${base} bg-emerald-50 text-emerald-700 border border-emerald-200`;
    case "PENDING":
      return `${base} bg-amber-50 text-amber-700 border border-amber-200`;
    case "SUSPENDED":
      return `${base} bg-rose-50 text-rose-700 border border-rose-200`;
    case "APPROVED":
      return `${base} bg-sky-50 text-sky-700 border border-sky-200`;
    case "REJECTED":
      return `${base} bg-rose-50 text-rose-700 border border-rose-200`;
    case "COMPLETED":
      return `${base} bg-indigo-50 text-indigo-700 border border-indigo-200`;
    case "PROCESSED":
      return `${base} bg-purple-50 text-purple-700 border border-purple-200`;
    default:
      return `${base} bg-gray-50 text-gray-600 border border-gray-200`;
  }
}

// Get status icon
function getStatusIcon(status) {
  switch (status?.toUpperCase()) {
    case "ACTIVE":
      return "✓";
    case "PENDING":
      return "⏳";
    case "SUSPENDED":
      return "⏸️";
    case "APPROVED":
      return "✅";
    case "REJECTED":
      return "❌";
    case "COMPLETED":
      return "🎯";
    case "PROCESSED":
      return "🔄";
    default:
      return "●";
  }
}

// Dropdown functions
function toggleDropdown(event, rowId) {
  event.stopPropagation();
  closeAllDropdowns();
  const dropdown = document.getElementById(`dropdown-${rowId}`);
  if (dropdown) dropdown.classList.toggle('hidden');
}

function closeAllDropdowns() {
  document.querySelectorAll('.dropdown-menu').forEach(el => {
    el.classList.add('hidden');
  });
}

// Wrapper functions with dropdown close
function handleViewWithClose(row) {
  closeAllDropdowns();
  props.onView(row);
}

function handleServicesWithClose(row) {
  closeAllDropdowns();
  router.push(`/active_contract/services/${row.payerProviderContractUuid}/${row.providerUuid}`);
}

onMounted(() => {
  window.addEventListener('click', closeAllDropdowns);
});

onUnmounted(() => {
  window.removeEventListener('click', closeAllDropdowns);
});

function handleActivateWithClose(payerProviderContractUuid) {
  closeAllDropdowns();

  return approveContractStatus(payerProviderContractUuid)
    .then((res) => {
      if (res.success) {
        claims.update(payerProviderContractUuid, { status: 'ACTIVE' });
        toasted(res.success, 'Contract Activated Successfully', res.error);
        return true;
      }
      return false;
    })
    .catch(() => false);
}
</script>

<!-- VerifyClaimStatusRow.vue - Updated with query params as fallback -->
<template>
  <tr 
    v-for="(row, idx) in rowData" 
    :key="idx"
    @click.self="onRowClick(row)" 
    class="bg-white border-b transition-all duration-200 ease-in-out hover:bg-gray-50/80 hover:shadow-sm group"
  >
    <!-- Index -->
    <td class="p-4 font-medium text-gray-400 text-sm">{{ (props.currentPage - 1) * props.perPage + idx + 1 }}</td>
    
    <!-- Dynamic Columns -->
    <td class="p-3 py-4" v-for="key in rowKeys" :key="key">
      <!-- Status Column -->
      <div v-if="key === 'claimStatus'" class="truncate">
        <span :class="getStatusStyle(row.claimStatus)" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full">
          <span class="text-xs">{{ getStatusIcon(row.claimStatus) }}</span>
          {{ row.claimStatus || 'Unknown' }}
        </span>
      </div>
      
      <!-- Period Column -->
      <div v-else-if="key === 'period'" class="space-y-1 text-gray-700">
        <div class="flex gap-1.5 items-center text-sm">
          <span class="text-xs text-gray-400">From:</span>
          <span class="font-medium">{{ formatDate(row.claimFromDate) }}</span>
        </div>
        <div class="flex gap-1.5 items-center text-sm">
          <span class="text-xs text-gray-400">To:</span>
          <span class="font-medium">{{ formatDate(row.claimToDate) }}</span>
        </div>
      </div>
      
      <!-- Date Columns -->
      <div v-else-if="key.includes('Date')" class="text-gray-700 text-sm">
        {{ formatDate(row[key]) }}
      </div>
      
      <!-- Institution Name Column -->
      <div v-else-if="key === 'institutionName'" class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
          {{ row.institutionName?.charAt(0) || 'N' }}
        </div>
        <div class="flex flex-col">
          <span class="text-sm font-medium text-gray-800">{{ row.institutionName || 'N/A' }}</span>
          <span class="text-xs text-gray-400">Institution</span>
        </div>
      </div>
      
      <!-- Provider Name Column -->
      <div v-else-if="key === 'providerName'" class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
          {{ row.providerName?.charAt(0) || 'P' }}
        </div>
        <div class="flex flex-col">
          <span class="text-sm font-medium text-gray-800">{{ row.providerName || 'N/A' }}</span>
          <span class="text-xs text-gray-400">Provider</span>
        </div>
      </div>
      
      <!-- Total Amount Column -->
      <div v-else-if="key === 'totalAmount'" class="flex flex-col">
        <span class="text-sm font-bold text-gray-800">${{ row.totalAmount?.toLocaleString() || '0.00' }}</span>
        <span class="text-xs text-gray-400">Total Claim</span>
      </div>
      
      <!-- Default Column -->
      <span v-else class="text-sm text-gray-700">
        {{ row[key] || 'N/A' }}
      </span>
    </td>
    
    <!-- Actions Column -->
    <td class="p-3">
      <div class="flex items-center gap-2">
        <Button 
          size="xs" 
          type="elevated" 
          class="px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg"
        >
          <RouterLink 
            :to="{
              path: `/verify_claims/detail/${row.claimUuid || ''}`,
              state: { institutionName: row.institutionName || row.payerInstitutionName || 'N/A' },
              query: { institutionName: row.institutionName || row.payerInstitutionName || 'N/A' }
            }" 
            class="flex items-center gap-1.5"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
            View Details
          </RouterLink>
        </Button>
        
        <!-- Batch Code Badge -->
        <div v-if="row.batchCode" class="px-2 py-1 bg-gray-100 rounded-md text-xs text-gray-600 font-mono border border-gray-200">
          {{ row.batchCode }}
        </div>
      </div>
    </td>
  </tr>
</template>
<style scoped>
/* Modern Table Row Styles */
tr {
  transition: all 0.2s ease-in-out;
}

tr:hover {
  background-color: #f8fafc;
  transform: scale(1.001);
}

/* Status Badge Animations */
.status-badge {
  transition: all 0.3s ease;
}

.status-badge:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* Gradient Avatars */
.avatar-gradient {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* Dropdown Styles */
.dropdown-container {
  min-width: 80px;
}

.dropdown-menu {
  min-width: 150%;
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
}

/* Custom Scrollbar */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: #c1c7cd;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a0a7ae;
}

/* Print Styles */
@media print {
  tr {
    break-inside: avoid;
  }
}
</style>