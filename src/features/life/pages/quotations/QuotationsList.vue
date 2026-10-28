<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { openModal } from "@customizer/modal-x";
import Button from "@/components/Button.vue";
import TabGroup from "@/components/TabGroup.vue";
import LifePageHeader from "../../components/LifePageHeader.vue";
import LifeStatusBadge from "../../components/LifeStatusBadge.vue";
import LifePager from "../../components/LifePager.vue";
import { useLifePagedList } from "../../composables/useLifePagedList";
import { QuotationStatus } from "../../constants/statuses";
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

const open = (q) => router.push(`/life/quotations/${q.quotationUuid}`);
const create = () => openModal("LifeQuotationForm", {}, (saved) => saved?.quotationUuid && open(saved));
</script>

<template>
  <div class="p-4 md:p-6">
    <LifePageHeader title="Group quotations" subtitle="Group term life quotes for institutions, from draft to paid.">
      <template #actions><Button @click="create">New quotation</Button></template>
    </LifePageHeader>

    <div class="flex flex-wrap gap-3 justify-between items-center mb-2">
      <TabGroup v-model="tab" :tabs="Object.keys(TABS)" />
      <input v-model="list.search.value" type="search" placeholder="Search number or institution" aria-label="Search quotations" class="px-3 w-72 h-9 text-sm rounded-lg border outline-none bg-surface border-line text-ink focus:border-primary focus:ring-2 focus:ring-primary/15" />
    </div>
    <p class="mb-4 text-xs text-ink-subtle">{{ HINTS[tab] }}</p>

    <section class="overflow-hidden rounded-2xl border bg-surface border-line shadow-card">
      <div v-if="list.error.value && !list.loading.value" class="flex flex-col gap-3 items-center px-6 py-12 text-center">
        <p class="text-sm font-semibold text-ink">Couldn't load quotations</p>
        <p class="max-w-md text-sm text-ink-muted">{{ list.error.value }}</p>
        <Button variant="outline" size="sm" @click="list.reload()">Try again</Button>
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-surface-muted">
            <tr class="text-xs font-semibold tracking-wide text-left uppercase text-ink-subtle">
              <th class="px-4 py-3">Quotation</th>
              <th class="px-4 py-3">Institution</th>
              <th class="px-4 py-3">Term</th>
              <th class="px-4 py-3">Contact</th>
              <th class="px-4 py-3">Prepared by</th>
              <th class="px-4 py-3">{{ stageDateLabel }}</th>
              <th class="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            <template v-if="list.loading.value">
              <tr v-for="i in 6" :key="i" class="border-t border-line"><td v-for="j in 7" :key="j" class="px-4 py-3.5"><div class="h-4 rounded animate-pulse bg-surface-raised"></div></td></tr>
            </template>
            <tr v-else-if="!list.rows.value.length">
              <td colspan="7" class="px-6 py-14 text-center">
                <p class="text-sm font-semibold text-ink">{{ list.search.value ? "No quotations match your search" : `No ${tab.toLowerCase()} quotations` }}</p>
                <p v-if="!list.search.value && tab === 'Draft'" class="mt-1 text-sm text-ink-muted">Start one for an institution with “New quotation”.</p>
              </td>
            </tr>
            <tr v-for="q in list.rows.value" v-else :key="q.quotationUuid" tabindex="0" class="border-t cursor-pointer border-line hover:bg-surface-muted/60 focus:outline-none focus:bg-surface-muted" @click="open(q)" @keydown.enter="open(q)">
              <td class="px-4 py-3 font-medium whitespace-nowrap text-ink">{{ q.quotationNumber || "Draft" }}</td>
              <td class="px-4 py-3 text-ink">{{ q.institutionName || "—" }}</td>
              <td class="px-4 py-3 whitespace-nowrap text-ink-muted">{{ q.term ? `${q.term} yr${q.term === 1 ? "" : "s"}` : "—" }}</td>
              <td class="px-4 py-3 text-ink-muted">
                {{ q.contactPersonFullName || "—" }}
                <span v-if="q.contactPhone" class="block text-xs text-ink-subtle">{{ q.contactPhone }}</span>
              </td>
              <td class="px-4 py-3 text-ink-muted">{{ q.quotedByFullName || "—" }}</td>
              <td class="px-4 py-3 whitespace-nowrap text-ink-muted">{{ formatDate(stageDate(q)) }}</td>
              <td class="px-4 py-3"><LifeStatusBadge :status="q.quotationStatus" /></td>
            </tr>
          </tbody>
        </table>
      </div>
      <LifePager v-model:page="list.page.value" :total-pages="list.totalPages.value" :disabled="list.loading.value" />
    </section>
  </div>
</template>
