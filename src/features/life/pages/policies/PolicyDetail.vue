<script setup>
// One group policy. There is no policy detail endpoint, so it is read from the quotation it was
// issued from (GET /quotation/{uuid} carries the policy fields). Servicing (endorsements, lapse,
// cancel) waits on backend gap G5.
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import Button from "@/components/Button.vue";
import TabGroup from "@/components/TabGroup.vue";
import { toasted } from "@/utils/utils";
import { hasPrivilege } from "@/utils/privileges";
import PageHeader from "@/components/PageHeader.vue";
import StatusBadge from "@/components/StatusBadge.vue";
import InsuredMembersPanel from "../../components/InsuredMembersPanel.vue";
import QuotedRidersPanel from "../../components/QuotedRidersPanel.vue";
import TreatyLinksPanel from "../../components/TreatyLinksPanel.vue";
import QuotationSummaryPanel from "../../components/QuotationSummaryPanel.vue";
import { useLifeResource } from "../../composables/useLifeResource";
import { confirmAction } from "../../composables/confirmAction";
import { daysUntil, formatAmount, formatDate, remainingLabel } from "../../constants/labels";
import { quotationActions } from "../../quotations/quotationRules";
import { getQuotation, reviseQuotation } from "../../api/quotationApi";
import { generateTreatyReport } from "../../api/policyApi";

const route = useRoute();
const router = useRouter();
const uuid = computed(() => route.params.quotationUuid);

const policy = useLifeResource(getQuotation);
const p = computed(() => policy.data.value || {});
const issued = computed(() => !!p.value.policyIssuedDate);
watch(uuid, (v) => v && policy.load(v), { immediate: true });

const TABS = ["Members", "Riders", "Reinsurance", "Details"];
const tab = ref("Members");

const remaining = computed(() => daysUntil(p.value.endDate));
const cards = computed(() => [
  ["Cover period", p.value.beginDate ? `${formatDate(p.value.beginDate)} – ${formatDate(p.value.endDate)}` : "—"],
  ["Remaining", remainingLabel(remaining.value)],
  ["Term", p.value.term ? `${p.value.term} year${p.value.term === 1 ? "" : "s"}` : "—"],
  ["Net premium", formatAmount(p.value.netPremium)],
]);

// Treaty report: response schema is undocumented (09 §G9 item 4), so show whatever comes back
const report = ref(null);
const generating = ref(false);
async function makeReport() {
  generating.value = true;
  const res = await generateTreatyReport(uuid.value);
  generating.value = false;
  if (!res?.success) return;
  if (res.data instanceof Blob) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(res.data);
    a.download = `treaty-report-${p.value.quotationNumber || uuid.value}`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  } else report.value = res.data ?? {};
  toasted(true, "Treaty report generated");
}
const reportRows = computed(() => {
  const d = report.value;
  if (!d || typeof d !== "object") return d ? [["Result", String(d)]] : [];
  return Object.entries(d).map(([k, v]) => [k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()), Array.isArray(v) ? `${v.length} item${v.length === 1 ? "" : "s"}` : v && typeof v === "object" ? JSON.stringify(v) : String(v ?? "—")]);
});

function renew() {
  confirmAction({ title: "Start a renewal?", message: "A new draft quotation is created from this policy with its members and riders. The policy itself doesn't change.", confirmText: "Create draft" }, async () => {
    const res = await reviseQuotation(uuid.value);
    if (res?.success) {
      toasted(true, "Renewal draft created");
      if (res.data?.quotationUuid) router.push(`/life/quotations/${res.data.quotationUuid}`);
    }
  });
}
</script>

<template>
  <div class="p-4 md:p-6">
    <div v-if="policy.error.value && !policy.loading.value && !policy.data.value" class="flex flex-col gap-3 items-center px-6 py-16 text-center">
      <p class="text-sm font-semibold text-ink">Couldn't load this policy</p>
      <p class="max-w-md text-sm text-ink-muted">{{ policy.error.value }}</p>
      <div class="flex gap-2">
        <Button variant="outline" size="sm" @click="router.push('/life/policies')">Back to policies</Button>
        <Button size="sm" @click="policy.load(uuid)">Try again</Button>
      </div>
    </div>

    <div v-else-if="policy.data.value && !issued" class="flex flex-col gap-3 items-center px-6 py-16 text-center">
      <p class="text-sm font-semibold text-ink">No policy has been issued for this quotation yet</p>
      <Button size="sm" @click="router.push(`/life/quotations/${uuid}`)">Open the quotation</Button>
    </div>

    <template v-else>
      <PageHeader
        :title="p.institutionLifeInsuranceNumber || p.quotationNumber || (policy.loading.value ? 'Loading…' : 'Policy')"
        :subtitle="[p.institutionName, 'Group term life'].filter(Boolean).join(' · ')"
        back="/life/policies"
      >
        <template v-if="p.policyStatus" #badge><StatusBadge :status="p.policyStatus" /></template>
        <template #actions>
          <Button variant="outline" @click="router.push(`/life/quotations/${uuid}`)">View quotation</Button>
          <Button v-if="quotationActions(p).revise && hasPrivilege('Life_Policy_Service')" @click="renew">Renew / revise</Button>
        </template>
      </PageHeader>

      <dl class="grid gap-3 mb-5 sm:grid-cols-2 xl:grid-cols-4">
        <div v-for="[label, value] in cards" :key="label" class="px-4 py-3 rounded-2xl border bg-surface border-line shadow-card">
          <dt class="text-xs text-ink-subtle">{{ label }}</dt>
          <dd :class="['mt-0.5 text-sm font-semibold tabular-nums', label === 'Remaining' && remaining !== null && remaining < 0 ? 'text-error-strong' : 'text-ink']">{{ policy.loading.value && !p.quotationUuid ? "…" : value }}</dd>
        </div>
      </dl>

      <TabGroup v-model="tab" :tabs="TABS" class="mb-4" />

      <template v-if="p.quotationUuid === uuid">
        <InsuredMembersPanel v-show="tab === 'Members'" :key="`m${uuid}`" :quotation="p" show-cover />
        <QuotedRidersPanel v-show="tab === 'Riders'" :key="`r${uuid}`" :quotation-uuid="uuid" />
        <div v-show="tab === 'Reinsurance'" class="grid gap-4">
          <TreatyLinksPanel :key="`t${uuid}`" :quotation-uuid="uuid">
            <template v-if="hasPrivilege(['Life_Reinsurance_Manage', 'Life_Report_View'])" #actions><Button variant="outline" size="sm" :pending="generating" @click="makeReport">Generate treaty report</Button></template>
          </TreatyLinksPanel>
          <section v-if="report !== null" class="p-5 rounded-2xl border bg-surface border-line shadow-card">
            <h2 class="text-sm font-semibold text-ink">Treaty report</h2>
            <p v-if="!reportRows.length" class="mt-2 text-sm text-ink-muted">The report was generated. The service returned no details.</p>
            <dl v-else class="grid gap-x-6 gap-y-3 mt-3 sm:grid-cols-2 lg:grid-cols-3">
              <div v-for="[label, value] in reportRows" :key="label">
                <dt class="text-xs text-ink-subtle">{{ label }}</dt>
                <dd class="text-sm break-words text-ink">{{ value }}</dd>
              </div>
            </dl>
          </section>
        </div>
        <QuotationSummaryPanel v-show="tab === 'Details'" :quotation="p" />
      </template>

      <p class="mt-5 text-xs text-ink-subtle">Endorsements, member changes, lapse and cancellation need new backend endpoints (gap G5) and aren't available yet.</p>
    </template>
  </div>
</template>
