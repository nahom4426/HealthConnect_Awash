<script setup>
// Individual term life policies by status, paged and searched by the backend
// (GET /benefit/benefits/{status}?page&limit&search, contract 2026-10 #29).
import { computed } from "vue";
import { useRouter } from "vue-router";
import Button from "@/components/Button.vue";
import { lifeCan } from "@/features/life/privileges";
import TabGroup from "@/components/TabGroup.vue";
import PageHeader from "@/components/PageHeader.vue";
import StatusBadge from "@/components/StatusBadge.vue";
import PageNav from "@/components/PageNav.vue";
import ListTable from "@/components/ListTable.vue";
import TextField from "@/components/fields/TextField.vue";
import { useLifePagedList } from "../../composables/useLifePagedList";
import { BenefitStatus } from "../../constants/statuses";
import { daysUntil, formatAmount, formatDate, remainingLabel } from "../../constants/labels";
import { benefitName } from "../../individual/individualRules";
import { getBenefits } from "../../api/policyApi";

const router = useRouter();
const COLUMNS = [
  { key: "holder", label: "Insured" },
  { key: "policyNumber", label: "Policy" },
  { key: "insuranceTerm", label: "Term" },
  { key: "sumAssured", label: "Sum assured", align: "right" },
  { key: "premium", label: "Total premium", align: "right" },
  { key: "cover", label: "Cover" },
  { key: "status", label: "Status" },
];
const TABS = { Draft: BenefitStatus.PENDING, Active: BenefitStatus.ACTIVE, Renewed: BenefitStatus.RENEWED, Lapsed: BenefitStatus.LAPSED, Expired: BenefitStatus.EXPIRED, Cancelled: BenefitStatus.CANCELLED, Disabled: BenefitStatus.DISABLED };
const list = useLifePagedList(({ status, ...query }) => getBenefits(status, query), { status: BenefitStatus.PENDING });
list.reload();
const tab = computed({ get: () => Object.keys(TABS).find((k) => TABS[k] === list.status.value), set: (t) => (list.status.value = TABS[t]) });

const open = (b) => router.push(`/life/individual/${b.benefitUuid}`);
</script>

<template>
  <div class="p-4 md:p-6">
    <PageHeader title="Individual policies" subtitle="Term life policies for individual customers, with optional riders.">
      <template v-if="lifeCan(['Life_Quotation_Create', 'Life_Policy_Issue'])" #actions><Button @click="router.push('/life/individual/new')">New policy</Button></template>
    </PageHeader>

    <div class="flex flex-wrap gap-3 justify-between items-center mb-4">
      <TabGroup v-model="tab" :tabs="Object.keys(TABS)" />
      <div class="w-72"><TextField v-model="list.search.value" type="search" placeholder="Search name, policy or phone" aria-label="Search individual policies" /></div>
    </div>

    <ListTable
      :columns="COLUMNS"
      :rows="list.rows.value"
      row-key="benefitUuid"
      :loading="list.loading.value"
      :error="list.error.value"
      error-title="Couldn't load policies"
      :skeleton-rows="6"
      clickable
      @row-click="open"
      @retry="list.reload()"
    >
      <template #empty>
        <p class="text-sm font-semibold text-ink">{{ list.search.value ? "No policies match your search" : `No ${tab.toLowerCase()} individual policies` }}</p>
        <p v-if="!list.search.value && tab === 'Draft'" class="mt-1 text-sm text-ink-muted">Start one with “New policy”.</p>
      </template>
      <template #cell-holder="{ row }">
        <span class="font-medium text-ink">{{ benefitName(row) }}</span>
        <span class="block text-xs text-ink-subtle">{{ [row.gender, row.personPhone].filter(Boolean).join(" · ") }}</span>
      </template>
      <template #cell-policyNumber="{ row }"><span class="whitespace-nowrap text-ink-muted">{{ row.policyNumber || "Not issued" }}</span></template>
      <template #cell-insuranceTerm="{ row }"><span class="whitespace-nowrap text-ink-muted">{{ row.insuranceTerm ? `${row.insuranceTerm} yrs` : "—" }}</span></template>
      <template #cell-sumAssured="{ row }"><span class="tabular-nums text-ink">{{ formatAmount(row.totalBenefit ?? row.termBenefit) }}</span></template>
      <template #cell-premium="{ row }"><span class="tabular-nums text-ink">{{ formatAmount(row.totalPremium ?? row.termPremium) }}</span></template>
      <template #cell-cover="{ row }">
        <span class="whitespace-nowrap text-ink-muted">
          {{ row.beginDate ? `${formatDate(row.beginDate)} – ${formatDate(row.endDate)}` : "—" }}
          <span v-if="row.endDate && tab === 'Active'" class="block text-xs text-ink-subtle">{{ remainingLabel(daysUntil(row.endDate)) }}</span>
        </span>
      </template>
      <template #cell-status="{ row }"><StatusBadge :status="row.status" /></template>
      <template #footer><PageNav v-model:page="list.page.value" :total-pages="list.totalPages.value" :disabled="list.loading.value" /></template>
    </ListTable>
  </div>
</template>
