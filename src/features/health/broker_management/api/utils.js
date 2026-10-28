/**
 * Utility functions for Broker Management System
 */

/**
 * Normalise a list response to an array. Handles a plain array, a Spring page
 * ({ content: [] }), either wrapped in { data }, and failed calls (the API layer
 * resolves those as { success: false, ... }) - which must never land in a store
 * that pages call .map()/.filter() on.
 */
export const toList = (response) => {
  const payload = response?.data ?? response;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  return [];
};

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
    ACTIVE: { label: 'Active', color: 'green', cls: 'bg-success-soft text-success-strong' },
    INACTIVE: { label: 'Inactive', color: 'red', cls: 'bg-error-soft text-error-strong' },
    PENDING: { label: 'Pending', color: 'orange', cls: 'bg-orange-100 text-orange-800' },
  };
  return map[status] || { label: status || 'Unknown', color: 'gray', cls: 'bg-surface-muted text-ink' };
};

// Map Transaction Types to UI labels and colors
export const getTransactionTypeMeta = (type) => {
  const map = {
    COMMISSION_EARNED: { label: 'Earned', color: 'green', cls: 'text-success font-medium' },
    PAYMENT_PROCESSED: { label: 'Paid', color: 'red', cls: 'text-error font-medium' },
    PENDING_APPROVAL: { label: 'Pending', color: 'yellow', cls: 'text-warning font-medium' },
  };
  return map[type] || { label: type || 'Unknown', color: 'gray', cls: 'text-ink-muted' };
};
