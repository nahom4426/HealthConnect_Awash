<script setup>
import { defineProps, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { openModal } from '@customizer/modal-x';
import icons from "@/utils/icons";

const emit = defineEmits(['row', 'remove']);

const props = defineProps({
  rowData: { type: Array, required: true },
  rowKeys: { type: Array, required: true },
  headKeys: { type: Array, required: true },
  cells: {
    type: [Object, Array],
    default: () => ({})
  },
  institutionUuid: { type: String, required: false },
  isMobile: { type: Boolean, default: false },
  onView: { type: Function, default: () => {} },
  onEdit: { type: Function, default: () => {} },
  onDelete: { type: Function, default: () => {} },
  onRowClick: { type: Function, default: () => {} },
  currentPage: { type: Number, default: 1 },
  perPage: { type: Number, default: 25 }
});

const router = useRouter();

function getStatusStyle(status) {
  const base = "inline-flex justify-center items-center px-3 py-1 rounded-full text-xs font-semibold";
  switch (status?.toUpperCase()) {
    case "ACTIVE":
      return `${base} bg-green-100 text-green-800`;
    case "PENDING":
      return `${base} bg-amber-100 text-amber-800`;
    case "CLOSED":
      return `${base} bg-red-100 text-red-800`;
    default:
      return `${base} bg-gray-100 text-gray-800`;
  }
}

function formatDate(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getDateRange(row) {
  if (!row.beginDate || !row.endDate) return '—';
  return `${formatDate(row.beginDate)} → ${formatDate(row.endDate)}`;
}

function navigateTo(path) {
  router.push(path);
}

function toggleDropdown(event, uuid) {
  event.stopPropagation();
  closeAllDropdowns();
  document.getElementById(`dropdown-${uuid}`)?.classList.toggle("hidden");
}

function closeAllDropdowns() {
  document.querySelectorAll(".dropdown-menu").forEach(menu => {
    menu.classList.add("hidden");
  });
}

onMounted(() => window.addEventListener("click", closeAllDropdowns));
onUnmounted(() => window.removeEventListener("click", closeAllDropdowns));
</script>

<template>
  <!-- Desktop Table Rows -->
  <template v-if="!isMobile">
    <tr
      v-for="(row, idx) in rowData.filter(r => r !== null)"
      :key="row.payerInstitutionContractUuid || idx"
      class="bg-white border-b transition-colors duration-150 ease-in-out hover:bg-gray-50"
    >
      <!-- Index -->
      <td class="p-4 font-medium text-gray-500">{{ (props.currentPage - 1) * props.perPage + idx + 1 }}</td>
      <td class="p-4">
        <div class="flex flex-col">
          <span class="px-3 py-1 text-sm font-medium text-blue-700 bg-blue-50 rounded-md shadow-sm w-fit">
            {{ row.institutionName || '—' }}
          </span>
          <span class="mt-1 font-mono text-xs text-gray-500">{{ row.policyNumber || '—' }}</span>
        </div>
      </td>

      <!-- Category Name -->
      <td class="p-4">
        <div class="flex flex-col">
          <span class="font-semibold text-gray-900">{{ row.contractName }}</span>
          <span class="mt-1 text-xs text-gray-500">{{ getDateRange(row) }}</span>
        </div>
      </td>
 <!-- <td class="p-4 font-mono text-sm text-gray-700">{{ row.contractCode || '—' }}</td> -->
      <!-- Code -->

      <!-- Status -->
      <td class="p-4">
        <span :class="getStatusStyle(row.status)">
          {{ row.status }}
        </span>
      </td>

      <!-- Actions -->
      <td class="p-2 whitespace-nowrap">
        <div class="flex gap-1 justify-start items-center">
          <!-- Product Packages -->
          <!-- <button
            @click.stop="navigateTo(`/packages/${row?.payerInstitutionContractUuid}`)"
            class="inline-flex gap-1 items-center px-2 py-0.5 text-xs font-semibold text-purple-600 bg-purple-50 rounded border border-purple-200 transition-all duration-200 hover:bg-purple-100"
            title="Packages"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <span class="hidden sm:inline">Package</span>
          </button> -->

          <!-- Insured Persons -->
          <button
            @click.stop="navigateTo(`/insured_persons/${row?.payerInstitutionContractUuid}/${row?.institutionUuid}/${row?.institutionName}?hasInstitution=false`)"
            class="inline-flex gap-1 items-center px-2 py-0.5 text-sm font-semibold text-blue-600 bg-blue-50 rounded border border-blue-200 transition-all duration-200 hover:bg-blue-100"
            title="Persons"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 12H9m6 0a6 6 0 11-12 0 6 6 0 0112 0z" />
            </svg>
            <span class="hidden sm:inline">Insured Persons</span>
          </button>

          <!-- Add Providers -->
          <button
            @click.stop="navigateTo(`/addInstitution/${row?.payerInstitutionContractUuid}/${row?.institutionUuid}`)"
            class="inline-flex gap-1 items-center px-2 py-0.5 text-sm font-semibold text-green-600 bg-green-50 rounded border border-green-200 transition-all duration-200 hover:bg-green-100"
            title="Providers"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
            </svg>
            <span class="hidden sm:inline">Add Providers</span>
          </button>
        </div>
      </td>
    </tr>
  </template>

  <!-- Mobile Card Layout -->
  <template v-else>
    <div
      v-for="(row, idx) in rowData.filter(r => r !== null)"
      :key="row.payerInstitutionContractUuid || idx"
      class="overflow-hidden p-2 mx-1 mb-3 bg-white rounded-lg border border-gray-200 shadow-sm transition-all duration-200 cursor-pointer hover:shadow-md"
    >
      <!-- Header with name and status -->
      <div class="flex flex-col mb-2 space-y-1">
        <div class="flex gap-2 justify-between items-start">
          <div class="flex-1 min-w-0">
            <h3 class="text-xs font-semibold text-gray-900 truncate">
              {{ row.contractName }}
            </h3>
            <p class="text-xs text-gray-500 truncate">{{ row.contractCode }}</p>
          </div>
          <div class="flex-shrink-0">
            <span :class="getStatusStyle(row.status)" class="text-xs">
              {{ row.status }}
            </span>
          </div>
        </div>
      </div>

      <!-- Category Details -->
      <div class="py-2 mb-2 space-y-1 border-t border-gray-100">
        <div class="text-xs text-gray-600">
          <span class="font-medium text-gray-500">Dates: </span>
          <span class="text-gray-900">{{ getDateRange(row) }}</span>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-2 pt-2 border-t border-gray-100">
        <!-- Product Packages -->
        <!-- <button
          @click.stop="navigateTo(`/packages/${row?.payerInstitutionContractUuid}`)"
          class="inline-flex flex-1 gap-0.5 justify-center items-center px-1 py-1 min-w-0 text-xs font-medium text-purple-600 bg-purple-50 rounded border border-purple-200 transition-all duration-200 hover:bg-purple-100"
          title="Packages"
        >
          <svg class="flex-shrink-0 w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <span class="truncate">Pkg</span>
        </button> -->

        <!-- Insured Persons -->
        <button
          @click.stop="navigateTo(`/insured_persons/${row?.payerInstitutionContractUuid}/${row?.institutionUuid}?hasInstitution=false&pageContext=membership`)"
          class="inline-flex flex-1 gap-0.5 justify-center items-center px-1 py-1 min-w-0 text-xs font-medium text-blue-600 bg-blue-50 rounded border border-blue-200 transition-all duration-200 hover:bg-blue-100"
          title="Persons"
        >
          <svg class="flex-shrink-0 w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 12H9m6 0a6 6 0 11-12 0 6 6 0 0112 0z" />
          </svg>
          <span class="truncate">Persons</span>
        </button>

        <!-- Add Providers -->
        <button
          @click.stop="navigateTo(`/addInstitution/${row?.payerInstitutionContractUuid}/${row?.institutionUuid}`)"
          class="inline-flex flex-1 gap-0.5 justify-center items-center px-1 py-1 min-w-0 text-xs font-medium text-green-600 bg-green-50 rounded border border-green-200 transition-all duration-200 hover:bg-green-100"
          title="Providers"
        >
          <svg class="flex-shrink-0 w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
          </svg>
          <span class="truncate">Prov</span>
        </button>
      </div>
    </div>
  </template>
</template>

<style scoped>
/* Status Badges */
.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  display: inline-block;
  text-transform: capitalize;
}
.bg-green-100 { background-color: #d1fae5; color: #065f46; }
.bg-yellow-100 { background-color: #fef3c7; color: #92400e; }
.bg-red-100 { background-color: #fee2e2; color: #991b1b; }
.bg-gray-100 { background-color: #f3f4f6; color: #374151; }

/* Dropdown Animation */
.dropdown-menu {
  transform: scale(0.95);
  opacity: 0;
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.dropdown-menu:not(.hidden) {
  transform: scale(1);
  opacity: 1;
}

/* Dropdown Items */
.dropdown-item {
  padding: 0.65rem 1rem;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background-color: white;
  font-size: 0.875rem;
  transition: background-color 0.15s ease, color 0.15s ease;
}
.dropdown-item:hover {
  background-color: #eff6ff;
  color: #1d4ed8;
}
.dropdown-item.text-red-600:hover {
  background-color: #fef2f2;
  color: #dc2626;
}
</style>
