<script setup>
import { defineProps, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import Button from "@/components/Button.vue";
import { openModal } from '@customizer/modal-x';
import { useUsers } from "../store/userStore";
import { changeUserStatus } from "../Api/UserApi";
import { useToast } from '@/toast/store/toast';
import icons from "@/utils/icons";

const router = useRouter();
const usersStore = useUsers();
const { addToast } = useToast();

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
  currentPage: { type: Number, default: 1 },
  perPage: { type: Number, default: 25 }
});

function formatFullName(row) {
  return `${row.firstName || ''} ${row.fatherName || ''} ${row.grandFatherName || ''}`.trim();
}

function capitalizeFirstLetter(string) {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

function getStatusStyle(status) {
  const base = "inline-flex justify-center items-center min-w-[80px] px-3 py-1 rounded text-sm font-semibold";

  switch (status?.toUpperCase()) {
    case "APPROVED":
    case "ACTIVE":
      return `${base} bg-success-soft text-success-strong`;
    case "SUBMITTED":
    case "PENDING":
    case "SUSPENDED":
      return `${base} bg-warning-soft text-warning-strong`;
    case "INACTIVE":
    case "REJECTED":
      return `${base} bg-error-soft text-error-strong`;
    case "ACCEPTED":
      return `${base} bg-primary/10 text-primary-hover`;
    case "RESUBMITTED":
      return `${base} bg-purple-100 text-purple-800`;
    default:
      return `${base} bg-surface-muted text-ink`;
  }
}

function getGenderStyle(gender) {
  switch(gender?.toLowerCase()) {
    case 'male':
      return 'bg-primary/10 text-primary-hover';
    case 'female':
      return 'bg-pink-100 text-pink-800';
    default:
      return 'bg-surface-muted text-ink';
  }
}

function getUserType(row) {
  const hasPayer = !!row.payerUuid;
  const hasProvider = !!row.providerUuid;

  if (hasPayer && !hasProvider) return 'Payer';
  if (!hasPayer && hasProvider) return 'Provider';
  if (!hasPayer && !hasProvider) return 'Admin';
  if (hasPayer && hasProvider) return 'Payer and Provider';
}

function getTypeStyle(statusOrType) {
  switch (statusOrType) {
    case 'Payer': return 'bg-primary/10 text-primary-hover';
    case 'Provider': return 'bg-success-soft text-success-strong';
    case 'Admin': return 'bg-warning-soft text-warning-strong';
    case 'Payer and Provider': return 'bg-purple-100 text-purple-800';
    default: return 'bg-surface-muted text-ink';
  }
}

function toggleDropdown(event, rowId) {
  event.stopPropagation();
  closeAllDropdowns();
  const dropdown = document.getElementById(`dropdown-${rowId}`);
  if (dropdown) {
    dropdown.classList.toggle('hidden');
  }
}

function closeAllDropdowns() {
  document.querySelectorAll('.dropdown-menu').forEach(el => {
    el.classList.add('hidden');
  });
}

function handleViewWithClose(row) {
  
  closeAllDropdowns();
  
  if (row.userUuid) {
    router.push(`/user_detail/${row.userUuid}`);
  } else {
    console.error('No userUuid found in row:', row);
  }
}

function handleEditWithClose(row) {
  closeAllDropdowns();
  handleEdit(row);
}

function handleEdit(row) {
  if (row.userUuid) {
    openModal('EditUser', { 
      userUuid: row.userUuid, 
      user: row,
      onUpdated: (updatedUser) => {
        usersStore.update(updatedUser.userUuid, updatedUser);
      }
    });
  } else if (typeof props.onEdit === 'function') {
    props.onEdit(row);
  }
}

async function handleActivateWithClose(userId) {
  closeAllDropdowns();
  try {
    const response = await changeUserStatus(userId, 'ACTIVE');
    if (response.success) {
      addToast({
        type: 'success',
        title: 'Status Updated',
        message: 'User has been activated successfully'
      });
      usersStore.update(userId, { status: 'ACTIVE' });
    } else {
      throw new Error(response.error || 'Failed to activate user');
    }
  } catch (error) {
    addToast({
      type: 'error',
      title: 'Activation Failed',
      message: error.message || 'An error occurred while activating the user'
    });
  }
}

async function handleDeactivateWithClose(userId) {
  closeAllDropdowns();
  try {
    const response = await changeUserStatus(userId, 'INACTIVE');
    if (response.success) {
      addToast({
        type: 'success',
        title: 'Status Updated',
        message: 'User has been deactivated successfully'
      });
      usersStore.update(userId, { status: 'INACTIVE' });
    } else {
      throw new Error(response.error || 'Failed to deactivate user');
    }
  } catch (error) {
    addToast({
      type: 'error',
      title: 'Deactivation Failed',
      message: error.message || 'An error occurred while deactivating the user'
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
  v-for="(row, idx) in rowData.filter(r => r !== null)" 
  :key="idx"
  @click.self="onRowClick(row)" 
  class="bg-white border-b hover:bg-surface-muted transition-colors duration-150 ease-in-out" 
>
    <td class="p-4 font-medium text-ink-subtle">{{ (props.currentPage - 1) * props.perPage + idx + 1 }}</td>  

    <td class="p-3 py-4" v-for="key in rowKeys" :key="key">  
      <!-- Fullname field -->
      <span v-if="key === 'fullname'" class="font-medium text-ink-muted">
        {{ formatFullName(row) }}
      </span>

      <!-- Email field -->
      <span v-else-if="key === 'email'" class="text-ink-muted">
        {{ row?.email }}
      </span>

      <!-- Mobile Phone field -->
      <span v-else-if="key === 'mobilePhone'" class="text-ink-muted">
        {{ row.mobilePhone }}
      </span>

      <!-- Role Name field -->
      <span v-else-if="key === 'roleName'" class="text-ink-muted">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-primary/10 text-primary-hover">
          {{ capitalizeFirstLetter(row.roleName) }}
        </span>
      </span>

      <!-- Gender field -->
      <span v-else-if="key === 'gender'" class="text-ink-muted">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium"
              :class="getGenderStyle(row.gender)">
          {{ capitalizeFirstLetter(row.gender) }}
        </span>
      </span>

      <!-- Status field -->
      <div v-else-if="key === 'status'" class="truncate">  
        <span 
          class="px-2.5 py-1 rounded-full text-xs font-medium"
          :class="getStatusStyle(row.status)"
        >
          {{ row.userStatus }}
        </span>
      </div>

      <!-- User Type field -->
      <div v-else-if="key === 'userType'" class="truncate">
        <span 
          class="px-2.5 py-1 rounded-full text-xs font-medium"
          :class="getTypeStyle(getUserType(row))"
        >
          {{ getUserType(row) }}
        </span>
      </div>

      <!-- Default field -->
      <span v-else class="text-ink-muted">
        {{ row[key] }}
      </span>
    </td>

    <td class="p-3" v-if="headKeys.includes('Actions') || headKeys.includes('actions')">  
      <div class="dropdown-container relative w-full">
        <button 
          @click.stop="toggleDropdown($event, row.userUuid || row.id)"
          class="inline-flex items-center justify-center p-2 w-full text-sm font-medium text-center text-ink-subtle hover:text-ink rounded-lg hover:bg-surface-muted focus:outline-none"
          type="button"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>

        <div 
          :id="`dropdown-${row.userUuid || row.id}`"
          class="dropdown-menu hidden absolute right-0 z-10 w-full bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
        >
          <div class="py-1" role="none">
            <button 
              @click.stop="handleEditWithClose(row)"
              class="block w-full text-start py-2 text-sm text-ink-muted hover:bg-surface-muted"
            >
              <div class="flex items-start justify-start pl-4 gap-4">
                <i v-html="icons.edits" />
                Edit
              </div>
            </button>
            
            <button 
              @click.stop="handleViewWithClose(row)"
              class="block w-full text-center py-2 text-sm text-ink-muted hover:bg-surface-muted"
            >
              <div class="flex items-center justify-start pl-4 gap-4">
                <i v-html="icons.details" />
                Detail
              </div>
            </button>
            
            <template v-if="row.userStatus">
              <button 
                v-if="row.userStatus === 'INACTIVE' || row.userStatus === 'Inactive'"
                @click.stop="handleActivateWithClose(row.userUuid || row.id)"
                class="block w-full text-center py-2 text-sm text-success hover:bg-surface-muted"
              >
                <div class="flex items-center justify-start pl-4 gap-4">
                  <i v-html="icons.activate" />
                  Activate
                </div>
              </button>
              
              <button 
                v-if="row.userStatus === 'ACTIVE' || row.userStatus === 'Active'"
                @click.stop="handleDeactivateWithClose(row.userUuid || row.id)"
                class="block w-full text-center py-2 text-sm text-error hover:bg-surface-muted"
              >
                <div class="flex items-center justify-start pl-4 gap-4">
                  <i v-html="icons.deactivate" />
                  Deactivate
                </div>
              </button>
            </template>
          </div>
        </div>
      </div>
    </td>
  </tr>
</template>











