// Payer-facing PDFs for the health module.
//   Quotation pages: the quotation offer and the premium advice issued on acceptance.
//   Finance pages:   the debit note for an unpaid premium, the official receipt once it is paid,
//                    and the payment advice when a claim is settled.
// Drawn with the shared branded toolkit (features/shared/pdf/brandedPdf.js).
import {
  COMPANY,
  NAVY,
  SUBTLE,
  M,
  money,
  num,
  dateText,
  text,
  pick,
  humanize,
  amountInWords,
  newDoc,
  drawLetterhead,
  drawHero,
  drawPanels,
  sectionTitle,
  drawTable,
  drawTotals,
  drawParagraph,
  drawSignOff,
  finishPages,
  savePdf,
} from '@/features/shared/pdf/brandedPdf';

export { money, amountInWords, savePdf } from '@/features/shared/pdf/brandedPdf';

const DIVISION = 'Health Insurance';
const WHT_RATE = 3; // %, same default the premium payment form uses

// ─── Shared quotation pieces ──────────────────────────────────────────────────
// The quotation view pages keep the payer in `institutionForm` / `individualForm`; map either to
// the recipient shape the builders take.
export function payerFromForms(isIndividual, institutionForm = {}, individualForm = {}) {
  if (isIndividual) {
    const f = individualForm;
    return { name: f.fullName, idNumber: f.idNumber, phone: f.phone, email: f.email, address: f.address };
  }
  const f = institutionForm;
  return { name: f.institutionName, tin: f.tinNumber, phone: f.telephone, email: f.email, address: f.address };
}

// `recipient` is whatever the page knows about the payer: { name, email, phone, tin, address, idNumber }.
function recipientPanel(title, q, recipient = {}) {
  const individual = String(q?.policyType || '').toUpperCase() === 'INDIVIDUAL';
  const rows = [['Name', recipient.name || q?.institutionName || q?.insuredName]];
  if (individual) rows.push(['ID number', recipient.idNumber]);
  else rows.push(['TIN', recipient.tin || q?.tinNumber]);
  rows.push(['Phone', recipient.phone || q?.institutionPhone], ['Email', recipient.email], ['Address', recipient.address]);
  const filled = rows.filter(([, v]) => v && String(v).trim() && String(v).trim() !== ',');
  return { title, rows: filled.length ? filled : [['Name', '—']] };
}

function serviceRows(q) {
  return (q?.quoatedServices || []).map((s, i) => {
    const premium = num(s.premium);
    const discount = num(s.discount);
    const gross = discount > 0 && discount < 100 ? premium / (1 - discount / 100) : premium;
    const insured = num(s.numberOfInsured);
    const male = num(s.numberOfAdultMale);
    const female = num(s.numberOfAdultFemale);
    const sumLines = [money(s.sumAssured ?? s.sumInsured)];
    if (num(s.spouseSumAssured) > 0) sumLines.push(`Spouse ${money(s.spouseSumAssured)}`);
    if (num(s.depSumAssured) > 0) sumLines.push(`Dependent ${money(s.depSumAssured)}`);
    const members = [String(insured || male + female || '—')];
    if (male || female) members.push(`M ${male} / F ${female}`);
    return {
      gross,
      premium,
      sumInsured: num(s.sumAssured ?? s.sumInsured),
      cells: [
        String(i + 1),
        [s.packageName || 'Package', s.benefitGroupCode ? `Group ${s.benefitGroupCode}` : ''].filter(Boolean).join('\n'),
        [humanize(s.planType), s.individualType ? humanize(s.individualType) : ''].filter(Boolean).join('\n'),
        members.join('\n'),
        sumLines.join('\n'),
        discount > 0 ? `${discount}%` : '—',
        money(premium),
      ],
    };
  });
}

const PACKAGE_HEAD = ['#', 'Package', 'Plan', 'Members', 'Sum insured', 'Discount', 'Premium'];
const PACKAGE_COLUMNS = {
  0: { cellWidth: 24, halign: 'center', textColor: SUBTLE },
  1: { fontStyle: 'bold' },
  3: { halign: 'center' },
  4: { halign: 'right' },
  5: { halign: 'center', cellWidth: 54 },
  6: { halign: 'right', fontStyle: 'bold', textColor: NAVY },
};

// Gross/discount/net figures for a quotation, from its packages when it has them.
function premiumFigures(q) {
  const rows = serviceRows(q);
  const gross = rows.reduce((s, r) => s + r.gross, 0);
  const net = rows.length ? rows.reduce((s, r) => s + r.premium, 0) : num(q?.totalPremium);
  const total = num(q?.totalPremium) || net;
  const discount = gross - net > 0.005 ? gross - net : 0;
  const sumInsured = q?.totalSumInsured ?? rows.reduce((s, r) => s + r.sumInsured, 0);
  return { rows, gross, discount, total, sumInsured };
}

function quotationNumber(q) {
  return q?.quotationCode || q?.quotationNumber || q?.quotationUuid;
}

function debitNumber(q) {
  return q?.policyDebitNumber || q?.debitNoteNumber || (quotationNumber(q) ? `DN-${quotationNumber(q)}` : undefined);
}

function qrPayload(kind, ref, amount, date) {
  return [COMPANY, `${kind} ${text(ref)}`, money(amount), dateText(date)].join('\n');
}

// ─── Quotation ────────────────────────────────────────────────────────────────
export async function buildQuotationPdf(q, recipient = {}) {
  const { doc, autoTable, logo } = await newDoc();
  const number = quotationNumber(q);
  const issued = q?.issuedDate || q?.createdDate || q?.createdAt || new Date();
  const f = premiumFigures(q);

  let y = drawLetterhead(doc, logo, 'Quotation', DIVISION);
  y = drawHero(doc, y, {
    amountLabel: 'Total premium',
    amount: money(f.total),
    facts: [['Quotation no.', number], ['Issued', dateText(issued)], ['Sum insured', money(f.sumInsured)]],
    status: q?.status,
  });

  y = drawPanels(doc, y, recipientPanel('Prepared for', q, recipient), {
    title: 'Quotation details',
    rows: [
      ['Quotation no.', number],
      ['Policy type', humanize(q?.policyType)],
      ['Type', humanize(q?.type || 'Quotation')],
      ['Issued on', dateText(issued)],
      ['Valid until', q?.expiryDate || q?.validUntil ? dateText(q.expiryDate || q.validUntil) : undefined],
      ['Coverage', q?.startDate ? `${dateText(q.startDate)} – ${dateText(q.endDate)}` : undefined],
    ].filter(([, v]) => v !== undefined),
  });

  y = sectionTitle(doc, y, 'Benefit packages');
  y = drawTable(doc, autoTable, y, PACKAGE_HEAD,
    f.rows.length ? f.rows.map((r) => r.cells) : [['', 'No packages on this quotation', '', '', '', '', '']], PACKAGE_COLUMNS);

  const totals = [['Total sum insured', money(f.sumInsured)]];
  if (f.discount) totals.push(['Gross premium', money(f.gross)], ['Discount', `- ${money(f.discount)}`]);
  totals.push(['Total premium', money(f.total)]);
  y = drawTotals(doc, y, totals, {
    title: 'Next steps',
    body: 'Accept this quotation to receive the premium advice and debit note. Cover starts once the premium is paid and receipted.',
  });

  y = drawParagraph(doc, y, 'Amount in words', amountInWords(f.total));
  if (q?.description) y = drawParagraph(doc, y, 'Remarks', String(q.description));
  y = drawParagraph(doc, y, 'Terms',
    'Premiums are calculated on the member counts and sums insured shown above and may be revised if the final member list differs. This quotation does not constitute cover.');
  await drawSignOff(doc, y, ['Prepared by', 'Authorized signature & stamp'], qrPayload('Quotation', number, f.total, issued));
  finishPages(doc, number);
  return doc;
}

// ─── Debit note / premium advice ──────────────────────────────────────────────
// The bill for an accepted quotation. Finance prints it as a "Debit Note"; the quotation flow
// issues the same document as a "Premium Advice".
export async function buildDebitNotePdf(q, recipient = {}, { title = 'Debit Note' } = {}) {
  const { doc, autoTable, logo } = await newDoc();
  const number = debitNumber(q);
  const quotation = quotationNumber(q);
  const today = new Date();
  const f = premiumFigures(q);
  const stamp = num(pick(q, 'revenueStamp'));
  const due = f.total + stamp;
  const wht = Math.round(f.total * WHT_RATE) / 100;

  let y = drawLetterhead(doc, logo, title, DIVISION);
  y = drawHero(doc, y, {
    amountLabel: 'Amount due',
    amount: money(due),
    facts: [['Debit note no.', number], ['Issue date', dateText(today)], ['Payment terms', 'Due on receipt']],
    status: String(q?.status || '').toUpperCase() === 'PAID' ? 'PAID' : 'UNPAID',
  });

  y = drawPanels(doc, y, recipientPanel('Bill to', q, recipient), {
    title: 'Policy details',
    rows: [
      ['Debit note no.', number],
      ['Quotation no.', quotation],
      ['Policy type', humanize(q?.policyType)],
      ['Transaction', humanize(q?.type || 'Quotation')],
      ['Accepted on', q?.acceptedDate ? dateText(q.acceptedDate) : undefined],
      ['PO date', q?.poDate ? dateText(q.poDate) : undefined],
      ['Coverage', q?.startDate ? `${dateText(q.startDate)} – ${dateText(q.endDate)}` : undefined],
      ['Sum insured', money(f.sumInsured)],
    ].filter(([, v]) => v !== undefined),
  });

  y = sectionTitle(doc, y, 'Premium breakdown');
  y = drawTable(doc, autoTable, y, PACKAGE_HEAD,
    f.rows.length
      ? f.rows.map((r) => r.cells)
      : [['1', `Health insurance premium — ${humanize(q?.type || 'Quotation')}`, humanize(q?.policyType), '—', money(f.sumInsured), '—', money(f.total)]],
    PACKAGE_COLUMNS);

  const totals = [];
  if (f.discount) totals.push(['Gross premium', money(f.gross)], ['Discount', `- ${money(f.discount)}`]);
  totals.push(['Net premium', money(f.total)]);
  if (stamp) totals.push(['Revenue stamp', `+ ${money(stamp)}`]);
  totals.push(['Amount due', money(due)]);
  y = drawTotals(doc, y, totals, {
    title: 'Withholding tax',
    body: `If you are a withholding agent, deduct ${WHT_RATE}% (${money(wht)}) and pay ${money(due - wht)}. Send us the withholding tax receipt so it can be reconciled on your official receipt.`,
  });

  y = drawParagraph(doc, y, 'Amount due in words', amountInWords(due));
  y = drawParagraph(doc, y, 'Payment instructions',
    `Please pay ${money(due)} to ${COMPANY} quoting debit note ${text(number)} and quotation ${text(quotation)}. Cover is subject to receipt of the premium; an official receipt is issued once payment is confirmed.`);
  await drawSignOff(doc, y, ['Prepared by', 'Checked by', 'Authorized by'], qrPayload(title, number, due, today));
  finishPages(doc, number);
  return doc;
}

export async function downloadDebitNotePdf(q, recipient, options = {}) {
  const doc = await buildDebitNotePdf(q, recipient, options);
  const prefix = (options.title || 'Debit Note').replace(/\s+/g, '_');
  savePdf(doc, `${prefix}_${debitNumber(q) || 'premium'}`);
}

// kind 'premiumAdvice' issues the debit note under the premium advice title.
export async function downloadQuotationPdf(q, recipient, kind = 'quotation') {
  if (kind === 'premiumAdvice') return downloadDebitNotePdf(q, recipient, { title: 'Premium Advice' });
  const doc = await buildQuotationPdf(q, recipient);
  savePdf(doc, `Quotation_${quotationNumber(q) || 'draft'}`);
}

// ─── Premium receipt ──────────────────────────────────────────────────────────
// `payment` is the payment just recorded ({ receiptNumber, receiptDate, requestedPremium,
// revenueStamp, withHoldingTax, netPremium }); when omitted it is read off the quotation.
export async function buildPremiumReceiptPdf(q, payment = {}, recipient = {}) {
  const { doc, autoTable, logo } = await newDoc();
  const read = (key, ...alts) => payment[key] ?? pick(q, key, ...alts);

  const receiptNumber = read('receiptNumber', 'receiptNo');
  const receiptDate = read('receiptDate', 'paidDate', 'paymentDate');
  const requested = num(read('requestedPremium') ?? q?.totalPremium);
  const stamp = num(read('revenueStamp'));
  const wht = num(read('withHoldingTax', 'withholdingTax'));
  const netRaw = read('netPremium', 'paidAmount', 'amountPaid');
  const netPaid = netRaw !== undefined ? num(netRaw) : Math.max(0, requested + stamp - wht);
  const number = quotationNumber(q);

  let y = drawLetterhead(doc, logo, 'Official Receipt', DIVISION);
  y = drawHero(doc, y, {
    amountLabel: 'Amount received',
    amount: money(netPaid),
    facts: [['Receipt no.', receiptNumber], ['Receipt date', dateText(receiptDate)], ['Debit note no.', debitNumber(q)]],
    status: 'PAID',
  });

  y = drawPanels(doc, y, recipientPanel('Received from', q, recipient), {
    title: 'Payment details',
    rows: [
      ['Receipt no.', receiptNumber],
      ['Receipt date', dateText(receiptDate)],
      ['Debit note no.', debitNumber(q)],
      ['Quotation no.', number],
      ['Policy type', humanize(q?.policyType)],
      ['Transaction', humanize(q?.type || 'Quotation')],
      ['Sum insured', money(q?.totalSumInsured)],
    ],
  });

  y = sectionTitle(doc, y, 'Payment for');
  y = drawTable(doc, autoTable, y, ['Description', 'Debit note', 'Quotation', 'Amount'],
    [[`Health insurance premium — ${humanize(q?.type || 'Quotation')}`, text(debitNumber(q)), text(number), money(requested)]],
    { 0: { fontStyle: 'bold' }, 3: { halign: 'right', fontStyle: 'bold', textColor: NAVY } });

  const totals = [['Premium', money(requested)]];
  if (stamp) totals.push(['Revenue stamp', `+ ${money(stamp)}`]);
  if (wht) totals.push([`Withholding tax`, `- ${money(wht)}`]);
  totals.push(['Net amount received', money(netPaid)]);
  y = drawTotals(doc, y, totals, wht
    ? { title: 'Withholding tax', body: `${money(wht)} was withheld by the payer. Please forward the withholding tax receipt to ${COMPANY}` }
    : { title: 'Thank you', body: 'Payment received in full. Keep this receipt as proof of premium payment.' });

  y = drawParagraph(doc, y, 'Amount received in words', amountInWords(netPaid));
  y = drawParagraph(doc, y, 'Note', `Received with thanks. This receipt confirms payment of the premium for quotation ${text(number)}.`);
  await drawSignOff(doc, y, ['Cashier', 'Finance officer'], qrPayload('Receipt', receiptNumber || number, netPaid, receiptDate));
  finishPages(doc, receiptNumber || number);
  return doc;
}

export async function downloadPremiumReceiptPdf(q, payment, recipient) {
  const doc = await buildPremiumReceiptPdf(q, payment, recipient);
  savePdf(doc, `Receipt_${payment?.receiptNumber || pick(q, 'receiptNumber') || quotationNumber(q) || 'premium'}`);
}

// ─── Claim payment advice ─────────────────────────────────────────────────────
// claim: { claimUuid, batchCode, institutionName, providerName }
// payment: the settle request ({ amount, paymentType, checkNumber, receiptNumber, receiptDate,
//          withHoldingTax, revenueStamp, recipientType, recipientName })
// services: the service-provided rows being settled.
export async function buildClaimPaymentAdvicePdf(claim = {}, payment = {}, services = []) {
  const { doc, autoTable, logo } = await newDoc();
  const first = services[0] || {};
  const reference = payment.receiptNumber || claim.batchCode || claim.claimUuid;
  const amount = num(payment.amount);

  let y = drawLetterhead(doc, logo, 'Claim Payment Advice', DIVISION);
  y = drawHero(doc, y, {
    amountLabel: 'Amount settled',
    amount: money(amount),
    facts: [['Reference', reference], ['Payment date', dateText(payment.receiptDate)], ['Services', String(services.length)]],
    status: 'SETTLED',
  });

  y = drawPanels(
    doc,
    y,
    {
      title: 'Paid to',
      rows: [
        ['Payee', payment.recipientName || claim.institutionName || first.institutionName],
        ['Payee type', humanize(payment.recipientType)],
        ['Institution', claim.institutionName || first.institutionName],
        ['Provider', claim.providerName || first.providerName],
      ],
    },
    {
      title: 'Payment details',
      rows: [
        ['Method', humanize(payment.paymentType)],
        ...(payment.checkNumber ? [['Cheque no.', payment.checkNumber]] : []),
        ['Receipt no.', payment.receiptNumber],
        ['Payment date', dateText(payment.receiptDate)],
        ['Batch code', claim.batchCode],
      ],
    },
  );

  const body = services.map((s, i) => {
    const items = (s.providedItemResponses || []).map((it) => it.itemName).filter(Boolean);
    const extra = (s.providedItemResponses || []).reduce((sum, it) => sum + num(it.extraAmount), 0);
    const patient = [s.insuredName, s.dependantName ? `Dep: ${s.dependantName}` : ''].filter(Boolean).join('\n');
    return [
      String(i + 1),
      patient || '—',
      dateText(s.providedDate),
      items.length ? items.slice(0, 4).join(', ') + (items.length > 4 ? ` +${items.length - 4} more` : '') : '—',
      money(num(s.amount) - extra),
    ];
  });
  y = sectionTitle(doc, y, 'Services settled');
  y = drawTable(doc, autoTable, y, ['#', 'Insured', 'Service date', 'Items', 'Amount'], body.length ? body : [['', 'No services', '', '', '']], {
    0: { cellWidth: 24, halign: 'center', textColor: SUBTLE },
    1: { fontStyle: 'bold' },
    2: { cellWidth: 80 },
    4: { halign: 'right', fontStyle: 'bold', textColor: NAVY, cellWidth: 95 },
  });

  const totals = [];
  if (num(payment.withHoldingTax)) totals.push(['Withholding tax', money(payment.withHoldingTax)]);
  if (num(payment.revenueStamp)) totals.push(['Revenue stamp', money(payment.revenueStamp)]);
  totals.push(['Amount settled', money(amount)]);
  y = drawTotals(doc, y, totals, {
    title: 'Reference',
    body: `Please quote ${text(reference)} in any correspondence about this payment.`,
  });

  y = drawParagraph(doc, y, 'Amount in words', amountInWords(amount));
  await drawSignOff(doc, y, ['Prepared by', 'Approved by'], qrPayload('Claim payment', reference, amount, payment.receiptDate));
  finishPages(doc, claim.claimUuid || reference);
  return doc;
}

export async function downloadClaimPaymentAdvicePdf(claim, payment, services) {
  const doc = await buildClaimPaymentAdvicePdf(claim, payment, services);
  savePdf(doc, `Claim_Payment_Advice_${payment?.receiptNumber || claim?.batchCode || 'claim'}`);
}
