<script setup>
// Create or edit an individual term policy (BenefitRequest) and, on create, its riders
// (IndividualRiderBenefitRequest[]). The rate panels show what the backend has for the age and
// term; premiums are not worked out here.
import { computed, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import Button from "@/components/Button.vue";
import { toasted } from "@/utils/utils";
import PageHeader from "@/components/PageHeader.vue";
import TextField from "@/components/fields/TextField.vue";
import SelectField from "@/components/fields/SelectField.vue";
import { useLifeResource } from "../../composables/useLifeResource";
import { BenefitStatus } from "../../constants/statuses";
import { formatAmount } from "../../constants/labels";
import { GENDERS, ageOn, benefitActions, fromBenefit, rateFor, toBenefitRequest, toRiderBenefitRequest, validateBenefit, validateRiderBenefit } from "../../individual/individualRules";
import { createBenefit, createIndividualRiderBenefit, getBenefit, updateBenefit } from "../../api/policyApi";
import { geTermPremium, getIndividualRiderRate, getRiders } from "../../api/productApi";

const route = useRoute();
const router = useRouter();
const benefitUuid = route.params.benefitUuid;
const editing = !!benefitUuid;

const form = reactive(fromBenefit({}));
const errors = ref({});
const saving = ref(false);
const existing = useLifeResource(getBenefit);
const locked = ref(false);
if (editing) {
  existing.load(benefitUuid).then((res) => {
    if (!res?.success) return;
    Object.assign(form, fromBenefit(res.data));
    locked.value = !benefitActions(res.data).edit;
  });
}

const age = computed(() => ageOn(form.dateOfBirth, form.beginDate));

// Term rate for the age and term
const termRate = ref(null);
const termRateError = ref("");
const termRateLoading = ref(false);
let termSeq = 0;
watch(() => [age.value, form.insuranceTerm], async ([a, t]) => {
  const mine = ++termSeq;
  termRate.value = null;
  termRateError.value = "";
  if (a === null || a < 0 || !(Number(t) >= 1)) return;
  termRateLoading.value = true;
  const res = await geTermPremium({ age: a, term: Number(t) });
  if (mine !== termSeq) return;
  termRateLoading.value = false;
  if (res?.success && res.data) termRate.value = res.data;
  else termRateError.value = res?.error || `No rate is set up for age ${a} and a ${t}-year term.`;
});
const termRateView = computed(() => rateFor(termRate.value, form.gender));

// Riders (create only; the policy page manages them afterwards)
const riders = useLifeResource(getRiders, { initial: [] });
if (!editing) riders.load();
const riderRows = ref([]);
let rowSeq = 0;
const addRider = () => riderRows.value.push({ key: rowSeq++, riderUuid: "", benefits: "", rate: null, rateError: "", errors: {} });
const removeRider = (row) => (riderRows.value = riderRows.value.filter((r) => r.key !== row.key));
const riderOf = (uuid) => riders.data.value.find((r) => r.riderUuid === uuid);
const availableFor = (row) => riders.data.value.filter((r) => r.riderUuid === row.riderUuid || !riderRows.value.some((x) => x.riderUuid === r.riderUuid));

async function lookupRiderRate(row) {
  row.rate = null;
  row.rateError = "";
  if (!row.riderUuid || age.value === null) return;
  const res = await getIndividualRiderRate({ age: age.value, riderUuid: row.riderUuid });
  const found = Array.isArray(res?.data) ? res.data[0] : res?.data;
  if (res?.success && found) row.rate = found;
  else row.rateError = `No rate for age ${age.value}`;
}
watch(age, () => riderRows.value.forEach(lookupRiderRate));

async function save() {
  errors.value = validateBenefit(form);
  let ridersOk = true;
  for (const row of riderRows.value) {
    row.errors = validateRiderBenefit(row, riderOf(row.riderUuid));
    if (Object.keys(row.errors).length) ridersOk = false;
  }
  if (Object.keys(errors.value).length || !ridersOk) { toasted(false, "Check the highlighted fields"); return; }

  saving.value = true;
  const res = editing ? await updateBenefit(benefitUuid, toBenefitRequest(form)) : await createBenefit(toBenefitRequest(form));
  if (!res?.success) { saving.value = false; return; }
  const uuid = editing ? benefitUuid : res.data?.benefitUuid;
  if (!editing && uuid && riderRows.value.length) {
    const r2 = await createIndividualRiderBenefit(riderRows.value.map((row) => toRiderBenefitRequest(row, uuid, BenefitStatus.PENDING)));
    if (!r2?.success) toasted(false, "The policy was saved but its riders weren't. Add them on the policy page.");
  }
  saving.value = false;
  toasted(true, editing ? "Policy updated" : "Draft policy created");
  router.push(uuid ? `/life/individual/${uuid}` : "/life/individual");
}

const PERSON = [["firstName", "First name"], ["fatherName", "Father's name"], ["grandFatherName", "Grandfather's name"]];
</script>

<template>
  <div class="p-4 md:p-6">
    <PageHeader :title="editing ? 'Edit individual policy' : 'New individual policy'" :back="editing ? `/life/individual/${benefitUuid}` : '/life/individual'" subtitle="Term life for one person. The premium is set by the system from the individual term rates.">
      <template #actions>
        <Button variant="outline" @click="router.back()">Cancel</Button>
        <Button :pending="saving" :disabled="locked || existing.loading.value" @click="save">{{ editing ? "Save changes" : "Create draft" }}</Button>
      </template>
    </PageHeader>

    <p v-if="locked" class="px-4 py-2.5 mb-5 text-sm rounded-xl bg-warning-soft text-warning-strong">This policy is no longer a draft and can't be edited.</p>
    <div v-if="existing.error.value && !existing.loading.value" class="flex flex-col gap-3 items-center px-6 py-12 text-center">
      <p class="text-sm font-semibold text-ink">Couldn't load this policy</p>
      <Button variant="outline" size="sm" @click="existing.load(benefitUuid)">Try again</Button>
    </div>

    <div v-else class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <form class="grid gap-5 min-w-0" novalidate @submit.prevent="save">
        <fieldset :disabled="locked" class="grid gap-4 p-5 rounded-2xl border sm:grid-cols-3 bg-surface border-line shadow-card">
          <legend class="sr-only">Policyholder</legend>
          <h2 class="text-sm font-semibold sm:col-span-3 text-ink">Policyholder (insured life)</h2>
          <TextField v-for="[key, label] in PERSON" :key="key" v-model="form[key]" :label="label" maxlength="25" :error="errors[key]" />
          <SelectField v-model="form.gender" label="Gender" :options="GENDERS" :error="errors.gender" />
          <TextField v-model="form.dateOfBirth" label="Date of birth" type="date" :error="errors.dateOfBirth" />
          <TextField v-model="form.personPhone" label="Phone" type="tel" maxlength="13" placeholder="+2519…" :error="errors.personPhone" />
        </fieldset>

        <fieldset :disabled="locked" class="grid gap-4 p-5 rounded-2xl border sm:grid-cols-3 bg-surface border-line shadow-card">
          <legend class="sr-only">Cover</legend>
          <h2 class="text-sm font-semibold sm:col-span-3 text-ink">Cover</h2>
          <TextField v-model="form.beginDate" label="Cover starts" type="date" :error="errors.beginDate" />
          <TextField v-model.number="form.insuranceTerm" label="Term (years)" type="number" min="1" step="1" inputmode="numeric" :error="errors.insuranceTerm" />
          <TextField v-model.number="form.termBenefit" label="Sum assured" type="number" numeric min="0" step="any" :error="errors.termBenefit" />
        </fieldset>

        <section v-if="!editing" class="p-5 rounded-2xl border bg-surface border-line shadow-card">
          <div class="flex flex-wrap gap-3 justify-between items-center">
            <div>
              <h2 class="text-sm font-semibold text-ink">Riders (optional)</h2>
              <p class="text-xs text-ink-muted">Extra cover on top of the term benefit. Each rider has its own limits.</p>
            </div>
            <Button variant="outline" size="sm" :disabled="riders.loading.value || riderRows.length >= riders.data.value.length" @click="addRider">Add rider</Button>
          </div>
          <p v-if="riders.error.value" class="mt-3 text-sm text-ink-muted">{{ riders.error.value }}</p>
          <ul v-else-if="riderRows.length" class="grid gap-3 mt-4">
            <li v-for="row in riderRows" :key="row.key" class="grid gap-3 items-start p-3 rounded-xl border sm:grid-cols-[1fr_12rem_auto] border-line">
              <div>
                <SelectField
                  v-model="row.riderUuid"
                  label="Rider"
                  :options="availableFor(row).map((r) => ({ value: r.riderUuid, label: r.riderName }))"
                  :error="row.errors.riderUuid"
                  :hint="row.rate ? `Rate ${rateFor(row.rate, form.gender)?.rate ?? '—'} per ${row.rate.rateUnit ?? '—'}` : undefined"
                  @change="lookupRiderRate(row)"
                />
                <p v-if="!row.errors.riderUuid && !row.rate && row.rateError" class="mt-1 text-xs text-warning-strong">{{ row.rateError }}</p>
              </div>
              <TextField
                v-model.number="row.benefits"
                label="Benefit"
                type="number"
                numeric
                min="0"
                step="any"
                :error="row.errors.benefits"
                :hint="riderOf(row.riderUuid) ? `${formatAmount(riderOf(row.riderUuid).minLimit)} – ${formatAmount(riderOf(row.riderUuid).maxLimit)}` : undefined"
              />
              <button type="button" class="self-center p-2 mt-4 text-xs font-semibold rounded-md text-error hover:bg-error-soft" @click="removeRider(row)">Remove</button>
            </li>
          </ul>
        </section>
      </form>

      <!-- Rate check -->
      <aside class="self-start p-5 rounded-2xl border xl:sticky xl:top-4 bg-surface border-line shadow-card">
        <p class="text-xs font-semibold tracking-wide uppercase text-ink-subtle">Rate check</p>
        <dl class="grid gap-3 mt-3 text-sm">
          <div class="flex justify-between"><dt class="text-ink-muted">Age at start</dt><dd class="font-medium tabular-nums text-ink">{{ age ?? "—" }}</dd></div>
          <div class="flex justify-between"><dt class="text-ink-muted">Term</dt><dd class="font-medium tabular-nums text-ink">{{ form.insuranceTerm ? `${form.insuranceTerm} years` : "—" }}</dd></div>
        </dl>
        <div class="pt-3 mt-3 border-t border-line">
          <p v-if="termRateLoading" class="text-sm text-ink-subtle">Looking up the rate…</p>
          <p v-else-if="termRateError" class="text-sm text-warning-strong">{{ termRateError }}</p>
          <dl v-else-if="termRateView" class="grid gap-2 text-sm">
            <div class="flex justify-between"><dt class="text-ink-muted">Term rate</dt><dd class="font-semibold tabular-nums text-ink">{{ termRateView.rate ?? "Choose gender" }}<span v-if="termRateView.rate != null" class="font-normal text-ink-subtle"> per {{ termRateView.rateUnit }}</span></dd></div>
            <div class="flex justify-between"><dt class="text-ink-muted">Max discount</dt><dd class="tabular-nums text-ink">{{ termRateView.maxDiscount ?? "—" }}%</dd></div>
            <div class="flex justify-between"><dt class="text-ink-muted">Max loading</dt><dd class="tabular-nums text-ink">{{ termRateView.maxLoad ?? "—" }}%</dd></div>
          </dl>
          <p v-else class="text-sm text-ink-subtle">Enter the date of birth, start date and term to see the rate.</p>
        </div>
        <p class="mt-4 text-xs text-ink-subtle">The premium itself is calculated by the system and shown on the policy once saved.</p>
      </aside>
    </div>
  </div>
</template>
