<script setup>
import { computed, ref } from 'vue';
import Button from '@/components/Button.vue';
import { formatCurrency, secondDateFormat } from '@/utils/utils';
import { getAttachmentUrl } from '../../api/claimApi';

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
const providedDate = computed(() => secondDateFormat(props.row?.providedDate))

// 🔑 Loading state
const loadingAttachment = ref(false)

async function openAttachment() {
  try {
    loadingAttachment.value = true
    const id = props.row?.serviceProvidedUuid || props.row?.claimUuid
    if (!id) {
      alert("No attachment ID found")
      return
    }

    // ✅ Call API
    const res = await getAttachmentUrl(id)
    const url = res?.data?.url || res?.data
    if (url) {
      window.open(url, "_blank")
    } else {
      alert("No attachment found.")
    }
  } catch (err) {
    console.error("❌ Failed to load attachment", err)
    alert("Could not load attachment. Please try again.")
  } finally {
    loadingAttachment.value = false
  }
}

function goBack() {
  emit('back')
}
</script>

<template>
  <div class="p-6 space-y-8 bg-gray-50 min-h-screen">
    <!-- Header -->
    <div class="flex items-start justify-between bg-white shadow-sm rounded-xl p-5">
      <div>
        <h2 class="text-2xl font-bold text-gray-800">Service Provided Detail</h2>
        <p class="text-sm text-gray-500">Review the provided services and attachment.</p>
      </div>
      <div class="flex gap-2">
        <Button type="link" @click="goBack">Back</Button>
        <Button type="primary" @click="openAttachment" :disabled="loadingAttachment">
          <span v-if="loadingAttachment">Loading...</span>
          <span v-else>View Attachment</span>
        </Button>
      </div>
    </div>

    <!-- Info Grid -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="p-4 rounded-lg border bg-white shadow-sm">
        <p class="text-xs text-gray-500">Institution</p>
        <p class="text-sm font-medium text-gray-800">{{ props.row?.institutionName || '-' }}</p>
      </div>
      <div class="p-4 rounded-lg border bg-white shadow-sm">
        <p class="text-xs text-gray-500">Insured</p>
        <p class="text-sm font-medium text-gray-800">{{ props.row?.insuredName || props.row?.dependantName || '-' }}</p>
      </div>
      <div class="p-4 rounded-lg border bg-white shadow-sm">
        <p class="text-xs text-gray-500">Amount</p>
        <p class="text-sm font-semibold text-green-600">{{ formatCurrency(props.row?.amount) }}</p>
      </div>
      <div class="p-4 rounded-lg border bg-white shadow-sm">
        <p class="text-xs text-gray-500">Provided Date</p>
        <p class="text-sm font-medium text-gray-800">{{ providedDate }}</p>
      </div>
    </div>

    <!-- Items Table -->
    <div class="bg-white rounded-xl border shadow-sm overflow-hidden">
      <div class="px-5 py-4 border-b flex items-center justify-between">
        <h3 class="font-semibold text-gray-800">Provided Items</h3>
        <div class="text-sm text-gray-600">
          Total: <span class="font-bold text-gray-900">{{ formatCurrency(total) }}</span>
        </div>
      </div>
      <div class="overflow-auto">
        <table class="min-w-full text-sm">
          <thead class="bg-gray-100 text-gray-600 uppercase text-xs">
            <tr>
              <th class="px-4 py-3 text-left">#</th>
              <th class="px-4 py-3 text-left">Item ID</th>
              <th class="px-4 py-3 text-left">Code</th>
              <th class="px-4 py-3 text-left">Name</th>
              <th class="px-4 py-3 text-right">Qty</th>
              <th class="px-4 py-3 text-right">Unit Price</th>
              <th class="px-4 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="!items.length">
              <td :colspan="7" class="py-10 text-center text-gray-500">No items available</td>
            </tr>
            <tr
              v-for="(it, i) in items"
              :key="it.providedItemUuid || i"
              class="hover:bg-gray-50 transition"
            >
              <td class="px-4 py-3 text-gray-600">{{ i + 1 }}</td>
              <td class="px-4 py-3 text-gray-700">{{ it.itemId || '-' }}</td>
              <td class="px-4 py-3 text-gray-700">{{ it.itemCode || '-' }}</td>
              <td class="px-4 py-3 text-gray-700">{{ it.itemName || '-' }}</td>
              <td class="px-4 py-3 text-right text-gray-700">{{ it.quantity ?? '-' }}</td>
              <td class="px-4 py-3 text-right text-gray-700">{{ formatCurrency(it.unitPrice) }}</td>
              <td class="px-4 py-3 text-right font-semibold text-gray-900">{{ formatCurrency(it.totalPrice) }}</td>
            </tr>
          </tbody>
          <tfoot v-if="items.length" class="bg-gray-100">
            <tr>
              <td colspan="6" class="px-4 py-3 text-right text-sm text-gray-600">Total</td>
              <td class="px-4 py-3 text-right font-bold text-gray-900">{{ formatCurrency(total) }}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <!-- <div class="px-5 py-4 border-t flex items-center justify-end gap-2 bg-gray-50">
        <Button type="link" @click="goBack">Back</Button>
        <Button type="primary" @click="openAttachment" :disabled="loadingAttachment">
          <span v-if="loadingAttachment">Loading...</span>
          <span v-else>View Attachment</span>
        </Button>
      </div> -->
    </div>
  </div>
</template>
