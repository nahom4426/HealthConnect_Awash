<script setup>
import { defineProps, onMounted, onUnmounted } from 'vue';
import Button from "@/components/Button.vue";
import { openModal } from '@customizer/modal-x';
import { insuredMembers } from "../store/insuredPersonsStore";
import { changeInsuredStatus } from "../api/insuredPersonsApi";
import { useToast } from '@/toast/store/toast';
import icons from "@/utils/icons";

const props = defineProps({
  rowData: { type: Array, required: true },
  rowKeys: { type: Array, required: true },
  headKeys: { type: Array, required: true },
  onView: { type: Function, default: () => {} },
  onEdit: { type: Function, default: () => {} },
  onActivate: { type: Function, default: () => {} },
  onDeactivate: { type: Function, default: () => {} },
  onRowClick: { type: Function, default: () => {} }
});

const { addToast } = useToast();
const insuredStore = insuredMembers();

function formatPhoneNumber(phone) {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0') && digits.length === 10) return `+251 ${digits.slice(1)}`;
  if (digits.startsWith('251') && digits.length === 12) return `+251 ${digits.slice(3)}`;
  if (digits.startsWith('9') && digits.length === 9) return `+251 ${digits}`;
  return phone;
}

function getStatusStyle(status) {
  const base = "inline-flex justify-center items-center min-w-[80px] px-3 py-1 rounded text-sm font-semibold";

  switch (status?.toUpperCase()) {
    case "APPROVED":
    case "ACTIVE":
      return `${base} bg-green-100 text-green-800`;
    case "SUBMITTED":
    case "PENDING":
    case "SUSPENDED":
      return `${base} bg-yellow-100 text-yellow-800`;
    case "INACTIVE":
    case "REJECTED":
      return `${base} bg-red-100 text-red-800`;
    case "ACCEPTED":
      return `${base} bg-blue-100 text-blue-800`;
    case "RESUBMITTED":
      return `${base} bg-purple-100 text-purple-800`;
    default:
      return `${base} bg-gray-100 text-gray-800`;
  }
}

function getBaseUrl() {
  return import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
}

function handleImageError(event) {
  event.target.src = '/assets/placeholder-profile.png';
}

function handleEdit(row) {
  if (row.insuredUuid) {
    openModal('EditInsured', { 
      insuredUuid: row.insuredUuid, 
      insured: row,
      onUpdated: (updatedInsured) => {
        insuredStore.update(updatedInsured.insuredUuid, updatedInsured);
      }
    });
  } else if (typeof props.onEdit === 'function') {
    props.onEdit(row);
  }
}

function toggleDropdown(event, rowId) {
  event.stopPropagation();
  closeAllDropdowns();
  const dropdown = document.getElementById(`dropdown-${rowId}`);
  if (dropdown) dropdown.classList.toggle('hidden');
}

function closeAllDropdowns() {
  document.querySelectorAll('.dropdown-menu').forEach(el => el.classList.add('hidden'));
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

async function handleActivateWithClose(insuredId) {
  closeAllDropdowns();
  try {
    const response = await changeInsuredStatus(insuredId, 'ACTIVE');
    if (response.success) {
      addToast({ type: 'success', title: 'Status Updated', message: 'Insured member has been activated' });
      insuredStore.update(insuredId, { status: 'ACTIVE' });
    } else throw new Error(response.error || 'Failed to activate');
  } catch (error) {
    addToast({ type: 'error', title: 'Activation Failed', message: error.message || 'Failed to activate insured member' });
  }
}

async function handleDeactivateWithClose(insuredId) {
  closeAllDropdowns();
  try {
    const response = await changeInsuredStatus(insuredId, 'INACTIVE');
    if (response.success) {
      addToast({ type: 'success', title: 'Status Updated', message: 'Insured member has been deactivated' });
      insuredStore.update(insuredId, { status: 'INACTIVE' });
    } else throw new Error(response.error || 'Failed to deactivate');
  } catch (error) {
    addToast({ type: 'error', title: 'Deactivation Failed', message: error.message || 'Failed to deactivate insured member' });
  }
}
</script>

<template>
  <tr 
    v-for="(row, idx) in rowData" 
    :key="row.insuredUuid || idx"
    @click.self="props.onRowClick(row)" 
    class="bg-white border-b hover:bg-gray-50 transition-colors duration-150 ease-in-out cursor-pointer"
  >  
    <td class="p-4 font-medium text-gray-500 select-none">{{ idx + 1 }}</td>  

    <td class="p-3 py-4" v-for="key in rowKeys" :key="key">  
      <div v-if="key === 'status'" class="truncate">  
        <span 
          class="px-2.5 py-1 rounded-full text-xs font-semibold"
          :class="getStatusStyle(row.status)"
        >
          {{ row.status }}
        </span>
      </div>
      
      <div v-else-if="key === 'fullName'" class="text-gray-700 flex items-center gap-3 select-text">
        <img 
          v-if="row.photoBase64" 
          :src="row.photoBase64" 
          alt="Profile" 
          class="h-10 w-10 object-cover rounded-full border border-gray-200"
        />
        <img 
          v-else-if="row.photoUrl" 
          :src="row.photoUrl" 
          alt="Profile" 
          class="h-10 w-10 object-cover rounded-full border border-gray-200"
        />
        <img 
          v-else-if="row.photoPath" 
          :src="`${getBaseUrl()}/insured/photo/${row.photoPath}`" 
          alt="Profile" 
          class="h-10 w-10 object-cover rounded-full border border-gray-200"
          @error="handleImageError"
        />
        <div v-else class="h-10 w-10 text-center bg-gray-200 rounded-full flex items-center justify-center">
          <span class="text-gray-500 text-xs">No Photo</span>
        </div>
        <div class="truncate">
          {{ row.firstName }} {{ row.fatherName }} {{ row.grandfatherName }}
        </div>
      </div>
      
      <div v-else-if="key === 'phone'" class="text-gray-700 select-text">
        <template v-if="formatPhoneNumber(row[key]).startsWith('+251 ')">
          <span class="text-primary font-semibold">+251</span>
          <span>{{ formatPhoneNumber(row[key]).slice(4) }}</span>
        </template>
        <template v-else>
          {{ formatPhoneNumber(row[key]) }}
        </template>
      </div>

      <span v-else class="text-gray-700 select-text">
        {{ row[key] }}
      </span>
    </td>  

    <!-- Actions Dropdown Column -->
    <td class="p-3 relative text-left">
      <button 
        @click.stop="toggleDropdown($event, row.insuredUuid || row.id)"
        aria-label="Actions"
        class="inline-flex items-center p-2 text-sm font-medium text-gray-500 hover:text-gray-800 rounded-lg hover:bg-gray-100 focus:outline-none"
        type="button"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>

      <div 
        :id="`dropdown-${row.insuredUuid || row.id}`"
        class="dropdown-menu hidden absolute right-0 z-20 w-44 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
      >
        <div class="py-1" role="none">

          <button 
            @click.stop="handleEditWithClose(row)"
            class="flex items-center gap-3 w-full px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors rounded-md"
          >
            <i v-html="icons.edits" class="w-5 h-5" />
            Edit
          </button>

          <button 
            @click.prevent="$router.push(`/insured_list/detail/${row.insuredUuid}`)"
            class="flex items-center gap-3 w-full px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors rounded-md"
          >
            <i v-html="icons.details" class="w-5 h-5" />
            Details
          </button>

          <template v-if="row.status">
            <button 
              v-if="row.status.toUpperCase() === 'INACTIVE'"
              @click.stop="handleActivateWithClose(row.insuredUuid || row.id)"
              class="flex items-center gap-3 w-full px-4 py-2 text-green-600 hover:bg-green-50 transition-colors rounded-md font-semibold"
            >
              <i v-html="icons.activate" class="w-5 h-5" />
              Activate
            </button>
           
            <button 
              v-if="row.status.toUpperCase() === 'ACTIVE'"
              @click.stop="handleDeactivateWithClose(row.insuredUuid || row.id)"
              class="flex items-center gap-3 w-full px-4 py-2 text-red-600 hover:bg-red-50 transition-colors rounded-md font-semibold"
            >
              <i v-html="icons.deactivate" class="w-5 h-5" />
              Deactivate
            </button>
          </template>
        </div>
      </div>
    </td>
  </tr>
</template>

<style scoped>.dropdown-menu {
  transition: opacity 0.2s ease, transform 0.2s ease;
  transform-origin: top right;
  opacity: 0;
  transform: scale(0.95);
  pointer-events: none;
  border-radius: 0.375rem;
  overflow: hidden;
}

.dropdown-menu:not(.hidden) {
  opacity: 1;
  transform: scale(1);
  pointer-events: auto;
}

/* Dropdown Items */
.dropdown-menu button {
  padding: 0.5rem 1rem;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background-color: white;
  text-align: left;
  transition: background-color 0.15s ease;
  border: none;
}

/* Hover */
.dropdown-menu button:hover {
  background-color: #eff6ff;
  color: #1d4ed8;
}

.dropdown-menu button.text-red-600:hover {
  background-color: #fef2f2;
  color: #dc2626;
}
</style>
