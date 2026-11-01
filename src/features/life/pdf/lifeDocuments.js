// Client-facing PDFs for the life module, drawn with the shared branded toolkit.
//   Group quotations: the quotation, the debit note once accepted, the official receipt once paid
//                     and the policy schedule once the policy is issued.
//   Individual policies: the policy schedule.
//   Claims: the settlement advice once the claim is authorized / paid.
// Every amount is the backend's; nothing is calculated here except column totals for display.
import {
  COMPANY,
  NAVY,
  SUBTLE,
  money,
  num,
  dateText,
  text,
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
import { insuredName } from '../quotations/quotationRules';
import { benefitName } from '../individual/individualRules';
import { idTypeLabel } from '../individual/customerRules';
import { claimTypeLabel } from '../claims/claimRules';

const DIVISION = 'Life Insurance';

const has = (v) => v !== null && v !== undefined && v !== '';
const amount = (v) => (has(v) ? money(v) : '—');
const period = (from, to) => (from ? `${dateText(from)} – ${dateText(to)}` : undefined);
const years = (n) => (n ? `${n} year${Number(n) === 1 ? '' : 's'}` : undefined);
const qrText = (kind, ref, value, date) => [COMPANY, `${kind} ${text(ref)}`, money(value), dateText(date)].join('\n');
// Panel rows: drop the ones the backend left empty
const rowsOf = (pairs) => pairs.filter(([, v]) => has(v));

function institutionPanel(title, q) {
  const rows = rowsOf([
    ['Institution', q.institutionName],
    ['Contact person', q.contactPersonFullName],
    ['Phone', q.contactPhone],
    ['Life insurance no.', q.institutionLifeInsuranceNumber],
    ['PO number', q.poNumber],
  ]);
  return { title, rows: rows.length ? rows : [['Institution', '—']] };
}

// Members table, one line per member: name, ID, gender, date of birth, sum assured, premium.
function memberTable(doc, autoTable, y, members = []) {
  const body = members.map((p, i) => [
    String(i + 1),
    insuredName(p) || '—',
    p.insuranceId || '—',
    p.gender || '—',
    dateText(p.birthDate),
    amount(p.sumAssured),
    amount(p.premium),
  ]);
  y = sectionTitle(doc, y, `Insured members (${members.length})`);
  y = drawTable(doc, autoTable, y, ['#', 'Member', 'ID', 'Gender', 'Born', 'Sum assured', 'Premium'],
    body.length ? body : [['', 'No members listed', '', '', '', '', '']], {
      0: { cellWidth: 26, halign: 'center', textColor: SUBTLE },
      1: { fontStyle: 'bold' },
      2: { cellWidth: 62, textColor: SUBTLE },
      3: { cellWidth: 50 },
      4: { cellWidth: 72 },
      5: { halign: 'right' },
      6: { halign: 'right', fontStyle: 'bold', textColor: NAVY },
    });
  return y;
}

// riders: [{ riderName, sumAssured | benefits, premium }]
function riderTable(doc, autoTable, y, riders = [], { benefitKey = 'sumAssured' } = {}) {
  if (!riders.length) return y;
  y = sectionTitle(doc, y, 'Riders');
  return drawTable(doc, autoTable, y, ['Rider', 'Sum assured', 'Premium'],
    riders.map((r) => [r.riderName || 'Rider', amount(r[benefitKey] ?? r.sumAssured), amount(r.premium)]), {
      0: { fontStyle: 'bold' },
      1: { halign: 'right' },
      2: { halign: 'right', fontStyle: 'bold', textColor: NAVY },
    });
}

const totalSumAssured = (members) => members.reduce((s, p) => s + num(p.sumAssured), 0);

function premiumTotals(q, finalLabel, finalValue) {
  return [
    ...(has(q.termPremium) ? [['Term premium', money(q.termPremium)]] : []),
    ...(has(q.riderPremium) ? [['Rider premium', money(q.riderPremium)]] : []),
    [finalLabel, money(finalValue)],
  ];
}

const grossDue = (q) => q.grossPremium ?? q.requestedPremium;

// ─── Group quotation ──────────────────────────────────────────────────────────
export async function buildLifeQuotationPdf(q, { members = [], riders = [] } = {}) {
  const { doc, autoTable, logo } = await newDoc();
  const number = q.quotationNumber || 'Draft';
  const issued = q.issueDate || q.createdAt || new Date();
  const gross = grossDue(q);

  let y = drawLetterhead(doc, logo, 'Group Life Quotation', DIVISION);
  y = drawHero(doc, y, {
    amountLabel: 'Gross premium',
    amount: amount(gross),
    facts: [['Quotation no.', number], ['Issued', dateText(issued)], ['Members', String(members.length)]],
    status: q.quotationStatus === 'PENDING' ? 'DRAFT' : q.quotationStatus,
  });
  y = drawPanels(doc, y, institutionPanel('Prepared for', q), {
    title: 'Quotation details',
    rows: rowsOf([
      ['Quotation no.', number],
      ['Product', 'Group term life'],
      ['Term', years(q.term)],
      ['Proposed cover', period(q.beginDate, q.endDate)],
      ['Free cover limit', has(q.fclAmount) ? money(q.fclAmount) : undefined],
      ['Prepared by', q.quotedByFullName],
    ]),
  });

  y = memberTable(doc, autoTable, y, members);
  y = riderTable(doc, autoTable, y, riders);
  y = drawTotals(doc, y, [['Total sum assured', money(totalSumAssured(members))], ...premiumTotals(q, 'Gross premium', gross)], {
    title: 'Next steps',
    body: 'Confirm acceptance to receive the debit note. Cover starts once the premium is paid and the policy is issued.',
  });
  y = drawParagraph(doc, y, 'Amount in words', amountInWords(gross));
  y = drawParagraph(doc, y, 'Terms',
    'Premiums are based on the members, ages and sums assured listed above and are fixed once the quotation is issued. Members above the free cover limit may need medical evidence before cover is confirmed. This quotation does not constitute cover.');
  await drawSignOff(doc, y, ['Prepared by', 'Authorized signature & stamp'], qrText('Life quotation', number, gross, issued));
  finishPages(doc, number);
  return doc;
}

// ─── Group debit note ─────────────────────────────────────────────────────────
export async function buildLifeDebitNotePdf(q, { members = [] } = {}) {
  const { doc, autoTable, logo } = await newDoc();
  const number = q.debitNoteNumber || (q.quotationNumber ? `DN-${q.quotationNumber}` : undefined);
  const today = new Date();
  const gross = grossDue(q);

  let y = drawLetterhead(doc, logo, 'Debit Note', DIVISION);
  y = drawHero(doc, y, {
    amountLabel: 'Amount due',
    amount: amount(gross),
    facts: [['Debit note no.', number], ['Issue date', dateText(today)], ['Payment terms', 'Due on receipt']],
    status: q.quotationStatus === 'PAID' ? 'PAID' : 'UNPAID',
  });
  y = drawPanels(doc, y, institutionPanel('Bill to', q), {
    title: 'Policy details',
    rows: rowsOf([
      ['Debit note no.', number],
      ['Quotation no.', q.quotationNumber],
      ['Product', 'Group term life'],
      ['Term', years(q.term)],
      ['Cover', period(q.beginDate, q.endDate)],
      ['Accepted on', q.acceptedDate && dateText(q.acceptedDate)],
      ['Members', members.length ? String(members.length) : undefined],
    ]),
  });

  y = sectionTitle(doc, y, 'Premium');
  y = drawTable(doc, autoTable, y, ['Description', 'Reference', 'Amount'], [
    ...(has(q.termPremium) ? [['Group term life premium', text(q.quotationNumber), money(q.termPremium)]] : []),
    ...(has(q.riderPremium) && num(q.riderPremium) ? [['Rider premium', text(q.quotationNumber), money(q.riderPremium)]] : []),
    ...(!has(q.termPremium) ? [['Group life premium', text(q.quotationNumber), amount(gross)]] : []),
  ], { 0: { fontStyle: 'bold' }, 2: { halign: 'right', fontStyle: 'bold', textColor: NAVY } });

  // Taxes appear only when the system has calculated them (calculated* fields)
  const calc = Object.keys(q).filter((k) => k.startsWith('calculated') && has(q[k]));
  y = drawTotals(doc, y, [
    ...calc.map((k) => [k.replace(/^calculated/, '').replace(/([A-Z])/g, ' $1').trim(), money(q[k])]),
    ['Amount due', money(gross)],
  ], {
    title: 'Taxes',
    body: 'Withholding tax and revenue stamp, where they apply, are reconciled on the official receipt. If you withhold tax, send us the withholding tax receipt.',
  });
  y = drawParagraph(doc, y, 'Amount due in words', amountInWords(gross));
  y = drawParagraph(doc, y, 'Payment instructions',
    `Please pay ${amount(gross)} to ${COMPANY} quoting debit note ${text(number)}. The policy is issued once the payment is recorded.`);
  await drawSignOff(doc, y, ['Prepared by', 'Checked by', 'Authorized by'], qrText('Debit note', number, gross, today));
  finishPages(doc, number);
  return doc;
}

// ─── Group premium receipt ────────────────────────────────────────────────────
// `payment` is the payment just recorded (the form values); otherwise it is read off the quotation.
export async function buildLifeReceiptPdf(q, payment = {}) {
  const { doc, autoTable, logo } = await newDoc();
  const receiptNumber = payment.receiptNumber ?? q.receiptNumber;
  const receiptDate = payment.receiptDate ?? q.receiptDate ?? q.paidDate;
  const gross = q.requestedPremium ?? grossDue(q);
  const wht = payment.withHoldingTax ?? q.withHoldingTax;
  const stamp = payment.revenueStamp ?? q.revenueStamp;
  const net = payment.netPremium ?? q.netPremium ?? gross;

  let y = drawLetterhead(doc, logo, 'Official Receipt', DIVISION);
  y = drawHero(doc, y, {
    amountLabel: 'Amount received',
    amount: amount(net),
    facts: [['Receipt no.', receiptNumber], ['Receipt date', dateText(receiptDate)], ['Quotation no.', q.quotationNumber]],
    status: 'PAID',
  });
  y = drawPanels(doc, y, institutionPanel('Received from', q), {
    title: 'Payment details',
    rows: rowsOf([
      ['Receipt no.', receiptNumber],
      ['Receipt date', dateText(receiptDate)],
      ['Quotation no.', q.quotationNumber],
      ['Product', 'Group term life'],
      ['Term', years(q.term)],
      ['Recorded by', q.paidByFullName],
    ]),
  });
  y = sectionTitle(doc, y, 'Payment for');
  y = drawTable(doc, autoTable, y, ['Description', 'Quotation', 'Amount'],
    [['Group term life premium', text(q.quotationNumber), amount(gross)]],
    { 0: { fontStyle: 'bold' }, 2: { halign: 'right', fontStyle: 'bold', textColor: NAVY } });

  const totals = [['Gross premium', amount(gross)]];
  if (has(stamp) && num(stamp)) totals.push(['Revenue stamp', money(stamp)]);
  if (has(wht) && num(wht)) totals.push(['Withholding tax', money(wht)]);
  totals.push(['Net amount received', amount(net)]);
  y = drawTotals(doc, y, totals, num(wht)
    ? { title: 'Withholding tax', body: `${money(wht)} was withheld by the payer. Please forward the withholding tax receipt to ${COMPANY}` }
    : { title: 'Thank you', body: 'Payment received. The group policy is issued from this quotation.' });
  y = drawParagraph(doc, y, 'Amount received in words', amountInWords(net));
  await drawSignOff(doc, y, ['Cashier', 'Finance officer'], qrText('Receipt', receiptNumber, net, receiptDate));
  finishPages(doc, receiptNumber || q.quotationNumber);
  return doc;
}

// ─── Group policy schedule ────────────────────────────────────────────────────
// detail: GET /policy/{uuid} figures when the page has them ({ memberCount, totalSumAssured, ... }).
export async function buildLifePolicySchedulePdf(q, { members = [], riders = [], detail = {} } = {}) {
  const { doc, autoTable, logo } = await newDoc();
  const number = q.policyNumber || q.institutionLifeInsuranceNumber || q.quotationNumber;
  const sumAssured = detail.totalSumAssured ?? totalSumAssured(members);

  let y = drawLetterhead(doc, logo, 'Policy Schedule', DIVISION);
  y = drawHero(doc, y, {
    amountLabel: 'Sum assured in force',
    amount: money(sumAssured),
    facts: [['Policy no.', number], ['Cover ends', dateText(q.endDate)], ['Members', String(detail.memberCount ?? members.length)]],
    status: q.policyStatus || 'ACTIVE',
  });
  y = drawPanels(doc, y, institutionPanel('Policyholder', q), {
    title: 'Policy details',
    rows: rowsOf([
      ['Policy no.', number],
      ['Product', 'Group term life'],
      ['Term', years(q.term)],
      ['Cover period', period(q.beginDate, q.endDate)],
      ['Issued on', q.policyIssuedDate && dateText(q.policyIssuedDate)],
      ['Quotation no.', q.quotationNumber],
      ['Free cover limit', has(q.fclAmount) ? money(q.fclAmount) : undefined],
    ]),
  });

  y = memberTable(doc, autoTable, y, members);
  y = riderTable(doc, autoTable, y, riders);
  y = drawTotals(doc, y, [
    ...premiumTotals(q, 'Gross premium', grossDue(q)),
    ...(has(q.netPremium) ? [['Net premium paid', money(q.netPremium)]] : []),
  ], {
    title: 'Cover',
    body: 'Each member is covered for the sum assured shown, for death from any cause during the cover period, plus the riders listed, subject to the policy terms and exclusions.',
  });
  y = drawParagraph(doc, y, 'Important',
    'This schedule forms part of the policy. Notify us of joiners and leavers so cover and premium stay correct. Claims must be reported promptly with the documents listed in the policy.');
  await drawSignOff(doc, y, ['Underwriter', 'Authorized signature & stamp'], qrText('Policy', number, sumAssured, q.policyIssuedDate));
  finishPages(doc, number);
  return doc;
}

// ─── Individual policy schedule ───────────────────────────────────────────────
// b: BenefitResponse; riders: rider benefits with riderName; customer: the linked policyholder.
export async function buildLifeIndividualPolicyPdf(b, { riders = [], customer = {} } = {}) {
  const { doc, autoTable, logo } = await newDoc();
  const number = b.policyNumber || 'Draft';
  const name = benefitName(b) || [customer.firstName, customer.fatherName, customer.grandFatherName].filter(Boolean).join(' ');

  let y = drawLetterhead(doc, logo, 'Policy Schedule', DIVISION);
  y = drawHero(doc, y, {
    amountLabel: 'Total benefit',
    amount: amount(b.totalBenefit ?? b.termBenefit),
    facts: [['Policy no.', number], ['Cover ends', dateText(b.endDate)], ['Total premium', amount(b.totalPremium)]],
    status: b.status,
  });
  y = drawPanels(doc, y, {
    title: 'Policyholder',
    rows: rowsOf([
      ['Name', name],
      ['ID', [idTypeLabel(customer.idType), customer.idNumber].filter(Boolean).join(' ')],
      ['Gender', b.gender],
      ['Date of birth', (b.dateOfBirth || customer.dateOfBirth) && dateText(b.dateOfBirth || customer.dateOfBirth)],
      ['Phone', b.personPhone || customer.phone],
      ['Occupation', customer.occupation],
      ['Region', customer.region],
    ]),
  }, {
    title: 'Policy details',
    rows: rowsOf([
      ['Policy no.', number],
      ['Product', 'Individual term life'],
      ['Term', years(b.insuranceTerm)],
      ['Cover period', period(b.beginDate, b.endDate)],
      ['Payment frequency', b.paymentFrequency && humanize(b.paymentFrequency)],
    ]),
  });

  y = sectionTitle(doc, y, 'Benefits');
  y = drawTable(doc, autoTable, y, ['Cover', 'Sum assured', 'Premium'], [
    ['Term life (death benefit)', amount(b.termBenefit), amount(b.termPremium)],
    ...riders.map((r) => [r.riderName || 'Rider', amount(r.benefits), amount(r.premium)]),
  ], { 0: { fontStyle: 'bold' }, 1: { halign: 'right' }, 2: { halign: 'right', fontStyle: 'bold', textColor: NAVY } });

  y = drawTotals(doc, y, [['Total benefit', amount(b.totalBenefit)], ['Total premium', amount(b.totalPremium)]], {
    title: 'Beneficiaries',
    body: 'Benefits are paid to the beneficiaries recorded on this policy. Keep them up to date with us.',
  });
  y = drawParagraph(doc, y, 'Important',
    'This schedule forms part of the policy. Pay premiums on time to keep the cover in force; cover lapses if premiums remain unpaid after the grace period.');
  await drawSignOff(doc, y, ['Underwriter', 'Authorized signature & stamp'], qrText('Policy', number, b.totalBenefit ?? b.termBenefit, b.beginDate));
  finishPages(doc, number);
  return doc;
}

// ─── Claim settlement advice ──────────────────────────────────────────────────
export async function buildLifeClaimSettlementPdf(c) {
  const { doc, autoTable, logo } = await newDoc();
  const number = c.claimNumberCode || c.claimUuid;
  const payments = c.payments || [];
  const paymentFor = (id) => payments.find((p) => p.payeeUuid === id) || {};
  const lastPaid = payments.map((p) => p.paymentDate).filter(Boolean).sort().pop();
  const payable = c.netPayable ?? c.approvedAmount;

  let y = drawLetterhead(doc, logo, 'Claim Settlement Advice', DIVISION);
  y = drawHero(doc, y, {
    amountLabel: 'Net payable',
    amount: amount(payable),
    facts: [['Claim no.', number], ['Policy no.', c.policyNumber], ['Paid on', lastPaid ? dateText(lastPaid) : 'Pending']],
    status: c.status === 'PAID' ? 'SETTLED' : c.status,
  });
  y = drawPanels(doc, y, {
    title: 'Claim',
    rows: rowsOf([
      ['Insured', c.insuredName],
      ['Policy no.', c.policyNumber],
      ['Claim type', [claimTypeLabel(c.claimType), c.riderName].filter(Boolean).join(' · ')],
      ['Date of event', c.eventDate && dateText(c.eventDate)],
      ['Place of event', c.placeOfEvent],
      ['Cover', period(c.coverStart, c.coverEnd)],
    ]),
  }, {
    title: 'Notified by',
    rows: rowsOf([
      ['Name', c.notifiedByName],
      ['Relationship', c.notifiedByRelationship],
      ['Phone', c.notifiedByPhone],
      ['Amount claimed', has(c.claimedAmount) ? money(c.claimedAmount) : undefined],
      ['Sum assured', has(c.sumAssured) ? money(c.sumAssured) : undefined],
    ]).concat(c.notifiedByName ? [] : [['Name', '—']]),
  });

  const payees = c.payees || [];
  y = sectionTitle(doc, y, 'Payees');
  y = drawTable(doc, autoTable, y, ['Payee', 'Share', 'Bank account', 'Voucher', 'Paid on', 'Amount'],
    payees.length ? payees.map((p) => {
      const pay = paymentFor(p.payeeUuid);
      return [
        p.name || '—',
        has(p.sharePercent) ? `${p.sharePercent}%` : '—',
        [p.bankName, p.accountNumber].filter(Boolean).join('\n') || '—',
        pay.paymentVoucherNumber || '—',
        pay.paymentDate ? dateText(pay.paymentDate) : p.paid ? 'Paid' : 'Pending',
        amount(pay.amount ?? p.amount),
      ];
    }) : [['No payees recorded', '', '', '', '', '']], {
      0: { fontStyle: 'bold' },
      1: { halign: 'center', cellWidth: 44 },
      5: { halign: 'right', fontStyle: 'bold', textColor: NAVY },
    });

  y = drawTotals(doc, y, [
    ...(has(c.eligibleAmount) ? [['Eligible amount', money(c.eligibleAmount)]] : []),
    ...(has(c.approvedAmount) ? [['Approved amount', money(c.approvedAmount)]] : []),
    ...(c.deductions || []).map((d) => [`Less: ${d.reason}`, `- ${money(d.amount)}`]),
    ...(num(c.outstandingPremiumDeducted) ? [['Less: outstanding premium', `- ${money(c.outstandingPremiumDeducted)}`]] : []),
    ['Net payable', amount(payable)],
  ], {
    title: 'Discharge',
    body: 'Payment of the net payable to the payees above is in full and final settlement of this claim under the policy.',
  });
  y = drawParagraph(doc, y, 'Net payable in words', amountInWords(payable));
  await drawSignOff(doc, y, ['Claims officer', 'Authorized by', 'Received by (payee)'], qrText('Claim', number, payable, lastPaid));
  finishPages(doc, number);
  return doc;
}

// ─── Downloads ────────────────────────────────────────────────────────────────
const fileRef = (v) => v || 'draft';
export const downloadLifeQuotationPdf = async (q, extra) => savePdf(await buildLifeQuotationPdf(q, extra), `Life_Quotation_${fileRef(q.quotationNumber)}`);
export const downloadLifeDebitNotePdf = async (q, extra) => savePdf(await buildLifeDebitNotePdf(q, extra), `Life_Debit_Note_${fileRef(q.quotationNumber)}`);
export const downloadLifeReceiptPdf = async (q, payment) => savePdf(await buildLifeReceiptPdf(q, payment), `Life_Receipt_${fileRef(payment?.receiptNumber || q.receiptNumber || q.quotationNumber)}`);
export const downloadLifePolicySchedulePdf = async (q, extra) => savePdf(await buildLifePolicySchedulePdf(q, extra), `Life_Policy_Schedule_${fileRef(q.policyNumber || q.quotationNumber)}`);
export const downloadLifeIndividualPolicyPdf = async (b, extra) => savePdf(await buildLifeIndividualPolicyPdf(b, extra), `Life_Policy_${fileRef(b.policyNumber)}`);
export const downloadLifeClaimSettlementPdf = async (c) => savePdf(await buildLifeClaimSettlementPdf(c), `Life_Claim_Settlement_${fileRef(c.claimNumberCode)}`);
