/**
 * Utility functions for Broker Management System
 */

// Format date to local string
export const formatDate = (dateString) => {
  if (!dateString) return '—';
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

// Format currency
export const formatCurrency = (amount) => {
  if (amount == null) return '—';
  return 'ETB ' + Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Map Stakeholder Status to UI labels and colors
export const getStatusMeta = (status) => {
  const map = {
    ACTIVE: { label: 'Active', color: 'green', cls: 'bg-green-100 text-green-800' },
    INACTIVE: { label: 'Inactive', color: 'red', cls: 'bg-red-100 text-red-800' },
    PENDING: { label: 'Pending', color: 'orange', cls: 'bg-orange-100 text-orange-800' },
  };
  return map[status] || { label: status || 'Unknown', color: 'gray', cls: 'bg-gray-100 text-gray-800' };
};

// Map Transaction Types to UI labels and colors
export const getTransactionTypeMeta = (type) => {
  const map = {
    COMMISSION_EARNED: { label: 'Earned', color: 'green', cls: 'text-green-600 font-medium' },
    PAYMENT_PROCESSED: { label: 'Paid', color: 'red', cls: 'text-red-600 font-medium' },
    PENDING_APPROVAL: { label: 'Pending', color: 'yellow', cls: 'text-yellow-600 font-medium' },
  };
  return map[type] || { label: type || 'Unknown', color: 'gray', cls: 'text-gray-600' };
};
