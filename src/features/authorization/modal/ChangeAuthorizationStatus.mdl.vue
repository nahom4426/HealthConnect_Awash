<script setup>
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import Button from "@/components/Button.vue";
import CustomSelect from "@/components/CustomSelect.vue";
import { closeModal } from "@customizer/modal-x";
import { ref, computed } from "vue";
import { useApiRequest } from "@/composables/useApiRequest";
import { changeAuthorizationStatus } from "../api/authorizationApi";
import { getPackageDropdown } from "@/features/product_settings/api/coverageApi";
import { toasted, formatMoney } from "@/utils/utils";

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});

const api = useApiRequest();

const authorizationUuid = computed(() => props.data?.authorizationUuid);
const insuredUuid = computed(() => props.data?.insuredUuid || props.data?.insuredPersonUuid || "");
const dependantUuid = computed(() => props.data?.dependantUuid || props.data?.dependentUuid || null);

const packages = ref([]);
const loadingPackages = ref(false);
const showPackages = ref(false);

function sortPackagesWithBasicCoverFirst(list) {
  if (!Array.isArray(list)) return [];
  return [...list].sort((a, b) => {
    const aName = (a?.packageName || '').trim().toUpperCase();
    const bName = (b?.packageName || '').trim().toUpperCase();
    const aIsBasic = aName.includes('BASIC COVER');
    const bIsBasic = bName.includes('BASIC COVER');
    if (aIsBasic && !bIsBasic) return -1;
    if (!aIsBasic && bIsBasic) return 1;
    return 0;
  });
}

async function fetchPackageBenefits() {
  if (!insuredUuid.value) return;
  try {
    loadingPackages.value = true;
    const res = await getPackageDropdown(insuredUuid.value, dependantUuid.value);
    const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
    packages.value = sortPackagesWithBasicCoverFirst(list);
  } catch (err) {
    console.error("Failed to load package benefits", err);
    packages.value = [];
  } finally {
    loadingPackages.value = false;
  }
}

function getPkgLimit(pkg) {
  if (!pkg) return 0;
  if (dependantUuid.value) {
    const depSum = Number(pkg.depSumAssured ?? pkg.dependentSumAssured);
    if (Number.isFinite(depSum) && depSum > 0) return depSum;
  }
  const sum = Number(pkg.sumAssured);
  return Number.isFinite(sum) ? sum : 0;
}

function getPkgUsed(pkg) {
  if (!pkg) return 0;
  if (dependantUuid.value) {
    const depUsed = Number(pkg.depUsedBenefit ?? pkg.dependentUsed);
    if (Number.isFinite(depUsed) && depUsed > 0) return depUsed;
  }
  const used = Number(pkg.used);
  return Number.isFinite(used) ? used : 0;
}

function getPkgRemaining(pkg) {
  return getPkgLimit(pkg) - getPkgUsed(pkg);
}

const status = ref(props.data?.currentStatus || "REQUESTED");
const activeDays = ref(
  [undefined, null].includes(props.data?.activeDays) ? "" : String(props.data?.activeDays)
);
const amount = ref(
  [undefined, null].includes(props.data?.authorizedAmount) ? "" : String(props.data?.authorizedAmount)
);

function parseDateString(dateValue) {
  if (!dateValue) return null;
  const str = String(dateValue).trim();
  if (!str) return null;

  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return {
      year: isoMatch[1],
      month: isoMatch[2],
      day: isoMatch[3],
      yyyyMmDd: `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`,
      ddMmYyyy: `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`,
    };
  }

  const ddmmyyyyMatch = str.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (ddmmyyyyMatch) {
    return {
      year: ddmmyyyyMatch[3],
      month: ddmmyyyyMatch[2],
      day: ddmmyyyyMatch[1],
      yyyyMmDd: `${ddmmyyyyMatch[3]}-${ddmmyyyyMatch[2]}-${ddmmyyyyMatch[1]}`,
      ddMmYyyy: `${ddmmyyyyMatch[1]}/${ddmmyyyyMatch[2]}/${ddmmyyyyMatch[3]}`,
    };
  }

  try {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const yyyy = String(d.getFullYear());
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return {
        year: yyyy,
        month: mm,
        day: dd,
        yyyyMmDd: `${yyyy}-${mm}-${dd}`,
        ddMmYyyy: `${dd}/${mm}/${yyyy}`,
      };
    }
  } catch (_) {}

  return null;
}

function toDateOnly(v) {
  const parsed = parseDateString(v);
  return parsed ? parsed.yyyyMmDd : "";
}

const endDateRaw = ref(toDateOnly(props.data?.endDate));

function toDdMmYyyy(v) {
  const parsed = parseDateString(v);
  return parsed ? parsed.ddMmYyyy : "";
}

async function submit() {
  if (!authorizationUuid.value) return;
  if (!status.value) return;

  if (!endDateRaw.value) {
    toasted(false, "Please select an end date", "");
    return;
  }

  const parsedAmount = amount.value !== "" && amount.value !== null && amount.value !== undefined ? Number(amount.value) : (props.data?.authorizedAmount ?? 0);

  const payload = {
    status: status.value,
    endDate: toDdMmYyyy(endDateRaw.value),
    activeDays: activeDays.value ? Number(activeDays.value) : undefined,
    amount: parsedAmount,
  };

  api.send(
    () => changeAuthorizationStatus(authorizationUuid.value, payload),
    (res) => {
      if (res?.success) {
        toasted(true, "Authorization status updated", "");
        closeModal({
          success: true,
          authorizationUuid: authorizationUuid.value,
          status: payload.status,
          endDate: endDateRaw.value ? `${endDateRaw.value}T00:00:00.000+00:00` : payload.endDate,
          activeDays: payload.activeDays,
          authorizedAmount: payload.amount,
        });
      } else {
        toasted(false, "Failed to update authorization", res?.error);
      }
    }
  );
}
</script>

<template>
  <ModalParent>
    <NewFormParent
      class="w-[30rem]"
      title="Change Authorization Status"
      subtitle="Update status and end date"
      size="sm"
    >
      <div class="flex flex-col gap-4 py-2">
        <div
          v-if="props.data?.authorizedAmount !== undefined && props.data?.authorizedAmount !== null"
          class="p-3 bg-gradient-to-r from-success-soft to-teal-50 border border-success/[0.16] rounded-xl space-y-2"
        >
          <div class="flex justify-between items-center">
            <span class="text-xs font-semibold text-success-strong">Authorized Amount</span>
            <span class="inline-flex gap-1.5 items-center text-sm font-bold font-mono text-success-strong">
              <span class="text-[10px] bg-success/[0.18] text-success-strong px-1.5 py-0.5 rounded font-extrabold">ETB</span>
              {{ formatMoney(props.data?.authorizedAmount) }}
            </span>
          </div>
          <div
            v-if="props.data?.usedAmount !== undefined && props.data?.usedAmount !== null"
            class="flex justify-between items-center pt-1.5 border-t border-success/[0.12]"
          >
            <span class="text-xs font-medium text-ink-muted">Used Amount</span>
            <span class="inline-flex gap-1 items-center text-xs font-semibold font-mono text-ink">
              <span class="text-[10px] bg-line/90 text-ink-muted px-1 py-0.5 rounded font-bold">ETB</span>
              {{ formatMoney(props.data?.usedAmount) }}
            </span>
          </div>
        </div>

        <div v-if="insuredUuid" class="p-3 bg-primary/[0.035] border border-primary/20 rounded-xl space-y-2">
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-2">
              <span class="text-xs font-semibold text-primary-hover">Member Package Benefits</span>
              <span
                v-if="dependantUuid"
                class="px-1.5 py-0.5 text-[10px] font-bold rounded bg-purple-100 text-purple-700 border border-purple-200"
              >
                Dependant
              </span>
              <span
                v-else
                class="px-1.5 py-0.5 text-[10px] font-bold rounded bg-sky-100 text-sky-700 border border-sky-200"
              >
                Insured
              </span>
            </div>
            <button
              type="button"
              @click="() => { showPackages = !showPackages; if (showPackages && !packages.length) fetchPackageBenefits(); }"
              class="text-xs font-semibold text-primary hover:text-primary-hover flex items-center gap-1"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {{ showPackages ? "Hide Packages" : "Check Package Usage" }}
            </button>
          </div>

          <div v-if="showPackages" class="space-y-2 pt-2 border-t border-primary/[0.12] max-h-52 overflow-y-auto">
            <div v-if="loadingPackages" class="py-2 text-xs text-primary-hover">Loading package limits...</div>
            <div v-else-if="!packages.length" class="py-2 text-xs text-ink-subtle">No active packages found.</div>
            <div
              v-else
              v-for="pkg in packages"
              :key="pkg.packageUuid"
              class="p-2 bg-white rounded-lg border border-primary/10 shadow-2xs space-y-1 text-xs"
            >
              <div class="flex justify-between items-center font-semibold text-ink">
                <span>{{ pkg.packageName }}</span>
                <span
                  :class="[
                    'px-1.5 py-0.5 rounded text-[10px] font-bold',
                    getPkgRemaining(pkg) <= 0 ? 'bg-error-soft text-error-strong' : 'bg-success-soft text-success-strong'
                  ]"
                >
                  Remaining: ETB {{ formatMoney(getPkgRemaining(pkg)) }}
                </span>
              </div>
              <div class="flex justify-between text-[11px] text-ink-subtle">
                <span>Limit: ETB {{ formatMoney(getPkgLimit(pkg)) }}</span>
                <span>Used: ETB {{ formatMoney(getPkgUsed(pkg)) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-4">
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-ink-muted">Status</label>
            <CustomSelect
              v-model="status"
              placeholder="Select status"
              :options="[
                'REQUESTED',
                'APPROVED',
                'REJECTED',
                'CANCELLED'
              ]"
            />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-ink-muted">Authorized Amount</label>
            <input
              v-model="amount"
              type="number"
              step="any"
              min="0"
              placeholder="e.g. 1000.00"
              class="h-10 px-3 text-sm border border-line rounded-lg focus:outline-none focus:border-primary"
            />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-ink-muted">End Date</label>
            <input
              v-model="endDateRaw"
              type="date"
              class="h-10 px-3 text-sm border border-line rounded-lg focus:outline-none focus:border-primary"
            />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-ink-muted">Active Days (optional)</label>
            <input
              v-model="activeDays"
              type="number"
              min="0"
              placeholder="e.g. 10"
              class="h-10 px-3 text-sm border border-line rounded-lg focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <div class="flex gap-3 justify-end items-center pt-2 border-t">
          <Button type="link" :disabled="api.pending.value" @click="() => !api.pending.value && closeModal(undefined)">
            Cancel
          </Button>
          <Button type="primary" :pending="api.pending.value" :disabled="api.pending.value" as="button" @click.prevent="submit">
            Save
          </Button>
        </div>
      </div>
    </NewFormParent>
  </ModalParent>
</template>
