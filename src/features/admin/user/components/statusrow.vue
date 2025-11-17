<script setup>
import { defineProps, onMounted, onUnmounted } from 'vue';
import Button from "@/components/Button.vue";
import { openModal } from '@customizer/modal-x';
import { useUsers } from "../store/userStore";
import { changeUserStatus } from "../Api/UserApi";
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
const usersStore = useUsers();

// Helper function to capitalize first letter
function capitalizeFirstLetter(string) {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Helper function to format fullname with proper capitalization
function formatFullName(row) {
  const title = capitalizeFirstLetter(row?.title || '');
  const firstName = capitalizeFirstLetter(row?.firstName || '');
  const fatherName = capitalizeFirstLetter(row?.fatherName || '');
  const grandFatherName = capitalizeFirstLetter(row?.grandFatherName || '');
  
  return `${title} ${firstName} ${fatherName} ${grandFatherName}`.trim();
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

function getGenderStyle(gender) {
  switch(gender?.toLowerCase()) {
    case 'male':
      return 'bg-blue-100 text-blue-800';
    case 'female':
      return 'bg-pink-100 text-pink-800';
    default:
      return 'bg-gray-100 text-gray-800';
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

onMounted(() => {
  window.addEventListener('click', closeAllDropdowns);
});

onUnmounted(() => {
  window.removeEventListener('click', closeAllDropdowns);
});

function handleEditWithClose(row) {
  closeAllDropdowns();
  handleEdit(row);
}

function handleViewWithClose(rowId) {
  closeAllDropdowns();
  props.onView(rowId);
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
    case 'Payer': return 'bg-blue-100 text-blue-800';
    case 'Provider': return 'bg-green-100 text-green-800';
    case 'Admin': return 'bg-yellow-100 text-yellow-800';
    case 'Payer and Provider': return 'bg-purple-100 text-purple-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

</script>

<template>
<tr 
  v-for="(row, idx) in rowData.filter(r => r !== null)" 
  :key="idx"
  @click.self="onRowClick(row)" 
  class="bg-white border-b hover:bg-gray-50 transition-colors duration-150 ease-in-out" 
>
    <td class="p-4 font-medium text-gray-500">{{ idx + 1 }}</td>  

    <td class="p-3 py-4" v-for="key in rowKeys" :key="key">  
      <!-- Fullname field -->
      <span v-if="key === 'fullname'" class="font-medium text-gray-700">
        {{ formatFullName(row) }}
      </span>

      <!-- Email field -->
   <span v-else-if="key === 'email'" class="text-gray-600">
  {{ row?.email }}
</span>

      <!-- Mobile Phone field -->
      <span v-else-if="key === 'mobilePhone'" class="text-gray-600">
        {{ row.mobilePhone }}
      </span>

      <!-- Role Name field -->
      <span v-else-if="key === 'roleName'" class="text-gray-700">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
          {{ capitalizeFirstLetter(row.roleName) }}
        </span>
      </span>

      <!-- Gender field -->
      <span v-else-if="key === 'gender'" class="text-gray-700">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium"
              :class="getGenderStyle(row.gender)">
          {{ capitalizeFirstLetter(row.gender) }}
        </span>
      </span>
<div v-else-if="key === 'status'" class="truncate">  
        <span 
          class="px-2.5 py-1 rounded-full text-xs font-medium"
          :class="getStatusStyle(row.status)"
        >
          {{ row.userStatus }}
        </span>
      </div>
      <!-- Status field -->
     <div v-else-if="key === 'userType'" class="truncate">
 <span 
  class="px-2.5 py-1 rounded-full text-xs font-medium"
  :class="getTypeStyle(getUserType(row))"
>
  {{ getUserType(row) }}
</span>
</div>


      <!-- Default field rendering with capitalization -->
      <span v-else class="text-gray-700">
        {{ typeof row[key] === 'string' ? capitalizeFirstLetter(row[key]) : row[key] }}
      </span>
    </td>  

    <td class="p-3" v-if="headKeys.includes('Actions') || headKeys.includes('actions')">
  <div class="flex flex-wrap gap-2 items-center justify-start">

    <!-- ✏️ Edit -->
    <button
      @click.stop="handleEditWithClose(row)"
      class="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 hover:shadow-sm transition-all duration-200"
    >
      <i v-html="icons.edit" class="text-blue-500" />
      <span>Edit</span>
    </button>

    <!-- 👁️ Detail -->
    <!-- <button
      @click.stop="handleViewWithClose(row.userUuid || row.id)"
      class="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 hover:shadow-sm transition-all duration-200"
    >
      <i v-html="icons.details" class="text-indigo-500" />
      <span>Detail</span>
    </button> -->

    <!-- ✅ Activate -->
    <button
      v-if="row.userStatus === 'INACTIVE' || row.userStatus === 'Inactive'"
      @click.stop="handleActivateWithClose(row.userUuid || row.id)"
      class="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-green-600 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 hover:shadow-sm transition-all duration-200"
    >
      <i v-html="icons.activate" class="text-green-500" />
      <span>Activate</span>
    </button>

    <!-- ⛔ Deactivate -->
    <button
      v-if="row.userStatus === 'ACTIVE' || row.userStatus === 'Active'"
      @click.stop="handleDeactivateWithClose(row.userUuid || row.id)"
      class="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 hover:shadow-sm transition-all duration-200"
    >
      <i v-html="icons.deactivate" class="text-red-500" />
      <span>Deactivate</span>
    </button>
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

.dropdown-container button {
  width: 100%;
}
</style>