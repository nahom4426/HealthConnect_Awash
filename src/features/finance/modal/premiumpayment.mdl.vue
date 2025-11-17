<script setup lang="ts">
import { computed, reactive, toRefs, watch } from 'vue'

const props = defineProps<{
  open: boolean
  requestedPremium?: number
  onClose?: () => void
  onPay?: (payload: {
    receiptNumber: string
    receiptDate: string
    requestedPremium: number
    revenueStamp: number
    withHoldingTax: number
    netPremium: number
  }) => void
}>()

const WITHHOLDING_TAX_RATE = 0.02; // 2% withholding tax

const num = Number(props.requestedPremium || 0)
const state = reactive({
  receiptNumber: '',
  receiptDate: '',
  requestedPremium: num,
  revenueStamp: 0,
  withHoldingTax: num * 2/100,
  calculateTax: true, // Flag to control if tax should be auto-calculated
  
  // Getters and setters to ensure proper number conversion
  get withHoldingTaxValue() {
    return this.withHoldingTax;
  },
  set withHoldingTaxValue(value) {
    this.withHoldingTax = Number(value) || 0;
  }
})

// Calculate withholding tax when requested premium changes
watch(() => props.requestedPremium, (v) => {
  const premium = Number(v || 0);
  state.requestedPremium = premium;
  
  // Auto-calculate withholding tax if calculateTax is true
  if (state.calculateTax) {
    state.withHoldingTax = parseFloat((premium * WITHHOLDING_TAX_RATE).toFixed(2));
  }
});

// Update withholding tax calculation when manually changed
watch(() => state.withHoldingTax, (newVal, oldVal) => {
  // If user manually changes the tax, disable auto-calculation
  if (newVal !== oldVal && state.calculateTax) {
    state.calculateTax = false;
  }
});

const netPremium = computed(() => {
  const req = Number(state.requestedPremium || 0)
  const rs = Number(state.revenueStamp || 0)
  const wht = Number(state.withHoldingTax || 0)
  // Net premium should be: requested premium + revenue stamp - withholding tax
  return Math.max(0, req + rs - wht)
})

function close() {
  props.onClose && props.onClose()
}

function pay() {
  if (!state.receiptDate) return
  props.onPay && props.onPay({
    receiptNumber: state.receiptNumber,
    receiptDate: state.receiptDate,
    requestedPremium: Number(state.requestedPremium || 0),
    revenueStamp: Number(state.revenueStamp || 0),
    withHoldingTax: Number(state.withHoldingTax || 0),
    netPremium: Number(netPremium.value || 0),
  })
}
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center">
    <div class="absolute inset-0 bg-black/40" @click="close" />
    <div class="relative bg-white rounded-lg shadow-xl w-full max-w-xl p-4">
      <div class="flex items-center justify-between border-b pb-2 mb-3">
        <h3 class="text-lg font-semibold">Premium Payment</h3>
        <button class="text-gray-500 hover:text-black" @click.prevent="close">✕</button>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div class="flex flex-col gap-1">
          <label class="text-sm">Receipt Number</label>
          <input v-model="state.receiptNumber" class="border rounded px-3 py-2" placeholder="Enter receipt number" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Receipt Date</label>
          <input v-model="state.receiptDate" type="date" class="border rounded px-3 py-2" required />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Requested Premium</label>
          <input v-model.number="state.requestedPremium" type="number" class="border rounded px-3 py-2 bg-gray-100" disabled />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Revenue Stamp</label>
          <input v-model.number="state.revenueStamp" type="number" class="border rounded px-3 py-2" />
        </div>
        <div class="flex flex-col gap-1">
          <div class="flex items-center justify-between">
            <label class="text-sm">Withholding Tax ({{ WITHHOLDING_TAX_RATE * 100 }}%)</label>
            <button v-if="!state.calculateTax" 
                    @click="state.calculateTax = true" 
                    class="text-xs text-blue-600 hover:underline"
                    type="button">
              Auto-calculate
            </button>
          </div>
          <input 
            :value="state.withHoldingTax"
            @input="(e) => { 
              const value = parseFloat(e.target.value) || 0;
              state.withHoldingTax = value;
              state.calculateTax = false;
            }"
            type="number" 
            step="0.01"
            min="0"
            class="border rounded px-3 py-2" 
            :class="{'bg-gray-100': state.calculateTax}"
            :disabled="state.calculateTax"
          />
        </div>
        <div class="flex flex-col gap-1 col-span-2">
          <label class="text-sm">Net Premium</label>
          <input :value="netPremium" class="border rounded px-3 py-2 bg-gray-100" disabled />
        </div>
      </div>
      <div class="mt-4 flex justify-end gap-2">
        <button class="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300" @click.prevent="close">Cancel</button>
        <button class="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-500 disabled:opacity-60" :disabled="!state.receiptDate" @click.prevent="pay">Pay</button>
      </div>
    </div>
  </div>
</template>
