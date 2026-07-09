<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useBrokerStore } from '../stores/brokerStore';
import { useCommissionStore } from '../stores/commissionStore';
import DefaultPage from '@/components/DefaultPage.vue';
import Table from '@/components/Table.vue';
import Button from '@/components/Button.vue';
import Input from '@/components/new_form_elements/Input.vue';
import Select from '@/components/new_form_elements/Select.vue';
import StatusBadge from '../components/StatusBadge.vue';
import { formatCurrency, formatDate } from '../api/utils';

const brokerStore = useBrokerStore();
const commissionStore = useCommissionStore();

const selectedBrokerId = ref('');
const showPaymentModal = ref(false);
const processing = ref(false);
const paymentError = ref('');
const paymentSuccess = ref('');

const paymentForm = ref({
  amount: '',
  description: '',
  paymentMethod: 'BANK_TRANSFER',
  referenceNumber: '',
});

onMounted(async () => {
  await brokerStore.fetchAllBrokers();
});

watch(selectedBrokerId, async (newVal) => {
  if (newVal) {
    paymentSuccess.value = '';
    paymentError.value = '';
    await Promise.all([
      commissionStore.fetchBalance(newVal),
      commissionStore.fetchTransactions(newVal),
      commissionStore.fetchPendingCommissions(newVal),
    ]);
  }
});

const brokerOptions = computed(() => {
  return brokerStore.brokers.map(b => ({
    value: b.stakeholderUuid,
    label: `${b.firstName} ${b.lastName} (${b.licenseNumber || 'No License'})`
  }));
});

const selectedBroker = computed(() => {
  return brokerStore.brokers.find(b => b.stakeholderUuid === selectedBrokerId.value) || null;
});

const transactions = computed(() => commissionStore.transactions || []);
const balance = computed(() => commissionStore.currentBalance || 0);
const pendingAmount = computed(() => commissionStore.pendingAmount || 0);

function openPaymentModal() {
  paymentForm.value = {
    amount: '',
    description: '',
    paymentMethod: 'BANK_TRANSFER',
    referenceNumber: '',
  };
  paymentError.value = '';
  showPaymentModal.value = true;
}

function closePaymentModal() {
  showPaymentModal.value = false;
}

async function processPayment() {
  if (!paymentForm.value.amount || parseFloat(paymentForm.value.amount) <= 0) {
    paymentError.value = 'Please enter a valid payment amount.';
    return;
  }
  if (parseFloat(paymentForm.value.amount) > balance.value) {
    paymentError.value = 'Payment amount cannot exceed the current balance.';
    return;
  }

  processing.value = true;
  paymentError.value = '';
  try {
    await commissionStore.processPayment(selectedBrokerId.value, {
      amount: parseFloat(paymentForm.value.amount),
      description: paymentForm.value.description,
      paymentMethod: paymentForm.value.paymentMethod,
      referenceNumber: paymentForm.value.referenceNumber,
    });
    paymentSuccess.value = `Payment of ${formatCurrency(paymentForm.value.amount)} processed successfully.`;
    closePaymentModal();
  } catch (err) {
    paymentError.value = commissionStore.error || 'Failed to process payment.';
  } finally {
    processing.value = false;
  }
}
</script>

<template>
  <DefaultPage :hideSearch="true">

    <!-- Header Info -->
    <template #first>
      <div class="flex items-center gap-2">
        <div class="p-2 rounded-lg bg-indigo-50 text-indigo-600">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <div>
          <p class="text-sm font-semibold text-gray-700">Payment Processing</p>
          <p class="text-xs text-gray-400">Process broker commission payouts</p>
        </div>
      </div>
    </template>

    <!-- Broker Selector -->
    <template #header>
      <div class="w-72">
        <Select
          name="brokerSelect"
          :obj="true"
          :options="brokerOptions"
          :modelValue="selectedBrokerId"
          @update:modelValue="v => selectedBrokerId = v"
          :attributes="{ placeholder: 'Select a broker...' }"
        />
      </div>
    </template>

    <!-- Main Content -->
    <template #default>

      <!-- Empty State -->
      <div v-if="!selectedBrokerId" class="flex flex-col items-center justify-center py-20 text-gray-400">
        <svg class="w-16 h-16 mb-4 stroke-gray-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <p class="text-base font-medium text-gray-500">No broker selected</p>
        <p class="text-sm text-gray-400 mt-1">Please select a broker above to process payments.</p>
      </div>

      <!-- Broker Payment View -->
      <div v-else class="flex flex-col gap-5 h-full">

        <!-- Success Alert -->
        <div v-if="paymentSuccess" class="px-4 py-3 text-sm text-green-700 bg-green-50 rounded-xl border border-green-200 flex items-center gap-2">
          <svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
          {{ paymentSuccess }}
        </div>

        <!-- Balance Cards -->
        <div class="grid grid-cols-3 gap-4">
          <div class="bg-white rounded-xl shadow-xs border border-gray-100 p-5 flex flex-col items-center text-center">
            <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Available Balance</span>
            <span class="text-3xl font-bold text-gray-900">{{ formatCurrency(balance) }}</span>
          </div>
          <div class="bg-white rounded-xl shadow-xs border border-gray-100 p-5 flex flex-col items-center text-center">
            <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Pending Commissions</span>
            <span class="text-3xl font-bold text-amber-600">{{ formatCurrency(pendingAmount) }}</span>
          </div>
          <div class="bg-white rounded-xl shadow-xs border border-gray-100 p-5 flex flex-col items-center text-center">
            <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Total Paid (YTD)</span>
            <span class="text-3xl font-bold text-primary">{{ formatCurrency(commissionStore.paidAmount) }}</span>
          </div>
        </div>

        <!-- Broker Info + Pay Button -->
        <div class="flex items-center justify-between bg-white rounded-xl shadow-xs border border-gray-100 px-5 py-4">
          <div class="flex items-center gap-4" v-if="selectedBroker">
            <div class="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
              {{ selectedBroker.firstName?.[0] }}{{ selectedBroker.lastName?.[0] }}
            </div>
            <div>
              <div class="font-semibold text-gray-900">{{ selectedBroker.firstName }} {{ selectedBroker.lastName }}</div>
              <div class="text-xs text-gray-400 flex items-center gap-2">
                <span>{{ selectedBroker.email }}</span>
                <span>•</span>
                <span>{{ selectedBroker.licenseNumber || 'No License' }}</span>
              </div>
            </div>
          </div>
          <Button variant="primary" @click="openPaymentModal" :disabled="balance <= 0">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Process Payment
          </Button>
        </div>

        <!-- Payment History Table -->
        <div class="flex-1 bg-white rounded-xl shadow-xs border border-gray-100 overflow-hidden">
          <div class="px-5 py-4 border-b border-gray-100">
            <h3 class="text-sm font-semibold text-gray-700">Payment History</h3>
          </div>
          <Table
            :pending="commissionStore.loading"
            :headers="{
              head: ['Date', 'Transaction ID', 'Type', 'Description', 'Amount', 'Status'],
              row: ['createdAt', 'transactionUuid', 'type', 'description', 'amount', 'status'],
            }"
            :rows="transactions"
            :hideIndex="true"
            placeholder="No transactions recorded yet."
          >
            <template #createdAt="{ row }">
              <span class="text-sm text-gray-600">{{ formatDate(row.createdAt) }}</span>
            </template>
            <template #transactionUuid="{ row }">
              <span class="text-xs font-mono text-gray-400">{{ row.transactionUuid?.split('-')[0] }}...</span>
            </template>
            <template #type="{ row }">
              <span
                class="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase"
                :class="{
                  'bg-green-100 text-green-700': row.type === 'COMMISSION_EARNED',
                  'bg-red-100 text-red-700': row.type === 'PAYMENT_PROCESSED',
                  'bg-yellow-100 text-yellow-700': row.type === 'PENDING_APPROVAL',
                  'bg-gray-100 text-gray-600': !['COMMISSION_EARNED','PAYMENT_PROCESSED','PENDING_APPROVAL'].includes(row.type),
                }"
              >{{ row.type?.replace(/_/g, ' ') }}</span>
            </template>
            <template #description="{ row }">
              <span class="text-sm text-gray-700">{{ row.description || '—' }}</span>
            </template>
            <template #amount="{ row }">
              <span
                class="text-sm font-bold"
                :class="row.type === 'COMMISSION_EARNED' ? 'text-emerald-600' : 'text-gray-900'"
              >
                {{ row.type === 'COMMISSION_EARNED' ? '+' : '-' }}{{ formatCurrency(row.amount) }}
              </span>
            </template>
            <template #status="{ row }">
              <StatusBadge :status="row.status" />
            </template>
          </Table>
        </div>
      </div>
    </template>
  </DefaultPage>

  <!-- Payment Modal -->
  <Teleport to="body">
    <div v-if="showPaymentModal" class="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" @click.self="closePaymentModal">
      <div class="bg-white rounded-2xl w-full max-w-lg shadow-xl flex flex-col overflow-hidden">
        <!-- Modal Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div class="flex items-center gap-3">
            <div class="p-2 rounded-lg bg-primary/10 text-primary">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 class="text-base font-semibold text-gray-900">Process Payment</h2>
          </div>
          <button class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors" @click="closePaymentModal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Modal Body -->
        <div class="p-6 overflow-y-auto max-h-[calc(100vh-12rem)] flex flex-col gap-4">
          <!-- Broker Summary -->
          <div v-if="selectedBroker" class="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200">
            <div class="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
              {{ selectedBroker.firstName?.[0] }}{{ selectedBroker.lastName?.[0] }}
            </div>
            <div class="flex-1">
              <div class="font-medium text-gray-900 text-sm">{{ selectedBroker.firstName }} {{ selectedBroker.lastName }}</div>
              <div class="text-xs text-gray-400">Available: {{ formatCurrency(balance) }}</div>
            </div>
          </div>

          <div v-if="paymentError" class="px-4 py-2.5 text-sm text-red-700 bg-red-50 rounded-lg border border-red-200">
            {{ paymentError }}
          </div>

          <!-- Amount -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Payment Amount <span class="text-red-500">*</span></label>
            <div class="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30 transition-all">
              <span class="px-3 py-2.5 bg-gray-50 text-gray-500 font-medium border-r border-gray-200 text-sm">ETB</span>
              <input
                type="number"
                v-model="paymentForm.amount"
                class="flex-1 px-3 py-2.5 text-base font-semibold text-gray-900 border-none outline-none bg-transparent"
                placeholder="0.00"
                min="0"
                :max="balance"
                step="0.01"
              />
            </div>
          </div>

          <!-- Payment Method -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Payment Method</label>
            <Select
              name="paymentMethod"
              :obj="true"
              :options="[
                { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
                { value: 'CHECK', label: 'Check' },
                { value: 'CASH', label: 'Cash' },
              ]"
              :modelValue="paymentForm.paymentMethod"
              @update:modelValue="v => paymentForm.paymentMethod = v"
            />
          </div>

          <!-- Reference Number -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Reference Number</label>
            <Input
              v-model="paymentForm.referenceNumber"
              :attributes="{ placeholder: 'e.g. TXN-2024-001', name: 'referenceNumber' }"
            />
          </div>

          <!-- Description -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea
              v-model="paymentForm.description"
              class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-inherit resize-vertical min-h-[72px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
              placeholder="Payment notes..."
            ></textarea>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <Button variant="outline" @click="closePaymentModal">Cancel</Button>
          <Button variant="primary" @click="processPayment" :pending="processing">
            Process Payment
          </Button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
