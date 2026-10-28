<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import Button from "@/components/Button.vue";
import TabGroup from "@/components/TabGroup.vue";
import { formatCurrency } from "@/utils/utils";
import LifePageHeader from "../../components/LifePageHeader.vue";
import LifeStatusBadge from "../../components/LifeStatusBadge.vue";
import LifePager from "../../components/LifePager.vue";
import { useLifePagedList } from "../../composables/useLifePagedList";
import { TreatyStatus } from "../../constants/statuses";
import { coverageLabel, formatDate, treatyTypeLabel } from "../../constants/labels";
import { getReinsuranceTreatys } from "../../api/reinsuranceApi";

const router = useRouter();
const TABS = { Active: TreatyStatus.ACTIVE, Pending: TreatyStatus.PENDING, Revised: TreatyStatus.REVISED };
const list = useLifePagedList(getReinsuranceTreatys, { status: TreatyStatus.ACTIVE });
list.reload();
const tab = computed({ get: () => Object.keys(TABS).find((k) => TABS[k] === list.status.value), set: (t) => (list.status.value = TABS[t]) });
const money = (v) => (v === null || v === undefined ? "—" : formatCurrency(v));
const open = (t) => router.push(`/life/reinsurance/treaties/${t.reinsuranceTreatyUuid}`);
</script>

<template>
  <div class="p-4 md:p-6">
    <LifePageHeader title="Reinsurance treaties" subtitle="How much of each life Standard keeps, which reinsurers take the rest, the free cover limits and the medical evidence they require.">
      <template #actions><Button @click="router.push('/life/reinsurance/treaties/new')">New treaty</Button></template>
    </LifePageHeader>

    <div class="flex flex-wrap gap-3 justify-between items-center mb-4">
      <TabGroup v-model="tab" :tabs="Object.keys(TABS)" />
      <input v-model="list.search.value" type="search" placeholder="Search treaties" aria-label="Search treaties" class="px-3 w-64 h-9 text-sm rounded-lg border outline-none bg-surface border-line text-ink focus:border-primary focus:ring-2 focus:ring-primary/15" />
    </div>

    <section class="overflow-hidden rounded-2xl border bg-surface border-line shadow-card">
      <div v-if="list.error.value && !list.loading.value" class="flex flex-col gap-3 items-center px-6 py-12 text-center">
        <p class="text-sm font-semibold text-ink">Couldn't load treaties</p>
        <p class="max-w-md text-sm text-ink-muted">{{ list.error.value }}</p>
        <Button variant="outline" size="sm" @click="list.reload()">Try again</Button>
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-surface-muted">
            <tr class="text-xs font-semibold tracking-wide text-left uppercase text-ink-subtle">
              <th class="px-4 py-3">Treaty</th>
              <th class="px-4 py-3">Type</th>
              <th class="px-4 py-3 text-right">Retention / life</th>
              <th class="px-4 py-3 text-right">Cession</th>
              <th class="px-4 py-3">Period</th>
              <th class="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            <template v-if="list.loading.value">
              <tr v-for="i in 5" :key="i" class="border-t border-line"><td v-for="j in 6" :key="j" class="px-4 py-3.5"><div class="h-4 rounded animate-pulse bg-surface-raised"></div></td></tr>
            </template>
            <tr v-else-if="!list.rows.value.length">
              <td colspan="6" class="px-6 py-14 text-center">
                <p class="text-sm font-semibold text-ink">{{ list.search.value ? "No treaties match your search" : `No ${tab.toLowerCase()} treaties` }}</p>
                <p v-if="!list.search.value && tab === 'Active'" class="mt-1 text-sm text-ink-muted">Create a treaty, check it, then activate it.</p>
              </td>
            </tr>
            <tr v-for="t in list.rows.value" v-else :key="t.reinsuranceTreatyUuid" tabindex="0" class="border-t cursor-pointer border-line hover:bg-surface-muted/60 focus:outline-none focus:bg-surface-muted" @click="open(t)" @keydown.enter="open(t)">
              <td class="px-4 py-3">
                <p class="font-semibold text-ink">{{ t.treatyCode }}</p>
                <p v-if="t.treatyDescription" class="mt-0.5 max-w-md text-xs truncate text-ink-muted">{{ t.treatyDescription }}</p>
              </td>
              <td class="px-4 py-3 text-ink">{{ treatyTypeLabel[t.treatyType] || t.treatyType }}<p class="text-xs text-ink-muted">{{ coverageLabel[t.reinsuranceCoverage] || t.reinsuranceCoverage }}</p></td>
              <td class="px-4 py-3 text-right whitespace-nowrap tabular-nums text-ink">{{ money(t.retationLimit) }}</td>
              <td class="px-4 py-3 text-right tabular-nums text-ink">{{ t.policyCession ?? "—" }} %</td>
              <td class="px-4 py-3 whitespace-nowrap text-ink-muted">{{ formatDate(t.beginDate) }} – {{ formatDate(t.endDate) }}</td>
              <td class="px-4 py-3"><LifeStatusBadge :status="t.status" /></td>
            </tr>
          </tbody>
        </table>
      </div>
      <LifePager v-model:page="list.page.value" :total-pages="list.totalPages.value" :disabled="list.loading.value" />
    </section>
  </div>
</template>
