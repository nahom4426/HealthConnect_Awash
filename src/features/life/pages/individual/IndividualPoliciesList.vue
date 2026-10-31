<script setup>
// Individual term life policies by status. GET /benefit/benefits/{status} has no paging or search,
// so both happen here (09 §G9 item 29).
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";
import Button from "@/components/Button.vue";
import { hasPrivilege } from "@/utils/privileges";
import TabGroup from "@/components/TabGroup.vue";
import PageHeader from "@/components/PageHeader.vue";
import StatusBadge from "@/components/StatusBadge.vue";
import PageNav from "@/components/PageNav.vue";
import ListTable from "@/components/ListTable.vue";
import TextField from "@/components/fields/TextField.vue";
import { useLifeResource } from "../../composables/useLifeResource";
import { BenefitStatus } from "../../constants/statuses";
import { daysUntil, formatAmount, formatDate, remainingLabel } from "../../constants/labels";
import { benefitName, pageOf } from "../../individual/individualRules";
import { getBenefits } from "../../api/policyApi";

const router = useRouter();
const COLUMNS = [
  { key: "holder", label: "Policyholder" },
  { key: "policyNumber", label: "Policy" },
  { key: "insuranceTerm", label: "Term" },
  { key: "sumAssured", label: "Sum assured", align: "right" },
  { key: "premium", label: "Total premium", align: "right" },
  { key: "cover", label: "Cover" },
  { key: "status", label: "Status" },
];
const TABS = { Draft: BenefitStatus.PENDING, Active: BenefitStatus.ACTIVE, Renewed: BenefitStatus.RENEWED, Lapsed: BenefitStatus.LAPSED, Cancelled: BenefitStatus.CANCELLED, Disabled: BenefitStatus.DISABLED };
const tab = ref("Draft");
const list = useLifeResource((status) => getBenefits(status), { initial: [], map: (d) => (Array.isArray(d) ? d : []) });
const search = ref("");
const page = ref(1);
watch(tab, (t) => { page.value = 1; list.load(TABS[t]); }, { immediate: true });
watch(search, () => (page.value = 1));
const filtered = computed(() => {
  const q = search.value.trim().toLowerCase();
  const rows = (list.data.value || []).filter((b) => !b.deleted);
  return q ? rows.filter((b) => `${benefitName(b)} ${b.policyNumber || ""} ${b.personPhone || ""}`.toLowerCase().includes(q)) : rows;
});
const view = computed(() => pageOf(filtered.value, page.value, 20));

const open = (b) => router.push(`/life/individual/${b.benefitUuid}`);
</script>

<template>
  <div class="p-4 md:p-6">
    <PageHeader title="Individual policies" subtitle="Term life policies for individual customers, with optional riders.">
      <template v-if="hasPrivilege(['Life_Quotation_Create', 'Life_Policy_Issue'])" #actions><Button @click="router.push('/life/individual/new')">New policy</Button></template>
    </PageHeader>

    <div class="flex flex-wrap gap-3 justify-between items-center mb-4">
      <TabGroup v-model="tab" :tabs="Object.keys(TABS)" />
      <div class="w-72"><TextField v-model="search" type="search" placeholder="Search name, policy or phone" aria-label="Search individual policies" /></div>
    </div>

    <ListTable
      :columns="COLUMNS"
      :rows="view.rows"
      row-key="benefitUuid"
      :loading="list.loading.value"
      :error="list.error.value"
      error-title="Couldn't load policies"
      :skeleton-rows="6"
      clickable
      @row-click="open"
      @retry="list.load(TABS[tab])"
    >
      <template #empty>
        <p class="text-sm font-semibold text-ink">{{ search ? "No policies match your search" : `No ${tab.toLowerCase()} individual policies` }}</p>
        <p v-if="!search && tab === 'Draft'" class="mt-1 text-sm text-ink-muted">Start one with “New policy”.</p>
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
      <template #footer><PageNav v-model:page="page" :total-pages="view.totalPages" :disabled="list.loading.value" /></template>
    </ListTable>
  </div>
</template>
