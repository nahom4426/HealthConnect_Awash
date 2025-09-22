<script setup>
import { defineProps, onMounted, onUnmounted, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { openModal } from '@customizer/modal-x';
import { useProviders } from "@/features/providers/store/providersStore";
import { useRoute } from 'vue-router';
import { useToast } from '@/toast/store/toast';
import icons from "@/utils/icons";

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
  }
});

const { addToast } = useToast();
const providersStore = useProviders();
const { providers: storeProviders } = storeToRefs(providersStore);
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
      providersStore.update(updatedProvider.providerUuid, updatedProvider);
    }
  });
}
function handleAdd(row) {
  openModal('ConfirmAddProvider', {
    providerName: row.providerName,
    payerProviderContractUuid: route.params.payerProviderContractUuid || route.params.id,
    payerInstitutionContractUuid: row.payerProviderContractUuid || row.providerUuid,
    onConfirm: () => {
      // This will be called when user confirms in the modal
      mapProviderContract(row);
    }
  });
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
    class="bg-white border-b hover:bg-gray-50 transition-colors duration-150 ease-in-out" 
  >  
    <td class="p-4 font-medium text-gray-500">{{ idx + 1 }}</td>  

    <!-- Debug row for specific provider -->
    <!-- <td v-if="row.providerName === 'Addis Hiwot'" class="debug-info p-2 text-xs bg-yellow-50">
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
          class="px-2.5 py-1 rounded-full text-xs font-medium"
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
      
      <div v-else-if="key === 'providerName'" class="text-gray-700 flex items-center gap-2.5">
        <div class="flex justify-center items-center">
          <img 
            v-if="row.logoBase64" 
            :src="row.logoBase64" 
            alt="Provider Logo" 
            class="h-10 w-10 object-contain rounded-full border border-gray-200"
          />
          <img 
            v-else-if="row.logoUrl" 
            :src="row.logoUrl" 
            alt="Provider Logo" 
            class="h-10 w-10 object-contain rounded-full border border-gray-200"
            @error="handleImageError"
          />
          <img 
            v-else-if="row.logoPath" 
            :src="`${getBaseUrl()}/provider/logo/${row.logoPath}`" 
            alt="Provider Logo" 
            class="h-10 w-10 object-contain rounded-full border border-gray-200"
            @error="handleImageError"
          />
          <div v-else class="h-10 w-10 text-center bg-gray-200 rounded-full flex items-center justify-center">
            <span class="text-gray-500 text-xs">No Logo</span>
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
      <div class="dropdown-container relative">
        <button 
          @click.stop="toggleDropdown($event, row.providerUuid || row.id)"
          class="inline-flex items-center p-2 text-sm font-medium text-center text-gray-500 hover:text-gray-800 rounded-lg hover:bg-gray-100 focus:outline-none"
          type="button"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>

        <div 
          :id="`dropdown-${row.providerUuid || row.id}`"
          class="dropdown-menu hidden absolute right-0 z-10 w-44 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
        >
          <div class="py-1" role="none">
            <button 
              @click.stop="handleAddWithClose(row)"
              class="block w-full text-center py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <div class="flex items-center justify-start pl-4 gap-4">
                <i v-html="icons.edits" />
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
