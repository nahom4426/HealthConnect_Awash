<script setup>
// Claim workspace (plan 8.3, MAR-41 to MAR-46): header, money strip, next deadline, the action the
// status allows, and eight tabs. The tab lives in the URL so alert links open the Deadlines tab.
import { computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { openModal } from "@customizer/modal-x";
import Button from "@/components/Button.vue";
import { toasted } from "@/utils/utils";
import MarinePageHeader from "../../components/MarinePageHeader.vue";
import PageState from "../../components/PageState.vue";
import DeadlineChip from "../../components/DeadlineChip.vue";
import DetailTabs from "../../components/DetailTabs.vue";
import AuditTimeline from "../../components/AuditTimeline.vue";
import OverviewTab from "../../components/claims/OverviewTab.vue";
import SurveyTab from "../../components/claims/SurveyTab.vue";
import GaSalvageTab from "../../components/claims/GaSalvageTab.vue";
import RecoveryTab from "../../components/claims/RecoveryTab.vue";
import DocumentsTab from "../../components/claims/DocumentsTab.vue";
import DeadlinesTab from "../../components/claims/DeadlinesTab.vue";
import SettlementTab from "../../components/claims/SettlementTab.vue";
import { cardClass } from "../../components/styles";
import { useResource } from "../../composables/useResource";
import { useCan } from "../../composables/useCan";
import { closeClaim, getClaim } from "../../api/marineApi";
import { notifyError } from "../../api/marineClient";
import { CLAIM_TYPES, DEADLINE_KINDS, label } from "../../constants";
import { formatDate } from "../../utils/format";
import { formatMoney } from "../../utils/money";

const route = useRoute();
const router = useRouter();
const { roles } = useCan();
const { data: c, loading, error, notFound, load, reload } = useResource(getClaim);
onMounted(() => load(route.params.id));
watch(() => route.params.id, (id) => id && load(id));

const isManager = computed(() => roles.value.includes("CLAIMS_MANAGER"));
const canWork = computed(() => roles.value.some((r) => ["CLAIMS_HANDLER", "CLAIMS_MANAGER"].includes(r)) && !["CLOSED", "DECLINED"].includes(c.value?.status));
const updated = (data) => (data?.id ? (c.value = data) : reload());

// Scroll to a document row when the settle modal sends the user here
watch(
  () => route.hash,
  (h) => h && setTimeout(() => document.querySelector(h)?.scrollIntoView({ block: "center", behavior: "smooth" }), 300)
);

function assess() {
  openModal("MarineAssessClaim", { claim: c.value }, (d) => d && (c.value = d));
}
function settle() {
  openModal("MarineSettleClaim", { claim: c.value }, (d) => d && (c.value = d));
}
function close() {
  openModal("MarineConfirm", { title: `Close ${c.value.claimNo}?`, message: "Closing ends work on the claim. Its records stay for audit.", confirmLabel: "Close claim" }, async (r) => {
    if (!r?.confirmed) return;
    const res = await closeClaim(c.value.id);
    if (res.ok) {
      c.value = res.data;
      toasted(true, `${res.data.claimNo} closed`);
    } else notifyError(res.error, { onStale: reload });
  });
}
const strip = computed(() =>
  c.value
    ? [
        ["Estimated", c.value.money.estimated],
        ["Reserve", c.value.money.reserve],
        ["Paid", c.value.money.paid],
        ["GA and salvage", c.value.money.gaSalvage],
        ["Recovered", c.value.money.recovered],
        ["Net cost", c.value.money.net],
      ]
    : []
);
</script>

<template>
  <div class="marine-page">
    <PageState v-if="loading && !c" kind="loading" />
    <template v-else-if="notFound">
      <MarinePageHeader title="Claim not found" :crumbs="[{ label: 'Marine' }, { label: 'Claims', to: '/marine/claims' }]" />
      <PageState kind="notFound"><RouterLink to="/marine/claims"><Button variant="outline" size="sm">Back to claims</Button></RouterLink></PageState>
    </template>
    <PageState v-else-if="error" kind="error" :message="error.message" @retry="load(route.params.id)" />
    <template v-else-if="c">
      <MarinePageHeader
        :title="c.claimNo"
        :status="c.status"
        entity="claim"
        :subtitle="`${label(CLAIM_TYPES, c.type)} · ${c.insured?.name} · loss ${formatDate(c.lossDate)} · handler ${c.handlerName}`"
        :crumbs="[{ label: 'Marine' }, { label: 'Claims', to: '/marine/claims' }, { label: c.claimNo }]"
      >
        <template #badge>
          <RouterLink :to="`/marine/certificates/${c.certificateId}`" class="text-sm font-medium text-primary hover:underline">{{ c.certNo }}</RouterLink>
        </template>
        <template #actions>
          <Button v-if="canWork && ['REGISTERED', 'SURVEYED'].includes(c.status)" @click="assess">Assess</Button>
          <Button v-if="c.status === 'APPROVED' && isManager" variant="success" @click="settle">Settle</Button>
          <span v-if="['PAID', 'RECOVERY'].includes(c.status) && canWork" :title="c.recoveryResolved ? '' : 'Resolve the carrier recovery first'">
            <Button variant="outline" :disabled="!c.recoveryResolved" @click="close">Close</Button>
          </span>
        </template>
      </MarinePageHeader>

      <p v-if="c.status === 'PAYMENT_REQUESTED'" role="status" class="p-3 mb-4 text-sm rounded-xl bg-warning-soft text-warning-strong">
        Waiting for Finance to pay {{ c.vouchers?.at(-1)?.voucherNo }} ({{ formatMoney(c.vouchers?.at(-1)?.amount, c.currency) }} to {{ c.vouchers?.at(-1)?.payee?.name }}).
      </p>
      <section class="grid grid-cols-2 gap-3 mb-5 sm:grid-cols-4 xl:grid-cols-7" aria-label="Money">
        <div v-for="[l, v] in strip" :key="l" :class="[cardClass, 'p-3.5 border-l-4', l === 'Net cost' ? '!border-l-sky-600 !bg-sky-50 dark:!bg-sky-900/30' : '!border-l-sky-300 dark:!border-l-sky-700']">
          <p class="text-[11px] font-semibold tracking-wider uppercase text-ink-muted">{{ l }}</p>
          <p class="mt-1 text-base font-bold tabular-nums text-ink">{{ v === null ? "—" : formatMoney(v, c.currency) }}</p>
        </div>
        <button v-if="c.nextDeadline" type="button" :class="[cardClass, 'p-3.5 text-left border-l-4 !border-l-amber-500']" @click="router.replace({ query: { tab: 'deadlines' } })">
          <p class="text-[11px] font-semibold tracking-wider uppercase text-ink-muted">Next deadline</p>
          <DeadlineChip :due-date="c.nextDeadline.dueDate" :status="c.nextDeadline.status" />
          <p class="text-xs text-ink-muted">{{ DEADLINE_KINDS[c.nextDeadline.kind] }}, {{ formatDate(c.nextDeadline.dueDate) }}</p>
        </button>
      </section>

      <DetailTabs
        :tabs="[
          { key: 'overview', label: 'Overview' },
          { key: 'survey', label: 'Survey' },
          { key: 'ga', label: 'GA and salvage', count: c.ga.length + c.salvage.length || undefined },
          { key: 'recovery', label: 'Recovery' },
          { key: 'documents', label: 'Documents', count: c.missingDocuments.length ? `${c.missingDocuments.length} missing` : undefined },
          { key: 'deadlines', label: 'Deadlines', count: c.deadlines.filter((d) => d.overdue).length ? `${c.deadlines.filter((d) => d.overdue).length} overdue` : undefined },
          { key: 'settlement', label: 'Settlement' },
          { key: 'audit', label: 'Audit' },
        ]"
      >
        <template #overview><OverviewTab :claim="c" :can-work="canWork" @updated="updated" /></template>
        <template #survey><SurveyTab :claim="c" :can-work="canWork" @updated="updated" /></template>
        <template #ga><GaSalvageTab :claim="c" :can-work="canWork" @updated="updated" /></template>
        <template #recovery><RecoveryTab :claim="c" :can-work="canWork || c.status === 'PAID' || c.status === 'RECOVERY'" @updated="updated" /></template>
        <template #documents><DocumentsTab :claim="c" :can-work="canWork" @updated="updated" /></template>
        <template #deadlines><DeadlinesTab :claim="c" :can-work="canWork" @updated="updated" /></template>
        <template #settlement><SettlementTab :claim="c" :can-work="canWork" @updated="updated" /></template>
        <template #audit><section :class="[cardClass, 'p-4']"><AuditTimeline entity="claim" :entity-id="c.id" /></section></template>
      </DetailTabs>
    </template>
  </div>
</template>
