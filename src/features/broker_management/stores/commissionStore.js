import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { getBalance, getPendingCommissions, getTransactions, updateCommissionStatus as apiUpdateCommissionStatus, settleCommissions as apiSettleCommissions, getPayments as apiGetPayments, confirmPayment as apiConfirmPayment, cancelPayment as apiCancelPayment } from '../api/commissionApi';

export const useCommissionStore = defineStore('commissionStore', () => {
  const transactions = ref([]);
  const pendingCommissions = ref([]);
  const payments = ref([]);
  const loading = ref(false);
  const error = ref(null);
  const currentBalance = ref(0);

  // Getters
  const totalCommissions = computed(() => 
    transactions.value
      .filter(t => t.commission && t.transactionStatus !== 'CANCELLED' && t.status !== 'CANCELLED')
      .reduce((sum, t) => sum + t.amount, 0)
  );
  const pendingAmount = computed(() => pendingCommissions.value.reduce((sum, c) => sum + c.amount, 0));
  const paidAmount = computed(() => transactions.value.filter(t => t.type === 'PAYMENT_PROCESSED').reduce((sum, t) => sum + t.amount, 0));

  // Actions
  async function fetchTransactions(stakeholderUuid) {
    loading.value = true;
    error.value = null;
    try {
      const response = await getTransactions(stakeholderUuid);
      const data = response?.data?.content || (Array.isArray(response?.data) ? response.data : []);
      transactions.value = data;
    } catch (err) {
      error.value = err?.response?.data?.message || err.message || 'Failed to fetch transactions';
      transactions.value = [];
    } finally {
      loading.value = false;
    }
  }

  async function fetchPendingCommissions(stakeholderUuid) {
    loading.value = true;
    error.value = null;
    try {
      const response = await getPendingCommissions(stakeholderUuid);
      const data = response?.data?.content || (Array.isArray(response?.data) ? response.data : []);
      pendingCommissions.value = data;
    } catch (err) {
      error.value = err?.response?.data?.message || err.message || 'Failed to fetch pending commissions';
      pendingCommissions.value = [];
    } finally {
      loading.value = false;
    }
  }

  async function fetchBalance(stakeholderUuid) {
    try {
      const response = await getBalance(stakeholderUuid);
      currentBalance.value = response.data?.balance || response.data || 0;
    } catch (err) {
      console.error('Failed to fetch balance', err);
    }
  }

  async function processPayment(stakeholderUuid, paymentData) {
    loading.value = true;
    error.value = null;
    try {
      const response = await processPayment(stakeholderUuid, paymentData);
      // Refresh transactions and balance
      await fetchTransactions(stakeholderUuid);
      await fetchBalance(stakeholderUuid);
      return response.data;
    } catch (err) {
      error.value = err?.response?.data?.message || err.message || 'Failed to process payment';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateCommissionStatus(commissionUuid, status) {
    loading.value = true;
    error.value = null;
    try {
      const response = await apiUpdateCommissionStatus(commissionUuid, status);
      
      // Update pending commissions array
      const pendingIndex = pendingCommissions.value.findIndex(
        c => c.commissionUuid === commissionUuid || c.transactionUuid === commissionUuid
      );
      if (pendingIndex !== -1) {
        pendingCommissions.value[pendingIndex] = {
          ...pendingCommissions.value[pendingIndex],
          status: status
        };
      }
      
      // Update transactions array
      const transactionIndex = transactions.value.findIndex(
        t => t.transactionUuid === commissionUuid
      );
      if (transactionIndex !== -1) {
        transactions.value[transactionIndex] = {
          ...transactions.value[transactionIndex],
          status: status
        };
      }

      return response.data || response;
    } catch (err) {
      error.value = err?.response?.data?.message || err.message || 'Failed to update commission status';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function settleCommissions(stakeholderUuid, data) {
    loading.value = true;
    error.value = null;
    try {
      const response = await apiSettleCommissions(stakeholderUuid, data);
      // Refresh pending commissions, transactions and balance
      await fetchPendingCommissions(stakeholderUuid);
      await fetchTransactions(stakeholderUuid);
      await fetchBalance(stakeholderUuid);
      await fetchPayments(stakeholderUuid);
      return response.data;
    } catch (err) {
      error.value = err?.response?.data?.message || err.message || 'Failed to settle commissions';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchPayments(stakeholderUuid, params = {}) {
    loading.value = true;
    error.value = null;
    try {
      const response = await apiGetPayments(stakeholderUuid, { page: 0, size: 50, ...params });
      const data = response?.data?.content || (Array.isArray(response?.data) ? response.data : []);
      payments.value = data;
    } catch (err) {
      error.value = err?.response?.data?.message || err.message || 'Failed to fetch payments';
      payments.value = [];
    } finally {
      loading.value = false;
    }
  }

  async function confirmPayment(paymentUuid) {
    error.value = null;
    try {
      const response = await apiConfirmPayment(paymentUuid);
      const idx = payments.value.findIndex(p => p.paymentUuid === paymentUuid);
      if (idx !== -1) {
        payments.value[idx] = { ...payments.value[idx], paymentStatus: 'PAYED' };
      }
      return response.data;
    } catch (err) {
      error.value = err?.response?.data?.message || err.message || 'Failed to confirm payment';
      throw err;
    }
  }

  async function cancelPayment(paymentUuid) {
    error.value = null;
    try {
      const response = await apiCancelPayment(paymentUuid);
      const idx = payments.value.findIndex(p => p.paymentUuid === paymentUuid);
      if (idx !== -1) {
        payments.value[idx] = { ...payments.value[idx], paymentStatus: 'CANCELED' };
      }
      return response.data;
    } catch (err) {
      error.value = err?.response?.data?.message || err.message || 'Failed to cancel payment';
      throw err;
    }
  }

  return {
    transactions,
    pendingCommissions,
    payments,
    loading,
    error,
    currentBalance,
    totalCommissions,
    pendingAmount,
    paidAmount,
    fetchTransactions,
    fetchPendingCommissions,
    fetchBalance,
    fetchPayments,
    processPayment,
    updateCommissionStatus,
    settleCommissions,
    confirmPayment,
    cancelPayment
  };
});
