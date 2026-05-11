<script setup>
import { ref, computed, watch, onMounted } from "vue";
import Button from "@/components/Button.vue";
import Table from "@/components/Table.vue";
import icons from "@/utils/icons";
import { formatCurrency, toasted } from "@/utils/utils";
import { useApiRequest } from "@/composables/useApiRequest";
import { getAttachmentUrl, updateServiceProvidedClaimStatus } from "../../api/claimApi";
import { useClaimByInstitutionBatch } from "../../store/claimByInstitutionBatchStore";
import { openModal } from "@customizer/modal-x";
import { getPackages } from "@/features/product_settings/api/coverageApi";
import { getAuthorization } from "@/features/authorization/api/authorizationApi";

const props = defineProps({
  row: { type: Object, default: null },         // full row (serviceProvidedUuid + claimUuid)
  items: { type: Array, default: () => [] },
  title: { type: String, default: "Provided Items" },
});

const emit = defineEmits(["close"]);

const localRow = ref(props.row);
const localItems = ref([...props.items]);

watch(() => props.row, (v) => (localRow.value = v), { immediate: true });
watch(() => props.items, (v) => (localItems.value = v ? [...v] : []), { immediate: true });

const total = computed(() =>
  localItems.value.reduce((s, it) => s + (Number(it.totalPrice) || 0), 0)
);

const packagesByUuid = ref({})
const loadingPackages = ref(false)

const showAuthorizationModal = ref(false)
const authorizationLoading = ref(false)
const authorizationDetails = ref(null)
const authorizationError = ref("")

const remark = ref("");
const canResubmit = ref(true);
const req = useApiRequest();
const rejectReq = useApiRequest();
const store = useClaimByInstitutionBatch();
const loadingAttachment = ref(false)

function openHistory() {
  const insuredUuid = localRow.value?.insuredPersonUuid || localRow.value?.insuredUuid || localRow.value?.insuredPersonId || null;
  const contractUuid = localRow.value?.contractUuid || localRow.value?.payerInstitutionContractUuid || null;
  const institutionUuid = localRow.value?.institutionUuid || null;

  openModal('InsuredHistory', {
    insuredUuid,
    contractUuid,
    institutionUuid,
  });
}

async function openAttachment() {
  try {
    loadingAttachment.value = true;
    const id = props.row?.serviceProvidedUuid || props.row?.claimUuid;
    if (!id) {
      toasted(false,"", "No attachment ID found");
      return;
    }

    // Call API to get attachments data
    const res = await getAttachmentUrl(id);
    const attachments = Array.isArray(res?.data) ? res.data : [res?.data?.url || res?.data];
    
    if (!attachments.length || !attachments[0]) {
      toasted(false,"", "No attachments found.");
      return;
    }

    // Open the attachments in a modal
    openModal('AttachmentViewer', { 
      attachments: attachments,
      title: 'Service Provided Attachments'
    });
    
  } catch (err) {
    console.error("❌ Failed to load attachments", err);
    toasted(false,"", "Could not load attachments. Please try again.");
  } finally {
    loadingAttachment.value = false;
  }
}
function detectType(it) {
  if (!it) return "Service";
  if (it.itemType) {
    const t = String(it.itemType).toUpperCase();
    if (t === "DRUG" || t === "MEDICINE") return "Drug";
    if (t === "SERVICE") return "Service";
  }
  if (it.type) return it.type;
  const id = (it.itemId || "").toString().toUpperCase();
  if (/^(DR|RX|MED)/.test(id)) return "Drug";
  if (/^X-?R/.test(id)) return "Service";
  return "Service";
}

function getPackageName(packageUuid) {
  if (!packageUuid) return "-";
  return packagesByUuid.value?.[packageUuid]?.packageName || "-";
}

function getCoverageLabel(it) {
  if (!it) return "-";
  if (it.authorizationUuid) return "AUTHORIZED";
  const ex = Number(it.excessUsed);
  if (!Number.isNaN(ex) && ex > 0) return "EXCESS";
  return "-";
}

async function loadPackages() {
  try {
    loadingPackages.value = true;
    const res = await getPackages({ page: 0, size: 1000 });

    let list = [];
    if (Array.isArray(res)) {
      list = res;
    } else if (Array.isArray(res?.data)) {
      list = res.data;
    } else if (Array.isArray(res?.data?.content)) {
      list = res.data.content;
    } else if (Array.isArray(res?.content)) {
      list = res.content;
    }

    const map = {};
    for (const p of list) {
      const uuid = p?.packageUuid || p?.uuid;
      if (uuid) map[uuid] = p;
    }
    packagesByUuid.value = map;
  } catch (e) {
    console.error("❌ Failed to load packages", e);
  } finally {
    loadingPackages.value = false;
  }
}

async function openAuthorizationDetails(authorizationUuid) {
  if (!authorizationUuid) return;
  try {
    authorizationError.value = "";
    authorizationDetails.value = null;
    authorizationLoading.value = true;
    showAuthorizationModal.value = true;

    const res = await getAuthorization(authorizationUuid);
    authorizationDetails.value = res?.data ?? res;
  } catch (e) {
    console.error("❌ Failed to load authorization details", e);
    authorizationError.value = e?.message || "Failed to load authorization details";
  } finally {
    authorizationLoading.value = false;
  }
}

onMounted(() => {
  loadPackages();
});

async function performAction(action) {
  if (!localRow.value) return;
  const claimId = localRow.value.claimUuid || localRow.value?.claimUuid;
  const body = [localRow.value.serviceProvidedUuid];
  const remarkVal = remark.value && remark.value.trim() ? remark.value.trim() : undefined;

  // Use appropriate request instance based on action
  const apiRequest = action === 'REJECTED' ? rejectReq : req;

  apiRequest.send(
    () =>
      updateServiceProvidedClaimStatus(
        claimId,
        action,
        body,
        remarkVal,
        action === 'REJECTED' ? canResubmit.value : undefined
      ),
    (res) => {
      if (res && res.status >= 200 && res.status < 300) {
        // Update store with new status
        let updated;
        if (action === 'REJECTED') {
          // Remove rejected items from table
          updated = (store.claims || []).filter((claim) => !body.includes(claim.serviceProvidedUuid));
        } else {
          // Update status for processed items
          updated = (store.claims || []).map((claim) => {
            if (body.includes(claim.serviceProvidedUuid)) {
              return { ...claim, serviceClaimStatus: action };
            }
            return claim;
          });
        }
        if (store.set) {
          store.set(updated);
        } else {
          // fallback when set is not available
          store.claims = updated;
        }
        emit("close");
      }
    }
  );
}
</script>

<template>
  <div class="flex fixed inset-0 z-50 justify-center items-center p-4 bg-black/45">
    <div class="overflow-hidden w-full max-w-5xl bg-white rounded-lg shadow-xl">
      <div class="flex gap-4 justify-between items-start px-6 py-4 border-b">
        <div class="flex gap-3 items-center">
          <div class="flex justify-center items-center w-12 h-12 text-white bg-gradient-to-br rounded-md from-primary to-secondary">
            <span v-html="icons.box" class="w-6 h-6"></span>
          </div>
          <div>
            <h3 class="text-lg font-semibold">{{ title }}</h3>
            <p class="text-sm text-gray-500">
              {{ localItems.length }} item{{ localItems.length !== 1 ? "s" : "" }} •
              total: <span class="font-medium">{{ formatCurrency(total) }}</span>
            </p>
            <!-- <p class="mt-1 text-xs text-gray-500">ServiceProvided UUID: {{ localRow?.serviceProvidedUuid }}</p> -->
          </div>
        </div>

        <div class="flex gap-2 items-center">
          <Button size="sm" type="link" @click="$emit('close')">Close</Button>
        </div>
      </div>

      <div class="p-4">
        <div class="overflow-auto">
          <!-- <th class="px-4 py-3 text-left">Authorization</th> -->
          <Table
            :pending="false"
            :showPagination="false"
            class="w-full"
            :headers="{
              head: [
                'Item ID',
                'Code',
                'Name',
                'Type',
                'Package',
                'Coverage',
                'Authorization',
                'Excess Used',
                'Qty',
                'Unit Price',
                'Total',
                'Actions',
              ],
              row: [
                'itemId',
                'itemCode',
                'itemName',
                'type',
                'packageUuid',
                'coverage',
                'authorizationUuid',
                'excessUsed',
                'quantity',
                'unitPrice',
                'totalPrice',
                'actions',
              ],
            }"
            :rows="localItems"
          >
            <template #placeholder>
              <div class="py-8 text-center text-gray-500">
                <div v-html="icons.no_data" class="mx-auto mb-3 w-16 h-16"></div>
                No items available
              </div>
            </template>

            <template #type="{ row }">
              <span
                class="inline-block px-2 py-0.5 text-xs font-medium rounded-full"
                :class="detectType(row) === 'Drug' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'"
              >
                {{ detectType(row) }}
              </span>
            </template>

            <template #packageUuid="{ row }">
              <span v-if="loadingPackages" class="text-xs text-gray-400">Loading...</span>
              <span v-else>{{ getPackageName(row.packageUuid) }}</span>
            </template>

            <template #coverage="{ row }">
              <span
                class="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full"
                :class="getCoverageLabel(row) === 'AUTHORIZED' ? 'bg-green-100 text-green-700' : (getCoverageLabel(row) === 'EXCESS' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600')"
              >
                {{ getCoverageLabel(row) }}
              </span>
            </template>

            <template #authorizationUuid="{ row }">
              <span class="font-mono text-xs">{{ row.authorizationUuid || '-' }}</span>
            </template>

            <template #excessUsed="{ row }">
              <span class="block text-right">{{ formatCurrency(row.excessUsed) }}</span>
            </template>

            <template #unitPrice="{ row }">
              <span class="block text-right">{{ formatCurrency(row.unitPrice) }}</span>
            </template>

            <template #totalPrice="{ row }">
              <span class="block font-medium text-right">{{ formatCurrency(row.totalPrice) }}</span>
            </template>

            <template #actions="{ row }">
              <div class="flex justify-end">
                <Button
                  v-if="row.authorizationUuid"
                  type="link"
                  class="!text-blue-600 hover:!text-blue-800"
                  @click.stop="openAuthorizationDetails(row.authorizationUuid)"
                >
                  Authorization Details
                </Button>
                <span v-else class="text-xs text-gray-400">-</span>
              </div>
            </template>
          </Table>

          <div v-if="localItems.length" class="flex justify-end px-4 py-3 mt-2 text-sm bg-gray-50 rounded-lg border border-gray-100">
            <div class="text-gray-600">Total</div>
            <div class="ml-8 font-semibold">{{ formatCurrency(total) }}</div>
          </div>
        </div>

        <div class="mt-4">
          <label class="block mb-2 text-sm text-gray-600">Remark (optional)</label>
          <textarea v-model="remark" rows="2" class="p-2 w-full text-sm rounded border" placeholder="Add a remark (optional)"></textarea>
        </div>

        <div class="mt-4">
          <label class="flex gap-3 items-center text-sm text-gray-700">
            <input v-model="canResubmit" type="checkbox" class="w-4 h-4" />
            <span>Allow resubmission after rejection</span>
          </label>
        </div>
      </div>

      <div class="flex justify-between items-center px-6 py-4 bg-gray-50 border-t">
         <div class="flex gap-3 items-center">
           <div class="text-sm text-gray-600">Items: <span class="font-medium">{{ localItems.length }}</span></div>
              <Button
                type="primary"
                class="!bg-purple-600 hover:!bg-purple-700"
                @click="openHistory"
              >
                History
              </Button>
              <Button type="primary" @click="openAttachment" :disabled="loadingAttachment">
          <span v-if="loadingAttachment">Loading...</span>
          <span v-else>View Attachment</span>
        </Button>
        </div>
        <div class="flex gap-3 items-center">
          <Button type="danger" @click="performAction('REJECTION_REQUESTED')" :pending="rejectReq.pending.value">Reject</Button>
          <Button type="primary" @click="performAction('PROCESSED')" :pending="req.pending.value">Process</Button>
        </div>
      </div>
    </div>
  </div>

  <div v-if="showAuthorizationModal" class="flex fixed inset-0 z-50 justify-center items-center p-4 bg-black/45">
    <div class="overflow-hidden w-full max-w-2xl bg-white rounded-lg shadow-xl">
      <div class="flex justify-between items-start px-6 py-4 border-b">
        <div>
          <h3 class="text-lg font-semibold text-gray-800">Authorization Details</h3>
          <p class="text-sm text-gray-500">View authorization information for this item.</p>
        </div>
        <Button size="sm" type="link" @click="showAuthorizationModal = false">Close</Button>
      </div>

      <div class="p-6">
        <div v-if="authorizationLoading" class="text-sm text-gray-600">Loading...</div>
        <div v-else-if="authorizationError" class="text-sm text-red-600">{{ authorizationError }}</div>
        <div v-else class="text-sm">
          <pre class="overflow-auto p-4 text-xs bg-gray-50 rounded border">{{ authorizationDetails }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.table-badge { display: inline-block; padding: .125rem .5rem; border-radius: 9999px; font-size: .75rem; }
</style>