<script setup>
// Customers (registration and KYC): every insured with its approval status. Approvers start from the
// Pending approval filter; registering opens the form.
import { useRouter } from "vue-router";
import Button from "@/components/Button.vue";
import MarinePageHeader from "../../components/MarinePageHeader.vue";
import FilterBar from "../../components/FilterBar.vue";
import ListTable from "../../components/ListTable.vue";
import StatusBadge from "../../components/StatusBadge.vue";
import { useListQuery } from "../../composables/useListQuery";
import { useCan } from "../../composables/useCan";
import { listCustomers } from "../../api/marineApi";
import { CUSTOMER_KINDS, CUSTOMER_STATUSES, label } from "../../constants";
import { formatAmount } from "../../utils/money";
import { formatDate } from "../../utils/format";
import { statusLabel } from "../../i18n";

const router = useRouter();
const { can } = useCan();
const list = useListQuery(listCustomers, { filters: { q: "", status: [], kind: "" }, sort: "name,asc" });
const columns = [
  { key: "name", label: "Customer", sortable: true, class: "min-w-[14rem]" },
  { key: "customerNo", label: "Customer no", sortable: true },
  { key: "kind", label: "Type" },
  { key: "identity", label: "TIN / ID" },
  { key: "phone", label: "Phone" },
  { key: "policies", label: "Active policies", align: "right" },
  { key: "outstanding", label: "Balance (ETB)", align: "right" },
  { key: "status", label: "Status", sortable: true },
  { key: "registeredAt", label: "Registered", sortable: true },
];
</script>

<template>
  <div class="marine-page">
    <MarinePageHeader title="Customers" subtitle="Registered importers, exporters and individuals. Only approved customers can be insured." :crumbs="[{ label: 'Marine' }, { label: 'Customers' }]">
      <template #actions>
        <Button v-if="can('customer.register')" @click="router.push('/marine/customers/new')">Register customer</Button>
      </template>
    </MarinePageHeader>
    <FilterBar
      :fields="[
        { type: 'search', key: 'q', label: 'Search name, customer no, TIN, licence or phone' },
        { type: 'multi', key: 'status', label: 'Status', options: CUSTOMER_STATUSES.map((s) => ({ value: s, label: statusLabel(s) })) },
        { type: 'select', key: 'kind', label: 'Type', options: CUSTOMER_KINDS },
      ]"
      :list="list"
    />
    <ListTable :columns="columns" :list="list" :row-link="(r) => `/marine/customers/${r.id}`" empty-title="No customers yet" filtered-empty-title="No customers match these filters">
      <template #cell-name="{ row }">
        <RouterLink :to="`/marine/customers/${row.id}`" class="font-semibold text-ink hover:text-primary" @click.stop>{{ row.name }}</RouterLink>
        <p v-if="row.contactPerson" class="text-xs text-ink-muted">{{ row.contactPerson }}</p>
      </template>
      <template #cell-customerNo="{ row }"><span class="whitespace-nowrap">{{ row.customerNo ?? "—" }}</span></template>
      <template #cell-kind="{ row }">{{ label(CUSTOMER_KINDS, row.kind) }}</template>
      <template #cell-identity="{ row }">
        <span class="whitespace-nowrap">{{ row.kind === "INDIVIDUAL" ? row.idNumber || "—" : row.tin ? `TIN ${row.tin}` : "—" }}</span>
      </template>
      <template #cell-phone="{ row }"><span class="whitespace-nowrap">{{ row.phone || "—" }}</span></template>
      <template #cell-policies="{ row }">{{ row.activePolicyCount }}</template>
      <template #cell-outstanding="{ row }">
        <span :class="Number(row.outstanding) > 0 ? 'font-semibold text-warning-strong' : 'text-ink-muted'">{{ formatAmount(row.outstanding) }}</span>
      </template>
      <template #cell-status="{ row }"><StatusBadge entity="customer" :status="row.status" /></template>
      <template #cell-registeredAt="{ row }"><span class="whitespace-nowrap text-ink-muted">{{ row.registeredAt ? formatDate(row.registeredAt) : "—" }}</span></template>
      <template #empty="{ filtered }">
        <Button v-if="!filtered && can('customer.register')" size="sm" @click="router.push('/marine/customers/new')">Register customer</Button>
      </template>
    </ListTable>
  </div>
</template>
