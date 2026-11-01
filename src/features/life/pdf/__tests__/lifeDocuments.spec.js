import { describe, it, expect, vi, beforeAll } from 'vitest';
import { readFileSync, writeFileSync } from 'node:fs';
import {
  buildLifeQuotationPdf,
  buildLifeDebitNotePdf,
  buildLifeReceiptPdf,
  buildLifePolicySchedulePdf,
  buildLifeIndividualPolicyPdf,
  buildLifeClaimSettlementPdf,
} from '../lifeDocuments';

const quotation = {
  quotationUuid: 'q-1', quotationNumber: 'LQ-2026-0107', quotationStatus: 'PAID', policyStatus: 'ACTIVE',
  institutionName: 'Abay Trading PLC', contactPersonFullName: 'Selam Bekele', contactPhone: '+251911223344',
  institutionLifeInsuranceNumber: 'GL-000452', poNumber: 'PO-8812', term: 1, quotedByFullName: 'Dawit Alemu',
  termPremium: 38400, riderPremium: 6100, grossPremium: 44500, requestedPremium: 44500,
  withHoldingTax: 1335, revenueStamp: 5, netPremium: 43170, fclAmount: 500000,
  issueDate: '2026-10-10', acceptedDate: '2026-10-14', paidDate: '2026-10-20', receiptNumber: 'LR-3301',
  policyIssuedDate: '2026-10-21', beginDate: '2026-11-01', endDate: '2027-10-31',
};
const members = Array.from({ length: 24 }, (_, i) => ({
  firstName: ['Abebe', 'Hana', 'Kebede', 'Meron'][i % 4], fatherName: 'Tesfaye', insuranceId: `EMP-${100 + i}`,
  position: i % 3 ? 'Officer' : 'Manager', gender: i % 2 ? 'Female' : 'Male', birthDate: `19${70 + (i % 25)}-05-12`,
  sumAssured: 200000 + i * 10000, premium: 1400 + i * 35,
}));
const riders = [{ riderName: 'Accidental death benefit', sumAssured: 200000, premium: 3600 }, { riderName: 'Permanent disability', sumAssured: 150000, premium: 2500 }];

const save = (doc, name) => {
  const dir = process.env.PDF_OUT;
  if (dir) writeFileSync(`${dir}/${name}.pdf`, Buffer.from(doc.output('arraybuffer')));
};

describe('life client PDFs', () => {
  // Serve the real logo so the PDFs are drawn as in the browser.
  beforeAll(() => {
    vi.stubGlobal('fetch', async (url) => {
      const buf = readFileSync(`src/features/shared/pdf/${String(url).split('/').pop()}`);
      return { blob: async () => new Blob([buf], { type: 'image/png' }) };
    });
  });

  it('builds the group quotation, debit note and receipt', async () => {
    const q = await buildLifeQuotationPdf({ ...quotation, quotationStatus: 'ISSUED' }, { members, riders });
    const dn = await buildLifeDebitNotePdf({ ...quotation, quotationStatus: 'ACCEPTED' }, { members });
    const rc = await buildLifeReceiptPdf(quotation, { receiptNumber: 'LR-3301', receiptDate: '2026-10-20', withHoldingTax: 1335, revenueStamp: 5, netPremium: 43170 });
    expect(q.internal.getNumberOfPages()).toBeGreaterThan(1);
    expect(dn.internal.getNumberOfPages()).toBe(1);
    expect(rc.internal.getNumberOfPages()).toBe(1);
    save(q, 'life_quotation');
    save(dn, 'life_debit_note');
    save(rc, 'life_receipt');
  }, 60000);

  it('builds the group and individual policy schedules', async () => {
    const group = await buildLifePolicySchedulePdf(quotation, { members, riders, detail: { memberCount: 24, totalSumAssured: 7560000 } });
    const individual = await buildLifeIndividualPolicyPdf(
      { benefitUuid: 'b-1', firstName: 'Liya', fatherName: 'Girma', grandFatherName: 'Haile', gender: 'Female', dateOfBirth: '1990-03-02', personPhone: '+251922000111', policyNumber: 'ILP-2026-0042', insuranceTerm: 10, beginDate: '2026-11-01', endDate: '2036-10-31', termBenefit: 500000, termPremium: 4200, totalPremium: 5600, totalBenefit: 700000, status: 'ACTIVE' },
      { riders: [{ riderName: 'Accidental death benefit', benefits: 200000, premium: 1400 }], customer: { idType: 'NATIONAL_ID', idNumber: 'FAN-55120', occupation: 'Engineer', region: 'Addis Ababa' } },
    );
    expect(group.internal.getNumberOfPages()).toBeGreaterThan(0);
    save(group, 'life_policy_schedule');
    save(individual, 'life_individual_policy');
  }, 60000);

  it('builds the claim settlement advice', async () => {
    const doc = await buildLifeClaimSettlementPdf({
      claimUuid: 'c-1', claimNumberCode: 'LC-2026-0019', status: 'PAID', insuredName: 'Abebe Tesfaye', policyNumber: 'GL-000452',
      claimType: 'DEATH', eventDate: '2026-09-02', placeOfEvent: 'Addis Ababa', coverStart: '2026-01-01', coverEnd: '2026-12-31',
      notifiedByName: 'Hana Abebe', notifiedByRelationship: 'Spouse', notifiedByPhone: '+251911000222', claimedAmount: 300000, sumAssured: 300000,
      eligibleAmount: 300000, approvedAmount: 300000, deductions: [{ reason: 'Funeral advance paid', amount: 10000 }], outstandingPremiumDeducted: 1200, netPayable: 288800,
      payees: [
        { payeeUuid: 'p1', name: 'Hana Abebe', sharePercent: 60, bankName: 'CBE', accountNumber: '1000123456789', amount: 173280, paid: true },
        { payeeUuid: 'p2', name: 'Yonas Abebe', sharePercent: 40, bankName: 'Awash Bank', accountNumber: '0132004455', amount: 115520, paid: true },
      ],
      payments: [
        { payeeUuid: 'p1', amount: 173280, paymentVoucherNumber: 'PV-7701', paymentDate: '2026-10-28' },
        { payeeUuid: 'p2', amount: 115520, paymentVoucherNumber: 'PV-7702', paymentDate: '2026-10-28' },
      ],
    });
    expect(doc.internal.getNumberOfPages()).toBe(1);
    save(doc, 'life_claim_settlement');
  }, 60000);
});
