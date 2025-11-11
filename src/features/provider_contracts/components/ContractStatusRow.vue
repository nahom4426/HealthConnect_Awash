<script setup>
import { openModal } from '@customizer/modal-x';
import { useToast } from '@/toast/store/toast';
import icons from "@/utils/icons";
import { onUnmounted } from 'vue';
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { approveContractStatus, changeContractStatus } from '../api/contractApi';
import { toasted } from '@/utils/utils';
import { usecontracts } from '../store/cotractStore';

const router = useRouter();
const contractStore = usecontracts();
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
  }
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
  const base = "inline-flex items-center gap-1.5 min-w-[100px] px-3 py-2 rounded-full text-xs font-semibold transition-all duration-200 shadow-sm";

  switch (status?.toUpperCase()) {
    case "ACTIVE":
      return `${base} bg-green-50 text-green-700 border border-green-200`;
    case "PENDING":
      return `${base} bg-yellow-50 text-yellow-700 border border-yellow-200`;
    case "SUSPENDED":
      return `${base} bg-red-50 text-red-700 border border-red-200`;
    case "APPROVED":
      return `${base} bg-blue-50 text-blue-700 border border-blue-200`;
    case "REJECTED":
      return `${base} bg-red-50 text-red-700 border border-red-200`;
    case "COMPLETED":
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

function handleViewWithClose(row) {
  closeAllDropdowns();
  props.onView(row);
}

function handleServicesWithClose(row) {
  closeAllDropdowns();
  router.push(`/active_contract/services/${row.payerProviderContractUuid}/${row.providerUuid}`);
}

function handleEditWithClose(row) {
  closeAllDropdowns();
  const id = row.payerProviderContractUuid || row.id;
  if (id) {
    router.push(`/create_contract/edit/${id}`);
  }
}

function handleActivateWithClose(payerProviderContractUuid) {
  closeAllDropdowns();

  return approveContractStatus(payerProviderContractUuid)
    .then((res) => {
      if (res.success) {
        contractStore.update(payerProviderContractUuid, { status: 'ACTIVE' });
        toasted(res.success, 'Contract Activated Successfully', res.error);
        return true;
      }
      return false;
    })
    .catch(() => false);
}

async function handleActivateForSuspendedWithClose(payerProviderContractUuid) {
  closeAllDropdowns();
  try {
    const response = await changeContractStatus(payerProviderContractUuid, 'ACTIVE');
    if (response.success) {
      addToast({
        type: 'success',
        title: 'Status Updated',
        message: 'Provider has been activated successfully'
      });
      contractStore.update(payerProviderContractUuid, { status: 'ACTIVE' });
    } else {
      throw new Error(response.error || 'Failed to activate provider');
    }
  } catch (error) {
    addToast({
      type: 'error',
      title: 'Activation Failed',
      message: error.message || 'An error occurred while activating the provider'
    });
  }
}

async function handleDeactivateWithClose(payerProviderContractUuid) {
  closeAllDropdowns();
  try {
    const response = await changeContractStatus(payerProviderContractUuid, 'SUSPENDED');
    if (response.success) {
      addToast({
        type: 'success',
        title: 'Status Updated',
        message: 'Provider has been deactivated successfully'
      });
      contractStore.update(payerProviderContractUuid, { status: 'SUSPENDED' });
    } else {
      throw new Error(response.error || 'Failed to deactivate provider');
    }
  } catch (error) {
    addToast({
      type: 'error',
      title: 'Deactivation Failed',
      message: error.message || 'An error occurred while deactivating the provider'
    });
  }
}
async function handleReActivateForSuspendedWithClose(row) {
  closeAllDropdowns();
  
  // Open the reactivate modal
  openModal('ReactivateContract', { data: { ...row } }, (result) => {
    // Modal closed with success - data is already updated in store
    if (result?.success) {
      console.log('Contract reactivated and store updated:', result.updatedContract);
    }
  });
}
onMounted(() => {
  window.addEventListener('click', closeAllDropdowns);
});

onUnmounted(() => {
  window.removeEventListener('click', closeAllDropdowns);
});

</script>

<template>
  <tr 
    v-for="(row, idx) in rowData" 
    :key="idx"
    @click.self="onRowClick(row)" 
    class="bg-white border-b transition-colors duration-150 ease-in-out hover:bg-gray-50"
  >
    <td class="p-4 font-medium text-gray-500">{{ idx + 1 }}</td>
    
    <td class="p-3 py-4" v-for="key in rowKeys" :key="key">
      <div v-if="key === 'status'" class="truncate">
        <span :class="getStatusStyle(row.status)" class="inline-flex gap-1.5 items-center px-3 py-1.5 text-xs font-medium rounded-full status-badge">
          <span class="text-xs">{{ getStatusIcon(row.status) }}</span>
          {{ row.status || 'Unknown' }}
        </span>
      </div>
      <div v-else-if="key === 'period'" class="space-y-1 text-gray-700">
        <div class="flex gap-1 items-center text-sm">
          <span class="text-xs text-gray-400">From:</span>
          <span class="font-medium">{{ formatDate(row.beginDate) }}</span>
        </div>
        <div class="flex gap-1 items-center text-sm">
          <span class="text-xs text-gray-400">To:</span>
          <span class="font-medium">{{ formatDate(row.endDate) }}</span>
        </div>
      </div>
      <div v-else-if="key.includes('Date')" class="text-gray-700">
        {{ formatDate(row[key]) }}
      </div>
      <div v-else-if="key === 'description'" class="max-w-[200px] truncate text-gray-700" :title="row[key]">
        {{ row[key] || 'No description' }}
      </div>
      <div v-else-if="key === 'providerEmail'" class="text-blue-600 cursor-pointer hover:text-blue-800">
        <a :href="`mailto:${row[key]}`">{{ row[key] }}</a>
      </div>
      <span v-else class="text-gray-700">
        {{ row[key] || 'N/A' }}
      </span>
    </td>
    
    <!-- Actions Column -->
    <td class="p-3">
  <div class="flex flex-wrap gap-2 justify-start items-center">

    <!-- 👁️ View (common for all statuses) -->
    <!-- <button
      @click.stop="handleViewWithClose(row)"
      class="flex gap-2 items-center px-3 py-1.5 text-sm font-semibold text-gray-700 bg-gray-50 rounded-xl border border-gray-200 transition-all duration-200 hover:bg-gray-100 hover:shadow-sm"
    >
      <i v-html="icons.details" class="text-gray-500" />
      <span>View</span>
    </button> -->

    <!-- 🕓 PENDING -->
    <template v-if="row.status?.toUpperCase() === 'PENDING'">
      <!-- ✏️ Edit -->
      <button
        @click.stop="handleEditWithClose(row)"
        class="flex gap-2 items-center px-3 py-1.5 text-sm font-semibold text-blue-600 bg-blue-50 rounded-xl border border-blue-200 transition-all duration-200 hover:bg-blue-100 hover:shadow-sm"
      >
        <i v-html="icons.edits" class="text-blue-500" />
        <span>Edit</span>
      </button>

      <!-- ✅ Activate -->
      <button
        @click.stop="handleActivateWithClose(row.payerProviderContractUuid)"
        class="flex gap-2 items-center px-3 py-1.5 text-sm font-semibold text-green-600 bg-green-50 rounded-xl border border-green-200 transition-all duration-200 hover:bg-green-100 hover:shadow-sm"
      >
        <i v-html="icons.activate" class="text-green-500" />
        <span>Activate</span>
      </button>
    </template>

    <!-- 🟢 ACTIVE -->
    <template v-else-if="row.status?.toUpperCase() === 'ACTIVE'">
      <!-- 🧾 Services -->
      <button
        @click.stop="handleServicesWithClose(row)"
        class="flex gap-2 items-center px-3 py-1.5 text-sm font-semibold text-indigo-600 bg-indigo-50 rounded-xl border border-indigo-200 transition-all duration-200 hover:bg-indigo-100 hover:shadow-sm"
      >
        <i v-html="icons.details" class="text-indigo-500" />
        <span>Services</span>
      </button>

      <!-- ⛔ Deactivate -->
      <button
        @click.stop="handleDeactivateWithClose(row.payerProviderContractUuid)"
        class="flex gap-2 items-center px-3 py-1.5 text-sm font-semibold text-red-600 bg-red-50 rounded-xl border border-red-200 transition-all duration-200 hover:bg-red-100 hover:shadow-sm"
      >
        <i v-html="icons.deactivate" class="text-red-500" />
        <span>Deactivate</span>
      </button>
    </template>

    <!-- 🚫 SUSPENDED -->
    <template v-else-if="row.status?.toUpperCase() === 'SUSPENDED' ">
      <button
        @click.stop="handleActivateForSuspendedWithClose(row.payerProviderContractUuid)"
        class="flex gap-2 items-center px-3 py-1.5 text-sm font-semibold text-green-600 bg-green-50 rounded-xl border border-green-200 transition-all duration-200 hover:bg-green-100 hover:shadow-sm"
      >
        <i v-html="icons.activate" class="text-green-500" />
        <span>Activate</span>
      </button>
    </template>
     <template v-else-if="row.status?.toUpperCase() === 'EXPIRED' ">
      <button
       @click.stop="handleReActivateForSuspendedWithClose(row)"
      
        class="flex gap-2 items-center px-3 py-1.5 text-sm font-semibold text-green-600 bg-green-50 rounded-xl border border-green-200 transition-all duration-200 hover:bg-green-100 hover:shadow-sm"
      >
        <i v-html="icons.activate" class="text-green-500" />
        <span>ReActivate</span>
      </button>
    </template>

  </div>
</td>

  </tr>
</template>

<style scoped>
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

/* Smooth hover effects for status badges */
.status-badge {
  transition: all 0.3s ease;
}

.status-badge:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* Smooth transitions for table rows */
tr {
  transition: all 0.2s ease-in-out;
}

/* Better hover effects for dropdown items */
button:hover {
  transform: translateX(2px);
}
</style>