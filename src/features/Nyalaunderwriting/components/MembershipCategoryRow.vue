<script setup>
import { defineProps, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { openModal } from '@customizer/modal-x';
import icons from "@/utils/icons";

const props = defineProps({
  rowData: { type: Array, required: true },
  rowKeys: { type: Array, required: true },
  headKeys: { type: Array, required: true },
  payerInstitutionContractUuid: { type: String, required: true },
  onView: { type: Function, default: () => {} },
  onEdit: { type: Function, default: () => {} },
  onDelete: { type: Function, default: () => {} },
  onRowClick: { type: Function, default: () => {} },
});

const router = useRouter();

function getStatusStyle(status) {
  const base = "px-3 py-0.5 rounded-full text-center";
  switch (status?.toUpperCase()) {
    case "ACTIVE":
      return `${base} bg-green-100 text-green-600`;
    case "PENDING":
      return `${base} bg-yellow-100 text-yellow-600`;
    case "CLOSED":
      return `${base} bg-red-100 text-red-600`;
    default:
      return `${base} bg-gray-100 text-gray-600`;
  }
}
function formatCurrency(val) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "ETB" }).format(val);
}
function formatDate(date) {
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}


function navigateTo(routeName, contractUuid) {
  router.push({
    name: routeName,
    params: {
      id: props.payerInstitutionContractUuid,
      Uuid: contractUuid
    }
  });
}

function openEditModal(row) {
  openModal('EditInstitutionContract', {
    payerInstitutionContractUuid: row.payerInstitutionContractUuid,
    contract: row,
    payerInstitutionContractUuid: props.payerInstitutionContractUuid
  });
}

function openDeleteModal(row) {
  openModal('DeleteInstitutionContract', {
    contractUuid: row.payerInstitutionContractUuid,
    contractName: row.contractName
  });
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
  <tr
    v-for="(row, idx) in rowData"
    :key="row.payerInstitutionContractUuid || idx"
    @click.self="props.onRowClick(row)"
    class="bg-white rounded-lg border-b transition-all duration-200 cursor-pointer hover:shadow-md hover:bg-blue-50"
  >
    <!-- Index -->
    <td class="p-4 text-sm font-semibold text-gray-400 select-none">
      {{ idx + 1 }}
    </td>

    <!-- Contract Name -->
 
    <td class="p-4 font-medium text-gray-800">
      {{ row.institutionName }}
    </td>
       <td class="p-4 font-medium text-gray-800">
      {{ row.contractName }}
      <div class="text-xs text-gray-500">Code: {{ row.contractCode }}</div>
    </td>

    <!-- Benefit -->
    <!-- <td class="p-4 font-semibold text-green-700">
      {{ formatCurrency(row.benefit) }}
    </td> -->

    <!-- Premium -->
    <!-- <td class="p-4 font-semibold text-blue-700">
      {{ formatCurrency(row.premium) }}
    </td> -->

    <!-- Date Range -->
    <td class="p-4 text-gray-600">
      {{ formatDate(row.beginDate) }} <span class="text-orange-500">→</span> {{ formatDate(row.endDate) }}
    </td>

    <!-- Status -->
    <td class="p-4">
      <span :class="getStatusStyle(row.status)">
        {{ row.status }}
      </span>
    </td>

       <!-- Dropdown Actions -->
   <td class="px-4 py-3">
  <div class="flex gap-1.5 items-center">
    <!-- Quotations Button -->
    <button
      @click.prevent="$router.push(`/providers/${row?.payerInstitutionContractUuid}/${row?.institutionUuid}`)"
      class="relative p-2 text-blue-600 bg-blue-50 rounded-lg transition-all duration-200 group hover:bg-blue-100 hover:text-blue-700 hover:scale-105 hover:shadow-md"
      title="View Quotations"
    >
      <i v-html="icons.document || '📄'" class="w-4 h-4"></i>
      <span class="absolute -top-8 left-1/2 px-2 py-1 text-xs font-medium text-white whitespace-nowrap bg-gray-900 rounded-md opacity-0 transition-opacity -translate-x-1/2 pointer-events-none group-hover:opacity-100">
        Quotations
      </span>
    </button>

    <!-- Add Providers Button -->
    <button
      @click.prevent="$router.push(`/addInstitution/${row?.payerInstitutionContractUuid}/${row?.institutionUuid}`)"
      class="relative p-2 text-green-600 bg-green-50 rounded-lg transition-all duration-200 group hover:bg-green-100 hover:text-green-700 hover:scale-105 hover:shadow-md"
      title="Add Providers"
    >
      <i v-html="icons.plus_circle || '➕'" class="w-4 h-4"></i>
      <span class="absolute -top-8 left-1/2 px-2 py-1 text-xs font-medium text-white whitespace-nowrap bg-gray-900 rounded-md opacity-0 transition-opacity -translate-x-1/2 pointer-events-none group-hover:opacity-100">
        Add Providers
      </span>
    </button>

    <!-- More Options Button (if needed) -->
    <!-- <div class="relative">
      <button
        @click.stop="toggleDropdown($event, row.payerInstitutionContractUuid)"
        class="relative p-2 text-gray-600 bg-gray-50 rounded-lg transition-all duration-200 group hover:bg-gray-100 hover:text-gray-700 hover:scale-105 hover:shadow-md"
        title="More options"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
        <span class="absolute -top-8 left-1/2 px-2 py-1 text-xs font-medium text-white whitespace-nowrap bg-gray-900 rounded-md opacity-0 transition-opacity -translate-x-1/2 pointer-events-none group-hover:opacity-100">
          More
        </span>
      </button>

      <div 
        :id="`dropdown-${row.payerInstitutionContractUuid}`"
        class="hidden overflow-hidden absolute right-0 z-30 mt-2 w-56 bg-white rounded-xl border border-gray-100 ring-1 ring-black ring-opacity-5 shadow-xl dropdown-menu"
      >
        <div class="py-1">
          <button
            @click.prevent="$router.push(`/packages/${row?.payerInstitutionContractUuid}`)"
            class="flex gap-3 items-center px-4 py-2.5 w-full text-sm text-gray-700 transition-colors hover:bg-gray-50"
          >
            <i v-html="icons.package || '📦'" class="w-4 h-4 text-gray-500"></i>
            <span>Product Packages</span>
          </button>
          
          <button
            @click.prevent="$router.push(`/add_new_policy/${row?.institutionUuid}/insured_persons/${row?.payerInstitutionContractUuid}`)"
            class="flex gap-3 items-center px-4 py-2.5 w-full text-sm text-gray-700 transition-colors hover:bg-gray-50"
          >
            <i v-html="icons.users || '👥'" class="w-4 h-4 text-gray-500"></i>
            <span>Insured Persons</span>
          </button>
          
          <div class="my-1 h-px bg-gray-100"></div>
          
          <button 
            @click.stop="openEditModal(row)"
            class="flex gap-3 items-center px-4 py-2.5 w-full text-sm text-gray-700 transition-colors hover:bg-gray-50"
          >
            <i v-html="icons.edit || '✏️'" class="w-4 h-4 text-gray-500"></i>
            <span>Edit Contract</span>
          </button>
          
          <button 
            @click.stop="openDeleteModal(row)"
            class="flex gap-3 items-center px-4 py-2.5 w-full text-sm text-red-600 transition-colors hover:bg-red-50"
          >
            <i v-html="icons.trash || '🗑️'" class="w-4 h-4"></i>
            <span>Delete Contract</span>
          </button>
        </div>
      </div>
    </div> -->
  </div>
</td>
  </tr>
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
