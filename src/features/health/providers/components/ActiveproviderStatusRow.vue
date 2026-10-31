<script setup>
import { defineProps, onMounted, onUnmounted, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { openModal } from '@customizer/modal-x';
import { useProviders } from "@/features/health/providers/store/providersStore";
import { useToast } from '@/toast/store/toast';
import icons from "@/utils/icons";
import { changeProviderStatus } from '../api/providerApi';

const emit = defineEmits(['row', 'remove']);

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
  cells: {
    type: [Object, Array],
    default: () => ({})
  },
  isMobile: {
    type: Boolean,
    default: false
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
  currentPage: { type: Number, default: 1 },
  perPage: { type: Number, default: 25 }
});

const { addToast } = useToast();
const providersStore = useProviders();
const { providers: storeProviders } = storeToRefs(providersStore);

// Enhanced hasAdminUser function
function hasAdminUser(row) {
  if (!row) {
    console.warn('Row is null/undefined');
    return false;
  }

  // Check both possible properties (users or userList)
  const userArray = row.users || row.userList || [];
  
  if (!Array.isArray(userArray)) {
    console.warn('User data is not an array:', userArray);
    return false;
  }

  const hasAdmin = userArray.length > 0 && userArray.some(user => user?.userUuid);
  
  return hasAdmin;
}

function getStatusStyle(status) {
  const base = "inline-flex justify-center items-center min-w-[80px] px-3 py-1 rounded text-sm font-semibold";

  switch (status?.toUpperCase()) {
    case "APPROVED":
      return `${base} bg-success-soft text-success-strong`;
      case "ACTIVE":
      return `${base} bg-success-soft text-success-strong`;
      case "SUBMITTED":
      return `${base} bg-warning-soft text-warning-strong`;
        // Light green for active
    case "SUSPENDED":
      return `${base} bg-error-soft text-error-strong`;    // Light gray for SUSPENDED
    case "PENDING":
      return `${base} bg-warning-soft text-warning-strong`; // Light yellow for pending
    case "ACCEPTED":
      return `${base} bg-primary/10 text-primary-hover`;     // Light blue for accepted
    case "REJECTED":
      return `${base} bg-error-soft text-error-strong`;       // Light red for rejected
    case "RESUBMITTED":
      return `${base} bg-purple-100 text-purple-800`;
    case "SUSPENDED":
      return `${base} bg-warning-soft text-warning-strong`; // Light yellow for suspended
    default:
      return `${base} bg-surface-muted text-ink`;    // Default light gray
  }
}

function getBaseUrl() {
  return import.meta.env.VITE_API_URL ;
}

function handleImageError(event) {
  event.target.src = '/assets/placeholder-logo.png ';
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

function handleEditAdmin(row) {
  const providerName = row.providerName || '';
  const roleName = `PR_${providerName}_Manager`;
  
  // Get the first admin user if exists
  const adminUser = hasAdminUser(row) ? row.users.find(u => u.userUuid) : null;
  
  openModal('EditUser', {
    providerUuid: row.providerUuid,
    provider: row,
    user: adminUser, // Pass existing user data if available
    userUuid: adminUser?.userUuid || '', // Required for EditUser modal
    roleName: roleName,
    onUpdated: (updatedProvider) => {
      providersStore.update(updatedProvider.providerUuid, updatedProvider);
    }
  });
}

function handleAddAdmin(row) {
  const providerName = row.providerName || '';
  const roleName = `PR_${providerName}_Manager`;
  
  openModal('AddUser', {
    providerUuid: row.providerUuid,
    provider: row,
    roleName: roleName,
    onUpdated: (updatedProvider) => {
      providersStore.update(updatedProvider.providerUuid, updatedProvider);
    }
  });
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
function handleEditWithClose(row) {
  closeAllDropdowns();
  handleEdit(row);
}

function handleAddAdminWithClose(row) {
  closeAllDropdowns();
  handleAddAdmin(row);
}

function handleEditAdminWithClose(row) {
  closeAllDropdowns();
  handleEditAdmin(row);
}

async function handleActivateWithClose(providerId) {
  closeAllDropdowns();
  try {
    const response = await changeProviderStatus(providerId, 'ACTIVE');
    if (response.success) {
      addToast({
        type: 'success',
        title: 'Status Updated',
        message: 'Provider has been activated successfully'
      });
      providersStore.update(providerId, { status: 'ACTIVE' });
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

async function handleDeactivateWithClose(providerId) {
  closeAllDropdowns();
  try {
    const response = await changeProviderStatus(providerId, 'SUSPENDED');
    if (response.success) {
      addToast({
        type: 'success',
        title: 'Status Updated',
        message: 'Provider has been deactivated successfully'
      });
      providersStore.update(providerId, { status: 'SUSPENDED' });
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
    class="bg-white border-b transition-colors duration-150 ease-in-out hover:bg-surface-muted" 
  >  
    <td class="p-4 font-medium text-ink-subtle">{{ (props.currentPage - 1) * props.perPage + idx + 1 }}</td>  

    <!-- Debug row for specific provider -->
    <!-- <td v-if="row.providerName === 'Addis Hiwot'" class="p-2 text-xs bg-warning-soft debug-info">
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
        <span class="text-ink-muted">
          {{ row.totalContracts || 0 }}
        </span>
      </div>
      
      <div v-else-if="key === 'providerName'" class="flex gap-2.5 items-center text-ink-muted">
        <div class="flex justify-center items-center">
          <img 
            v-if="row.logoBase64" 
            :src="row.logoBase64" 
            alt="Provider Logo" 
            class="object-contain w-10 h-10 rounded-full border border-line"
          />
          <img 
            v-else-if="row.logoUrl" 
            :src="row.logoUrl" 
            alt="Provider Logo" 
            class="object-contain w-10 h-10 rounded-full border border-line"
            @error="handleImageError"
          />
          <img 
            v-else-if="row.logoPath" 
            :src="`${getBaseUrl()}/provider/logo/${row.logoPath}`" 
            alt="Provider Logo" 
            class="object-contain w-10 h-10 rounded-full border border-line"
            @error="handleImageError"
          />
          <div v-else class="flex justify-center items-center w-10 h-10 text-center bg-line rounded-full">
            <span class="text-xs text-ink-subtle">No Logo</span>
          </div>
        </div>
        <div>{{ row.providerName }}</div>
      </div>
      
      <span v-else class="text-ink-muted">
        {{ row[key] }}
      </span>
    </td>  

    <!-- Actions Column -->
    <td class="p-3" v-if="headKeys.includes('Actions') || headKeys.includes('actions')">
  <div class="flex flex-wrap gap-2 justify-start items-center">

    <!-- ✅ Activate -->
    <button
      v-if="row.status === 'SUSPENDED' || row.status === 'Suspended'"
      @click.stop="handleActivateWithClose(row.providerUuid || row.id)"
      class="flex gap-2 items-center px-3 py-1.5 text-sm font-semibold text-success bg-success-soft rounded-xl border border-success/20 transition-all duration-200 hover:bg-success-soft hover:shadow-sm"
    >
      <i v-html="icons.activate" class="text-success" />
      <span>Activate</span>
    </button>

    <!-- ⛔ Deactivate -->
    <button
      v-if="row.status === 'ACTIVE' || row.status === 'Active'"
      @click.stop="handleDeactivateWithClose(row.providerUuid || row.id)"
      class="flex gap-2 items-center px-3 py-1.5 text-sm font-semibold text-error bg-error-soft rounded-xl border border-error/20 transition-all duration-200 hover:bg-error-soft hover:shadow-sm"
    >
      <i v-html="icons.deactivate" class="text-error" />
      <span>Deactivate</span>
    </button>

    <!-- ✏️ Edit -->
    <!-- <button
      @click.stop="handleEditWithClose(row)"
      class="flex gap-2 items-center px-3 py-1.5 text-sm font-semibold text-primary bg-primary/5 rounded-xl border border-primary/20 transition-all duration-200 hover:bg-primary/10 hover:shadow-sm"
    >
      <i v-html="icons.edit" class="text-primary" />
      <span>Edit</span>
    </button> -->

    <!-- 👁️ Detail (optional) -->
    <!--
    <button
      @click.stop="handleViewWithClose(row.providerUuid || row.id)"
      class="flex gap-2 items-center px-3 py-1.5 text-sm font-semibold text-primary bg-primary/5 rounded-xl border border-primary/20 transition-all duration-200 hover:bg-primary/10 hover:shadow-sm"
    >
      <i v-html="icons.details" class="text-primary" />
      <span>Detail</span>
    </button>
    -->
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