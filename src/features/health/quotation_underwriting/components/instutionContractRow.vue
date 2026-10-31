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
  const base = "px-3 py-0.5 rounded-full text-center font-semibold text-sm";
  switch (status?.toUpperCase()) {
    case "ACTIVE":
      // Bright green for active
      return `${base} bg-success-soft text-success-strong`;
    case "PENDING":
      // Soft amber/yellow for pending
      return `${base} bg-warning-soft text-warning-strong`;
    case "RENEWED":
      // Fresh blue for renewed
      return `${base} bg-primary/10 text-primary-hover`;
    case "EXPIRED":
      // Muted red for expired
      return `${base} bg-error-soft text-error-strong`;
    default:
      // Neutral gray for unknown statuses
      return `${base} bg-surface-muted text-ink-muted`;
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
function openContributionModal(row) {
  openModal('ManageBenefitContributions', {
    payerInstitutionContractUuid: row.payerInstitutionContractUuid,
    contract: row
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
    class="bg-white border-b hover:shadow-md hover:bg-primary/5 transition-all duration-200 cursor-pointer group rounded-lg"
  >
    <!-- Index -->
    <td class="p-4 font-semibold text-ink-subtle select-none text-sm">
      {{ idx + 1 }}
    </td>

    <!-- Contract Name -->
    <td class="p-4 text-ink font-medium">
      {{ row.contractName }}
      <div class="text-xs text-ink-subtle">Code: {{ row.contractCode }}</div>
    </td>

    <!-- Benefit -->
    <td class="p-4 text-success-strong font-semibold">
      {{ formatCurrency(row.benefit) }}
    </td>

    <!-- Premium -->
    <!-- <td class="p-4 text-primary-hover font-semibold">
      {{ formatCurrency(row.premium) }}
    </td> -->

    <!-- Date Range -->
    <!-- <td class="p-4 text-ink-muted">
      {{ formatDate(row.beginDate) }} <span class="text-orange-500">→</span> {{ formatDate(row.endDate) }}
    </td> -->

    <!-- Status -->
    <td class="p-4">
      <span :class="getStatusStyle(row.status)">
        {{ row.status }}
      </span>
    </td>

       <!-- Dropdown Actions -->
       <td class="py-4 flex items-center gap-3">
  <!-- Edit Policy Button -->
   <div>
  <button
    @click.stop="openEditModal(row)"
    class="flex rounded-lg bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary-hover transition-colors p-2 rounded-full hover:bg-primary/10 text-primary transition-colors"
  >
    <svg xmlns="http://www.w3.org/2000/svg"
         class="h-5 w-5"
         fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M15.232 5.232l3.536 3.536M9 11l3 3L20.485 5.515a2.121 2.121 0 10-3-3L9 11zm0 0L4 16v4h4l5-5" />
    </svg>
    <span class="font-medium text-sm">Edit Policy</span>
  </button>
 <!-- Set Contribution -->
          <button
            @click.stop="openContributionModal(row)"
            class="flex gap-2 items-center px-3 py-1.5 text-sm font-semibold text-success bg-success-soft rounded-xl border border-success/20 transition-all duration-200 hover:bg-success-soft hover:shadow-sm"
            title="Set Benefit Contributions"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Contributions</span>
          </button>

  <!-- Delete Policy Button -->
  <!-- <button
    @click.stop="openDeleteModal(row)"
    class="flex rounded-lg bg-error-soft text-error hover:bg-error-soft hover:text-error-strong transition-colors p-2 rounded-full hover:bg-error-soft text-error transition-colors"
  >
    <svg xmlns="http://www.w3.org/2000/svg"
         class="h-5 w-5"
         fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M6 18L18 6M6 6l12 12" />
    </svg>
    <span class="font-medium text-sm">Delete Policy</span>
  </button> -->
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
