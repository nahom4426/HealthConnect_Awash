<script setup>
import { computed, onMounted, ref } from 'vue';
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import Form from "@/components/new_form_builder/Form.vue";
import Button from "@/components/Button.vue";
import { closeModal } from "@customizer/modal-x";
import { toasted } from '@/utils/utils';
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

const insuredUuid = computed(() => props.data?.insuredUuid || '');
const dependentUuid = computed(() => props.data?.dependantUuid || props.data?.dependentUuid || null);

const contractUuidFromContext = computed(
  () => props.data?.payerInstitutionContractUuid || props.data?.contractUuid || ''
);

async function loadPackages() {
  if (!insuredUuid.value) return;
  try {
    loading.value = true;
    const res = await getPackageDropdown(insuredUuid.value, dependentUuid.value);
    const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
    packages.value = list;

    const existing = packagePrices.value || {};
    const next = {};
    list.forEach((p) => {
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
      title="Utilization"
      subtitle="Select a package and enter total price"
    >
      <div class="overflow-y-auto overflow-x-hidden form-scrollbar">
        <Form class="p-6 space-y-6" id="utilizationForm" @submit.prevent="handleSubmit">
          <div class="flex justify-end">
            <button
              type="button"
              class="text-sm font-medium text-blue-700 hover:text-blue-800"
              @click="showDetails = !showDetails"
            >
              {{ showDetails ? 'Hide details' : 'Add details' }}
            </button>
          </div>

          <div v-if="showDetails" class="p-4 space-y-4 rounded-lg border border-gray-200">
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div class="space-y-1">
                <label class="block text-xs font-medium text-gray-600">Contract UUID</label>
                <input
                  type="text"
                  v-model="contractUuid"
                  class="px-3 py-2 w-full text-sm rounded-lg border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="contractUuid"
                
                />
              </div>

              <div class="space-y-1">
                <label class="block text-xs font-medium text-gray-600">Provider Name</label>
                <input
                  type="text"
                  v-model="providerName"
                  class="px-3 py-2 w-full text-sm rounded-lg border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="providerName"
                />
              </div>

              <div class="space-y-1">
                <label class="block text-xs font-medium text-gray-600">Provided Date</label>
                <input
                  type="date"
                  v-model="providedDate"
                  class="px-3 py-2 w-full text-sm rounded-lg border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <!-- <div class="flex gap-2 items-center pt-6">
                <input type="checkbox" v-model="deleted" class="w-4 h-4" />
                <span class="text-sm text-gray-700">Deleted</span>
              </div> -->
            </div>

            <div class="pt-2">
              <div class="text-xs font-semibold text-gray-700">Item details (applied to all selected packages)</div>
              <div class="grid grid-cols-1 gap-4 mt-3 sm:grid-cols-2">
                <div class="space-y-1">
                  <label class="block text-xs font-medium text-gray-600">Service ID</label>
                  <input type="text" v-model="itemDefaults.serviceId" class="px-3 py-2 w-full text-sm rounded-lg border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                </div>
<!-- 
                <div class="space-y-1">
                  <label class="block text-xs font-medium text-gray-600">Item UUID</label>
                  <input type="text" v-model="itemDefaults.itemUuid" class="px-3 py-2 w-full text-sm rounded-lg border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                </div> -->

                <div class="space-y-1">
                  <label class="block text-xs font-medium text-gray-600">Service Name</label>
                  <input type="text" v-model="itemDefaults.serviceName" class="px-3 py-2 w-full text-sm rounded-lg border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                </div>

                <div class="space-y-1">
                  <label class="block text-xs font-medium text-gray-600">Service Code</label>
                  <input type="text" v-model="itemDefaults.serviceCode" class="px-3 py-2 w-full text-sm rounded-lg border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                </div>

                <div class="space-y-1">
                  <label class="block text-xs font-medium text-gray-600">Qty</label>
                  <input type="number" min="1" v-model="itemDefaults.qty" class="px-3 py-2 w-full text-sm rounded-lg border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                </div>

                <div class="space-y-1">
                  <label class="block text-xs font-medium text-gray-600">Record Number</label>
                  <input type="text" v-model="itemDefaults.recordNumber" class="px-3 py-2 w-full text-sm rounded-lg border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                </div>

                <div class="space-y-1">
                  <label class="block text-xs font-medium text-gray-600">Item Type</label>
                  <input type="text" v-model="itemDefaults.itemType" class="px-3 py-2 w-full text-sm rounded-lg border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500" placeholder="SERVICE" />
                </div>

                <!-- <div class="flex gap-2 items-center pt-6">
                  <input type="checkbox" v-model="itemDefaults.c_section" class="w-4 h-4" />
                  <span class="text-sm text-gray-700">C Section</span>
                </div> -->

                <div class="flex gap-2 items-center">
                  <input type="checkbox" v-model="itemDefaults.deleted" class="w-4 h-4" />
                  <span class="text-sm text-gray-700">Item Deleted</span>
                </div>
              </div>
            </div>

            <div class="pt-2 space-y-1">
              <label class="block text-xs font-medium text-gray-600">Attachments</label>
              <input type="file" multiple @change="handleFilesChange" />
              <div v-if="attachments.length" class="text-xs text-gray-500">
                {{ attachments.length }} file(s) selected
              </div>
            </div>
          </div>

          <div>
            <div v-if="loading" class="py-4 text-sm text-gray-500">Loading packages...</div>

            <div v-else class="space-y-3">
              <div
                v-for="pkg in packages"
                :key="pkg.packageUuid"
                class="flex gap-3 items-center p-3 rounded-lg border border-gray-200"
              >
                <input
                  type="checkbox"
                  :value="pkg.packageUuid"
                  v-model="selectedPackageUuids"
                  class="w-4 h-4"
                />

                <div class="flex-1 min-w-0">
                  <div class="text-sm font-semibold text-gray-800 truncate">
                    {{ pkg.packageName }}
                    <span class="text-gray-500">({{ pkg.packageCode }})</span>
                  </div>
                  <div class="text-xs text-gray-500">
                    Limit: {{ Number(pkg.sumAssured || 0).toLocaleString() }} | Used: {{ Number(pkg.used || 0).toLocaleString() }}
                  </div>
                </div>

                <div class="w-40">
                  <input
                    v-if="selectedPackageUuids.includes(pkg.packageUuid)"
                    type="number"
                    v-model="packagePrices[pkg.packageUuid]"
                    class="px-3 py-2 w-full text-sm rounded-lg border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                    placeholder="Total price"
                  />
                </div>
              </div>

              <div v-if="!packages.length" class="py-4 text-sm text-gray-500">
                No packages found.
              </div>
            </div>
          </div>

          <div class="flex gap-3 justify-end pt-4 border-t">
            <Button type="button" @click="closeModal" class="p-2 bg-white border border-primary">
              Cancel
            </Button>
            <Button type="primary" html-type="submit" class="p-2 pt-4 text-white bg-primary" :pending="req.pending.value">
              Submit
            </Button>
          </div>
        </Form>
      </div>
    </NewFormParent>
  </ModalParent>
</template>
