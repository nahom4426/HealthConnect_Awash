import { describe, it, expect, vi, beforeAll } from 'vitest';
import { readFileSync, writeFileSync } from 'node:fs';
import {
  amountInWords,
  buildQuotationPdf,
  buildDebitNotePdf,
  buildPremiumReceiptPdf,
  buildClaimPaymentAdvicePdf,
} from '../healthDocuments';

const quotation = {
  quotationUuid: 'q-1',
  quotationCode: 'QT-2026-0042',
  status: 'PAID',
  policyType: 'GROUP',
  type: 'QUOTATION',
  institutionName: 'Abay Trading PLC',
  issuedDate: '2026-10-20',
  totalPremium: 45000,
  totalSumInsured: 1500000,
  quoatedServices: [
    { packageName: 'Inpatient', planType: 'Individual_Plan', individualType: 'Member', numberOfInsured: 20, numberOfAdultMale: 12, numberOfAdultFemale: 8, sumAssured: 1000000, premium: 30000, discount: 0 },
    { packageName: 'Outpatient', planType: 'Family_Plan', numberOfInsured: 10, sumAssured: 500000, spouseSumAssured: 50000, premium: 15000, discount: 10 },
  ],
};

const save = (doc, name) => {
  const dir = process.env.PDF_OUT;
  if (dir) writeFileSync(`${dir}/${name}.pdf`, Buffer.from(doc.output('arraybuffer')));
};

describe('health payer PDFs', () => {
  // Serve the real logo files so the PDFs are drawn as in the browser.
  beforeAll(() => {
    vi.stubGlobal('fetch', async (url) => {
      const buf = readFileSync(`src/features/health/pdf/${String(url).split('/').pop()}`);
      return { blob: async () => new Blob([buf], { type: 'image/png' }) };
    });
  });

  it('writes amounts in words', () => {
    expect(amountInWords(45000)).toBe('Forty-Five Thousand Birr');
    expect(amountInWords(1250.5)).toBe('One Thousand Two Hundred Fifty Birr and Fifty Cents');
    expect(amountInWords(0)).toBe('Zero Birr');
  });

  it('builds the quotation, premium advice and debit note', async () => {
    const recipient = { name: 'Abay Trading PLC', tin: '0012345678', phone: '+251911000000', email: 'hr@abay.et', address: 'Bole, Addis Ababa' };
    const q = await buildQuotationPdf(quotation, recipient);
    const pa = await buildDebitNotePdf(quotation, recipient, { title: 'Premium Advice' });
    const dn = await buildDebitNotePdf({ ...quotation, status: 'UNPAID', policyDebitNumber: 'DN-000318', acceptedDate: '2026-10-22' }, recipient);
    expect(q.internal.getNumberOfPages()).toBe(1);
    expect(dn.internal.getNumberOfPages()).toBe(1);
    save(q, 'quotation');
    save(pa, 'premium_advice');
    save(dn, 'debit_note');
  }, 30000);

  it('builds the premium receipt from the recorded payment', async () => {
    const doc = await buildPremiumReceiptPdf(quotation, {
      receiptNumber: 'RC-7781', receiptDate: '2026-10-31', requestedPremium: 45000, revenueStamp: 5, withHoldingTax: 1350, netPremium: 43655,
    });
    expect(doc.internal.getNumberOfPages()).toBe(1);
    save(doc, 'receipt');
  });

  it('builds the claim payment advice', async () => {
    const services = Array.from({ length: 30 }, (_, i) => ({
      insuredName: `Member ${i + 1}`, providedDate: '2026-10-01', amount: 1200 + i,
      providedItemResponses: [{ itemName: 'Consultation' }, { itemName: 'CBC', extraAmount: 100 }],
    }));
    const doc = await buildClaimPaymentAdvicePdf(
      { claimUuid: 'c-1', batchCode: 'B-2026-10', institutionName: 'Abay Trading PLC', providerName: 'Hayat Hospital' },
      { amount: 36000, paymentType: 'BANK_TRANSFER', receiptNumber: 'CP-55', receiptDate: '2026-10-31', recipientType: 'INSTITUTION', recipientName: 'Abay Trading PLC', withHoldingTax: 720 },
      services,
    );
    expect(doc.internal.getNumberOfPages()).toBeGreaterThan(1);
    save(doc, 'claim_payment_advice');
  });
});
