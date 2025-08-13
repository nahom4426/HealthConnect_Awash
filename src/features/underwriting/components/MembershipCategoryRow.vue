<script setup>
import { defineProps, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { openModal } from '@customizer/modal-x';
import icons from "@/utils/icons";

const props = defineProps({
  rowData: { type: Array, required: true },
  rowKeys: { type: Array, required: true },
  institutionUuid: { type: String, required: true },
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

function navigateTo(routeName, contractUuid) {
  router.push({
    name: routeName,
    params: {
      id: props.institutionUuid,
      Uuid: contractUuid
    }
  });
}

function openEditModal(row) {
  openModal('EditInstitutionContract', {
    contractUuid: row.payerInstitutionContractUuid,
    contract: row,
    institutionUuid: props.institutionUuid
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
    class="bg-white border-b hover:bg-blue-50 transition-colors cursor-pointer"
  >
    <!-- Index -->
    <td class="p-4 font-semibold text-gray-600 select-none">{{ idx + 1 }}</td>

    <!-- Table Data -->
    <td v-for="key in rowKeys.slice(1)" :key="key" class="p-4 text-gray-700 whitespace-nowrap">
      <template v-if="key === 'status'">
        <span :class="getStatusStyle(row.status)">
          {{ row.status === 'ACTIVE' ? 'Active' : row.status === 'PENDING' ? 'Pending' : 'Closed' }}
        </span>
      </template>
       <template v-else-if="key === 'contractCode'">
        
          {{ row.contractCode }}
     
      </template>
      <template v-else-if="key === 'dateRange'">
        {{ row.beginDate }} to {{ row.endDate }}
      </template>
      <template v-else>
        {{ row[key] }}
      </template>
    </td>

    <!-- Dropdown Actions -->
    <td class="p-4 relative">
      <button
        @click.stop="toggleDropdown($event, row.payerInstitutionContractUuid)"
        class="p-2 rounded-full hover:bg-gray-200 transition-colors"
        aria-label="Actions"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>

      <div 
        :id="`dropdown-${row.payerInstitutionContractUuid}`"
        class="dropdown-menu hidden absolute right-0 mt-2 w-52 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-20"
      >
        <div class="py-1">
          <button
          @click.prevent="$router.push(`/packages/${row?.payerInstitutionContractUuid}`)"
            class="dropdown-item">
             <i v-html="icons.healthcare || '🏥'" class="w-5 h-5"></i>
                Product Packages
          </button>
          <button 
          @click.prevent="$router.push(`/insured_persons/${row?.payerInstitutionContractUuid}`)"
            class="dropdown-item">
             <i v-html="icons.users_check || '👥'" class="w-5 h-5"></i>
                 Insured Persons
          </button>
          <button @click.stop="navigateTo('ProvidersInContract', row.payerInstitutionContractUuid)"
            class="dropdown-item">
            <i v-html="icons.hospital_building || '🏥'" class="w-5 h-5"></i>
                 Add Providers
          </button>
          <button @click.stop="openEditModal(row)" class="dropdown-item">
            <i v-html="icons.edit || '✏️'" class="w-5 h-5"></i> Edit Contract
          </button>
          <button @click.stop="openDeleteModal(row)" class="dropdown-item text-red-600 hover:text-red-700">
            <i v-html="icons.delete" class="w-5 h-5" /> Delete Contract
          </button>
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
