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
import { rateTableStage } from "../../utils/settingsView";

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
  { key: "stage", label: "Lifecycle" },
  { key: "createdBy", label: "Created by" },
];
</script>

<template>
  <div class="marine-page">
    <MarinePageHeader title="Tariff and rate tables" subtitle="Rating uses the active table only. A draft is not used. Activation retires the previous table the day before." :crumbs="[{ label: 'Marine' }, { label: 'Marine Settings' }, { label: 'Tariff and rate tables' }]">
      <template #actions>
        <Button :pending="creating" @click="newVersion">New version</Button>
      </template>
    </MarinePageHeader>
    <p role="status" class="p-4 mb-4 text-sm rounded-xl bg-warning-soft text-warning-strong">
      The stored statuses are draft, active, and retired. Validation runs before activation and blocks it while the table is incomplete. There is no approval status. Activating a draft makes rating use it. It does not record that the figures were approved. The seed activation switch stays off, and the seeded figures remain a placeholder.
    </p>
    <ListTable :columns="columns" :list="list" :row-link="(r) => `/marine/admin/rate-tables/${r.id}`" empty-title="No rate tables yet">
      <template #cell-product="{ row }">{{ productLabel(row.product) }}</template>
      <template #cell-effectiveFrom="{ row }">{{ formatDate(row.effectiveFrom) }}</template>
      <template #cell-effectiveTo="{ row }"><span :class="row.effectiveTo ? '' : 'text-ink-subtle'">{{ row.effectiveTo ? formatDate(row.effectiveTo) : "—" }}</span></template>
      <template #cell-status="{ row }"><StatusBadge entity="rateTable" :status="row.status" /></template>
      <template #cell-stage="{ row }"><span class="text-ink-muted">{{ rateTableStage(row.status) }}</span></template>
    </ListTable>
  </div>
</template>
