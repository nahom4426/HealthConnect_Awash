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
    class="bg-white border-b hover:shadow-md hover:bg-blue-50 transition-all duration-200 cursor-pointer group rounded-lg"
  >
    <!-- Index -->
    <td class="p-4 font-semibold text-gray-400 select-none text-sm">
      {{ idx + 1 }}
    </td>

    <!-- Contract Name -->
    <td class="p-4 text-gray-800 font-medium">
      {{ row.contractName }}
      <div class="text-xs text-gray-500">Code: {{ row.contractCode }}</div>
    </td>

    <!-- Benefit -->
    <td class="p-4 text-green-700 font-semibold">
      {{ formatCurrency(row.benefit) }}
    </td>

    <!-- Premium -->
    <td class="p-4 text-blue-700 font-semibold">
      {{ formatCurrency(row.premium) }}
    </td>

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
    <td class="p-4 relative">
      <button
        @click.stop="toggleDropdown($event, row.payerInstitutionContractUuid)"
        class="p-2 rounded-full hover:bg-gray-200 transition-colors"
        aria-label="Actions"
      >
        <svg xmlns="http://www.w3.org/2000/svg" 
             class="h-5 w-5 text-gray-600 group-hover:text-gray-800 transition-colors" 
             viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>

      <!-- Dropdown Menu -->
      <div 
        :id="`dropdown-${row.payerInstitutionContractUuid}`"
        class="dropdown-menu hidden absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-20 overflow-hidden"
      >
        <div class="py-1">
          <!-- <button
            @click.prevent="$router.push(`/packages/${row?.payerInstitutionContractUuid}`)"
            class="dropdown-item"
          >
            <i v-html="icons.healthcare || '🏥'" class="w-5 h-5"></i>
            Product Packages
          </button>
          <button 
            @click.prevent="$router.push(`/insured_persons/${row?.payerInstitutionContractUuid}`)"
            class="dropdown-item"
          >
            <i v-html="icons.users_check || '👥'" class="w-5 h-5"></i>
            Insured Persons
          </button>
          <button 
            @click.stop="navigateTo('ProvidersInContract', row.payerInstitutionContractUuid)"
            class="dropdown-item"
          >
            <i v-html="icons.hospital_building || '🏥'" class="w-5 h-5"></i>
            Add Providers
          </button> -->
          <button 
            @click.stop="openEditModal(row)"
            class="dropdown-item"
          >
            <i v-html="icons.edit || '✏️'" class="w-5 h-5"></i>
            Edit Contract
          </button>
          <button 
            @click.stop="openDeleteModal(row)"
            class="dropdown-item text-red-600 hover:text-red-700"
          >
            <i v-html="icons.delete" class="w-5 h-5"></i>
            Delete Contract
          </button>
        </div>
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
