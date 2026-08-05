<script setup>
import { defineProps, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { openModal } from '@customizer/modal-x';
import icons from "@/utils/icons";
import { useNavigationState } from '@/composables/useNavigationState';
const emit = defineEmits(['row', 'remove']);

const props = defineProps({
  rowData: { type: Array, required: true },
  rowKeys: { type: Array, required: true },
  headKeys: { type: Array, required: true },
  cells: { 
    type: [Object, Array],
    default: () => ({}) 
  },
  isMobile: { type: Boolean, default: false },
  onView: { type: Function, default: () => {} },
  onEdit: { type: Function, default: () => {} },
  onDelete: { type: Function, default: () => {} },
  onStatusChange: { type: Function, default: () => {} },
  currentPage: { type: Number, default: 1 },
  perPage: { type: Number, default: 25 },
});

const router = useRouter();

function getStatusStyle(status) {
  const base = "inline-flex justify-center items-center px-3 py-1 rounded-full text-xs font-semibold";
  switch (status?.toUpperCase()) {
    case "ACTIVE":
      return `${base} bg-green-100 text-green-800`;
    case "INACTIVE":
      return `${base} bg-red-100 text-red-800`;
    case "PENDING":
    case "SUSPENDED":
      return `${base} bg-yellow-100 text-yellow-800`;
    default:
      return `${base} bg-gray-100 text-gray-800`;
  }
}

function handleEdit(row) {
  openModal('EditInstitution', {
    institutionUuid: row.institutionUuid,
    institution: row,
  });
}

function handleStatusChange(row) {
  const newStatus = row.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
  openModal('ChangeInstitutionStatus', {
    institutionUuid: row.institutionUuid,
    newStatus,
    currentStatus: row.status
  });
}

function toggleDropdown(event, uuid) {
  event.stopPropagation();
  closeAllDropdowns();
  document.getElementById(`dropdown-${uuid}`)?.classList.toggle('hidden');
}

function closeAllDropdowns() {
  document.querySelectorAll('.dropdown-menu').forEach(menu => {
    menu.classList.add('hidden');
  });
}
const { setShowActionButtons } = useNavigationState();
function navigateTo(path) {
  // Hide action buttons when navigating from amendStatusRow
  setShowActionButtons(false);
  router.push(path);
}
onMounted(() => window.addEventListener("click", closeAllDropdowns));
onUnmounted(() => window.removeEventListener("click", closeAllDropdowns));
</script>

<template>
  <!-- Desktop Table Rows -->
  <template v-if="!isMobile">
    <tr
      v-for="(row, idx) in rowData.filter(r => r !== null)"
      :key="row.institutionUuid || idx"
      class="bg-white border-b transition-colors duration-150 ease-in-out hover:bg-gray-50"
    >
      <!-- Index -->
      <td class="p-4 font-semibold text-gray-500">{{ (props.currentPage - 1) * props.perPage + idx + 1 }}</td>

      <!-- Institution Name & CIF -->
      <td class="p-4">
        <div class="flex flex-col">
          <span class="font-semibold text-gray-900">{{ row.institutionName }}</span>
          <span class="mt-1 text-xs text-gray-500">CIF: {{ row.cifNumber || '—' }} <span v-if="row.email"> • {{ row.email }}</span></span>
        </div>
      </td>

      <!-- Branch Name & Phone -->
      <td class="p-4">
        <div class="flex flex-col">
          <span class="font-semibold text-gray-900">{{ row.branchName }}</span>
          <span class="mt-1 text-xs text-gray-500">{{ row.telephone || '—' }} <span v-if="row.address1"> • {{ row.address1 }}</span></span>
        </div>
      </td>

      <!-- Status -->
      <td class="p-4">
        <span :class="getStatusStyle(row.status)">
          {{ row.status }}
        </span>
      </td>

      <!-- Actions -->
      <td class="p-4">
        <div class="flex flex-wrap gap-2 justify-start items-center">
          <!-- View Policy -->
          <button
             @click.stop="navigateTo(`/institution_contracts/${row?.institutionUuid}/${row?.institutionName}`)"
            class="flex gap-2 items-center px-3 py-1.5 text-sm font-semibold text-blue-600 bg-blue-50 rounded-xl border border-blue-200 transition-all duration-200 hover:bg-blue-100 hover:shadow-sm"
          >
            <i v-html="icons.eye" class="text-blue-500" />
            <span>View</span>
          </button>

          <!-- Edit -->
          <button
            @click.stop="handleEdit(row)"
            class="flex gap-2 items-center px-3 py-1.5 text-sm font-semibold text-indigo-600 bg-indigo-50 rounded-xl border border-indigo-200 transition-all duration-200 hover:bg-indigo-100 hover:shadow-sm"
          >
            <i v-html="icons.edit" class="text-indigo-500" />
            <span>Edit</span>
          </button>

          <!-- Status Toggle -->
          <!-- <button
            @click.stop="handleStatusChange(row)"
            :class="row.status === 'ACTIVE' ? 'text-red-600 bg-red-50 border-red-200 hover:bg-red-100' : 'text-green-600 bg-green-50 border-green-200 hover:bg-green-100'"
            class="flex gap-2 items-center px-3 py-1.5 text-sm font-semibold rounded-xl border transition-all duration-200 hover:shadow-sm"
          >
            <svg v-if="row.status === 'ACTIVE'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>{{ row.status === 'ACTIVE' ? 'Deactivate' : 'Activate' }}</span>
          </button> -->
        </div>
      </td>
    </tr>
  </template>

  <!-- Mobile Card Layout -->
  <template v-else>
    <div
      v-for="(row, idx) in rowData.filter(r => r !== null)"
      :key="row.institutionUuid || idx"
      class="p-2 mx-0.5 mb-2 bg-white rounded-lg border border-gray-200 shadow-sm transition-all duration-200 cursor-pointer sm:p-3 hover:shadow-md sm:mb-3 sm:mx-2"
    >
      <!-- Header with name and status -->
      <div class="flex flex-col mb-2 space-y-1 sm:flex-row sm:justify-between sm:items-start sm:space-y-0 sm:mb-3">
        <div class="flex-1 min-w-0">
          <h3 class="text-xs font-semibold text-gray-900 truncate sm:text-sm">
            {{ row.institutionName }}
          </h3>
          <p class="text-xs text-gray-500 truncate">{{ row.email }}</p>
        </div>
        <div class="flex-shrink-0 mt-1 sm:mt-0">
          <span :class="getStatusStyle(row.status)">
            {{ row.status }}
          </span>
        </div>
      </div>

      <!-- Institution Details -->
      <div class="py-2 mb-2 space-y-1 border-t border-gray-100 sm:py-2 sm:mb-2">
        <div class="flex justify-between items-start py-0.5">
          <span class="flex-shrink-0 text-xs font-medium text-gray-500">TIN:</span>
          <span class="ml-2 font-mono text-xs text-right text-gray-900 truncate">
            {{ row.tinNumber || '—' }}
          </span>
        </div>
        <div class="flex justify-between items-start py-0.5">
          <span class="flex-shrink-0 text-xs font-medium text-gray-500">Phone:</span>
          <span class="ml-2 text-xs text-right text-gray-900 truncate">
            {{ row.telephone || '—' }}
          </span>
        </div>
        <div class="flex justify-between items-start py-0.5">
          <span class="flex-shrink-0 text-xs font-medium text-gray-500">Category:</span>
          <span class="ml-2 text-xs text-right text-gray-900 truncate">
            {{ row.category || '—' }}
          </span>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-col gap-1.5 pt-2 border-t border-gray-100 sm:flex-row sm:gap-2 sm:pt-2">
        <!-- View Policy -->
        <button
          @click.stop="$router.push('/institution_contracts/' + row.institutionUuid)"
          class="flex flex-1 gap-1 justify-center items-center px-2 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-md border border-blue-200 transition-all duration-200 hover:bg-blue-100"
        >
          <i v-html="icons.eye" class="w-3 h-3 text-blue-500" />
          <span>View</span>
        </button>

        <!-- Edit -->
        <button
          @click.stop="handleEdit(row)"
          class="flex flex-1 gap-1 justify-center items-center px-2 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-md border border-indigo-200 transition-all duration-200 hover:bg-indigo-100"
        >
          <i v-html="icons.edit" class="w-3 h-3 text-indigo-500" />
          <span>Edit</span>
        </button>

        <!-- Status Toggle -->
        <!-- <button
          @click.stop="handleStatusChange(row)"
          :class="row.status === 'ACTIVE' ? 'text-red-600 bg-red-50 border-red-200 hover:bg-red-100' : 'text-green-600 bg-green-50 border-green-200 hover:bg-green-100'"
          class="flex flex-1 gap-1 justify-center items-center px-2 py-1.5 text-xs font-medium rounded-md border transition-all duration-200"
        >
          <svg v-if="row.status === 'ACTIVE'" class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
          <svg v-else class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </button> -->
      </div>
    </div>
  </template>
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
