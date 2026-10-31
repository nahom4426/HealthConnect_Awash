<script setup>
// Open cover application detail: what the customer asked for, and the decision on it.
// An application carries no rates, limits or premium - those are agreed when it is established,
// which is why "Establish agreement" hands over to OpenCoverForm rather than editing here.
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import Button from "@/components/Button.vue";
import MarinePageHeader from "../../components/MarinePageHeader.vue";
import PageState from "../../components/PageState.vue";
import KeyValueGrid from "../../components/KeyValueGrid.vue";
import StatusBadge from "../../components/StatusBadge.vue";
import DetailTabs from "../../components/DetailTabs.vue";
import { cardClass } from "../../components/styles";
import { useResource } from "../../composables/useResource";
import { useCan } from "../../composables/useCan";
import { getOpenCoverApplication, submitOpenCoverApplication, declineOpenCoverApplication } from "../../api/marineApi";
import { clauseLabel, modeLabel } from "../../constants";
import { formatMoney } from "../../utils/money";
import { formatDate, formatDateTime } from "../../utils/format";
import { toasted } from "@/utils/utils";
import { notifyError } from "../../api/marineClient";

const route = useRoute();
const router = useRouter();
const { roles } = useCan();
const has = (...r) => r.some((x) => roles.value.includes(x));
const { data: a, loading, error, notFound, load, reload } = useResource(getOpenCoverApplication);
onMounted(() => load(route.params.id));

const pending = ref(false);
const canEdit = computed(() => a.value?.status === "DRAFT" && has("BROKER", "UNDERWRITER", "SENIOR_UNDERWRITER"));
const canSubmit = computed(() => a.value?.status === "DRAFT" && has("BROKER", "UNDERWRITER", "SENIOR_UNDERWRITER"));
const canDecide = computed(() => a.value?.status === "SUBMITTED" && has("UNDERWRITER", "SENIOR_UNDERWRITER"));

async function submit() {
  pending.value = true;
  const res = await submitOpenCoverApplication(route.params.id);
  pending.value = false;
  if (!res.ok) return notifyError(res.error);
  toasted(true, "Application submitted for underwriting");
  reload();
}

async function decline() {
  const note = window.prompt("Reason for declining this application");
  if (note === null) return;
  pending.value = true;
  const res = await declineOpenCoverApplication(route.params.id, { note });
  pending.value = false;
  if (!res.ok) return notifyError(res.error);
  toasted(true, "Application declined");
  reload();
}

const applicant = computed(() => [
  { label: "Applicant", value: a.value.applicantName },
  { label: "Phone", value: a.value.applicantPhone },
  { label: "Business activity", value: a.value.businessActivity },
  { label: "Address", value: a.value.applicantAddress, wide: true },
  { label: "Insured", value: a.value.insuredName },
  { label: "Consignee", value: a.value.consigneeName },
  { label: "Broker", value: a.value.brokerName },
]);

const trading = computed(() => [
  { label: "Goods profile", value: a.value.goodsProfile, wide: true },
  { label: "Shipment frequency", value: a.value.shipmentFrequency },
  { label: "Expected shipments", value: a.value.expectedShipments },
  { label: "Estimated annual value", value: formatMoney(a.value.estimatedAnnualValue, a.value.currency) },
  { label: "Max per shipment", value: formatMoney(a.value.maxShipmentValue, a.value.currency) },
  { label: "Trading areas", value: a.value.tradingAreas, wide: true },
  { label: "Loading regions", value: a.value.loadingRegions },
  { label: "Discharge regions", value: a.value.dischargeRegions },
  { label: "Conveyances", value: (a.value.conveyances ?? []).map(modeLabel).join(", ") },
  { label: "Vessel requirements", value: a.value.vesselRequirements, wide: true },
]);

const cover = computed(() => [
  { label: "Requested clause", value: clauseLabel(a.value.requestedClause) },
  { label: "War risks", value: a.value.warRequested ? "Requested" : "Not requested" },
  { label: "Strikes risks", value: a.value.strikesRequested ? "Requested" : "Not requested" },
  { label: "Proposed period", value: `${formatDate(a.value.periodFrom)} – ${formatDate(a.value.periodTo)}` },
  { label: "Other extensions", value: a.value.otherExtensions, wide: true },
  { label: "Loss history", value: a.value.lossHistory, wide: true },
  { label: "Additional risk", value: a.value.additionalRisk, wide: true },
]);
</script>

<template>
  <div class="marine-page">
    <PageState v-if="loading && !a" kind="loading" />
    <template v-else-if="notFound">
      <MarinePageHeader title="Application not found" :crumbs="[{ label: 'Marine' }, { label: 'Open cover applications', to: '/marine/open-cover-applications' }]" />
      <PageState kind="notFound">
        <RouterLink to="/marine/open-cover-applications"><Button variant="outline" size="sm">Back to applications</Button></RouterLink>
      </PageState>
    </template>
    <PageState v-else-if="error" kind="error" :message="error.message" @retry="load(route.params.id)" />
    <template v-else-if="a">
      <MarinePageHeader
        :title="a.applicantName"
        :status="a.status"
        entity="openCoverApplication"
        :subtitle="`${a.insuredName ?? 'No insured selected'} · received ${formatDate(a.createdAt)}`"
        :crumbs="[{ label: 'Marine' }, { label: 'Open cover applications', to: '/marine/open-cover-applications' }, { label: a.applicantName }]"
      >
        <template #actions>
          <Button v-if="canEdit" variant="outline" @click="router.push(`/marine/open-cover-applications/${a.id}/edit`)">Edit</Button>
          <Button v-if="canSubmit" :pending="pending" @click="submit">Submit</Button>
          <Button v-if="canDecide" variant="outline" :pending="pending" @click="decline">Decline</Button>
          <Button v-if="canDecide" :pending="pending" @click="router.push(`/marine/open-cover-applications/${a.id}/establish`)">Establish agreement</Button>
          <RouterLink v-if="a.openCoverId" :to="`/marine/open-covers/${a.openCoverId}`"><Button variant="outline">View agreement</Button></RouterLink>
        </template>
      </MarinePageHeader>

      <DetailTabs :tabs="[{ key: 'applicant', label: 'Applicant' }, { key: 'trading', label: 'Trading profile' }, { key: 'cover', label: 'Cover requested' }, { key: 'decision', label: 'Decision' }]">
        <template #applicant><div :class="cardClass"><KeyValueGrid :items="applicant" /></div></template>
        <template #trading><div :class="cardClass"><KeyValueGrid :items="trading" /></div></template>
        <template #cover><div :class="cardClass"><KeyValueGrid :items="cover" /></div></template>
        <template #decision>
          <div :class="cardClass">
            <KeyValueGrid
              :items="[
                { label: 'Status', value: a.status },
                { label: 'Decided by', value: a.decidedBy },
                { label: 'Decided at', value: a.decidedAt ? formatDateTime(a.decidedAt) : null },
                { label: 'Note', value: a.decisionNote, wide: true },
              ]"
            >
              <template #value-Status><StatusBadge entity="openCoverApplication" :status="a.status" /></template>
            </KeyValueGrid>
          </div>
        </template>
      </DetailTabs>
    </template>
  </div>
</template>
