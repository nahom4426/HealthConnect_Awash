<script setup>
// A shipment declared under an existing open cover. Parties, currency and clauses come from the agreement.
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import Button from "@/components/Button.vue";
import { toasted } from "@/utils/utils";
import MarinePageHeader from "../../components/MarinePageHeader.vue";
import PageState from "../../components/PageState.vue";
import FormField from "../../components/FormField.vue";
import FormErrorBanner from "../../components/FormErrorBanner.vue";
import VesselLookup from "../../components/VesselLookup.vue";
import PortAutocomplete from "../../components/PortAutocomplete.vue";
import HsCodeAutocomplete from "../../components/HsCodeAutocomplete.vue";
import MoneyInput from "../../components/MoneyInput.vue";
import DateField from "../../components/DateField.vue";
import KeyValueGrid from "../../components/KeyValueGrid.vue";
import { cardClass, inputClass, inputBorder } from "../../components/styles";
import { focusField, useForm } from "../../composables/useForm";
import { createDeclaration, getOpenCover, listOpenCovers, rateQuote } from "../../api/marineApi";
import { notifyError } from "../../api/marineClient";
import { INCOTERMS, MODES, clauseLabel } from "../../constants";
import { formatDate } from "../../utils/format";
import { formatMoney } from "../../utils/money";
import { declarationPayload } from "../../utils/declarationPayload";

const route = useRoute();
const router = useRouter();
const covers = ref([]);
const cover = ref(null);
const loading = ref(true);
const loadError = ref(null);
const listError = ref("");

const FIELD_FROM_API = {
  insuredId: "insuredRole",
  portOfLoading: "loadingPort",
  portOfDischarge: "dischargePort",
  finalDestination: "finalDestination",
  vesselImo: "vessel",
  hsCode: "commodity",
  invoiceValue: "invoiceValue",
  invoiceNo: "invoiceNo",
  sailingDate: "sailingDate",
  goodsDescription: "goodsDescription",
  mode: "mode",
  incoterm: "incoterm",
};

const { form, errors, pending, check, validate, applyServerError, bannerItems, submitted } = useForm(
  {
    insuredRole: "BUYER",
    incoterm: "",
    mode: "",
    vessel: null,
    loadingPort: null,
    dischargePort: null,
    finalDestination: "",
    sailingDate: "",
    commodity: null,
    goodsDescription: "",
    packing: "",
    invoiceValue: "",
    freight: "",
    invoiceNo: "",
    blNo: "",
    voyageNo: "",
  },
  {
    insuredRole: (v) => (v ? "" : "Say whether the insured is the buyer or the seller"),
    incoterm: (v) => (v ? "" : "Incoterm is required"),
    mode: (v) => (v ? "" : "Conveyance is required"),
    goodsDescription: (v) => (v?.trim() ? "" : "Goods description is required"),
    loadingPort: (v) => (v?.code ? "" : "Loading location is required"),
    dischargePort: (v) => (v?.code ? "" : "Discharge location is required"),
    finalDestination: (v) => (v?.trim() ? "" : "Final destination is required"),
    sailingDate: (v) => (v ? "" : "Shipment date is required"),
    commodity: (v) => (v?.hsCode ? "" : "Commodity is required"),
    invoiceNo: (v) => (v?.trim() ? "" : "Invoice number is required"),
    invoiceValue: (v) => (v ? "" : "Invoice value is required"),
    vessel: (v, f) => (!["SEA", "SEA_ROAD"].includes(f.mode) || v?.imo ? "" : "A vessel is required for sea modes"),
  },
  {
    cover: "Open cover agreement",
    insuredRole: "Insured is the",
    incoterm: "Incoterm",
    mode: "Conveyance",
    loadingPort: "Loading location",
    dischargePort: "Discharge location",
    finalDestination: "Final destination",
    sailingDate: "Shipment date",
    commodity: "Commodity",
    invoiceNo: "Invoice number",
    invoiceValue: "Invoice value",
    goodsDescription: "Goods description",
    vessel: "Vessel",
  }
);

watch(
  () => form.dischargePort,
  (port) => {
    if (!port) return;
    const suggestion = (port.name || port.code || "").trim();
    if (suggestion && !(form.finalDestination || "").trim()) form.finalDestination = suggestion;
  }
);

const modes = computed(() => {
  const allowed = cover.value?.conveyances ?? [];
  return allowed.length ? MODES.filter((mode) => allowed.includes(mode.value)) : MODES;
});

onMounted(async () => {
  const listed = await listOpenCovers({ status: "ACTIVE", size: 50 });
  if (listed.ok) covers.value = listed.data.content ?? [];
  else listError.value = listed.error?.message || "Active open covers could not be loaded.";
  if (route.params.coverId) await choose(route.params.coverId);
  loading.value = false;
});

watch(() => route.params.coverId, (id) => id && choose(id));

async function choose(id) {
  if (!id) {
    cover.value = null;
    loadError.value = null;
    return;
  }
  loadError.value = null;
  const res = await getOpenCover(id);
  if (!res.ok) {
    cover.value = null;
    loadError.value = res.error;
    return;
  }
  if (res.data.status !== "ACTIVE") {
    cover.value = null;
    loadError.value = { message: `Open cover ${res.data.coverNo} is ${res.data.status} and cannot take declarations.` };
    return;
  }
  cover.value = res.data;
  if (modes.value.length === 1) form.mode = modes.value[0].value;
}

function showFieldErrors(next) {
  submitted.value = true;
  errors.value = next;
  const first = Object.keys(next)[0];
  if (first) focusField(first);
  toasted(false, null, Object.values(next)[0] || "Some fields need attention.");
}

async function submit() {
  if (!cover.value) {
    showFieldErrors({ cover: "Select an active open cover agreement" });
    return;
  }
  if (!validate()) {
    const first = Object.keys(errors.value)[0];
    if (first) focusField(first);
    toasted(false, null, Object.values(errors.value)[0] || "Some fields need attention.");
    return;
  }
  pending.value = true;
  try {
    const res = await createDeclaration(cover.value.id, declarationPayload(cover.value, form));
    if (!res.ok) {
      const mapped = res.error?.fields?.length
        ? {
            ...res.error,
            fields: res.error.fields.map((field) => ({
              ...field,
              field: FIELD_FROM_API[field.field] || field.field,
            })),
          }
        : res.error;
      if (applyServerError(mapped)) {
        const first = Object.keys(errors.value)[0];
        if (first) focusField(first);
        toasted(false, null, Object.values(errors.value)[0] || res.error.message || "Some fields need attention.");
      } else {
        notifyError(res.error);
      }
      return;
    }
    const created = res.data;
    const rated = await rateQuote(created.id);
    if (rated.ok) {
      toasted(true, `Declaration ${rated.data.quoteNo} rated. Review underwriting, then bind to issue the certificate.`);
      router.push({ path: `/marine/quotes/${rated.data.id}`, query: { tab: "underwriting" } });
      return;
    }
    const fieldMsg = (rated.error?.fields || []).map((f) => f.message).filter(Boolean).join(" ");
    const reason = fieldMsg || rated.error?.message || "Use Rate declaration to run underwriting.";
    toasted(false, null, `Declaration ${created.quoteNo} saved. ${reason}`);
    router.push({ path: `/marine/quotes/${created.id}`, query: { tab: "underwriting" } });
  } finally {
    pending.value = false;
  }
}
</script>

<template>
  <div class="marine-page">
    <MarinePageHeader
      title="Create declaration"
      subtitle="The open cover supplies the insured, broker, currency, clause and rates. This form records the shipment."
      :crumbs="[{ label: 'Marine' }, { label: 'Declarations', to: '/marine/declarations' }, { label: 'New' }]"
    />
    <PageState v-if="loading" kind="loading" />
    <PageState v-else-if="loadError && route.params.coverId" kind="error" :message="loadError.message" />
    <form v-else class="grid gap-4 max-w-5xl" novalidate @submit.prevent="submit">
      <FormErrorBanner :items="submitted ? bannerItems() : []" />
      <section :class="[cardClass, 'p-5 grid gap-4']">
        <FormField v-slot="{ id }" label="Open cover agreement" name="cover" required :error="errors.cover || loadError?.message">
          <select :id="id" class="h-10 px-3 rounded-lg border border-line bg-surface" :value="cover?.id ?? ''" @change="choose($event.target.value)">
            <option value="">Select an active agreement</option>
            <option v-for="row in covers" :key="row.id" :value="row.id">{{ row.coverNo }} · {{ row.insured?.name }}</option>
          </select>
        </FormField>
        <p v-if="listError" class="text-sm text-error">{{ listError }}</p>
        <p v-else-if="!covers.length" class="text-sm text-ink-muted">
          No active open cover yet. Finalise Open Cover terms on an Open Cover quotation first, then declare shipments here.
          <RouterLink class="font-medium text-primary hover:underline" to="/marine/open-covers">Open covers</RouterLink>
        </p>
        <KeyValueGrid
          v-if="cover"
          :cols="2"
          :items="[
            { label: 'Cover number', value: cover.coverNo },
            { label: 'Insured', value: cover.insured?.name },
            { label: 'Broker', value: cover.broker?.name },
            { label: 'Period', value: `${formatDate(cover.periodFrom)} – ${formatDate(cover.periodTo)}` },
            { label: 'Clause', value: clauseLabel(cover.clause) },
            { label: 'Currency', value: cover.currency },
            { label: 'Per shipment', value: formatMoney(cover.perConveyanceLimit, cover.currency) },
            { label: 'Annual capacity left', value: formatMoney(cover.remaining, cover.currency) },
            { label: 'Conveyances', value: (cover.conveyances || []).map((mode) => MODES.find((row) => row.value === mode)?.label || mode).join(', ') || 'Any' },
            { label: 'War', value: cover.warCover ? 'Covered' : 'Not covered' },
            { label: 'Strikes', value: cover.strikesCover ? 'Covered' : 'Not covered' },
            { label: 'Agreed rates', value: (cover.commodities || []).map((row) => `${row.hsCode} ${row.ratePct}%`).join(', ') || 'None', wide: true },
            { label: 'Territories', value: (cover.territories || []).join(', ') || 'No territory limit', wide: true },
          ]"
        />
        <p v-if="cover" class="text-sm text-ink-muted">
          A shipment outside the period, goods, route, conveyance, or limits is referred on the declaration. A repeated invoice and bill of lading is rejected. Capacity is the sum insured, not the premium. Supporting files are not stored on the declaration.
        </p>
      </section>
      <section v-if="cover" :class="[cardClass, 'p-5 grid gap-5 sm:grid-cols-2']">
        <FormField v-slot="{ id, invalid }" label="Insured is the" name="insuredRole" required :error="errors.insuredRole">
          <select :id="id" v-model="form.insuredRole" :class="[inputClass, inputBorder(invalid)]">
            <option value="BUYER">Buyer</option>
            <option value="SELLER">Seller</option>
          </select>
        </FormField>
        <FormField v-slot="{ id, invalid }" label="Incoterm" name="incoterm" required :error="errors.incoterm">
          <select :id="id" v-model="form.incoterm" :class="[inputClass, inputBorder(invalid)]">
            <option value="">Select</option>
            <option v-for="term in INCOTERMS" :key="term" :value="term">{{ term }}</option>
          </select>
        </FormField>
        <FormField v-slot="{ id, invalid }" label="Conveyance" name="mode" required :error="errors.mode">
          <select :id="id" v-model="form.mode" :class="[inputClass, inputBorder(invalid)]">
            <option value="">Select</option>
            <option v-for="mode in modes" :key="mode.value" :value="mode.value">{{ mode.label }}</option>
          </select>
        </FormField>
        <FormField v-slot="{ id }" label="Vessel" name="vessel">
          <VesselLookup :id="id" v-model="form.vessel" />
        </FormField>
        <FormField v-slot="{ id }" label="Voyage or flight number" name="voyageNo">
          <input :id="id" v-model="form.voyageNo" :class="inputClass" />
        </FormField>
        <FormField v-slot="{ id, invalid }" label="Loading location" name="loadingPort" required :error="errors.loadingPort">
          <PortAutocomplete :id="id" v-model="form.loadingPort" :invalid="invalid" />
        </FormField>
        <FormField v-slot="{ id, invalid }" label="Discharge location" name="dischargePort" required :error="errors.dischargePort">
          <PortAutocomplete :id="id" v-model="form.dischargePort" :invalid="invalid" />
        </FormField>
        <FormField v-slot="{ id, invalid }" label="Final destination" name="finalDestination" required :error="errors.finalDestination" hint="Defaults from the discharge location; change it if the goods continue inland.">
          <input :id="id" v-model="form.finalDestination" :class="[inputClass, inputBorder(invalid)]" @blur="check('finalDestination')" />
        </FormField>
        <FormField v-slot="{ id, invalid }" label="Shipment date" name="sailingDate" required :error="errors.sailingDate">
          <DateField :id="id" v-model="form.sailingDate" :invalid="invalid" @blur="check('sailingDate')" />
        </FormField>
        <FormField v-slot="{ id, invalid }" label="Goods description" name="goodsDescription" required :error="errors.goodsDescription" class="sm:col-span-2">
          <textarea :id="id" v-model="form.goodsDescription" rows="3" :class="[inputClass, inputBorder(invalid)]" @blur="check('goodsDescription')" />
        </FormField>
        <FormField v-slot="{ id, invalid }" label="Commodity" name="commodity" required :error="errors.commodity">
          <HsCodeAutocomplete :id="id" v-model="form.commodity" :invalid="invalid" :allowed="cover.commodities?.length ? cover.commodities.map((row) => row.hsCode) : null" />
        </FormField>
        <FormField v-slot="{ id }" label="Packing" name="packing">
          <input :id="id" v-model="form.packing" :class="inputClass" />
        </FormField>
        <FormField v-slot="{ id, invalid }" label="Invoice number" name="invoiceNo" required :error="errors.invoiceNo">
          <input :id="id" v-model="form.invoiceNo" :class="[inputClass, inputBorder(invalid)]" @blur="check('invoiceNo')" />
        </FormField>
        <FormField v-slot="{ id }" label="Bill of lading or airway bill" name="blNo">
          <input :id="id" v-model="form.blNo" :class="inputClass" />
        </FormField>
        <FormField v-slot="{ id, invalid }" label="Invoice value" name="invoiceValue" required :error="errors.invoiceValue">
          <MoneyInput :id="id" v-model:amount="form.invoiceValue" :currency="cover.currency" lock-currency :invalid="invalid" />
        </FormField>
        <FormField v-slot="{ id }" label="Freight" name="freight">
          <MoneyInput :id="id" v-model:amount="form.freight" :currency="cover.currency" lock-currency />
        </FormField>
        <div class="sm:col-span-2">
          <Button html-type="submit" :pending="pending">Save declaration</Button>
        </div>
      </section>
    </form>
  </div>
</template>
