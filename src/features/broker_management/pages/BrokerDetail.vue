<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';
import { useBrokerStore } from '../stores/brokerStore';
import { useCommissionStore } from '../stores/commissionStore';
import { useRulesStore } from '../stores/rulesStore';
import { formatCurrency, formatDate } from '../api/utils';
import StatusBadge from '../components/StatusBadge.vue';
import Table from '@/components/Table.vue';
import Button from '@/components/Button.vue';
import DefaultPage from '@/components/DefaultPage.vue';
import CommissionDataProvider from '../components/CommissionDataProvider.vue';
import CommissionStatusRow from '../components/CommissionStatusRow.vue';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const brokerStore = useBrokerStore();
const commissionStore = useCommissionStore();
const rulesStore = useRulesStore();

const brokerId = route.params.id;
const activeTab = ref('overview');
const refetch = ref(0);

// ─── Status Modal ────────────────────────────────────────────────────────────
const showStatusModal = ref(false);
const selectedCommission = ref(null);
const chosenStatus = ref('PENDING');
const updatingStatus = ref(false);

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
  const uuid =
    selectedCommission.value.transactionUuid ||
    selectedCommission.value.commissionUuid ||
    selectedCommission.value.referenceUuid;
  try {
    await commissionStore.updateCommissionStatus(uuid, chosenStatus.value);
    toast.success(`Status updated to ${chosenStatus.value}`);
    closeStatusModal();
    refetch.value++;
  } catch {
    toast.error(commissionStore.error || 'Failed to update status');
  } finally {
    updatingStatus.value = false;
  }
}

// ─── Settle / Process Payment Modal ──────────────────────────────────────────
const showSettleModal = ref(false);
const settling = ref(false);
const settleForm = ref({ paymentType: 'CHECK', checkNumber: '', receiptNumber: '', notes: '' });

const hasApprovedCommissions = computed(() => {
  const pending = commissionStore.pendingCommissions;
  const txns = commissionStore.transactions;
  const inPending = Array.isArray(pending) && pending.some(c => (c.transactionStatus || c.status) === 'APPROVED');
  const inTxns = Array.isArray(txns) && txns.some(t => (t.transactionStatus || t.status) === 'APPROVED');
  return inPending || inTxns;
});

function openSettleModal() {
  settleForm.value = { paymentType: 'CHECK', checkNumber: '', receiptNumber: '', notes: '' };
  showSettleModal.value = true;
}
function closeSettleModal() { showSettleModal.value = false; }

async function submitSettle() {
  settling.value = true;
  try {
    await commissionStore.settleCommissions(brokerId, {
      paymentType: settleForm.value.paymentType,
      checkNumber: settleForm.value.paymentType === 'CHECK' ? settleForm.value.checkNumber : '',
      receiptNumber: settleForm.value.receiptNumber,
      notes: settleForm.value.notes,
    });
    toast.success('Commissions settled successfully! A payment record has been created.');
    closeSettleModal();
    activeTab.value = 'payments';
    refetch.value++;
  } catch {
    toast.error(commissionStore.error || 'Failed to settle commissions');
  } finally {
    settling.value = false;
  }
}

// ─── Payment Confirm / Cancel ─────────────────────────────────────────────────
const confirmingPayment = ref(null);
const cancellingPayment = ref(null);

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

// ─── Lifecycle & Computed ─────────────────────────────────────────────────────
onMounted(async () => {
  await brokerStore.fetchBrokerById(brokerId);
  await rulesStore.fetchRules({ stakeholderUuid: brokerId });
});

const broker = computed(() => brokerStore.currentBroker || {});
const rules = computed(() => rulesStore.rules);

const tabs = [
  { id: 'overview', name: 'Overview' },
  { id: 'pending', name: 'Pending Commissions' },
  { id: 'transactions', name: 'Transactions' },
  { id: 'payments', name: 'Payments' },
  { id: 'rules', name: 'Rules & Rates' },
];

const back = () => router.push('/brokers');
const edit = () => router.push(`/brokers/${brokerId}/edit`);

// Payment status badge style helper
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
</script>

<template>
  <div class="h-full">
    <CommissionDataProvider :broker-id="brokerId" :refetch="refetch">
      <template #default="{ pendingCommissions, transactions, payments, balance, pending }">
        <DefaultPage :hideSearch="true">

          <!-- Top-left: broker identity + back link -->
          <template #first>
            <div class="flex items-center gap-4">
              <button
                @click="back"
                class="flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-primary transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Brokers
              </button>
              <span class="text-gray-200">|</span>
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-base shadow-xs">
                  {{ broker.firstName?.[0] }}{{ broker.lastName?.[0] }}
                </div>
                <div>
                  <h1 class="text-base font-bold text-gray-900 leading-tight">
                    {{ broker.firstName }} {{ broker.lastName }}
                  </h1>
                  <div class="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                    <span>{{ broker.email }}</span>
                    <span>•</span>
                    <StatusBadge :status="broker.status" />
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- Top-right: balance card + action buttons -->
          <template #header>
            <div class="flex items-center gap-3">
              <div class="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-primary to-primary/80 rounded-xl text-white shadow-sm">
                <div>
                  <p class="text-[10px] uppercase tracking-wider opacity-75 font-medium">Balance</p>
                  <p class="text-lg font-bold leading-tight">{{ formatCurrency(balance) }}</p>
                </div>
              </div>
              <Button variant="outline" @click="edit" size="sm">Edit Profile</Button>
              <Button
                variant="primary"
                @click="openSettleModal"
                :disabled="!hasApprovedCommissions"
                :title="hasApprovedCommissions ? 'Process Payment' : 'No approved commissions to settle'"
                class="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold"
                size="sm"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4 mr-1.5 inline-block">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Process Payment
              </Button>
            </div>
          </template>

          <!-- Main content -->
          <template #default>
            <div class="flex flex-col h-full">

              <!-- Tab Navigation -->
              <div class="flex border-b border-gray-100 bg-white rounded-t-xl px-4 pt-2 gap-1">
                <button
                  v-for="tab in tabs"
                  :key="tab.id"
                  :class="[
                    'px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors',
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'
                  ]"
                  @click="activeTab = tab.id"
                >
                  {{ tab.name }}
                  <span
                    v-if="tab.id === 'pending' && pendingCommissions?.length"
                    class="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold bg-red-100 text-red-600 rounded-full"
                  >
                    {{ pendingCommissions.length }}
                  </span>
                  <span
                    v-if="tab.id === 'payments' && payments?.length"
                    class="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-700 rounded-full"
                  >
                    {{ payments.length }}
                  </span>
                </button>
              </div>

              <!-- ── Overview Tab ── -->
              <div v-if="activeTab === 'overview'" class="p-5 space-y-5 bg-white rounded-b-xl">
                <div class="grid grid-cols-3 gap-4">
                  <div class="bg-gray-50 rounded-xl border border-gray-100 p-5 flex flex-col items-center text-center">
                    <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Available Balance</span>
                    <span class="text-3xl font-bold text-gray-900">{{ formatCurrency(balance) }}</span>
                  </div>
                  <div class="bg-gray-50 rounded-xl border border-gray-100 p-5 flex flex-col items-center text-center">
                    <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Total Earned (YTD)</span>
                    <span class="text-3xl font-bold text-emerald-600">{{ formatCurrency(commissionStore.totalCommissions) }}</span>
                  </div>
                  <div class="bg-gray-50 rounded-xl border border-gray-100 p-5 flex flex-col items-center text-center">
                    <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Total Paid (YTD)</span>
                    <span class="text-3xl font-bold text-primary">{{ formatCurrency(commissionStore.paidAmount) }}</span>
                  </div>
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <div class="bg-gray-50 rounded-xl border border-gray-100 p-5">
                    <h3 class="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-3 mb-4">Professional Information</h3>
                    <div class="space-y-3">
                      <div class="flex justify-between text-sm"><span class="text-gray-400">License Number</span><span class="font-medium text-gray-900">{{ broker.licenseNumber || '—' }}</span></div>
                      <div class="flex justify-between text-sm"><span class="text-gray-400">Tax ID</span><span class="font-medium text-gray-900">{{ broker.taxId || '—' }}</span></div>
                      <div class="flex justify-between text-sm"><span class="text-gray-400">Phone</span><span class="font-medium text-gray-900">{{ broker.phoneNumber || '—' }}</span></div>
                      <div class="flex justify-between text-sm"><span class="text-gray-400">Date Joined</span><span class="font-medium text-gray-900">{{ formatDate(broker.createdAt) }}</span></div>
                    </div>
                  </div>
                  <div class="bg-gray-50 rounded-xl border border-gray-100 p-5">
                    <h3 class="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-3 mb-4">Banking Information</h3>
                    <div class="space-y-3">
                      <div class="flex justify-between text-sm"><span class="text-gray-400">Bank Name</span><span class="font-medium text-gray-900">{{ broker.bankName || '—' }}</span></div>
                      <div class="flex justify-between text-sm"><span class="text-gray-400">Account Number</span><span class="font-medium text-gray-900">{{ broker.bankAccountNumber || '—' }}</span></div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- ── Pending Commissions Tab ── -->
              <div v-if="activeTab === 'pending'" class="flex-1">
                <Table
                  :pending="pending"
                  :headers="{ head: ['№', 'Policy / Reference', 'Rule Applied', 'Amount', 'Status'], row: ['referenceType', 'ruleName', 'amount', 'status'] }"
                  :rows="pendingCommissions || []"
                  :hideIndex="true"
                  placeholder="No pending commissions found for this broker."
                  :rowCom="CommissionStatusRow"
                  :rowComProps="{ onStatusClick: openStatusModal }"
                  @statusClick="openStatusModal"
                />
              </div>

              <!-- ── Transactions Tab ── -->
              <div v-if="activeTab === 'transactions'" class="flex-1">
                <Table
                  :pending="pending"
                  :headers="{ head: ['№', 'Date', 'Transaction ID', 'Type', 'Amount', 'Status'], row: ['createdAt', 'transactionUuid', 'type', 'amount', 'status'] }"
                  :rows="transactions || []"
                  :hideIndex="true"
                  placeholder="No transactions recorded yet."
                  :rowCom="CommissionStatusRow"
                  :rowComProps="{ onStatusClick: openStatusModal }"
                  @statusClick="openStatusModal"
                />
              </div>

              <!-- ── Payments Tab ── -->
              <div v-if="activeTab === 'payments'" class="bg-white rounded-b-xl overflow-hidden">
                <div v-if="pending" class="flex items-center justify-center py-16 text-gray-400">
                  <svg class="animate-spin h-6 w-6 mr-2 text-primary" viewBox="0 0 24 24" fill="none">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Loading payments…
                </div>
                <div v-else-if="!payments?.length" class="flex flex-col items-center justify-center py-16 text-gray-400">
                  <svg class="w-12 h-12 mb-3 stroke-gray-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
                  </svg>
                  <p class="text-sm font-medium text-gray-500">No settlement payments yet</p>
                  <p class="text-xs text-gray-400 mt-1">Settle approved commissions using "Process Payment" to create a payment record.</p>
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
                    <tr
                      v-for="payment in payments"
                      :key="payment.paymentUuid"
                      class="hover:bg-gray-50/60 transition-colors"
                    >
                      <td class="px-5 py-3.5 font-mono text-xs text-gray-400">
                        {{ payment.paymentUuid?.split('-')[0] }}…
                      </td>
                      <td class="px-5 py-3.5 font-bold text-emerald-600">
                        {{ formatCurrency(payment.netBalance) }}
                      </td>
                      <td class="px-5 py-3.5 text-gray-600">
                        {{ payment.direction }}
                      </td>
                      <td class="px-5 py-3.5 text-gray-500 text-xs">
                        {{ payment.settledTransactionUuids?.length || 0 }} transaction(s)
                      </td>
                      <td class="px-5 py-3.5">
                        <span :class="['px-2 py-1 rounded-full text-xs font-semibold', paymentStatusClass(payment.paymentStatus)]">
                          {{ payment.paymentStatus }}
                        </span>
                      </td>
                      <td class="px-5 py-3.5">
                        <div class="flex justify-end gap-2">
                          <button
                            v-if="payment.paymentStatus === 'PENDING'"
                            :disabled="confirmingPayment === payment.paymentUuid"
                            @click="doConfirmPayment(payment)"
                            class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                          >
                            {{ confirmingPayment === payment.paymentUuid ? '…' : 'Confirm' }}
                          </button>
                          <button
                            v-if="payment.paymentStatus === 'PENDING'"
                            :disabled="cancellingPayment === payment.paymentUuid"
                            @click="doCancelPayment(payment)"
                            class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors"
                          >
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

              <!-- ── Rules Tab ── -->
              <div v-if="activeTab === 'rules'" class="bg-white rounded-b-xl p-5">
                <div class="flex justify-between items-center mb-5">
                  <h3 class="text-sm font-semibold text-gray-700">Active Commission Rules</h3>
                  <Button variant="ghost" size="sm">+ Add Rule</Button>
                </div>
                <div v-if="!rules.length" class="text-center py-10 text-gray-400 text-sm">
                  No commission rules applied. Broker will not earn commissions on policies.
                </div>
                <div v-else class="grid grid-cols-2 gap-3">
                  <div
                    v-for="rule in rules"
                    :key="rule.ruleUuid"
                    class="p-4 border border-gray-100 rounded-xl bg-gray-50 hover:border-primary/30 hover:bg-primary/5 transition-all"
                  >
                    <div class="flex justify-between items-start mb-2">
                      <div class="font-semibold text-gray-900 text-sm">{{ rule.ruleName }}</div>
                      <StatusBadge :status="rule.status" />
                    </div>
                    <div class="text-xs text-gray-400 mb-3">{{ rule.description || 'No description provided' }}</div>
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded-md border border-gray-200">{{ rule.policyType }}</span>
                      <span class="font-bold text-primary text-base">{{ rule.commissionValue }}{{ rule.commissionType === 'PERCENTAGE' ? '%' : ' ETB' }}</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </template>
        </DefaultPage>
      </template>
    </CommissionDataProvider>

    <!-- ── Status Change Modal ── -->
    <Teleport to="body">
      <div v-if="showStatusModal" class="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" @click.self="closeStatusModal">
        <div class="bg-white rounded-2xl w-full max-w-md shadow-xl flex flex-col overflow-hidden">
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div class="flex items-center gap-3">
              <div class="p-2 rounded-lg bg-primary/10 text-primary">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
              </div>
              <h2 class="text-base font-semibold text-gray-900">Change Commission Status</h2>
            </div>
            <button class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors" @click="closeStatusModal">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <div class="p-6 flex flex-col gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Select New Status</label>
              <select v-model="chosenStatus" class="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all bg-white font-medium">
                <option value="PENDING">PENDING</option>
                <option value="APPROVED">APPROVED</option>
                <option value="IN_PAYMENT">IN_PAYMENT</option>
                <option value="PAID">PAID</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
            <p class="text-xs text-gray-400">Set to APPROVED to allow this commission to be settled via Process Payment.</p>
          </div>
          <div class="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
            <Button variant="outline" @click="closeStatusModal">Cancel</Button>
            <Button variant="primary" @click="saveStatusChange" :pending="updatingStatus">Update Status</Button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ── Process Payment (Settle) Modal ── -->
    <Teleport to="body">
      <div v-if="showSettleModal" class="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" @click.self="closeSettleModal">
        <div class="bg-white rounded-2xl w-full max-w-lg shadow-xl flex flex-col overflow-hidden">
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div class="flex items-center gap-3">
              <div class="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
              </div>
              <div>
                <h2 class="text-base font-semibold text-gray-900">Process Payment</h2>
                <p class="text-xs text-gray-400 mt-0.5">Settle all APPROVED commissions for this broker</p>
              </div>
            </div>
            <button class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors" @click="closeSettleModal">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <div class="p-6 flex flex-col gap-4">
            <!-- Payment Type -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Payment Type <span class="text-red-500">*</span></label>
              <select v-model="settleForm.paymentType" class="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all bg-white font-medium">
                <option value="CHECK">Check</option>
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="MOBILE_MONEY">Mobile Money</option>
              </select>
            </div>
            <!-- Check Number -->
            <div v-if="settleForm.paymentType === 'CHECK'">
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Check Number <span class="text-red-500">*</span></label>
              <input type="text" v-model="settleForm.checkNumber" class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all" placeholder="e.g. CHK-12345"/>
            </div>
            <!-- Receipt Number -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Receipt Number</label>
              <input type="text" v-model="settleForm.receiptNumber" class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all" placeholder="e.g. REC-56789"/>
            </div>
            <!-- Notes -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
              <textarea v-model="settleForm.notes" class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-inherit resize-vertical min-h-[72px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all" placeholder="Settlement notes…"></textarea>
            </div>
          </div>
          <div class="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
            <Button variant="outline" @click="closeSettleModal">Cancel</Button>
            <Button variant="primary" @click="submitSettle" :pending="settling" class="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
              Confirm &amp; Settle
            </Button>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>
