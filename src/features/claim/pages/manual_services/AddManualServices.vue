<script setup>
// Manually enter services or drugs for an insured, as a two-step wizard like Cash Services:
// 1. Eligibility Check (shared with Cash Services)  2. the services form.
// Cash mode (/cash_claims/manual) posts like the Cash Services page's "Other provider" mode;
// credit mode (/credit_claims/manual, route meta serviceType CREDIT) creates a manual credit service.
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import Button from "@/components/Button.vue";
import DefaultPage from "@/components/DefaultPage.vue";
import EligibilityCheck from "@/features/claim/components/cash_services/EligibilityCheck.vue";
import CustomSelect from "@/components/CustomSelect.vue";
import { useApiRequest } from "@/composables/useApiRequest";
import { getInstitutionContracts } from "@/features/underwriting/api/underwritingApi";
import { getPackageDropdown } from "@/features/product_settings/api/coverageApi";
import { createCashServiceProvided, createCreditServiceProvided } from "../../api/claimApi";
import { formatCurrency, toasted } from "@/utils/utils";

const route = useRoute();
const router = useRouter();

const isCredit = computed(() => route.meta?.serviceType === "CREDIT");
const listPath = computed(() => (isCredit.value ? "/credit_claims" : "/cash_claims"));
const listName = computed(() => (isCredit.value ? "Credit Services" : "Cash Services"));
const steps = computed(() => ["Eligibility Check", isCredit.value ? "Credit Services" : "Manual Services"]);

function toList(res) {
  const raw = res?.data ?? res;
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.content)) return raw.content;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.data?.content)) return raw.data.content;
  return [];
}

/* ---------- Wizard ---------- */
const active = ref(0);
const eligibilityRef = ref();

// Patient: from the Eligibility Check step, or pre-filled from the Cash Services list
const institutionUuid = ref(String(route.query.institutionUuid || ""));
const presetContract = ref("");
const patient = ref(
  route.query.insuredPersonUuid
    ? {
        insuredPersonUuid: String(route.query.insuredPersonUuid),
        dependantUuid: route.query.dependantUuid ? String(route.query.dependantUuid) : null,
        name: String(route.query.name || ""),
        profile: null,
      }
    : null
);
if (patient.value) active.value = 1;

// EligibilityCheck builds the name by string concatenation, so missing parts read "undefined"
function cleanName(name) {
  const parts = String(name || "").split(/\s+/).filter((w) => w && w !== "undefined" && w !== "null");
  return parts.join(" ") || "Selected member";
}

function handleEligibilityComplete(payload) {
  presetContract.value = payload.payerInstitutionContractUuid || "";
  institutionUuid.value = payload.institutionUuid || "";
  contractUuid.value = presetContract.value || contractUuid.value;
  patient.value = {
    insuredPersonUuid: payload.insuredUuid,
    dependantUuid: payload.dependantUuid || null,
    name: cleanName(payload.person?.name),
    profile: payload.person?.profile || null,
  };
  submitted.value = false;
  active.value = 1;
}

function goToStep(i) {
  if (i === 0 || patient.value) active.value = i;
}

const initials = computed(() =>
  (patient.value?.name || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("")
);

const formatImageSource = (profile) => {
  if (!profile) return "";
  const isBase64 = profile.startsWith("iVBOR") || profile.startsWith("/9j/");
  return isBase64 ? `data:image/png;base64,${profile}` : profile;
};

/* ---------- Contract (from the institution) ---------- */
const contracts = ref([]);
const contractUuid = ref("");
const contractsReq = useApiRequest();
watch(
  institutionUuid,
  (id) => {
    contracts.value = [];
    contractUuid.value = "";
    if (!id) return;
    contractsReq.send(
      () => getInstitutionContracts(id, { status: "ACTIVE" }),
      (res) => {
        contracts.value = toList(res);
        contractUuid.value =
          presetContract.value || (contracts.value.length === 1 ? contracts.value[0].payerInstitutionContractUuid : "");
      }
    );
  },
  { immediate: true }
);
const contractOptions = computed(() =>
  contracts.value.map((c) => ({
    value: c.payerInstitutionContractUuid,
    label: c.contractName || c.contractCode || c.payerInstitutionContractUuid,
  }))
);

/* ---------- Package (from the patient) ---------- */
const packages = ref([]);
const pkg = ref("");
const packagesReq = useApiRequest();
watch(
  () => patient.value?.insuredPersonUuid + "|" + (patient.value?.dependantUuid || ""),
  () => {
    packages.value = [];
    pkg.value = "";
    if (!patient.value?.insuredPersonUuid) return;
    packagesReq.send(
      () => getPackageDropdown(patient.value.insuredPersonUuid, patient.value.dependantUuid),
      (res) => {
        packages.value = toList(res);
        if (packages.value.length === 1) pkg.value = packages.value[0].packageUuid;
      }
    );
  },
  { immediate: true }
);
const packageOptions = computed(() => packages.value.map((p) => ({ value: p.packageUuid, label: p.packageName })));

/* ---------- Claim details ---------- */
const providerName = ref("");
const referenceNumber = ref("");
const today = new Date().toISOString().slice(0, 10);
const providedDate = ref(today);

/* ---------- Items ---------- */
let rowId = 0;
const newItem = () => ({ id: ++rowId, itemType: "SERVICE", serviceName: "", serviceCode: "", qty: 1, unitPrice: null });
const items = ref([newItem()]);

function addRow(type = "SERVICE") {
  items.value.push({ ...newItem(), itemType: type });
}
function removeRow(index) {
  items.value.splice(index, 1);
  if (!items.value.length) items.value.push(newItem());
}

const lineTotal = (item) => (Number(item.unitPrice) || 0) * (Number(item.qty) || 0);
const filledItems = computed(() => items.value.filter((i) => i.serviceName.trim()));
const grandTotal = computed(() => filledItems.value.reduce((sum, item) => sum + lineTotal(item), 0));
const serviceCount = computed(() => filledItems.value.filter((i) => i.itemType === "SERVICE").length);
const drugCount = computed(() => filledItems.value.filter((i) => i.itemType === "DRUG").length);

/* ---------- Attachments ---------- */
const files = ref([]);
const dragging = ref(false);
function addFiles(list) {
  for (const f of list || []) {
    if (!files.value.some((x) => x.name === f.name && x.size === f.size)) files.value.push(f);
  }
}
function onDrop(ev) {
  dragging.value = false;
  addFiles(ev.dataTransfer?.files);
}
const fileSize = (n) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

/* ---------- Validation ---------- */
const submitted = ref(false);
const errors = computed(() => ({
  patient: !patient.value?.insuredPersonUuid,
  contract: !contractUuid.value,
  provider: !providerName.value.trim(),
  pkg: !pkg.value,
  date: !providedDate.value || providedDate.value > today,
  items: !filledItems.value.length,
  amounts: filledItems.value.some((i) => !(Number(i.qty) > 0) || !(Number(i.unitPrice) > 0)),
}));
const hasErrors = computed(() => Object.values(errors.value).some(Boolean));
const show = (key) => submitted.value && errors.value[key];

/* ---------- Submit ---------- */
const saveReq = useApiRequest();
const saved = ref(null);

function save() {
  submitted.value = true;
  if (hasErrors.value) {
    toasted(false, "", "Please complete the highlighted fields");
    return;
  }

  const body = {
    contractUuid: contractUuid.value,
    providerName: providerName.value.trim(),
    totalPrice: grandTotal.value,
    providedDate: providedDate.value,
    insuredUuid: patient.value.insuredPersonUuid,
    dependentUuid: patient.value.dependantUuid || undefined,
    deleted: false,
    items: filledItems.value.map((item) => ({
      serviceName: item.serviceName.trim(),
      serviceCode: item.serviceCode.trim(),
      qty: Number(item.qty),
      totalPrice: lineTotal(item),
      recordNumber: referenceNumber.value.trim(),
      packageUuid: pkg.value,
      itemType: item.itemType,
      c_section: false,
      deleted: false,
    })),
  };

  const form = new FormData();
  files.value.forEach((f) => form.append("attachment", f));
  // The backend reads these exact multipart field names (spaces included)
  if (isCredit.value) {
    form.append("service provided request", JSON.stringify(body));
  } else {
    form.append("serviceProvidedRequest ", JSON.stringify(body));
  }

  saveReq.send(
    () => (isCredit.value ? createCreditServiceProvided(form) : createCashServiceProvided(form)),
    (res) => {
      if (res.success) {
        saved.value = { total: grandTotal.value, count: filledItems.value.length, provider: body.providerName };
        toasted(true, isCredit.value ? "Credit services added" : "Services added");
      } else {
        toasted(false, "", res.error || "Failed to add services");
      }
    }
  );
}

function resetForm() {
  items.value = [newItem()];
  files.value = [];
  referenceNumber.value = "";
  submitted.value = false;
  saved.value = null;
}

// Same patient, another set of services
function startAnother() {
  resetForm();
}

// Back to Eligibility Check for another person of the same institution (as Cash Services does)
function startNextPerson() {
  resetForm();
  providerName.value = "";
  patient.value = null;
  eligibilityRef.value?.resetForNextPerson?.();
  active.value = 0;
}

function goBack() {
  router.push(listPath.value);
}
</script>

<template>
  <DefaultPage :hideSearch="true">
    <template #header>
      <div class="flex flex-wrap gap-4 justify-between items-center w-full">
        <!-- Step indicator (same as Cash Services) -->
        <div class="flex gap-8 items-center">
          <div
            v-for="(tab, i) in steps"
            :key="tab"
            :class="['relative group', i === 0 || patient ? 'cursor-pointer' : 'cursor-not-allowed opacity-50']"
            @click="goToStep(i)"
          >
            <div
              :class="[
                'px-4 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2',
                active === i
                  ? 'bg-gradient-to-r from-primary to-primary text-white shadow-lg'
                  : i === 0 || patient
                  ? 'text-ink-muted hover:text-ink hover:bg-surface-muted'
                  : 'text-ink-subtle',
              ]"
            >
              <span v-if="i === 0">✓</span>
              <span v-else>📝</span>
              {{ tab }}
            </div>
            <div v-if="active === i" class="absolute right-0 bottom-0 left-0 h-1 bg-gradient-to-r rounded-full from-primary to-primary"></div>
          </div>
        </div>

        <!-- Current person -->
        <Transition name="slide-left">
          <div
            v-if="patient"
            class="flex gap-3 items-center px-4 py-2 bg-gradient-to-r rounded-lg border from-primary/5 to-primary/5 border-primary/20"
          >
            <div v-if="patient.profile" class="flex overflow-hidden justify-center items-center w-8 h-8 rounded-full border-2 border-white shadow-sm">
              <img :src="formatImageSource(patient.profile)" class="object-cover w-full h-full" alt="" />
            </div>
            <div v-else class="flex justify-center items-center w-8 h-8 text-xs font-bold text-white bg-gradient-to-br rounded-full shadow-sm from-primary/70 to-primary">
              {{ initials }}
            </div>
            <div class="min-w-0">
              <p class="text-xs font-semibold tracking-wide uppercase truncate text-ink-subtle">Current Person</p>
              <p class="text-sm font-bold truncate text-ink">{{ patient.name }}</p>
            </div>
          </div>
        </Transition>
      </div>
    </template>

    <div class="py-6">
    <!-- Step 1: Eligibility Check -->
    <EligibilityCheck v-show="active === 0" ref="eligibilityRef" @complete="handleEligibilityComplete" />

    <!-- Step 2 -->
    <template v-if="active === 1">
    <!-- Success -->    <!-- Success -->
    <section v-if="saved" class="p-8 mx-auto max-w-lg text-center rounded-2xl border shadow-card border-line bg-surface" aria-live="polite">
      <div class="grid place-items-center mx-auto mb-4 w-14 h-14 rounded-full bg-success-soft text-success">
        <svg class="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
      </div>
      <h2 class="text-lg font-semibold text-ink">{{ isCredit ? "Credit services added" : "Services added" }}</h2>
      <p class="mt-1 text-sm text-ink-muted">
        {{ saved.count }} item(s) from {{ saved.provider }} for <span class="font-medium text-ink">{{ patient?.name }}</span>,
        totalling <span class="font-semibold text-ink">{{ formatCurrency(saved.total) }}</span>.
      </p>
      <div class="flex flex-wrap gap-2 justify-center mt-6">
        <Button type="secondary" @click="startAnother">Add more for this patient</Button>
        <Button type="secondary" @click="startNextPerson">Next person</Button>
        <Button type="primary" @click="goBack">Back to {{ listName }}</Button>
      </div>
    </section>

    <div v-else class="grid gap-6 items-start lg:grid-cols-[minmax(0,1fr)_320px]">
      <div class="space-y-6 min-w-0">
        <!-- 1. Claim details -->
        <section class="rounded-2xl border shadow-card border-line bg-surface" aria-labelledby="details-title">
          <div class="flex gap-3 items-center px-5 py-4 border-b border-line">
            <span class="step">1</span>
            <h2 id="details-title" class="text-base font-semibold text-ink">Claim details</h2>
          </div>
          <div class="grid gap-x-4 gap-y-5 p-5 sm:grid-cols-2">
            <div>
              <label class="field-label">Contract<span class="text-error">*</span></label>
              <CustomSelect
                v-model="contractUuid"
                class="w-full"
                :options="contractOptions"
                :pending="contractsReq.pending.value"
                :placeholder="institutionUuid ? 'Choose contract...' : 'Choose an institution first'"
              />
              <p v-if="institutionUuid && contractsReq.dirty.value && !contractsReq.pending.value && !contracts.length" class="field-error">
                This institution has no active contract.
              </p>
              <p v-else-if="show('contract')" class="field-error">Contract is required.</p>
            </div>
            <div>
              <label class="field-label">Package<span class="text-error">*</span></label>
              <CustomSelect
                v-model="pkg"
                class="w-full"
                :options="packageOptions"
                :pending="packagesReq.pending.value"
                :placeholder="patient ? 'Choose package...' : 'Choose a patient first'"
              />
              <p v-if="show('pkg')" class="field-error">Package is required.</p>
            </div>
            <div>
              <label class="field-label" for="provider-name">Provider<span class="text-error">*</span></label>
              <input id="provider-name" v-model="providerName" class="field" :class="{ 'field--error': show('provider') }" placeholder="Hospital, clinic or pharmacy name" />
              <p v-if="show('provider')" class="field-error">Provider name is required.</p>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="field-label" for="service-date">Service date<span class="text-error">*</span></label>
                <input id="service-date" v-model="providedDate" type="date" :max="today" class="field" :class="{ 'field--error': show('date') }" />
                <p v-if="show('date')" class="field-error">Pick a date up to today.</p>
              </div>
              <div>
                <label class="field-label" for="reference-no">Reference no.</label>
                <input id="reference-no" v-model="referenceNumber" class="field" placeholder="e.g., CR-002" />
              </div>
            </div>
          </div>
        </section>

        <!-- 2. Services & drugs -->
        <section class="rounded-2xl border shadow-card border-line bg-surface" aria-labelledby="items-title">
          <div class="flex flex-wrap gap-3 justify-between items-center px-5 py-4 border-b border-line">
            <div class="flex gap-3 items-center">
              <span class="step">2</span>
              <h2 id="items-title" class="text-base font-semibold text-ink">Services &amp; drugs</h2>
            </div>
            <div class="flex gap-2">
              <button type="button" class="chip-btn" @click="addRow('SERVICE')">+ Service</button>
              <button type="button" class="chip-btn" @click="addRow('DRUG')">+ Drug</button>
            </div>
          </div>

          <!-- Column headings (wide screens only; rows stack on two lines below that) -->
          <div class="hidden 2xl:grid-cols-[7rem_minmax(0,1fr)_7rem_4.5rem_7.5rem_6.5rem_2.25rem] gap-3 px-5 pt-4 pb-1 text-xs font-medium tracking-wide uppercase 2xl:grid text-ink-subtle">
            <span>Type</span><span>Name</span><span>Code</span><span>Qty</span><span>Unit price</span><span class="text-right">Amount</span><span class="sr-only">Remove</span>
          </div>

          <ul class="px-5 divide-y divide-line 2xl:divide-y-0">
            <li
              v-for="(item, index) in items"
              :key="item.id"
              class="flex flex-col gap-2 py-4 2xl:grid 2xl:grid-cols-[7rem_minmax(0,1fr)_7rem_4.5rem_7.5rem_6.5rem_2.25rem] 2xl:gap-3 2xl:items-center 2xl:py-2"
            >
              <!-- Line 1: type + name -->
              <div class="flex flex-col gap-2 sm:flex-row 2xl:contents">
                <div class="flex p-0.5 h-10 rounded-lg sm:w-32 shrink-0 2xl:w-auto bg-surface-muted" role="group" :aria-label="`Row ${index + 1} type`">
                  <button
                    v-for="t in ['SERVICE', 'DRUG']"
                    :key="t"
                    type="button"
                    class="flex-1 text-xs font-medium rounded-md transition-colors"
                    :class="item.itemType === t ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted hover:text-ink'"
                    :aria-pressed="item.itemType === t"
                    @click="item.itemType = t"
                  >
                    {{ t === "SERVICE" ? "Service" : "Drug" }}
                  </button>
                </div>
                <div class="flex-1 min-w-0">
                  <label class="sr-only" :for="`name-${item.id}`">Name</label>
                  <input
                    :id="`name-${item.id}`"
                    v-model="item.serviceName"
                    class="field"
                    :class="{ 'field--error': show('items') && index === 0 }"
                    :placeholder="item.itemType === 'DRUG' ? 'Drug name, e.g., Amoxicillin 500mg' : 'Service name, e.g., Consultation'"
                  />
                </div>
              </div>

              <!-- Line 2: code, qty, price, amount -->
              <div class="grid grid-cols-6 gap-2 items-center sm:grid-cols-[minmax(0,1fr)_5rem_minmax(0,1fr)_7rem_2.25rem] 2xl:contents">
                <div class="col-span-4 sm:col-auto">
                  <label class="sr-only" :for="`code-${item.id}`">Code</label>
                  <input :id="`code-${item.id}`" v-model="item.serviceCode" class="field" placeholder="Code (optional)" />
                </div>
                <div class="col-span-2 sm:col-auto">
                  <label class="sr-only" :for="`qty-${item.id}`">Quantity</label>
                  <input
                    :id="`qty-${item.id}`"
                    v-model.number="item.qty"
                    type="number"
                    min="1"
                    class="text-center field"
                    placeholder="Qty"
                    :class="{ 'field--error': submitted && item.serviceName.trim() && !(Number(item.qty) > 0) }"
                  />
                </div>
                <div class="col-span-3 sm:col-auto">
                  <label class="sr-only" :for="`price-${item.id}`">Unit price</label>
                  <input
                    :id="`price-${item.id}`"
                    v-model.number="item.unitPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    class="field"
                    placeholder="Unit price"
                    :class="{ 'field--error': submitted && item.serviceName.trim() && !(Number(item.unitPrice) > 0) }"
                  />
                </div>
                <div class="col-span-2 text-right sm:col-auto">
                  <span class="block text-[0.6875rem] uppercase tracking-wide 2xl:hidden text-ink-subtle">Amount</span>
                  <span class="text-sm font-semibold tabular-nums text-ink">{{ formatCurrency(lineTotal(item)) }}</span>
                </div>
                <div class="flex justify-end">
                  <button
                    type="button"
                    class="grid place-items-center w-9 h-9 rounded-lg text-ink-subtle hover:text-error hover:bg-error-soft"
                    :aria-label="`Remove row ${index + 1}`"
                    @click="removeRow(index)"
                  >
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4h6v3" /></svg>
                  </button>
                </div>
              </div>
            </li>
          </ul>

          <p v-if="show('items')" class="px-5 pb-3 field-error">Add at least one service or drug.</p>
          <p v-else-if="show('amounts')" class="px-5 pb-3 field-error">Every item needs a quantity and a unit price.</p>

          <div class="flex justify-between items-center px-5 py-3 rounded-b-2xl border-t border-line bg-surface-muted">
            <span class="text-sm text-ink-muted">{{ filledItems.length }} item(s)</span>
            <span class="text-sm text-ink-muted">Subtotal <span class="ml-2 font-semibold tabular-nums text-ink">{{ formatCurrency(grandTotal) }}</span></span>
          </div>
        </section>

        <!-- 3. Attachments -->
        <section class="rounded-2xl border shadow-card border-line bg-surface" aria-labelledby="files-title">
          <div class="flex gap-3 items-center px-5 py-4 border-b border-line">
            <span class="step">3</span>
            <h2 id="files-title" class="text-base font-semibold text-ink">Receipts <span class="text-sm font-normal text-ink-subtle">(optional)</span></h2>
          </div>
          <div class="p-5">
            <label
              class="flex flex-col gap-1 items-center px-4 py-7 text-center rounded-xl border-2 border-dashed transition-colors cursor-pointer"
              :class="dragging ? 'border-primary bg-primary/5' : 'border-line hover:border-line-strong hover:bg-surface-muted'"
              @dragover.prevent="dragging = true"
              @dragleave.prevent="dragging = false"
              @drop.prevent="onDrop"
            >
              <svg class="mb-1 w-7 h-7 text-ink-subtle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 16V4m0 0-4 4m4-4 4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /></svg>
              <span class="text-sm font-medium text-ink">Drop receipts here or <span class="text-primary">browse</span></span>
              <span class="text-xs text-ink-subtle">PDF or images</span>
              <input type="file" multiple accept=".pdf,image/*" class="sr-only" @change="(e) => { addFiles(e.target.files); e.target.value = ''; }" />
            </label>
            <ul v-if="files.length" class="mt-3 space-y-2">
              <li v-for="(f, i) in files" :key="f.name + f.size" class="flex gap-3 items-center px-3 py-2 rounded-lg border border-line">
                <svg class="w-5 h-5 shrink-0 text-ink-subtle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" /><path d="M14 3v5h5" /></svg>
                <span class="flex-1 min-w-0 text-sm truncate text-ink">{{ f.name }}</span>
                <span class="text-xs text-ink-subtle">{{ fileSize(f.size) }}</span>
                <button type="button" class="text-xs font-medium text-ink-muted hover:text-error" :aria-label="`Remove ${f.name}`" @click="files.splice(i, 1)">Remove</button>
              </li>
            </ul>
          </div>
        </section>
      </div>

      <!-- Summary -->
      <aside class="lg:sticky lg:top-4" aria-label="Summary">
        <div class="overflow-hidden rounded-2xl border shadow-card border-line bg-surface">
          <div class="px-5 py-4 text-white summary-head">
            <p class="text-xs tracking-wide uppercase opacity-80">Total claimed</p>
            <p class="mt-1 text-3xl font-semibold tabular-nums">{{ formatCurrency(grandTotal) }}</p>
          </div>
          <dl class="px-5 py-4 space-y-3 text-sm">
            <div class="flex gap-3 justify-between">
              <dt class="text-ink-muted">Patient</dt>
              <dd class="font-medium text-right truncate text-ink">{{ patient?.name || "—" }}</dd>
            </div>
            <div class="flex gap-3 justify-between">
              <dt class="text-ink-muted">Provider</dt>
              <dd class="font-medium text-right truncate text-ink">{{ providerName.trim() || "—" }}</dd>
            </div>
            <div class="flex gap-3 justify-between">
              <dt class="text-ink-muted">Date</dt>
              <dd class="font-medium text-ink">{{ providedDate || "—" }}</dd>
            </div>
            <div class="flex gap-3 justify-between">
              <dt class="text-ink-muted">Services</dt>
              <dd class="font-medium tabular-nums text-ink">{{ serviceCount }}</dd>
            </div>
            <div class="flex gap-3 justify-between">
              <dt class="text-ink-muted">Drugs</dt>
              <dd class="font-medium tabular-nums text-ink">{{ drugCount }}</dd>
            </div>
            <div class="flex gap-3 justify-between">
              <dt class="text-ink-muted">Receipts</dt>
              <dd class="font-medium tabular-nums text-ink">{{ files.length }}</dd>
            </div>
          </dl>
          <div class="px-5 pb-5 space-y-2">
            <Button type="primary" class="w-full" :pending="saveReq.pending.value" @click="save">Save services</Button>
            <Button type="secondary" class="w-full" :disabled="saveReq.pending.value" @click="active = 0">← Back to eligibility</Button>
          </div>
        </div>
      </aside>
    </div>
    </template>
    </div>
  </DefaultPage>
</template>

<style scoped>
.step {
  display: grid;
  place-items: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 9999px;
  font-size: 0.8125rem;
  font-weight: 600;
  color: rgb(var(--primary));
  background: rgb(var(--primary) / 0.1);
}
.field-label {
  display: block;
  margin-bottom: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: rgb(var(--ink));
}
.field {
  width: 100%;
  height: 2.5rem;
  padding: 0 0.75rem;
  font-size: 0.875rem;
  color: rgb(var(--ink));
  background: rgb(var(--surface));
  border: 1px solid rgb(var(--line-strong));
  border-radius: 0.5rem;
  transition: border-color 150ms ease, box-shadow 150ms ease;
}
.field::placeholder {
  color: rgb(var(--ink-subtle));
}
.field:focus {
  outline: none;
  border-color: rgb(var(--primary));
  box-shadow: var(--focus-ring);
}
.field:disabled {
  background: rgb(var(--surface-muted));
  cursor: not-allowed;
}
.field--error {
  border-color: rgb(var(--error));
}
.field-error {
  margin-top: 0.375rem;
  font-size: 0.75rem;
  color: rgb(var(--error));
}
.chip-btn {
  height: 2rem;
  padding: 0 0.75rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: rgb(var(--primary));
  border: 1px solid rgb(var(--primary) / 0.25);
  border-radius: 9999px;
  transition: background-color 150ms ease;
}
.chip-btn:hover {
  background: rgb(var(--primary) / 0.06);
}
.summary-head {
  background: linear-gradient(135deg, rgb(var(--primary)), rgb(var(--primary-hover)));
}
.slide-left-enter-active,
.slide-left-leave-active {
  transition: all 0.3s ease;
}
.slide-left-enter-from {
  opacity: 0;
  transform: translateX(10px);
}
.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}
</style>
