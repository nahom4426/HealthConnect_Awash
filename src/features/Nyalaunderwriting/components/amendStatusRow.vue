<script setup>
import { defineProps, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { openModal } from '@customizer/modal-x';
import icons from "@/utils/icons";

const props = defineProps({
  rowData: { type: Array, required: true },
  rowKeys: { type: Array, required: true },
  headKeys: { type: Array, required: true },
  payerInstitutionContractUuid: { type: String, required: false, default: '' },
  institutionUuid: { type: String, default: '' },
  onView: { type: Function, default: () => {} },
  onEdit: { type: Function, default: () => {} },
  onDelete: { type: Function, default: () => {} },
  onRowClick: { type: Function, default: () => {} },
  onRefetch: { type: Function, default: () => {} },
  cells: { type: [Object, Array], default: () => ({}) },
  hideIndex: { type: Boolean, default: false },
});

const router = useRouter();

function getStatusStyle(status) {
  const base = "px-3 py-0.5 rounded-full text-center";
  switch (status?.toUpperCase()) {
    case "ACTIVE":
      return `${base} bg-success-soft text-success`;
    case "PENDING":
      return `${base} bg-warning-soft text-warning`;
    case "CLOSED":
      return `${base} bg-error-soft text-error`;
    default:
      return `${base} bg-surface-muted text-ink-muted`;
  }
}
function formatCurrency(val) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "ETB" }).format(val);
}
function formatDate(date) {
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// Debug function to see what data is available
function navigateToAmendInsuredPersons(row) {
  
  // Try to get the correct values from the row
  const routeParams = {
    id: row.payerInstitutionContractUuid || row.contractUuid || props.payerInstitutionContractUuid,
    institutionUuid: props.institutionUuid || row.institutionUuid || row.institutionId,
    quotationUuid: row.quotationUuid || row.payerInstitutionContractUuid || row.contractUuid,
    institutionName: row.institutionName || 'IFDC'
  };
  
  
  // Use path-based navigation instead of name-based
  const path = `/insured_persons/${routeParams.id}/${routeParams.institutionUuid}/${routeParams.quotationUuid}/${encodeURIComponent(routeParams.institutionName)}?pageContext=amend`;
  
  
  router.push(path);
}

function openEditModal(row) {
  openModal('EditInstitutionContract', {
    payerInstitutionContractUuid: row.payerInstitutionContractUuid || props.payerInstitutionContractUuid,
    contract: row,
    onRefetch: props.onRefetch
  });
}

function openRenewModal(row) {
  openModal('RenewContract', {
    contractUuid: row.payerInstitutionContractUuid || props.payerInstitutionContractUuid,
    contract: row,
    policyNumber: row.policyNumber || '',
    previousEndDate: row.endDate || '',
    onRefetch: props.onRefetch
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
    class="bg-white rounded-lg border-b transition-all duration-200 cursor-pointer hover:shadow-md hover:bg-primary/5 group"
  >
    <!-- Index -->
    <td class="p-4 text-sm font-semibold text-ink-subtle select-none">
      {{ idx + 1 }}
    </td>

    <!-- Contract Name -->
    <td class="p-4 font-medium text-ink">
      {{ row.contractName }}
      <div class="text-xs text-ink-subtle">Code: {{ row.contractCode }}</div>
    </td>

    <!-- Date Range -->
    <td class="p-4 text-ink-muted">
      {{ formatDate(row.beginDate) }} <span class="text-orange-500">→</span> {{ formatDate(row.endDate) }}
    </td>

    <!-- Status -->
    <td class="p-4">
      <span :class="getStatusStyle(row.status)">
        {{ row.status }}
      </span>
    </td>

    <!-- Dropdown Actions -->
    <td class="flex gap-3 items-center py-4">
      <!-- Edit Policy Button -->
      <div class="flex gap-2 pt-2 border-line">
        <button
          @click.stop="openEditModal(row)"
          class="flex p-2 text-primary bg-primary/5 rounded-lg rounded-full transition-colors hover:bg-primary/10 hover:text-primary-hover"
        >
          <svg xmlns="http://www.w3.org/2000/svg"
               class="w-5 h-5"
               fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M15.232 5.232l3.536 3.536M9 11l3 3L20.485 5.515a2.121 2.121 0 10-3-3L9 11zm0 0L4 16v4h4l5-5" />
          </svg>
          <span class="text-sm font-medium">Edit Policy</span>
        </button>

        <button
          @click.stop="openRenewModal(row)"
          class="flex p-2 text-success bg-success-soft rounded-lg rounded-full transition-colors hover:bg-success-soft hover:text-success-strong"
        >
          <svg xmlns="http://www.w3.org/2000/svg"
               class="w-5 h-5"
               fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18" />
          </svg>
          <span class="text-sm font-medium">Renew</span>
        </button>
        
        <button
          @click.stop="navigateToAmendInsuredPersons(row)"
          class="inline-flex flex-1 gap-0.5 justify-center items-center px-1 py-1 min-w-0 text-xs font-medium text-error bg-error-soft rounded border border-error/20 transition-all duration-200 hover:bg-error-soft"
          title="Persons"
        >
          <svg class="flex-shrink-0 w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 12H9m6 0a6 6 0 11-12 0 6 6 0 0112 0z" />
          </svg>
          <span class="truncate">Amend Insured Persons</span>
        </button>
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
.bg-success-soft { background-color: rgb(var(--success-soft)); color: rgb(var(--success-strong)); }
.bg-warning-soft { background-color: rgb(var(--warning-soft)); color: rgb(var(--warning-strong)); }
.bg-error-soft { background-color: rgb(var(--error-soft)); color: rgb(var(--error-strong)); }
.bg-surface-muted { background-color: rgb(var(--surface-muted)); color: rgb(var(--ink-muted)); }

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
  background-color: rgb(var(--primary) / 0.05);
  color: rgb(var(--primary-hover));
}
.dropdown-item.text-error:hover {
  background-color: rgb(var(--error-soft));
  color: rgb(var(--error));
}
</style>