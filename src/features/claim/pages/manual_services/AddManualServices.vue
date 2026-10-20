<script setup>
// Manually enter services or drugs for an insured, as a two-step wizard like Cash Services:
// 1. Eligibility Check (shared with Cash Services)  2. a services form laid out like Cash Services.
// Cash mode (/cash_claims/manual) posts like the Cash Services page's "Other provider" mode;
// credit mode (/credit_claims/manual, route meta serviceType CREDIT) creates a manual credit service.
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import DefaultPage from "@/components/DefaultPage.vue";
import CustomSelect from "@/components/CustomSelect.vue";
import datePicker from "@/components/datePicker.vue";
import Table from "@/components/Table.vue";
import ModalFormSubmitButton from "@/components/new_form_builder/ModalFormSubmitButton.vue";
import EligibilityCheck from "@/features/claim/components/cash_services/EligibilityCheck.vue";
import { useApiRequest } from "@/composables/useApiRequest";
import { getInstitutionContracts } from "@/features/underwriting/api/underwritingApi";
import { getPackageDropdown } from "@/features/product_settings/api/coverageApi";
import { getAlreadyMappedActiveProviders } from "@/features/providers/api/providerApi";
import { addEligibleService } from "@/features/provider_contracts/service/api/serviceApi";
import { searchPackageServices, searchDrugLibrary } from "../../api/manualEntryApi";
import {
  createCashServiceProvided,
  createCreditServiceProvided,
  getServiceProvidedById,
  updateManualCreditServiceProvided,
} from "../../api/claimApi";
import { formatCurrency, toasted } from "@/utils/utils";
import { canEditServiceProvided, editLockReason } from "../../utils/serviceEditLock";
import icons from "@/utils/icons";

const route = useRoute();
const router = useRouter();

const isCredit = computed(() => route.meta?.serviceType === "CREDIT");
const listPath = computed(() => (isCredit.value ? "/credit_claims" : "/cash_claims"));
// Edit an existing manual credit service: /credit_claims/manual?edit=<serviceProvidedUuid>
const editId = computed(() => (isCredit.value && route.query.edit ? String(route.query.edit) : ""));
const isEdit = computed(() => !!editId.value);
const steps = computed(() => [
  "Eligibility Check",
  isEdit.value ? "Edit Credit Service" : isCredit.value ? "Credit Services" : "Manual Services",
]);

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
// Policy period info from Eligibility Check (cash period window; Nyala also sends begin/end)
const eligibilityPeriod = ref({});
// Provider saved on a record being edited, until it's matched in the provider list
const pendingProvider = ref(null);
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
  eligibilityPeriod.value = {
    cashPeriodLimitPerDay: payload.cashPeriodLimitPerDay,
    beginDate: payload.beginDate,
    endDate: payload.endDate,
  };
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
  if (isEdit.value) return; // the person can't change while editing
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

/* ---------- Contract (from Eligibility Check; only asked for when it can't be inferred) ---------- */
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
        // Editing: the record only has the provider's contract, so find the institution contract it belongs to
        if (!contractUuid.value && pendingProvider.value?.contract) findContractOfProvider(pendingProvider.value.contract);
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
// Pre-filled from the list with several contracts: the only case where we must ask
const needsContract = computed(() => !presetContract.value && contracts.value.length > 1 && !findingContract.value);

const findingContract = ref(false);
async function findContractOfProvider(providerContract) {
  findingContract.value = true;
  try {
    for (const c of contracts.value) {
      const res = await getAlreadyMappedActiveProviders(c.payerInstitutionContractUuid);
      if (toList(res).some((p) => p.payerProviderContractUuid === providerContract)) {
        presetContract.value = c.payerInstitutionContractUuid;
        contractUuid.value = c.payerInstitutionContractUuid;
        return;
      }
    }
  } finally {
    findingContract.value = false;
  }
}

/* ---------- Provider (providers mapped to the contract, or "Other") ---------- */
const OTHER = "OTHER";
const providers = ref([]);
const providerUuid = ref("");
const otherProviderName = ref("");
const providersReq = useApiRequest();
watch(
  contractUuid,
  (id) => {
    providers.value = [];
    providerUuid.value = "";
    if (!id) return;
    providersReq.send(
      () => getAlreadyMappedActiveProviders(id),
      (res) => {
        providers.value = toList(res);
        applyPendingProvider();
      }
    );
  },
  { immediate: true }
);
// Credit needs the provider's contract UUID, so a provider outside the list ("Other") is cash-only
const providerOptions = computed(() => [
  ...providers.value.map((p) => ({ value: p.providerUuid, label: p.providerName })),
  ...(isCredit.value ? [] : [{ value: OTHER, label: "🔹 Other Provider" }]),
]);
const isOtherProvider = computed(() => providerUuid.value === OTHER);
const selectedProvider = computed(() => providers.value.find((p) => p.providerUuid === providerUuid.value) || null);
const providerName = computed(() =>
  isOtherProvider.value ? otherProviderName.value.trim() : selectedProvider.value?.providerName || ""
);

// Search-and-select combobox over the loaded providers
const providerQuery = ref("");
const providerOpen = ref(false);
const providerHighlight = ref(0);
const selectedProviderLabel = computed(() =>
  isOtherProvider.value ? "🔹 Other Provider" : selectedProvider.value?.providerName || ""
);
const filteredProviderOptions = computed(() => {
  const q = providerQuery.value.trim().toLowerCase();
  const list = providerOptions.value.filter((o) => o.value !== OTHER && (!q || o.label?.toLowerCase().includes(q)));
  const other = providerOptions.value.find((o) => o.value === OTHER);
  return other ? [...list, other] : list;
});
function openProviderList() {
  providerQuery.value = "";
  providerHighlight.value = 0;
  providerOpen.value = true;
}
function closeProviderList() {
  providerOpen.value = false;
  providerQuery.value = "";
}
function chooseProvider(option) {
  providerUuid.value = option.value;
  closeProviderList();
}
function onProviderKeydown(e) {
  const count = filteredProviderOptions.value.length;
  if (!providerOpen.value && ["ArrowDown", "Enter"].includes(e.key)) {
    openProviderList();
    e.preventDefault();
    return;
  }
  if (e.key === "ArrowDown") {
    providerHighlight.value = (providerHighlight.value + 1) % count;
    e.preventDefault();
  } else if (e.key === "ArrowUp") {
    providerHighlight.value = (providerHighlight.value - 1 + count) % count;
    e.preventDefault();
  } else if (e.key === "Enter") {
    const option = filteredProviderOptions.value[providerHighlight.value];
    if (option) chooseProvider(option);
    e.preventDefault();
  } else if (e.key === "Escape") {
    closeProviderList();
  }
}
watch(providerQuery, () => {
  providerHighlight.value = 0;
});

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

/* ---------- Package balance (same rules as Cash Services) ---------- */
const isDependent = computed(() => !!patient.value?.dependantUuid);
// When editing, the record's own amounts are already in "used"; add them back
const initialEditPackageTotals = ref({});

function getPackageLimit(p) {
  if (!p) return 0;
  if (isDependent.value) {
    const depLimit = Number(p.depSumAssured ?? 0);
    if (Number.isFinite(depLimit) && depLimit > 0) return depLimit;
  }
  const limit = Number(p.sumAssured ?? 0);
  return Number.isFinite(limit) ? limit : 0;
}
function getPackageUsed(p) {
  if (!p) return 0;
  if (isDependent.value) {
    const depUsed = Number(p.depUsedBenefit ?? 0);
    if (Number.isFinite(depUsed) && depUsed > 0) return depUsed;
  }
  const used = Number(p.used ?? 0);
  return Number.isFinite(used) ? used : 0;
}
function getAdjustedUsed(p) {
  if (!p) return 0;
  const initial = initialEditPackageTotals.value[p.packageUuid] || 0;
  return Math.max(0, getPackageUsed(p) - initial);
}
// Packages can share a "cup" limit with others
function getCupUuid(p) {
  if (!p) return null;
  if (p.cupPackageUuid) return p.cupPackageUuid;
  return packages.value.some((x) => x?.cupPackageUuid === p.packageUuid) ? p.packageUuid : null;
}
function getCupStart(cupUuid) {
  const cupPkg = packages.value.find((x) => x?.packageUuid === cupUuid);
  const members = packages.value.filter((x) => x?.cupPackageUuid === cupUuid || x?.packageUuid === cupUuid);
  return getPackageLimit(cupPkg) - members.reduce((sum, x) => sum + getAdjustedUsed(x), 0);
}

const selectedPackage = computed(() => packages.value.find((p) => p.packageUuid === pkg.value) || null);
const packageBalance = computed(() => {
  const p = selectedPackage.value;
  if (!p) return null;
  const limit = getPackageLimit(p);
  const used = getAdjustedUsed(p);
  const cart = items.value.reduce((sum, i) => sum + i.totalPrice, 0);
  let remaining = limit - used - cart;
  const cupUuid = getCupUuid(p);
  if (cupUuid) remaining = Math.min(remaining, getCupStart(cupUuid) - cart);
  return { limit, used, cart, remaining, available: remaining + cart };
});

// Running balance after each item (every item uses the selected package)
const itemsWithBalance = computed(() => {
  const p = selectedPackage.value;
  if (!p) return items.value.map((it) => ({ ...it, remainingAfter: null, isOverLimit: false, overBy: 0 }));
  const cupUuid = getCupUuid(p);
  let own = getPackageLimit(p) - getAdjustedUsed(p);
  let cup = cupUuid ? getCupStart(cupUuid) : Infinity;
  return items.value.map((it) => {
    own -= it.totalPrice;
    cup -= it.totalPrice;
    const after = Math.min(own, cup);
    return { ...it, remainingAfter: after, isOverLimit: after < 0, overBy: after < 0 ? -after : 0 };
  });
});

/* ---------- Date, reference & invoice ---------- */
const referenceNumber = ref("");
const invoiceNumber = ref("");

function toISODate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function parsePeriodDays(input) {
  const n = Number(String(input ?? "").match(/\d+/)?.[0]);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 90;
}
const today = toISODate(new Date());
const providedDate = ref(today);
const originalProvidedDate = ref(""); // a record being edited keeps its own date valid

// Allowed service dates, like Cash Services: the claim window up to today, inside the policy period
const selectedInstitutionContract = computed(
  () => contracts.value.find((c) => c.payerInstitutionContractUuid === contractUuid.value) || null
);
const periodDays = computed(() =>
  parsePeriodDays(selectedInstitutionContract.value?.cashPeriodLimitPerDay ?? eligibilityPeriod.value.cashPeriodLimitPerDay)
);
const policyBegin = computed(() =>
  String(selectedInstitutionContract.value?.beginDate || eligibilityPeriod.value.beginDate || "").slice(0, 10)
);
const policyEnd = computed(() =>
  String(selectedInstitutionContract.value?.endDate || eligibilityPeriod.value.endDate || "").slice(0, 10)
);
const minProvidedDate = computed(() => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - periodDays.value);
  let min = toISODate(d);
  if (policyBegin.value && policyBegin.value > min) min = policyBegin.value;
  if (originalProvidedDate.value && originalProvidedDate.value < min) min = originalProvidedDate.value;
  return min;
});
const maxProvidedDate = computed(() => (policyEnd.value && policyEnd.value < today ? policyEnd.value : today));
const isProvidedDateOutOfRange = computed(
  () => !!providedDate.value && (providedDate.value < minProvidedDate.value || providedDate.value > maxProvidedDate.value)
);

// Provider, package, date, reference + optional contract / other-provider name / invoice
const headerGridClass = computed(() => {
  const count = 4 + [needsContract.value, isOtherProvider.value].filter(Boolean).length;
  return {
    4: "md:grid-cols-2 lg:grid-cols-4",
    5: "md:grid-cols-3 xl:grid-cols-5",
    6: "md:grid-cols-3 xl:grid-cols-6",
    7: "md:grid-cols-4 2xl:grid-cols-7",
  }[count];
});

/* ---------- Items list ---------- */
const items = ref([]);
// Existing items removed while editing are sent back flagged deleted
const removedItems = ref([]);
const grandTotal = computed(() => items.value.reduce((sum, i) => sum + i.totalPrice, 0));

/* ---------- Entry row (Service / Drug), like Cash Services' manual entry ---------- */
const activeItemTab = ref("SERVICE");
const entryCode = ref("");
const entryName = ref("");
const entryPrice = ref(null);
const entryQty = ref(1);
const editingIndex = ref(null);

const entryTotal = computed(() => (Number(entryPrice.value) || 0) * (Number(entryQty.value) || 0));

// What the typed name refers to: an eligible service / library drug picked from the search
const entryRef = ref(null); // { kind: "SERVICE", serviceId, eligibleServiceUuid } | { kind: "DRUG", drugUuid }
const editingOriginalName = ref("");

// Services must be eligible (picked from the package search, or added to the contract);
// drugs may be typed when they aren't in the library
const canAddEntry = computed(() => {
  if (!entryName.value.trim() || !(Number(entryPrice.value) > 0) || !(Number(entryQty.value) > 0)) return false;
  if (activeItemTab.value === "DRUG") return true;
  if (entryRef.value?.kind === "SERVICE") return true;
  return editingIndex.value !== null && entryName.value.trim() === editingOriginalName.value; // unchanged saved item
});
const entryNeedsPick = computed(
  () => activeItemTab.value === "SERVICE" && !!entryName.value.trim() && !canAddEntry.value && !entryRef.value
);

function resetEntry() {
  entryCode.value = "";
  entryName.value = "";
  entryPrice.value = null;
  entryQty.value = 1;
  editingIndex.value = null;
  entryRef.value = null;
  editingOriginalName.value = "";
  suggestions.value = [];
  suggestOpen.value = false;
  addNew.value = null;
}

/* ---------- Search: eligible services (package @ provider) / drug library ---------- */
const suggestions = ref([]);
const suggestOpen = ref(false);
const suggestHighlight = ref(0);
const suggestReq = useApiRequest();
let suggestTimer;
const providerContractUuid = computed(() => selectedProvider.value?.payerProviderContractUuid || "");
const serviceSearchReady = computed(() => !!pkg.value && !!providerContractUuid.value);
const minChars = computed(() => (activeItemTab.value === "DRUG" ? 2 : 1));
const searchField = ref("name"); // the list searches by whichever field you type in
const searchQuery = computed(() => (searchField.value === "code" ? entryCode.value : entryName.value).trim());

// Keep only real matches on name or code (the API may return a wider list)
function matchesQuery(sg, q) {
  const needle = q.toLowerCase();
  return (sg.name || "").toLowerCase().includes(needle) || (sg.code || "").toLowerCase().includes(needle);
}

function toRows(res) {
  const raw = res?.data ?? res;
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.packageEligibleServices)) return raw.packageEligibleServices;
  if (Array.isArray(raw?.content)) return raw.content;
  if (Array.isArray(raw?.data?.packageEligibleServices)) return raw.data.packageEligibleServices;
  if (Array.isArray(raw?.data?.content)) return raw.data.content;
  if (Array.isArray(raw?.data)) return raw.data;
  return [];
}

function runSuggest() {
  const q = searchQuery.value;
  if (q.length < minChars.value || (activeItemTab.value === "SERVICE" && !serviceSearchReady.value)) {
    suggestions.value = [];
    return;
  }
  const tab = activeItemTab.value;
  suggestReq.send(
    () =>
      tab === "DRUG"
        ? searchDrugLibrary(q, { limit: 20 })
        : searchPackageServices(pkg.value, { payerProviderContractUuid: providerContractUuid.value, search: q, limit: 100 }),
    (res) => {
      if (tab !== activeItemTab.value || q !== searchQuery.value) return; // a newer search is on its way
      const rows = toRows(res);
      const mapped =
        tab === "DRUG"
          ? rows
              .filter((d) => d?.active !== false)
              .map((d) => ({
                kind: "DRUG",
                key: d.drugUuid,
                name: d.drugName,
                code: d.drugCode,
                meta: [d.dosageForm, d.category].filter(Boolean).join(" · "),
                drugUuid: d.drugUuid,
              }))
          : rows.map((sv) => ({
              kind: "SERVICE",
              key: sv.eligibleServiceUuid || sv.serviceId || sv.itemCode,
              name: sv.item || sv.serviceName || sv.itemName,
              code: sv.itemCode || sv.serviceCode,
              price: Number(sv.price ?? sv.unitPrice) || null,
              meta: [sv.category, sv.subCategory].filter(Boolean).join(" · "),
              serviceId: sv.serviceId || sv.eligibleServiceUuid,
              eligibleServiceUuid: sv.eligibleServiceUuid,
            }));
      suggestions.value = mapped.filter((sg) => matchesQuery(sg, q)).slice(0, 25);
      suggestHighlight.value = 0;
    }
  );
}

function startSearch() {
  entryRef.value = null; // typing again un-picks
  addNew.value = null;
  suggestOpen.value = true;
  clearTimeout(suggestTimer);
  suggestTimer = setTimeout(runSuggest, 300);
}
function onEntryNameInput(e) {
  entryName.value = e.target.value;
  searchField.value = "name";
  startSearch();
}
function onEntryCodeInput(e) {
  entryCode.value = e.target.value;
  searchField.value = "code";
  startSearch();
}
function focusSearch(field) {
  if (searchField.value !== field) {
    searchField.value = field;
    suggestions.value = [];
    if (searchQuery.value.length >= minChars.value && !entryRef.value) {
      clearTimeout(suggestTimer);
      suggestTimer = setTimeout(runSuggest, 150);
    }
  }
  suggestOpen.value = true;
}

function pickSuggestion(sg) {
  entryName.value = sg.name || "";
  entryCode.value = sg.code || "";
  if (sg.kind === "SERVICE") {
    if (sg.price) entryPrice.value = sg.price;
    entryRef.value = { kind: "SERVICE", serviceId: sg.serviceId, eligibleServiceUuid: sg.eligibleServiceUuid };
  } else {
    entryRef.value = { kind: "DRUG", drugUuid: sg.drugUuid };
  }
  suggestOpen.value = false;
}

// Options shown under the name field: results, then "add as new" for services
const suggestOptions = computed(() => {
  const list = suggestions.value.map((sg) => ({ ...sg, type: "pick" }));
  const q = searchQuery.value;
  if (activeItemTab.value === "SERVICE" && q && serviceSearchReady.value && !suggestReq.pending.value) {
    const exact = suggestions.value.some(
      (sg) => sg.name?.trim().toLowerCase() === q.toLowerCase() || sg.code?.trim().toLowerCase() === q.toLowerCase()
    );
    if (!exact) list.push({ type: "new", key: "__new__", name: q });
  }
  return list;
});

function chooseOption(opt) {
  if (opt.type === "new") startAddNew();
  else pickSuggestion(opt);
}

function onEntryNameKeydown(e) {
  const count = suggestOptions.value.length;
  if (e.key === "ArrowDown" && count) {
    suggestOpen.value = true;
    suggestHighlight.value = (suggestHighlight.value + 1) % count;
    e.preventDefault();
  } else if (e.key === "ArrowUp" && count) {
    suggestHighlight.value = (suggestHighlight.value - 1 + count) % count;
    e.preventDefault();
  } else if (e.key === "Enter") {
    e.preventDefault();
    if (suggestOpen.value && count) chooseOption(suggestOptions.value[suggestHighlight.value]);
    else addEntry();
  } else if (e.key === "Escape") {
    suggestOpen.value = false;
  }
}

watch(activeItemTab, () => {
  suggestions.value = [];
  entryRef.value = null;
  addNew.value = null;
});

/* ---------- Add a service that isn't on the provider's contract yet ---------- */
const addNew = ref(null); // { itemCode, item, category, price }
const addNewReq = useApiRequest();

function startAddNew() {
  addNew.value = {
    itemCode: entryCode.value.trim(),
    item: searchField.value === "code" ? "" : entryName.value.trim(),
    category: "",
    price: entryPrice.value,
  };
  suggestOpen.value = false;
}

function saveNewService() {
  const n = addNew.value;
  if (!n || !n.item.trim() || !n.itemCode.trim() || !(Number(n.price) > 0)) {
    toasted(false, "", "Enter the service code, name and price");
    return;
  }
  const contract = providerContractUuid.value;
  addNewReq.send(
    () =>
      addEligibleService(contract, {
        itemCode: n.itemCode.trim(),
        item: n.item.trim(),
        category: n.category.trim() || undefined,
        price: Number(n.price),
        payerProviderContractUuid: contract,
        status: "ACTIVE",
      }),
    (res) => {
      if (!res?.success) {
        toasted(false, "", res?.error || "Couldn't add the service to the contract");
        return;
      }
      const created = res?.data?.data ?? res?.data ?? {};
      entryName.value = created.item || n.item.trim();
      entryCode.value = created.itemCode || n.itemCode.trim();
      entryPrice.value = Number(created.price ?? n.price);
      entryRef.value = {
        kind: "SERVICE",
        serviceId: created.serviceId || created.eligibleServiceUuid,
        eligibleServiceUuid: created.eligibleServiceUuid,
      };
      addNew.value = null;
      toasted(true, `Added to ${selectedProvider.value?.providerName || "the provider"}'s contract`);
    }
  );
}

function addEntry() {
  if (!canAddEntry.value) return;
  const existing = editingIndex.value !== null ? items.value[editingIndex.value] : null;
  const row = {
    serviceId: entryRef.value?.kind === "SERVICE" ? entryRef.value.serviceId || "" : existing?.serviceId || "",
    itemUuid: existing?.itemUuid || "",
    itemType: activeItemTab.value,
    serviceCode: entryCode.value.trim(),
    serviceName: entryName.value.trim(),
    unitPrice: Number(entryPrice.value),
    qty: Number(entryQty.value),
    totalPrice: entryTotal.value,
  };
  if (editingIndex.value !== null) {
    items.value.splice(editingIndex.value, 1, row);
    toasted(true, "Item updated");
  } else {
    items.value.push(row);
  }
  resetEntry();
}

// Table rows are copies (with balance); map back to the real item by position
function itemIndexOf(row) {
  return itemsWithBalance.value.findIndex((r) => r === row);
}

function editItem(row) {
  const index = itemIndexOf(row);
  if (index === -1) return;
  activeItemTab.value = row.itemType;
  entryCode.value = row.serviceCode;
  entryName.value = row.serviceName;
  editingOriginalName.value = row.serviceName;
  entryRef.value = null;
  entryPrice.value = row.unitPrice;
  entryQty.value = row.qty;
  editingIndex.value = index;
}
function removeItem(row) {
  const index = itemIndexOf(row);
  if (index === -1) return;
  const [removed] = items.value.splice(index, 1);
  if (removed.itemUuid) removedItems.value.push(removed);
  if (editingIndex.value === index) resetEntry();
}

/* ---------- Attachments ---------- */
const files = ref([]);
function onFilesSelected(e) {
  const list = Array.from(e?.target?.files || []);
  files.value = [...files.value, ...list].slice(0, 20);
  e.target.value = "";
}
function removeFile(i) {
  files.value.splice(i, 1);
}

/* ---------- Validation ---------- */
const submitted = ref(false);
const missingRequiredFields = computed(() => {
  const m = [];
  if (!patient.value?.insuredPersonUuid) m.push("Patient");
  if (!contractUuid.value) m.push("Contract");
  if (!providerUuid.value) m.push("Provider");
  else if (isOtherProvider.value && !otherProviderName.value.trim()) m.push("Provider Name");
  else if (isCredit.value && !selectedProvider.value?.payerProviderContractUuid) m.push("A provider with a contract");
  if (isCredit.value && !isEdit.value && !invoiceNumber.value.trim()) m.push("Invoice Number");
  if (!pkg.value) m.push("Package");
  if (!providedDate.value) m.push("Service Date");
  if (!items.value.length) m.push("At least one service or drug");
  return m;
});

/* ---------- Submit ---------- */
const saveReq = useApiRequest();
const submitAction = ref("");

function submit(action) {
  submitted.value = true;
  if (missingRequiredFields.value.length) {
    toasted(false, "", `Missing required: ${missingRequiredFields.value.join(", ")}`);
    return;
  }
  if (isProvidedDateOutOfRange.value) {
    toasted(false, "", `Service date must be between ${minProvidedDate.value} and ${maxProvidedDate.value}`);
    return;
  }

  // contractUuid is the provider's contract UUID (required by manualCreditService);
  // cash falls back to the institution contract for an "Other" provider, as Cash Services does.
  const body = {
    contractUuid: isOtherProvider.value ? contractUuid.value : selectedProvider.value?.payerProviderContractUuid,
    providerName: providerName.value,
    totalPrice: grandTotal.value,
    providedDate: providedDate.value,
    insuredUuid: patient.value.insuredPersonUuid,
    dependentUuid: patient.value.dependantUuid || undefined,
    ...(isCredit.value && invoiceNumber.value.trim() ? { invoiceNumber: invoiceNumber.value.trim() } : {}),
    deleted: false,
    items: [
      ...items.value.map((item) => ({ ...item, deleted: false })),
      ...removedItems.value.map((item) => ({ ...item, deleted: true })),
    ].map((item) => ({
      ...(item.serviceId ? { serviceId: item.serviceId } : {}),
      ...(item.itemUuid ? { itemUuid: item.itemUuid } : {}),
      serviceName: item.serviceName,
      serviceCode: item.serviceCode,
      qty: item.qty,
      totalPrice: item.totalPrice,
      recordNumber: isCredit.value ? invoiceNumber.value.trim() : referenceNumber.value.trim(),
      packageUuid: pkg.value,
      itemType: item.itemType,
      c_section: false,
      deleted: item.deleted,
    })),
  };

  const form = new FormData();
  files.value.forEach((f) => form.append("attachment", f));
  // Multipart field names as the backend defines them (the cash endpoint's has a trailing space)
  if (isEdit.value) {
    // Same field the manual-credit update has always used
    form.append("itemRequests", JSON.stringify(body));
  } else {
    form.append(isCredit.value ? "serviceProvidedRequest" : "serviceProvidedRequest ", JSON.stringify(body));
  }

  submitAction.value = action;
  saveReq.send(
    () =>
      isEdit.value
        ? updateManualCreditServiceProvided(editId.value, form)
        : isCredit.value
        ? createCreditServiceProvided(form)
        : createCashServiceProvided(form),
    (res) => {
      if (res.success) {
        toasted(true, isEdit.value ? "Credit service updated" : isCredit.value ? "Credit service submitted" : "Service submitted");
        if (action === "close") router.push(listPath.value);
        else if (action === "claims") goToCreateClaims();
        else startNextPerson();
      } else {
        toasted(false, "", res.error || "Failed to submit");
      }
    }
  );
}

/* ---------- Edit: load the existing record ---------- */
const editReq = useApiRequest();
function applyPendingProvider() {
  if (!pendingProvider.value) return;
  const { contract, uuid, name } = pendingProvider.value;
  const match =
    providers.value.find((p) => contract && p.payerProviderContractUuid === contract) ||
    providers.value.find((p) => uuid && p.providerUuid === uuid) ||
    providers.value.find((p) => name && p.providerName?.trim().toLowerCase() === name.trim().toLowerCase());
  if (match) {
    providerUuid.value = match.providerUuid;
    pendingProvider.value = null;
  }
}

function hydrateFromRecord(data) {
  const provided = Array.isArray(data?.providedItemResponses) ? data.providedItemResponses : [];
  presetContract.value = data?.payerInstitutionContractUuid || "";
  institutionUuid.value = data?.institutionUuid || institutionUuid.value;
  patient.value = {
    insuredPersonUuid: data?.insuredPersonUuid || data?.insuredUuid || "",
    dependantUuid: data?.dependantUuid || data?.dependentUuid || null,
    name: cleanName(data?.dependantName || data?.insuredName || data?.fullname),
    profile: null,
  };
  pendingProvider.value = { contract: data?.contractUuid, uuid: data?.providerUuid, name: data?.providerName };
  providedDate.value = data?.providedDate ? String(data.providedDate).slice(0, 10) : providedDate.value;
  originalProvidedDate.value = data?.providedDate ? String(data.providedDate).slice(0, 10) : "";
  invoiceNumber.value = data?.invoiceNumber || "";
  referenceNumber.value = data?.recordNumber || provided[0]?.recordNumber || "";
  items.value = provided.map((it) => ({
    serviceId: it?.itemId || it?.serviceId || "",
    itemUuid: it?.providedItemUuid || it?.itemUuid || "",
    itemType: String(it?.itemType || "SERVICE").toUpperCase() === "DRUG" ? "DRUG" : "SERVICE",
    serviceCode: it?.itemCode || it?.serviceCode || "",
    serviceName: it?.itemName || it?.serviceName || "",
    unitPrice: Number(it?.unitPrice) || (Number(it?.totalPrice) || 0) / (Number(it?.quantity) || 1),
    qty: Number(it?.quantity || it?.qty) || 1,
    totalPrice: Number(it?.totalPrice) || 0,
  }));
  removedItems.value = [];
  initialEditPackageTotals.value = provided.reduce((totals, it) => {
    if (it?.packageUuid) totals[it.packageUuid] = (totals[it.packageUuid] || 0) + (Number(it?.totalPrice) || 0);
    return totals;
  }, {});
  const firstPkg = provided.find((it) => it?.packageUuid)?.packageUuid;
  if (firstPkg) pendingPackage = firstPkg;
  active.value = 1;
  applyPendingProvider();
}

let pendingPackage = "";
watch(packages, () => {
  if (pendingPackage && packages.value.some((p) => p.packageUuid === pendingPackage)) {
    pkg.value = pendingPackage;
    pendingPackage = "";
  }
});

if (isEdit.value) {
  active.value = 1;
  editReq.send(
    () => getServiceProvidedById(editId.value),
    (res) => {
      if (!res?.success) {
        toasted(false, "", "Couldn't load this credit service");
        return;
      }
      const record = res?.data ?? res;
      if (!canEditServiceProvided(record)) {
        toasted(false, "", editLockReason(record));
        router.replace(listPath.value);
        return;
      }
      hydrateFromRecord(record);
    }
  );
}

// Like Cash Services' "Submit & Generate": open Create Claims pre-filtered and generate straight away
function goToCreateClaims() {
  if (isCredit.value) {
    router.push({
      path: "/create_credit_claims",
      query: {
        contractUuid: selectedProvider.value?.payerProviderContractUuid || "",
        providerUuid: selectedProvider.value?.providerUuid || "",
        providerName: selectedProvider.value?.providerName || "",
        autoGenerate: "1",
      },
    });
  } else {
    router.push({ path: "/create_cash_claims", query: { institutionUuid: institutionUuid.value, autoGenerate: "1" } });
  }
}

// Back to Eligibility Check for another person of the same institution (as Cash Services does)
function startNextPerson() {
  items.value = [];
  removedItems.value = [];
  initialEditPackageTotals.value = {};
  files.value = [];
  referenceNumber.value = "";
  invoiceNumber.value = "";
  submitted.value = false;
  resetEntry();
  patient.value = null;
  eligibilityRef.value?.resetForNextPerson?.();
  active.value = 0;
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
              <span v-else>💳</span>
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

      <!-- Edit: loading the record -->
      <div v-if="isEdit && editReq.pending.value" class="flex gap-3 justify-center items-center py-16 text-sm text-ink-muted">
        <svg class="w-5 h-5 animate-spin text-primary" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-opacity="0.25" stroke-width="3" />
          <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
        </svg>
        Loading credit service…
      </div>

      <!-- Step 2: services, laid out like Cash Services -->
      <div v-else-if="active === 1" class="mx-auto space-y-6 w-full max-w-2xl xl:max-w-4xl 2xl:max-w-[80rem]">
        <!-- Provider, Package, Date & Reference (same line) -->
        <div class="p-4 rounded-lg border shadow-sm bg-surface border-line">
          <div :class="['grid grid-cols-1 gap-4', headerGridClass]">
            <div v-if="needsContract">
              <label class="block mb-2 text-sm font-semibold text-ink-muted">📄 Contract<span class="text-error">*</span></label>
              <CustomSelect v-model="contractUuid" placeholder="Choose contract..." :options="contractOptions" class="w-full" />
              <p v-if="submitted && !contractUuid" class="mt-1 text-xs text-error">Contract is required.</p>
            </div>
            <div>
              <label for="provider-search" class="block mb-2 text-sm font-semibold text-ink-muted">🏥 Provider<span class="text-error">*</span></label>
              <div class="relative">
                <input
                  id="provider-search"
                  :value="providerOpen ? providerQuery : selectedProviderLabel"
                  type="text"
                  role="combobox"
                  autocomplete="off"
                  aria-autocomplete="list"
                  aria-controls="provider-listbox"
                  :aria-expanded="providerOpen"
                  :aria-activedescendant="providerOpen ? `provider-opt-${providerHighlight}` : undefined"
                  :placeholder="providerOpen ? 'Search provider...' : 'Search & select provider...'"
                  class="pr-9 pl-9 w-full h-10 text-sm rounded-md border transition-all bg-surface border-line-strong focus:ring-2 focus:ring-primary focus:border-primary"
                  @focus="openProviderList"
                  @blur="closeProviderList"
                  @input="(e) => { providerQuery = e.target.value; providerOpen = true; }"
                  @keydown="onProviderKeydown"
                />
                <svg class="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 pointer-events-none text-ink-subtle" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
                  <circle cx="9" cy="9" r="5.5" /><path d="m13.5 13.5 3 3" />
                </svg>
                <span class="grid absolute inset-y-0 right-0 place-items-center w-9 pointer-events-none text-ink-subtle" aria-hidden="true">
                  <svg v-if="providersReq.pending.value" class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-opacity="0.25" stroke-width="3" />
                    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
                  </svg>
                  <svg v-else class="w-4 h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="m6 8 4 4 4-4" /></svg>
                </span>
                <ul
                  v-if="providerOpen"
                  id="provider-listbox"
                  role="listbox"
                  class="overflow-y-auto absolute z-40 py-1 mt-1 w-full min-w-[16rem] max-h-64 rounded-lg border shadow-pop bg-surface border-line"
                >
                  <li
                    v-if="!filteredProviderOptions.some((o) => o.value !== OTHER)"
                    class="px-3 py-2 text-xs text-ink-subtle"
                  >
                    {{ providerQuery.trim() ? `No provider matches "${providerQuery.trim()}"` : "No providers mapped to this contract" }}
                  </li>
                  <li
                    v-for="(option, i) in filteredProviderOptions"
                    :id="`provider-opt-${i}`"
                    :key="option.value"
                    role="option"
                    :aria-selected="option.value === providerUuid"
                    :class="[
                      'flex gap-2 justify-between items-center px-3 py-2 text-sm cursor-pointer',
                      i === providerHighlight ? 'bg-primary/10 text-ink' : 'text-ink-muted',
                      option.value === OTHER ? 'border-t border-line mt-1' : '',
                    ]"
                    @mousedown.prevent="chooseProvider(option)"
                    @mouseenter="providerHighlight = i"
                  >
                    <span class="truncate">{{ option.label }}</span>
                    <svg v-if="option.value === providerUuid" class="w-4 h-4 shrink-0 text-primary" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 10.5 3 3 7-7" /></svg>
                  </li>
                </ul>
              </div>
              <p
                v-if="isEdit && pendingProvider && !providerUuid && !providersReq.pending.value && !findingContract"
                class="mt-1 text-xs text-warning-strong"
              >
                Saved provider “{{ pendingProvider.name || "unknown" }}” isn't in this contract's list. Choose one.
              </p>
              <p v-else-if="submitted && !providerUuid" class="mt-1 text-xs text-error">Provider is required.</p>
              <p
                v-else-if="isCredit && providerUuid && !selectedProvider?.payerProviderContractUuid"
                class="mt-1 text-xs text-error"
              >
                This provider has no contract.
              </p>
            </div>
            <div v-if="isOtherProvider">
              <label class="block mb-2 text-sm font-semibold text-ink-muted">🏢 Provider Name<span class="text-error">*</span></label>
              <input
                id="provider-name"
                v-model="otherProviderName"
                placeholder="Enter provider name..."
                class="pl-2 w-full h-10 text-sm rounded-md border transition-all bg-surface border-line-strong focus:ring-2 focus:ring-primary focus:border-primary"
              />
              <p v-if="submitted && !otherProviderName.trim()" class="mt-1 text-xs text-error">Provider name is required.</p>
            </div>
            <div>
              <label class="block mb-2 text-sm font-semibold text-ink-muted">📦 Package<span class="text-error">*</span></label>
              <CustomSelect
                v-model="pkg"
                placeholder="Choose package..."
                :options="packageOptions"
                :pending="packagesReq.pending.value"
                class="w-full"
              />
              <div v-if="packageBalance" class="mt-1.5 text-xs text-ink-muted">
                <div class="flex flex-wrap gap-x-3 gap-y-0.5">
                  <span><span class="font-semibold">Limit:</span> {{ formatCurrency(packageBalance.limit) }}</span>
                  <span><span class="font-semibold">Used:</span> {{ formatCurrency(packageBalance.used) }}</span>
                  <span><span class="font-semibold">Cart:</span> {{ formatCurrency(packageBalance.cart) }}</span>
                </div>
                <div class="mt-0.5">
                  <span class="font-semibold">Remaining:</span>
                  <span :class="packageBalance.remaining < 0 ? 'font-bold text-error-strong' : 'font-bold text-success-strong'">
                    {{ formatCurrency(packageBalance.remaining) }}
                  </span>
                  <span v-if="packageBalance.remaining < 0" class="ml-1 font-semibold text-error-strong">
                    (Over limit by {{ formatCurrency(Math.abs(packageBalance.remaining)) }})
                  </span>
                  <span v-if="isDependent" class="ml-1 text-ink-subtle">(Dependent)</span>
                </div>
              </div>
              <p v-if="submitted && !pkg" class="mt-1 text-xs text-error">Package is required.</p>
            </div>
            <div>
              <label class="block mb-2 text-sm font-semibold text-ink-muted">📅 Service Date<span class="text-error">*</span></label>
              <datePicker
                label=""
                required
                v-model="providedDate"
                :min="minProvidedDate"
                :max="maxProvidedDate"
                :error="submitted && (!providedDate || isProvidedDateOutOfRange)"
              />
              <p v-if="submitted && !providedDate" class="mt-1 text-xs text-error">Service date is required.</p>
              <p v-else-if="isProvidedDateOutOfRange" class="mt-1 text-xs text-error">
                Must be between {{ minProvidedDate }} and {{ maxProvidedDate }}.
              </p>
              <p v-else class="mt-1 text-[11px] text-ink-subtle">Allowed: {{ minProvidedDate }} → {{ maxProvidedDate }}</p>
            </div>
            <div v-if="isCredit">
              <label for="invoice-no" class="block mb-2 text-sm font-semibold text-ink-muted">🧾 Invoice No.<span v-if="!isEdit" class="text-error">*</span></label>
              <input
                id="invoice-no"
                v-model="invoiceNumber"
                placeholder="e.g., INV-1042"
                class="pl-2 w-full h-10 text-sm rounded-md border transition-all bg-surface border-line-strong focus:ring-2 focus:ring-primary focus:border-primary"
              />
              <p v-if="submitted && !isEdit && !invoiceNumber.trim()" class="mt-1 text-xs text-error">Invoice number is required.</p>
            </div>
            <div v-if="!isCredit">
              <label class="block mb-2 text-sm font-semibold text-ink-muted">🔖 Reference No.</label>
              <input
                id="reference-no"
                v-model="referenceNumber"
                placeholder="e.g., CR-002"
                class="pl-2 w-full h-10 text-sm rounded-md border transition-all bg-surface border-line-strong focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>
        </div>

        <!-- Service / Drug entry -->
        <div class="p-4 rounded-lg border shadow-sm bg-surface border-line">
          <div class="flex gap-2 items-center mb-4">
            <button
              type="button"
              :class="[
                'px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors',
                activeItemTab === 'SERVICE' ? 'bg-primary text-white border-primary' : 'bg-surface text-ink-muted border-line-strong hover:bg-surface-muted',
              ]"
              @click="activeItemTab = 'SERVICE'"
            >
              Service
            </button>
            <button
              type="button"
              :class="[
                'px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors',
                activeItemTab === 'DRUG' ? 'bg-error text-white border-error' : 'bg-surface text-ink-muted border-line-strong hover:bg-surface-muted',
              ]"
              @click="activeItemTab = 'DRUG'"
            >
              Drug
            </button>
          </div>

          <div
            :class="[
              'p-4 rounded-lg border shadow-sm',
              activeItemTab === 'SERVICE' ? 'bg-primary/5 border-primary/20' : 'bg-warning-soft border-error/20',
            ]"
          >
            <h3 :class="['mb-4 text-sm font-bold', activeItemTab === 'SERVICE' ? 'text-primary-hover' : 'text-error-strong']">
              {{ activeItemTab === "SERVICE" ? "📝 Service Entry" : "💊 Drug Entry" }}
            </h3>
            <div class="grid grid-cols-1 gap-4 items-start sm:grid-cols-2 lg:grid-cols-9">
              <div class="relative lg:col-span-2">
                <label for="entry-code" class="block mb-2 text-xs font-semibold text-ink-muted">Code</label>
                <div class="relative">
                  <svg class="absolute left-2.5 top-1/2 w-4 h-4 -translate-y-1/2 pointer-events-none text-ink-subtle" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
                    <circle cx="9" cy="9" r="5.5" /><path d="m13.5 13.5 3 3" />
                  </svg>
                  <input
                    id="entry-code"
                    :value="entryCode"
                    role="combobox"
                    autocomplete="off"
                    aria-autocomplete="list"
                    aria-controls="entry-code-suggestions"
                    :aria-expanded="searchField === 'code' && suggestOpen && !!suggestOptions.length"
                    :disabled="activeItemTab === 'SERVICE' && !serviceSearchReady"
                    :placeholder="activeItemTab === 'SERVICE' ? 'Search code, e.g. SRV001' : 'Search code, e.g. DRG001'"
                    class="py-2 pr-2 pl-8 w-full text-sm rounded border transition-all bg-surface border-line-strong focus:ring-2 focus:ring-primary disabled:bg-surface-muted disabled:cursor-not-allowed"
                    @input="onEntryCodeInput"
                    @focus="focusSearch('code')"
                    @blur="suggestOpen = false"
                    @keydown="onEntryNameKeydown"
                  />
                </div>
                <ul
                  v-if="searchField === 'code' && suggestOpen && searchQuery.length >= minChars && (suggestOptions.length || !suggestReq.pending.value)"
                  id="entry-code-suggestions"
                  role="listbox"
                  class="overflow-y-auto absolute z-40 py-1 mt-1 w-full min-w-[18rem] max-h-72 rounded-lg border shadow-pop bg-surface border-line"
                >
                  <li
                    v-for="(opt, i) in suggestOptions"
                    :key="opt.key"
                    role="option"
                    :aria-selected="i === suggestHighlight"
                    :class="[
                      'px-3 py-2 cursor-pointer',
                      i === suggestHighlight ? 'bg-primary/10' : '',
                      opt.type === 'new' ? 'border-t border-line mt-1' : '',
                    ]"
                    @mousedown.prevent="chooseOption(opt)"
                    @mouseenter="suggestHighlight = i"
                  >
                    <template v-if="opt.type === 'new'">
                      <p class="text-sm font-semibold text-primary">
                        + Add {{ searchField === "code" ? "code " : "" }}“{{ opt.name }}” as a new service
                      </p>
                      <p class="text-xs text-ink-subtle">Not eligible yet — adds it to {{ selectedProvider?.providerName || "the provider" }}'s contract</p>
                    </template>
                    <template v-else>
                      <div class="flex gap-3 justify-between items-baseline">
                        <span class="text-sm font-medium truncate text-ink">{{ opt.name }}</span>
                        <span v-if="opt.price" class="text-xs font-semibold whitespace-nowrap tabular-nums text-ink">{{ formatCurrency(opt.price) }}</span>
                      </div>
                      <p class="text-xs truncate text-ink-subtle">{{ [opt.code, opt.meta].filter(Boolean).join(" · ") }}</p>
                    </template>
                  </li>
                  <li v-if="!suggestOptions.length && !suggestReq.pending.value" class="px-3 py-2 text-xs text-ink-subtle">
                    {{ activeItemTab === "DRUG" ? "Not in the drug library — you can still add it as typed." : "No eligible services found." }}
                  </li>
                </ul>
              </div>
              <div class="relative lg:col-span-3">
                <label for="entry-name" class="block mb-2 text-xs font-semibold text-ink-muted">
                  {{ activeItemTab === "SERVICE" ? "Service Name" : "Drug Name" }}
                </label>
                <div class="relative">
                  <svg class="absolute left-2.5 top-1/2 w-4 h-4 -translate-y-1/2 pointer-events-none text-ink-subtle" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
                    <circle cx="9" cy="9" r="5.5" /><path d="m13.5 13.5 3 3" />
                  </svg>
                  <input
                    id="entry-name"
                    :value="entryName"
                    role="combobox"
                    autocomplete="off"
                    aria-autocomplete="list"
                    aria-controls="entry-suggestions"
                    :aria-expanded="suggestOpen && !!suggestOptions.length"
                    :disabled="activeItemTab === 'SERVICE' && !serviceSearchReady"
                    :placeholder="
                      activeItemTab === 'SERVICE'
                        ? serviceSearchReady
                          ? 'Search eligible services...'
                          : 'Choose provider and package first'
                        : 'Search drug library (2+ letters)...'
                    "
                    :class="[
                      'py-2 pr-8 pl-8 w-full text-sm rounded border transition-all bg-surface focus:ring-2 focus:ring-primary disabled:bg-surface-muted disabled:cursor-not-allowed',
                      entryNeedsPick ? 'border-warning' : 'border-line-strong',
                    ]"
                    @input="onEntryNameInput"
                    @focus="focusSearch('name')"
                    @blur="suggestOpen = false"
                    @keydown="onEntryNameKeydown"
                  />
                  <svg v-if="suggestReq.pending.value" class="absolute right-2.5 top-1/2 w-4 h-4 -translate-y-1/2 animate-spin text-ink-subtle" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-opacity="0.25" stroke-width="3" />
                    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
                  </svg>
                  <svg v-else-if="entryRef" class="absolute right-2.5 top-1/2 w-4 h-4 -translate-y-1/2 text-success" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-label="Selected">
                    <path d="m5 10.5 3 3 7-7" />
                  </svg>
                </div>
                <ul
                  v-if="searchField === 'name' && suggestOpen && searchQuery.length >= minChars && (suggestOptions.length || !suggestReq.pending.value)"
                  id="entry-suggestions"
                  role="listbox"
                  class="overflow-y-auto absolute z-40 py-1 mt-1 w-full min-w-[18rem] max-h-72 rounded-lg border shadow-pop bg-surface border-line"
                >
                  <li
                    v-for="(opt, i) in suggestOptions"
                    :key="opt.key"
                    role="option"
                    :aria-selected="i === suggestHighlight"
                    :class="[
                      'px-3 py-2 cursor-pointer',
                      i === suggestHighlight ? 'bg-primary/10' : '',
                      opt.type === 'new' ? 'border-t border-line mt-1' : '',
                    ]"
                    @mousedown.prevent="chooseOption(opt)"
                    @mouseenter="suggestHighlight = i"
                  >
                    <template v-if="opt.type === 'new'">
                      <p class="text-sm font-semibold text-primary">
                        + Add {{ searchField === "code" ? "code " : "" }}“{{ opt.name }}” as a new service
                      </p>
                      <p class="text-xs text-ink-subtle">Not eligible yet — adds it to {{ selectedProvider?.providerName || "the provider" }}'s contract</p>
                    </template>
                    <template v-else>
                      <div class="flex gap-3 justify-between items-baseline">
                        <span class="text-sm font-medium truncate text-ink">{{ opt.name }}</span>
                        <span v-if="opt.price" class="text-xs font-semibold whitespace-nowrap tabular-nums text-ink">{{ formatCurrency(opt.price) }}</span>
                      </div>
                      <p class="text-xs truncate text-ink-subtle">{{ [opt.code, opt.meta].filter(Boolean).join(" · ") }}</p>
                    </template>
                  </li>
                  <li v-if="!suggestOptions.length && !suggestReq.pending.value" class="px-3 py-2 text-xs text-ink-subtle">
                    {{ activeItemTab === "DRUG" ? "Not in the drug library — you can still add it as typed." : "No eligible services found." }}
                  </li>
                </ul>
                <p v-if="entryNeedsPick" class="mt-1 text-[11px] text-warning-strong">Pick an eligible service from the list, or add it as new.</p>
              </div>
              <div class="lg:col-span-1">
                <label class="block mb-2 text-xs font-semibold text-ink-muted">Price</label>
                <input
                  id="entry-price"
                  v-model.number="entryPrice"
                  type="number"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  class="py-2 pl-2 w-full text-sm rounded border transition-all bg-surface border-line-strong focus:ring-2 focus:ring-primary"
                  @keyup.enter="addEntry"
                />
              </div>
              <div class="lg:col-span-1">
                <label class="block mb-2 text-xs font-semibold text-ink-muted">Qty</label>
                <input
                  id="entry-qty"
                  v-model.number="entryQty"
                  type="number"
                  placeholder="1"
                  min="1"
                  class="py-2 pl-2 w-full text-sm text-center rounded border transition-all bg-surface border-line-strong focus:ring-2 focus:ring-primary"
                  @keyup.enter="addEntry"
                />
              </div>
              <div class="lg:col-span-1">
                <label class="block mb-2 text-xs font-semibold text-ink-muted">Total</label>
                <input
                  :value="formatCurrency(entryTotal)"
                  readonly
                  class="py-2 pl-2 w-full text-sm font-bold rounded border cursor-not-allowed text-primary-hover bg-primary/10 border-primary/30"
                />
              </div>
              <div class="lg:col-span-1 lg:pt-6">
                <button
                  type="button"
                  :disabled="!canAddEntry"
                  class="py-2 w-full text-sm font-bold text-white rounded bg-primary hover:bg-primary-hover disabled:bg-line-strong disabled:cursor-not-allowed"
                  @click="addEntry"
                >
                  {{ editingIndex !== null ? "✏️ Update" : "➕ Add" }}
                </button>
              </div>
            </div>

            <!-- Add a service that isn't on the provider's contract -->
            <div v-if="addNew && activeItemTab === 'SERVICE'" class="p-3 mt-4 rounded-lg border bg-surface border-primary/30">
              <p class="mb-3 text-sm font-semibold text-ink">
                New service for {{ selectedProvider?.providerName || "this provider" }}'s contract
              </p>
              <div class="grid grid-cols-1 gap-3 items-end sm:grid-cols-2 lg:grid-cols-12">
                <div class="lg:col-span-2">
                  <label class="block mb-1 text-xs font-semibold text-ink-muted">Code<span class="text-error">*</span></label>
                  <input v-model="addNew.itemCode" placeholder="e.g., SRV001" class="py-2 pl-2 w-full text-sm rounded border bg-surface border-line-strong focus:ring-2 focus:ring-primary" />
                </div>
                <div class="lg:col-span-4">
                  <label class="block mb-1 text-xs font-semibold text-ink-muted">Service name<span class="text-error">*</span></label>
                  <input v-model="addNew.item" class="py-2 pl-2 w-full text-sm rounded border bg-surface border-line-strong focus:ring-2 focus:ring-primary" />
                </div>
                <div class="lg:col-span-2">
                  <label class="block mb-1 text-xs font-semibold text-ink-muted">Category</label>
                  <input v-model="addNew.category" placeholder="Optional" class="py-2 pl-2 w-full text-sm rounded border bg-surface border-line-strong focus:ring-2 focus:ring-primary" />
                </div>
                <div class="lg:col-span-2">
                  <label class="block mb-1 text-xs font-semibold text-ink-muted">Contract price<span class="text-error">*</span></label>
                  <input v-model.number="addNew.price" type="number" min="0" step="0.01" placeholder="0.00" class="py-2 pl-2 w-full text-sm rounded border bg-surface border-line-strong focus:ring-2 focus:ring-primary" />
                </div>
                <div class="flex gap-2 lg:col-span-2">
                  <button
                    type="button"
                    class="flex-1 py-2 text-sm font-semibold text-white rounded bg-primary hover:bg-primary-hover disabled:opacity-60"
                    :disabled="addNewReq.pending.value"
                    @click="saveNewService"
                  >
                    {{ addNewReq.pending.value ? "Adding..." : "Add to contract" }}
                  </button>
                  <button type="button" class="px-3 py-2 text-sm rounded border border-line-strong text-ink-muted hover:bg-surface-muted" @click="addNew = null">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Services List -->
        <div class="overflow-hidden rounded-xl border shadow-sm bg-surface border-line">
          <div class="px-6 py-4 border-b bg-surface-muted border-line">
            <h3 class="text-lg font-bold text-ink">📋 Services List</h3>
            <p class="text-sm text-ink-muted">{{ items.length }} item(s)</p>
          </div>
          <div class="p-6">
            <p v-if="submitted && !items.length" class="mb-3 text-xs text-error">Please add at least one item.</p>
            <div v-if="!items.length" class="py-8 text-center">
              <div class="inline-flex justify-center items-center mb-4 w-16 h-16 rounded-full bg-surface-muted">
                <svg class="w-8 h-8 text-ink-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p class="font-medium text-ink-subtle">No items yet</p>
              <p class="mt-1 text-xs text-ink-subtle">Add services or drugs above</p>
            </div>
            <div v-else class="overflow-x-auto">
              <div class="min-w-[720px]">
                <Table
                  :pending="false"
                  :headers="{
                    head: ['Type', 'Code', 'Name', 'Price', 'Qty', 'Total', 'Balance', 'actions'],
                    row: ['itemType', 'serviceCode', 'serviceName', 'unitPrice', 'qty', 'totalPrice', 'remainingAfter'],
                  }"
                  :rows="itemsWithBalance"
                  :cells="{
                    unitPrice: (v) => formatCurrency(v),
                    totalPrice: (v) => formatCurrency(v),
                  }"
                >
                  <template #itemType="{ row }">
                    <span
                      :class="[
                        'px-2 py-0.5 text-xs font-semibold rounded-full',
                        row.itemType === 'DRUG' ? 'bg-warning-soft text-error-strong' : 'bg-primary/10 text-primary',
                      ]"
                    >
                      {{ row.itemType === "DRUG" ? "Drug" : "Service" }}
                    </span>
                  </template>
                  <template #remainingAfter="{ row }">
                    <span v-if="row.remainingAfter === null" class="text-ink-subtle">—</span>
                    <div v-else class="flex flex-col">
                      <span :class="row.isOverLimit ? 'font-bold text-error-strong' : 'font-semibold text-success-strong'">
                        {{ formatCurrency(row.remainingAfter) }}
                      </span>
                      <span v-if="row.isOverLimit" class="text-[11px] text-error-strong">Over by {{ formatCurrency(row.overBy) }}</span>
                    </div>
                  </template>
                  <template #serviceName="{ row }">
                    <div class="max-w-[260px] truncate" :title="row.serviceName">{{ row.serviceName }}</div>
                  </template>
                  <template #actions="{ row }">
                    <div class="flex gap-2 items-center">
                      <button type="button" class="p-1 rounded text-primary hover:bg-primary/5" title="Edit" @click="editItem(row)">
                        <span class="inline-flex w-4 h-4" v-html="icons.edit"></span>
                      </button>
                      <button type="button" class="p-1 rounded text-error hover:bg-error-soft" title="Remove" @click="removeItem(row)">
                        <span class="inline-flex w-5 h-5" v-html="icons.delete"></span>
                      </button>
                    </div>
                  </template>
                </Table>
              </div>
            </div>
            <div v-if="items.length" class="p-3 mt-4 rounded-lg border bg-primary/5 border-primary/20">
              <div class="flex justify-between items-center">
                <span class="font-bold text-ink">Grand Total</span>
                <span class="text-lg font-bold text-primary">{{ formatCurrency(grandTotal) }}</span>
              </div>
              <div v-if="packageBalance" class="flex justify-between items-center pt-2 mt-2 text-sm border-t border-primary/20">
                <span class="text-ink-muted">Remaining balance after this claim</span>
                <span :class="packageBalance.remaining < 0 ? 'font-bold text-error-strong' : 'font-semibold text-success-strong'">
                  {{ formatCurrency(packageBalance.remaining) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Request Details -->
        <div class="overflow-hidden rounded-xl border shadow-sm bg-surface border-line">
          <div class="px-6 py-4 border-b bg-surface-muted border-line">
            <h3 class="text-lg font-bold text-ink">📝 Request Details</h3>
          </div>
          <div class="p-6 space-y-4">
            <div>
              <label class="block mb-2 text-sm font-semibold text-ink-muted">
                📎 Medical Files <span class="text-xs font-normal text-ink-subtle">(optional)</span>
              </label>
              <div class="p-4 text-center rounded-lg border border-dashed transition-colors cursor-pointer bg-surface-muted border-line-strong">
                <input id="manual-file-input" type="file" multiple accept="image/*,.pdf" class="hidden" @change="onFilesSelected" />
                <label for="manual-file-input" class="cursor-pointer">
                  <svg class="mx-auto mb-2 w-8 h-8 text-ink-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p class="text-sm font-medium text-ink-muted">Click to upload</p>
                  <p class="mt-1 text-xs text-ink-subtle">Images or PDF (max 20 files)</p>
                </label>
              </div>
              <ul v-if="files.length" class="mt-3 space-y-2 text-xs">
                <li
                  v-for="(f, i) in files"
                  :key="f.name + i"
                  class="flex gap-2 justify-between items-center p-2 rounded border bg-success-soft border-success/20"
                >
                  <div class="flex flex-1 gap-2 items-center min-w-0 text-success-strong">
                    <svg class="flex-shrink-0 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span class="truncate">{{ f.name }}</span>
                  </div>
                  <button type="button" class="flex-shrink-0 font-bold text-error hover:text-error-strong" :aria-label="`Remove ${f.name}`" @click="removeFile(i)">✕</button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Submit -->
        <div v-if="submitted && missingRequiredFields.length" class="p-3 rounded-lg border bg-error-soft border-error/20">
          <p class="text-sm font-semibold text-error-strong">Please fill the required fields:</p>
          <ul class="mt-1 ml-5 text-sm list-disc text-error-strong">
            <li v-for="f in missingRequiredFields" :key="f">{{ f }}</li>
          </ul>
        </div>
        <div v-if="isEdit" class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ModalFormSubmitButton
            :pending="saveReq.pending.value"
            :disabled="saveReq.pending.value"
            btn-text="Save Changes"
            class="w-full"
            :class="{ 'opacity-60 cursor-not-allowed': missingRequiredFields.length }"
            @click="() => submit('close')"
          />
          <button
            type="button"
            class="w-full h-11 text-sm font-semibold rounded-lg border transition-colors border-line-strong text-ink-muted hover:bg-surface-muted"
            :disabled="saveReq.pending.value"
            @click="router.push(listPath)"
          >
            Cancel
          </button>
        </div>
        <div v-else class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ModalFormSubmitButton
            :pending="saveReq.pending.value && submitAction === 'add'"
            :disabled="saveReq.pending.value"
            btn-text="Submit & Add"
            class="w-full"
            :class="{ 'opacity-60 cursor-not-allowed': missingRequiredFields.length }"
            @click="() => submit('add')"
          />
          <ModalFormSubmitButton
            :pending="saveReq.pending.value && submitAction === 'claims'"
            :disabled="saveReq.pending.value"
            btn-text="Submit & Create Claims"
            class="w-full"
            :class="{ 'opacity-60 cursor-not-allowed': missingRequiredFields.length }"
            @click="() => submit('claims')"
          />
        </div>
      </div>
    </div>
  </DefaultPage>
</template>

<style scoped>
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
