<script setup>
// Policy detail (plan 5.4): shipment, cover, premium, certificates and audit tabs. The claims tab
// arrives with phase 4.
import { onMounted } from "vue";
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
import { getPolicy } from "../../api/marineApi";
import { productLabel, clauseLabel } from "../../constants";
import { formatDate, formatDateTime } from "../../utils/format";
import { formatAmount } from "../../utils/money";
import { coverItems, lcItems, shipmentItems, vesselText } from "../../utils/quoteSummary";

const route = useRoute();
const router = useRouter();
const { data: p, loading, error, notFound, load } = useResource(getPolicy);
onMounted(() => load(route.params.id));
</script>

<template>
  <div class="p-4 md:p-6">
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
        <template #audit>
          <section :class="[cardClass, 'p-4']"><AuditTimeline entity="policy" :entity-id="p.id" /></section>
        </template>
      </DetailTabs>
    </template>
  </div>
</template>
