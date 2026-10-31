<script setup>
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { openModal } from "@customizer/modal-x";
import Button from "@/components/Button.vue";
import TabGroup from "@/components/TabGroup.vue";
import ListTable from "@/components/ListTable.vue";
import TextField from "@/components/fields/TextField.vue";
import { formatCurrency } from "@/utils/utils";
import PageHeader from "@/components/PageHeader.vue";
import StatusBadge from "@/components/StatusBadge.vue";
import { useLifeResource } from "../../composables/useLifeResource";
import { getModifiedRiders, getPendingRiders, getRiders } from "../../api/productApi";

const router = useRouter();
const COLUMNS = [
  { key: "rider", label: "Rider" },
  { key: "range", label: "Sum assured range", align: "right", class: "whitespace-nowrap" },
  { key: "rates", label: "Rate rows", align: "right", class: "whitespace-nowrap" },
  { key: "status", label: "Status" },
  { key: "open", label: "Open", align: "right", srOnly: true },
];
// The backend keeps riders in versions: pending (draft), active (in use), modified (superseded)
const TABS = { Active: getRiders, Pending: getPendingRiders, Modified: getModifiedRiders };
const tab = ref("Active");
const search = ref("");

const { data: riders, loading, error, load } = useLifeResource((t) => TABS[t](), { initial: [], map: (d) => (Array.isArray(d) ? d : []) });
watch(tab, (t) => load(t), { immediate: true });

const visible = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return riders.value;
  return riders.value.filter((r) => `${r.riderName} ${r.riderDescription}`.toLowerCase().includes(q));
});

function newRider() {
  openModal("LifeRiderForm", {}, (saved) => {
    if (saved?.riderUuid) router.push(`/life/products/riders/${saved.riderUuid}`);
  });
}

const open = (r) => router.push(`/life/products/riders/${r.riderUuid}`);
const money = (v) => (v === null || v === undefined ? "—" : formatCurrency(v));
</script>

<template>
  <div class="p-4 md:p-6">
    <PageHeader title="Riders" subtitle="Additional covers sold with term life — accidental death, disability and others — each with its own individual and group rate tables.">
      <template #actions>
        <Button @click="newRider">New rider</Button>
      </template>
    </PageHeader>

    <div class="flex flex-wrap gap-3 justify-between items-center mb-4">
      <TabGroup v-model="tab" :tabs="Object.keys(TABS)" />
      <div class="w-64"><TextField v-model="search" type="search" placeholder="Search riders" aria-label="Search riders" /></div>
    </div>

    <ListTable
      :columns="COLUMNS"
      :rows="visible"
      row-key="riderUuid"
      :loading="loading"
      :error="error"
      error-title="Couldn't load riders"
      :empty-title="search ? 'No riders match your search' : `No ${tab.toLowerCase()} riders`"
      :empty-hint="!search && tab === 'Active' ? 'Create a rider, add its rates, then activate it.' : ''"
      clickable
      @row-click="open"
      @retry="load(tab)"
    >
      <template #cell-rider="{ row }">
        <p class="font-semibold text-ink">{{ row.riderName }}</p>
        <p v-if="row.riderDescription" class="mt-0.5 max-w-lg text-xs truncate text-ink-muted">{{ row.riderDescription }}</p>
      </template>
      <template #cell-range="{ row }"><span class="tabular-nums text-ink">{{ money(row.minLimit) }} – {{ money(row.maxLimit) }}</span></template>
      <template #cell-rates="{ row }">
        <span class="tabular-nums text-ink-muted">{{ row.individualRiders?.length ?? 0 }} individual · {{ row.groupRiders?.length ?? 0 }} group</span>
      </template>
      <template #cell-status="{ row }"><StatusBadge :status="row.status" /></template>
      <template #cell-open="{ row }">
        <RouterLink :to="`/life/products/riders/${row.riderUuid}`" class="text-sm font-semibold text-primary hover:underline" @click.stop>Open</RouterLink>
      </template>
    </ListTable>
  </div>
</template>
