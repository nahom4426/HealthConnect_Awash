<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import Button from "@/components/Button.vue";
import TabGroup from "@/components/TabGroup.vue";
import ListTable from "@/components/ListTable.vue";
import TextField from "@/components/fields/TextField.vue";
import { formatCurrency } from "@/utils/utils";
import PageHeader from "@/components/PageHeader.vue";
import StatusBadge from "@/components/StatusBadge.vue";
import PageNav from "@/components/PageNav.vue";
import { useLifePagedList } from "../../composables/useLifePagedList";
import { TreatyStatus } from "../../constants/statuses";
import { coverageLabel, formatDate, treatyTypeLabel } from "../../constants/labels";
import { getReinsuranceTreatys } from "../../api/reinsuranceApi";

const router = useRouter();
const COLUMNS = [
  { key: "treaty", label: "Treaty" },
  { key: "type", label: "Type" },
  { key: "retention", label: "Retention / life", align: "right", class: "whitespace-nowrap" },
  { key: "cession", label: "Cession", align: "right" },
  { key: "period", label: "Period", class: "whitespace-nowrap" },
  { key: "status", label: "Status" },
];
const TABS = { Active: TreatyStatus.ACTIVE, Pending: TreatyStatus.PENDING, Revised: TreatyStatus.REVISED };
const list = useLifePagedList(getReinsuranceTreatys, { status: TreatyStatus.ACTIVE });
list.reload();
const tab = computed({ get: () => Object.keys(TABS).find((k) => TABS[k] === list.status.value), set: (t) => (list.status.value = TABS[t]) });
const money = (v) => (v === null || v === undefined ? "—" : formatCurrency(v));
const open = (t) => router.push(`/life/reinsurance/treaties/${t.reinsuranceTreatyUuid}`);
</script>

<template>
  <div class="p-4 md:p-6">
    <PageHeader title="Reinsurance treaties" subtitle="How much of each life Standard keeps, which reinsurers take the rest, the free cover limits and the medical evidence they require.">
      <template #actions><Button @click="router.push('/life/reinsurance/treaties/new')">New treaty</Button></template>
    </PageHeader>

    <div class="flex flex-wrap gap-3 justify-between items-center mb-4">
      <TabGroup v-model="tab" :tabs="Object.keys(TABS)" />
      <div class="w-64"><TextField v-model="list.search.value" type="search" placeholder="Search treaties" aria-label="Search treaties" /></div>
    </div>

    <ListTable
      :columns="COLUMNS"
      :rows="list.rows.value"
      row-key="reinsuranceTreatyUuid"
      :loading="list.loading.value"
      :error="list.error.value"
      error-title="Couldn't load treaties"
      :empty-title="list.search.value ? 'No treaties match your search' : `No ${tab.toLowerCase()} treaties`"
      :empty-hint="!list.search.value && tab === 'Active' ? 'Create a treaty, check it, then activate it.' : ''"
      clickable
      @row-click="open"
      @retry="list.reload()"
    >
      <template #cell-treaty="{ row }">
        <p class="font-semibold text-ink">{{ row.treatyCode }}</p>
        <p v-if="row.treatyDescription" class="mt-0.5 max-w-md text-xs truncate text-ink-muted">{{ row.treatyDescription }}</p>
      </template>
      <template #cell-type="{ row }">
        <span class="text-ink">{{ treatyTypeLabel[row.treatyType] || row.treatyType }}</span>
        <p class="text-xs text-ink-muted">{{ coverageLabel[row.reinsuranceCoverage] || row.reinsuranceCoverage }}</p>
      </template>
      <template #cell-retention="{ row }"><span class="tabular-nums text-ink">{{ money(row.retationLimit) }}</span></template>
      <template #cell-cession="{ row }"><span class="tabular-nums text-ink">{{ row.policyCession ?? "—" }} %</span></template>
      <template #cell-period="{ row }"><span class="text-ink-muted">{{ formatDate(row.beginDate) }} – {{ formatDate(row.endDate) }}</span></template>
      <template #cell-status="{ row }"><StatusBadge :status="row.status" /></template>
      <template #footer><PageNav v-model:page="list.page.value" :total-pages="list.totalPages.value" :disabled="list.loading.value" /></template>
    </ListTable>
  </div>
</template>
