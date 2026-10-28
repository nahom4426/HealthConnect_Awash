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
  },
  serviceType: {
    type: String,
    default: 'credit'
  },
  currentPage: { type: Number, default: 1 },
  perPage: { type: Number, default: 25 }
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
    default:
      return "●";
  }
}
</script>

<template>
  <tr 
    v-for="(row, idx) in rowData" 
    :key="row.claimUuid || idx"
    class="bg-white border-b transition-colors duration-150 ease-in-out hover:bg-gray-50"
  >
    <td class="px-4 py-3 text-sm font-medium text-gray-500">{{ (props.currentPage - 1) * props.perPage + idx + 1 }}</td>

    <td class="p-3 py-4" v-for="key in rowKeys" :key="key">
      <div v-if="key === 'totalAmount'" class="font-semibold text-gray-900">
        ETB {{ formatCurrency(row.totalAmount) }}
      </div>

      <div v-else-if="key === 'claimFromDate'" class="text-gray-700">
        {{ formatDate(row.claimFromDate) }}
      </div>

      <div v-else-if="key === 'claimStatus'" class="text-gray-700">
        <span :class="getStatusStyle(row.claimStatus)">
          <span class="text-xs">{{ getStatusIcon(row.claimStatus) }}</span>
          {{ row.claimStatus || 'Unknown' }}
        </span>
      </div>

      <div v-else-if="key === 'providerName'" class="font-medium text-gray-900">
        {{ row.providerName || row.institutionName || 'N/A' }}
      </div>

      <div v-else-if="key === 'institutionName'" class="font-medium text-gray-900">
        {{ row.institutionName || row.providerName || 'N/A' }}
      </div>

      <div v-else class="text-gray-700">
        {{ row[key] || 'N/A' }}
      </div>
    </td>

    <td class="p-3">
      <Button size="xs" type="" class="p-2 text-white bg-blue-600 rounded hover:bg-blue-700">
        <RouterLink 
          :to="serviceType === 'credit' 
            ? `/approveL1_claims/detail/${row.claimUuid}` 
            : `/approveL1_claims/cash_detail/${encodeURIComponent(row.batchCode)}`"
        >
          Details
        </RouterLink>
      </Button>
    </td>
  </tr>
</template>
