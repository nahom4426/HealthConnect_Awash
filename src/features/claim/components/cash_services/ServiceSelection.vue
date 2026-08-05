<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue";
import Button from "@/components/Button.vue";
import ModalFormSubmitButton from "@/components/new_form_builder/ModalFormSubmitButton.vue";
import CustomSelect from "@/components/CustomSelect.vue";
import Table from "@/components/Table.vue";
import datePicker from "@/components/datePicker.vue";
import { usePagination } from "@/composables/usePagination";
import icons from "@/utils/icons";
import { getAlreadyMappedActiveProviders } from "@/features/providers/api/providerApi";
import {
  getPackageDropdown,
  getEligiblePackage,
} from "@/features/product_settings/api/coverageApi";
import { createCashServiceProvided, updateServiceProvided } from "@/features/claim/api/claimApi";
import { formatCurrency, toasted } from "@/utils/utils";

const emit = defineEmits(["submitted"]);
interface Props {
  institutionUuid?: string;
  payerInstitutionContractUuid?: string;
  insuredUuid?: string;
  dependantUuid?: string | null;
  person?: any;
  cashPeriodLimitPerDay?: any;
  editServiceProvided?: any;
  contractBeginDate?: string;
  contractEndDate?: string;
}
const props = defineProps<Props>();

type EligibleService = {
  eligibleServiceUuid: string;
  serviceId: string;
  itemCode: string;
  item: string;
  price: number;
};

type ServiceItem = {
  serviceId: string;
  itemUuid?: string;
  serviceName: string;
  serviceCode: string;
  qty: number;
  unitPrice: number;
  totalPrice: number;
  recordNumber: string;
  packageUuid: string;
  eligibleServiceUuid?: string;
  itemType: "SERVICE" | "DRUG";
  deleted?: boolean;
  c_section?: boolean;
};

const provider = ref("");
const providerContractUuid = ref("");
const pkg = ref("");
const otherProviderName = ref("");
const isOtherProvider = ref(false);

const activeItemTab = ref<"SERVICE" | "DRUG">("SERVICE");

const dispensingDate = ref("");
const referenceNumber = ref("");
const isSubmittingAdd = ref(false);
const isSubmittingGenerate = ref(false);
const isSubmittingAny = computed(() => isSubmittingAdd.value || isSubmittingGenerate.value);

function parseCashPeriodLimitDays(input: any): number {
  if (input === null || input === undefined || input === "") return 90;
  if (typeof input === "number" && Number.isFinite(input)) return input > 0 ? Math.floor(input) : 90;
  const raw = String(input).trim();
  const m = raw.match(/\d+/);
  const n = m ? Number(m[0]) : NaN;
  if (!Number.isFinite(n) || n <= 0) return 90;
  return Math.floor(n);
}

function toISODate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const cashLimitDays = computed(() => parseCashPeriodLimitDays(props.cashPeriodLimitPerDay));

const maxDispensingDate = computed(() => {
  const todayStr = toISODate(new Date());
  if (props.contractEndDate) {
    const endStr = props.contractEndDate.slice(0, 10);
    return endStr < todayStr ? endStr : todayStr;
  }
  return todayStr;
});

const minDispensingDate = computed(() => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - cashLimitDays.value);
  const limitDateStr = toISODate(d);
  if (props.contractBeginDate) {
    const beginStr = props.contractBeginDate.slice(0, 10);
    return beginStr > limitDateStr ? beginStr : limitDateStr;
  }
  return limitDateStr;
});

const isDispensingDateOutOfRange = computed(() => {
  if (!dispensingDate.value) return false;
  return dispensingDate.value < minDispensingDate.value || dispensingDate.value > maxDispensingDate.value;
});

const submitted = ref(false);

const missingRequiredFields = computed(() => {
  const missing: string[] = [];
  if (!provider.value) missing.push("Provider");
  if (provider.value === "OTHER" && !otherProviderName.value) missing.push("Provider Name");
  if (!pkg.value) missing.push("Package");
  if (!dispensingDate.value) missing.push("Dispensing Date");
  if (!referenceNumber.value) missing.push("Reference Number");
  if (!items.value.length) missing.push("At least one item");
  return missing;
});

const files = ref([] as File[]);

// Manual service entry for "Other" provider
const manualServiceCode = ref("");
const manualServiceName = ref("");
const manualServicePrice = ref<number | null>(null);
const manualServiceQty = ref(1);

const manualDrugCode = ref("");
const manualDrugName = ref("");
const manualDrugPrice = ref<number | null>(null);
const manualDrugQty = ref(1);

function onFilesSelected(ev: Event) {
  const input = ev.target as HTMLInputElement;
  const newFiles = Array.from(input?.files ?? []) as File[];
  // Add new files to existing files (don't replace)
  const combined = [...files.value, ...newFiles];
  files.value = combined.slice(0, 20); // arbitrary cap
  // Reset input so same file can be selected again
  input.value = "";
}

function removeFile(index: number) {
  files.value.splice(index, 1);
}

// Providers mapped to the single policy
const providersReq = usePagination({
  auto: false,
  cb: (data: any) =>
    getAlreadyMappedActiveProviders(props.payerInstitutionContractUuid, data),
});

watch(
  () => props.payerInstitutionContractUuid,
  (v) => {
    if (!v) return;
    providersReq.send();
  },
  { immediate: true }
);

// Update providerContractUuid when provider changes
watch([() => providersReq.data.value, provider], () => {
  if (provider.value === "OTHER") {
    isOtherProvider.value = true;
    providerContractUuid.value = "";
    if (!isEditMode.value) {
      otherProviderName.value = "";
    }
    activeItemTab.value = "SERVICE";
    // Reset manual service fields
    manualServiceCode.value = "";
    manualServiceName.value = "";
    manualServicePrice.value = null;
    manualServiceQty.value = 1;
    manualDrugCode.value = "";
    manualDrugName.value = "";
    manualDrugPrice.value = null;
    manualDrugQty.value = 1;
  } else {
    isOtherProvider.value = false;
    const list: any[] = (providersReq.data.value as any[]) || [];
    const selected = list.find((x: any) => x.providerUuid === provider.value);
    providerContractUuid.value = selected?.payerProviderContractUuid || "";
    otherProviderName.value = "";
  }
});

// Packages available for insured
const packagesReq = usePagination({
  auto: false,
  cb: () => getPackageDropdown(props.insuredUuid, props.dependantUuid),
});

watch(
  () => props.insuredUuid,
  (v) => {
    if (!v) return;
    packagesReq.send();
  },
  { immediate: true }
);

// Eligible services of selected package & provider contract
const eligibleReq = usePagination({
  auto: false,
  cb: () =>
    getEligiblePackage(pkg.value, providerContractUuid.value).then(
      (r) => (r as any)?.data?.packageEligibleServices || []
    ),
});

watch([pkg, providerContractUuid], () => {
  if (pkg.value && providerContractUuid.value) eligibleReq.send();
});

// Cart & Search
const qty = ref(1);
const searchCode = ref("");
const searchName = ref("");
const selectedPrice = ref<number | null>(null);
const items = ref<ServiceItem[]>([]);

const editingIndex = ref<number | null>(null);
const editingItemType = ref<"SERVICE" | "DRUG" | null>(null);
const editingIsEligible = ref(false);

const isDependent = computed(() => !!props.dependantUuid);

const isEditMode = computed(() => Boolean(props.editServiceProvided));

function restoreItem(i: number) {
  const current = items.value[i];
  if (!current) return;
  items.value[i] = { ...current, deleted: false };
}

function hydrateFromEditPayload(payload: any) {
  if (!payload) return;

  const contractUuidFromApi = payload?.contractUuid || payload?.payerInstitutionContractUuid || '';
  const providerUuidFromApi = payload?.providerUuid || '';
  const providerNameFromApi = payload?.providerName || '';
  const providedDateFromApi = payload?.providedDate ? String(payload.providedDate).slice(0, 10) : '';
  const recordNumberFromApi = payload?.recordNumber || payload?.serviceProvidedUuid || '';

  dispensingDate.value = providedDateFromApi || dispensingDate.value;
  referenceNumber.value = recordNumberFromApi || referenceNumber.value;

  const providersList: any[] = (providersReq.data.value as any[]) || [];
  const foundProvider = providersList.find((x: any) => x?.providerUuid === providerUuidFromApi);
  // If backend didn't send providerUuid, this is an OTHER provider by definition
  if (!providerUuidFromApi) {
    provider.value = 'OTHER';
    otherProviderName.value = providerNameFromApi || '';
  } else if (foundProvider?.providerUuid) {
    provider.value = foundProvider.providerUuid;
    otherProviderName.value = '';
  } else {
    // providerUuid exists but not in dropdown list -> treat as OTHER
    provider.value = 'OTHER';
    otherProviderName.value = providerNameFromApi || '';
  }

  providerContractUuid.value = contractUuidFromApi;

  const providedItems = Array.isArray(payload?.providedItemResponses)
    ? payload.providedItemResponses
    : [];

  items.value = providedItems.map((it: any) => ({
    serviceId: it?.itemId || '',
    itemUuid: it?.providedItemUuid || '',
    serviceName: it?.itemName || '',
    serviceCode: it?.itemCode || '',
    qty: Number(it?.quantity) || 1,
    unitPrice: Number(it?.unitPrice) || 0,
    totalPrice: Number(it?.totalPrice) || 0,
    recordNumber: recordNumberFromApi,
    packageUuid: it?.packageUuid || '',
    eligibleServiceUuid: undefined,
    itemType: String(it?.itemType || 'SERVICE').toUpperCase() === 'DRUG' ? 'DRUG' : 'SERVICE',
    deleted: false,
    c_section: false,
  }));

  // Pick a package if possible (use first item's package)
  if (!pkg.value) {
    const firstPkg = items.value.find((x) => x?.packageUuid)?.packageUuid;
    if (firstPkg) pkg.value = firstPkg;
  }
}

watch(
  () => props.editServiceProvided,
  (v) => {
    if (!v) return;
    hydrateFromEditPayload(v);
  },
  { immediate: true }
);

const selectedPackageRow = computed<any | null>(() => {
  const list: any[] = (packagesReq.data.value as any[]) || [];
  if (!pkg.value) return null;
  return list.find((p: any) => p?.packageUuid === pkg.value) || null;
});

function getPackageLimit(p: any): number {
  if (!p) return 0;
  if (isDependent.value) {
    const depLimit = Number(p.depSumAssured ?? 0);
    if (Number.isFinite(depLimit) && depLimit > 0) return depLimit;
  }
  const limit = Number(p.sumAssured ?? 0);
  return Number.isFinite(limit) ? limit : 0;
}

function getPackageUsed(p: any): number {
  if (!p) return 0;
  if (isDependent.value) {
    const depUsed = Number(p.depUsedBenefit ?? 0);
    if (Number.isFinite(depUsed) && depUsed > 0) return depUsed;
  }
  const used = Number(p.used ?? 0);
  return Number.isFinite(used) ? used : 0;
}

function getCartTotalForPackage(packageUuid: string, excludeIndex: number | null = null): number {
  return items.value.reduce((sum, it, idx) => {
    if (excludeIndex !== null && idx === excludeIndex) return sum;
    if (it.packageUuid !== packageUuid) return sum;
    return sum + Number(it.totalPrice || 0);
  }, 0);
}

function getRemainingForPackage(packageUuid: string, excludeIndex: number | null = null): number {
  const list = (packagesReq.data.value as any[]) || [];
  const p = list.find((x: any) => x?.packageUuid === packageUuid);
  if (!p) return 0;
  
  const limit = getPackageLimit(p);
  const used = getPackageUsed(p);
  const cart = getCartTotalForPackage(packageUuid, excludeIndex);
  const ownRemaining = limit - used - cart;

  // Check cup relation
  let cupUuid = p.cupPackageUuid || null;
  if (!cupUuid) {
    const isCupPackage = list.some((x: any) => x?.cupPackageUuid === p.packageUuid);
    if (isCupPackage) {
      cupUuid = p.packageUuid;
    }
  }

  if (cupUuid) {
    const cupPkg = list.find((x: any) => x?.packageUuid === cupUuid);
    if (cupPkg) {
      const cupLimit = getPackageLimit(cupPkg);
      const cuppedPkgs = list.filter(
        (x: any) => x?.cupPackageUuid === cupUuid || x?.packageUuid === cupUuid
      );
      
      const totalUsedInCup = cuppedPkgs.reduce((sum, x) => sum + getPackageUsed(x), 0);
      const totalCartInCup = cuppedPkgs.reduce(
        (sum, x) => sum + getCartTotalForPackage(x.packageUuid, excludeIndex),
        0
      );
      const cupRemaining = cupLimit - totalUsedInCup - totalCartInCup;
      return Math.min(ownRemaining, cupRemaining);
    }
  }

  return ownRemaining;
}

const selectedPackageBalance = computed(() => {
  const p = selectedPackageRow.value;
  if (!p) {
    return {
      limit: 0,
      used: 0,
      cart: 0,
      remaining: 0,
    };
  }
  const limit = getPackageLimit(p);
  const used = getPackageUsed(p);
  const cart = getCartTotalForPackage(p.packageUuid);
  const remaining = getRemainingForPackage(p.packageUuid);
  return { limit, used, cart, remaining };
});

// Dropdown state management
const showCodeDropdown = ref(false);
const showNameDropdown = ref(false);
const isProgrammaticUpdate = ref(false);
const hasValidSelection = ref(false);
const lastSelectedCode = ref("");
const lastSelectedName = ref("");

const filteredServices = computed<EligibleService[]>(() => {
  let rows = (eligibleReq.data.value || []) as any[] as EligibleService[];

  // Remove already selected services
  const selectedServiceIds = items.value.map((item) => item.serviceId);
  rows = rows.filter((r) => !selectedServiceIds.includes(r.serviceId));

  // Filter by code if provided
  if (searchCode.value) {
    rows = rows.filter((r: EligibleService) =>
      (r.itemCode || "").toLowerCase().includes(searchCode.value.toLowerCase())
    );
  }

  // Filter by name if provided
  if (searchName.value) {
    rows = rows.filter((r: EligibleService) =>
      (r.item || "").toLowerCase().includes(searchName.value.toLowerCase())
    );
  }

  return rows;
});

// Dropdown handlers
function handleCodeFocus() {
  if (!isProgrammaticUpdate.value && filteredServices.value.length > 0) {
    showCodeDropdown.value = true;
  }
}

function handleNameFocus() {
  if (!isProgrammaticUpdate.value && filteredServices.value.length > 0) {
    showNameDropdown.value = true;
  }
}

function handleCodeBlur() {
  nextTick(() => {
    showCodeDropdown.value = false;
  });
}

function handleNameBlur() {
  nextTick(() => {
    showNameDropdown.value = false;
  });
}

function selectFromDropdown(item: EligibleService, source = "name") {
  isProgrammaticUpdate.value = true;

  searchCode.value = item.itemCode;
  searchName.value = item.item;
  selectedPrice.value = item.price;

  lastSelectedCode.value = item.itemCode;
  lastSelectedName.value = item.item;
  hasValidSelection.value = true;

  showCodeDropdown.value = false;
  showNameDropdown.value = false;

  nextTick(() => {
    setTimeout(() => {
      isProgrammaticUpdate.value = false;
    }, 400);
  });
}

function addService() {
  if (!pkg.value) {
    toasted(false, "", "Please select a package");
    return;
  }
  if (!searchName.value || !searchCode.value || selectedPrice.value === null) {
    toasted(false, "", "Please select a service");
    return;
  }

  // Find the selected service to get its ID
  const selectedService = filteredServices.value.find(
    (s) => s.itemCode === searchCode.value && s.item === searchName.value
  );

  if (!selectedService) {
    toasted(false, "", "Service not found");
    return;
  }

  const q = Math.max(1, Math.floor(Number(qty.value) || 1));
  const unitPrice = Number(selectedPrice.value) || 0;
  const totalPrice = unitPrice * q;

  const row: ServiceItem = {
    serviceId: selectedService.serviceId as string,
    serviceName: selectedService.item as string,
    serviceCode: selectedService.itemCode as string,
    qty: q,
    unitPrice,
    totalPrice,
    recordNumber: referenceNumber.value || "",
    packageUuid: pkg.value,
    eligibleServiceUuid: selectedService.eligibleServiceUuid,
    itemType: "SERVICE",
  };

  if (editingIndex.value !== null) {
    items.value[editingIndex.value] = row;
    editingIndex.value = null;
    editingItemType.value = null;
    editingIsEligible.value = false;
    toasted(true,"Item updated");
  } else {
    items.value.push(row);
    toasted(true,"Service added successfully");
  }

  resetSearchForm();
}

function resetSearchForm() {
  searchCode.value = "";
  searchName.value = "";
  selectedPrice.value = null;
  qty.value = 1;
  hasValidSelection.value = false;
  lastSelectedCode.value = "";
  lastSelectedName.value = "";
  showCodeDropdown.value = false;
  showNameDropdown.value = false;
}

function addManualService() {
  if (!pkg.value) {
    toasted(false, "", "Please select a package");
    return;
  }

  if (!otherProviderName.value) {
    toasted(false, "", "Please enter provider name");
    return;
  }

  if (!manualServiceName.value || manualServicePrice.value === null || manualServiceQty.value <= 0) {
    toasted(false, "", "Please fill all manual service fields");
    return;
  }

  const unitPrice = Number(manualServicePrice.value) || 0;
  const totalPrice = unitPrice * (Number(manualServiceQty.value) || 1);

  const row: ServiceItem = {
    // serviceId: `manual-${Date.now()}`,
    serviceName: manualServiceName.value,
    serviceCode: manualServiceCode.value || "",
    qty: Number(manualServiceQty.value),
    unitPrice,
    totalPrice,
    recordNumber: referenceNumber.value || "",
    packageUuid: pkg.value,
    eligibleServiceUuid: undefined,
    itemType: "SERVICE",
  };

  if (editingIndex.value !== null) {
    items.value[editingIndex.value] = row;
    editingIndex.value = null;
    editingItemType.value = null;
    editingIsEligible.value = false;
    toasted(true,"Item updated");
  } else {
    items.value.push(row);
    toasted(true,"Manual service added");
  }

  // Reset manual service form
  manualServiceCode.value = "";
  manualServiceName.value = "";
  manualServicePrice.value = null;
  manualServiceQty.value = 1;
  // toasted(true, "Manual service added successfully");
}

function addManualDrug() {
  if (!pkg.value) {
    toasted(false, "", "Please select a package");
    return;
  }

  if (isOtherProvider.value && !otherProviderName.value) {
    toasted(false, "", "Please enter provider name");
    return;
  }

  if (!manualDrugName.value || manualDrugPrice.value === null || manualDrugQty.value <= 0) {
    toasted(false, "", "Please fill all drug fields");
    return;
  }

  const unitPrice = Number(manualDrugPrice.value) || 0;
  const qtyVal = Number(manualDrugQty.value) || 1;
  const totalPrice = unitPrice * qtyVal;

  const row: ServiceItem = {
    serviceId: `drug-${Date.now()}`,
    serviceName: manualDrugName.value,
    serviceCode: manualDrugCode.value || "",
    qty: qtyVal,
    unitPrice,
    totalPrice,
    recordNumber: referenceNumber.value || "",
    packageUuid: pkg.value,
    eligibleServiceUuid: undefined,
    itemType: "DRUG",
  };

  if (editingIndex.value !== null) {
    items.value[editingIndex.value] = row;
    editingIndex.value = null;
    editingItemType.value = null;
    editingIsEligible.value = false;
    toasted(true,"Item updated");
  } else {
    items.value.push(row);
    toasted(true,"Drug added");
  }

  manualDrugCode.value = "";
  manualDrugName.value = "";
  manualDrugPrice.value = null;
  manualDrugQty.value = 1;
}

function removeItem(i: number) {
  if (isEditMode.value) {
    const current = items.value[i];
    if (!current) return;
    items.value[i] = { ...current, deleted: true };
    return;
  }
  items.value.splice(i, 1);
}

function editItem(i: number) {
  const current = items.value[i];
  if (!current) return;

  editingIndex.value = i;
  editingItemType.value = current.itemType;
  pkg.value = current.packageUuid;

  if (current.itemType === "DRUG") {
    activeItemTab.value = "DRUG";
    // Load into manual drug entry
    manualDrugCode.value = current.serviceCode || "";
    manualDrugName.value = current.serviceName || "";
    manualDrugPrice.value = Number(current.unitPrice) || 0;
    manualDrugQty.value = Number(current.qty) || 1;
    editingIsEligible.value = false;
    return;
  }

  // SERVICE
  activeItemTab.value = "SERVICE";
  const isEligible = !!current.eligibleServiceUuid;
  editingIsEligible.value = isEligible;
  if (isEligible) {
    // Load into eligible service picker
    searchCode.value = current.serviceCode || "";
    searchName.value = current.serviceName || "";
    selectedPrice.value = Number(current.unitPrice) || 0;
    qty.value = Number(current.qty) || 1;
  } else {
    // Load into manual service entry
    manualServiceCode.value = current.serviceCode || "";
    manualServiceName.value = current.serviceName || "";
    manualServicePrice.value = Number(current.unitPrice) || 0;
    manualServiceQty.value = Number(current.qty) || 1;
  }
}

function findItemIndex(row: any): number {
  const byRef = items.value.indexOf(row as any);
  if (byRef !== -1) return byRef;
  const serviceId = row?.serviceId;
  const packageUuid = row?.packageUuid;
  const itemType = row?.itemType;
  const serviceCode = row?.serviceCode;
  const serviceName = row?.serviceName;
  return items.value.findIndex(
    (it) =>
      (serviceId ? it.serviceId === serviceId : true) &&
      it.packageUuid === packageUuid &&
      it.itemType === itemType &&
      it.serviceCode === serviceCode &&
      it.serviceName === serviceName
  );
}

function editItemByRow(row: any) {
  const idx = findItemIndex(row);
  if (idx === -1) return;
  editItem(idx);
}

function removeItemByRow(row: any) {
  const idx = findItemIndex(row);
  if (idx === -1) return;
  removeItem(idx);
}

function restoreItemByRow(row: any) {
  const idx = findItemIndex(row);
  if (idx === -1) return;
  restoreItem(idx);
}

const grandTotal = computed<number>(() =>
  items.value.reduce((s, it) => {
    if (it?.deleted) return s;
    return s + Number(it.totalPrice || 0);
  }, 0)
);

const itemsWithCoverage = computed(() => {
  const list = items.value || [];
  const pkgs: any[] = (packagesReq.data.value as any[]) || [];
  const remainingMap = new Map<string, number>();
  const cupRemainingMap = new Map<string, number>();

  return list.map((it) => {
    const key = it.packageUuid;
    const p = pkgs.find((x: any) => x?.packageUuid === key);

    if (!remainingMap.has(key)) {
      const start = getPackageLimit(p) - getPackageUsed(p);
      remainingMap.set(key, start);
    }

    let cupUuid: string | null = null;
    if (p) {
      cupUuid = p.cupPackageUuid || null;
      if (!cupUuid) {
        const isCupPackage = pkgs.some((x: any) => x?.cupPackageUuid === p.packageUuid);
        if (isCupPackage) {
          cupUuid = p.packageUuid;
        }
      }
    }

    if (cupUuid && !cupRemainingMap.has(cupUuid)) {
      const cupPkg = pkgs.find((x: any) => x?.packageUuid === cupUuid);
      const cupLimit = getPackageLimit(cupPkg);
      const cuppedPkgs = pkgs.filter(
        (x: any) => x?.cupPackageUuid === cupUuid || x?.packageUuid === cupUuid
      );
      const totalUsedInCup = cuppedPkgs.reduce((sum, x) => sum + getPackageUsed(x), 0);
      cupRemainingMap.set(cupUuid, cupLimit - totalUsedInCup);
    }

    const beforeOwn = remainingMap.get(key) || 0;
    const afterOwn = beforeOwn - Number(it.totalPrice || 0);
    remainingMap.set(key, afterOwn);

    let afterCup = afterOwn;
    if (cupUuid) {
      const beforeCup = cupRemainingMap.get(cupUuid) || 0;
      afterCup = beforeCup - Number(it.totalPrice || 0);
      cupRemainingMap.set(cupUuid, afterCup);
    }

    const after = cupUuid ? Math.min(afterOwn, afterCup) : afterOwn;

    return {
      ...it,
      remainingAfter: after,
      overBy: after < 0 ? Math.abs(after) : 0,
      isOverLimit: after < 0,
    };
  });
});

const providerOptions = computed(() => {
  const systemProviders = ((providersReq.data.value as any[]) || []).map((p: any) => ({
    value: p.providerUuid as string,
    label: p.providerName as string,
  }));
  // Add "Other" option at the end
  return [...systemProviders, { value: "OTHER", label: "🔹 Other Provider" }];
});
const packageOptions = computed(() =>
  ((packagesReq.data.value as any[]) || []).map((p: any) => ({
    value: p.packageUuid as string,
    label: p.packageName as string,
  }))
);

const cellsSpec = {
  price: (v: number) => formatCurrency(v as any),
};

async function submit(action: "add" | "generate" = "add") {
  submitted.value = true;
  if (missingRequiredFields.value.length) {
    toasted(false, "", `Missing required: ${missingRequiredFields.value.join(", ")}`);
    return;
  }

  if (isDispensingDateOutOfRange.value) {
    toasted(
      false,
      "",
      `Dispensing Date must be between ${minDispensingDate.value} and ${maxDispensingDate.value}`
    );
    return;
  }

  const contractUuidToSubmit = isOtherProvider.value
    ? (props.payerInstitutionContractUuid as any)
    : (providerContractUuid.value as any);

  if (!contractUuidToSubmit) {
    toasted(false, "", "Missing contract information");
    return;
  }

  if (action === 'generate') {
    isSubmittingGenerate.value = true;
  } else {
    isSubmittingAdd.value = true;
  }
  try {
    const form = new FormData();
    const providersList: any[] = (providersReq.data.value as any[]) || [];
    const selectedProvider = providersList.find((x: any) => x.providerUuid === provider.value);
    const providerNameToSubmit = isOtherProvider.value
      ? otherProviderName.value
      : (selectedProvider?.providerName || "");

    if (!props.insuredUuid) {
      toasted(false, "", "Missing insured information");
      return;
    }

    if (!providerNameToSubmit) {
      toasted(false, "", "Missing provider name");
      return;
    }

    const body = {
      contractUuid: contractUuidToSubmit,
      providerName: providerNameToSubmit,
      totalPrice: grandTotal.value,
      providedDate: dispensingDate.value,
      insuredUuid: props.insuredUuid,
      dependentUuid: props.dependantUuid || undefined,
      deleted: false,
      items: items.value.map((item) => ({
        serviceId: item.serviceId,
        itemUuid: item.itemUuid || undefined,
        serviceName: item.serviceName,
        serviceCode: item.serviceCode,
        qty: item.qty,
        totalPrice: item.totalPrice,
        recordNumber: referenceNumber.value,
        packageUuid: item.packageUuid,
        itemType: item.itemType,
        c_section: Boolean(item.c_section),
        deleted: Boolean(item.deleted),
      })),
    };

    files.value.forEach((f) => form.append("attachment", f));

    console.log('📤 Submitting service provided request...');
    const res = isEditMode.value
      ? await updateServiceProvided(props.editServiceProvided?.serviceProvidedUuid || props.editServiceProvided?.id || '', (() => {
          const updateForm = new FormData();
          // attachments
          files.value.forEach((f) => updateForm.append('attachment', f));
          // backend expects itemRequests field
          updateForm.append('itemRequests', JSON.stringify(body));
          return updateForm;
        })())
      : await createCashServiceProvided((() => {
          // Backend expects raw JSON string in multipart field name exactly as shown by swagger
          form.append("serviceProvidedRequest ", JSON.stringify(body));
          return form;
        })());
    console.log('✅ Response:', res);
    if (res?.success) {
      toasted(true,"Cash service submitted");
      items.value = [];
      files.value = [];
      submitted.value = false;

      emit("submitted", action);
    } else {
      toasted(false, "Failed to submit service");
    }
  } catch (error) {
    console.error('❌ Submit error:', error);
    toasted(false, "Error submitting service");
  } finally {
    isSubmittingAdd.value = false;
    isSubmittingGenerate.value = false;
  }
}
</script>

<template>
  <div class="mx-auto space-y-6 w-full max-w-2xl xl:max-w-4xl 2xl:max-w-[80rem] ">
    <!-- Provider, Package, Date & Reference (Same Line) -->
    <div class="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
      <div
        :class="[
          'grid grid-cols-1 gap-4',
          isOtherProvider ? 'md:grid-cols-5' : 'md:grid-cols-4',
        ]"
      >
        <div>
          <label class="block mb-2 text-sm font-semibold text-gray-700">🏥 Provider<span class="text-red-500">*</span></label>
          <CustomSelect
            v-model="provider"
            placeholder="Choose provider..."
            :options="providerOptions"
            class="w-full"
          />
          <p v-if="submitted && !provider" class="mt-1 text-xs text-red-600">Provider is required.</p>
        </div>
        <div v-if="isOtherProvider">
          <label class="block mb-2 text-sm font-semibold text-gray-700">🏢 Provider Name<span class="text-red-500">*</span></label>
          <input
            v-model="otherProviderName"
            placeholder="Enter provider name..."
            class="pl-2 w-full h-10 text-sm bg-white rounded-md border border-gray-300 transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p v-if="submitted && isOtherProvider && !otherProviderName" class="mt-1 text-xs text-red-600">Provider name is required.</p>
        </div>
        <div>
          <label class="block mb-2 text-sm font-semibold text-gray-700">📦 Package<span class="text-red-500">*</span></label>
          <CustomSelect
            v-model="pkg"
            placeholder="Choose package..."
            :options="packageOptions"
            :disabled="!provider"
            class="w-full"
          />
          <div v-if="pkg && selectedPackageRow" class="mt-1 text-xs text-gray-600">
            <div class="flex gap-3 items-center">
              <span class="font-semibold text-gray-700">Limit:</span>
              <span>{{ formatCurrency(selectedPackageBalance.limit) }}</span>
              <span class="font-semibold text-gray-700">Used:</span>
              <span>{{ formatCurrency(selectedPackageBalance.used) }}</span>
              <span class="font-semibold text-gray-700">Cart:</span>
              <span>{{ formatCurrency(selectedPackageBalance.cart) }}</span>
            </div>
            <div class="mt-0.5">
              <span class="font-semibold text-gray-700">Remaining:</span>
              <span :class="selectedPackageBalance.remaining < 0 ? 'text-red-700 font-bold' : 'text-green-700 font-bold'">
                {{ formatCurrency(selectedPackageBalance.remaining) }}
              </span>
              <span v-if="selectedPackageBalance.remaining < 0" class="ml-2 font-semibold text-red-700">
                (Over limit by {{ formatCurrency(Math.abs(selectedPackageBalance.remaining)) }})
              </span>
              <span v-if="isDependent" class="ml-2 text-gray-500">(Dependent)</span>
            </div>
          </div>
          <p v-if="submitted && !pkg" class="mt-1 text-xs text-red-600">Package is required.</p>
        </div>
        <div>
          <label class="block mb-2 text-sm font-semibold text-gray-700">📅 Dispensing Date<span class="text-red-500">*</span></label>
          <datePicker
            label=""
            required
            v-model="dispensingDate"
            :min="minDispensingDate"
            :max="maxDispensingDate"
            :error="submitted && (!dispensingDate || isDispensingDateOutOfRange)"
            :errorMessage="
              submitted && isDispensingDateOutOfRange
                ? `Dispensing date must be between ${minDispensingDate} and ${maxDispensingDate}`
                : ''
            "
          />
          <p v-if="submitted && !dispensingDate" class="mt-1 text-xs text-red-600">Dispensing date is required.</p>
          <p v-else-if="submitted && isDispensingDateOutOfRange" class="mt-1 text-xs text-red-600">
            Dispensing date must be between {{ minDispensingDate }} and {{ maxDispensingDate }}.
          </p>
        </div>
        <div>
          <label class="block mb-2 text-sm font-semibold text-gray-700">🔢 Reference Number<span class="text-red-500">*</span></label>
          <input
            v-model="referenceNumber"
            placeholder="e.g., CR-002"
            class="pl-2 w-full h-10 text-sm bg-white rounded-md border border-gray-300 transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p v-if="submitted && !referenceNumber" class="mt-1 text-xs text-red-600">Reference number is required.</p>
        </div>
      </div>
    </div>

    <!-- Manual Service Entry (for "Other" Provider) -->
    <div class="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
      <div class="flex gap-2 items-center mb-4">
        <button
          type="button"
          @click="activeItemTab = 'SERVICE'"
          :class="[
            'px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors',
            activeItemTab === 'SERVICE'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          ]"
        >
          Service
        </button>
        <button
          type="button"
          @click="activeItemTab = 'DRUG'"
          :class="[
            'px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors',
            activeItemTab === 'DRUG'
              ? 'bg-red-600 text-white border-red-600'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          ]"
        >
          Drug
        </button>
      </div>

      <div v-if="activeItemTab === 'SERVICE'">
        <!-- Manual Service Entry (for "Other" Provider) -->
        <div v-if="isOtherProvider" class="p-4 bg-blue-50 rounded-lg border border-blue-200 shadow-sm">
          <h3 class="mb-4 text-sm font-bold text-blue-900">📝 Manual Service Entry</h3>
          <div class="grid grid-cols-1 gap-4 items-end sm:grid-cols-2 lg:grid-cols-9">
        <!-- Service Code (2 cols) -->
        <div class="lg:col-span-2">
          <label class="block mb-2 text-xs font-semibold text-gray-700">Code (optional)</label>
          <input
            v-model="manualServiceCode"
            placeholder="e.g., SRV001"
            class="py-2 pl-2 w-full text-sm bg-white rounded border border-gray-300 transition-all focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <!-- Service Name (3 cols) -->
        <div class="lg:col-span-3">
          <label class="block mb-2 text-xs font-semibold text-gray-700">Service Name</label>
          <input
            v-model="manualServiceName"
            placeholder="e.g., Consultation"
            class="py-2 pl-2 w-full text-sm bg-white rounded border border-gray-300 transition-all focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <!-- Price (1 col) -->
        <div class="lg:col-span-1">
          <label class="block mb-2 text-xs font-semibold text-gray-700">Price</label>
          <input
            v-model.number="manualServicePrice"
            type="number"
            placeholder="0.00"
            min="0"
            step="0.01"
            class="py-2 pl-2 w-full text-sm bg-white rounded border border-gray-300 transition-all focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <!-- Qty (1 col) -->
        <div class="lg:col-span-1">
          <label class="block mb-2 text-xs font-semibold text-gray-700">Qty</label>
          <input
            v-model.number="manualServiceQty"
            type="number"
            placeholder="1"
            min="1"
            class="py-2 pl-2 w-full text-sm text-center bg-white rounded border border-gray-300 transition-all focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <!-- Total (1 col) -->
        <div class="lg:col-span-1">
          <label class="block mb-2 text-xs font-semibold text-gray-700">Total</label>
          <input
            :value="
              manualServicePrice && manualServiceQty
                ? formatCurrency(manualServicePrice * manualServiceQty)
                : '0.00'
            "
            readonly
            class="py-2 pl-2 w-full text-sm font-bold text-blue-900 bg-blue-100 rounded border border-blue-300 cursor-not-allowed"
          />
        </div>

        <!-- Add Button (1 col) -->
        <div class="lg:col-span-1">
          <button
            @click="addManualService"
            :disabled="!pkg || !manualServiceName || !manualServicePrice || !manualServiceQty"
            class="py-2 pl-2 w-full text-sm font-bold text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {{ editingIndex !== null && editingItemType === 'SERVICE' && !editingIsEligible ? '✏️ Update' : '➕ Add' }}
          </button>
        </div>
          </div>
        </div>

        <!-- Service Selection (9-Column Grid Layout) -->
        <div v-else class="p-4 bg-green-50 rounded-lg border border-gray-200 shadow-sm">
          <div class="grid grid-cols-1 gap-4 items-end sm:grid-cols-2 lg:grid-cols-9">
        <!-- Service Code (2 cols) -->
        <div class="relative lg:col-span-2">
          <label class="block mb-2 text-xs font-semibold text-gray-700"
            >Code</label
          >
          <input
            v-model="searchCode"
            placeholder="Search code..."
            @focus="handleCodeFocus"
            @blur="handleCodeBlur"
            :disabled="!pkg"
            class="py-2 pl-2 w-full text-sm bg-white rounded border border-gray-300 transition-all px- focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <!-- Code Dropdown -->
          <div
            v-if="showCodeDropdown && filteredServices.length > 0"
            class="overflow-auto absolute z-50 mt-1 w-full max-h-48 bg-white rounded border border-gray-200 shadow-lg"
          >
            <div
              v-for="item in filteredServices"
              :key="item.eligibleServiceUuid"
              class="px-2 py-1.5 text-xs text-gray-700 border-b border-gray-100 cursor-pointer hover:bg-blue-50 last:border-b-0"
              @mousedown.prevent="selectFromDropdown(item, 'code')"
            >
              <div class="font-semibold text-gray-900">{{ item.itemCode }}</div>
              <div class="text-xs text-gray-500">{{ item.item }}</div>
            </div>
          </div>
        </div>

        <!-- Service Name (3 cols) -->
        <div class="relative lg:col-span-3">
          <label class="block mb-2 text-xs font-semibold text-gray-700"
            >Service Name</label
          >
          <input
            v-model="searchName"
            placeholder="Search name..."
            @focus="handleNameFocus"
            @blur="handleNameBlur"
            :disabled="!pkg"
            class="py-2 pl-2 w-full text-sm bg-white rounded border border-gray-300 transition-all focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <!-- Name Dropdown -->
          <div
            v-if="showNameDropdown && filteredServices.length > 0"
            class="overflow-auto absolute z-50 mt-1 w-full max-h-48 bg-white rounded border border-gray-200 shadow-lg"
          >
            <div
              v-for="item in filteredServices"
              :key="item.eligibleServiceUuid"
              class="px-2 py-1.5 text-xs text-gray-700 border-b border-gray-100 cursor-pointer hover:bg-blue-50 last:border-b-0"
              @mousedown.prevent="selectFromDropdown(item, 'name')"
            >
              <div class="font-semibold text-gray-900">{{ item.item }}</div>
              <div class="text-xs text-gray-500">{{ item.itemCode }}</div>
            </div>
          </div>
        </div>

        <!-- Price (1 col) -->
        <div class="lg:col-span-1">
          <label class="block mb-2 text-xs font-semibold text-gray-700"
            >Price</label
          >
          <input
            :value="selectedPrice ? formatCurrency(selectedPrice) : '0.00'"
            readonly
            class="py-2 pl-2 w-full text-sm font-semibold text-gray-900 bg-gray-50 rounded border border-gray-300 cursor-not-allowed"
          />
        </div>

        <!-- Qty (1 col) -->
        <div class="lg:col-span-1">
          <label class="block mb-2 text-xs font-semibold text-gray-700"
            >Qty</label
          >
          <input
            v-model.number="qty"
            type="number"
            min="1"
            class="py-2 pl-2 w-full text-sm text-center bg-white rounded border border-gray-300 transition-all focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <!-- Total (1 col) -->
        <div class="lg:col-span-1">
          <label class="block mb-2 text-xs font-semibold text-gray-700"
            >Total</label
          >
          <input
            :value="
              selectedPrice && qty
                ? formatCurrency(selectedPrice * qty)
                : '0.00'
            "
            readonly
            class="py-2 pl-2 w-full text-sm font-bold text-blue-900 bg-blue-50 rounded border border-blue-300 cursor-not-allowed"
          />
        </div>

        <!-- Add Button (1 col) -->
        <div class="lg:col-span-1">
          <button
            @click="addService"
            :disabled="!searchCode || !searchName || !selectedPrice"
            class="py-2 pl-2 w-full text-sm font-bold text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {{ editingIndex !== null && editingItemType === 'SERVICE' && editingIsEligible ? '✏️ Update' : '➕ Add' }}
          </button>
        </div>
          </div>
        </div>
      </div>

      <div v-else class="p-4 bg-yellow-50 rounded-lg border border-red-200 shadow-sm">
        <h3 class="mb-4 text-sm font-bold text-red-900">💊 Manual Drug Entry</h3>
        <div class="grid grid-cols-1 gap-4 items-end sm:grid-cols-2 lg:grid-cols-9">
          <div class="lg:col-span-2">
            <label class="block mb-2 text-xs font-semibold text-gray-700">Code (optional)</label>
            <input
              v-model="manualDrugCode"
              placeholder="e.g., DR001"
              class="py-2 pl-2 w-full text-sm bg-white rounded border border-gray-300 transition-all focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div class="lg:col-span-3">
            <label class="block mb-2 text-xs font-semibold text-gray-700">Drug Name</label>
            <input
              v-model="manualDrugName"
              placeholder="e.g., Amoxicillin"
              class="py-2 pl-2 w-full text-sm bg-white rounded border border-gray-300 transition-all focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div class="lg:col-span-1">
            <label class="block mb-2 text-xs font-semibold text-gray-700">Price</label>
            <input
              v-model.number="manualDrugPrice"
              type="number"
              placeholder="0.00"
              min="0"
              step="0.01"
              class="py-2 pl-2 w-full text-sm bg-white rounded border border-gray-300 transition-all focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div class="lg:col-span-1">
            <label class="block mb-2 text-xs font-semibold text-gray-700">Qty</label>
            <input
              v-model.number="manualDrugQty"
              type="number"
              placeholder="1"
              min="1"
              class="py-2 pl-2 w-full text-sm text-center bg-white rounded border border-gray-300 transition-all focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div class="lg:col-span-1">
            <label class="block mb-2 text-xs font-semibold text-gray-700">Total</label>
            <input
              :value="
                manualDrugPrice && manualDrugQty
                  ? formatCurrency(manualDrugPrice * manualDrugQty)
                  : '0.00'
              "
              readonly
              class="py-2 pl-2 w-full text-sm font-bold text-red-900 bg-red-100 rounded border border-red-300 cursor-not-allowed"
            />
          </div>

          <div class="lg:col-span-1">
            <button
              @click="addManualDrug"
              :disabled="!pkg || !manualDrugName || !manualDrugPrice || !manualDrugQty"
              class="py-2 pl-2 w-full text-sm font-bold text-white bg-red-600 rounded hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {{ editingIndex !== null && editingItemType === 'DRUG' ? '✏️ Update' : '➕ Add' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Cart & Details -->
    <div class="grid grid-cols-1 gap-6">
      <!-- Cart Section - Table Format -->
      <div
        class="overflow-hidden bg-white rounded-xl border border-gray-200 shadow-sm"
      >
        <div class="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 class="text-lg font-bold text-gray-900">📋 Services List</h3>
          <p class="text-sm text-gray-600">{{ items.length }} item(s)</p>
        </div>
        <div class="p-6">
          <p v-if="submitted && !items.length" class="mb-3 text-xs text-red-600">Please add at least one item.</p>
          <div v-if="!items.length" class="py-8 text-center">
            <div
              class="inline-flex justify-center items-center mb-4 w-16 h-16 bg-gray-100 rounded-full"
            >
              <svg
                class="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <p class="font-medium text-gray-500">Cart is empty</p>
            <p class="mt-1 text-xs text-gray-400">Add services from the list</p>
          </div>
          <div v-else class="overflow-x-auto">
            <div class="min-w-[980px]">
              <Table
                :pending="false"
                :headers="{
                  head: ['Type', 'Code', 'Service Name', 'Price', 'Qty', 'Total', 'Balance', 'actions'],
                  row: ['itemType', 'serviceCode', 'serviceName', 'unitPrice', 'qty', 'totalPrice', 'remainingAfter'],
                }"
                :rows="itemsWithCoverage"
                :cells="{
                  unitPrice: (v) => formatCurrency(v),
                  totalPrice: (v) => formatCurrency(v),
                  remainingAfter: (v) => formatCurrency(v),
                }"
              >
                <template #serviceCode="{ row }">
                  <div
                    class="max-w-[140px] truncate"
                    :class="row?.deleted ? 'text-red-700 line-through' : ''"
                    :title="row?.serviceCode || ''"
                  >
                    {{ row?.serviceCode }}
                  </div>
                </template>

                <template #serviceName="{ row }">
                  <div
                    class="max-w-[260px] truncate"
                    :class="row?.deleted ? 'text-red-700 line-through' : ''"
                    :title="row?.serviceName || ''"
                  >
                    {{ row?.serviceName }}
                  </div>
                </template>

                <template #remainingAfter="{ row }">
                  <div class="flex flex-col">
                    <span :class="row?.isOverLimit ? 'text-red-700 font-bold' : 'text-green-700 font-semibold'">
                      {{ formatCurrency(row?.remainingAfter || 0) }}
                    </span>
                    <span v-if="row?.isOverLimit" class="text-[11px] text-red-700">
                      Over by {{ formatCurrency(row?.overBy || 0) }}
                    </span>
                  </div>
                </template>

                <template #actions="{ row }">
                  <div class="flex gap-2 items-center">
                    <button
                      type="button"
                      @click="editItemByRow(row)"
                      :disabled="row?.deleted"
                      class="p-1 text-blue-600 rounded hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Edit"
                    >
                      <span class="inline-flex w-4 h-4" v-html="icons.edit"></span>
                    </button>
                    <button
                      v-if="!row?.deleted"
                      type="button"
                      @click="removeItemByRow(row)"
                      class="p-1 text-red-600 rounded hover:bg-red-50"
                      title="Remove"
                    >
                      <span class="inline-flex w-5 h-5" v-html="icons.delete"></span>
                    </button>
                    <button
                      v-else
                      type="button"
                      @click="restoreItemByRow(row)"
                      class="p-1 text-emerald-600 rounded hover:bg-emerald-50"
                      title="Restore"
                    >
                      Restore
                    </button>
                  </div>
                </template>
              </Table>
            </div>
          </div>
          <div v-if="items.length" class="p-3 mt-4 bg-blue-50 rounded-lg border border-blue-200">
            <div class="flex justify-between items-center">
              <span class="font-bold text-gray-900">Grand Total</span>
              <span class="text-lg font-bold text-blue-600">{{
                formatCurrency(grandTotal)
              }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Details Section -->
      <div
        class="overflow-hidden bg-white rounded-xl border border-gray-200 shadow-sm"
      >
        <div class="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 class="text-lg font-bold text-gray-900">📝 Request Details</h3>
        </div>
        <div class="p-6 space-y-4">
          <!-- File Upload -->
          <div>
            <label class="block mb-2 text-sm font-semibold text-gray-700">📎 Medical Files <span class="text-xs font-normal text-gray-500">(optional)</span></label>
            <div
              class="p-4 text-center bg-gray-50 rounded-lg border border-gray-300 border-dashed transition-colors cursor-pointer hover:bg-gray-100"
            >
              <input
                type="file"
                multiple
                accept="image/*,.pdf"
                @change="onFilesSelected"
                class="hidden"
                id="file-input"
              />
              <label for="file-input" class="cursor-pointer">
                <svg
                  class="mx-auto mb-2 w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <p class="text-sm font-medium text-gray-700">Click to upload</p>
                <p class="mt-1 text-xs text-gray-500">
                  Images or PDF (max 20 files)
                </p>
              </label>
            </div>
            <ul v-if="files.length" class="mt-3 space-y-2 text-xs">
              <li
                v-for="(f, i) in files"
                :key="i"
                class="flex gap-2 justify-between items-center p-2 bg-green-50 rounded border border-green-200"
              >
                <div
                  class="flex flex-1 gap-2 items-center min-w-0 text-green-700"
                >
                  <svg
                    class="flex-shrink-0 w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span class="truncate">{{ f.name }}</span>
                </div>
                <button
                  @click="removeFile(i)"
                  type="button"
                  class="flex-shrink-0 font-bold text-red-500 hover:text-red-700"
                >
                  ✕
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Submit Button - Bottom of Page -->
    <div v-if="submitted && missingRequiredFields.length" class="p-3 mb-3 bg-red-50 rounded-lg border border-red-200">
      <p class="text-sm font-semibold text-red-800">Please fill the required fields:</p>
      <ul class="mt-1 ml-5 text-sm list-disc text-red-700">
        <li v-for="(f, i) in missingRequiredFields" :key="i">{{ f }}</li>
      </ul>
    </div>
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <ModalFormSubmitButton
        @click="() => submit('add')"
        :pending="isSubmittingAdd"
        btn-text="Submit & Add"
        :disabled="isSubmittingAny"
        class="w-full"
        :class="{
          'opacity-60 cursor-not-allowed': missingRequiredFields.length,
        }"
      />
      <ModalFormSubmitButton
        @click="() => submit('generate')"
        :pending="isSubmittingGenerate"
        btn-text="Submit & Generate"
        :disabled="isSubmittingAny"
        class="w-full"
        :class="{
          'opacity-60 cursor-not-allowed': missingRequiredFields.length,
        }"
      />
    </div>
  </div>
</template>
