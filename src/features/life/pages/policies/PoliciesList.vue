<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import Button from "@/components/Button.vue";
import TabGroup from "@/components/TabGroup.vue";
import ListTable from "@/components/ListTable.vue";
import TextField from "@/components/fields/TextField.vue";
import PageHeader from "@/components/PageHeader.vue";
import StatusBadge from "@/components/StatusBadge.vue";
import PageNav from "@/components/PageNav.vue";
import { useLifePagedList } from "../../composables/useLifePagedList";
import { PolicyStatus } from "../../constants/statuses";
import { daysUntil, formatDate, remainingLabel } from "../../constants/labels";
import { getPolicies } from "../../api/policyApi";

const router = useRouter();
const TABS = { Active: PolicyStatus.ACTIVE, Pending: PolicyStatus.PENDING, Modified: PolicyStatus.MODIFIED, Lapsed: PolicyStatus.LAPSED, Cancelled: PolicyStatus.CANCELLED, Disabled: PolicyStatus.DISABLED };
const list = useLifePagedList(getPolicies, { status: PolicyStatus.ACTIVE });
list.reload();
const tab = computed({ get: () => Object.keys(TABS).find((k) => TABS[k] === list.status.value), set: (t) => (list.status.value = TABS[t]) });

const COLUMNS = [
  { key: "policy", label: "Policy" },
  { key: "institutionName", label: "Institution" },
  { key: "term", label: "Term" },
  { key: "cover", label: "Cover" },
  { key: "remaining", label: "Remaining" },
  { key: "policyIssuedDate", label: "Issued" },
  { key: "status", label: "Status" },
];

const policyNo = (p) => p.institutionLifeInsuranceNumber || p.quotationNumber || "—";
const open = (p) => router.push(`/life/policies/${p.quotationUuid}`);
</script>

<template>
  <div class="p-4 md:p-6">
    <PageHeader title="Group policies" subtitle="Group term life policies issued from paid quotations.">
      <template #actions><Button variant="outline" @click="router.push('/life/quotations')">Quotations</Button></template>
    </PageHeader>

    <div class="flex flex-wrap gap-3 justify-between items-center mb-4">
      <TabGroup v-model="tab" :tabs="Object.keys(TABS)" />
      <div class="w-72"><TextField v-model="list.search.value" type="search" placeholder="Search policy or institution" aria-label="Search policies" /></div>
    </div>

    <ListTable
      :columns="COLUMNS"
      :rows="list.rows.value"
      row-key="quotationUuid"
      :loading="list.loading.value"
      :error="list.error.value"
      error-title="Couldn't load policies"
      :skeleton-rows="6"
      clickable
      @row-click="open"
      @retry="list.reload()"
    >
      <template #empty>
        <p class="text-sm font-semibold text-ink">{{ list.search.value ? "No policies match your search" : `No ${tab.toLowerCase()} policies` }}</p>
        <p v-if="!list.search.value && tab === 'Active'" class="mt-1 text-sm text-ink-muted">Policies appear here once a paid quotation is issued as a policy.</p>
      </template>
      <template #cell-policy="{ row }">
        <span class="font-medium whitespace-nowrap text-ink">{{ policyNo(row) }}</span>
        <span v-if="row.institutionLifeInsuranceNumber && row.quotationNumber" class="block text-xs whitespace-nowrap text-ink-subtle">{{ row.quotationNumber }}</span>
      </template>
      <template #cell-institutionName="{ row }"><span class="text-ink">{{ row.institutionName || "—" }}</span></template>
      <template #cell-term="{ row }"><span class="whitespace-nowrap text-ink-muted">{{ row.term ? `${row.term} yr${row.term === 1 ? "" : "s"}` : "—" }}</span></template>
      <template #cell-cover="{ row }"><span class="whitespace-nowrap text-ink-muted">{{ row.beginDate ? `${formatDate(row.beginDate)} – ${formatDate(row.endDate)}` : "—" }}</span></template>
      <template #cell-remaining="{ row }"><span class="whitespace-nowrap text-ink-muted">{{ remainingLabel(daysUntil(row.endDate)) }}</span></template>
      <template #cell-policyIssuedDate="{ row }"><span class="whitespace-nowrap text-ink-muted">{{ formatDate(row.policyIssuedDate) }}</span></template>
      <template #cell-status="{ row }"><StatusBadge :status="row.policyStatus" /></template>
      <template #footer><PageNav v-model:page="list.page.value" :total-pages="list.totalPages.value" :disabled="list.loading.value" /></template>
    </ListTable>
  </div>
</template>
