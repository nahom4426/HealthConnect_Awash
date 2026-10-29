<script setup>
// Individual term life policies by status. GET /benefit/benefits/{status} has no paging or search,
// so both happen here (09 §G9 item 29).
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";
import Button from "@/components/Button.vue";
import TabGroup from "@/components/TabGroup.vue";
import LifePageHeader from "../../components/LifePageHeader.vue";
import LifeStatusBadge from "../../components/LifeStatusBadge.vue";
import LifePager from "../../components/LifePager.vue";
import { useLifeResource } from "../../composables/useLifeResource";
import { BenefitStatus } from "../../constants/statuses";
import { daysUntil, formatAmount, formatDate, remainingLabel } from "../../constants/labels";
import { benefitName, pageOf } from "../../individual/individualRules";
import { getBenefits } from "../../api/policyApi";

const router = useRouter();
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
    <LifePageHeader title="Individual policies" subtitle="Term life policies for individual customers, with optional riders.">
      <template #actions><Button @click="router.push('/life/individual/new')">New policy</Button></template>
    </LifePageHeader>

    <div class="flex flex-wrap gap-3 justify-between items-center mb-4">
      <TabGroup v-model="tab" :tabs="Object.keys(TABS)" />
      <input v-model="search" type="search" placeholder="Search name, policy or phone" aria-label="Search individual policies" class="px-3 w-72 h-9 text-sm rounded-lg border outline-none bg-surface border-line text-ink focus:border-primary focus:ring-2 focus:ring-primary/15" />
    </div>

    <section class="overflow-hidden rounded-2xl border bg-surface border-line shadow-card">
      <div v-if="list.error.value && !list.loading.value" class="flex flex-col gap-3 items-center px-6 py-12 text-center">
        <p class="text-sm font-semibold text-ink">Couldn't load policies</p>
        <p class="max-w-md text-sm text-ink-muted">{{ list.error.value }}</p>
        <Button variant="outline" size="sm" @click="list.load(TABS[tab])">Try again</Button>
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-surface-muted">
            <tr class="text-xs font-semibold tracking-wide text-left uppercase text-ink-subtle">
              <th class="px-4 py-3">Policyholder</th>
              <th class="px-4 py-3">Policy</th>
              <th class="px-4 py-3">Term</th>
              <th class="px-4 py-3 text-right">Sum assured</th>
              <th class="px-4 py-3 text-right">Total premium</th>
              <th class="px-4 py-3">Cover</th>
              <th class="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            <template v-if="list.loading.value">
              <tr v-for="i in 6" :key="i" class="border-t border-line"><td v-for="j in 7" :key="j" class="px-4 py-3.5"><div class="h-4 rounded animate-pulse bg-surface-raised"></div></td></tr>
            </template>
            <tr v-else-if="!view.rows.length">
              <td colspan="7" class="px-6 py-14 text-center">
                <p class="text-sm font-semibold text-ink">{{ search ? "No policies match your search" : `No ${tab.toLowerCase()} individual policies` }}</p>
                <p v-if="!search && tab === 'Draft'" class="mt-1 text-sm text-ink-muted">Start one with “New policy”.</p>
              </td>
            </tr>
            <tr v-for="b in view.rows" v-else :key="b.benefitUuid" tabindex="0" class="border-t cursor-pointer border-line hover:bg-surface-muted/60 focus:outline-none focus:bg-surface-muted" @click="open(b)" @keydown.enter="open(b)">
              <td class="px-4 py-3">
                <span class="font-medium text-ink">{{ benefitName(b) }}</span>
                <span class="block text-xs text-ink-subtle">{{ [b.gender, b.personPhone].filter(Boolean).join(" · ") }}</span>
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-ink-muted">{{ b.policyNumber || "Not issued" }}</td>
              <td class="px-4 py-3 whitespace-nowrap text-ink-muted">{{ b.insuranceTerm ? `${b.insuranceTerm} yrs` : "—" }}</td>
              <td class="px-4 py-3 text-right tabular-nums text-ink">{{ formatAmount(b.totalBenefit ?? b.termBenefit) }}</td>
              <td class="px-4 py-3 text-right tabular-nums text-ink">{{ formatAmount(b.totalPremium ?? b.termPremium) }}</td>
              <td class="px-4 py-3 whitespace-nowrap text-ink-muted">
                {{ b.beginDate ? `${formatDate(b.beginDate)} – ${formatDate(b.endDate)}` : "—" }}
                <span v-if="b.endDate && tab === 'Active'" class="block text-xs text-ink-subtle">{{ remainingLabel(daysUntil(b.endDate)) }}</span>
              </td>
              <td class="px-4 py-3"><LifeStatusBadge :status="b.status" /></td>
            </tr>
          </tbody>
        </table>
      </div>
      <LifePager v-model:page="page" :total-pages="view.totalPages" :disabled="list.loading.value" />
    </section>
  </div>
</template>
