import { ref } from 'vue';
import { formatDateToYYMMDD } from '@/utils/utils';

// ─── Color Palette ────────────────────────────────────────────────────────────
const BRAND      = [22,  82, 140];   // deep navy blue
const BRAND_MID  = [41, 128, 185];   // mid blue (accents)
const WHITE      = [255, 255, 255];
const NEAR_BLACK = [18,  24,  35];
const GRAY_DARK  = [80,  90, 105];
const GRAY_MID   = [160, 168, 180];
const GRAY_LT    = [235, 238, 242];
const GRAY_BG    = [247, 249, 251];

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
  doc.text(String(label).toUpperCase(), x, y);
  setFont(doc, 'bold', 9, valueColor);
  doc.text(String(value), x, y + 10);
}

function labelValueRight(doc, label, value, x, y, labelColor = GRAY_DARK, valueColor = NEAR_BLACK) {
  setFont(doc, 'normal', 7.5, labelColor);
  doc.text(String(label).toUpperCase(), x, y, { align: 'right' });
  setFont(doc, 'bold', 9, valueColor);
  doc.text(String(value), x, y + 10, { align: 'right' });
}

function pill(doc, text, x, y, w, bg, textColor) {
  const h = 14;
  doc.setFillColor(...bg);
  doc.roundedRect(x, y - 10, w, h, 3, 3, 'F');
  setFont(doc, 'bold', 7.5, textColor);
  doc.text(String(text), x + w / 2, y - 10 + 9, { align: 'center' });
}

// ─── Header ───────────────────────────────────────────────────────────────────
function drawClaimHeader(doc, rows, options) {
  const W = doc.internal.pageSize.getWidth();
  let y = 0;

  const totalAmount     = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const totalItems      = rows.reduce((s, r) =>
    s + (r.providedItemResponses || []).reduce((is, i) => is + (Number(i.quantity) || 0), 0), 0);
  const processedCount  = rows.filter(r => String(r.serviceClaimStatus).toUpperCase() === 'PROCESSED').length;

  const first           = rows[0] || {};
  const providerName    = options.claimInfo?.providerName   || first.providerName   || 'Provider';
  const institutionName = options.claimInfo?.institutionName|| first.institutionName|| 'Institution';
  const claimUuid       = options.claimInfo?.claimUuid      || first.claimUuid      || 'N/A';
  const batchCode       = options.claimInfo?.batchCode      || first.batchCode      || 'N/A';

  // Top stripe
  doc.setFillColor(...BRAND);
  doc.rect(0, y, W, 8, 'F');
  y += 8;

  // Title row
  doc.setFillColor(...WHITE);
  doc.rect(0, y, W, 28, 'F');

  doc.setFillColor(...BRAND_MID);
  doc.rect(20, y + 7, 3, 14, 'F');

  setFont(doc, 'bold', 14, NEAR_BLACK);
  doc.text(options.reportTitle || 'CLAIM DETAILS REPORT', 29, y + 19);

  setFont(doc, 'normal', 8.5, GRAY_DARK);
  doc.text(String(providerName), W - 20, y + 19, { align: 'right' });

  y += 28;

  doc.setDrawColor(...GRAY_LT);
  doc.setLineWidth(0.75);
  doc.line(20, y, W - 20, y);
  y += 8;

  // Meta row
  doc.setFillColor(...GRAY_BG);
  doc.rect(0, y - 4, W, 30, 'F');

  labelValue(doc, 'Institution', institutionName, 20, y + 4);

  if (options.showClaimId !== false) {
    labelValue(doc, 'Claim ID', claimUuid, 20 + Math.max(120, String(institutionName).length * 5.5), y + 4);
  }

  labelValueRight(doc, 'Batch Code', batchCode, W - 20, y + 4);
  labelValueRight(doc, 'Date', formatDateToYYMMDD(new Date()), W - 110, y + 4);

  y += 26;

  // Summary bar
  doc.setFillColor(...BRAND);
  doc.rect(0, y, W, 28, 'F');

  const colW  = W / 4;
  const statY = y + 10;

  const stat = (label, value, cx) => {
    setFont(doc, 'normal', 6.5, [180, 200, 220]);
    doc.text(String(label).toUpperCase(), cx, statY, { align: 'center' });
    setFont(doc, 'bold', 10.5, WHITE);
    doc.text(String(value), cx, statY + 11, { align: 'center' });
  };

  stat('Total Amount',  formatBirr(totalAmount),              colW * 0.5);
  stat('Total Items',   String(totalItems),                   colW * 1.5);
  stat('Processed',     `${processedCount} / ${rows.length}`, colW * 2.5);

  const allDone = processedCount === rows.length;
  pill(
    doc,
    allDone ? '✓ FULLY PROCESSED' : `${rows.length - processedCount} PENDING`,
    colW * 3 + 10, statY + 11, colW - 20,
    allDone ? [39, 174, 96] : [211, 84, 0],
    WHITE
  );

  y += 28;
  y += 6;

  return y;
}

// ─── Memory & Thread-Safe Optimized Composable ────────────────────────────────
export function useExportPdf(options = {}) {
  const exporting = ref(false);

  async function exportPdf() {
    if (exporting.value) return; // Guard against stacked calls
    exporting.value = true;

    // Yield control immediately so Vue updates button UI (spinner & disabled state)
    await new Promise(resolve => setTimeout(resolve, 50));

    try {
      const rows = await options.fetchDataFn();
      if (!rows || !rows.length) {
        alert('No data available to export.');
        return;
      }

      // Yield after fetch
      await new Promise(resolve => setTimeout(resolve, 30));

      // Dynamic Imports
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable')
      ]);

      await new Promise(resolve => setTimeout(resolve, 30));

      const orientation = options.orientation || 'landscape';
      const doc = new jsPDF({ 
        orientation, 
        unit: 'pt', 
        format: 'A4',
        compress: true // Enable PDF stream compression to save RAM
      });

      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();

      // Draw header
      const headerHeight = drawClaimHeader(doc, rows, options);

      // Chunked row mapping to avoid main thread freeze on low-spec CPUs
      const head = [options.headers];
      const body = [];
      const totalRows = rows.length;

      for (let i = 0; i < totalRows; i++) {
        const row = rows[i];
        const items = row.providedItemResponses || [{}];
        const itemLen = items.length;

        for (let j = 0; j < itemLen; j++) {
          const item = items[j];
          const mapped = options.mapRowData(row, item, j === 0, i + 1);
          body.push(mapped);
        }

        // Yield to event loop every 150 rows to keep UI thread responsive & allow Garbage Collection
        if (i > 0 && i % 150 === 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }

      await new Promise(resolve => setTimeout(resolve, 20));

      const mergeSet = new Set(options.mergeColumns || []);

      autoTable(doc, {
        head,
        body,
        theme: 'plain',

        styles: {
          fontSize: 7.5,
          cellPadding: { top: 3, right: 4, bottom: 3, left: 4 },
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
          cellPadding: { top: 6, right: 4, bottom: 6, left: 4 },
          lineWidth: 0,
          ...(options.headStyles || {}),
        },

        bodyStyles: {
          textColor: NEAR_BLACK,
          minCellHeight: 15,
          fontSize: 7.5,
          ...(options.bodyStyles || {}),
        },

        alternateRowStyles: {
          fillColor: GRAY_BG,
          ...(options.alternateRowStyles || {}),
        },

        columnStyles: options.columnStyles || {},

        startY: headerHeight,
        margin: {
          left:   options.margins?.left   ?? 15,
          right:  options.margins?.right  ?? 15,
          top:    options.margins?.top    ?? (headerHeight + 2),
          bottom: options.margins?.bottom ?? 36,
        },

        didDrawPage: (data) => {
          const pageCount = doc.internal.getNumberOfPages();

          doc.setDrawColor(...GRAY_LT);
          doc.setLineWidth(0.75);
          doc.line(15, pageH - 30, pageW - 15, pageH - 30);

          if (options.showDocumentId !== false) {
            setFont(doc, 'normal', 7, GRAY_MID);
            doc.text(`ID: ${options.claimInfo?.claimUuid || 'N/A'}`, 15, pageH - 18);
          }

          setFont(doc, 'bold', 7, GRAY_DARK);
          doc.text(`Page ${data.pageNumber} of ${pageCount}`, pageW / 2, pageH - 18, { align: 'center' });

          setFont(doc, 'normal', 7, GRAY_MID);
          doc.text(`Generated ${formatDateToYYMMDD(new Date())}`, pageW - 15, pageH - 18, { align: 'right' });
        },

        didParseCell: (data) => {
          if (mergeSet.has(data.column.index) && data.row.index > 0) {
            const curText = String(data.cell.raw ?? '');
            const prevRow = data.table.body[data.row.index - 1];
            if (prevRow) {
              const prevText = String(prevRow.cells[data.column.index]?.raw ?? '');
              if (curText && curText === prevText) {
                data.cell.text = [''];
              }
            }
          }
        },
      });

      await new Promise(resolve => setTimeout(resolve, 20));

      // Efficient Download using Blob (prevents giant Base64 Data URI RAM spikes)
      const fileName  = options.fileName  || 'claim_details';
      const batchCode = options.claimInfo?.batchCode || 'export';
      const fullFileName = `${fileName}_${batchCode}.pdf`;

      const pdfBlob = doc.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fullFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 1000);

    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      exporting.value = false;
    }
  }

  return { exporting, exportPdf };
}