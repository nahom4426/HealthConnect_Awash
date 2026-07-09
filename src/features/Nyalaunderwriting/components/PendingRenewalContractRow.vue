<script setup lang="ts">
import { computed, defineProps, ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { issuedPolicyQuotation } from '@/features/quotation/api/quotationApi';

const props = defineProps({
  rowData: { type: Array, required: true },
  rowKeys: { type: Array, required: true },
  headKeys: { type: Array, required: true },
  cells: {
    type: [Object, Array],
    default: () => ({}),
  },
  onRowClick: { type: Function, default: () => {} },
  currentPage: { type: Number, default: 1 },
  perPage: { type: Number, default: 25 },
  currentStatus: { type: [String, Object], default: 'RENEWAL_IN_PROGRESS' },
});

const router = useRouter();
const loadingQuotation = ref<Record<string, boolean>>({});
const quotationExistsMap = ref<Record<string, boolean>>({});

const normalizedStatus = computed(() => {
  const raw = props.currentStatus && typeof props.currentStatus === 'object' && 'value' in props.currentStatus
    ? props.currentStatus.value
    : props.currentStatus;
  return String(raw || '').toUpperCase();
});

function getStatusStyle(status: string) {
  const base = 'px-3 py-0.5 rounded-full text-center';
  switch (status?.toUpperCase()) {
    case 'PENDING_RENEWAL':
      return `${base} bg-amber-100 text-amber-700`;
    case 'RENEWAL_IN_PROGRESS':
      return `${base} bg-blue-100 text-blue-700`;
    case 'RENEWAL_SCHEDULED':
      return `${base} bg-purple-100 text-purple-700`;
    case 'RENEWED':
      return `${base} bg-green-100 text-green-700`;
    default:
      return `${base} bg-gray-100 text-gray-600`;
  }
}

function formatDate(date: string | null | undefined) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// Check if quotation exists for a specific row
async function checkQuotationExists(row: any) {
  const policyUuid = row?.payerInstitutionContractUuid || '';
  if (!policyUuid) return false;
  
  const rowKey = row?.payerInstitutionContractUuid;
  
  try {
    loadingQuotation.value = { ...loadingQuotation.value, [rowKey]: true };
    const response = await issuedPolicyQuotation(policyUuid);
    const quotations = Array.isArray(response?.data) ? response.data : (Array.isArray(response) ? response : []);
    
    // Ignore PAID quotations (they are old contracts, not the active renewal quotation)
    const activeQuotation = quotations.find((q: any) => q.status !== 'PAID');
    const exists = !!activeQuotation?.quotationUuid;
    
    quotationExistsMap.value = {
      ...quotationExistsMap.value,
      [rowKey]: exists
    };
    
    return exists;
  } catch (error) {
    console.error('Error checking quotation:', error);
    quotationExistsMap.value = {
      ...quotationExistsMap.value,
      [rowKey]: false
    };
    return false;
  } finally {
    loadingQuotation.value = { ...loadingQuotation.value, [rowKey]: false };
  }
}

// Check all rows for quotation existence
async function checkAllQuotations() {
  const rowsToCheck = props.rowData.filter(
    (row: any) => row?.status === 'RENEWAL_IN_PROGRESS'
  );
  
  await Promise.all(rowsToCheck.map((row: any) => checkQuotationExists(row)));
}

// Run check on mount and when rowData changes
onMounted(() => {
  checkAllQuotations();
});

// Watch for rowData changes
watch(
  () => props.rowData,
  () => {
    checkAllQuotations();
  },
  { deep: true }
);

async function openEditQuotation(row: any) {
  const rowKey = row?.payerInstitutionContractUuid;
  
  const exists = await checkQuotationExists(row);
  
  if (exists) {
    await openViewQuotation(row);
  } else {
    const renewalContractUuid = row?.payerInstitutionContractUuid || '';
    router.push({
      name: 'EditPendingRenewalQuotation',
      params: { contractUuid: renewalContractUuid },
      query: {
        institutionName: row?.institutionName || '',
        policyNumber: row?.policyNumber || '',
        institutionUuid: row?.institutionUuid || '',
        policyType: row?.policyType || 'GENERAL',
        insuredUuid: row?.insuredUuid || '',
        beginDate: row?.beginDate || '',
        endDate: row?.endDate || '',
        renewedFromContractUuid: row?.payerInstitutionContractUuid || '',
      },
    });
  }
}

async function openViewQuotation(row: any) {
  const policyUuid = row?.payerInstitutionContractUuid || '';
  
  if (!policyUuid) {
    console.warn('No policy UUID found for view-only mode');
    return;
  }

  const rowKey = row?.payerInstitutionContractUuid;

  try {
    loadingQuotation.value = { ...loadingQuotation.value, [rowKey]: true };
    
    const response = await issuedPolicyQuotation(policyUuid);
    const quotations = Array.isArray(response?.data) ? response.data : (Array.isArray(response) ? response : []);
    
    // Ignore PAID quotations (they are old contracts)
    const activeQuotation = quotations.find((q: any) => q.status !== 'PAID');
    
    if (activeQuotation?.quotationUuid) {
      router.push({
        path: `/quotations/view/${activeQuotation.quotationUuid}`,
        query: {
          viewOnly: '1',
          institutionName: row?.institutionName || '',
          policyNumber: row?.policyNumber || '',
          institutionUuid: row?.institutionUuid || '',
          policyType: row?.policyType || 'GENERAL',
          contractName: row?.contractName || '',
          beginDate: row?.beginDate || '',
          endDate: row?.endDate || '',
        },
      });
    } else {
      console.error('No quotation found for this policy');
    }
  } catch (error) {
    console.error('Error fetching quotation:', error);
  } finally {
    loadingQuotation.value = { ...loadingQuotation.value, [rowKey]: false };
  }
}

// New function: Navigate to Modify Insured Members
function openModifyInsuredMembers(row: any) {
  const payerInstitutionContractUuid = row?.payerInstitutionContractUuid || '';
  const institutionUuid = row?.institutionUuid || '';
  const quotationUuid = row?.quotationUuid || '';
  const institutionName = row?.institutionName || '';
  
  if (!payerInstitutionContractUuid || !institutionUuid) {
    console.warn('Missing required UUIDs for modifying insured members');
    return;
  }

  // Navigate to insured persons page with the required params
  router.push({
    name: 'Insured Persons',
    params: {
      payerInstitutionContractUuid: payerInstitutionContractUuid,
      institutionUuid: institutionUuid,
      quotationUuid: quotationUuid || undefined,
      institutionName: institutionName || undefined,
    },
    query: {
      hasInstitution: 'true',
      pageContext: 'membership',
      renewedFromPayerInstitutionContractUuid: row?.payerInstitutionContractUuid || '',
    },
  });
}
</script>

<template>
  <tr
    v-for="(row, idx) in rowData"
    :key="row?.payerInstitutionContractUuid || idx"
    @click.self="props.onRowClick(row)"
    class="bg-white rounded-lg border-b transition-all duration-200 cursor-pointer hover:shadow-md hover:bg-blue-50 group"
  >
    <td class="p-4 text-sm font-semibold text-gray-400 select-none">
      {{ (props.currentPage - 1) * props.perPage + idx + 1 }}
    </td>

    <td class="p-4">
      <div class="flex flex-col">
        <span class="px-3 py-1 text-sm font-medium text-blue-700 bg-blue-50 rounded-md shadow-sm w-fit">
          {{ row?.institutionName || '—' }}
        </span>
      </div>
    </td>

    <td class="p-4 font-medium text-gray-500">
      {{ row?.contractName || '—' }}
      <div class="text-xs text-gray-500">
        {{ formatDate(row?.beginDate) }} <span class="text-orange-500">→</span> {{ formatDate(row?.endDate) }}
      </div>
    </td>

    <td class="p-4">
      <span :class="getStatusStyle(row?.status || normalizedStatus)">
        {{ row?.status || normalizedStatus }}
      </span>
    </td>

    <td class="flex gap-2 pt-2 border-gray-100">
      <!-- For RENEWAL_IN_PROGRESS: Show appropriate button based on quotation existence -->
      <template v-if="row?.status === 'RENEWAL_IN_PROGRESS'">
        <button
          @click.stop="openEditQuotation(row)"
          :disabled="loadingQuotation[row?.payerInstitutionContractUuid]"
          class="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          :class="quotationExistsMap[row?.payerInstitutionContractUuid] 
            ? 'text-blue-700 bg-blue-50 hover:bg-blue-100 hover:text-blue-800' 
            : 'text-amber-700 bg-amber-50 hover:bg-amber-100 hover:text-amber-800'"
          :title="quotationExistsMap[row?.payerInstitutionContractUuid] ? 'View Quotation' : 'Edit Quotation'"
        >
          <!-- Loading spinner -->
          <svg v-if="loadingQuotation[row?.payerInstitutionContractUuid]" xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          
          <!-- View icon (when quotation exists) -->
          <svg v-else-if="quotationExistsMap[row?.payerInstitutionContractUuid]" xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          
          <!-- Edit icon (when no quotation exists) -->
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          
          <span>
            {{ loadingQuotation[row?.payerInstitutionContractUuid] ? 'Checking...' : 
               quotationExistsMap[row?.payerInstitutionContractUuid] ? 'View Quotation' : 'Edit Quotation' }}
          </span>
        </button>
      </template>

      <!-- For RENEWAL_SCHEDULED: Show View and Modify buttons -->
      <template v-if="row?.status === 'RENEWAL_SCHEDULED'">
        <!-- View Quotation button -->
        <button
          @click.stop="openViewQuotation(row)"
          :disabled="loadingQuotation[row?.payerInstitutionContractUuid]"
          class="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg transition-colors hover:bg-blue-100 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
          title="View Quotation"
        >
          <svg v-if="loadingQuotation[row?.payerInstitutionContractUuid]" xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span>{{ loadingQuotation[row?.payerInstitutionContractUuid] ? 'Loading...' : 'View Quotation' }}</span>
        </button>

        <!-- Modify Insured Members button -->
        <button
          @click.stop="openModifyInsuredMembers(row)"
          class="flex items-center gap-2 px-3 py-2 text-sm font-medium text-green-700 bg-green-50 rounded-lg transition-colors hover:bg-green-100 hover:text-green-800"
          title="Modify Insured Members"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <span>Modify Insured Members</span>
        </button>
      </template>
    </td>
  </tr>
</template>

<style scoped>
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
</style>