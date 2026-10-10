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
  institutionUuid: { 
    type: String, 
    required: false,
    default: ''
  },
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
      return `${base} bg-success-soft text-success-strong`;
    case "PENDING":
      return `${base} bg-warning-soft text-warning-strong`;
    case "RENEWED":
      return `${base} bg-primary/10 text-primary-hover`;
    case "EXPIRED":
      return `${base} bg-error-soft text-error-strong`;
    default:
      return `${base} bg-surface-muted text-ink`;
  }
}

function formatCurrency(val) {
  if (!val) return '—';
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "ETB" }).format(val);
}

function formatDate(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getDateRange(row) {
  if (!row.beginDate || !row.endDate) return '—';
  return `${formatDate(row.beginDate)} → ${formatDate(row.endDate)}`;
}

function openEditModal(row) {
  openModal('EditInstitutionContract', {
    payerInstitutionContractUuid: row.payerInstitutionContractUuid,
    contract: row,
    institutionUuid: props.institutionUuid
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
  <!-- Desktop Table Rows -->
  <template v-if="!isMobile">
    <tr
      v-for="(row, idx) in rowData.filter(r => r !== null)"
      :key="row.payerInstitutionContractUuid || idx"
      class="bg-white border-b transition-colors duration-150 ease-in-out hover:bg-surface-muted"
    >
      <!-- Index -->
      <td class="p-4 font-medium text-ink-subtle">{{ (props.currentPage - 1) * props.perPage + idx + 1 }}</td>

      <!-- Contract Name -->
      <td class="p-4">
        <div class="flex flex-col">
          <span class="font-semibold text-ink">{{ row.contractName }}</span>
          <span class="mt-1 text-xs text-ink-subtle">{{ row.contractCode }}</span>
        </div>
      </td>

      <!-- Code -->
      <td class="p-4 font-mono text-sm text-ink-muted">{{ row.contractCode || '—' }}</td>

      <!-- Benefit -->
      <td class="p-4 font-semibold text-success-strong">{{ row.policyNumber }}</td>

      <!-- Premium -->
      <!-- <td class="p-4 font-semibold text-primary-hover">{{ formatCurrency(row.premium) }}</td> -->

      <!-- Date Range -->
      <td class="p-4 text-sm text-ink-muted">{{ getDateRange(row) }}</td>

      <!-- Status -->
      <td class="p-4">
        <span :class="getStatusStyle(row.status)">
          {{ row.status }}
        </span>
      </td>

      <!-- Actions -->
      <td class="p-4">
        <div class="flex flex-wrap gap-2 justify-start items-center">
          <!-- Edit Policy -->
          <button
            @click.stop="openEditModal(row)"
            class="flex gap-2 items-center px-3 py-1.5 text-sm font-semibold text-primary bg-primary/5 rounded-xl border border-primary/20 transition-all duration-200 hover:bg-primary/10 hover:shadow-sm"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>Edit</span>
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

          <!-- Delete Policy -->
          <!-- <button
            @click.stop="openDeleteModal(row)"
            class="flex gap-2 items-center px-3 py-1.5 text-sm font-semibold text-error bg-error-soft rounded-xl border border-error/20 transition-all duration-200 hover:bg-error-soft hover:shadow-sm"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>Delete</span>
          </button> -->
        </div>
      </td>
    </tr>
  </template>

  <!-- Mobile Card Layout -->
  <template v-else>
    <div
      v-for="(row, idx) in rowData.filter(r => r !== null)"
      :key="row.payerInstitutionContractUuid || idx"
      class="p-2 mx-0.5 mb-2 bg-white rounded-lg border border-line shadow-sm transition-all duration-200 cursor-pointer sm:p-3 hover:shadow-md sm:mb-3 sm:mx-2"
    >
      <!-- Header with name and status -->
      <div class="flex flex-col mb-2 space-y-1 sm:flex-row sm:justify-between sm:items-start sm:space-y-0 sm:mb-3">
        <div class="flex-1 min-w-0">
          <h3 class="text-xs font-semibold text-ink truncate sm:text-sm">
            {{ row.contractName }}
          </h3>
          <p class="text-xs text-ink-subtle truncate">Code: {{ row.contractCode }}</p>
        </div>
        <div class="flex-shrink-0 mt-1 sm:mt-0">
          <span :class="getStatusStyle(row.status)">
            {{ row.status }}
          </span>
        </div>
      </div>

      <!-- Contract Details -->
      <div class="py-2 mb-2 space-y-1 border-t border-line sm:py-2 sm:mb-2">
        <div class="flex justify-between items-start py-0.5">
          <span class="flex-shrink-0 text-xs font-medium text-ink-subtle">Benefit:</span>
          <span class="ml-2 text-xs font-semibold text-right text-success-strong">
            {{ formatCurrency(row.benefit) }}
          </span>
        </div>
        <div class="flex justify-between items-start py-0.5">
          <span class="flex-shrink-0 text-xs font-medium text-ink-subtle">Premium:</span>
          <span class="ml-2 text-xs font-semibold text-right text-primary-hover">
            {{ formatCurrency(row.premium) }}
          </span>
        </div>
        <div class="flex justify-between items-start py-0.5">
          <span class="flex-shrink-0 text-xs font-medium text-ink-subtle">Dates:</span>
          <span class="ml-2 text-xs text-right text-ink">
            {{ getDateRange(row) }}
          </span>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-col gap-1.5 pt-2 border-t border-line sm:flex-row sm:gap-2 sm:pt-2">
        <!-- Edit Policy -->
        <button
          @click.stop="openEditModal(row)"
          class="flex flex-1 gap-1 justify-center items-center px-2 py-1.5 text-xs font-medium text-primary bg-primary/5 rounded-md border border-primary/20 transition-all duration-200 hover:bg-primary/10"
        >
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <span>Edit</span>
        </button>

        <!-- Set Contribution -->
        <button
          @click.stop="openContributionModal(row)"
          class="flex flex-1 gap-1 justify-center items-center px-2 py-1.5 text-xs font-medium text-success bg-success-soft rounded-md border border-success/20 transition-all duration-200 hover:bg-success-soft"
          title="Set Benefit Contributions"
        >
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Contrib</span>
        </button>

        <!-- Delete Policy -->
        <button
          @click.stop="openDeleteModal(row)"
          class="flex flex-1 gap-1 justify-center items-center px-2 py-1.5 text-xs font-medium text-error bg-error-soft rounded-md border border-error/20 transition-all duration-200 hover:bg-error-soft"
        >
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span>Delete</span>
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
