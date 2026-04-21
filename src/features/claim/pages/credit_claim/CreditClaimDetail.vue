<script setup>
import { computed, ref, onMounted } from 'vue';
import Button from '@/components/Button.vue';
import { formatCurrency, secondDateFormat, toasted } from '@/utils/utils';
import { getAttachmentUrl } from '../../api/claimApi';
import { openModal } from '@customizer/modal-x';
import { getPackages } from '@/features/product_settings/api/coverageApi';
import { getAuthorization } from '@/features/authorization/api/authorizationApi';
// import AttachmentViewer from '../../components/modals/AttachmentViewer.mdl.vue';

// ✅ Accept row as a prop
const props = defineProps({
  row: { type: Object, required: true }
})

// ✅ Emit back event to parent
const emit = defineEmits(['back'])

const items = computed(() => props.row?.providedItemResponses || [])
const total = computed(() =>
  (items.value || []).reduce((s, it) => s + (Number(it.totalPrice) || 0), 0)
)
const totalExtraAmount = computed(() =>
  (items.value || []).reduce((s, it) => s + (Number(it.extraAmount) || 0), 0)
)
const hasCoverageColumn = computed(() =>
  (items.value || []).some((it) => {
    if (it?.authorizationUuid) return true
    const ex = Number(it?.excessUsed)
    return Number.isFinite(ex) && ex > 0
  })
)
const hasAuthorizationColumn = computed(() =>
  (items.value || []).some((it) => Boolean(it?.authorizationUuid))
)
const itemsTableColspan = computed(() =>
  10 + (hasCoverageColumn.value ? 1 : 0) + (hasAuthorizationColumn.value ? 1 : 0)
)
const providedDate = computed(() => secondDateFormat(props.row?.providedDate))

const packagesByUuid = ref({})
const loadingPackages = ref(false)

const showAuthorizationModal = ref(false)
const authorizationLoading = ref(false)
const authorizationDetails = ref(null)
const authorizationError = ref('')

function getPackageName(packageUuid) {
  if (!packageUuid) return '-'
  return packagesByUuid.value?.[packageUuid]?.packageName || '-'
}

function getCoverageLabel(it) {
  if (!it) return '-'
  if (it.authorizationUuid) return 'AUTHORIZED'
  const ex = Number(it.excessUsed)
  if (!Number.isNaN(ex) && ex > 0) return 'EXCESS'
  return '-'
}

async function loadPackages() {
  try {
    loadingPackages.value = true
    const res = await getPackages({ page: 0, size: 1000 })

    let list = []
    if (Array.isArray(res)) {
      list = res
    } else if (Array.isArray(res?.data)) {
      list = res.data
    } else if (Array.isArray(res?.data?.content)) {
      list = res.data.content
    } else if (Array.isArray(res?.content)) {
      list = res.content
    }

    const map = {}
    for (const p of list) {
      const uuid = p?.packageUuid || p?.uuid
      if (uuid) map[uuid] = p
    }
    packagesByUuid.value = map
  } catch (e) {
    console.error('❌ Failed to load packages', e)
  } finally {
    loadingPackages.value = false
  }
}

async function openAuthorizationDetails(authorizationUuid) {
  if (!authorizationUuid) return
  try {
    authorizationError.value = ''
    authorizationDetails.value = null
    authorizationLoading.value = true
    showAuthorizationModal.value = true

    const res = await getAuthorization(authorizationUuid)
    authorizationDetails.value = res?.data ?? res
  } catch (e) {
    console.error('❌ Failed to load authorization details', e)
    authorizationError.value = e?.message || 'Failed to load authorization details'
  } finally {
    authorizationLoading.value = false
  }
}

onMounted(() => {
  loadPackages()
})

// 🔑 Loading state
const loadingAttachment = ref(false)

function openHistory() {
  const insuredUuid = props.row?.insuredPersonUuid || props.row?.insuredUuid || null
  const dependantUuid = props.row?.dependantUuid || null
  const personType = props.row?.personType || null
  const contractUuid = props.row?.contractUuid || props.row?.payerInstitutionContractUuid || null
  const institutionUuid = props.row?.institutionUuid || null

  openModal('InsuredHistory', {
    insuredUuid: personType === 'DEPENDENT' && dependantUuid ? null : insuredUuid,
    dependantUuid: personType === 'DEPENDENT' && dependantUuid ? dependantUuid : null,
    contractUuid,
    institutionUuid,
  })
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

function goBack() {
  emit('back')
}
</script>

<template>
  <div class="p-6 space-y-8 min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="flex justify-between items-start p-5 bg-white rounded-xl shadow-sm">
      <div>
        <h2 class="text-2xl font-bold text-gray-800">Service Provided Detail</h2>
        <p class="text-sm text-gray-500">Review the provided services and attachment.</p>
      </div>
      <div class="flex gap-2">
        <Button type="link" @click="goBack">Back</Button>
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
    </div>

    <!-- Info Grid -->
    <div class="grid grid-cols-1 gap-4 md:grid-cols-4">
      <div class="p-4 bg-white rounded-lg border shadow-sm">
        <p class="text-xs text-gray-500">Institution</p>
        <p class="text-sm font-medium text-gray-800">{{ props.row?.institutionName || '-' }}</p>
      </div>
      <div class="p-4 bg-white rounded-lg border shadow-sm">
        <p class="text-xs text-gray-500">Insured</p>
        <p class="text-sm font-medium text-gray-800">{{ props.row?.insuredName || props.row?.dependantName || '-' }}</p>
      </div>
      <div class="p-4 bg-white rounded-lg border shadow-sm">
        <p class="text-xs text-gray-500">Amount</p>
        <div class="space-y-1">
          <p class="text-sm font-semibold text-green-600">{{ formatCurrency(props.row?.amount) }}</p>
          <div v-if="totalExtraAmount" class="text-xs text-red-600">
            Extra Amount: <span class="font-semibold">{{ formatCurrency(totalExtraAmount) }}</span>
          </div>
        </div>
      </div>
      <div class="p-4 bg-white rounded-lg border shadow-sm">
        <p class="text-xs text-gray-500">Provided Date</p>
        <p class="text-sm font-medium text-gray-800">{{ providedDate }}</p>
      </div>
    </div>

    <!-- Items Table -->
    <div class="overflow-hidden bg-white rounded-xl border shadow-sm">
      <div class="flex justify-between items-center px-5 py-4 border-b">
        <h3 class="font-semibold text-gray-800">Provided Items</h3>
        <div class="text-sm text-gray-600">
          Total: <span class="font-bold text-gray-900">{{ formatCurrency(total) }}</span>
        </div>
      </div>
      <div class="overflow-auto">
        <table class="min-w-full text-sm">
          <thead class="text-xs text-gray-600 uppercase bg-gray-100">
            <tr>
              <th class="px-4 py-3 text-left">#</th>
              <th class="px-4 py-3 text-left">Item ID</th>
              <th class="px-4 py-3 text-left">Code</th>
              <th class="px-4 py-3 text-left">Name</th>
              <th class="px-4 py-3 text-left">Package</th>
              <th v-if="hasCoverageColumn" class="px-4 py-3 text-left">Coverage</th>
              <th v-if="hasAuthorizationColumn" class="px-4 py-3 text-left">Authorization</th>
              <th class="px-4 py-3 text-right">Excess Used</th>
              <th class="px-4 py-3 text-right">Qty</th>
              <th class="px-4 py-3 text-right">Unit Price</th>
              <th class="px-4 py-3 text-right">Total</th>
              <th class="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="!items.length">
              <td :colspan="itemsTableColspan" class="py-10 text-center text-gray-500">No items available</td>
            </tr>
            <tr
              v-for="(it, i) in items"
              :key="it.providedItemUuid || i"
              class="transition hover:bg-gray-50"
            >
              <td class="px-4 py-3 text-gray-600">{{ i + 1 }}</td>
              <td class="px-4 py-3 text-gray-700">{{ it.itemId || '-' }}</td>
              <td class="px-4 py-3 text-gray-700">{{ it.itemCode || '-' }}</td>
              <td class="px-4 py-3 text-gray-700">{{ it.itemName || '-' }}</td>
              <td class="px-4 py-3 text-gray-700">
                <span v-if="loadingPackages" class="text-xs text-gray-400">Loading...</span>
                <span v-else>{{ getPackageName(it.packageUuid) }}</span>
              </td>
              <td v-if="hasCoverageColumn" class="px-4 py-3 text-gray-700">
                <span
                  class="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full"
                  :class="getCoverageLabel(it) === 'AUTHORIZED' ? 'bg-green-100 text-green-700' : (getCoverageLabel(it) === 'EXCESS' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600')"
                >
                  {{ getCoverageLabel(it) }}
                </span>
              </td>
              <td v-if="hasAuthorizationColumn" class="px-4 py-3 text-gray-700">
                <span class="font-mono text-xs">{{ it.authorizationUuid || '-' }}</span>
              </td>
              <td class="px-4 py-3 text-right text-gray-700">{{ formatCurrency(it.excessUsed) }}</td>
              <td class="px-4 py-3 text-right text-gray-700">{{ it.quantity ?? '-' }}</td>
              <td class="px-4 py-3 text-right text-gray-700">{{ formatCurrency(it.unitPrice) }}</td>
              <td class="px-4 py-3 text-right">
                <div class="font-semibold text-gray-900">{{ formatCurrency(it.totalPrice) }}</div>
                <div v-if="Number(it.extraAmount)" class="text-xs text-red-600">+{{ formatCurrency(it.extraAmount) }}</div>
              </td>
              <td class="px-4 py-3 text-right">
                <Button
                  v-if="it.authorizationUuid"
                  type="link"
                  class="!text-blue-600 hover:!text-blue-800"
                  @click.stop="openAuthorizationDetails(it.authorizationUuid)"
                >
                  Authorization Details
                </Button>
                <span v-else class="text-xs text-gray-400">-</span>
              </td>
            </tr>
          </tbody>
          <tfoot v-if="items.length" class="bg-gray-100">
            <tr>
              <td :colspan="itemsTableColspan - 2" class="px-4 py-3 text-sm text-right text-gray-600">Total</td>
              <td class="px-4 py-3 font-bold text-right text-gray-900">{{ formatCurrency(total) }}</td>
              <td class="px-4 py-3"></td>
            </tr>
          </tfoot>
        </table>
      </div>
      <!-- <div class="flex gap-2 justify-end items-center px-5 py-4 bg-gray-50 border-t">
        <Button type="link" @click="goBack">Back</Button>
        <Button type="primary" @click="openAttachment" :disabled="loadingAttachment">
          <span v-if="loadingAttachment">Loading...</span>
          <span v-else>View Attachment</span>
        </Button>
      </div> -->
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
  </div>
</template>
