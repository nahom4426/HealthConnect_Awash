<script setup>
import { openModal } from '@customizer/modal-x';
import { useToast } from '@/toast/store/toast';
import icons from "@/utils/icons";
import { onUnmounted, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { toasted } from '@/utils/utils';
import { approveContractStatus } from '@/features/provider_contracts/api/contractApi';
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
  perPage: { type: Number, default: 25 }
});

const { addToast } = useToast();

// Format date to "Mon DD, YYYY"
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
    return 'N/A';
  }
}

// Generate provider or institution initials for avatar
function getInitials(name) {
  if (!name) return 'NY';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

// Get initials background color deterministically
function getAvatarBg(name) {
  const colors = [
    'from-[#800020] to-[#500014]', // Nyala Maroon
    'from-slate-700 to-slate-900',
    'from-indigo-700 to-indigo-900',
    'from-teal-700 to-teal-900',
    'from-amber-700 to-amber-900'
  ];
  if (!name) return colors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

// Status style styling
function getStatusBadgeClass(status) {
  const s = status?.toUpperCase();
  switch (s) {
    case 'ACTIVE':
    case 'APPROVED':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200/80 ring-emerald-500/10';
    case 'PENDING':
      return 'bg-amber-50 text-amber-800 border-amber-300/80 ring-amber-500/20';
    case 'REJECTED':
    case 'SUSPENDED':
      return 'bg-rose-50 text-rose-700 border-rose-200/80 ring-rose-500/10';
    case 'COMPLETED':
      return 'bg-purple-50 text-purple-700 border-purple-200/80 ring-purple-500/10';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200 ring-slate-500/10';
  }
}

function getStatusDotClass(status) {
  const s = status?.toUpperCase();
  switch (s) {
    case 'ACTIVE':
    case 'APPROVED':
      return 'bg-emerald-500';
    case 'PENDING':
      return 'bg-amber-500 animate-pulse';
    case 'REJECTED':
    case 'SUSPENDED':
      return 'bg-rose-500';
    case 'COMPLETED':
      return 'bg-purple-500';
    default:
      return 'bg-slate-400';
  }
}

function handleView(row) {
  if (props.onView) {
    props.onView(row);
  } else {
    const targetId = row.claimUuid || row.batchCode || '';
    router.push(`/process_claims/detail/${targetId}`);
  }
}
</script>

<template>
  <tr 
    v-for="(row, idx) in rowData" 
    :key="row.claimUuid || row.batchCode || idx"
    @click="handleView(row)" 
    class="bg-white border-b border-slate-100 transition-all duration-150 ease-in-out hover:bg-amber-50/30 cursor-pointer group"
  >
    <!-- Index -->
    <td class="p-4 font-semibold text-slate-400 text-xs text-center w-12">
      {{ (props.currentPage - 1) * props.perPage + idx + 1 }}
    </td>

    <!-- Dynamic Columns -->
    <td class="p-3 py-4" v-for="key in rowKeys" :key="key">
      <!-- Provider / Institution Name Column -->
      <div v-if="key === 'providerName' || key === 'institutionName'" class="flex items-center gap-3">
        <div 
          :class="['w-9 h-9 rounded-xl bg-gradient-to-br text-white font-bold text-xs flex items-center justify-center shadow-xs flex-shrink-0', getAvatarBg(row.providerName || row.institutionName)]"
        >
          {{ getInitials(row.providerName || row.institutionName) }}
        </div>
        <div class="space-y-0.5">
          <div class="font-bold text-slate-800 text-sm group-hover:text-[#800020] transition-colors">
            {{ row.providerName || row.institutionName || 'Unspecified Provider' }}
          </div>
          <div class="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
            <span class="inline-flex items-center gap-1">
              <svg class="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg>
              Batch: <span class="font-mono text-slate-600 font-semibold">{{ row.batchCode || row.claimCode || 'CLM-BATCH' }}</span>
            </span>
          </div>
        </div>
      </div>

      <!-- Total Amount Column -->
      <div v-else-if="key === 'totalAmount'" class="flex flex-col">
        <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/80 w-fit">
          <span class="text-[10px] font-extrabold text-[#800020] tracking-wider uppercase">ETB</span>
          <span class="font-black text-slate-900 text-sm">
            {{ Number(row.totalAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
          </span>
        </div>
      </div>

      <!-- Contract Period Column -->
      <div v-else-if="key === 'period'" class="space-y-1 text-slate-600 text-xs">
        <div class="flex items-center gap-1.5 text-slate-700 font-medium">
          <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          <span>{{ formatDate(row.claimFromDate || row.beginDate) }}</span>
          <span class="text-slate-300">→</span>
          <span>{{ formatDate(row.claimToDate || row.endDate) }}</span>
        </div>
      </div>

      <!-- Status Column -->
      <div v-else-if="key === 'claimStatus'" class="flex items-center">
        <span 
          :class="[
            'inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border shadow-2xs transition-all ring-1',
            getStatusBadgeClass(row.claimStatus)
          ]"
        >
          <span :class="['w-2 h-2 rounded-full', getStatusDotClass(row.claimStatus)]"></span>
          {{ row.claimStatus || 'PENDING' }}
        </span>
      </div>

      <!-- General fallback -->
      <span v-else class="text-xs text-slate-700 font-medium">
        {{ row[key] || '-' }}
      </span>
    </td>

    <!-- Actions Column -->
    <td class="p-3 py-4 text-right">
      <button 
        type="button"
        @click.stop="handleView(row)"
        class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-[#800020] hover:bg-[#600018] shadow-xs hover:shadow-md transition-all active:scale-95"
      >
        <span>Review Batch</span>
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
      </button>
    </td>
  </tr>
</template>