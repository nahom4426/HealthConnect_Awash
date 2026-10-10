<script setup>
import { computed, onMounted, ref } from 'vue';
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import Form from "@/components/new_form_builder/Form.vue";
import Button from "@/components/Button.vue";
import { closeModal } from "@customizer/modal-x";
import { toasted, formatMoney } from '@/utils/utils';
import { useApiRequest } from "@/composables/useApiRequest";
import { getPackageDropdown } from '@/features/product_settings/api/coverageApi';
import { createCreditServiceProvided, updateManualCreditServiceProvided } from '@/features/claim/api/claimApi';

const props = defineProps({
  data: Object,
});

const req = useApiRequest();
const loading = ref(false);
const packages = ref([]);

const selectedPackageUuids = ref([]);
const packagePrices = ref({});

const showDetails = ref(false);
const contractUuid = ref('');
const providerName = ref('');
const providedDate = ref('');
const deleted = ref(false);

const isEditManualCredit = computed(() => props.data?.mode === 'edit_manual_credit');
const serviceProvidedUuid = computed(() => props.data?.serviceProvidedUuid || props.data?.sourceRow?.serviceProvidedUuid || '');

const itemDefaults = ref({
  serviceId: '',
  itemUuid: '',
  serviceName: '',
  serviceCode: '',
  qty: 1,
  recordNumber: '',
  itemType: 'SERVICE',
  c_section: false,
  deleted: false,
});

const attachments = ref([]);

const insuredUuid = computed(() => props.data?.insuredUuid || props.data?.insuredPersonUuid || '');
const dependentUuid = computed(() => props.data?.dependantUuid || props.data?.dependentUuid || null);

const contractUuidFromContext = computed(
  () => props.data?.payerInstitutionContractUuid || props.data?.contractUuid || ''
);

function isDependentPkg(pkg) {
  return !!dependentUuid.value;
}

function getPackageLimit(pkg) {
  if (!pkg) return 0;
  if (isDependentPkg(pkg)) {
    const depSum = Number(pkg.depSumAssured ?? pkg.dependentSumAssured);
    if (Number.isFinite(depSum) && depSum > 0) return depSum;
  }
  const sum = Number(pkg.sumAssured);
  return Number.isFinite(sum) ? sum : 0;
}

function getPackageUsed(pkg) {
  if (!pkg) return 0;
  if (isDependentPkg(pkg)) {
    const depUsed = Number(pkg.depUsedBenefit ?? pkg.dependentUsed);
    if (Number.isFinite(depUsed) && depUsed > 0) return depUsed;
  }
  const used = Number(pkg.used);
  return Number.isFinite(used) ? used : 0;
}

function getPackageRemaining(pkg) {
  const limit = getPackageLimit(pkg);
  const used = getPackageUsed(pkg);
  return limit - used;
}

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

async function loadPackages() {
  if (!insuredUuid.value) return;
  try {
    loading.value = true;
    const res = await getPackageDropdown(insuredUuid.value, dependentUuid.value);
    const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
    packages.value = sortPackagesWithBasicCoverFirst(list);

    const existing = packagePrices.value || {};
    const next = {};
    packages.value.forEach((p) => {
      const key = p?.packageUuid;
      if (!key) return;
      next[key] = existing[key] ?? 0;
    });
    packagePrices.value = next;
  } catch (e) {
    console.error(e);
    packages.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadPackages();

  if (!contractUuid.value && contractUuidFromContext.value) {
    contractUuid.value = String(contractUuidFromContext.value);
  }

  if (isEditManualCredit.value) {
    const row = props.data?.sourceRow || {};
    if (row?.contractUuid && !contractUuid.value) contractUuid.value = String(row.contractUuid);
    if (row?.providerName) providerName.value = String(row.providerName);
    if (row?.providedDate) {
      const d = String(row.providedDate);
      providedDate.value = d.includes('T') ? d.split('T')[0] : d;
    }
    showDetails.value = true;

    const items = Array.isArray(row?.providedItemResponses) ? row.providedItemResponses : [];
    const pkgUuids = items.map((it) => it?.packageUuid).filter(Boolean);
    selectedPackageUuids.value = Array.from(new Set(pkgUuids));
    const nextPrices = { ...(packagePrices.value || {}) };
    items.forEach((it) => {
      if (!it?.packageUuid) return;
      nextPrices[it.packageUuid] = Number(it?.totalPrice) || 0;
    });
    packagePrices.value = nextPrices;

    if (items[0]) {
      itemDefaults.value = {
        ...itemDefaults.value,
        serviceId: items[0]?.itemId || '',
        itemUuid: items[0]?.providedItemUuid || '',
        serviceName: items[0]?.itemName || '',
        serviceCode: items[0]?.itemCode || '',
        qty: Number(items[0]?.quantity) || 1,
        recordNumber: row?.recordNumber || '',
        itemType: items[0]?.itemType || 'SERVICE',
        c_section: false,
        deleted: false,
      };
    }
  }
});

function handleFilesChange(e) {
  const files = Array.from(e?.target?.files || []);
  attachments.value = files;
}

function handleSubmit() {
  if (!insuredUuid.value) {
    toasted(false, '', 'Missing insuredUuid');
    return;
  }
  if (!selectedPackageUuids.value?.length) {
    toasted(false, '', 'Please select at least one package');
    return;
  }

  const items = selectedPackageUuids.value
    .map((packageUuid) => {
      const val = Number(packagePrices.value?.[packageUuid]);
      return {
        packageUuid,
        totalPrice: val,
      };
    })
    .filter((i) => i.packageUuid && Number.isFinite(i.totalPrice) && i.totalPrice > 0);

  if (!items.length) {
    toasted(false, '', 'Please enter a valid total price for selected packages');
    return;
  }

  const total = items.reduce((sum, i) => sum + Number(i.totalPrice || 0), 0);

  req.send(
    async () => {
      const body = {
        contractUuid: contractUuid.value || undefined,
        providerName: providerName.value || undefined,
        totalPrice: total,
        providedDate: providedDate.value || undefined,
        insuredUuid: insuredUuid.value,
        dependentUuid: dependentUuid.value || undefined,
        deleted: Boolean(deleted.value),
        items: items.map((i) => ({
          ...i,
          serviceId: itemDefaults.value.serviceId || undefined,
          itemUuid: itemDefaults.value.itemUuid || undefined,
          serviceName: itemDefaults.value.serviceName || undefined,
          serviceCode: itemDefaults.value.serviceCode || undefined,
          qty: Number(itemDefaults.value.qty || 1),
          recordNumber: itemDefaults.value.recordNumber || undefined,
          itemType: itemDefaults.value.itemType || 'SERVICE',
          c_section: Boolean(itemDefaults.value.c_section),
          deleted: Boolean(itemDefaults.value.deleted),
        })),
      };

      const form = new FormData();
      attachments.value.forEach((f) => form.append('attachment', f));
      if (isEditManualCredit.value) {
        form.append('itemRequests', JSON.stringify(body));
        return updateManualCreditServiceProvided(serviceProvidedUuid.value, form);
      }

      form.append('service provided request', JSON.stringify(body));
      return createCreditServiceProvided(form);
    },
    (res) => {
      if (res?.success) {
        toasted(true, isEditManualCredit.value ? 'Updated successfully' : 'Utilization submitted successfully', '');
        closeModal();
      } else {
        toasted(false, '', res?.error || (isEditManualCredit.value ? 'Failed to update' : 'Failed to submit utilization'));
      }
    }
  );
}
</script>

<template>
  <ModalParent>
    <NewFormParent
      size="xmd"
      class="flex flex-col max-h-[90vh] overflow-hidden"
      title="Package Utilization Overview"
      subtitle="Member package limits, used benefits, and remaining balances"
    >
      <div class="p-6 overflow-y-auto overflow-x-hidden form-scrollbar space-y-4">
        <div v-if="loading" class="flex justify-center items-center py-8 text-sm text-ink-subtle">
          <div class="w-6 h-6 rounded-full border-2 border-primary/20 animate-spin border-t-primary mr-2"></div>
          Loading packages...
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="pkg in packages"
            :key="pkg.packageUuid"
            :class="[
              'p-3.5 rounded-xl border transition-all duration-200 shadow-2xs',
              pkg.packageName?.toUpperCase()?.includes('BASIC COVER')
                ? 'bg-primary/[0.03] border-primary/20 ring-1 ring-primary/15'
                : 'bg-white border-line hover:border-line-strong'
            ]"
          >
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-2 mb-1.5">
                <div class="flex items-center gap-2 min-w-0">
                  <span class="text-sm font-bold text-ink truncate">
                    {{ pkg.packageName }}
                  </span>
                  <span
                    v-if="pkg.packageName?.toUpperCase()?.includes('BASIC COVER')"
                    class="inline-flex items-center px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-primary text-white shadow-2xs shrink-0"
                  >
                    ★ Main Cover
                  </span>
                  <span class="text-xs text-ink-subtle font-mono truncate">
                    ({{ pkg.packageCode || pkg.packageUuid?.slice(0, 8) }})
                  </span>
                </div>

                <span
                  v-if="dependentUuid"
                  class="inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-full bg-purple-100 text-purple-700 border border-purple-200 shrink-0"
                >
                  Dependant
                </span>
                <span
                  v-else
                  class="inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-full bg-sky-100 text-sky-700 border border-sky-200 shrink-0"
                >
                  Insured
                </span>
              </div>

              <div class="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-line text-xs">
                <div class="flex flex-col">
                  <span class="text-[11px] font-medium text-ink-subtle">Limit</span>
                  <span class="font-bold text-ink font-mono">
                    ETB {{ formatMoney(getPackageLimit(pkg)) }}
                  </span>
                </div>

                <div class="flex flex-col">
                  <span class="text-[11px] font-medium text-ink-subtle">Used</span>
                  <span class="font-bold text-ink-muted font-mono">
                    ETB {{ formatMoney(getPackageUsed(pkg)) }}
                  </span>
                </div>

                <div class="flex flex-col items-end">
                  <span class="text-[11px] font-medium text-ink-subtle">Remaining</span>
                  <span
                    :class="[
                      'font-extrabold font-mono px-2 py-0.5 rounded text-xs',
                      getPackageRemaining(pkg) <= 0
                        ? 'bg-error-soft text-error-strong border border-error/20'
                        : 'bg-success-soft text-success-strong border border-success/20'
                    ]"
                  >
                    ETB {{ formatMoney(getPackageRemaining(pkg)) }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div v-if="!packages.length" class="py-8 text-center text-sm text-ink-subtle">
            No active package benefits found for this member.
          </div>
        </div>

        <div class="flex gap-3 justify-end pt-4 border-t border-line">
          <Button type="primary" @click="closeModal" class="px-5 py-2 text-white bg-primary">
            Close
          </Button>
        </div>
      </div>
    </NewFormParent>
  </ModalParent>
</template>
