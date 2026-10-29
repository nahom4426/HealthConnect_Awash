<script setup>
// Policy detail (plan 5.4): shipment, cover, premium, certificates, claims (claims staff) and audit.
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import Button from "@/components/Button.vue";
import MarinePageHeader from "../../components/MarinePageHeader.vue";
import PageState from "../../components/PageState.vue";
import KeyValueGrid from "../../components/KeyValueGrid.vue";
import PremiumBreakdown from "../../components/PremiumBreakdown.vue";
import StatusBadge from "../../components/StatusBadge.vue";
import AuditTimeline from "../../components/AuditTimeline.vue";
import DetailTabs from "../../components/DetailTabs.vue";
import { cardClass } from "../../components/styles";
import { useResource } from "../../composables/useResource";
import { getPolicy, listClaims } from "../../api/marineApi";
import { useCan } from "../../composables/useCan";
import { CLAIM_TYPES, label } from "../../constants";
import { productLabel, clauseLabel } from "../../constants";
import { formatDate, formatDateTime } from "../../utils/format";
import { formatAmount } from "../../utils/money";
import { coverItems, lcItems, shipmentItems, vesselText } from "../../utils/quoteSummary";

const route = useRoute();
const router = useRouter();
const { data: p, loading, error, notFound, load } = useResource(getPolicy);
const { roles } = useCan();
const claimsStaff = computed(() => roles.value.some((r) => ["CLAIMS_HANDLER", "CLAIMS_MANAGER"].includes(r)));
const claims = ref([]);
onMounted(async () => {
  await load(route.params.id);
  if (claimsStaff.value) {
    const res = await listClaims({ policyId: route.params.id, size: 100 });
    if (res.ok) claims.value = res.data.content;
  }
});
// Claims go against the current certificate version
const currentCert = computed(() => p.value?.certificates.filter((x) => ["ISSUED", "PENDING", "EXPIRED"].includes(x.status)).sort((a, b) => b.version - a.version)[0]);
</script>

<template>
  <div class="marine-page">
    <PageState v-if="loading && !p" kind="loading" />
    <template v-else-if="notFound">
      <MarinePageHeader title="Policy not found" :crumbs="[{ label: 'Marine' }, { label: 'Policies', to: '/marine/policies' }]" />
      <PageState kind="notFound"><RouterLink to="/marine/policies"><Button variant="outline" size="sm">Back to policies</Button></RouterLink></PageState>
    </template>
    <PageState v-else-if="error" kind="error" :message="error.message" @retry="load(route.params.id)" />

    <template v-else-if="p">
      <MarinePageHeader
        :title="p.policyNo"
        :status="p.status"
        entity="policy"
        :subtitle="`${productLabel(p.product)} · ${p.insured?.name ?? ''} · ${formatDate(p.periodFrom)} to ${formatDate(p.periodTo)}`"
        :crumbs="[{ label: 'Marine' }, { label: 'Policies', to: '/marine/policies' }, { label: p.policyNo }]"
      >
        <template #badge>
          <RouterLink :to="`/marine/quotes/${p.quoteId}`" class="text-sm font-medium text-primary hover:underline">from quote {{ p.quoteNo }}</RouterLink>
        </template>
      </MarinePageHeader>

      <DetailTabs
        :tabs="[
          { key: 'shipment', label: 'Shipment' },
          { key: 'cover', label: 'Cover' },
          { key: 'premium', label: 'Premium' },
          { key: 'certificates', label: 'Certificates', count: p.certificates.length },
          ...(claimsStaff ? [{ key: 'claims', label: 'Claims', count: claims.length }] : []),
          { key: 'audit', label: 'Audit' },
        ]"
      >
        <template #shipment>
          <div class="grid gap-4">
            <section v-if="p.vessel" :class="[cardClass, 'p-4']">
              <h2 class="mb-1 text-sm font-semibold text-ink">Vessel</h2>
              <p class="text-sm text-ink">{{ vesselText(p.vessel) }}</p>
            </section>
            <section :class="[cardClass, 'p-4']"><KeyValueGrid :items="shipmentItems(p).filter((i) => i.label !== 'Vessel')" /></section>
            <section v-if="p.lc?.enabled" :class="[cardClass, 'p-4']"><h2 class="mb-3 text-sm font-semibold text-ink">Letter of credit</h2><KeyValueGrid :items="lcItems(p)" /></section>
          </div>
        </template>
        <template #cover>
          <section :class="[cardClass, 'p-4']">
            <KeyValueGrid :items="[{ label: 'Wording', value: `${clauseLabel(p.clause)} · ${p.wordingVersion}` }, ...coverItems(p).filter((i) => i.label !== 'Clause')]" />
          </section>
        </template>
        <template #premium>
          <section :class="[cardClass, 'p-4 max-w-3xl']">
            <PremiumBreakdown :premium="p.premium" :fx="p.fx" />
            <p v-if="p.refund" class="flex justify-between p-3 mt-3 text-sm rounded-xl bg-success-soft text-success-strong">
              <span>Refund on cancelling {{ p.refund.certNo }} ({{ p.refund.reason.replace(/_/g, " ").toLowerCase() }}), {{ formatDate(p.refund.at) }}</span>
              <span class="font-semibold tabular-nums">ETB {{ formatAmount(p.refund.amount) }}</span>
            </p>
          </section>
        </template>
        <template #certificates>
          <section :class="[cardClass, 'overflow-hidden']">
            <PageState v-if="!p.certificates.length" kind="empty" title="No certificates on this policy" />
            <table v-else class="w-full text-sm">
              <thead class="bg-surface-muted">
                <tr class="text-xs font-semibold text-left uppercase text-ink-subtle">
                  <th class="px-4 py-3">Certificate no</th><th class="px-4 py-3">Version</th><th class="px-4 py-3">Status</th><th class="px-4 py-3">Issued at</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="c in p.certificates" :key="c.id" class="border-t cursor-pointer border-line hover:bg-surface-muted/60" @click="router.push(`/marine/certificates/${c.id}`)">
                  <td class="px-4 py-3"><RouterLink :to="`/marine/certificates/${c.id}`" class="font-semibold text-ink hover:text-primary" @click.stop>{{ c.certNo }}</RouterLink></td>
                  <td class="px-4 py-3">v{{ c.version }}</td>
                  <td class="px-4 py-3"><StatusBadge entity="certificate" :status="c.status" /></td>
                  <td class="px-4 py-3 text-ink-muted">{{ c.issuedAt ? formatDateTime(c.issuedAt) : "Being generated" }}</td>
                </tr>
              </tbody>
            </table>
          </section>
        </template>
        <template #claims>
          <section :class="[cardClass, 'overflow-hidden']">
            <div class="flex justify-end p-3" v-if="roles.includes('CLAIMS_HANDLER') && currentCert">
              <RouterLink :to="`/marine/claims/new?certificateId=${currentCert.id}`"><Button size="sm">Register claim</Button></RouterLink>
            </div>
            <PageState v-if="!claims.length" kind="empty" title="No claims on this policy" />
            <table v-else class="w-full text-sm">
              <thead class="bg-surface-muted"><tr class="text-xs font-semibold text-left uppercase text-ink-subtle"><th class="px-4 py-3">Claim no</th><th class="px-4 py-3">Type</th><th class="px-4 py-3">Loss date</th><th class="px-4 py-3">Status</th></tr></thead>
              <tbody>
                <tr v-for="cl in claims" :key="cl.id" class="border-t border-line">
                  <td class="px-4 py-3"><RouterLink :to="`/marine/claims/${cl.id}`" class="font-semibold text-ink hover:text-primary">{{ cl.claimNo }}</RouterLink></td>
                  <td class="px-4 py-3">{{ label(CLAIM_TYPES, cl.type) }}</td>
                  <td class="px-4 py-3">{{ formatDate(cl.lossDate) }}</td>
                  <td class="px-4 py-3"><StatusBadge entity="claim" :status="cl.status" /></td>
                </tr>
              </tbody>
            </table>
          </section>
        </template>
        <template #audit>
          <section :class="[cardClass, 'p-4']"><AuditTimeline entity="policy" :entity-id="p.id" /></section>
        </template>
      </DetailTabs>
    </template>
  </div>
</template>
