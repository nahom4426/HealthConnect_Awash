<script setup>
import { formatCurrency } from '@/utils/utils';
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
  headKeys: {
    type: Array,
    required: true
  },
  detailRoute: {
    type: String,
    required: true
  },
  serviceType: {
    type: String,
    default: 'credit'
  }
});
console.log(props);

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

// Enhanced status styling with modern design
function getStatusStyle(status) {
  const base = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border-2 shadow-sm transition-all duration-200";

  switch (status?.toUpperCase()) {
    case "PENDING":
      return `${base} bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100`;
    case "PROCESSED":
      return `${base} bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100`;
    case "CHECKED":
      return `${base} bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100`;
    case "APPROVED":
      return `${base} bg-green-50 text-green-700 border-green-200 hover:bg-green-100`;
    case "AUTHORIZED":
      return `${base} bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100`;
    case "REJECTED":
      return `${base} bg-red-50 text-red-700 border-red-200 hover:bg-red-100`;
    case "COMPLETED":
      return `${base} bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100`;
    default:
      return `${base} bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100`;
  }
}

// Get status icon
function getStatusIcon(status) {
  switch (status?.toUpperCase()) {
    case "PENDING":
      return "⏳";
    case "PROCESSED":
      return "🔄";
    case "CHECKED":
      return "✓";
    case "APPROVED":
      return "✅";
    case "AUTHORIZED":
      return "🔐";
    case "REJECTED":
      return "❌";
    case "COMPLETED":
      return "🎯";
    default:
      return "●";
  }
}

// Get claim level badge color
function getLevelBadgeColor(level) {
  const colors = {
    LEVEL1: "bg-blue-100 text-blue-700 border-blue-200",
    LEVEL2: "bg-green-100 text-green-700 border-green-200",
    LEVEL3: "bg-yellow-100 text-yellow-700 border-yellow-200",
    LEVEL4: "bg-orange-100 text-orange-700 border-orange-200",
    LEVEL5: "bg-red-100 text-red-700 border-red-200",
  };
  return colors[level] || "bg-gray-100 text-gray-700 border-gray-200";
}

function formatLevel(level) {
  return level?.replace("LEVEL", "LEVEL ") || 'N/A';
}

function navigateToDetail(row) {
  if (props.serviceType === 'cash' && row.claimBatchCode) {
    router.push(`${props.detailRoute}/${encodeURIComponent(row.claimBatchCode)}`);
  } else if (row.claimUuid) {
    router.push(`${props.detailRoute}/${row.claimUuid}`);
  }
}
</script>

<template>
  <tr 
    v-for="(row, idx) in rowData" 
    :key="row.claimUuid || idx"
    class="bg-white border-b transition-all duration-200 ease-in-out hover:bg-gradient-to-r hover:from-gray-50 hover:to-white hover:shadow-sm cursor-pointer"
  >
    <!-- Index -->
    <td class="p-4 font-medium text-gray-500">
      {{ idx + 1 }}
    </td>
    
    <!-- Institution Name (if in headKeys) -->
    <td v-if="headKeys.includes('Policy Holder Name') || headKeys.includes('Institution')" class="p-4 py-5">
      <div class="flex items-center gap-3">
        <div class="flex justify-center items-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-md">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
          </svg>
        </div>
        <div>
          <p class="text-xs text-gray-500 font-medium">Institution</p>
          <p class="text-sm font-bold text-gray-900">
            {{ row.institutionName || 'N/A' }}
          </p>
        </div>
      </div>
    </td>

    <!-- Provider Name -->
    <td class="p-4 py-5">
      <div class="flex items-center gap-3">
        <div class="flex justify-center items-center w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 shadow-md">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
          </svg>
        </div>
        <div>
          <p class="text-xs text-gray-500 font-medium">Provider</p>
          <p class="text-sm font-bold text-gray-900">
            {{ row.providerName || 'N/A' }}
          </p>
          <p v-if="row.batchCode" class="text-xs text-gray-500 mt-0.5">
            {{ row.batchCode }}
          </p>
        </div>
      </div>
    </td>

    <!-- Claim Level (if exists) -->
    <td v-if="row.claimLevel" class="p-4 py-5">
      <span
        :class="getLevelBadgeColor(row.claimLevel)"
        class="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold border-2 shadow-sm"
      >
        {{ formatLevel(row.claimLevel) }}
      </span>
    </td>

    <!-- Total Amount -->
    <td class="p-4 py-5">
      <div class="flex items-center gap-3">
        <div class="flex justify-center items-center w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 shadow-md">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <div>
          <p class="text-xs text-gray-500 font-medium">Total Amount</p>
          <p class="text-base font-bold text-green-600">
            {{ formatCurrency(row.totalAmount) }}
          </p>
        </div>
      </div>
    </td>

    <!-- Requested Date -->
    <td class="p-4 py-5">
      <div class="flex items-center gap-3">
        <div class="flex justify-center items-center w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 shadow-md">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
        </div>
        <div>
          <p class="text-xs text-gray-500 font-medium">Requested</p>
          <p class="text-sm font-semibold text-gray-900">
            {{ formatDate(row.requestPaymentDate || row.claimFromDate) }}
          </p>
        </div>
      </div>
    </td>

    <!-- Status -->
    <td class="p-4 py-5">
      <span :class="getStatusStyle(row.claimStatus)" class="inline-flex items-center gap-1.5">
        <span class="text-sm">{{ getStatusIcon(row.claimStatus) }}</span>
        {{ row.claimStatus || 'Unknown' }}
      </span>
    </td>

    <!-- Actions -->
    <td class="p-4 py-5">
      <button
        @click="navigateToDetail(row)"
        class="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-150 shadow-sm hover:shadow-md font-medium text-sm"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
        </svg>
        View Detail
      </button>
    </td>
  </tr>
</template>
