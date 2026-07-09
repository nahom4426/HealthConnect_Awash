<script setup>
import { ref, onMounted, computed } from 'vue';
import { useToast } from 'vue-toastification';
import { useCommissionStore } from '../stores/commissionStore';
import { useBrokerStore } from '../stores/brokerStore';
import DefaultPage from '@/components/DefaultPage.vue';
import Table from '@/components/Table.vue';
import Button from '@/components/Button.vue';
import Select from '@/components/new_form_elements/Select.vue';
import CommissionDataProvider from '../components/CommissionDataProvider.vue';
import CommissionStatusRow from '../components/CommissionStatusRow.vue';

const toast = useToast();
const commissionStore = useCommissionStore();
const brokerStore = useBrokerStore();

const selectedBrokerId = ref('');
const activeTab = ref('pending'); // 'pending' or 'transactions'
const refetch = ref(0);

// Status Modal State
const showStatusModal = ref(false);
const selectedCommission = ref(null);
const chosenStatus = ref('PENDING');
const updatingStatus = ref(false);

// Settle Modal State
const showSettleModal = ref(false);
const settling = ref(false);
const settleForm = ref({
  paymentType: 'CHECK',
  checkNumber: '',
  receiptNumber: '',
  notes: ''
});

// Payment confirm/cancel
const confirmingPayment = ref(null);
const cancellingPayment = ref(null);

function paymentStatusClass(status) {
  const map = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    REQUESTED: 'bg-blue-100 text-blue-700',
    PROCESSING: 'bg-indigo-100 text-indigo-700',
    PAYED: 'bg-emerald-100 text-emerald-700',
    REVERSED: 'bg-orange-100 text-orange-700',
    CANCELED: 'bg-red-100 text-red-700',
  };
  return map[status] || 'bg-gray-100 text-gray-600';
}

onMounted(async () => {
  await brokerStore.fetchAllBrokers();
});

const brokerOptions = computed(() => {
  return brokerStore.brokers.map(b => ({
    value: b.stakeholderUuid,
    label: `${b.firstName} ${b.lastName} (${b.licenseNumber})`
  }));
});

const hasApprovedCommissions = computed(() => {
  const pending = commissionStore.pendingCommissions;
  const txns = commissionStore.transactions;
  const inPending = Array.isArray(pending) && pending.some(c => (c.transactionStatus || c.status) === 'APPROVED');
  const inTxns = Array.isArray(txns) && txns.some(t => (t.transactionStatus || t.status) === 'APPROVED');
  return inPending || inTxns;
});

function formatCurrency(amount) {
  if (!amount) return 'ETB 0.00';
  return `ETB ${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Status Handlers
function openStatusModal(row) {
  selectedCommission.value = row;
  chosenStatus.value = row.transactionStatus || row.status || 'PENDING';
  showStatusModal.value = true;
}

function closeStatusModal() {
  showStatusModal.value = false;
  selectedCommission.value = null;
}

async function saveStatusChange() {
  if (!selectedCommission.value) return;
  updatingStatus.value = true;
  const transactionUuid = selectedCommission.value.transactionUuid || selectedCommission.value.commissionUuid || selectedCommission.value.referenceUuid;
  
  try {
    await commissionStore.updateCommissionStatus(transactionUuid, chosenStatus.value);
    toast.success(`Commission status updated to ${chosenStatus.value}`);
    closeStatusModal();
    if (selectedBrokerId.value) {
      await commissionStore.fetchBalance(selectedBrokerId.value);
    }
  } catch (err) {
    toast.error(commissionStore.error || 'Failed to update commission status');
  } finally {
    updatingStatus.value = false;
  }
}

// Settle Handlers
function openSettleModal() {
  settleForm.value = {
    paymentType: 'CHECK',
    checkNumber: '',
    receiptNumber: '',
    notes: ''
  };
  showSettleModal.value = true;
}

function closeSettleModal() {
  showSettleModal.value = false;
}

async function submitSettle() {
  if (!selectedBrokerId.value) return;
  settling.value = true;
  
  try {
    await commissionStore.settleCommissions(selectedBrokerId.value, {
      paymentType: settleForm.value.paymentType,
      checkNumber: settleForm.value.paymentType === 'CHECK' ? settleForm.value.checkNumber : '',
      receiptNumber: settleForm.value.receiptNumber,
      notes: settleForm.value.notes
    });
    toast.success('Approved commissions settled successfully!');
    closeSettleModal();
    activeTab.value = 'payments';
    refetch.value++;
  } catch (err) {
    toast.error(commissionStore.error || 'Failed to settle commissions');
  } finally {
    settling.value = false;
  }
}

async function doConfirmPayment(payment) {
  confirmingPayment.value = payment.paymentUuid;
  try {
    await commissionStore.confirmPayment(payment.paymentUuid);
    toast.success('Payment confirmed successfully!');
    refetch.value++;
  } catch {
    toast.error(commissionStore.error || 'Failed to confirm payment');
  } finally {
    confirmingPayment.value = null;
  }
}

async function doCancelPayment(payment) {
  cancellingPayment.value = payment.paymentUuid;
  try {
    await commissionStore.cancelPayment(payment.paymentUuid);
    toast.success('Payment cancelled.');
    refetch.value++;
  } catch {
    toast.error(commissionStore.error || 'Failed to cancel payment');
  } finally {
    cancellingPayment.value = null;
  }
}
</script>

<template>
  <div class="h-full">
    <CommissionDataProvider
      :brokerId="selectedBrokerId"
      :refetch="refetch"
    >
      <template #default="{ pendingCommissions, transactions, payments, balance, pending }">
        <DefaultPage :hideSearch="true">

          <!-- Balance Card + Settle button in header area -->
          <template #first>
            <div v-if="selectedBrokerId" class="flex items-center gap-4">
              <div class="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-primary to-primary/80 rounded-xl text-white shadow-sm">
                <div>
                  <p class="text-xs uppercase tracking-wider opacity-75 font-medium">Current Balance</p>
                  <p class="text-xl font-bold leading-tight">{{ formatCurrency(balance) }}</p>
                </div>
              </div>
              <Button 
                v-if="hasApprovedCommissions"
                variant="primary" 
                @click="openSettleModal"
                class="shadow-sm hover:shadow-md transition-shadow bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4 mr-1.5 inline-block">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Settle Approved
              </Button>
            </div>
            <div v-else class="text-gray-400 text-sm">Select a broker to view their commissions</div>
          </template>

          <template #header>
            <!-- Broker Selector -->
            <div class="w-64">
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

          <!-- Main content -->
          <template #default>
            <!-- Empty state when no broker selected -->
            <div v-if="!selectedBrokerId" class="flex flex-col items-center justify-center py-20 text-gray-400">
              <svg class="w-14 h-14 mb-4 stroke-gray-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <p class="text-base font-medium text-gray-500">No broker selected</p>
              <p class="text-sm text-gray-400 mt-1">Please select a broker above to view their commissions and transactions.</p>
            </div>

            <!-- Tabs and content -->
            <div v-else class="flex flex-col gap-0 h-full">
              <!-- Tab Navigation -->
              <div class="flex border-b border-gray-100 bg-white rounded-t-xl px-4 pt-2 gap-1">
                <button
                  :class="[
                    'px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors',
                    activeTab === 'pending'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'
                  ]"
                  @click="activeTab = 'pending'"
                >
                  Pending Commissions
                  <span v-if="pendingCommissions?.length" class="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold bg-red-100 text-red-600 rounded-full">
                    {{ pendingCommissions.length }}
                  </span>
                </button>
                <button
                  :class="[
                    'px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors',
                    activeTab === 'transactions'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'
                  ]"
                  @click="activeTab = 'transactions'"
                >
                  Transaction History
                </button>
                <button
                  :class="[
                    'px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors',
                    activeTab === 'payments'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'
                  ]"
                  @click="activeTab = 'payments'"
                >
                  Payments
                  <span v-if="payments?.length" class="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-700 rounded-full">
                    {{ payments.length }}
                  </span>
                </button>
              </div>

              <!-- Pending Commissions Tab -->
              <div v-if="activeTab === 'pending'" class="flex-1">
                <Table
                  :pending="pending"
                  :headers="{
                    head: ['№', 'Policy / Reference', 'Rule Applied', 'Amount', 'Status'],
                    row: ['referenceType', 'ruleName', 'amount', 'status'],
                  }"
                  :rows="pendingCommissions || []"
                  :hideIndex="true"
                  placeholder="No pending commissions found for this broker."
                  :rowCom="CommissionStatusRow"
                  :rowComProps="{
                    onStatusClick: openStatusModal
                  }"
                  @statusClick="openStatusModal"
                />
              </div>

              <!-- Transaction History Tab -->
              <div v-if="activeTab === 'transactions'" class="flex-1">
                <Table
                  :pending="pending"
                  :headers="{
                    head: ['№', 'Date', 'Transaction ID', 'Type', 'Amount', 'Status'],
                    row: ['createdAt', 'transactionUuid', 'type', 'amount', 'status'],
                  }"
                  :rows="transactions || []"
                  :hideIndex="true"
                  placeholder="No transactions found for this broker."
                  :rowCom="CommissionStatusRow"
                  :rowComProps="{
                    onStatusClick: openStatusModal
                  }"
                  @statusClick="openStatusModal"
                />
              </div>

              <!-- Payments Tab -->
              <div v-if="activeTab === 'payments'" class="bg-white rounded-b-xl overflow-hidden">
                <div v-if="!payments?.length" class="flex flex-col items-center justify-center py-16 text-gray-400">
                  <svg class="w-12 h-12 mb-3 stroke-gray-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
                  </svg>
                  <p class="text-sm font-medium text-gray-500">No settlement payments yet</p>
                </div>
                <table v-else class="w-full text-sm">
                  <thead>
                    <tr class="border-b border-gray-100 bg-gray-50">
                      <th class="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Payment UUID</th>
                      <th class="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Net Amount</th>
                      <th class="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Direction</th>
                      <th class="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Transactions</th>
                      <th class="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                      <th class="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-50">
                    <tr v-for="payment in payments" :key="payment.paymentUuid" class="hover:bg-gray-50/60 transition-colors">
                      <td class="px-5 py-3.5 font-mono text-xs text-gray-400">{{ payment.paymentUuid?.split('-')[0] }}…</td>
                      <td class="px-5 py-3.5 font-bold text-emerald-600">ETB {{ parseFloat(payment.netBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }) }}</td>
                      <td class="px-5 py-3.5 text-gray-600">{{ payment.direction }}</td>
                      <td class="px-5 py-3.5 text-gray-500 text-xs">{{ payment.settledTransactionUuids?.length || 0 }} transaction(s)</td>
                      <td class="px-5 py-3.5">
                        <span :class="['px-2 py-1 rounded-full text-xs font-semibold', paymentStatusClass(payment.paymentStatus)]">
                          {{ payment.paymentStatus }}
                        </span>
                      </td>
                      <td class="px-5 py-3.5">
                        <div class="flex justify-end gap-2">
                          <button v-if="payment.paymentStatus === 'PENDING'" :disabled="confirmingPayment === payment.paymentUuid" @click="doConfirmPayment(payment)" class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                            {{ confirmingPayment === payment.paymentUuid ? '…' : 'Confirm' }}
                          </button>
                          <button v-if="payment.paymentStatus === 'PENDING'" :disabled="cancellingPayment === payment.paymentUuid" @click="doCancelPayment(payment)" class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors">
                            {{ cancellingPayment === payment.paymentUuid ? '…' : 'Cancel' }}
                          </button>
                          <span v-if="payment.paymentStatus !== 'PENDING'" class="text-xs text-gray-400 italic">
                            {{ payment.paymentStatus === 'PAYED' ? 'Finalized' : 'Closed' }}
                          </span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </template>
        </DefaultPage>
      </template>
    </CommissionDataProvider>

  <!-- Status Change Modal -->
  <Teleport to="body">
    <div v-if="showStatusModal" class="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" @click.self="closeStatusModal">
      <div class="bg-white rounded-2xl w-full max-w-md shadow-xl flex flex-col overflow-hidden">
        <!-- Modal Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div class="flex items-center gap-3">
            <div class="p-2 rounded-lg bg-primary/10 text-primary">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <h2 class="text-base font-semibold text-gray-900">Change Commission Status</h2>
          </div>
          <button class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors" @click="closeStatusModal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Modal Body -->
        <div class="p-6 flex flex-col gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Select New Status</label>
            <select
              v-model="chosenStatus"
              class="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all bg-white font-medium"
            >
              <option value="PENDING">PENDING</option>
              <option value="APPROVED">APPROVED</option>
              <option value="IN_PAYMENT">IN_PAYMENT</option>
              <option value="PAID">PAID</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
          <p class="text-xs text-gray-400 leading-relaxed">
            Note: Changing the status to APPROVED allows the commission to be settled. Changing it to PAID directly marks it as finalized.
          </p>
        </div>

        <!-- Modal Footer -->
        <div class="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <Button variant="outline" @click="closeStatusModal">Cancel</Button>
          <Button variant="primary" @click="saveStatusChange" :pending="updatingStatus">
            Update Status
          </Button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Settle Commissions Modal -->
  <Teleport to="body">
    <div v-if="showSettleModal" class="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" @click.self="closeSettleModal">
      <div class="bg-white rounded-2xl w-full max-w-lg shadow-xl flex flex-col overflow-hidden">
        <!-- Modal Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div class="flex items-center gap-3">
            <div class="p-2 rounded-lg bg-emerald-100 text-emerald-700">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 class="text-base font-semibold text-gray-900">Settle Approved Commissions</h2>
          </div>
          <button class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors" @click="closeSettleModal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Modal Body -->
        <div class="p-6 flex flex-col gap-4">
          <!-- Payment Type -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Payment Type <span class="text-red-500">*</span></label>
            <select
              v-model="settleForm.paymentType"
              class="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all bg-white font-medium"
            >
              <option value="CHECK">Check</option>
              <option value="CASH">Cash</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="MOBILE_MONEY">Mobile Money</option>
            </select>
          </div>

          <!-- Check Number (Conditional) -->
          <div v-if="settleForm.paymentType === 'CHECK'">
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Check Number <span class="text-red-500">*</span></label>
            <input
              type="text"
              v-model="settleForm.checkNumber"
              class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
              placeholder="e.g. CHK-12345"
              required
            />
          </div>

          <!-- Receipt Number -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Receipt Number</label>
            <input
              type="text"
              v-model="settleForm.receiptNumber"
              class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
              placeholder="e.g. REC-56789"
            />
          </div>

          <!-- Notes -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
            <textarea
              v-model="settleForm.notes"
              class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-inherit resize-vertical min-h-[72px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
              placeholder="Settlement notes..."
            ></textarea>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <Button variant="outline" @click="closeSettleModal">Cancel</Button>
          <Button variant="primary" @click="submitSettle" :pending="settling" class="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
            Confirm Settlement
          </Button>
        </div>
      </div>
    </div>
  </Teleport>
  </div>
</template>
