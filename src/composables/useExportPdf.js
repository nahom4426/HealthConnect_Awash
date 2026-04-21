import { ref } from 'vue';
import { formatDateToYYMMDD, formatCurrency } from '@/utils/utils';

// ─── Color Palette ────────────────────────────────────────────────────────────
const BRAND     = [22,  82, 140];   // deep navy blue
const BRAND_MID = [41, 128, 185];   // mid blue (accents)
const BRAND_LT  = [214, 234, 248];  // pale blue tint for zebra rows
const WHITE     = [255, 255, 255];
const NEAR_BLACK= [18,  24,  35];
const GRAY_DARK = [80,  90, 105];
const GRAY_MID  = [160, 168, 180];
const GRAY_LT   = [235, 238, 242];
const GRAY_BG   = [247, 249, 251];

function formatBirr(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return '0.00 Br';
  return `${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Br`;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function setFont(doc, style = 'normal', size = 9, color = NEAR_BLACK) {
  doc.setFont('helvetica', style);
  doc.setFontSize(size);
  doc.setTextColor(...color);
}

function labelValue(doc, label, value, x, y, labelColor = GRAY_DARK, valueColor = NEAR_BLACK) {
  setFont(doc, 'normal', 7.5, labelColor);
  doc.text(label.toUpperCase(), x, y);
  setFont(doc, 'bold', 9, valueColor);
  doc.text(value, x, y + 10);
}

function labelValueRight(doc, label, value, x, y, labelColor = GRAY_DARK, valueColor = NEAR_BLACK) {
  setFont(doc, 'normal', 7.5, labelColor);
  doc.text(label.toUpperCase(), x, y, { align: 'right' });
  setFont(doc, 'bold', 9, valueColor);
  doc.text(value, x, y + 10, { align: 'right' });
}

function pill(doc, text, x, y, w, bg, textColor) {
  const h = 14;
  doc.setFillColor(...bg);
  doc.roundedRect(x, y - 10, w, h, 3, 3, 'F');
  setFont(doc, 'bold', 7.5, textColor);
  doc.text(text, x + w / 2, y - 10 + 9, { align: 'center' });
}

// ─── Header ───────────────────────────────────────────────────────────────────
/**
 * Draw a compact, attractive claim header.
 * Returns the Y position where the table should begin.
 */
function drawClaimHeader(doc, rows, options) {
  const W = doc.internal.pageSize.getWidth();
  let y = 0;

  // ── Totals ──
  const totalAmount     = rows.reduce((s, r) => s + (r.amount || 0), 0);
  const totalItems      = rows.reduce((s, r) =>
    s + (r.providedItemResponses || []).reduce((is, i) => is + (i.quantity || 0), 0), 0);
  const processedCount  = rows.filter(r => r.serviceClaimStatus === 'PROCESSED').length;

  const first           = rows[0] || {};
  const providerName    = options.claimInfo?.providerName   || first.providerName   || 'Provider';
  const institutionName = options.claimInfo?.institutionName|| first.institutionName|| 'Institution';
  const claimUuid       = options.claimInfo?.claimUuid      || first.claimUuid      || 'N/A';
  const batchCode       = options.claimInfo?.batchCode      || first.batchCode      || 'N/A';

  // ── 1. Solid navy top bar (brand stripe) — 8 pt ──
  doc.setFillColor(...BRAND);
  doc.rect(0, y, W, 8, 'F');
  y += 8;

  // ── 2. Title row — 28 pt ──
  doc.setFillColor(...WHITE);
  doc.rect(0, y, W, 28, 'F');

  // Left accent rule
  doc.setFillColor(...BRAND_MID);
  doc.rect(20, y + 7, 3, 14, 'F');

  // Report title
  setFont(doc, 'bold', 14, NEAR_BLACK);
  doc.text(options.reportTitle || 'CLAIM DETAILS REPORT', 29, y + 19);

  // Provider name (right-aligned, subdued)
  setFont(doc, 'normal', 8.5, GRAY_DARK);
  doc.text(providerName, W - 20, y + 19, { align: 'right' });

  y += 28;

  // ── 3. Thin separator ──
  doc.setDrawColor(...GRAY_LT);
  doc.setLineWidth(0.75);
  doc.line(20, y, W - 20, y);
  y += 8;

  // ── 4. Meta info row — 26 pt ──
  // institution | claim id  ────  batch | date
  doc.setFillColor(...GRAY_BG);
  doc.rect(0, y - 4, W, 30, 'F');

  labelValue(doc, 'Institution', institutionName, 20, y + 4);

  if (options.showClaimId !== false) {
    labelValue(doc, 'Claim ID', claimUuid, 20 + Math.max(120, institutionName.length * 5.5), y + 4);
  }

  labelValueRight(doc, 'Batch Code', batchCode, W - 20, y + 4);
  labelValueRight(doc, 'Date', formatDateToYYMMDD(new Date()), W - 110, y + 4);

  y += 26;

  // ── 5. Summary stats bar — 28 pt ──
  doc.setFillColor(...BRAND);
  doc.rect(0, y, W, 28, 'F');

  const colW  = W / 4;
  const statY = y + 10;

  // Helper: stat block inside dark bar
  const stat = (label, value, cx) => {
    setFont(doc, 'normal', 6.5, [180, 200, 220]);
    doc.text(label.toUpperCase(), cx, statY, { align: 'center' });
    setFont(doc, 'bold', 10.5, WHITE);
    doc.text(value, cx, statY + 11, { align: 'center' });
  };

  stat('Total Amount',  formatBirr(totalAmount),              colW * 0.5);
  stat('Total Items',   String(totalItems),                   colW * 1.5);
  stat('Processed',     `${processedCount} / ${rows.length}`, colW * 2.5);

  // Status pill (right quarter)
  const allDone = processedCount === rows.length;
  pill(
    doc,
    allDone ? '✓ FULLY PROCESSED' : `${rows.length - processedCount} PENDING`,
    colW * 3 + 10, statY + 11, colW - 20,
    allDone ? [39, 174, 96] : [211, 84, 0],
    WHITE
  );

  y += 28;

  // ── 6. Small gap before table ──
  y += 6;

  return y;
}

// ─── Composable ───────────────────────────────────────────────────────────────
export function useExportPdf(options = {}) {
  const exporting = ref(false);

  async function exportPdf() {
    if (exporting.value) return;
    exporting.value = true;

    try {
      const rows = await options.fetchDataFn();

      const { default: jsPDF } = await import('jspdf');
      const autoTable           = (await import('jspdf-autotable')).default;

      const orientation = options.orientation || 'landscape';
      const doc = new jsPDF({ orientation, unit: 'pt', format: 'A4' });

      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();

      // ── Draw header ──
      const headerHeight = drawClaimHeader(doc, rows, options);

      // ── Flatten rows ──
      const head = [options.headers];
      const body = rows.flatMap((row, idx) =>
        (row.providedItemResponses || []).map((item, itemIdx) =>
          options.mapRowData(row, item, itemIdx === 0, idx + 1)
        )
      );

      // ── Table ──
      autoTable(doc, {
        head,
        body,
        theme: 'plain',

        styles: {
          fontSize: 8,
          cellPadding: { top: 5, right: 6, bottom: 5, left: 6 },
          overflow: 'linebreak',
          lineWidth: 0,
          valign: 'middle',
          font: 'helvetica',
          textColor: NEAR_BLACK,
          ...(options.styles || {}),
        },

        headStyles: {
          fillColor: BRAND,
          textColor: WHITE,
          fontStyle: 'bold',
          fontSize: 8,
          cellPadding: { top: 7, right: 6, bottom: 7, left: 6 },
          lineWidth: 0,
          ...(options.headStyles || {}),
        },

        bodyStyles: {
          textColor: NEAR_BLACK,
          minCellHeight: 19,
          fontSize: 8,
          ...(options.bodyStyles || {}),
        },

        alternateRowStyles: {
          fillColor: GRAY_BG,
          ...(options.alternateRowStyles || {}),
        },

        columnStyles: options.columnStyles || {},

        startY: headerHeight,
        margin: {
          left:   options.margins?.left   ?? 20,
          right:  options.margins?.right  ?? 20,
          top:    options.margins?.top    ?? (headerHeight + 2),
          bottom: options.margins?.bottom ?? 42,
        },

        // ── Footer ──
        didDrawPage: (data) => {
          const pageCount = doc.internal.getNumberOfPages();

          // Footer rule
          doc.setDrawColor(...GRAY_LT);
          doc.setLineWidth(0.75);
          doc.line(20, pageH - 36, pageW - 20, pageH - 36);

          // Left: doc ID
          if (options.showDocumentId !== false) {
            setFont(doc, 'normal', 7.5, GRAY_MID);
            doc.text(`ID: ${options.claimInfo?.claimUuid || 'N/A'}`, 20, pageH - 24);
          }

          // Center: page number
          setFont(doc, 'bold', 7.5, GRAY_DARK);
          doc.text(`Page ${data.pageNumber} of ${pageCount}`, pageW / 2, pageH - 24, { align: 'center' });

          // Right: generated date
          setFont(doc, 'normal', 7.5, GRAY_MID);
          doc.text(`Generated ${formatDateToYYMMDD(new Date())}`, pageW - 20, pageH - 24, { align: 'right' });
        },

        // ── Merge duplicate cells in specified columns ──
        didParseCell: (data) => {
          if (data.row.index > 0 && options.mergeColumns?.includes(data.column.index)) {
            const cur  = data.row.cells[data.column.index];
            const prev = data.table.body[data.row.index - 1]?.cells[data.column.index];
            if (prev && cur && cur.raw === prev.raw) {
              cur.text = '';
            }
          }
        },
      });

      // ── Save ──
      const fileName  = options.fileName  || 'claim_details';
      const batchCode = options.claimInfo?.batchCode || 'export';
      doc.save(`${fileName}_${batchCode}.pdf`);

    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      exporting.value = false;
    }
  }

  return { exporting, exportPdf };
}