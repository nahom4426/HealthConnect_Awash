import ApiService from "@/service/ApiService";

const api = new ApiService();
const path = "/claimconnect";

// Add transaction
export function addTransaction(stakeholderUuid, data) {
  return api
    .addAuthenticationHeader()
    .post(`${path}/stakeholder/${stakeholderUuid}/transaction`, data);
}

// Process payment
export function processPayment(stakeholderUuid, data) {
  return api
    .addAuthenticationHeader()
    .post(`${path}/stakeholder/${stakeholderUuid}/payment`, data);
}

// Get all transactions for stakeholder (broker/agent)
export function getTransactions(stakeholderUuid) {
  return api
    .addAuthenticationHeader()
    .get(`${path}/stakeholder/${stakeholderUuid}/transactions`);
}

// Get pending commissions
export function getPendingCommissions(stakeholderUuid) {
  return api
    .addAuthenticationHeader()
    .get(`${path}/stakeholder/${stakeholderUuid}/commissions/pending`);
}

// Get current balance
export function getBalance(stakeholderUuid) {
  return api
    .addAuthenticationHeader()
    .get(`${path}/stakeholder/${stakeholderUuid}/balance`);
}

// Get specific transaction
export function getTransaction(transactionUuid) {
  return api
    .addAuthenticationHeader()
    .get(`${path}/stakeholder/transaction/${transactionUuid}`);
}

// Update commission status
export function updateCommissionStatus(commissionUuid, status) {
  return api
    .addAuthenticationHeader()
    .put(`${path}/stakeholder/commission/${commissionUuid}/status`, null, { params: { status } });
}

// Get by reference
export function getByReference(referenceUuid, referenceType) {
  return api
    .addAuthenticationHeader()
    .get(`${path}/stakeholder/reference/${referenceUuid}/${referenceType}`);
}

// Settle commissions
export function settleCommissions(stakeholderUuid, data) {
  return api
    .addAuthenticationHeader()
    .post(`${path}/stakeholder/${stakeholderUuid}/commissions/settle`, data);
}

// Get commission settlement payments list
export function getPayments(stakeholderUuid, params = {}) {
  return api
    .addAuthenticationHeader()
    .get(`${path}/stakeholder/${stakeholderUuid}/commissions/payments`, { params });
}

// Confirm (approve) a settlement payment
export function confirmPayment(paymentUuid) {
  return api
    .addAuthenticationHeader()
    .put(`${path}/stakeholder/commissions/payment/${paymentUuid}/confirm`);
}

// Cancel (reject) a settlement payment
export function cancelPayment(paymentUuid) {
  return api
    .addAuthenticationHeader()
    .put(`${path}/stakeholder/commissions/payment/${paymentUuid}/cancel`);
}