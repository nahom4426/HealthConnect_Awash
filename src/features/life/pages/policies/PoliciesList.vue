<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import Button from "@/components/Button.vue";
import TabGroup from "@/components/TabGroup.vue";
import LifePageHeader from "../../components/LifePageHeader.vue";
import LifeStatusBadge from "../../components/LifeStatusBadge.vue";
import LifePager from "../../components/LifePager.vue";
import { useLifePagedList } from "../../composables/useLifePagedList";
import { PolicyStatus } from "../../constants/statuses";
import { daysUntil, formatDate, remainingLabel } from "../../constants/labels";
import { getPolicies } from "../../api/policyApi";

const router = useRouter();
const TABS = { Active: PolicyStatus.ACTIVE, Pending: PolicyStatus.PENDING, Modified: PolicyStatus.MODIFIED, Lapsed: PolicyStatus.LAPSED, Cancelled: PolicyStatus.CANCELLED, Disabled: PolicyStatus.DISABLED };
const list = useLifePagedList(getPolicies, { status: PolicyStatus.ACTIVE });
list.reload();
const tab = computed({ get: () => Object.keys(TABS).find((k) => TABS[k] === list.status.value), set: (t) => (list.status.value = TABS[t]) });

const policyNo = (p) => p.institutionLifeInsuranceNumber || p.quotationNumber || "—";
const open = (p) => router.push(`/life/policies/${p.quotationUuid}`);
</script>

<template>
  <div class="p-4 md:p-6">
    <LifePageHeader title="Group policies" subtitle="Group term life policies issued from paid quotations.">
      <template #actions><Button variant="outline" @click="router.push('/life/quotations')">Quotations</Button></template>
    </LifePageHeader>

    <div class="flex flex-wrap gap-3 justify-between items-center mb-4">
      <TabGroup v-model="tab" :tabs="Object.keys(TABS)" />
      <input v-model="list.search.value" type="search" placeholder="Search policy or institution" aria-label="Search policies" class="px-3 w-72 h-9 text-sm rounded-lg border outline-none bg-surface border-line text-ink focus:border-primary focus:ring-2 focus:ring-primary/15" />
    </div>

    <section class="overflow-hidden rounded-2xl border bg-surface border-line shadow-card">
      <div v-if="list.error.value && !list.loading.value" class="flex flex-col gap-3 items-center px-6 py-12 text-center">
        <p class="text-sm font-semibold text-ink">Couldn't load policies</p>
        <p class="max-w-md text-sm text-ink-muted">{{ list.error.value }}</p>
        <Button variant="outline" size="sm" @click="list.reload()">Try again</Button>
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-surface-muted">
            <tr class="text-xs font-semibold tracking-wide text-left uppercase text-ink-subtle">
              <th class="px-4 py-3">Policy</th>
              <th class="px-4 py-3">Institution</th>
              <th class="px-4 py-3">Term</th>
              <th class="px-4 py-3">Cover</th>
              <th class="px-4 py-3">Remaining</th>
              <th class="px-4 py-3">Issued</th>
              <th class="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            <template v-if="list.loading.value">
              <tr v-for="i in 6" :key="i" class="border-t border-line"><td v-for="j in 7" :key="j" class="px-4 py-3.5"><div class="h-4 rounded animate-pulse bg-surface-raised"></div></td></tr>
            </template>
            <tr v-else-if="!list.rows.value.length">
              <td colspan="7" class="px-6 py-14 text-center">
                <p class="text-sm font-semibold text-ink">{{ list.search.value ? "No policies match your search" : `No ${tab.toLowerCase()} policies` }}</p>
                <p v-if="!list.search.value && tab === 'Active'" class="mt-1 text-sm text-ink-muted">Policies appear here once a paid quotation is issued as a policy.</p>
              </td>
            </tr>
            <tr v-for="p in list.rows.value" v-else :key="p.quotationUuid" tabindex="0" class="border-t cursor-pointer border-line hover:bg-surface-muted/60 focus:outline-none focus:bg-surface-muted" @click="open(p)" @keydown.enter="open(p)">
              <td class="px-4 py-3 font-medium whitespace-nowrap text-ink">
                {{ policyNo(p) }}
                <span v-if="p.institutionLifeInsuranceNumber && p.quotationNumber" class="block text-xs font-normal text-ink-subtle">{{ p.quotationNumber }}</span>
              </td>
              <td class="px-4 py-3 text-ink">{{ p.institutionName || "—" }}</td>
              <td class="px-4 py-3 whitespace-nowrap text-ink-muted">{{ p.term ? `${p.term} yr${p.term === 1 ? "" : "s"}` : "—" }}</td>
              <td class="px-4 py-3 whitespace-nowrap text-ink-muted">{{ p.beginDate ? `${formatDate(p.beginDate)} – ${formatDate(p.endDate)}` : "—" }}</td>
              <td class="px-4 py-3 whitespace-nowrap text-ink-muted">{{ remainingLabel(daysUntil(p.endDate)) }}</td>
              <td class="px-4 py-3 whitespace-nowrap text-ink-muted">{{ formatDate(p.policyIssuedDate) }}</td>
              <td class="px-4 py-3"><LifeStatusBadge :status="p.policyStatus" /></td>
            </tr>
          </tbody>
        </table>
      </div>
      <LifePager v-model:page="list.page.value" :total-pages="list.totalPages.value" :disabled="list.loading.value" />
    </section>
  </div>
</template>
