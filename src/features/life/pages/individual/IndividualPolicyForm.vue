<script setup>
// Create or edit an individual term policy (BenefitRequest) and, on create, its riders
// (IndividualRiderBenefitRequest[]). The quote panel shows the backend's priced quote
// (GET /benefit/quote: age next birthday, rates, premiums); nothing is priced here.
import { computed, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import Button from "@/components/Button.vue";
import { toasted } from "@/utils/utils";
import PageHeader from "@/components/PageHeader.vue";
import TextField from "@/components/fields/TextField.vue";
import SelectField from "@/components/fields/SelectField.vue";
import { useLifeResource } from "../../composables/useLifeResource";
import { BenefitStatus } from "../../constants/statuses";
import { formatAmount, paymentFrequencyLabel } from "../../constants/labels";
import { GENDERS, benefitActions, fromBenefit, quoteParams, toBenefitRequest, toRiderBenefitRequest, validateBenefit, validateRiderBenefit } from "../../individual/individualRules";
import { createBenefit, createIndividualRiderBenefit, getBenefit, getBenefitQuote, updateBenefit } from "../../api/policyApi";
import { getRiders } from "../../api/productApi";

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

// Riders (create only; the policy page manages them afterwards)
const riders = useLifeResource(getRiders, { initial: [] });
if (!editing) riders.load();
const riderRows = ref([]);
let rowSeq = 0;
const addRider = () => riderRows.value.push({ key: rowSeq++, riderUuid: "", benefits: "", rate: null, rateError: "", errors: {} });
const removeRider = (row) => (riderRows.value = riderRows.value.filter((r) => r.key !== row.key));
const riderOf = (uuid) => riders.data.value.find((r) => r.riderUuid === uuid);
const availableFor = (row) => riders.data.value.filter((r) => r.riderUuid === row.riderUuid || !riderRows.value.some((x) => x.riderUuid === r.riderUuid));

// Priced quote from the backend, refreshed as the inputs change (debounced)
const quote = ref(null);
const quoteError = ref("");
const quoteLoading = ref(false);
const quoteInputs = computed(() => quoteParams(form, riderRows.value));
let quoteTimer, quoteSeq = 0;
watch(quoteInputs, (params) => {
  clearTimeout(quoteTimer);
  quote.value = null;
  quoteError.value = "";
  if (!params) return;
  quoteTimer = setTimeout(async () => {
    const mine = ++quoteSeq;
    quoteLoading.value = true;
    const res = await getBenefitQuote(params);
    if (mine !== quoteSeq) return;
    quoteLoading.value = false;
    if (res?.success && res.data) quote.value = res.data;
    else quoteError.value = res?.error || "No quote for these details.";
  }, 400);
}, { deep: true });
const riderQuote = (uuid) => quote.value?.riders?.find((r) => r.riderUuid === uuid);

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
          <SelectField
            v-model="form.paymentFrequency"
            label="Premium paid"
            :options="Object.entries(paymentFrequencyLabel).map(([value, label]) => ({ value, label }))"
            placeholder="Choose how often"
            hint="Sets the premium schedule"
          />
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
                  :hint="riderQuote(row.riderUuid) ? `Premium ${formatAmount(riderQuote(row.riderUuid).premium)} · rate ${riderQuote(row.riderUuid).rate ?? '—'} per ${riderQuote(row.riderUuid).rateUnit ?? '—'}` : undefined"
                />
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

      <!-- Priced quote -->
      <aside class="self-start p-5 rounded-2xl border xl:sticky xl:top-4 bg-surface border-line shadow-card">
        <p class="text-xs font-semibold tracking-wide uppercase text-ink-subtle">Quote</p>
        <p v-if="!quoteInputs" class="mt-3 text-sm text-ink-subtle">Enter the date of birth, gender, start date, term and sum assured to see the premium.</p>
        <p v-else-if="quoteLoading" class="mt-3 text-sm text-ink-subtle">Pricing…</p>
        <p v-else-if="quoteError" class="mt-3 text-sm text-warning-strong">{{ quoteError }}</p>
        <template v-else-if="quote">
          <dl class="grid gap-2 mt-3 text-sm">
            <div class="flex justify-between"><dt class="text-ink-muted">Age next birthday</dt><dd class="font-medium tabular-nums text-ink">{{ quote.age ?? "—" }}</dd></div>
            <div class="flex justify-between"><dt class="text-ink-muted">Term rate</dt><dd class="tabular-nums text-ink">{{ quote.termRate ?? "—" }}<span class="text-ink-subtle"> per {{ quote.rateUnit ?? "—" }}</span></dd></div>
            <div class="flex justify-between"><dt class="text-ink-muted">Term premium</dt><dd class="tabular-nums text-ink">{{ formatAmount(quote.termPremium) }}</dd></div>
            <div v-for="r in quote.riders || []" :key="r.riderUuid" class="flex justify-between">
              <dt class="text-ink-muted">{{ riderOf(r.riderUuid)?.riderName || "Rider" }}</dt><dd class="tabular-nums text-ink">{{ formatAmount(r.premium) }}</dd>
            </div>
          </dl>
          <dl class="grid gap-2 pt-3 mt-3 text-sm border-t border-line">
            <div class="flex justify-between"><dt class="font-medium text-ink">Total premium</dt><dd class="font-semibold tabular-nums text-ink">{{ formatAmount(quote.totalPremium) }}</dd></div>
            <div class="flex justify-between"><dt class="text-ink-muted">Total benefit</dt><dd class="tabular-nums text-ink">{{ formatAmount(quote.totalBenefit) }}</dd></div>
          </dl>
        </template>
        <p class="mt-4 text-xs text-ink-subtle">Priced by the system from the individual term and rider rates. Saving the policy prices it the same way.</p>
      </aside>
    </div>
  </div>
</template>
