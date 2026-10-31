<script setup>
// Start a claim (POST /claim/v2): pick the cover — a member of a group policy or an individual policy —
// then the event, who notified it, the amount claimed and, optionally, the payees. The claim is
// saved as a draft; the documents are attached on the claim page before it's submitted.
import { computed, reactive, ref, shallowRef, watch } from "vue";
import { useRouter } from "vue-router";
import Button from "@/components/Button.vue";
import { toasted } from "@/utils/utils";
import PageHeader from "@/components/PageHeader.vue";
import StatusBadge from "@/components/StatusBadge.vue";
import PageNav from "@/components/PageNav.vue";
import TabGroup from "@/components/TabGroup.vue";
import TextField from "@/components/fields/TextField.vue";
import SelectField from "@/components/fields/SelectField.vue";
import TextareaField from "@/components/fields/TextareaField.vue";
import CheckboxField from "@/components/fields/CheckboxField.vue";
import { useLifePagedList } from "../../composables/useLifePagedList";
import { useLifeResource } from "../../composables/useLifeResource";
import { BenefitStatus, PolicyStatus } from "../../constants/statuses";
import { formatAmount, formatDate, toDateInput } from "../../constants/labels";
import { insuredName } from "../../quotations/quotationRules";
import { benefitName } from "../../individual/individualRules";
import { CLAIM_TYPES, needsRider, newClaimForm, newPayee, toClaimRequest, validateClaim } from "../../claims/claimRules";
import { getBenefits, getIndividualRiderBenefits, getPolicies } from "../../api/policyApi";
import { getInsuredPersons, getQuotedRiders } from "../../api/quotationApi";
import { getRiders } from "../../api/productApi";
import { registerLifeClaim } from "../../api/claimApi";

const router = useRouter();

const form = reactive(newClaimForm());

// ── 1 · cover ──
const KINDS = ["Group member", "Individual policy"];
const kind = ref(KINDS[0]);
const group = computed(() => kind.value === KINDS[0]);

const policies = useLifePagedList(getPolicies, { status: PolicyStatus.ACTIVE, limit: 8 });
const individuals = useLifePagedList((p) => getBenefits(BenefitStatus.ACTIVE, p), { limit: 8 });
const policy = ref(null); // group PolicyResponse
const member = ref(null); // InsuredResponse
const benefit = ref(null); // individual BenefitResponse
const memberList = shallowRef(null); // shallowRef: the paged list is an object of refs and must not be unwrapped

watch(kind, () => { reset(); (group.value ? policies : individuals).reload(); }, { immediate: true });
function reset() {
  policy.value = null; member.value = null; benefit.value = null; memberList.value = null; form.riderUuid = "";
}
function choosePolicy(p) {
  policy.value = p;
  member.value = null;
  memberList.value = useLifePagedList((params) => getInsuredPersons(p.quotationUuid, params), { limit: 10 });
  memberList.value.reload();
  coverRiders.load(p.quotationUuid);
}
function chooseBenefit(b) {
  benefit.value = b;
  coverRiders.load(b.benefitUuid);
}

// The riders on the chosen cover: [{ riderUuid, name, sumAssured }]
const allRiders = useLifeResource(getRiders, { initial: [] });
allRiders.load();
const coverRiders = useLifeResource(
  (id) => (group.value ? getQuotedRiders({ quotationUuid: id }) : getIndividualRiderBenefits({ benefitUuid: id })),
  { initial: [], map: (d) => (Array.isArray(d) ? d : []) },
);
const riderOptions = computed(() => coverRiders.data.value
  .filter((r) => group.value || r.benefitUuid === benefit.value?.benefitUuid)
  .map((r) => ({
    value: r.riderUuid,
    label: r.riderName || allRiders.data.value.find((x) => x.riderUuid === r.riderUuid)?.riderName || "Rider",
    sumAssured: group.value ? r.sumAssured : r.benefits,
  })));

const subject = computed(() => (group.value ? member.value && { insuredPersonUuid: member.value.insuredUuid } : benefit.value && { benefitUuid: benefit.value.benefitUuid }));
const cover = computed(() => {
  const rider = needsRider(form.claimType) ? riderOptions.value.find((r) => r.value === form.riderUuid) : null;
  const src = group.value ? policy.value : benefit.value;
  return {
    sumAssured: rider ? rider.sumAssured : group.value ? member.value?.sumAssured : benefit.value?.termBenefit,
    coverStart: toDateInput(src?.beginDate),
    coverEnd: toDateInput(src?.endDate),
  };
});

// ── 2 · claim ──
const errors = ref({});
const today = new Date().toISOString().slice(0, 10);
watch(() => form.claimType, (t) => { if (!needsRider(t)) form.riderUuid = ""; });

const addPayee = () => form.payees.push(newPayee());
const removePayee = (i) => form.payees.splice(i, 1);

const saving = ref(false);
async function save() {
  if (!subject.value) return;
  errors.value = validateClaim(form, cover.value);
  if (Object.keys(errors.value).length) return;
  saving.value = true;
  const res = await registerLifeClaim(toClaimRequest(form, subject.value));
  saving.value = false;
  if (!res?.success) return;
  toasted(true, "Draft claim saved. Attach the documents, then submit it.");
  router.push(res.data?.claimUuid ? { path: `/life/claims/${res.data.claimUuid}`, query: { side: "agency" } } : { path: "/life/claims/agency" });
}
</script>

<template>
  <div class="p-4 md:p-6">
    <PageHeader title="New claim" back="/life/claims/agency" subtitle="Choose the cover, describe the event and the amount claimed. You'll attach the documents on the next page." />

    <ol class="grid gap-5 max-w-4xl">
      <!-- 1 · Cover -->
      <li class="p-5 rounded-2xl border bg-surface border-line shadow-card">
        <div class="flex flex-wrap gap-3 justify-between items-center">
          <h2 class="flex gap-2 items-center text-sm font-semibold text-ink">
            <span :class="['grid place-items-center w-6 h-6 text-xs rounded-full text-white', subject ? 'bg-success' : 'bg-primary']">{{ subject ? "✓" : 1 }}</span>
            Cover
          </h2>
          <TabGroup v-model="kind" :tabs="KINDS" />
        </div>

        <!-- group: policy, then member -->
        <template v-if="group">
          <div v-if="policy" class="flex flex-wrap gap-3 justify-between items-center mt-3 text-sm">
            <p class="text-ink">
              {{ policy.institutionLifeInsuranceNumber || policy.quotationNumber }} · {{ policy.institutionName }}
              <span class="text-ink-subtle">· cover {{ formatDate(policy.beginDate) }} – {{ formatDate(policy.endDate) }}</span>
            </p>
            <button type="button" class="text-xs font-semibold text-primary hover:underline" @click="reset">Change policy</button>
          </div>
          <template v-else>
            <div class="mt-3 w-full sm:w-80"><TextField v-model="policies.search.value" focus type="search" placeholder="Search policy number or institution" aria-label="Search active group policies" /></div>
            <p v-if="policies.error.value" class="mt-3 text-sm text-ink-muted">{{ policies.error.value }} <button type="button" class="font-semibold text-primary" @click="policies.reload()">Try again</button></p>
            <ul v-else class="mt-3 rounded-xl border divide-y border-line divide-line">
              <li v-if="policies.loading.value" class="px-4 py-3 text-sm text-ink-subtle">Loading active policies…</li>
              <li v-else-if="!policies.rows.value.length" class="px-4 py-3 text-sm text-ink-subtle">No active group policies{{ policies.search.value ? " match your search" : "" }}.</li>
              <li v-for="p in policies.rows.value" v-else :key="p.quotationUuid">
                <button type="button" class="flex gap-3 justify-between items-center px-4 py-2.5 w-full text-left hover:bg-surface-muted focus:bg-surface-muted focus:outline-none" @click="choosePolicy(p)">
                  <span class="text-sm">
                    <span class="font-medium text-ink">{{ p.institutionName }}</span>
                    <span class="block text-xs text-ink-subtle">{{ p.institutionLifeInsuranceNumber || p.quotationNumber }} · {{ formatDate(p.beginDate) }} – {{ formatDate(p.endDate) }}</span>
                  </span>
                  <StatusBadge :status="p.policyStatus" />
                </button>
              </li>
            </ul>
            <PageNav v-model:page="policies.page.value" :total-pages="policies.totalPages.value" :disabled="policies.loading.value" />
          </template>

          <template v-if="memberList">
            <h3 class="mt-5 text-xs font-semibold tracking-wide uppercase text-ink-subtle">Member</h3>
            <div class="mt-2 w-full sm:w-80"><TextField v-model="memberList.search.value" type="search" placeholder="Search name, phone or insurance ID" aria-label="Search members" /></div>
            <p v-if="memberList.error.value" class="mt-3 text-sm text-ink-muted">{{ memberList.error.value }}</p>
            <ul v-else role="radiogroup" aria-label="Member" class="mt-3 rounded-xl border divide-y border-line divide-line">
              <li v-if="memberList.loading.value" class="px-4 py-3 text-sm text-ink-subtle">Loading members…</li>
              <li v-else-if="!memberList.rows.value.length" class="px-4 py-3 text-sm text-ink-subtle">No members{{ memberList.search.value ? " match your search" : " on this policy" }}.</li>
              <li v-for="m in memberList.rows.value" v-else :key="m.insuredUuid">
                <label :class="['flex gap-3 items-center px-4 py-2.5 cursor-pointer hover:bg-surface-muted', member?.insuredUuid === m.insuredUuid && 'bg-primary/5']">
                  <input type="radio" name="member" class="accent-primary" :checked="member?.insuredUuid === m.insuredUuid" @change="member = m" />
                  <span class="flex-1 text-sm">
                    <span class="font-medium text-ink">{{ insuredName(m) }}</span>
                    <span class="block text-xs text-ink-subtle">{{ [m.insuranceId, m.phone, `born ${formatDate(m.birthDate)}`].filter(Boolean).join(" · ") }}</span>
                  </span>
                  <span class="text-xs text-right tabular-nums text-ink-muted">Sum assured<br /><span class="text-sm text-ink">{{ formatAmount(m.sumAssured) }}</span></span>
                </label>
              </li>
            </ul>
            <PageNav v-model:page="memberList.page.value" :total-pages="memberList.totalPages.value" :disabled="memberList.loading.value" />
          </template>
        </template>

        <!-- individual policy -->
        <template v-else>
          <div v-if="benefit" class="flex flex-wrap gap-3 justify-between items-center mt-3 text-sm">
            <p class="text-ink">
              {{ benefit.policyNumber }} · {{ benefitName(benefit) }}
              <span class="text-ink-subtle">· sum assured {{ formatAmount(benefit.termBenefit) }} · cover {{ formatDate(benefit.beginDate) }} – {{ formatDate(benefit.endDate) }}</span>
            </p>
            <button type="button" class="text-xs font-semibold text-primary hover:underline" @click="reset">Change policy</button>
          </div>
          <template v-else>
            <div class="mt-3 w-full sm:w-80"><TextField v-model="individuals.search.value" focus type="search" placeholder="Search policy number or name" aria-label="Search active individual policies" /></div>
            <p v-if="individuals.error.value" class="mt-3 text-sm text-ink-muted">{{ individuals.error.value }} <button type="button" class="font-semibold text-primary" @click="individuals.reload()">Try again</button></p>
            <ul v-else class="mt-3 rounded-xl border divide-y border-line divide-line">
              <li v-if="individuals.loading.value" class="px-4 py-3 text-sm text-ink-subtle">Loading active policies…</li>
              <li v-else-if="!individuals.rows.value.length" class="px-4 py-3 text-sm text-ink-subtle">No active individual policies{{ individuals.search.value ? " match your search" : "" }}.</li>
              <li v-for="b in individuals.rows.value" v-else :key="b.benefitUuid">
                <button type="button" class="flex gap-3 justify-between items-center px-4 py-2.5 w-full text-left hover:bg-surface-muted focus:bg-surface-muted focus:outline-none" @click="chooseBenefit(b)">
                  <span class="text-sm">
                    <span class="font-medium text-ink">{{ benefitName(b) }}</span>
                    <span class="block text-xs text-ink-subtle">{{ b.policyNumber }} · {{ formatDate(b.beginDate) }} – {{ formatDate(b.endDate) }}</span>
                  </span>
                  <span class="text-xs text-right tabular-nums text-ink-muted">Sum assured<br /><span class="text-sm text-ink">{{ formatAmount(b.termBenefit) }}</span></span>
                </button>
              </li>
            </ul>
            <PageNav v-model:page="individuals.page.value" :total-pages="individuals.totalPages.value" :disabled="individuals.loading.value" />
          </template>
        </template>
      </li>

      <!-- 2 · Claim -->
      <li :class="['p-5 rounded-2xl border bg-surface border-line shadow-card', !subject && 'opacity-60']">
        <h2 class="flex gap-2 items-center text-sm font-semibold text-ink">
          <span :class="['grid place-items-center w-6 h-6 text-xs rounded-full', subject ? 'bg-primary text-white' : 'bg-surface-raised text-ink-subtle']">2</span>
          Claim
        </h2>
        <p v-if="!subject" class="mt-2 text-sm text-ink-subtle">Choose the cover first.</p>
        <form v-else id="life-new-claim" class="grid gap-5 mt-4" novalidate @submit.prevent="save">
          <fieldset class="grid gap-4 sm:grid-cols-2">
            <legend class="sr-only">Event</legend>
            <SelectField v-model="form.claimType" label="Claim type" :options="CLAIM_TYPES" :error="errors.claimType" />
            <SelectField
              v-if="needsRider(form.claimType)"
              v-model="form.riderUuid"
              label="Rider"
              :options="riderOptions"
              :placeholder="coverRiders.loading.value ? 'Loading…' : riderOptions.length ? 'Select…' : 'No riders on this cover'"
              :error="errors.riderUuid"
            />
            <TextField v-model="form.eventDate" label="Date of event" type="date" :min="cover.coverStart" :max="today" :error="errors.eventDate" :hint="cover.coverStart ? `Cover ${formatDate(cover.coverStart)} – ${formatDate(cover.coverEnd)}` : undefined" />
            <TextField v-model="form.placeOfEvent" label="Place of event (optional)" maxlength="200" :error="errors.placeOfEvent" />
            <TextareaField v-model="form.causeOfEvent" class="sm:col-span-2" label="Cause of event" rows="3" maxlength="500" counter placeholder="What happened, as reported" :error="errors.causeOfEvent" />
            <CheckboxField v-model="form.suspectedSuicide" class="sm:col-span-2" label="Suicide is suspected" hint="The assessor checks the suicide exclusion period." />
          </fieldset>

          <fieldset class="grid gap-4 sm:grid-cols-3">
            <legend class="mb-2 text-xs font-semibold tracking-wide uppercase text-ink-subtle">Notified by</legend>
            <TextField v-model="form.notifiedByName" label="Name" maxlength="120" :error="errors.notifiedByName" />
            <TextField v-model="form.notifiedByRelationship" label="Relationship (optional)" maxlength="60" placeholder="Spouse, employer…" :error="errors.notifiedByRelationship" />
            <TextField v-model="form.notifiedByPhone" label="Phone (optional)" type="tel" maxlength="14" :error="errors.notifiedByPhone" />
          </fieldset>

          <fieldset class="grid gap-4 sm:grid-cols-2">
            <legend class="sr-only">Amount</legend>
            <TextField v-model="form.claimedAmount" label="Amount claimed" type="number" numeric min="0" step="any" :error="errors.claimedAmount" :hint="cover.sumAssured != null ? `Sum assured ${formatAmount(cover.sumAssured)}` : undefined" />
          </fieldset>

          <!-- Payees -->
          <fieldset class="grid gap-3">
            <legend class="mb-1 text-xs font-semibold tracking-wide uppercase text-ink-subtle">Payees (optional)</legend>
            <p class="text-xs text-ink-muted">Leave empty to pay the policy's primary beneficiaries. If there are none, name the payees (for example the statutory heirs); their shares must add up to 100%.</p>
            <div v-for="(p, i) in form.payees" :key="i" class="grid gap-3 items-start p-3 rounded-xl border sm:grid-cols-[2fr_1fr_1.5fr_1.5fr_auto] border-line">
              <TextField v-model="p.name" label="Name" maxlength="120" :error="errors.payees?.rows?.[i]?.name" />
              <TextField v-model="p.sharePercent" label="Share %" type="number" numeric min="0" max="100" step="any" :error="errors.payees?.rows?.[i]?.sharePercent" />
              <TextField v-model="p.bankName" label="Bank" maxlength="100" :error="errors.payees?.rows?.[i]?.bankName" />
              <TextField v-model="p.accountNumber" label="Account number" maxlength="40" :error="errors.payees?.rows?.[i]?.accountNumber" />
              <Button variant="ghost" size="sm" class="mt-6 !text-error" :aria-label="`Remove payee ${i + 1}`" @click="removePayee(i)">Remove</Button>
            </div>
            <p v-if="errors.payees?.share" class="text-sm text-error">{{ errors.payees.share }}</p>
            <div><Button variant="outline" size="sm" @click="addPayee">Add payee</Button></div>
          </fieldset>
        </form>
      </li>

      <li class="flex flex-wrap gap-4 justify-between items-center p-5 rounded-2xl border bg-surface border-line shadow-card">
        <p class="max-w-xl text-xs text-ink-muted">The claim is saved as a draft. The system checks that the policy is active, the event is within the cover and the amount is within the sum assured.</p>
        <Button html-type="submit" form="life-new-claim" :disabled="!subject" :pending="saving">Save draft claim</Button>
      </li>
    </ol>
  </div>
</template>
