<script setup>
// Open cover applications: a customer's request for an agreement, before any rates or limits exist.
// The approved agreement lives on /marine/open-covers; this list is the queue ahead of it.
import { useRouter } from "vue-router";
import Button from "@/components/Button.vue";
import MarinePageHeader from "../../components/MarinePageHeader.vue";
import FilterBar from "../../components/FilterBar.vue";
import ListTable from "../../components/ListTable.vue";
import StatusBadge from "../../components/StatusBadge.vue";
import { useListQuery } from "../../composables/useListQuery";
import { useCan } from "../../composables/useCan";
import { listOpenCoverApplications } from "../../api/marineApi";
import { formatMoney } from "../../utils/money";
import { formatDate } from "../../utils/format";

const router = useRouter();
const { roles } = useCan();
const canCreate = () => roles.value.some((r) => ["BROKER", "UNDERWRITER", "SENIOR_UNDERWRITER"].includes(r));
const list = useListQuery(listOpenCoverApplications, { filters: { q: "", status: [] }, sort: "createdAt,desc" });
const columns = [
  { key: "applicantName", label: "Applicant", sortable: true },
  { key: "insuredName", label: "Insured" },
  { key: "brokerName", label: "Broker" },
  { key: "goodsProfile", label: "Goods" },
  { key: "period", label: "Proposed period" },
  { key: "estimatedAnnualValue", label: "Est. annual value", align: "right" },
  { key: "maxShipmentValue", label: "Max per shipment", align: "right" },
  { key: "createdAt", label: "Received", sortable: true },
  { key: "status", label: "Status", sortable: true },
];
</script>

<template>
  <div class="marine-page">
    <MarinePageHeader
      title="Open cover applications"
      subtitle="Requests for an open cover agreement. An established application becomes an agreement with agreed rates and limits."
      :crumbs="[{ label: 'Marine' }, { label: 'Open cover' }, { label: 'Applications' }]"
    >
      <template #actions>
        <Button v-if="canCreate()" @click="router.push('/marine/open-cover-applications/new')">New application</Button>
      </template>
    </MarinePageHeader>
    <FilterBar
      :fields="[
        { type: 'search', key: 'q', label: 'Search applicant or insured' },
        { type: 'multi', key: 'status', label: 'Status', options: [
          { value: 'DRAFT', label: 'Draft' },
          { value: 'SUBMITTED', label: 'Submitted' },
          { value: 'ESTABLISHED', label: 'Established' },
          { value: 'DECLINED', label: 'Declined' },
        ] },
      ]"
      :list="list"
    />
    <ListTable
      :columns="columns"
      :list="list"
      :row-link="(row) => `/marine/open-cover-applications/${row.id}`"
      empty-title="No applications yet"
      filtered-empty-title="No applications match these filters"
    >
      <template #cell-insuredName="{ row }">{{ row.insuredName ?? "—" }}</template>
      <template #cell-brokerName="{ row }">{{ row.brokerName ?? "—" }}</template>
      <template #cell-goodsProfile="{ row }"><span class="line-clamp-1">{{ row.goodsProfile ?? "—" }}</span></template>
      <template #cell-period="{ row }">
        <span class="whitespace-nowrap">{{ formatDate(row.periodFrom) }} – {{ formatDate(row.periodTo) }}</span>
      </template>
      <template #cell-estimatedAnnualValue="{ row }">{{ formatMoney(row.estimatedAnnualValue, row.currency) }}</template>
      <template #cell-maxShipmentValue="{ row }">{{ formatMoney(row.maxShipmentValue, row.currency) }}</template>
      <template #cell-createdAt="{ row }">{{ formatDate(row.createdAt) }}</template>
      <template #cell-status="{ row }"><StatusBadge entity="openCoverApplication" :status="row.status" /></template>
    </ListTable>
  </div>
</template>
