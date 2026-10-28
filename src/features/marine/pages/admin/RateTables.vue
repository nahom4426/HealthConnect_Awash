<script setup>
// Rate table versions (plan 5.6). New version copies the active table into a draft.
import { ref } from "vue";
import { useRouter } from "vue-router";
import Button from "@/components/Button.vue";
import { toasted } from "@/utils/utils";
import MarinePageHeader from "../../components/MarinePageHeader.vue";
import ListTable from "../../components/ListTable.vue";
import StatusBadge from "../../components/StatusBadge.vue";
import { useListQuery } from "../../composables/useListQuery";
import { createRateTable, listRateTables } from "../../api/marineApi";
import { notifyError } from "../../api/marineClient";
import { productLabel } from "../../constants";
import { formatDate } from "../../utils/format";

const router = useRouter();
const list = useListQuery(listRateTables, { filters: {}, sort: "createdAt,desc" });
const creating = ref(false);

async function newVersion() {
  creating.value = true;
  const active = list.rows.value.find((t) => t.status === "ACTIVE");
  const res = await createRateTable({ copyFrom: active?.id, product: active?.product ?? "SINGLE_SHIPMENT" });
  creating.value = false;
  if (!res.ok) return notifyError(res.error);
  toasted(true, `Draft ${res.data.name} created from ${active?.name ?? "the active table"}`);
  router.push(`/marine/admin/rate-tables/${res.data.id}`);
}

const columns = [
  { key: "name", label: "Version", sortable: true },
  { key: "product", label: "Product" },
  { key: "effectiveFrom", label: "Effective from", sortable: true },
  { key: "effectiveTo", label: "Effective to" },
  { key: "status", label: "Status" },
  { key: "createdBy", label: "Created by" },
];
</script>

<template>
  <div class="p-4 md:p-6">
    <MarinePageHeader title="Rate tables" subtitle="Every premium is computed from the active version. Edit a draft, then activate it from a date; the current version retires the day before." :crumbs="[{ label: 'Marine' }, { label: 'Admin' }, { label: 'Rate tables' }]">
      <template #actions>
        <Button :pending="creating" @click="newVersion">New version</Button>
      </template>
    </MarinePageHeader>
    <ListTable :columns="columns" :list="list" :row-link="(r) => `/marine/admin/rate-tables/${r.id}`" empty-title="No rate tables yet">
      <template #cell-product="{ row }">{{ productLabel(row.product) }}</template>
      <template #cell-effectiveFrom="{ row }">{{ formatDate(row.effectiveFrom) }}</template>
      <template #cell-effectiveTo="{ row }"><span :class="row.effectiveTo ? '' : 'text-ink-subtle'">{{ row.effectiveTo ? formatDate(row.effectiveTo) : "—" }}</span></template>
      <template #cell-status="{ row }"><StatusBadge entity="rateTable" :status="row.status" /></template>
    </ListTable>
  </div>
</template>
