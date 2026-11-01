import { describe, it, expect } from 'vitest';
import { claimDocuments, groupPolicyDocuments, individualPolicyDocuments, quotationDocuments } from '../documentMenus';

const keys = (items) => items.map((i) => i.key);

describe('life document menus', () => {
  it('offers quotation PDFs by stage', () => {
    expect(keys(quotationDocuments({ quotationStatus: 'PENDING' }))).toEqual([]);
    expect(keys(quotationDocuments({}))).toEqual([]);
    expect(keys(quotationDocuments({ quotationStatus: 'ISSUED' }))).toEqual(['quotation']);
    expect(keys(quotationDocuments({ quotationStatus: 'ACCEPTED' }))).toEqual(['quotation', 'debitNote']);
    expect(keys(quotationDocuments({ quotationStatus: 'PAID' }))).toEqual(['quotation', 'debitNote', 'receipt']);
    expect(keys(quotationDocuments({ quotationStatus: 'PAID', policyIssuedDate: '2026-10-21' })))
      .toEqual(['quotation', 'debitNote', 'receipt', 'policySchedule']);
  });

  it('offers a group policy schedule and receipt once the policy is issued', () => {
    expect(groupPolicyDocuments({})).toEqual([]);
    expect(keys(groupPolicyDocuments({ policyIssuedDate: '2026-10-21' }))).toEqual(['policySchedule', 'receipt']);
  });

  it('offers an individual policy schedule once it has a policy number', () => {
    expect(individualPolicyDocuments({ status: 'PENDING' })).toEqual([]);
    expect(keys(individualPolicyDocuments({ policyNumber: 'LI-1' }))).toEqual(['individualPolicy']);
  });

  it('offers the claim settlement advice once authorized or paid', () => {
    expect(claimDocuments({ status: 'APPROVED' })).toEqual([]);
    expect(keys(claimDocuments({ status: 'AUTHORIZED' }))).toEqual(['claimSettlement']);
    expect(claimDocuments({ status: 'PAID' })[0].hint).toBe('Payments to the payees');
  });
});
