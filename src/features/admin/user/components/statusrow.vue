<script setup>
import { defineProps, onMounted, onUnmounted } from 'vue';
import Button from "@/components/Button.vue";
import { useUsers } from "../store/userStore";
import { updateUserById } from "../Api/UserApi";
import { useToast } from '@/toast/store/toast';
import { openModal } from "@customizer/modal-x";
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
      return `${base} bg-success-soft text-success-strong`;
      case "ACTIVE":
      return `${base} bg-success-soft text-success-strong`;
      case "SUBMITTED":
      return `${base} bg-warning-soft text-warning-strong`;
        // Light green for active
    case "INACTIVE":
      return `${base} bg-error-soft text-error-strong`;    // Light gray for inactive
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

function buildUpdatePayloadFromRow(row, nextStatus) {
  return {
    email: row?.email,
    title: row?.title,
    firstName: row?.firstName,
    fatherName: row?.fatherName,
    grandFatherName: row?.grandFatherName,
    mobilePhone: row?.mobilePhone,
    userStatus: nextStatus,
    roleUuid: row?.roleUuid || row?.roleName,
    gender: row?.gender
  };
}

async function handleActivateWithClose(userId) {
  closeAllDropdowns();
  try {
    const row = usersStore.users?.find(u => u.userUuid === userId);
    const payload = buildUpdatePayloadFromRow(row, 'ACTIVE');

    const response = await updateUserById(userId, payload);
    if (response.success) {
      addToast({
        type: 'success',
        title: 'Status Updated',
        message: 'User has been activated successfully'
      });
      usersStore.update(userId, { ...row, userStatus: 'ACTIVE' });
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
    const row = usersStore.users?.find(u => u.userUuid === userId);
    const payload = buildUpdatePayloadFromRow(row, 'SUSPENDED');

    const response = await updateUserById(userId, payload);
    if (response.success) {
      addToast({
        type: 'success',
        title: 'Status Updated',
        message: 'User has been suspended successfully'
      });
      usersStore.update(userId, { ...row, userStatus: 'SUSPENDED' });
    } else {
      throw new Error(response.error || 'Failed to suspend user');
    }
  } catch (error) {
    addToast({
      type: 'error',
      title: 'Suspend Failed',
      message: error.message || 'An error occurred while suspending the user'
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
    case 'Payer': return 'bg-primary/10 text-primary-hover';
    case 'Provider': return 'bg-success-soft text-success-strong';
    case 'Admin': return 'bg-warning-soft text-warning-strong';
    case 'Payer and Provider': return 'bg-purple-100 text-purple-800';
    default: return 'bg-surface-muted text-ink';
  }
}

</script>

<template>
  <!-- Desktop Table Rows -->
  <template v-if="!isMobile">
    <tr 
      v-for="(row, idx) in rowData.filter(r => r !== null)" 
      :key="idx"
      @click.self="onRowClick(row)" 
      class="bg-white border-b hover:bg-surface-muted transition-colors duration-150 ease-in-out" 
    >
    <td class="p-3 py-4" v-for="key in rowKeys" :key="key">  
      <!-- Index field -->
      <span v-if="key === 'index'" class="font-medium text-ink-subtle">
        {{ idx + 1 }}
      </span>

      <!-- Fullname field -->
      <span v-else-if="key === 'fullname'" class="font-medium text-ink-muted">
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

      <!-- Gender field -->
      <span v-else-if="key === 'gender'" class="text-ink-muted">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium"
              :class="getGenderStyle(row.gender)">
          {{ capitalizeFirstLetter(row.gender) }}
        </span>
      </span>

      <!-- User Status field -->
      <div v-else-if="key === 'userStatus'" class="truncate">
        <span :class="getStatusStyle(row.userStatus)">
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

      <!-- Email Verification Status -->
      <div v-else-if="key === 'emailVerificationStatus'" class="truncate">
        <span 
          class="px-2.5 py-1 rounded-full text-xs font-medium"
          :class="row.emailVerificationStatus ? 'bg-success-soft text-success-strong' : 'bg-error-soft text-error-strong'"
        >
          {{ row.emailVerificationStatus ? 'Verified' : 'Not Verified' }}
        </span>
      </div>

      <!-- Phone Verification Status -->
      <div v-else-if="key === 'phoneVerificationStatus'" class="truncate">
        <span 
          class="px-2.5 py-1 rounded-full text-xs font-medium"
          :class="row.phoneVerificationStatus ? 'bg-success-soft text-success-strong' : 'bg-error-soft text-error-strong'"
        >
          {{ row.phoneVerificationStatus ? 'Verified' : 'Not Verified' }}
        </span>
      </div>

      <!-- Default field rendering with capitalization -->
      <span v-else class="text-ink-muted">
        {{ typeof row[key] === 'string' ? capitalizeFirstLetter(row[key]) : row[key] }}
      </span>
    </td>  

    <td class="p-3" v-if="headKeys.includes('Actions') || headKeys.includes('actions')">
  <div class="flex flex-wrap gap-2 items-center justify-start">

    <!-- ✏️ Edit -->
    <button
      @click.stop.prevent="handleEditWithClose(row)"
      class="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-primary bg-primary/5 border border-primary/20 rounded-xl hover:bg-primary/10 hover:shadow-sm transition-all duration-200"
    >
      <i v-html="icons.edit" class="text-primary" />
      <span>Edit</span>
    </button>

    <!-- 👁️ Detail -->
    <!-- <button
      @click.stop="handleViewWithClose(row.userUuid || row.id)"
      class="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-primary bg-primary/5 border border-primary/20 rounded-xl hover:bg-primary/10 hover:shadow-sm transition-all duration-200"
    >
      <i v-html="icons.details" class="text-primary" />
      <span>Detail</span>
    </button> -->

    <!-- ✅ Activate -->
    <button
      v-if="row.userStatus === 'SUSPENDED' || row.userStatus === 'INACTIVE' || row.userStatus === 'Inactive' || row.userStatus === 'PENDING'"
      @click.stop="handleActivateWithClose(row.userUuid || row.id)"
      class="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-success bg-success-soft border border-success/20 rounded-xl hover:bg-success-soft hover:shadow-sm transition-all duration-200"
    >
      <i v-html="icons.activate" class="text-success" />
      <span>Activate</span>
    </button>

    <!-- ⛔ Deactivate -->
    <button
      v-if="row.userStatus === 'ACTIVE' || row.userStatus === 'Active'"
      @click.stop="handleDeactivateWithClose(row.userUuid || row.id)"
      class="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-error bg-error-soft border border-error/20 rounded-xl hover:bg-error-soft hover:shadow-sm transition-all duration-200"
    >
      <i v-html="icons.deactivate" class="text-error" />
      <span>Suspend</span>
    </button>
  </div>
</td>


    </tr>
  </template>

  <!-- Mobile Card Layout -->
  <template v-else>
    <div 
      v-for="(row, idx) in rowData.filter(r => r !== null)" 
      :key="idx"
      @click="onRowClick(row)"
      class="bg-white rounded-lg border border-line p-2.5 sm:p-3 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer mb-2 sm:mb-3 mx-1 sm:mx-2"
    >
      <!-- Header with name and status -->
      <div class="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 space-y-1.5 sm:space-y-0">
        <div class="flex-1 min-w-0">
          <h3 class="text-sm sm:text-base font-semibold text-ink mb-0.5 truncate">
            {{ formatFullName(row) }}
          </h3>
          <p class="text-xs sm:text-sm text-ink-subtle truncate">{{ row?.email }}</p>
        </div>
        <div class="flex-shrink-0">
          <span 
            class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
            :class="getTypeStyle(getUserType(row))"
          >
            {{ getUserType(row) }}
          </span>
        </div>
      </div>

      <!-- User Details Grid -->
      <div class="space-y-1.5 mb-3">
        <div class="flex justify-between items-start py-1 border-b border-line">
          <span class="text-xs font-medium text-ink-subtle flex-shrink-0">Mobile:</span>
          <span class="text-xs text-ink text-right ml-2 truncate">{{ row.mobilePhone || 'N/A' }}</span>
        </div>
        
        <div class="flex justify-between items-center py-1 border-b border-line">
          <span class="text-xs font-medium text-ink-subtle flex-shrink-0">Gender:</span>
          <span class="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium"
                :class="getGenderStyle(row.gender)">
            {{ capitalizeFirstLetter(row.gender) }}
          </span>
        </div>

        <div class="flex justify-between items-center py-1 border-b border-line">
          <span class="text-xs font-medium text-ink-subtle flex-shrink-0">Email:</span>
          <span class="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium"
                :class="row.emailVerificationStatus ? 'bg-success-soft text-success-strong' : 'bg-error-soft text-error-strong'">
            {{ row.emailVerificationStatus ? '✓ Verified' : '✗ Not Verified' }}
          </span>
        </div>

        <div class="flex justify-between items-center py-1">
          <span class="text-xs font-medium text-ink-subtle flex-shrink-0">Phone:</span>
          <span class="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium"
                :class="row.phoneVerificationStatus ? 'bg-success-soft text-success-strong' : 'bg-error-soft text-error-strong'">
            {{ row.phoneVerificationStatus ? '✓ Verified' : '✗ Not Verified' }}
          </span>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-col sm:flex-row gap-1.5 pt-2.5 border-t border-line">
        <!-- ✏️ Edit -->
        <button
          @click.stop.prevent="handleEditWithClose(row)"
          class="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-primary bg-primary/5 border border-primary/20 rounded-md hover:bg-primary/10 transition-all duration-200 flex-1"
        >
          <i v-html="icons.edit" class="text-primary w-3 h-3" />
          <span>Edit</span>
        </button>

        <!-- ✅ Activate -->
        <button
          v-if="row.userStatus === 'INACTIVE' || row.userStatus === 'Inactive'"
          @click.stop="handleActivateWithClose(row.userUuid || row.id)"
          class="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-success bg-success-soft border border-success/20 rounded-md hover:bg-success-soft transition-all duration-200 flex-1"
        >
          <i v-html="icons.activate" class="text-success w-3 h-3" />
          <span>Activate</span>
        </button>

        <!-- ⛔ Deactivate -->
        <button
          v-if="row.userStatus === 'ACTIVE' || row.userStatus === 'Active'"
          @click.stop="handleDeactivateWithClose(row.userUuid || row.id)"
          class="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-error bg-error-soft border border-error/20 rounded-md hover:bg-error-soft transition-all duration-200 flex-1"
        >
          <i v-html="icons.deactivate" class="text-error w-3 h-3" />
          <span>Deactivate</span>
        </button>
      </div>
    </div>
  </template>
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

/* Mobile responsive improvements */
@media (max-width: 640px) {
  .mobile-card {
    margin-left: 0.5rem;
    margin-right: 0.5rem;
    padding: 0.75rem;
  }
  
  .mobile-card h3 {
    font-size: 0.875rem;
    line-height: 1.25rem;
  }
  
  .mobile-card .action-buttons {
    gap: 0.5rem;
  }
  
  .mobile-card .action-buttons button {
    padding: 0.5rem 0.75rem;
    font-size: 0.75rem;
  }
}
</style>