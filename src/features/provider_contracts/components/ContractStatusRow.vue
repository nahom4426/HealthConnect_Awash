<script setup>
import { openModal } from '@customizer/modal-x';
import { useToast } from '@/toast/store/toast';
import icons from "@/utils/icons";
import { onUnmounted } from 'vue';
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { approveContractStatus } from '../api/contractApi';
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
        contractStore.update(payerProviderContractUuid, { status: 'ACTIVE' });
        toasted(res.success, 'Contract Activated Successfully', res.error);
        return true;
      }
      return false;
    })
    .catch(() => false);
}
</script>

<template>
  <tr 
    v-for="(row, idx) in rowData" 
    :key="idx"
    @click.self="onRowClick(row)" 
    class="bg-white border-b hover:bg-gray-50 transition-colors duration-150 ease-in-out"
  >
    <td class="p-4 font-medium text-gray-500">{{ idx + 1 }}</td>
    
    <td class="p-3 py-4" v-for="key in rowKeys" :key="key">
      <div v-if="key === 'status'" class="truncate">
        <span :class="getStatusStyle(row.status)" class="status-badge inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium">
          <span class="text-xs">{{ getStatusIcon(row.status) }}</span>
          {{ row.status || 'Unknown' }}
        </span>
      </div>
      <div v-else-if="key === 'period'" class="text-gray-700 space-y-1">
        <div class="flex items-center gap-1 text-sm">
          <span class="text-gray-400 text-xs">From:</span>
          <span class="font-medium">{{ formatDate(row.beginDate) }}</span>
        </div>
        <div class="flex items-center gap-1 text-sm">
          <span class="text-gray-400 text-xs">To:</span>
          <span class="font-medium">{{ formatDate(row.endDate) }}</span>
        </div>
      </div>
      <div v-else-if="key.includes('Date')" class="text-gray-700">
        {{ formatDate(row[key]) }}
      </div>
      <div v-else-if="key === 'description'" class="max-w-[200px] truncate text-gray-700" :title="row[key]">
        {{ row[key] || 'No description' }}
      </div>
      <div v-else-if="key === 'providerEmail'" class="text-blue-600 hover:text-blue-800 cursor-pointer">
        <a :href="`mailto:${row[key]}`">{{ row[key] }}</a>
      </div>
      <span v-else class="text-gray-700">
        {{ row[key] || 'N/A' }}
      </span>
    </td>
    
    <!-- Actions Column -->
    <td class="p-3">
      <div class="dropdown-container relative">
        <button 
          @click.stop="toggleDropdown($event, row.payerProviderContractUuid || row.id)"
          class="inline-flex items-center p-2 text-sm font-medium text-center text-gray-500 hover:text-gray-800 rounded-lg hover:bg-gray-100 focus:outline-none transition-colors duration-150"
          type="button"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>

        <div 
          :id="`dropdown-${row.payerProviderContractUuid || row.id}`"
          class="dropdown-menu hidden absolute right-0 z-10 w-44 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
        >
          <div class="py-1" role="none">
            <!-- Common action for all statuses -->
            <button 
              @click.stop="handleViewWithClose(row)"
              class="block w-full text-center py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
            >
              <!-- <div class="flex items-center justify-start pl-4 gap-4">
                <i v-html="icons.details" />
                View Details
              </div> -->
            </button>

            <!-- Actions for PENDING status -->
            <template v-if="row.status?.toUpperCase() === 'PENDING'">
              <button 
                @click.stop="handleViewWithClose(row)"
                class="block w-full text-center py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
              >
                <div class="flex items-center justify-start pl-4 gap-4">
                  <i v-html="icons.edits" />
                  Edit
                </div>
              </button>
              <button 
                @click.stop="handleActivateWithClose(row.payerProviderContractUuid)"
                class="block w-full text-center py-2 text-sm text-[#28A745] hover:bg-gray-100 transition-colors duration-150"
              >
                <div class="flex items-center justify-start pl-4 gap-4">
                  <i v-html="icons.activate" />
                  Activate
                </div>
              </button>
            </template>

            <!-- Actions for ACTIVE status -->
            <template v-else-if="row.status?.toUpperCase() === 'ACTIVE'">
              <button 
                @click.stop="handleServicesWithClose(row)"
                class="block w-full text-center py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
              >
                <div class="flex items-center justify-start pl-4 gap-4">
                  <i v-html="icons.details" />
                  Services
                </div>
              </button>
              <button 
                class="block w-full text-center py-2 text-sm text-[#DB2E48] hover:bg-gray-100 transition-colors duration-150"
              >
                <div class="flex items-center justify-start pl-4 gap-4">
                  <i v-html="icons.deactivate" />
                  Deactivate
                </div>
              </button>
            </template>

            <!-- Actions for SUSPENDED status -->
            <template v-else-if="row.status?.toUpperCase() === 'SUSPENDED'">
              <button 
                 @click.stop="handleActivateWithClose(row.payerProviderContractUuid)"
                class="block w-full text-center py-2 text-sm text-[#28A745] hover:bg-gray-100 transition-colors duration-150"
              >
                <div class="flex items-center justify-start pl-4 gap-4">
                  <i v-html="icons.activate" />
                  Activate
                </div>
              </button>
            </template>
          </div>
        </div>
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