<script setup>
// Register a claim (plan 8.2, MAR-41, MAR-46): find the certificate, enter the loss, keep or change
// the payee. ?certificateId= pre-fills the certificate (from the policy's Claims tab).
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import Button from "@/components/Button.vue";
import { toasted } from "@/utils/utils";
import MarinePageHeader from "../../components/MarinePageHeader.vue";
import FormField from "../../components/FormField.vue";
import FormErrorBanner from "../../components/FormErrorBanner.vue";
import DateField from "../../components/DateField.vue";
import MoneyInput from "../../components/MoneyInput.vue";
import PartyPicker from "../../components/PartyPicker.vue";
import KeyValueGrid from "../../components/KeyValueGrid.vue";
import StatusBadge from "../../components/StatusBadge.vue";
import { cardClass, inputClass, inputBorder } from "../../components/styles";
import { useForm } from "../../composables/useForm";
import { createClaim, getCertificate, listCertificates } from "../../api/marineApi";
import { notifyError } from "../../api/marineClient";
import { CAUSES_OF_LOSS, CLAIM_TYPES, clauseLabel } from "../../constants";
import { formatDate, todayIso } from "../../utils/format";
import { formatMoney, parseDecimal } from "../../utils/money";

const route = useRoute();
const router = useRouter();
const cert = ref(null);
const search = ref("");
const results = ref([]);
const searching = ref(false);

const { form, errors, pending, check, validate, applyServerError, bannerItems, submitted } = useForm(
  { lossDate: "", notifiedDate: todayIso(), deliveryDate: "", type: "", cause: "", description: "", estimatedAmount: "", payee: null, payeeNote: "" },
  {
    lossDate: (v) => (!v ? "Loss date is required" : v > todayIso() ? "Loss date can't be in the future" : ""),
    notifiedDate: (v, f) => (!v ? "Notified date is required" : f.lossDate && v < f.lossDate ? "Notified date can't be before the loss date" : ""),
    deliveryDate: (v, f) => (v && f.lossDate && v < f.lossDate ? "Delivery date can't be before the loss date" : ""),
    type: (v) => (v ? "" : "Pick a claim type"),
    cause: (v) => (v ? "" : "Pick a cause of loss"),
    description: (v) => (!v.trim() ? "Description is required" : v.length > 2000 ? "At most 2000 characters" : ""),
    estimatedAmount: (v) => ((parseDecimal(v) ?? 0n) > 0n ? "" : "Estimated amount must be greater than 0"),
    payee: (v) => (v ? "" : "Payee is required"),
  },
  { lossDate: "Loss date", notifiedDate: "Notified date", deliveryDate: "Delivery date", type: "Claim type", cause: "Cause of loss", description: "Description", estimatedAmount: "Estimated amount", payee: "Payee" }
);

async function pick(c) {
  if (c.status === "CANCELLED") return;
  const res = await getCertificate(c.id);
  if (!res.ok) return notifyError(res.error);
  cert.value = res.data;
  form.payee = res.data.lcBank ?? res.data.insured;
  results.value = [];
}

let timer;
watch(search, (q) => {
  clearTimeout(timer);
  if (!q.trim()) return (results.value = []);
  timer = setTimeout(async () => {
    searching.value = true;
    // Certificate no or BL no through the list's search; an IMO through its vessel filter
    const res = /^\d{7}$/.test(q.trim()) ? await listCertificates({ vesselImo: q.trim(), size: 10 }) : await listCertificates({ q: q.trim(), size: 10 });
    searching.value = false;
    results.value = res.ok ? res.data.content : [];
  }, 300);
});

onMounted(() => route.query.certificateId && pick({ id: String(route.query.certificateId) }));

const outsidePeriod = computed(() => cert.value && form.lossDate && (form.lossDate < cert.value.policy.periodFrom || form.lossDate > cert.value.policy.periodTo));
const payeeChanged = computed(() => cert.value?.lcBank && form.payee && form.payee.id !== cert.value.lcBank.id);

async function submit() {
  const ok = validate();
  if (!cert.value) errors.value = { ...errors.value, certificate: "Find the certificate first" };
  if (!ok || !cert.value) return;
  pending.value = true;
  const res = await createClaim({
    certificateId: cert.value.id,
    lossDate: form.lossDate,
    notifiedDate: form.notifiedDate,
    deliveryDate: form.deliveryDate || null,
    type: form.type,
    cause: form.cause,
    description: form.description.trim(),
    estimatedAmount: form.estimatedAmount,
    payeeId: form.payee.id,
    payeeNote: form.payeeNote,
  });
  pending.value = false;
  if (!res.ok) {
    if (!applyServerError(res.error)) notifyError(res.error);
    return;
  }
  toasted(true, `Claim ${res.data.claimNo} registered`);
  router.push(`/marine/claims/${res.data.id}`);
}
</script>

<template>
  <div class="p-4 md:p-6">
    <MarinePageHeader title="Register claim" :crumbs="[{ label: 'Marine' }, { label: 'Claims', to: '/marine/claims' }, { label: 'Register' }]" />
    <form novalidate class="grid gap-4 max-w-4xl" @submit.prevent="submit">
      <FormErrorBanner :items="submitted ? bannerItems() : []" />

      <section :class="[cardClass, 'p-5']" data-field="certificate" aria-labelledby="rc-cert">
        <h2 id="rc-cert" class="mb-3 text-sm font-semibold text-ink">Certificate</h2>
        <div v-if="cert" class="grid gap-3">
          <KeyValueGrid
            :items="[
              { label: 'Certificate', value: `${cert.certNo} v${cert.version}`, to: `/marine/certificates/${cert.id}` },
              { label: 'Policy', value: cert.policy?.policyNo, to: `/marine/policies/${cert.policy?.id}` },
              { label: 'Insured', value: cert.insured?.name },
              { label: 'Clause', value: clauseLabel(cert.clause) },
              { label: 'Period', value: `${formatDate(cert.policy?.periodFrom)} to ${formatDate(cert.policy?.periodTo)}` },
              { label: 'Sum insured', value: formatMoney(cert.sumInsured, cert.currency) },
              { label: 'Loss payee', value: cert.lcBank?.name ?? 'None (no LC)' },
            ]"
          />
          <button type="button" class="justify-self-start text-sm font-medium text-primary hover:underline" @click="cert = null">Change certificate</button>
        </div>
        <template v-else>
          <label for="rc-search" class="text-sm font-medium text-ink">Find by certificate no, BL no or IMO</label>
          <input id="rc-search" v-model="search" type="search" placeholder="C-2026-00001, BL number or 9074729" :class="[inputClass, inputBorder(errors.certificate), 'mt-1']" />
          <p v-if="errors.certificate" class="mt-1 text-xs text-error">{{ errors.certificate }}</p>
          <p v-if="searching" class="mt-2 text-sm text-ink-subtle">Searching…</p>
          <ul v-else-if="results.length" class="mt-2 divide-y divide-line rounded-xl border border-line">
            <li v-for="c in results" :key="c.id">
              <button
                type="button"
                :disabled="c.status === 'CANCELLED'"
                :title="c.status === 'CANCELLED' ? 'Cancelled certificates can\'t take a claim' : ''"
                class="flex gap-3 justify-between items-center px-3 py-2 w-full text-sm text-left hover:bg-surface-muted disabled:opacity-50 disabled:cursor-not-allowed"
                @click="pick(c)"
              >
                <span><span class="font-semibold text-ink">{{ c.certNo }} v{{ c.version }}</span> <span class="text-ink-muted">· {{ c.insured?.name }} · {{ c.vessel?.name ?? "By road or air" }}</span></span>
                <StatusBadge entity="certificate" :status="c.status" />
              </button>
            </li>
          </ul>
          <p v-else-if="search.trim()" class="mt-2 text-sm text-ink-subtle">No certificates match.</p>
        </template>
      </section>

      <section :class="[cardClass, 'p-5 grid gap-5 sm:grid-cols-2']" aria-label="Loss">
        <FormField v-slot="{ id, invalid }" label="Loss date" name="lossDate" required :error="errors.lossDate">
          <DateField :id="id" v-model="form.lossDate" :max="todayIso()" :invalid="invalid" @blur="check('lossDate')" />
          <span v-if="outsidePeriod" class="self-start px-2 py-0.5 mt-1 text-xs font-semibold rounded-full bg-warning-soft text-warning-strong">Loss date is outside the period of cover</span>
        </FormField>
        <FormField v-slot="{ id, invalid }" label="Notified date" name="notifiedDate" required :error="errors.notifiedDate">
          <DateField :id="id" v-model="form.notifiedDate" :min="form.lossDate || undefined" :invalid="invalid" @blur="check('notifiedDate')" />
        </FormField>
        <FormField v-slot="{ id, invalid }" label="Delivery date" name="deliveryDate" :error="errors.deliveryDate" hint="Needed for the suit time bar; add it later if unknown.">
          <DateField :id="id" v-model="form.deliveryDate" :invalid="invalid" @blur="check('deliveryDate')" />
        </FormField>
        <FormField v-slot="{ id, invalid }" label="Claim type" name="type" required :error="errors.type">
          <select :id="id" v-model="form.type" :class="[inputClass, inputBorder(invalid)]" @change="check('type')">
            <option value="" disabled>Choose a type</option>
            <option v-for="t in CLAIM_TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
          </select>
        </FormField>
        <FormField v-slot="{ id, invalid }" label="Cause of loss" name="cause" required :error="errors.cause" hint="Checked against the clause">
          <select :id="id" v-model="form.cause" :class="[inputClass, inputBorder(invalid)]" @change="check('cause')">
            <option value="" disabled>Choose a cause</option>
            <option v-for="c in CAUSES_OF_LOSS" :key="c.value" :value="c.value">{{ c.label }}</option>
          </select>
        </FormField>
        <FormField v-slot="{ id, invalid }" label="Estimated amount" name="estimatedAmount" required :error="errors.estimatedAmount">
          <MoneyInput :id="id" v-model:amount="form.estimatedAmount" :currency="cert?.currency ?? 'USD'" lock-currency :invalid="invalid" @blur="check('estimatedAmount')" />
        </FormField>
        <FormField v-slot="{ id, invalid }" label="Description" name="description" required :error="errors.description" :hint="`${form.description.length}/2000`" class="sm:col-span-2">
          <textarea :id="id" v-model="form.description" rows="3" maxlength="2000" :class="[inputClass, inputBorder(invalid), 'h-auto py-2']" @blur="check('description')" />
        </FormField>
        <FormField v-slot="{ id, invalid }" label="Payee" name="payee" required :error="errors.payee" :hint="cert?.lcBank ? 'Defaults to the loss payee' : ''">
          <PartyPicker :id="id" v-model="form.payee" :type="cert?.lcBank && !payeeChanged ? 'BANK' : 'INSURED'" :invalid="invalid" />
          <span v-if="payeeChanged" class="self-start px-2 py-0.5 mt-1 text-xs font-semibold rounded-full bg-warning-soft text-warning-strong">Payment normally goes to the loss payee</span>
        </FormField>
        <FormField v-if="payeeChanged" v-slot="{ id }" label="Why a different payee" name="payeeNote">
          <input :id="id" v-model="form.payeeNote" :class="[inputClass, 'border-line']" />
        </FormField>
      </section>

      <div class="flex gap-2 justify-end">
        <Button variant="outline" @click="router.back()">Cancel</Button>
        <Button html-type="submit" :pending="pending">Register claim</Button>
      </div>
    </form>
  </div>
</template>
