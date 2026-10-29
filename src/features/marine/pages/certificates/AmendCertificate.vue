<script setup>
// Amend a certificate (plan 6.5, MAR-39): change vessel, sailing date, values, LC or special
// conditions with a reason; the preview shows old and new premium and fresh screenings before the
// next version is issued. A change that would refer can't be submitted (open question 6).
import { computed, onMounted, reactive, ref, watch } from "vue";
import { onBeforeRouteLeave, useRoute, useRouter } from "vue-router";
import { openModal } from "@customizer/modal-x";
import Button from "@/components/Button.vue";
import { toasted } from "@/utils/utils";
import MarinePageHeader from "../../components/MarinePageHeader.vue";
import PageState from "../../components/PageState.vue";
import FormField from "../../components/FormField.vue";
import VesselLookup from "../../components/VesselLookup.vue";
import DateField from "../../components/DateField.vue";
import MoneyInput from "../../components/MoneyInput.vue";
import PartyPicker from "../../components/PartyPicker.vue";
import KeyValueGrid from "../../components/KeyValueGrid.vue";
import StatusBadge from "../../components/StatusBadge.vue";
import { cardClass, inputClass, inputBorder } from "../../components/styles";
import { amendCertificate, getCertificate, getPolicy } from "../../api/marineApi";
import { notifyError } from "../../api/marineClient";
import { clauseLabel, reasonLabel } from "../../constants";
import { addDays, formatDate } from "../../utils/format";
import { formatMoney } from "../../utils/money";

const route = useRoute();
const router = useRouter();
const cert = ref(null);
const policy = ref(null);
const loadError = ref(null);
const form = reactive({ vessel: null, sailingDate: "", invoiceValue: "", freight: "", lcEnabled: false, lcNumber: "", lcBank: null, lcAmount: "", lcExpiry: "", specialConditions: "" });
const original = ref(null);
const reason = ref("");
const errors = ref({});
const preview = ref(null);
const previewing = ref(false);
const submitting = ref(false);
let done = false;

onMounted(async () => {
  const c = await getCertificate(route.params.id);
  if (!c.ok) return (loadError.value = c.error);
  const p = await getPolicy(c.data.policy.id);
  if (!p.ok) return (loadError.value = p.error);
  cert.value = c.data;
  policy.value = p.data;
  Object.assign(form, {
    vessel: p.data.vessel,
    sailingDate: p.data.sailingDate,
    invoiceValue: p.data.invoiceValue,
    freight: p.data.freight,
    lcEnabled: !!p.data.lc?.enabled,
    lcNumber: p.data.lc?.number ?? "",
    lcBank: p.data.lcBank,
    lcAmount: p.data.lc?.amount ?? "",
    lcExpiry: p.data.lc?.expiry ?? "",
    specialConditions: p.data.specialConditions ?? "",
  });
  original.value = JSON.stringify(form);
});

const changes = computed(() => {
  if (!policy.value) return {};
  const p = policy.value;
  const out = {};
  if ((form.vessel?.imo ?? null) !== (p.vessel?.imo ?? null)) out.vesselImo = form.vessel?.imo ?? null;
  if (form.sailingDate !== p.sailingDate) out.sailingDate = form.sailingDate;
  if (form.invoiceValue !== p.invoiceValue) out.invoiceValue = form.invoiceValue;
  if (form.freight !== p.freight) out.freight = form.freight;
  if (form.specialConditions !== (p.specialConditions ?? "")) out.specialConditions = form.specialConditions;
  const lc = form.lcEnabled ? { enabled: true, number: form.lcNumber, bankId: form.lcBank?.id ?? null, amount: form.lcAmount, expiry: form.lcExpiry } : { enabled: false };
  const was = p.lc?.enabled ? { enabled: true, number: p.lc.number, bankId: p.lc.bankId, amount: p.lc.amount, expiry: p.lc.expiry } : { enabled: false };
  if (JSON.stringify(lc) !== JSON.stringify(was)) out.lc = lc;
  return out;
});
const changed = (key) => key in changes.value;
const hl = (key) => (changed(key) ? "ring-2 ring-warning/60 rounded-lg" : "");
const dirty = computed(() => Object.keys(changes.value).length > 0);

// Preview whenever the changes settle
let timer;
watch(
  changes,
  () => {
    clearTimeout(timer);
    preview.value = null;
    if (dirty.value) timer = setTimeout(runPreview, 500);
  },
  { deep: true }
);

async function runPreview() {
  previewing.value = true;
  const res = await amendCertificate(cert.value.id, { dryRun: true, changes: changes.value });
  previewing.value = false;
  if (res.ok) {
    preview.value = res.data;
    errors.value = {};
  } else if (res.error.status === 422) errors.value = res.error.fieldMap();
  else notifyError(res.error);
}

const blocked = computed(() => !!preview.value?.referralReasons?.length);

async function submit() {
  const e = {};
  if (!dirty.value) e.form = "Change at least one field.";
  if (reason.value.trim().length < 10) e.reason = "Give a reason of at least 10 characters";
  if (form.lcEnabled && form.lcExpiry && form.sailingDate && form.lcExpiry <= form.sailingDate) e["lc.expiry"] = "LC expiry must be after the sailing date";
  errors.value = e;
  if (Object.keys(e).length || blocked.value) return;
  submitting.value = true;
  const res = await amendCertificate(cert.value.id, { changes: changes.value, reason: reason.value.trim() });
  submitting.value = false;
  if (!res.ok) {
    if (res.error.status === 422) errors.value = res.error.fieldMap();
    else notifyError(res.error);
    return;
  }
  toasted(true, `Version ${res.data.version} issued`);
  done = true;
  router.push(`/marine/certificates/${res.data.id}`);
}

onBeforeRouteLeave(
  () =>
    done ||
    !dirty.value ||
    new Promise((resolve) =>
      openModal("MarineConfirm", { title: "Leave without saving?", message: "The amendment won't be issued.", confirmLabel: "Leave", danger: true }, (r) => resolve(!!r?.confirmed))
    )
);
</script>

<template>
  <div class="marine-page">
    <PageState v-if="!cert && !loadError" kind="loading" />
    <PageState v-else-if="loadError" :kind="loadError.status === 404 ? 'notFound' : 'error'" :message="loadError.message" />
    <template v-else>
      <MarinePageHeader
        :title="`Amend ${cert.certNo} v${cert.version}`"
        :status="cert.status"
        entity="certificate"
        subtitle="Changed fields are highlighted. Issuing creates the next version; the current one becomes Superseded."
        :crumbs="[{ label: 'Marine' }, { label: 'Certificates', to: '/marine/certificates' }, { label: cert.certNo, to: `/marine/certificates/${cert.id}` }, { label: 'Amend' }]"
      />
      <p v-if="errors.form" role="alert" class="p-3 mb-4 text-sm rounded-xl bg-error-soft text-error-strong">{{ errors.form }}</p>

      <div class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem] items-start">
        <div class="grid gap-4">
          <section :class="[cardClass, 'p-4']">
            <h2 class="mb-3 text-sm font-semibold text-ink">Not changeable here</h2>
            <KeyValueGrid
              :items="[
                { label: 'Insured', value: policy.insured?.name },
                { label: 'Voyage', value: `${policy.loadingPort?.name ?? '—'} → ${policy.dischargePort?.name ?? '—'}` },
                { label: 'Commodity', value: policy.commodity ? `${policy.commodity.hsCode} · ${policy.commodity.description}` : null },
                { label: 'Clause', value: clauseLabel(policy.clause) },
                { label: 'Currency', value: policy.currency },
              ]"
            />
          </section>
          <section :class="[cardClass, 'p-4 grid gap-4 sm:grid-cols-2']">
            <FormField v-if="policy.mode !== 'AIR' && policy.product !== 'INLAND_TRANSIT'" v-slot="{ id }" label="Vessel" name="vesselImo" :error="errors.vesselImo" :class="['sm:col-span-2 p-1', hl('vesselImo')]">
              <VesselLookup :id="id" v-model="form.vessel" />
            </FormField>
            <FormField v-slot="{ id, invalid }" label="Sailing date" name="sailingDate" :error="errors.sailingDate" :class="['p-1', hl('sailingDate')]">
              <DateField :id="id" v-model="form.sailingDate" :invalid="invalid" />
            </FormField>
            <div class="hidden sm:block" />
            <FormField v-slot="{ id, invalid }" label="Invoice value" name="invoiceValue" :error="errors.invoiceValue" :class="['p-1', hl('invoiceValue')]">
              <MoneyInput :id="id" v-model:amount="form.invoiceValue" :currency="policy.currency" lock-currency :invalid="invalid" />
            </FormField>
            <FormField v-slot="{ id, invalid }" label="Freight" name="freight" :error="errors.freight" :class="['p-1', hl('freight')]">
              <MoneyInput :id="id" v-model:amount="form.freight" :currency="policy.currency" lock-currency :invalid="invalid" />
            </FormField>
            <div :class="['sm:col-span-2 p-3 rounded-xl border border-line', hl('lc')]">
              <label class="flex gap-2 items-center text-sm font-semibold text-ink"><input v-model="form.lcEnabled" type="checkbox" class="accent-[rgb(var(--primary))]" /> Letter of credit and loss payee</label>
              <div v-if="form.lcEnabled" class="grid gap-4 mt-3 sm:grid-cols-2">
                <FormField v-slot="{ id }" label="LC number" name="lc.number"><input :id="id" v-model="form.lcNumber" :class="[inputClass, 'border-line']" /></FormField>
                <FormField v-slot="{ id }" label="Issuing bank" name="lc.bank"><PartyPicker :id="id" v-model="form.lcBank" type="BANK" /></FormField>
                <FormField v-slot="{ id }" label="LC amount" name="lc.amount"><MoneyInput :id="id" v-model:amount="form.lcAmount" :currency="policy.currency" lock-currency /></FormField>
                <FormField v-slot="{ id, invalid }" label="LC expiry" name="lc.expiry" :error="errors['lc.expiry']"><DateField :id="id" v-model="form.lcExpiry" :min="form.sailingDate ? addDays(form.sailingDate, 1) : undefined" :invalid="invalid" /></FormField>
              </div>
            </div>
            <FormField v-slot="{ id }" label="Special conditions" name="specialConditions" :class="['sm:col-span-2 p-1', hl('specialConditions')]">
              <textarea :id="id" v-model="form.specialConditions" rows="3" maxlength="2000" :class="[inputClass, 'border-line h-auto py-2']" />
            </FormField>
            <FormField v-slot="{ id, invalid }" label="Reason for amendment" name="reason" required :error="errors.reason" class="sm:col-span-2">
              <textarea :id="id" v-model="reason" rows="2" :class="[inputClass, inputBorder(invalid), 'h-auto py-2']" placeholder="e.g. Final commercial invoice received" />
            </FormField>
          </section>
        </div>

        <aside :class="[cardClass, 'p-4 xl:sticky xl:top-4']" aria-live="polite" aria-labelledby="am-preview">
          <h2 id="am-preview" class="mb-3 text-sm font-semibold text-ink">Preview</h2>
          <p v-if="!dirty" class="text-sm text-ink-muted">Change a field to see the new premium.</p>
          <p v-else-if="previewing || !preview" class="text-sm text-ink-muted">Calculating…</p>
          <template v-else>
            <dl class="grid grid-cols-3 gap-2 text-sm">
              <div><dt class="text-xs text-ink-subtle">Old premium</dt><dd class="tabular-nums text-ink">{{ formatMoney(preview.oldPremium, "ETB") }}</dd></div>
              <div><dt class="text-xs text-ink-subtle">New premium</dt><dd class="font-semibold tabular-nums text-ink">{{ formatMoney(preview.newPremium, "ETB") }}</dd></div>
              <div><dt class="text-xs text-ink-subtle">Difference</dt><dd :class="['font-semibold tabular-nums', Number(preview.difference) > 0 ? 'text-warning-strong' : 'text-success-strong']">{{ Number(preview.difference) > 0 ? "+" : "" }}{{ formatMoney(preview.difference, "ETB") }}</dd></div>
            </dl>
            <p class="mt-2 text-xs text-ink-muted">Sum insured {{ formatMoney(preview.oldSumInsured, policy.currency) }} → {{ formatMoney(preview.newSumInsured, policy.currency) }}</p>
            <ul v-if="preview.screenings.length" class="mt-3 space-y-1 text-sm">
              <li v-for="s in preview.screenings" :key="s.key" class="flex justify-between items-center"><span>{{ s.type }}: {{ s.name }}</span><StatusBadge entity="screening" :status="s.result" /></li>
            </ul>
            <div v-if="blocked" role="alert" class="p-3 mt-3 rounded-xl bg-warning-soft">
              <p class="text-sm font-semibold text-warning-strong">This change needs underwriting referral, so it can't be issued here</p>
              <ul class="mt-1 text-sm text-ink"><li v-for="(x, i) in preview.referralReasons" :key="i">{{ reasonLabel(x.code) }}: {{ x.message }}</li></ul>
            </div>
          </template>
          <Button class="mt-4" full-width :disabled="!dirty || blocked || previewing" :pending="submitting" @click="submit">Issue version {{ cert.version + 1 }}</Button>
          <p class="mt-2 text-xs text-ink-subtle">Sailing date {{ formatDate(form.sailingDate) }}</p>
        </aside>
      </div>
    </template>
  </div>
</template>
