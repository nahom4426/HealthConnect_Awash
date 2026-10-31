<script setup>
// Open cover application form: what the customer asks for. It deliberately carries no rates,
// limits or premium - those are agreed on the agreement itself, via "Establish agreement".
import { onMounted, ref } from "vue";
import { onBeforeRouteLeave, useRoute, useRouter } from "vue-router";
import Button from "@/components/Button.vue";
import { toasted } from "@/utils/utils";
import MarinePageHeader from "../../components/MarinePageHeader.vue";
import PageState from "../../components/PageState.vue";
import FormField from "../../components/FormField.vue";
import FormErrorBanner from "../../components/FormErrorBanner.vue";
import PartyPicker from "../../components/PartyPicker.vue";
import DateField from "../../components/DateField.vue";
import MoneyInput from "../../components/MoneyInput.vue";
import { cardClass, inputClass } from "../../components/styles";
import { useForm } from "../../composables/useForm";
import { createOpenCoverApplication, getOpenCoverApplication, submitOpenCoverApplication, updateOpenCoverApplication } from "../../api/marineApi";
import { notifyError } from "../../api/marineClient";
import { CLAUSES, MODES } from "../../constants";

const route = useRoute();
const router = useRouter();
const editId = route.params.id ?? null;
const loading = ref(!!editId);
const loadError = ref(null);
const existing = ref(null);
let saved = false;

const y = new Date().getFullYear();
const { form, errors, pending, check, validate, applyServerError, bannerItems, submitted } = useForm(
  {
    applicantName: "",
    applicantAddress: "",
    applicantPhone: "",
    businessActivity: "",
    insured: null,
    consignee: null,
    broker: null,
    goodsProfile: "",
    shipmentFrequency: "",
    estimatedAnnualValue: "",
    maxShipmentValue: "",
    expectedShipments: "",
    currency: "ETB",
    tradingAreas: "",
    loadingRegions: "",
    dischargeRegions: "",
    conveyances: [],
    vesselRequirements: "",
    requestedClause: "ICC_A",
    warRequested: true,
    strikesRequested: true,
    otherExtensions: "",
    periodFrom: `${y}-01-01`,
    periodTo: `${y}-12-31`,
    lossHistory: "",
    additionalRisk: "",
  },
  {
    applicantName: (v) => (v?.trim() ? "" : "Applicant name is required"),
    applicantPhone: (v) => (v?.trim() ? "" : "Applicant phone is required"),
    goodsProfile: (v) => (v?.trim() ? "" : "Describe the goods to be covered"),
    periodFrom: (v) => (v ? "" : "Period from is required"),
    periodTo: (v, f) => (!v ? "Period to is required" : f.periodFrom && v <= f.periodFrom ? "Period to must be after period from" : ""),
  },
);

onMounted(async () => {
  if (!editId) return;
  const res = await getOpenCoverApplication(editId);
  loading.value = false;
  if (!res.ok) return (loadError.value = res.error);
  const row = res.data;
  existing.value = row;
  Object.assign(form, {
    applicantName: row.applicantName ?? "",
    applicantAddress: row.applicantAddress ?? "",
    applicantPhone: row.applicantPhone ?? "",
    businessActivity: row.businessActivity ?? "",
    insured: row.insuredId ? { id: row.insuredId, name: row.insuredName } : null,
    consignee: row.consigneeId ? { id: row.consigneeId, name: row.consigneeName } : null,
    broker: row.brokerId ? { id: row.brokerId, name: row.brokerName } : null,
    goodsProfile: row.goodsProfile ?? "",
    shipmentFrequency: row.shipmentFrequency ?? "",
    estimatedAnnualValue: row.estimatedAnnualValue ?? "",
    maxShipmentValue: row.maxShipmentValue ?? "",
    expectedShipments: row.expectedShipments ?? "",
    currency: row.currency || "ETB",
    tradingAreas: row.tradingAreas ?? "",
    loadingRegions: row.loadingRegions ?? "",
    dischargeRegions: row.dischargeRegions ?? "",
    conveyances: row.conveyances ?? [],
    vesselRequirements: row.vesselRequirements ?? "",
    requestedClause: row.requestedClause || "ICC_A",
    warRequested: !!row.warRequested,
    strikesRequested: !!row.strikesRequested,
    otherExtensions: row.otherExtensions ?? "",
    periodFrom: row.periodFrom || form.periodFrom,
    periodTo: row.periodTo || form.periodTo,
    lossHistory: row.lossHistory ?? "",
    additionalRisk: row.additionalRisk ?? "",
  });
});

function body() {
  return {
    applicantName: form.applicantName.trim(),
    applicantAddress: form.applicantAddress.trim() || null,
    applicantPhone: form.applicantPhone.trim(),
    businessActivity: form.businessActivity.trim() || null,
    insuredId: form.insured?.id ?? null,
    consigneeId: form.consignee?.id ?? null,
    brokerId: form.broker?.id ?? null,
    goodsProfile: form.goodsProfile.trim(),
    shipmentFrequency: form.shipmentFrequency.trim() || null,
    estimatedAnnualValue: form.estimatedAnnualValue === "" ? null : form.estimatedAnnualValue,
    maxShipmentValue: form.maxShipmentValue === "" ? null : form.maxShipmentValue,
    expectedShipments: form.expectedShipments === "" ? null : Number(form.expectedShipments),
    currency: form.currency,
    tradingAreas: form.tradingAreas.trim() || null,
    loadingRegions: form.loadingRegions.trim() || null,
    dischargeRegions: form.dischargeRegions.trim() || null,
    conveyances: form.conveyances,
    vesselRequirements: form.vesselRequirements.trim() || null,
    requestedClause: form.requestedClause,
    warRequested: form.warRequested,
    strikesRequested: form.strikesRequested,
    otherExtensions: form.otherExtensions.trim() || null,
    periodFrom: form.periodFrom,
    periodTo: form.periodTo,
    lossHistory: form.lossHistory.trim() || null,
    additionalRisk: form.additionalRisk.trim() || null,
  };
}

async function save(thenSubmit) {
  if (!validate()) return;
  pending.value = true;
  const res = editId ? await updateOpenCoverApplication(editId, body()) : await createOpenCoverApplication(body());
  if (!res.ok) {
    pending.value = false;
    if (!applyServerError(res.error)) notifyError(res.error);
    return;
  }
  const id = res.data.id;
  if (thenSubmit) {
    const sent = await submitOpenCoverApplication(id);
    pending.value = false;
    if (!sent.ok) {
      saved = true;
      notifyError(sent.error);
      return router.push(`/marine/open-cover-applications/${id}`);
    }
    saved = true;
    toasted(true, "Application submitted for underwriting");
    return router.push(`/marine/open-cover-applications/${id}`);
  }
  pending.value = false;
  saved = true;
  toasted(true, editId ? "Application updated" : "Application saved as draft");
  router.push(`/marine/open-cover-applications/${id}`);
}

function toggleConveyance(value) {
  const i = form.conveyances.indexOf(value);
  if (i === -1) form.conveyances.push(value);
  else form.conveyances.splice(i, 1);
}

onBeforeRouteLeave(() => saved || !submitted.value || window.confirm("Leave without saving this application?"));
</script>

<template>
  <div class="marine-page">
    <MarinePageHeader
      :title="existing ? `Edit application · ${existing.applicantName}` : 'New open cover application'"
      subtitle="The customer's request. Rates and limits are agreed later, when the agreement is established."
      :crumbs="[{ label: 'Marine' }, { label: 'Open cover applications', to: '/marine/open-cover-applications' }, { label: existing ? existing.applicantName : 'New' }]"
    />
    <PageState v-if="loading" kind="loading" />
    <PageState v-else-if="loadError" :kind="loadError.status === 404 ? 'notFound' : 'error'" :message="loadError.message" />
    <form v-else novalidate class="grid gap-4 max-w-5xl" @submit.prevent="save(false)">
      <FormErrorBanner :items="submitted ? bannerItems() : []" />

      <section :class="[cardClass, 'p-5 grid gap-5 sm:grid-cols-2']">
        <h2 class="text-sm font-semibold sm:col-span-2 text-ink">Applicant</h2>
        <FormField v-slot="{ id, invalid }" label="Applicant name" name="applicantName" required :error="errors.applicantName">
          <input :id="id" v-model="form.applicantName" :class="inputClass(invalid)" @blur="check('applicantName')" />
        </FormField>
        <FormField v-slot="{ id, invalid }" label="Phone" name="applicantPhone" required :error="errors.applicantPhone">
          <input :id="id" v-model="form.applicantPhone" :class="inputClass(invalid)" @blur="check('applicantPhone')" />
        </FormField>
        <FormField v-slot="{ id }" label="Business activity" name="businessActivity">
          <input :id="id" v-model="form.businessActivity" :class="inputClass(false)" />
        </FormField>
        <FormField v-slot="{ id }" label="Address" name="applicantAddress">
          <input :id="id" v-model="form.applicantAddress" :class="inputClass(false)" />
        </FormField>
        <FormField v-slot="{ id }" label="Insured" name="insured">
          <PartyPicker :id="id" v-model="form.insured" type="INSURED" />
        </FormField>
        <FormField v-slot="{ id }" label="Consignee" name="consignee">
          <PartyPicker :id="id" v-model="form.consignee" type="CONSIGNEE" />
        </FormField>
        <FormField v-slot="{ id }" label="Broker" name="broker">
          <PartyPicker :id="id" v-model="form.broker" type="BROKER" />
        </FormField>
      </section>

      <section :class="[cardClass, 'p-5 grid gap-5 sm:grid-cols-2']">
        <h2 class="text-sm font-semibold sm:col-span-2 text-ink">Trading profile</h2>
        <FormField v-slot="{ id, invalid }" class="sm:col-span-2" label="Goods profile" name="goodsProfile" required :error="errors.goodsProfile" hint="The kinds of goods to be covered, not one shipment">
          <textarea :id="id" v-model="form.goodsProfile" rows="2" :class="inputClass(invalid)" @blur="check('goodsProfile')" />
        </FormField>
        <FormField v-slot="{ id }" label="Shipment frequency" name="shipmentFrequency">
          <input :id="id" v-model="form.shipmentFrequency" :class="inputClass(false)" placeholder="e.g. 2 to 3 a month" />
        </FormField>
        <FormField v-slot="{ id }" label="Expected shipments a year" name="expectedShipments">
          <input :id="id" v-model="form.expectedShipments" type="number" min="0" :class="inputClass(false)" />
        </FormField>
        <FormField v-slot="{ id }" label="Estimated annual value" name="estimatedAnnualValue">
          <MoneyInput :id="id" v-model:amount="form.estimatedAnnualValue" v-model:currency="form.currency" />
        </FormField>
        <FormField v-slot="{ id }" label="Maximum per shipment" name="maxShipmentValue">
          <MoneyInput :id="id" v-model:amount="form.maxShipmentValue" v-model:currency="form.currency" />
        </FormField>
        <FormField v-slot="{ id }" class="sm:col-span-2" label="Trading areas" name="tradingAreas">
          <input :id="id" v-model="form.tradingAreas" :class="inputClass(false)" />
        </FormField>
        <FormField v-slot="{ id }" label="Loading regions" name="loadingRegions">
          <input :id="id" v-model="form.loadingRegions" :class="inputClass(false)" />
        </FormField>
        <FormField v-slot="{ id }" label="Discharge regions" name="dischargeRegions">
          <input :id="id" v-model="form.dischargeRegions" :class="inputClass(false)" />
        </FormField>
        <FormField class="sm:col-span-2" label="Conveyances" name="conveyances">
          <div class="flex flex-wrap gap-3">
            <label v-for="m in MODES" :key="m.value" class="inline-flex gap-2 items-center text-sm text-ink">
              <input type="checkbox" :checked="form.conveyances.includes(m.value)" @change="toggleConveyance(m.value)" />
              {{ m.label }}
            </label>
          </div>
        </FormField>
        <FormField v-slot="{ id }" class="sm:col-span-2" label="Vessel requirements" name="vesselRequirements">
          <input :id="id" v-model="form.vesselRequirements" :class="inputClass(false)" />
        </FormField>
      </section>

      <section :class="[cardClass, 'p-5 grid gap-5 sm:grid-cols-2']">
        <h2 class="text-sm font-semibold sm:col-span-2 text-ink">Cover requested</h2>
        <FormField v-slot="{ id }" label="Institute Cargo Clause" name="requestedClause">
          <select :id="id" v-model="form.requestedClause" :class="inputClass(false)">
            <option v-for="c in CLAUSES" :key="c.value" :value="c.value">{{ c.label }}</option>
          </select>
        </FormField>
        <div class="grid gap-2 content-center">
          <label class="inline-flex gap-2 items-center text-sm text-ink"><input v-model="form.warRequested" type="checkbox" /> War risks</label>
          <label class="inline-flex gap-2 items-center text-sm text-ink"><input v-model="form.strikesRequested" type="checkbox" /> Strikes risks</label>
        </div>
        <FormField v-slot="{ id, invalid }" label="Period from" name="periodFrom" required :error="errors.periodFrom">
          <DateField :id="id" v-model="form.periodFrom" :invalid="invalid" @blur="check('periodFrom')" />
        </FormField>
        <FormField v-slot="{ id, invalid }" label="Period to" name="periodTo" required :error="errors.periodTo">
          <DateField :id="id" v-model="form.periodTo" :min="form.periodFrom" :invalid="invalid" @blur="check('periodTo')" />
        </FormField>
        <FormField v-slot="{ id }" class="sm:col-span-2" label="Other extensions requested" name="otherExtensions">
          <input :id="id" v-model="form.otherExtensions" :class="inputClass(false)" />
        </FormField>
        <FormField v-slot="{ id }" class="sm:col-span-2" label="Loss history" name="lossHistory">
          <textarea :id="id" v-model="form.lossHistory" rows="2" :class="inputClass(false)" />
        </FormField>
        <FormField v-slot="{ id }" class="sm:col-span-2" label="Additional risk information" name="additionalRisk">
          <textarea :id="id" v-model="form.additionalRisk" rows="2" :class="inputClass(false)" />
        </FormField>
      </section>

      <div class="flex flex-wrap gap-3">
        <Button html-type="submit" variant="outline" :pending="pending">{{ editId ? "Save changes" : "Save draft" }}</Button>
        <Button html-type="button" :pending="pending" @click="save(true)">Save and submit</Button>
      </div>
    </form>
  </div>
</template>
