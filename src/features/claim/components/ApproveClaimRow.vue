<script setup>
import { formatCurrency } from '@/utils/utils';
import Button from '@/components/Button.vue';

const props = defineProps({
  rowData: {
    type: Array,
    required: true
  },
  rowKeys: {
    type: Array,
    required: true
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
    case "APPROVED":
      return `${base} bg-purple-50 text-purple-700 border border-purple-200`;
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
    case "APPROVED":
      return "✅";
    default:
      return "●";
  }
}
</script>

<template>
  <tr 
    v-for="(row, idx) in rowData" 
    :key="row.claimUuid || idx"
    class="bg-white border-b hover:bg-gray-50 transition-colors duration-150 ease-in-out"
  >
    <td class="p-4 font-medium text-gray-500">{{ idx + 1 }}</td>
    
    <td class="p-3 py-4">
      <div class="text-gray-900 font-medium">{{ row.batchCode || 'N/A' }}</div>
      <div v-if="row.claimCode" class="text-xs text-gray-500 mt-1">Code: {{ row.claimCode }}</div>
    </td>

    <td class="p-3 py-4">
      <div class="text-gray-900 font-medium">{{ row.providerName || 'N/A' }}</div>
      <div v-if="row.providerPhone" class="text-xs text-gray-500 mt-1">{{ row.providerPhone }}</div>
    </td>

    <td class="p-3 py-4">
      <span class="text-gray-900 font-semibold">ETB {{ formatCurrency(row.totalAmount) }}</span>
    </td>

    <td class="p-3 py-4">
      <span class="text-gray-700">{{ formatDate(row.claimFromDate) }}</span>
    </td>

    <td class="p-3 py-4">
      <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
        {{ row.claimLevel || 'N/A' }}
      </span>
    </td>

    <td class="p-3 py-4">
      <span :class="getStatusStyle(row.claimStatus)">
        <span class="text-xs">{{ getStatusIcon(row.claimStatus) }}</span>
        {{ row.claimStatus || 'Unknown' }}
      </span>
    </td>

    <td class="p-3">
      <Button size="xs" type="elevated" class="bg-blue-600 hover:bg-blue-700 text-white">
        <RouterLink :to="`/approve_claims/detail/${row.claimUuid || ''}`">Detail</RouterLink>
      </Button>
    </td>
  </tr>
</template>
