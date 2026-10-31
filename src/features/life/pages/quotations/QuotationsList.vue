<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { openModal } from "@customizer/modal-x";
import Button from "@/components/Button.vue";
import TabGroup from "@/components/TabGroup.vue";
import ListTable from "@/components/ListTable.vue";
import TextField from "@/components/fields/TextField.vue";
import PageHeader from "@/components/PageHeader.vue";
import StatusBadge from "@/components/StatusBadge.vue";
import PageNav from "@/components/PageNav.vue";
import { useLifePagedList } from "../../composables/useLifePagedList";
import { QuotationStatus } from "../../constants/statuses";
import { lifeCan } from "@/features/life/privileges";
import { formatDate } from "../../constants/labels";
import { getQuotations } from "../../api/quotationApi";

const router = useRouter();
const TABS = { Draft: QuotationStatus.PENDING, Issued: QuotationStatus.ISSUED, Accepted: QuotationStatus.ACCEPTED, Paid: QuotationStatus.PAID };
const HINTS = {
  Draft: "Being prepared: add members and riders, then issue it to the client.",
  Issued: "Sent to the client and waiting for their acceptance.",
  Accepted: "Accepted by the client and waiting for payment.",
  Paid: "Premium received. Issue the policy from the quotation.",
};
const list = useLifePagedList(getQuotations, { status: QuotationStatus.PENDING });
list.reload();
const tab = computed({ get: () => Object.keys(TABS).find((k) => TABS[k] === list.status.value), set: (t) => (list.status.value = TABS[t]) });

// The date that matters for the tab: when it was created, issued, accepted or paid
const stageDate = (q) => ({ PENDING: q.createdAt ?? q.audit?.createdAt, ISSUED: q.issueDate, ACCEPTED: q.acceptedDate, PAID: q.paidDate })[q.quotationStatus];
const stageDateLabel = computed(() => ({ Draft: "Created", Issued: "Issued", Accepted: "Accepted", Paid: "Paid" })[tab.value]);
const columns = computed(() => [
  { key: "quotationNumber", label: "Quotation" },
  { key: "institutionName", label: "Institution" },
  { key: "term", label: "Term" },
  { key: "contact", label: "Contact" },
  { key: "quotedByFullName", label: "Prepared by" },
  { key: "stageDate", label: stageDateLabel.value },
  { key: "status", label: "Status" },
]);

const open = (q) => router.push(`/life/quotations/${q.quotationUuid}`);
const create = () => openModal("LifeQuotationForm", {}, (saved) => saved?.quotationUuid && open(saved));
</script>

<template>
  <div class="p-4 md:p-6">
    <PageHeader title="Group quotations" subtitle="Group term life quotes for institutions, from draft to paid.">
      <template v-if="lifeCan('Life_Quotation_Create')" #actions><Button @click="create">New quotation</Button></template>
    </PageHeader>

    <div class="flex flex-wrap gap-3 justify-between items-center mb-2">
      <TabGroup v-model="tab" :tabs="Object.keys(TABS)" />
      <div class="w-72"><TextField v-model="list.search.value" type="search" placeholder="Search number or institution" aria-label="Search quotations" /></div>
    </div>
    <p class="mb-4 text-xs text-ink-subtle">{{ HINTS[tab] }}</p>

    <ListTable
      :columns="columns"
      :rows="list.rows.value"
      row-key="quotationUuid"
      :loading="list.loading.value"
      :error="list.error.value"
      error-title="Couldn't load quotations"
      :skeleton-rows="6"
      clickable
      @row-click="open"
      @retry="list.reload()"
    >
      <template #empty>
        <p class="text-sm font-semibold text-ink">{{ list.search.value ? "No quotations match your search" : `No ${tab.toLowerCase()} quotations` }}</p>
        <p v-if="!list.search.value && tab === 'Draft'" class="mt-1 text-sm text-ink-muted">Start one for an institution with “New quotation”.</p>
      </template>
      <template #cell-quotationNumber="{ row }"><span class="font-medium whitespace-nowrap text-ink">{{ row.quotationNumber || "Draft" }}</span></template>
      <template #cell-institutionName="{ row }"><span class="text-ink">{{ row.institutionName || "—" }}</span></template>
      <template #cell-term="{ row }"><span class="whitespace-nowrap text-ink-muted">{{ row.term ? `${row.term} yr${row.term === 1 ? "" : "s"}` : "—" }}</span></template>
      <template #cell-contact="{ row }">
        <span class="text-ink-muted">{{ row.contactPersonFullName || "—" }}</span>
        <span v-if="row.contactPhone" class="block text-xs text-ink-subtle">{{ row.contactPhone }}</span>
      </template>
      <template #cell-quotedByFullName="{ row }"><span class="text-ink-muted">{{ row.quotedByFullName || "—" }}</span></template>
      <template #cell-stageDate="{ row }"><span class="whitespace-nowrap text-ink-muted">{{ formatDate(stageDate(row)) }}</span></template>
      <template #cell-status="{ row }"><StatusBadge :status="row.quotationStatus" /></template>
      <template #footer><PageNav v-model:page="list.page.value" :total-pages="list.totalPages.value" :disabled="list.loading.value" /></template>
    </ListTable>
  </div>
</template>
