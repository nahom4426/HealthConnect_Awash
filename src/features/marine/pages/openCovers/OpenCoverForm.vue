<script setup>
// Open cover form (plan 7.2, MAR-02, MAR-04, MAR-05, MAR-29). Saving a new cover creates its
// master policy and opens the cover.
import { computed, onMounted, ref } from "vue";
import { onBeforeRouteLeave, useRoute, useRouter } from "vue-router";
import { openModal } from "@customizer/modal-x";
import Button from "@/components/Button.vue";
import { toasted } from "@/utils/utils";
import MarinePageHeader from "../../components/MarinePageHeader.vue";
import PageState from "../../components/PageState.vue";
import FormField from "../../components/FormField.vue";
import FormErrorBanner from "../../components/FormErrorBanner.vue";
import PartyPicker from "../../components/PartyPicker.vue";
import DateField from "../../components/DateField.vue";
import MoneyInput from "../../components/MoneyInput.vue";
import HsCodeAutocomplete from "../../components/HsCodeAutocomplete.vue";
import { cardClass, inputClass, inputBorder } from "../../components/styles";
import { useForm } from "../../composables/useForm";
import { createOpenCover, getOpenCover, updateOpenCover } from "../../api/marineApi";
import { notifyError } from "../../api/marineClient";
import { CLAUSES, FOREIGN_CURRENCIES } from "../../constants";
import { compare, parseDecimal } from "../../utils/money";

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
    insured: null,
    broker: null,
    periodFrom: `${y}-01-01`,
    periodTo: `${y}-12-31`,
    currency: "USD",
    annualLimit: "",
    perConveyanceLimit: "",
    declarationDays: 7,
    clause: "ICC_A",
    warCover: true,
    strikesCover: true,
    commodities: [{ commodity: null, ratePct: "" }],
    provisionalPremium: "",
  },
  {
    insured: (v) => (v ? "" : "Insured is required"),
    periodFrom: (v) => (v ? "" : "Period from is required"),
    periodTo: (v, f) => (!v ? "Period to is required" : f.periodFrom && v <= f.periodFrom ? "Period to must be after period from" : ""),
    annualLimit: (v) => ((parseDecimal(v) ?? 0n) > 0n ? "" : "Annual limit must be greater than 0"),
    perConveyanceLimit: (v, f) =>
      !((parseDecimal(v) ?? 0n) > 0n) ? "Per-conveyance limit must be greater than 0" : compare(v, f.annualLimit) > 0 ? "Per-conveyance limit can't be above the annual limit" : "",
    declarationDays: (v) => (Number.isInteger(Number(v)) && v >= 1 && v <= 60 ? "" : "Declaration days must be 1 to 60"),
    clause: (v) => (v ? "" : "Pick a default clause"),
    commodities: (rows) => {
      if (!rows.length) return "Add at least one commodity";
      const codes = rows.map((r) => r.commodity?.hsCode);
      if (codes.some((c) => !c)) return "Pick a commodity on every row";
      if (new Set(codes).size !== codes.length) return "A commodity is listed twice";
      if (rows.some((r) => !((parseDecimal(r.ratePct) ?? 0n) > 0n))) return "Every agreed rate must be greater than 0";
      return "";
    },
    provisionalPremium: (v) => (v !== "" && (parseDecimal(v) ?? -1n) >= 0n ? "" : "Provisional premium must be 0 or more"),
  },
  {
    insured: "Insured", periodFrom: "Period from", periodTo: "Period to", annualLimit: "Annual limit", perConveyanceLimit: "Per-conveyance limit",
    declarationDays: "Declaration days", clause: "Default clause", commodities: "Commodity list", provisionalPremium: "Provisional premium",
  }
);
const initial = ref("");
const dirty = computed(() => !saved && JSON.stringify(form) !== initial.value);

onMounted(async () => {
  if (editId) {
    const res = await getOpenCover(editId);
    loading.value = false;
    if (!res.ok) return (loadError.value = res.error);
    existing.value = res.data;
    Object.assign(form, {
      insured: res.data.insured,
      broker: res.data.broker,
      periodFrom: res.data.periodFrom,
      periodTo: res.data.periodTo,
      currency: res.data.currency,
      annualLimit: res.data.annualLimit,
      perConveyanceLimit: res.data.perConveyanceLimit,
      declarationDays: res.data.declarationDays,
      clause: res.data.clause,
      warCover: !!res.data.warCover,
      strikesCover: !!res.data.strikesCover,
      commodities: res.data.commodities.map((c) => ({ commodity: c.commodity, ratePct: c.ratePct })),
      provisionalPremium: res.data.provisionalPremium,
    });
  }
  initial.value = JSON.stringify(form);
});

const hasDeclarations = computed(() => (existing.value?.declarationCount ?? 0) > 0);

async function submit() {
  if (!validate()) return;
  pending.value = true;
  const body = {
    insuredId: form.insured.id,
    brokerId: form.broker?.id ?? null,
    periodFrom: form.periodFrom,
    periodTo: form.periodTo,
    currency: form.currency,
    annualLimit: form.annualLimit,
    perConveyanceLimit: form.perConveyanceLimit,
    declarationDays: Number(form.declarationDays),
    clause: form.clause,
    warCover: form.warCover,
    strikesCover: form.strikesCover,
    commodities: form.commodities.map((r) => ({ hsCode: r.commodity.hsCode, ratePct: r.ratePct })),
    provisionalPremium: form.provisionalPremium,
  };
  const res = editId ? await updateOpenCover(editId, body) : await createOpenCover(body);
  pending.value = false;
  if (!res.ok) {
    if (!applyServerError(res.error)) notifyError(res.error);
    return;
  }
  saved = true;
  toasted(true, editId ? `${res.data.coverNo} updated` : `${res.data.coverNo} created with master policy ${res.data.masterPolicyNo}`);
  router.push(`/marine/open-covers/${res.data.id}`);
}

onBeforeRouteLeave(
  () =>
    !dirty.value ||
    new Promise((resolve) =>
      openModal("MarineConfirm", { title: "Leave without saving?", message: "Your changes to this open cover will be lost.", confirmLabel: "Leave", danger: true }, (r) => resolve(!!r?.confirmed))
    )
);
</script>

<template>
  <div class="marine-page">
    <MarinePageHeader
      :title="existing ? `Edit ${existing.coverNo}` : 'New open cover'"
      :crumbs="[{ label: 'Marine' }, { label: 'Open covers', to: '/marine/open-covers' }, { label: existing?.coverNo ?? 'New' }]"
    />
    <PageState v-if="loading" kind="loading" />
    <PageState v-else-if="loadError" :kind="loadError.status === 404 ? 'notFound' : 'error'" :message="loadError.message" />
    <form v-else novalidate class="grid gap-4 max-w-5xl" @submit.prevent="submit">
      <FormErrorBanner :items="submitted ? bannerItems() : []" />
      <section :class="[cardClass, 'p-5 grid gap-5 sm:grid-cols-2']">
        <FormField v-slot="{ id, invalid }" label="Insured" name="insured" required :error="errors.insured">
          <PartyPicker :id="id" v-model="form.insured" type="INSURED" :invalid="invalid" @blur="check('insured')" />
        </FormField>
        <FormField v-slot="{ id }" label="Broker" name="broker">
          <PartyPicker :id="id" v-model="form.broker" type="BROKER" />
        </FormField>
        <FormField v-slot="{ id, invalid }" label="Period from" name="periodFrom" required :error="errors.periodFrom">
          <DateField :id="id" v-model="form.periodFrom" :invalid="invalid" @blur="check('periodFrom')" />
        </FormField>
        <FormField v-slot="{ id, invalid }" label="Period to" name="periodTo" required :error="errors.periodTo">
          <DateField :id="id" v-model="form.periodTo" :min="form.periodFrom" :invalid="invalid" @blur="check('periodTo')" />
        </FormField>
        <FormField v-slot="{ id, invalid }" label="Annual limit" name="annualLimit" required :error="errors.annualLimit" hint="Declarations use this currency">
          <MoneyInput :id="id" v-model:amount="form.annualLimit" v-model:currency="form.currency" :currencies="FOREIGN_CURRENCIES" :lock-currency="hasDeclarations" :invalid="invalid" @blur="check('annualLimit')" />
        </FormField>
        <FormField v-slot="{ id, invalid }" label="Per-conveyance limit" name="perConveyanceLimit" required :error="errors.perConveyanceLimit">
          <MoneyInput :id="id" v-model:amount="form.perConveyanceLimit" :currency="form.currency" lock-currency :invalid="invalid" @blur="check('perConveyanceLimit')" />
        </FormField>
        <FormField v-slot="{ id, invalid }" label="Declaration days" name="declarationDays" required :error="errors.declarationDays" hint="Days after sailing within which a declaration is on time">
          <input :id="id" v-model.number="form.declarationDays" type="number" min="1" max="60" :class="[inputClass, inputBorder(invalid), '!w-28 tabular-nums']" @blur="check('declarationDays')" />
        </FormField>
        <FormField v-slot="{ id, invalid }" label="Provisional premium (ETB)" name="provisionalPremium" required :error="errors.provisionalPremium" hint="Adjusted at year end against the declarations">
          <MoneyInput :id="id" v-model:amount="form.provisionalPremium" currency="ETB" :currencies="['ETB']" lock-currency :invalid="invalid" @blur="check('provisionalPremium')" />
        </FormField>
      </section>

      <section :class="[cardClass, 'p-5 grid gap-4']">
        <FormField label="Default clause" name="clause" required :error="errors.clause" hint="Locked on every declaration">
          <div class="flex flex-wrap gap-2" role="radiogroup" aria-label="Default clause">
            <label v-for="c in CLAUSES" :key="c.value" :class="['inline-flex gap-2 items-center px-3 h-10 text-sm rounded-lg border cursor-pointer', form.clause === c.value ? 'border-primary bg-primary/5 text-primary' : 'border-line text-ink']">
              <input v-model="form.clause" type="radio" :value="c.value" class="accent-[rgb(var(--primary))]" /> {{ c.label }}
            </label>
          </div>
        </FormField>
        <div class="flex flex-wrap gap-4">
          <label class="inline-flex gap-2 items-center text-sm text-ink"><input v-model="form.warCover" type="checkbox" class="accent-[rgb(var(--primary))]" /> War cover on every declaration</label>
          <label class="inline-flex gap-2 items-center text-sm text-ink"><input v-model="form.strikesCover" type="checkbox" class="accent-[rgb(var(--primary))]" /> Strikes cover on every declaration</label>
        </div>
      </section>

      <section :class="[cardClass, 'overflow-hidden']" data-field="commodities">
        <div class="flex justify-between items-center px-5 pt-4">
          <h2 class="text-sm font-semibold text-ink">Commodity list and agreed rates</h2>
          <p v-if="hasDeclarations" class="text-xs text-warning-strong">Rate changes apply to new declarations only.</p>
        </div>
        <table class="mt-2 w-full text-sm">
          <thead class="bg-surface-muted"><tr class="text-xs font-semibold text-left uppercase text-ink-subtle"><th class="px-4 py-2">Commodity</th><th class="px-4 py-2 w-40 text-right">Agreed rate %</th><th class="px-4 py-2 w-24"></th></tr></thead>
          <tbody>
            <tr v-for="(r, i) in form.commodities" :key="i" class="align-top border-t border-line">
              <td class="px-4 py-2"><HsCodeAutocomplete v-model="r.commodity" :invalid="submitted && !r.commodity" /></td>
              <td class="px-4 py-2"><input v-model="r.ratePct" inputmode="decimal" placeholder="0.2000" :aria-label="`Agreed rate % for row ${i + 1}`" :class="[inputClass, inputBorder(submitted && !(Number(r.ratePct) > 0)), 'text-right tabular-nums']" /></td>
              <td class="px-4 py-2 text-right"><button type="button" class="mt-2 text-sm font-medium text-error hover:underline disabled:opacity-40" :disabled="form.commodities.length === 1" @click="form.commodities.splice(i, 1)">Remove</button></td>
            </tr>
          </tbody>
        </table>
        <div class="flex gap-3 justify-between items-center p-3 border-t border-line">
          <Button variant="outline" size="sm" @click="form.commodities.push({ commodity: null, ratePct: '' })">Add commodity</Button>
          <span v-if="errors.commodities" class="text-xs text-error">{{ errors.commodities }}</span>
        </div>
      </section>

      <div class="flex gap-2 justify-end">
        <Button variant="outline" @click="router.back()">Cancel</Button>
        <Button html-type="submit" :pending="pending">{{ existing ? "Save changes" : "Create open cover" }}</Button>
      </div>
    </form>
  </div>
</template>
