// Branded PDF toolkit shared by the insurance modules (health, life, ...): the Standard Insurance
// letterhead, the navy summary bar, detail cards, tables, totals, sign-off and footer. Each module
// composes its own documents from these pieces with jsPDF, client-side.
// 720px copy of assets/img/standard_logo_tight.png, sized for print so PDFs stay small.
import logoUrl from './standard_logo_pdf.png';

const COMPANY = 'Standard Insurance S.C.';
const TAGLINE = 'Your trust, our standard';
const LOGO_RATIO = 448 / 1797; // height / width of the logo

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
function money(value) {
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

function amountInWords(value) {
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

// White letterhead: navy/orange bar, the full Standard Insurance logo, the document title and the
// line of business (e.g. "Health Insurance") under it.
function drawLetterhead(doc, logo, title, division = '') {
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
  const label = String(division).toUpperCase();
  font(doc, 'bold', 7.5, ORANGE);
  doc.setCharSpace(1.2);
  doc.text(label, W - M - doc.getTextWidth(label) - 1.2 * (label.length - 1), 61);
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
    let shown = text(value);
    while (fs > 7 && doc.getTextWidth(shown) > colW - 8) doc.setFontSize((fs -= 0.5));
    // Still too wide at the smallest size: cut it rather than run into the next column
    while (shown.length > 1 && doc.getTextWidth(shown) > colW - 8) shown = `${shown.slice(0, -2)}…`;
    doc.text(shown, x, y + 41);
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

  let asideH = 0;
  if (aside) {
    const aw = x - M - 16;
    const lines = doc.splitTextToSize(aside.body, aw - 24);
    asideH = Math.max(h, 34 + lines.length * 11);
    doc.setFillColor(...ORANGE_SOFT);
    doc.roundedRect(M, y, aw, asideH, 6, 6, 'F');
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
  return Math.max(ry, y + h, y + asideH) + 14;
}

function drawParagraph(doc, y, label, body) {
  const W = doc.internal.pageSize.getWidth();
  font(doc, 'normal', 8.5, MUTED); // measure at the body's own size
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

function savePdf(doc, fileName) {
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

export {
  COMPANY,
  TAGLINE,
  NAVY,
  ORANGE,
  NAVY_SOFT,
  ORANGE_SOFT,
  WHITE,
  INK,
  MUTED,
  SUBTLE,
  LINE,
  GOOD,
  WARN,
  M,
  money,
  num,
  dateText,
  text,
  pick,
  humanize,
  amountInWords,
  newDoc,
  font,
  drawLetterhead,
  drawHero,
  drawPanels,
  sectionTitle,
  drawTable,
  ensureSpace,
  drawTotals,
  drawParagraph,
  drawSignOff,
  finishPages,
  savePdf,
};
