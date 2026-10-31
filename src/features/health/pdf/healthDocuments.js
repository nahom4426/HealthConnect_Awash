// Payer-facing PDFs for the health module.
//   Quotation pages: the quotation offer and the premium advice issued on acceptance.
//   Finance pages:   the debit note for an unpaid premium, the official receipt once it is paid,
//                    and the payment advice when a claim is settled.
// Everything is drawn client-side with jsPDF from data the pages already hold.
// 720px copy of assets/img/standard_logo_tight.png, sized for print so PDFs stay small.
import logoUrl from './standard_logo_pdf.png';

const COMPANY = 'Standard Insurance S.C.';
const TAGLINE = 'Your trust, our standard';
const DIVISION = 'Health Insurance';
const LOGO_RATIO = 448 / 1797; // height / width of the logo
const WHT_RATE = 3; // %, same default the premium payment form uses

// Brand colours sampled from the Standard Insurance logo.
const NAVY = [4, 57, 108];
const ORANGE = [254, 148, 18];
const NAVY_SOFT = [236, 242, 249];
const ORANGE_SOFT = [255, 244, 230];
const WHITE = [255, 255, 255];
const INK = [17, 24, 39];
const MUTED = [87, 96, 111];
const SUBTLE = [148, 156, 168];
const LINE = [226, 230, 236];
const GOOD = [22, 128, 74];
const WARN = [194, 105, 0];

const M = 40; // page margin, pt

// ─── Formatting ───────────────────────────────────────────────────────────────
export function money(value) {
  return `ETB ${num(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function dateText(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function text(value) {
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
}

// First non-empty value among the given keys, looking at the object and the payment
// sub-objects the backend has used for quotation payments.
function pick(obj, ...keys) {
  const sources = [obj, obj?.payment, obj?.quotationPayment, obj?.paymentResponse].filter(Boolean);
  for (const src of sources) {
    for (const k of keys) {
      const v = src[k];
      if (v !== undefined && v !== null && v !== '') return v;
    }
  }
  return undefined;
}

function humanize(value) {
  if (!value) return '—';
  return String(value).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).replace(/\B\w+/g, (w) => w.toLowerCase());
}

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve',
  'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function belowThousand(n) {
  const parts = [];
  if (n >= 100) { parts.push(`${ONES[Math.floor(n / 100)]} Hundred`); n %= 100; }
  if (n >= 20) { parts.push(TENS[Math.floor(n / 10)] + (n % 10 ? `-${ONES[n % 10]}` : '')); }
  else if (n > 0) parts.push(ONES[n]);
  return parts.join(' ');
}

export function amountInWords(value) {
  const total = Math.round(num(value) * 100);
  let birr = Math.floor(total / 100);
  const cents = total % 100;
  if (birr === 0 && cents === 0) return 'Zero Birr';
  const scales = ['', 'Thousand', 'Million', 'Billion'];
  const chunks = [];
  for (let i = 0; birr > 0 && i < scales.length; i++) {
    const chunk = birr % 1000;
    if (chunk) chunks.unshift(`${belowThousand(chunk)}${scales[i] ? ` ${scales[i]}` : ''}`);
    birr = Math.floor(birr / 1000);
  }
  const words = chunks.length ? `${chunks.join(' ')} Birr` : '';
  const centWords = cents ? `${belowThousand(cents)} Cents` : '';
  return [words, centWords].filter(Boolean).join(' and ');
}

// ─── Assets ───────────────────────────────────────────────────────────────────
const imageCache = new Map();

// Fetch an image as a data URL for jsPDF; null if it can't be loaded (the header then falls
// back to text).
async function loadImage(url) {
  if (imageCache.has(url)) return imageCache.get(url);
  let result = null;
  try {
    const blob = await (await fetch(url)).blob();
    result = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    result = null;
  }
  imageCache.set(url, result);
  return result;
}

async function qrImage(payload) {
  try {
    const QRCode = (await import('qrcode')).default;
    return await QRCode.toDataURL(payload, { margin: 0, width: 220, color: { dark: '#04396C', light: '#FFFFFF' } });
  } catch {
    return null;
  }
}

async function newDoc() {
  const [{ default: jsPDF }, { default: autoTable }, logo] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
    loadImage(logoUrl),
  ]);
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'A4', compress: true });
  return { doc, autoTable, logo };
}

// ─── Drawing primitives ───────────────────────────────────────────────────────
function font(doc, style = 'normal', size = 9, color = INK) {
  doc.setFont('helvetica', style);
  doc.setFontSize(size);
  doc.setTextColor(...color);
}

function brandBar(doc, y, h) {
  const W = doc.internal.pageSize.getWidth();
  doc.setFillColor(...NAVY);
  doc.rect(0, y, W * 0.8, h, 'F');
  doc.setFillColor(...ORANGE);
  doc.rect(W * 0.8, y, W * 0.2, h, 'F');
}

// White letterhead: navy/orange bar, the full Standard Insurance logo, the document title.
function drawLetterhead(doc, logo, title) {
  const W = doc.internal.pageSize.getWidth();
  brandBar(doc, 0, 6);

  if (logo) {
    try {
      const w = 168;
      doc.addImage(logo, 'PNG', M, 26, w, w * LOGO_RATIO);
    } catch { logo = null; }
  }
  if (!logo) {
    font(doc, 'bold', 16, NAVY);
    doc.text(COMPANY, M, 46);
    font(doc, 'italic', 9, ORANGE);
    doc.text(TAGLINE, M, 60);
  }

  font(doc, 'bold', 21, NAVY);
  doc.text(title.toUpperCase(), W - M, 46, { align: 'right' });
  // Letter-spaced, so right-align by hand (getTextWidth ignores char spacing).
  const division = DIVISION.toUpperCase();
  font(doc, 'bold', 7.5, ORANGE);
  doc.setCharSpace(1.2);
  doc.text(division, W - M - doc.getTextWidth(division) - 1.2 * (division.length - 1), 61);
  doc.setCharSpace(0);

  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.8);
  doc.line(M, 84, W - M, 84);
  return 100;
}

function statusColors(status) {
  const s = String(status || '').toUpperCase();
  if (['PAID', 'SETTLED', 'ACCEPTED', 'ISSUED'].includes(s)) return s === 'ISSUED' ? [WHITE, NAVY] : [WHITE, GOOD];
  if (['UNPAID', 'DUE', 'PENDING'].includes(s)) return [WHITE, WARN];
  return [NAVY, WHITE];
}

// Navy summary card: the headline amount first, then up to three facts and a status pill.
function drawHero(doc, y, { amountLabel, amount, facts = [], status }) {
  const W = doc.internal.pageSize.getWidth();
  const h = 64;
  doc.setFillColor(...NAVY);
  doc.roundedRect(M, y, W - 2 * M, h, 8, 8, 'F');
  doc.setFillColor(...ORANGE);
  doc.roundedRect(M, y, 5, h, 2, 2, 'F');

  const startX = M + 182;
  font(doc, 'normal', 7.5, [176, 198, 222]);
  doc.text(amountLabel.toUpperCase(), M + 20, y + 22);
  let size = 18;
  font(doc, 'bold', size, WHITE);
  while (size > 11 && doc.getTextWidth(amount) > startX - M - 34) doc.setFontSize(--size);
  doc.text(amount, M + 20, y + 45);

  const statusW = status ? 78 : 0;
  const colW = (W - M - 14 - statusW - startX) / Math.max(facts.length, 1);
  facts.forEach(([label, value], i) => {
    const x = startX + i * colW;
    doc.setDrawColor(40, 92, 145);
    doc.setLineWidth(0.6);
    doc.line(x - 10, y + 16, x - 10, y + h - 16);
    font(doc, 'normal', 7, [176, 198, 222]);
    doc.text(label.toUpperCase(), x, y + 25);
    let fs = 9;
    font(doc, 'bold', fs, WHITE);
    while (fs > 6.5 && doc.getTextWidth(text(value)) > colW - 8) doc.setFontSize((fs -= 0.5));
    doc.text(text(value), x, y + 41);
  });

  if (status) {
    const label = String(status).toUpperCase();
    const [fg, bg] = statusColors(label);
    const pw = 68;
    const px = W - M - 14 - pw;
    doc.setFillColor(...bg);
    doc.roundedRect(px, y + h / 2 - 10, pw, 20, 10, 10, 'F');
    font(doc, 'bold', 8, fg);
    doc.text(label, px + pw / 2, y + h / 2 + 3, { align: 'center' });
  }
  return y + h + 20;
}

// Two side-by-side cards of label/value pairs, e.g. "Bill to" and "Policy details".
function drawPanels(doc, y, left, right) {
  const W = doc.internal.pageSize.getWidth();
  const gap = 14;
  const colW = (W - 2 * M - gap) / 2;
  const valueW = colW - 112;

  const measure = (panel) => panel.rows.reduce((h, [, v]) => h + 13 * doc.splitTextToSize(text(v), valueW).length + 4, 36) + 6;
  const h = Math.max(measure(left), measure(right));

  const draw = (panel, x) => {
    doc.setFillColor(...WHITE);
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.8);
    doc.roundedRect(x, y, colW, h, 6, 6, 'FD');
    doc.setFillColor(...ORANGE);
    doc.rect(x + 14, y + 13, 3, 10, 'F');
    font(doc, 'bold', 8, NAVY);
    doc.setCharSpace(0.6);
    doc.text(panel.title.toUpperCase(), x + 23, y + 21);
    doc.setCharSpace(0);
    let ry = y + 40;
    for (const [label, value] of panel.rows) {
      font(doc, 'normal', 8.5, MUTED);
      doc.text(label, x + 14, ry);
      font(doc, 'bold', 8.5, INK);
      const lines = doc.splitTextToSize(text(value), valueW);
      doc.text(lines, x + 100, ry);
      ry += 13 * lines.length + 4;
    }
  };
  draw(left, M);
  draw(right, M + colW + gap);
  return y + h + 22;
}

function sectionTitle(doc, y, label) {
  y = ensureSpace(doc, y, 60);
  font(doc, 'bold', 10.5, NAVY);
  doc.text(label, M, y);
  doc.setFillColor(...ORANGE);
  doc.rect(M, y + 5, 22, 2, 'F');
  return y + 16;
}

function drawTable(doc, autoTable, y, head, body, columnStyles = {}) {
  autoTable(doc, {
    head: [head],
    body,
    startY: y,
    theme: 'plain',
    margin: { left: M, right: M, top: 40, bottom: 64 },
    styles: {
      font: 'helvetica', fontSize: 8.5, textColor: INK, cellPadding: { top: 7, bottom: 7, left: 7, right: 7 },
      valign: 'middle', overflow: 'linebreak', lineColor: LINE, lineWidth: { bottom: 0.6 },
    },
    headStyles: { fillColor: NAVY_SOFT, textColor: NAVY, fontStyle: 'bold', fontSize: 8, lineWidth: 0 },
    columnStyles,
    // Header cells follow their column's alignment so amounts line up under their titles.
    didParseCell: (data) => {
      if (data.section === 'head' && columnStyles[data.column.index]?.halign) {
        data.cell.styles.halign = columnStyles[data.column.index].halign;
      }
    },
  });
  return doc.lastAutoTable.finalY + 16;
}

function ensureSpace(doc, y, needed) {
  const H = doc.internal.pageSize.getHeight();
  if (y + needed > H - 64) {
    doc.addPage();
    return 50;
  }
  return y;
}

// Totals card on the right; the last row is the navy "amount" bar. Optional `aside`
// draws a note card in the free space on the left.
function drawTotals(doc, y, rows, aside) {
  const W = doc.internal.pageSize.getWidth();
  const boxW = 250;
  const x = W - M - boxW;
  const h = (rows.length - 1) * 20 + 40;
  y = ensureSpace(doc, y, h + 10);

  if (aside) {
    const aw = x - M - 16;
    const lines = doc.splitTextToSize(aside.body, aw - 24);
    const ah = Math.max(h, 34 + lines.length * 11);
    doc.setFillColor(...ORANGE_SOFT);
    doc.roundedRect(M, y, aw, ah, 6, 6, 'F');
    font(doc, 'bold', 8, WARN);
    doc.text(aside.title.toUpperCase(), M + 12, y + 18);
    font(doc, 'normal', 8, MUTED);
    doc.text(lines, M + 12, y + 32);
  }

  let ry = y;
  rows.forEach(([label, value], i) => {
    const last = i === rows.length - 1;
    if (last) {
      doc.setFillColor(...NAVY);
      doc.roundedRect(x, ry + 2, boxW, 28, 6, 6, 'F');
      font(doc, 'bold', 9.5, WHITE);
      doc.text(label, x + 12, ry + 20);
      font(doc, 'bold', 11, WHITE);
      doc.text(value, x + boxW - 12, ry + 20, { align: 'right' });
      ry += 34;
    } else {
      font(doc, 'normal', 9, MUTED);
      doc.text(label, x + 12, ry + 13);
      font(doc, 'bold', 9, INK);
      doc.text(value, x + boxW - 12, ry + 13, { align: 'right' });
      doc.setDrawColor(...LINE);
      doc.setLineWidth(0.5);
      doc.line(x + 12, ry + 19, x + boxW - 12, ry + 19);
      ry += 20;
    }
  });
  return Math.max(ry, y + h) + 14;
}

function drawParagraph(doc, y, label, body) {
  const W = doc.internal.pageSize.getWidth();
  const lines = doc.splitTextToSize(body, W - 2 * M);
  y = ensureSpace(doc, y, 18 + lines.length * 12);
  font(doc, 'bold', 8.5, NAVY);
  doc.text(label, M, y);
  font(doc, 'normal', 8.5, MUTED);
  doc.text(lines, M, y + 13);
  return y + 13 + lines.length * 12 + 10;
}

// QR code with the document's key facts on the left, signature lines on the right.
async function drawSignOff(doc, y, labels, qrPayload) {
  const W = doc.internal.pageSize.getWidth();
  y = ensureSpace(doc, y + 8, 90);
  const qr = qrPayload ? await qrImage(qrPayload) : null;
  let x0 = M;
  if (qr) {
    doc.addImage(qr, 'PNG', M, y, 62, 62);
    font(doc, 'normal', 6.5, SUBTLE);
    doc.text('Scan for document details', M, y + 72);
    x0 = M + 92;
  }
  const colW = (W - M - x0) / labels.length;
  labels.forEach((label, i) => {
    const x = x0 + i * colW;
    doc.setDrawColor(...SUBTLE);
    doc.setLineWidth(0.6);
    doc.line(x, y + 46, x + colW - 22, y + 46);
    font(doc, 'bold', 8, INK);
    doc.text(label, x, y + 58);
    font(doc, 'normal', 7, SUBTLE);
    doc.text('Name, signature & date', x, y + 68);
  });
  return y + 84;
}

// Footer and page numbers on every page.
function finishPages(doc, reference) {
  const pages = doc.internal.getNumberOfPages();
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.6);
    doc.line(M, H - 44, W - M, H - 44);
    font(doc, 'bold', 7.5, NAVY);
    doc.text(COMPANY, M, H - 30);
    const companyW = doc.getTextWidth(COMPANY); // measured at the company's bold 7.5pt
    font(doc, 'italic', 7, ORANGE);
    doc.text(TAGLINE, M + companyW + 8, H - 30);
    font(doc, 'normal', 6.5, SUBTLE);
    doc.text(`Computer-generated document · Ref ${text(reference)}`, M, H - 19);
    font(doc, 'bold', 7.5, MUTED);
    doc.text(`Page ${p} of ${pages}`, W - M, H - 26, { align: 'right' });
    brandBar(doc, H - 5, 5);
  }
}

export function savePdf(doc, fileName) {
  const safe = String(fileName).replace(/[^\w.-]+/g, '_');
  const url = URL.createObjectURL(doc.output('blob'));
  const link = document.createElement('a');
  link.href = url;
  link.download = safe.endsWith('.pdf') ? safe : `${safe}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

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

  let y = drawLetterhead(doc, logo, 'Quotation');
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

  let y = drawLetterhead(doc, logo, title);
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

  let y = drawLetterhead(doc, logo, 'Official Receipt');
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

  let y = drawLetterhead(doc, logo, 'Claim Payment Advice');
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
