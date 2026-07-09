<!-- VerifyClaimRow.vue - Updated with institution name handling -->
<script setup>
import { formatCurrency } from '@/utils/utils';
import Button from '@/components/Button.vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const props = defineProps({
  rowData: {
    type: Array,
    required: true
  },
  rowKeys: {
    type: Array,
    required: true
  },
  serviceType: {
    type: String,
    default: 'credit'
  },
  currentPage: { type: Number, default: 1 },
  perPage: { type: Number, default: 25 },
  onRowClick: {
    type: Function,
    default: () => {}
  }
});

// Format date to "Mon DD, YYYY" format
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
    return 'Invalid Date';
  }
}

// Status styling
function getStatusStyle(status) {
  const base = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold";

  switch (status?.toUpperCase()) {
    case "PROCESSED":
      return `${base} bg-blue-50 text-blue-700 border border-blue-200`;
    case "CHECKED":
      return `${base} bg-green-50 text-green-700 border border-green-200`;
    case "VERIFIED":
      return `${base} bg-purple-50 text-purple-700 border border-purple-200`;
    case "APPROVED":
      return `${base} bg-sky-50 text-sky-700 border border-sky-200`;
    case "REJECTED":
      return `${base} bg-rose-50 text-rose-700 border border-rose-200`;
    default:
      return `${base} bg-gray-50 text-gray-600 border border-gray-200`;
  }
}

function getStatusIcon(status) {
  switch (status?.toUpperCase()) {
    case "PROCESSED":
      return "🔄";
    case "CHECKED":
      return "✓";
    case "VERIFIED":
      return "✅";
    case "APPROVED":
      return "⭐";
    case "REJECTED":
      return "❌";
    default:
      return "●";
  }
}

// Get institution name with fallback
function getInstitutionName(row) {
  return row.institutionName || row.payerInstitutionName || row.insuredInstitutionName || 'N/A';
}

function navigateToDetail(row) {
  if (row && row.claimUuid) {
    const institutionName = getInstitutionName(row);
    const path = props.serviceType === 'credit' 
      ? `/approveL1_claims/detail/${row.claimUuid}` 
      : `/approveL1_claims/cash_detail/${row.batchCode}`;
    
    router.push({
      path: path,
      state: { institutionName },
      query: { institutionName }
    });
  }
}
</script>

<template>
  <tr 
    v-for="(row, idx) in rowData" 
    :key="row.claimUuid || idx"
    @click.self="onRowClick(row) || navigateToDetail(row)"
    class="bg-white border-b transition-colors duration-150 ease-in-out hover:bg-gray-50 cursor-pointer"
  >
    <td class="px-4 py-3 text-sm font-medium text-gray-500">{{ (props.currentPage - 1) * props.perPage + idx + 1 }}</td>

    <td class="p-3 py-4" v-for="key in rowKeys" :key="key">
      <!-- Institution Name Column -->
      <div v-if="key === 'institutionName'" class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
          {{ getInstitutionName(row).charAt(0) || 'I' }}
        </div>
        <div class="flex flex-col">
          <span class="text-sm font-medium text-gray-800">{{ getInstitutionName(row) }}</span>
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
        <span class="text-sm font-bold text-gray-800">ETB {{ formatCurrency(row.totalAmount) }}</span>
        <span class="text-xs text-gray-400">Total Claim</span>
      </div>

      <!-- Claim Date Column -->
      <div v-else-if="key === 'claimFromDate'" class="flex flex-col">
        <span class="text-sm text-gray-700">{{ formatDate(row.claimFromDate) }}</span>
        <span class="text-xs text-gray-400">From Date</span>
      </div>

      <!-- Status Column -->
      <div v-else-if="key === 'claimStatus'" class="text-gray-700">
        <span :class="getStatusStyle(row.claimStatus)">
          <span class="text-xs">{{ getStatusIcon(row.claimStatus) }}</span>
          {{ row.claimStatus || 'Unknown' }}
        </span>
      </div>

      <!-- Default Column -->
      <div v-else class="text-gray-700">
        {{ row[key] || 'N/A' }}
      </div>
    </td>

    <!-- Actions Column -->
    <td class="p-3">
      <div class="flex items-center gap-2">
        <Button 
          size="xs" 
          type="elevated" 
          class="px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg"
          @click.stop="navigateToDetail(row)"
        >
          <svg class="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
          </svg>
          Details
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
</style>