export const QUOTATION_STATUSES = Object.freeze([
  'DRAFT', 'SUBMITTED', 'QUOTED', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'CONVERTED',
]);

export const POLICY_STATUSES = Object.freeze(['ACTIVE', 'EXPIRED', 'CANCELLED', 'SUSPENDED']);

export const CLAIM_STATUSES = Object.freeze([
  'REPORTED', 'REGISTERED', 'INVESTIGATING', 'ASSESSED', 'APPROVED', 'SETTLED', 'REJECTED', 'WITHDRAWN',
]);

export const CLAIM_PROCESS_STATUSES = Object.freeze(['REPORTED', 'REGISTERED', 'INVESTIGATING', 'ASSESSED']);
export const CLAIM_APPROVED_STATUSES = Object.freeze(['APPROVED']);
export const CLAIM_COMPLETED_STATUSES = Object.freeze(['SETTLED', 'REJECTED', 'WITHDRAWN']);

export const LOSS_TYPES = Object.freeze([
  { value: 'BODILY_INJURY', label: 'Bodily injury' },
  { value: 'PROPERTY_DAMAGE', label: 'Property damage' },
  { value: 'FINANCIAL_LOSS', label: 'Financial loss' },
  { value: 'MIXED', label: 'Mixed' },
]);

export const PAYMENT_METHODS = Object.freeze([
  { value: 'BANK_TRANSFER', label: 'Bank transfer' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'CASH', label: 'Cash' },
]);

export function money(value, currency = 'ETB') {
  if (value == null || value === '') return '—';
  const amount = Number(value);
  if (Number.isNaN(amount)) return String(value);
  return `${currency} ${amount.toLocaleString('en-ET', { minimumFractionDigits: 2 })}`;
}

export function statusLabel(status) {
  return String(status || '')
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}
