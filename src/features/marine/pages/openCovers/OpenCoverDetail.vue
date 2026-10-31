<script setup>
// Open cover detail (plan 7.3, MAR-02 to MAR-05): limit strip, declarations, terms, the year-end
// adjustment statement and change history.
import { computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { openModal } from "@customizer/modal-x";
import Button from "@/components/Button.vue";
import MarinePageHeader from "../../components/MarinePageHeader.vue";
import PageState from "../../components/PageState.vue";
import KeyValueGrid from "../../components/KeyValueGrid.vue";
import StatusBadge from "../../components/StatusBadge.vue";
import UsageBar from "../../components/UsageBar.vue";
import AuditTimeline from "../../components/AuditTimeline.vue";
import DetailTabs from "../../components/DetailTabs.vue";
import AdjustmentStatement from "../../components/AdjustmentStatement.vue";
import { cardClass } from "../../components/styles";
import { useResource } from "../../composables/useResource";
import { useCan } from "../../composables/useCan";
import { getOpenCover } from "../../api/marineApi";
import { clauseLabel, modeLabel } from "../../constants";
import { formatAmount, formatMoney } from "../../utils/money";
import { formatDate, formatDateTime, todayIso } from "../../utils/format";

const route = useRoute();
const router = useRouter();
const { roles } = useCan();
const has = (...r) => r.some((x) => roles.value.includes(x));
const { data: c, loading, error, notFound, load, reload } = useResource(getOpenCover);
onMounted(() => load(route.params.id));

const canDeclare = computed(() => c.value?.status === "ACTIVE" && has("BROKER", "UNDERWRITER", "SENIOR_UNDERWRITER"));
const canEdit = computed(() => c.value && c.value.status !== "ADJUSTED" && has("UNDERWRITER", "SENIOR_UNDERWRITER"));
const canAdjust = computed(() => c.value && !c.value.adjustment && c.value.periodTo < todayIso() && has("FINANCE"));

function adjust() {
  openModal("MarineYearEndAdjustment", { cover: c.value }, (done) => {
    if (done) {
      reload();
      router.replace({ query: { tab: "adjustment" } });
    }
  });
}
</script>

<template>
  <div class="marine-page">
    <PageState v-if="loading && !c" kind="loading" />
    <template v-else-if="notFound">
      <MarinePageHeader title="Open cover not found" :crumbs="[{ label: 'Marine' }, { label: 'Open covers', to: '/marine/open-covers' }]" />
      <PageState kind="notFound"><RouterLink to="/marine/open-covers"><Button variant="outline" size="sm">Back to open covers</Button></RouterLink></PageState>
    </template>
    <PageState v-else-if="error" kind="error" :message="error.message" @retry="load(route.params.id)" />
    <template v-else-if="c">
      <MarinePageHeader
        :title="c.coverNo"
        :status="c.status"
        entity="openCover"
        :subtitle="`${c.insured?.name} · ${formatDate(c.periodFrom)} to ${formatDate(c.periodTo)} · master policy ${c.masterPolicyNo}`"
        :crumbs="[{ label: 'Marine' }, { label: 'Open covers', to: '/marine/open-covers' }, { label: c.coverNo }]"
      >
        <template #actions>
          <Button v-if="canEdit" variant="outline" @click="router.push(`/marine/open-covers/${c.id}/edit`)">Edit</Button>
          <Button v-if="canAdjust" variant="outline" @click="adjust">Year-end adjustment</Button>
          <Button v-if="canDeclare" @click="router.push(`/marine/open-covers/${c.id}/declare`)">Create declaration</Button>
        </template>
      </MarinePageHeader>

      <section :class="[cardClass, 'grid gap-4 p-4 mb-5 sm:grid-cols-3 lg:grid-cols-6']" aria-label="Limits">
        <div><p class="text-xs text-ink-subtle">Annual limit</p><p class="font-semibold tabular-nums text-ink">{{ formatMoney(c.annualLimit, c.currency) }}</p></div>
        <div><p class="text-xs text-ink-subtle">Used</p><p class="font-semibold tabular-nums text-ink">{{ formatMoney(c.used, c.currency) }}</p></div>
        <div><p class="text-xs text-ink-subtle">Remaining</p><p :class="['font-semibold tabular-nums', Number(c.remaining) < 0 ? 'text-error-strong' : 'text-ink']">{{ formatMoney(c.remaining, c.currency) }}</p></div>
        <div><p class="text-xs text-ink-subtle">Per conveyance</p><p class="font-semibold tabular-nums text-ink">{{ formatMoney(c.perConveyanceLimit, c.currency) }}</p></div>
        <div><p class="text-xs text-ink-subtle">Declarations</p><p class="font-semibold tabular-nums text-ink">{{ c.declarationCount }} <span v-if="c.lateCount" class="ml-1 px-2 py-0.5 text-xs rounded-full bg-warning-soft text-warning-strong">{{ c.lateCount }} late</span></p></div>
        <div class="self-center"><UsageBar :pct="c.usedPct" /></div>
      </section>

      <DetailTabs :tabs="[{ key: 'declarations', label: 'Declarations', count: c.declarations.length }, { key: 'terms', label: 'Terms' }, { key: 'adjustment', label: 'Adjustment' }, { key: 'audit', label: 'Audit' }]">
        <template #declarations>
          <section :class="[cardClass, 'overflow-x-auto']">
            <PageState v-if="!c.declarations.length" kind="empty" title="No declarations yet">
              <Button v-if="canDeclare" size="sm" @click="router.push(`/marine/open-covers/${c.id}/declare`)">Create declaration</Button>
            </PageState>
            <table v-else class="w-full text-sm whitespace-nowrap">
              <thead class="bg-surface-muted">
                <tr class="text-xs font-semibold text-left uppercase text-ink-subtle">
                  <th class="px-3 py-2">Policy no</th><th class="px-3 py-2">Certificate no</th><th class="px-3 py-2">Sailing date</th><th class="px-3 py-2">Declared</th><th class="px-3 py-2">Vessel or truck</th><th class="px-3 py-2">Commodity</th><th class="px-3 py-2 text-right">Sum insured</th><th class="px-3 py-2 text-right">Premium (ETB)</th><th class="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="d in c.declarations" :key="d.quoteId" class="border-t border-line">
                  <td class="px-3 py-2">
                    <RouterLink v-if="d.policyId" :to="`/marine/policies/${d.policyId}`" class="font-semibold text-ink hover:text-primary">{{ d.policyNo }}</RouterLink>
                    <RouterLink v-else :to="`/marine/quotes/${d.quoteId}`" class="font-semibold text-ink hover:text-primary">{{ d.quoteNo }}</RouterLink>
                  </td>
                  <td class="px-3 py-2"><RouterLink v-if="d.certificateId" :to="`/marine/certificates/${d.certificateId}`" class="text-primary hover:underline">{{ d.certNo }}</RouterLink><span v-else class="text-ink-subtle">—</span></td>
                  <td class="px-3 py-2 whitespace-nowrap">{{ formatDate(d.sailingDate) }} <span v-if="d.late" class="ml-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-warning-soft text-warning-strong">Late</span></td>
                  <td class="px-3 py-2 whitespace-nowrap text-ink-muted">{{ formatDateTime(d.declaredAt) }}</td>
                  <td class="px-3 py-2">{{ d.vessel ?? "—" }}</td>
                  <td class="px-3 py-2 whitespace-normal min-w-[10rem]">{{ d.commodity?.description ?? "—" }}</td>
                  <td class="px-3 py-2 text-right tabular-nums">{{ d.sumInsured ? formatAmount(d.sumInsured) : "—" }}</td>
                  <td class="px-3 py-2 text-right tabular-nums">{{ d.premium ? formatAmount(d.premium) : "—" }}</td>
                  <td class="px-3 py-2"><StatusBadge :entity="d.certificateId ? 'certificate' : 'quote'" :status="d.status" /></td>
                </tr>
              </tbody>
            </table>
          </section>
        </template>
        <template #terms>
          <div class="grid gap-4">
            <section :class="[cardClass, 'p-4']">
              <KeyValueGrid
                :items="[
                  { label: 'Default clause', value: clauseLabel(c.clause) },
                  { label: 'War', value: c.warCover ? 'Covered' : 'Not covered' },
                  { label: 'Strikes', value: c.strikesCover ? 'Covered' : 'Not covered' },
                  { label: 'Declaration days', value: `${c.declarationDays} days after sailing` },
                  { label: 'Broker', value: c.broker?.name },
                  { label: 'Conveyances', value: c.conveyances?.length ? c.conveyances.map(modeLabel).join(', ') : 'Any' },
                  { label: 'Territories', value: c.territories?.length ? c.territories.join(', ') : 'Any' },
                  { label: 'Transit conditions', value: c.transitConditions || '—' },
                  { label: 'Exclusions', value: c.exclusions || '—' },
                  { label: 'Catalog version', value: c.schemaVersion || '—' },
                  { label: 'Provisional premium', value: formatMoney(c.provisionalPremium, 'ETB') },
                ]"
              />
            </section>
            <section :class="[cardClass, 'overflow-hidden max-w-2xl']">
              <table class="w-full text-sm">
                <thead class="bg-surface-muted"><tr class="text-xs font-semibold text-left uppercase text-ink-subtle"><th class="px-4 py-2">Commodity</th><th class="px-4 py-2 text-right">Agreed rate</th></tr></thead>
                <tbody>
                  <tr v-for="x in c.commodities" :key="x.hsCode" class="border-t border-line"><td class="px-4 py-2">{{ x.hsCode }} · {{ x.commodity?.description }}</td><td class="px-4 py-2 text-right tabular-nums">{{ x.ratePct }}%</td></tr>
                </tbody>
              </table>
            </section>
          </div>
        </template>
        <template #adjustment>
          <section :class="[cardClass, 'p-4 max-w-2xl']">
            <PageState v-if="!c.adjustment" kind="empty" title="Not adjusted yet" :message="c.periodTo < todayIso() ? 'Finance can run the year-end adjustment now.' : `The adjustment runs after the period ends on ${formatDate(c.periodTo)}.`">
              <Button v-if="canAdjust" size="sm" @click="adjust">Year-end adjustment</Button>
            </PageState>
            <template v-else>
              <AdjustmentStatement :statement="c.adjustment" />
              <p class="mt-3 text-xs text-ink-muted">Posted {{ formatDateTime(c.adjustment.postedAt) }} by {{ c.adjustment.postedBy }} · accounting export {{ c.adjustment.exportRef }}</p>
            </template>
          </section>
        </template>
        <template #audit>
          <section :class="[cardClass, 'p-4']"><AuditTimeline entity="openCover" :entity-id="c.id" /></section>
        </template>
      </DetailTabs>
    </template>
  </div>
</template>
