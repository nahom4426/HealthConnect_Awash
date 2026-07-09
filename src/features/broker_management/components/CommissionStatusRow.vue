<template>
  <template v-for="(row, idx) in rowData" :key="getRowKey(row, idx)">
    <tr 
      @click="handleRowClick(row)" 
      :class="getRowStatusClass(row)"
    >  
      <!-- Row Number / Status Indicator -->
      <td class="p-4">
        <div class="flex gap-3 items-center">
          <div class="flex relative justify-center items-center">
            <span 
              v-if="isPendingOrPaid(row)"
              class="inline-flex absolute w-full h-full rounded-full opacity-75 animate-ping"
              :class="getPingClass(row)"
            ></span>
            <span 
              class="inline-flex relative w-2.5 h-2.5 rounded-full"
              :class="getStatusDotClass(row)"
            ></span>
          </div>
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
        <!-- Status Column (Clickable Badge) -->
        <div v-if="key === 'status'" class="truncate">  
          <span 
            @click.stop="handleStatusClick(row)"
            class="inline-flex gap-1.5 items-center px-3 py-1.5 text-xs font-semibold rounded-lg shadow-sm cursor-pointer border hover:opacity-80 active:scale-95 transition-all"
            :class="getStatusBadgeClass(row)"
            title="Click to change status"
          >
            <span class="w-1.5 h-1.5 rounded-full" :class="getStatusInnerDotClass(row)"></span>
            {{ row?.transactionStatus || row?.status || 'PENDING' }}
            <svg class="w-3 h-3 opacity-60 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </span>
        </div>
        
        <!-- Pending Columns -->
        <div v-else-if="key === 'referenceType'" class="truncate">
          <div class="font-medium text-sm" :class="getTextStatusClass(row)">{{ row.referenceType || 'POLICY' }}</div>
          <div class="text-xs mt-0.5" :class="getMutedTextStatusClass(row)">{{ row.referenceUuid || 'N/A' }}</div>
        </div>

        <div v-else-if="key === 'ruleName'" class="truncate">
          <span class="text-sm" :class="getTextStatusClass(row)">{{ row.ruleName || 'Standard Commission' }}</span>
        </div>

        <!-- Transaction Columns -->
        <div v-else-if="key === 'createdAt'" class="truncate">
          <span class="text-sm text-gray-600">{{ formatDate(row.createdAt) }}</span>
        </div>

        <div v-else-if="key === 'transactionUuid'" class="truncate">
          <span class="text-xs text-gray-400 font-mono">{{ row.transactionUuid }}</span>
        </div>

        <div v-else-if="key === 'type'" class="truncate">
          <span
            class="inline-flex px-2 py-0.5 rounded text-[11px] font-bold uppercase"
            :class="{
              'bg-green-100 text-green-700': row.type === 'EARNED',
              'bg-red-100 text-red-700': row.type === 'PAID',
              'bg-yellow-100 text-yellow-700': row.type === 'PENDING',
              'bg-gray-100 text-gray-600': !['EARNED','PAID','PENDING'].includes(row.type),
            }"
          >{{ row.type }}</span>
        </div>

        <!-- Shared Amount Column -->
        <div v-else-if="key === 'amount'" class="truncate">
          <span
            class="text-sm font-semibold"
            :class="getAmountClass(row)"
          >{{ formatCurrency(row.amount) }}</span>
        </div>

        <!-- Other Columns -->
        <span v-else :class="getTextStatusClass(row)">
          {{ row?.[key] }}
        </span>
      </td>  
    </tr>
  </template>
</template>

<script setup>
import { ref } from 'vue';

const emit = defineEmits(['row', 'statusClick']);

const props = defineProps({
  rowData: { type: Array, required: true },
  rowKeys: { type: Array, required: true },
  headKeys: { type: Array, required: true },
  cells: { type: [Object, Array], default: () => ({}) },
  isMobile: { type: Boolean, default: false },
  onRowClick: { type: Function, default: () => {} },
  onStatusClick: { type: Function, default: () => {} },
  currentPage: { type: Number, default: 1 },
  perPage: { type: Number, default: 25 },
  hideIndex: { type: Boolean, default: false },
});

const updatingRows = ref(new Map());

function isUpdating(row) {
  const rowId = getRowId(row);
  return rowId ? updatingRows.value.get(rowId) || false : false;
}

function formatCurrency(amount) {
  if (!amount) return 'ETB 0.00';
  return `ETB ${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Status helpers
const getStatusStr = (row) => (row?.transactionStatus || row?.status || 'PENDING').toUpperCase();

const isPendingOrPaid = (row) => getStatusStr(row) === 'PENDING' || getStatusStr(row) === 'PAID';

const getPingClass = (row) => {
  if (getStatusStr(row) === 'PENDING') return 'bg-yellow-400';
  if (getStatusStr(row) === 'PAID') return 'bg-green-400';
  return '';
};

const handleRowClick = (row) => {
  if (typeof props.onRowClick === 'function') {
    props.onRowClick(row);
  }
  emit('row', row);
};

const handleStatusClick = (row) => {
  if (typeof props.onStatusClick === 'function') {
    props.onStatusClick(row);
  }
  emit('statusClick', row);
};

const getRowId = (row) => {
  return row.transactionUuid || row.commissionUuid || row.referenceUuid || null;
};

const getRowKey = (row, idx) => {
  const rowId = getRowId(row);
  return rowId ? rowId : `row-${idx}`;
};

const getRowStatusClass = (row) => {
  return 'bg-white border-b transition-all duration-200 cursor-pointer hover:bg-gray-50 border-gray-200';
};

const getStatusDotClass = (row) => {
  const s = getStatusStr(row);
  if (s === 'PENDING') return 'bg-yellow-500';
  if (s === 'PAID' || s === 'COMPLETED' || s === 'SUCCESS') return 'bg-green-500';
  if (s === 'FAILED' || s === 'CANCELLED') return 'bg-red-500';
  return 'bg-gray-400';
};

const getTextStatusClass = (row) => {
  return 'text-gray-700';
};

const getMutedTextStatusClass = (row) => {
  return 'text-gray-500';
};

const getAmountClass = (row) => {
  if (row.type === 'EARNED') return 'text-green-600';
  if (row.type === 'PAID') return 'text-red-600';
  return 'text-primary';
};

const getStatusBadgeClass = (row) => {
  const s = getStatusStr(row);
  const base = "px-3 py-1.5 text-xs font-semibold rounded-lg shadow-sm inline-flex items-center gap-1.5";
  
  if (s === 'PENDING') return `${base} bg-yellow-100 text-yellow-800 border border-yellow-200`;
  if (s === 'APPROVED') return `${base} bg-blue-100 text-blue-800 border border-blue-200`;
  if (s === 'IN_PAYMENT') return `${base} bg-indigo-100 text-indigo-800 border border-indigo-200`;
  if (s === 'PAID' || s === 'SUCCESS' || s === 'COMPLETED') return `${base} bg-green-100 text-green-800 border border-green-200`;
  if (s === 'FAILED' || s === 'CANCELLED') return `${base} bg-red-100 text-red-800 border border-red-200`;
  
  return `${base} bg-gray-100 text-gray-800 border border-gray-200`;
};

const getStatusInnerDotClass = (row) => {
  const s = getStatusStr(row);
  if (s === 'PENDING') return 'bg-yellow-600';
  if (s === 'APPROVED') return 'bg-blue-600';
  if (s === 'IN_PAYMENT') return 'bg-indigo-600';
  if (s === 'PAID' || s === 'SUCCESS' || s === 'COMPLETED') return 'bg-green-600';
  if (s === 'FAILED' || s === 'CANCELLED') return 'bg-red-600';
  return 'bg-gray-600';
};

const getStatusSelectClass = (row) => {
  const s = getStatusStr(row);
  if (s === 'PENDING') return 'bg-yellow-50 text-yellow-800 border-yellow-300 focus:ring-yellow-500/20';
  if (s === 'APPROVED') return 'bg-blue-50 text-blue-800 border-blue-300 focus:ring-blue-500/20';
  if (s === 'IN_PAYMENT') return 'bg-indigo-50 text-indigo-800 border-indigo-300 focus:ring-indigo-500/20';
  if (s === 'PAID' || s === 'SUCCESS' || s === 'COMPLETED') return 'bg-green-50 text-green-800 border-green-300 focus:ring-green-500/20';
  if (s === 'FAILED' || s === 'CANCELLED') return 'bg-red-50 text-red-800 border-red-300 focus:ring-red-500/20';
  
  return 'bg-gray-50 text-gray-800 border-gray-300 focus:ring-gray-500/20';
};
</script>

<style scoped>
tr {
  transition: all 0.2s ease-in-out;
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
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
