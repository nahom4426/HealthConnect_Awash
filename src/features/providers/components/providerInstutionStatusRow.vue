<script setup>
import { defineProps, onMounted, onUnmounted, computed } from 'vue';
import { openModal } from '@customizer/modal-x';
import { useRoute } from 'vue-router';
import { useToast } from '@/toast/store/toast';
import icons from "@/utils/icons";
import { mapContracts } from '../api/providerApi';

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
  onView: {
    type: Function,
    default: () => {}
  },
  onEdit: {
    type: Function,
    default: () => {}
  },
  onActivate: {
    type: Function,
    default: () => {}
  },
  onDeactivate: {
    type: Function,
    default: () => {}
  },
  onRowClick: {
    type: Function,
    default: () => {}
  },
  onRefetch: {
    type: Function,
    default: () => {}
  },
  currentPage: { type: Number, default: 1 },
  perPage: { type: Number, default: 25 }
});

const { addToast } = useToast();
const route = useRoute();

function toggleDropdown(event, rowId) {
  event.stopPropagation();
  closeAllDropdowns();
  const dropdown = document.getElementById(`dropdown-${rowId}`);
  if (dropdown) dropdown.classList.toggle('hidden');
}
// Enhanced hasAdminUser function
function closeAllDropdowns() {
  document.querySelectorAll('.dropdown-menu').forEach(el => {
    el.classList.add('hidden');
  });
}

function getStatusStyle(status) {
  const base = "inline-flex justify-center items-center min-w-[80px] px-3 py-1 rounded text-sm font-semibold";

  switch (status?.toUpperCase()) {
    case "APPROVED":
      return `${base} bg-green-100 text-green-800`;
      case "ACTIVE":
      return `${base} bg-green-100 text-green-800`;
      case "SUBMITTED":
      return `${base} bg-yellow-100 text-yellow-800`;
        // Light green for active
    case "INACTIVE":
      return `${base} bg-red-100 text-red-800`;    // Light gray for inactive
    case "PENDING":
      return `${base} bg-yellow-100 text-yellow-800`; // Light yellow for pending
    case "ACCEPTED":
      return `${base} bg-blue-100 text-blue-800`;     // Light blue for accepted
    case "REJECTED":
      return `${base} bg-red-100 text-red-800`;       // Light red for rejected
    case "RESUBMITTED":
      return `${base} bg-purple-100 text-purple-800`;
    case "SUSPENDED":
      return `${base} bg-yellow-100 text-yellow-800`; // Light yellow for suspended
    default:
      return `${base} bg-gray-100 text-gray-800`;    // Default light gray
  }
}

function getBaseUrl() {
  return import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
}

function handleImageError(event) {
  event.target.src = '/assets/placeholder-logo.png';
}
function handleEdit(row) {
  openModal('EditProvider', { 
    providerUuid: row.providerUuid, 
    provider: row,
    onUpdated: (updatedProvider) => {
      props.onRefetch();
    }
  });
}
function handleAdd(row) {
  openModal(
    'ConfirmAddProvider',
    {
      providerName: row.providerName,
      payerInstitutionContractUuid: route.params.payerProviderContractUuid || route.params.id,
      payerProviderContractUuid: row.payerProviderContractUuid || row.providerUuid,
      providerUuid: row.providerUuid,
    },
    (res) => {
      if (res?.success) {
        props.onRefetch();
      }
    }
  );
}

// Wrapper functions with dropdown close
function handleAddWithClose(row) {
  closeAllDropdowns();
  handleAdd(row);
}
onMounted(() => {
  document.addEventListener('click', handleDocumentClick);
});

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick);
});

function handleDocumentClick(event) {
  // If the click is inside a dropdown container, do nothing
  if (event.target.closest('.dropdown-container')) return;

  // Otherwise, close all dropdowns
  closeAllDropdowns();
}

</script>

<template>
  <tr 
    v-for="(row, idx) in rowData" 
    :key="idx"
    @click.self="onRowClick(row)" 
    class="bg-white border-b transition-colors duration-150 ease-in-out hover:bg-gray-50" 
  >  
    <td class="p-4 font-medium text-gray-500">{{ (props.currentPage - 1) * props.perPage + idx + 1 }}</td>  

    <!-- Debug row for specific provider -->
    <!-- <td v-if="row.providerName === 'Addis Hiwot'" class="p-2 text-xs bg-yellow-50 debug-info">
      <div class="font-bold">Debug Info for {{ row.providerName }}:</div>
      <div>Has users property: {{ 'users' in row }}</div>
      <div>Users is array: {{ Array.isArray(row.users) }}</div>
      <div>User count: {{ row.users?.length || 0 }}</div>
      <div>First user UUID: {{ row.users?.[0]?.userUuid || 'none' }}</div>
      <div>Store has users: {{ 
        storeProviders.find(p => p.providerUuid === row.providerUuid)?.users?.length > 0 
      }}</div>
    </td> -->

    <!-- Provider Logo Column -->
    <td class="p-3 py-4" v-for="key in rowKeys" :key="key">  
      <div v-if="key === 'status'" class="truncate">  
        <span 
          class="px-2.5 py-1 text-xs font-medium rounded-full"
          :class="getStatusStyle(row.status)"
        >
          {{ row.status }}
        </span>
      </div>
      <div v-else-if="key === 'totalContracts'" class="truncate">  
        <span class="text-gray-700">
          {{ row.totalContracts || 0 }}
        </span>
      </div>
      
      <div v-else-if="key === 'providerName'" class="flex gap-2.5 items-center text-gray-700">
        <div class="flex justify-center items-center">
          <img 
            v-if="row.logoBase64" 
            :src="row.logoBase64" 
            alt="Provider Logo" 
            class="object-contain w-10 h-10 rounded-full border border-gray-200"
          />
          <img 
            v-else-if="row.logoUrl" 
            :src="row.logoUrl" 
            alt="Provider Logo" 
            class="object-contain w-10 h-10 rounded-full border border-gray-200"
            @error="handleImageError"
          />
          <img 
            v-else-if="row.logoPath" 
            :src="`${getBaseUrl()}/provider/logo/${row.logoPath}`" 
            alt="Provider Logo" 
            class="object-contain w-10 h-10 rounded-full border border-gray-200"
            @error="handleImageError"
          />
          <div v-else class="flex justify-center items-center w-10 h-10 text-center bg-gray-200 rounded-full">
            <span class="text-xs text-gray-500">No Logo</span>
          </div>
        </div>
        <div>{{ row.providerName }}</div>
      </div>
      
      <span v-else class="text-gray-700">
        {{ row[key] }}
      </span>
    </td>  

    <!-- Actions Column -->
    <td class="p-3">  
      <div class="relative dropdown-container">
        <button 
          @click.stop="toggleDropdown($event, row.providerUuid || row.id)"
          class="inline-flex items-center p-2 text-sm font-medium text-center text-gray-500 rounded-lg hover:text-gray-800 hover:bg-gray-100 focus:outline-none"
          type="button"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>

        <div 
          :id="`dropdown-${row.providerUuid || row.id}`"
          class="hidden absolute right-0 z-10 w-44 bg-white rounded-md ring-1 ring-black ring-opacity-5 shadow-lg dropdown-menu focus:outline-none"
        >
          <div class="py-1" role="none">
            <button 
              @click.stop="handleAddWithClose(row)"
              class="block py-2 w-full text-sm text-center text-gray-700 hover:bg-gray-100"
            >
              <div class="flex gap-4 justify-start items-center pl-4">
                <i v-html="icons.edit" />
                Add This Provider
              </div>
            </button>
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

.debug-info {
  font-family: monospace;
  white-space: pre;
}
</style>
