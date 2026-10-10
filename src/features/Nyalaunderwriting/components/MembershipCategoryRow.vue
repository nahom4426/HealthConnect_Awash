<script setup>
import { defineProps, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import icons from "@/utils/icons";
import { activeMembershipTab } from '../utils/membershipTabState';

const props = defineProps({
  rowData: { type: Array, default: () => [] },
  rowKeys: { type: Array, default: () => [] },
  headKeys: { type: Array, default: () => [] },
  institutionUuid: { type: String, default: '' },
  onView: { type: Function, default: () => {} },
  onEdit: { type: Function, default: () => {} },
  onDelete: { type: Function, default: () => {} },
  onRowClick: { type: Function, default: () => {} },
});

const router = useRouter();

onMounted(() => {
  window.addEventListener("click", closeAllDropdowns);
});

onUnmounted(() => {
  window.removeEventListener("click", closeAllDropdowns);
});

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

function formatDate(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function navigateToInsuredPersons(row) {
  const hasInstitution = activeMembershipTab.value === 'GENERAL' ? 'true' : 'false';

  const params = {
    payerInstitutionContractUuid: row?.payerInstitutionContractUuid || row?.contractUuid || ''
  };

  if (activeMembershipTab.value === 'GENERAL') {
    params.institutionUuid = row?.institutionUuid || props.institutionUuid || '';
  } else {
    params.institutionUuid = row?.insuredUuid || '';
  }

  // Pass renewedFromPayerInstitutionContractUuid in the query so the
  // Insured Persons page can show the "Import Existing Insureds" button.
  const query = {
    hasInstitution,
    pageContext: 'membership',
  };
  if (row?.renewedFromPayerInstitutionContractUuid) {
    query.renewedFromPayerInstitutionContractUuid = row.renewedFromPayerInstitutionContractUuid;
  }

  router.push({
    name: 'Insured Persons',
    params,
    query,
  });
}

function closeAllDropdowns() {
  document.querySelectorAll(".dropdown-menu").forEach(menu => {
    menu.classList.add("hidden");
  });
}
</script>

<template>
  <tr
    v-for="(row, idx) in rowData"
    :key="row.payerInstitutionContractUuid || row.contractUuid || idx"
    @click.self="props.onRowClick(row)"
    class="bg-white rounded-lg border-b transition-all duration-200 cursor-pointer hover:shadow-md hover:bg-primary/5"
  >
    <td class="p-4 text-sm font-semibold text-ink-subtle select-none">
      {{ idx + 1 }}
    </td>

    <td class="p-4 font-medium text-ink">
      {{ row.institutionName || row.insuredName || row.contractName }}
    </td>

    <td class="p-4 font-medium text-ink">
      {{ row.contractCode }}
    </td>

    <td class="p-4 font-medium text-ink">
      {{ row.contractName }}
    </td>

    <td class="p-4 text-ink-muted">
      {{ formatDate(row.beginDate) }} <span class="text-orange-500">→</span> {{ formatDate(row.endDate) }}
    </td>

    <td class="p-4">
      <span :class="getStatusStyle(row.status)">
        {{ row.status }}
      </span>
    </td>

    <td class="px-4 py-3">
      <div class="flex gap-1.5 items-center">
        <button
          @click.prevent="navigateToInsuredPersons(row)"
          class="relative p-2 text-success bg-success-soft rounded-lg transition-all duration-200 group hover:bg-success-soft hover:text-success-strong hover:scale-105 hover:shadow-md"
          title="Insured Persons"
        >
          <i v-html="icons.users || '👥'" class="w-4 h-4"></i>
          <span class="absolute -top-8 left-1/2 px-2 py-1 text-xs font-medium text-white whitespace-nowrap bg-ink rounded-md opacity-0 transition-opacity -translate-x-1/2 pointer-events-none group-hover:opacity-100">
            Insured Persons
          </span>
        </button>

        <button
          @click.prevent="$router.push(`/addInstitution/${row?.payerInstitutionContractUuid || row?.contractUuid}/${row?.institutionUuid || institutionUuid || row?.insuredUuid}`)"
          class="relative p-2 text-success bg-success-soft rounded-lg transition-all duration-200 group hover:bg-success-soft hover:text-success-strong hover:scale-105 hover:shadow-md"
          title="Add Providers"
        >
          <i v-html="icons.plus_circle || '➕'" class="w-4 h-4"></i>
          <span class="absolute -top-8 left-1/2 px-2 py-1 text-xs font-medium text-white whitespace-nowrap bg-ink rounded-md opacity-0 transition-opacity -translate-x-1/2 pointer-events-none group-hover:opacity-100">
            Add Providers
          </span>
        </button>
      </div>
    </td>
  </tr>
</template>

<style scoped>
.bg-success-soft { background-color: rgb(var(--success-soft)); color: rgb(var(--success-strong)); }
.bg-warning-soft { background-color: rgb(var(--warning-soft)); color: rgb(var(--warning-strong)); }
.bg-error-soft { background-color: rgb(var(--error-soft)); color: rgb(var(--error-strong)); }
.bg-surface-muted { background-color: rgb(var(--surface-muted)); color: rgb(var(--ink-muted)); }
</style>