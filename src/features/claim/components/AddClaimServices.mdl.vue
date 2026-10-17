<script setup>
// Manually enter cash/credit services for an insured picked on the Credit Claims page.
// Submits the same request as the Cash Services page's "Other provider" mode.
import { computed, ref, watch } from "vue";
import { closeModal } from "@customizer/modal-x";
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import Button from "@/components/Button.vue";
import CustomSelect from "@/components/CustomSelect.vue";
import { useApiRequest } from "@/composables/useApiRequest";
import { getInstitutionContracts } from "@/features/underwriting/api/underwritingApi";
import { getPackageDropdown } from "@/features/product_settings/api/coverageApi";
import { createCashServiceProvided } from "../api/claimApi";
import { formatCurrency, toasted } from "@/utils/utils";

const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
});

const insuredUuid = computed(() => props.data?.insuredPersonUuid || "");
const dependantUuid = computed(() => props.data?.dependantUuid || null);

function toList(res) {
  const raw = res?.data ?? res;
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.content)) return raw.content;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.data?.content)) return raw.data.content;
  return [];
}

/* ---------- Contract ---------- */
const contracts = ref([]);
const contractUuid = ref("");
const contractsReq = useApiRequest();
if (props.data?.institutionUuid) {
  contractsReq.send(
    () => getInstitutionContracts(props.data.institutionUuid, { status: "ACTIVE" }),
    (res) => {
      contracts.value = toList(res);
      if (contracts.value.length === 1) {
        contractUuid.value = contracts.value[0].payerInstitutionContractUuid;
      }
    }
  );
}
const contractOptions = computed(() =>
  contracts.value.map((c) => ({
    value: c.payerInstitutionContractUuid,
    label: c.contractName || c.contractCode || c.payerInstitutionContractUuid,
  }))
);

/* ---------- Package ---------- */
const packages = ref([]);
const pkg = ref("");
const packagesReq = useApiRequest();
packagesReq.send(
  () => getPackageDropdown(insuredUuid.value, dependantUuid.value),
  (res) => {
    packages.value = toList(res);
  }
);
const packageOptions = computed(() =>
  packages.value.map((p) => ({ value: p.packageUuid, label: p.packageName }))
);

/* ---------- Header fields ---------- */
const providerName = ref("");
const referenceNumber = ref("");
const today = new Date().toISOString().slice(0, 10);
const providedDate = ref(today);

/* ---------- Items ---------- */
const newItem = () => ({ itemType: "SERVICE", serviceName: "", serviceCode: "", qty: 1, unitPrice: null });
const items = ref([newItem()]);

function addRow() {
  items.value.push(newItem());
}
function removeRow(index) {
  items.value.splice(index, 1);
  if (!items.value.length) items.value.push(newItem());
}

const lineTotal = (item) => (Number(item.unitPrice) || 0) * (Number(item.qty) || 0);
const grandTotal = computed(() => items.value.reduce((sum, item) => sum + lineTotal(item), 0));

/* ---------- Validation ---------- */
const submitted = ref(false);
const filledItems = computed(() => items.value.filter((i) => i.serviceName.trim()));
const missing = computed(() => {
  const m = [];
  if (!contractUuid.value) m.push("Contract");
  if (!providerName.value.trim()) m.push("Provider name");
  if (!pkg.value) m.push("Package");
  if (!providedDate.value) m.push("Service date");
  if (!filledItems.value.length) m.push("At least one service");
  if (filledItems.value.some((i) => !(Number(i.qty) > 0) || !(Number(i.unitPrice) > 0))) {
    m.push("Quantity and price for every service");
  }
  return m;
});

watch(contractUuid, () => {
  submitted.value = false;
});

/* ---------- Submit ---------- */
const saveReq = useApiRequest();
function save() {
  submitted.value = true;
  if (missing.value.length) {
    toasted(false, "", `Missing required: ${missing.value.join(", ")}`);
    return;
  }
  if (providedDate.value > today) {
    toasted(false, "", "Service date can't be in the future");
    return;
  }

  const body = {
    contractUuid: contractUuid.value,
    providerName: providerName.value.trim(),
    totalPrice: filledItems.value.reduce((sum, item) => sum + lineTotal(item), 0),
    providedDate: providedDate.value,
    insuredUuid: insuredUuid.value,
    dependentUuid: dependantUuid.value || undefined,
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
  // The backend reads this exact multipart field name (trailing space included)
  form.append("serviceProvidedRequest ", JSON.stringify(body));

  saveReq.send(
    () => createCashServiceProvided(form),
    (res) => {
      if (res.success) {
        toasted(true, "Services added");
        closeModal({ success: true });
      } else {
        toasted(false, "", res.error || "Failed to add services");
      }
    }
  );
}

const inputClass =
  "px-3 w-full h-10 text-sm bg-white rounded-md border border-line-strong transition-colors focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15";
</script>

<template>
  <ModalParent>
    <NewFormParent size="lg" title="Add Services Manually">
      <div class="flex flex-col gap-5">
        <!-- Patient -->
        <div class="flex gap-2 items-center px-3 py-2 text-sm rounded-lg bg-surface-muted">
          <span class="text-ink-muted">Patient:</span>
          <span class="font-semibold text-ink">{{ props.data?.name || "—" }}</span>
        </div>

        <!-- Claim details -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label class="block mb-1.5 text-sm font-medium text-ink">Contract<span class="text-error">*</span></label>
            <CustomSelect
              v-model="contractUuid"
              :options="contractOptions"
              :pending="contractsReq.pending.value"
              placeholder="Choose contract..."
              class="w-full"
            />
            <p v-if="!contractsReq.pending.value && contractsReq.dirty.value && !contracts.length" class="mt-1 text-xs text-error">
              This institution has no active contract.
            </p>
          </div>
          <div>
            <label class="block mb-1.5 text-sm font-medium text-ink">Provider name<span class="text-error">*</span></label>
            <input v-model="providerName" :class="inputClass" placeholder="Hospital / pharmacy name" />
            <p v-if="submitted && !providerName.trim()" class="mt-1 text-xs text-error">Provider name is required.</p>
          </div>
          <div>
            <label class="block mb-1.5 text-sm font-medium text-ink">Package<span class="text-error">*</span></label>
            <CustomSelect
              v-model="pkg"
              :options="packageOptions"
              :pending="packagesReq.pending.value"
              placeholder="Choose package..."
              class="w-full"
            />
            <p v-if="submitted && !pkg" class="mt-1 text-xs text-error">Package is required.</p>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block mb-1.5 text-sm font-medium text-ink">Service date<span class="text-error">*</span></label>
              <input v-model="providedDate" type="date" :max="today" :class="inputClass" />
            </div>
            <div>
              <label class="block mb-1.5 text-sm font-medium text-ink">Reference no.</label>
              <input v-model="referenceNumber" :class="inputClass" placeholder="e.g., CR-002" />
            </div>
          </div>
        </div>

        <!-- Services -->
        <div class="rounded-lg border border-line">
          <div class="flex justify-between items-center px-3 py-2 border-b border-line bg-surface-muted">
            <h3 class="text-sm font-semibold text-ink">Services &amp; drugs</h3>
            <Button size="xs" type="secondary" @click="addRow">+ Add row</Button>
          </div>

          <div class="divide-y divide-line">
            <div
              v-for="(item, index) in items"
              :key="index"
              class="grid grid-cols-2 gap-2 items-end p-3 sm:grid-cols-12"
            >
              <div class="col-span-2 sm:col-span-2">
                <label class="block mb-1 text-xs text-ink-muted">Type</label>
                <select v-model="item.itemType" :class="inputClass">
                  <option value="SERVICE">Service</option>
                  <option value="DRUG">Drug</option>
                </select>
              </div>
              <div class="col-span-2 sm:col-span-4">
                <label class="block mb-1 text-xs text-ink-muted">Name<span class="text-error">*</span></label>
                <input v-model="item.serviceName" :class="inputClass" :placeholder="item.itemType === 'DRUG' ? 'e.g., Amoxicillin 500mg' : 'e.g., Consultation'" />
              </div>
              <div class="sm:col-span-2">
                <label class="block mb-1 text-xs text-ink-muted">Code</label>
                <input v-model="item.serviceCode" :class="inputClass" placeholder="Optional" />
              </div>
              <div class="sm:col-span-1">
                <label class="block mb-1 text-xs text-ink-muted">Qty</label>
                <input v-model.number="item.qty" type="number" min="1" :class="inputClass" />
              </div>
              <div class="sm:col-span-2">
                <label class="block mb-1 text-xs text-ink-muted">Unit price</label>
                <input v-model.number="item.unitPrice" type="number" min="0" step="0.01" :class="inputClass" placeholder="0.00" />
              </div>
              <div class="flex col-span-2 gap-2 justify-between items-center h-10 sm:col-span-1 sm:justify-end">
                <span class="text-sm font-medium sm:hidden text-ink">{{ formatCurrency(lineTotal(item)) }}</span>
                <button
                  type="button"
                  class="grid place-items-center w-9 h-9 rounded-md text-ink-subtle hover:text-error hover:bg-error-soft"
                  :aria-label="`Remove row ${index + 1}`"
                  @click="removeRow(index)"
                >
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
                    <path d="M6 6l12 12M18 6 6 18" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div class="flex justify-between items-center px-3 py-2.5 border-t border-line bg-surface-muted">
            <span class="text-sm text-ink-muted">{{ filledItems.length }} item(s)</span>
            <span class="text-sm font-semibold text-ink">Total: {{ formatCurrency(grandTotal) }}</span>
          </div>
        </div>

        <p v-if="submitted && missing.length" class="text-sm text-error">Missing: {{ missing.join(", ") }}.</p>
      </div>

      <template #bottom>
        <div class="flex gap-2 justify-end p-3">
          <Button type="link" :disabled="saveReq.pending.value" @click="closeModal()">Cancel</Button>
          <Button type="primary" :pending="saveReq.pending.value" @click="save">Add services</Button>
        </div>
      </template>
    </NewFormParent>
  </ModalParent>
</template>
