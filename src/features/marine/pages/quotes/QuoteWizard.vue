<script setup>
// Quote wizard (plan 5.2): 4 steps, save draft on any step, sum insured card, leave guard, and
// step 4's Get quote and Bind. New quotes are created on the first save (POST), later saves PUT.
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { onBeforeRouteLeave, useRoute, useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import { openModal } from "@customizer/modal-x";
import { useToast } from "vue-toastification";
import Button from "@/components/Button.vue";
import { toasted } from "@/utils/utils";
import MarinePageHeader from "../../components/MarinePageHeader.vue";
import PageState from "../../components/PageState.vue";
import FormErrorBanner from "../../components/FormErrorBanner.vue";
import StepParties from "../../components/wizard/StepParties.vue";
import StepShipment from "../../components/wizard/StepShipment.vue";
import StepCover from "../../components/wizard/StepCover.vue";
import StepReview from "../../components/wizard/StepReview.vue";
import SumInsuredCard from "../../components/wizard/SumInsuredCard.vue";
import { cardClass } from "../../components/styles";
import { focusField, isEmpty } from "../../composables/useForm";
import { useQuoteDraft, toPayload } from "../../store/quoteDraft";
import { API_FIELD, FIELD_LABELS, FIELD_STEP, STEP_RULES } from "../../utils/quoteRules";
import {
  bindQuote, createDeclaration, createQuote, getOpenCover, getParty, getQuote, getRateTable, getTodayFxRates, listPorts, listRateTables,
  rateQuote, updateQuote,
} from "../../api/marineApi";
import { useCan, brokerPartyId } from "../../composables/useCan";
import { hasInlandLeg } from "../../constants";
import { notifyError } from "../../api/marineClient";
import { formatMoney } from "../../utils/money";

const route = useRoute();
const router = useRouter();
const toast = useToast();
const store = useQuoteDraft();
const { draft, quote, dirty, step, furthest } = storeToRefs(store);

const STEPS = ["Product and parties", "Shipment", "Cover", "Review and price"];
const editId = computed(() => route.params.id || null);
const coverId = computed(() => route.params.coverId || null);
const { roles } = useCan();
const brokerOnly = computed(() => roles.value.length > 0 && roles.value.every((r) => r === "BROKER"));
const loading = ref(!!editId.value);
const loadError = ref(null);
const errors = ref({});
const showBanner = ref(false);
const saving = ref(false);
const rating = ref(false);
const binding = ref(false);
let watching = false;

// ── declaration mode (plan 7.4): an open cover fixes the parties, currency and terms ──
const cover = ref(null);
const coverTerms = computed(() =>
  cover.value ? { commodities: cover.value.commodities.map((c) => c.hsCode), declarationDays: cover.value.declarationDays, currency: cover.value.currency } : null
);
const locked = computed(() =>
  cover.value
    ? { product: true, insured: true, broker: true, brokerHint: `Fixed by open cover ${cover.value.coverNo}` }
    : brokerOnly.value
      ? { broker: true, brokerHint: "Your own brokerage" }
      : {}
);

async function loadCover(id) {
  const res = await getOpenCover(id);
  if (!res.ok) throw res.error;
  cover.value = res.data;
}

function applyCoverTerms() {
  const c = cover.value;
  Object.assign(draft.value, {
    product: "SINGLE_SHIPMENT",
    insured: c.insured,
    broker: c.broker,
    currency: c.currency,
    clause: c.clause,
    warCover: !!c.warCover,
    strikesCover: !!c.strikesCover,
    openCoverId: c.id,
  });
}

// A broker's own quotes always name their brokerage (plan 7.7)
async function applyBrokerLock() {
  const id = brokerPartyId(roles.value);
  if (!id || draft.value.broker?.id === id) return;
  const res = await getParty(id);
  if (res.ok) draft.value.broker = { id: res.data.id, name: res.data.name, email: res.data.email };
}

// The road leg starts in Djibouti unless the user picks another port
watch(
  () => hasInlandLeg(draft.value.product, draft.value.mode),
  async (needed) => {
    if (!needed || draft.value.inland.from) return;
    const res = await listPorts({ q: "DJJIB", size: 1 });
    if (res.ok && res.data.content[0] && !draft.value.inland.from) draft.value.inland.from = res.data.content[0];
  }
);

// ── reference data for the side card and vessel age chip ──
const table = ref(null);
const todayFx = ref([]);
const fxForCurrency = computed(() => todayFx.value.find((r) => r.currency === draft.value.currency && r.rate) ?? null);
const referFromAge = computed(() => {
  const refer = (table.value?.ageBands ?? []).filter((b) => b.action !== "LOAD").map((b) => Number(b.fromAge));
  return refer.length ? Math.min(...refer) : null;
});

async function loadReference() {
  const [tables, fx] = await Promise.all([listRateTables({ size: 50 }), getTodayFxRates()]);
  if (fx.ok) todayFx.value = fx.data;
  const active = tables.ok ? tables.data.content.find((t) => t.status === "ACTIVE" && t.product === draft.value.product) : null;
  if (active) {
    const res = await getRateTable(active.id);
    if (res.ok) table.value = res.data;
  }
}

onMounted(async () => {
  try {
    if (editId.value) {
      // Coming back from the first save of a new quote: the store already holds it
      if (quote.value?.id !== editId.value) {
        const res = await getQuote(editId.value);
        if (!res.ok) throw res.error;
        if (!["DRAFT", "QUOTED"].includes(res.data.status)) {
          toast.info(`A ${res.data.status.toLowerCase()} quote can't be edited.`);
          router.replace(`/marine/quotes/${res.data.id}`);
          return;
        }
        store.start(res.data);
      }
      if (quote.value?.openCoverId) await loadCover(quote.value.openCoverId);
    } else {
      store.start();
      if (coverId.value) {
        loading.value = true;
        await loadCover(coverId.value);
        if (cover.value.status !== "ACTIVE") {
          toast.info(`Open cover ${cover.value.coverNo} is not active, so it can't take declarations.`);
          router.replace(`/marine/open-covers/${cover.value.id}`);
          return;
        }
        applyCoverTerms();
      }
    }
    if (brokerOnly.value && !cover.value) await applyBrokerLock();
  } catch (e) {
    loadError.value = e;
    loading.value = false;
    return;
  }
  loading.value = false;
  loadReference();
  await nextTick();
  watching = true;
});

// Any change after the last save marks the draft dirty; after rating, it voids the premium
watch(
  draft,
  () => {
    if (watching) dirty.value = true;
  },
  { deep: true }
);
const stale = computed(() => dirty.value && !!quote.value?.premium);

// ── validation ──
function check(field) {
  if (!(field in FIELD_STEP)) return;
  const all = STEP_RULES[FIELD_STEP[field]]?.(draft.value) ?? {};
  const next = { ...errors.value };
  // Until Next or Get quote is pressed, leaving an empty field doesn't flag it as required
  const value = field.split(".").reduce((o, k) => o?.[k], draft.value);
  if (all[field] && (showBanner.value || !isEmpty(value))) next[field] = all[field];
  else delete next[field];
  errors.value = next;
}

function validateStep(i) {
  const e = STEP_RULES[i]?.(draft.value) ?? {};
  // keep errors from other steps, replace this step's
  const others = Object.fromEntries(Object.entries(errors.value).filter(([f]) => FIELD_STEP[f] !== i));
  errors.value = { ...others, ...e };
  return e;
}

const stepErrors = computed(() =>
  Object.entries(errors.value)
    .filter(([f]) => FIELD_STEP[f] === step.value)
    .map(([field, message]) => ({ field, label: FIELD_LABELS[field] ?? field, message }))
);

async function next() {
  const e = validateStep(step.value);
  if (Object.keys(e).length) {
    showBanner.value = true;
    await nextTick();
    focusField(Object.keys(e)[0]);
    return;
  }
  showBanner.value = false;
  step.value++;
  furthest.value = Math.max(furthest.value, step.value);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function goTo(i) {
  if (i > furthest.value) return;
  step.value = i;
  showBanner.value = false;
}

/** Puts a 422 from the API onto the wizard's fields and opens the first failing step. */
async function applyServerErrors(error) {
  if (error.status !== 422 || !error.fields?.length) return false;
  const mapped = Object.fromEntries(error.fields.map((f) => [API_FIELD[f.field] ?? f.field, f.message]));
  errors.value = mapped;
  const first = Object.keys(mapped).sort((a, b) => (FIELD_STEP[a] ?? 9) - (FIELD_STEP[b] ?? 9))[0];
  if (first in FIELD_STEP) step.value = FIELD_STEP[first];
  showBanner.value = true;
  await nextTick();
  focusField(first);
  return true;
}

// ── save, rate, bind ──
// The first save of a new quote moves the URL to /quotes/:id/edit, which remounts this page
// (the layout keys pages by path). Get quote passes navigate: false and moves it once rated.
async function save({ quiet = false, navigate = true } = {}) {
  saving.value = true;
  const body = toPayload(draft.value);
  const res = quote.value?.id
    ? await updateQuote(quote.value.id, body)
    : cover.value
      ? await createDeclaration(cover.value.id, body)
      : await createQuote(body);
  saving.value = false;
  if (!res.ok) {
    if (!(await applyServerErrors(res.error))) notifyError(res.error, { onRetry: () => save({ quiet, navigate }), onStale: reloadQuote });
    return null;
  }
  const isNew = !quote.value?.id;
  quote.value = res.data;
  dirty.value = false;
  if (!quiet) toasted(true, `Draft ${res.data.quoteNo} saved`);
  if (isNew && navigate) moveToEditUrl();
  return res.data;
}

function moveToEditUrl() {
  if (quote.value?.id && route.name !== "marine-quote-edit") router.replace(`/marine/quotes/${quote.value.id}/edit`);
}

async function reloadQuote() {
  if (!quote.value?.id) return;
  const res = await getQuote(quote.value.id);
  if (res.ok) {
    watching = false;
    store.start(res.data);
    step.value = 3;
    await nextTick();
    watching = true;
  }
}

async function getAQuote() {
  for (let i = 0; i < 3; i++) {
    const e = validateStep(i);
    if (Object.keys(e).length) {
      step.value = i;
      showBanner.value = true;
      await nextTick();
      focusField(Object.keys(e)[0]);
      return;
    }
  }
  rating.value = true;
  const saved = dirty.value || !quote.value?.id ? await save({ quiet: true, navigate: false }) : quote.value;
  if (!saved) {
    rating.value = false;
    return;
  }
  const res = await rateQuote(saved.id);
  rating.value = false;
  if (!res.ok) {
    if (!(await applyServerErrors(res.error))) notifyError(res.error, { onRetry: getAQuote, onStale: reloadQuote });
    moveToEditUrl();
    return;
  }
  watching = false;
  quote.value = res.data;
  dirty.value = false;
  await nextTick();
  watching = true;
  moveToEditUrl();
}

const canBind = computed(() => {
  const q = quote.value;
  if (!q || dirty.value || q.sanctionsConfirmed) return false;
  return (q.status === "QUOTED" && !(q.referralReasons ?? []).length) || q.status === "APPROVED";
});
const bindBlockedReason = computed(() => {
  const q = quote.value;
  if (!q?.premium) return "Get a quote first";
  if (dirty.value) return "Inputs changed. Get a new quote before binding.";
  if (q.sanctionsConfirmed) return "Sanctions match confirmed";
  if (q.status === "REFERRED") return "Referral pending";
  if (q.status === "DECLINED") return "Declined";
  return "";
});

function bind() {
  const q = quote.value;
  openModal(
    "MarineConfirm",
    {
      title: `Bind ${q.quoteNo}?`,
      message: "Binding creates the policy and issues the certificate.",
      confirmLabel: "Bind",
      details: [
        { label: "Sum insured", value: formatMoney(q.premium.sumInsured.total, q.currency) },
        { label: "Premium", value: formatMoney(q.premium.total, "ETB") },
      ],
    },
    async (r) => {
      if (!r?.confirmed) return;
      binding.value = true;
      const res = await bindQuote(q.id);
      binding.value = false;
      if (!res.ok) return notifyError(res.error, { onStale: reloadQuote });
      toasted(true, `Policy ${res.data.policy.policyNo} created, certificate ${res.data.certificate.certNo} issued`);
      // Clear the draft without it counting as an edit, so the leave guard stays quiet
      watching = false;
      store.start();
      router.push(res.data.openCover ? `/marine/open-covers/${res.data.openCover.id}` : `/marine/policies/${res.data.policy.id}`);
    }
  );
}

// ── leaving with unsaved changes ──
function confirmLeave() {
  return new Promise((resolve) =>
    openModal(
      "MarineConfirm",
      { title: "Leave without saving?", message: "Your changes since the last save will be lost.", confirmLabel: "Leave", danger: true },
      (r) => resolve(!!r?.confirmed)
    )
  );
}
onBeforeRouteLeave(async (to) => {
  if (!dirty.value || (quote.value?.id && to.params.id === quote.value.id && to.name === "marine-quote-edit")) return true;
  const leave = await confirmLeave();
  if (leave) dirty.value = false;
  return leave;
});
const beforeUnload = (e) => {
  if (dirty.value) e.preventDefault();
};
window.addEventListener("beforeunload", beforeUnload);
onBeforeUnmount(() => window.removeEventListener("beforeunload", beforeUnload));

const title = computed(() => {
  const what = cover.value ? "declaration" : "quote";
  return quote.value?.quoteNo ? `Edit ${what} ${quote.value.quoteNo}` : cover.value ? `Declare shipment on ${cover.value.coverNo}` : "New quote";
});
</script>

<template>
  <div class="marine-page">
    <MarinePageHeader
      :title="title"
      :status="quote?.status"
      entity="quote"
      :crumbs="
        cover
          ? [{ label: 'Marine' }, { label: 'Open covers', to: '/marine/open-covers' }, { label: cover.coverNo, to: `/marine/open-covers/${cover.id}` }, { label: quote?.quoteNo ?? 'Declare' }]
          : [{ label: 'Marine' }, { label: 'Quotes', to: '/marine/quotes' }, { label: quote?.quoteNo ?? 'New' }]
      "
    />

    <PageState v-if="loading" kind="loading" />
    <PageState v-else-if="loadError?.status === 404" kind="notFound">
      <RouterLink to="/marine/quotes"><Button variant="outline" size="sm">Back to quotes</Button></RouterLink>
    </PageState>
    <PageState v-else-if="loadError" kind="error" :message="loadError.message" @retry="$router.go(0)" />

    <template v-else>
      <nav aria-label="Quote steps" class="mb-5 marine-steps">
        <ol class="grid grid-cols-4 gap-2">
          <li v-for="(s, i) in STEPS" :key="s">
            <button
              type="button"
              :disabled="i > furthest"
              :aria-current="i === step ? 'step' : undefined"
              :class="[
                'flex gap-3 items-center w-full text-left transition-colors disabled:cursor-not-allowed disabled:opacity-70',
                i <= furthest && i !== step ? 'hover:border-primary/50' : '',
              ]"
              @click="goTo(i)"
            >
              <span
                :class="[
                  'grid place-items-center w-8 h-8 text-sm font-bold rounded-full shrink-0',
                  i === step ? 'text-white bg-gradient-to-br from-sky-800 to-sky-600 shadow' : i <= furthest ? 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200' : 'bg-surface-raised text-ink-muted',
                ]"
                aria-hidden="true"
              >
                <svg v-if="i < furthest && i !== step" class="w-4 h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m5 10 3.5 3.5L15 7" /></svg>
                <template v-else>{{ i + 1 }}</template>
              </span>
              <span class="flex flex-col min-w-0">
                <span :class="['text-[11px] font-semibold uppercase tracking-wider', i <= furthest ? 'text-primary' : 'text-ink-muted']">Step {{ i + 1 }}</span>
                <span :class="['text-sm font-semibold truncate', i === step ? 'text-ink' : 'text-ink-muted']">{{ s }}</span>
              </span>
            </button>
          </li>
        </ol>
      </nav>

      <div class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_18rem] items-start">
        <div>
          <p v-if="stale" role="status" class="p-3 mb-4 text-sm font-medium rounded-xl bg-warning-soft text-warning-strong">Inputs changed. Get a new quote before binding.</p>
          <FormErrorBanner v-if="showBanner" :items="stepErrors" />
          <div :class="[cardClass, 'p-5']">
            <StepParties v-if="step === 0" :draft="draft" :errors="errors" :locked="locked" @check="check" />
            <StepShipment v-else-if="step === 1" :draft="draft" :errors="errors" :refer-from-age="referFromAge" :cover="coverTerms" @check="check" />
            <StepCover v-else-if="step === 2" :draft="draft" :errors="errors" :locked="!!cover" @check="check" />
            <StepReview v-else :draft="draft" :quote="quote" :stale="stale" @edit="goTo" />
          </div>

          <div class="flex flex-wrap gap-2 justify-between items-center mt-4">
            <Button v-if="step > 0" variant="outline" @click="goTo(step - 1)">Back</Button>
            <span v-else />
            <div class="flex flex-wrap gap-2 items-center">
              <Button variant="outline" :pending="saving && !rating" :disabled="rating || binding" @click="save()">Save draft</Button>
              <Button v-if="step < 3" @click="next">Next</Button>
              <template v-else>
                <Button :variant="quote?.premium && !stale ? 'outline' : 'primary'" :pending="rating" :disabled="binding" @click="getAQuote">{{ quote?.premium ? "Re-rate" : "Get quote" }}</Button>
                <span :title="canBind ? '' : bindBlockedReason">
                  <Button variant="success" :disabled="!canBind" :pending="binding" @click="bind">Bind</Button>
                </span>
              </template>
            </div>
          </div>
          <p v-if="step === 3 && !canBind && bindBlockedReason" class="mt-2 text-xs text-right text-ink-subtle">Bind: {{ bindBlockedReason }}</p>
        </div>

        <div class="xl:sticky xl:top-4">
          <SumInsuredCard :invoice="draft.invoiceValue" :freight="draft.freight" :currency="draft.currency" :uplift-pct="table?.general?.upliftPct ?? '10'" :fx="fxForCurrency" />
        </div>
      </div>
    </template>
  </div>
</template>
