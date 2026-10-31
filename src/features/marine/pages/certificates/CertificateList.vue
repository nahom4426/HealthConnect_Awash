<script setup>
// Certificate list (plan 5.5).
import { computed } from "vue";
import { useRoute } from "vue-router";
import MarinePageHeader from "../../components/MarinePageHeader.vue";
import FilterBar from "../../components/FilterBar.vue";
import ListTable from "../../components/ListTable.vue";
import StatusBadge from "../../components/StatusBadge.vue";
import { useListQuery } from "../../composables/useListQuery";
import { listCertificates } from "../../api/marineApi";
import { CERTIFICATE_STATUSES } from "../../constants";
import { formatMoney } from "../../utils/money";
import { formatDateTime } from "../../utils/format";
import { statusLabel } from "../../i18n";

const route = useRoute();
const declarations = computed(() => route.meta.declaration === true);
const list = useListQuery(
  (params) => listCertificates({ ...params, declaration: declarations.value }),
  { filters: { q: "", status: [], vesselImo: "", issuedFrom: "", issuedTo: "" }, sort: "createdAt,desc" }
);
const columns = [
  { key: "certNo", label: "Certificate no", sortable: true },
  { key: "version", label: "Version" },
  { key: "policyNo", label: "Policy no" },
  { key: "insured", label: "Insured" },
  { key: "vessel", label: "Vessel" },
  { key: "voyage", label: "Voyage" },
  { key: "sumInsured", label: "Sum insured", align: "right" },
  { key: "status", label: "Status" },
  { key: "issuedAt", label: "Issued at", sortable: true },
];
</script>

<template>
  <div class="marine-page">
    <MarinePageHeader
      :title="declarations ? 'Declaration certificates' : 'Certificates'"
      :crumbs="[{ label: 'Marine' }, { label: declarations ? 'Open cover' : 'Single shipments' }, { label: declarations ? 'Declaration certificates' : 'Certificates' }]"
    />
    <FilterBar
      :fields="[
        { type: 'search', key: 'q', label: 'Search certificate or BL no' },
        { type: 'multi', key: 'status', label: 'Status', options: CERTIFICATE_STATUSES.map((s) => ({ value: s, label: statusLabel(s) })) },
        { type: 'search', key: 'vesselImo', label: 'Vessel IMO' },
        { type: 'dateRange', from: 'issuedFrom', to: 'issuedTo', label: 'Issued' },
      ]"
      :list="list"
    />
    <ListTable :columns="columns" :list="list" :row-link="(r) => `/marine/certificates/${r.id}`" empty-title="No certificates yet" filtered-empty-title="No certificates match these filters">
      <template #cell-version="{ row }">v{{ row.version }}</template>
      <template #cell-policyNo="{ row }">
        <RouterLink v-if="row.policy" :to="`/marine/policies/${row.policy.id}`" class="text-primary hover:underline" @click.stop>{{ row.policy.policyNo }}</RouterLink>
      </template>
      <template #cell-insured="{ row }">{{ row.insured?.name ?? "—" }}</template>
      <template #cell-vessel="{ row }">{{ row.vessel?.name ?? "By air" }}</template>
      <template #cell-voyage="{ row }"><span class="whitespace-nowrap">{{ row.loadingPort?.code }} → {{ row.dischargePort?.code }}</span></template>
      <template #cell-sumInsured="{ row }">{{ formatMoney(row.sumInsured, row.currency) }}</template>
      <template #cell-status="{ row }"><StatusBadge entity="certificate" :status="row.status" /></template>
      <template #cell-issuedAt="{ row }"><span class="whitespace-nowrap text-ink-muted">{{ row.issuedAt ? formatDateTime(row.issuedAt) : "Being generated" }}</span></template>
    </ListTable>
  </div>
</template>
