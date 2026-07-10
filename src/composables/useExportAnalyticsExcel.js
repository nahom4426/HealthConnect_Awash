import { ref } from 'vue';
import { getRequestedClaim } from '@/features/claim/api/claimApi';

/**
 * Composable for exporting Analytics Provider Credit Services to Excel with Summary and Details
 */
export function useExportAnalyticsExcel() {
  const exporting = ref(false);

  // Helper function to download file
  function downloadFile(data, filename, type) {
    const blob = new Blob([data], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  async function exportExcel(options = {}) {
    if (exporting.value) return;
    exporting.value = true;

    try {
      // 1. Fetch details for the given filters
      const params = {
        page: 1,
        limit: 10000,
        serviceType: 'CREDIT',
        fromDate: options.fromDate || undefined,
        toDate: options.toDate || undefined,
      };
      if (options.institutionUuid) {
        params.institutionUuid = options.institutionUuid;
      }
      if (options.providerUuid) {
        params.providerUuid = options.providerUuid;
      }
      
      const res = await getRequestedClaim(params);
      const detailedClaims = Array.isArray(res?.data?.content) ? res.data.content 
                           : (Array.isArray(res?.content) ? res.content : []);
                           
      // Group by provider for better readability
      detailedClaims.sort((a, b) => (a.providerName || '').localeCompare(b.providerName || ''));
      
      // Dynamically import exceljs
      const ExcelJS = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      
      // ==========================================
      // SHEET 1: SUMMARY
      // ==========================================
      const summarySheet = workbook.addWorksheet('Summary');
      
      // Main Title
      summarySheet.mergeCells('A1:E1');
      summarySheet.getCell('A1').value = 'PROVIDER CREDIT SERVICES SUMMARY';
      summarySheet.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FFFFFF' }, name: 'Calibri' };
      summarySheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2E75B6' } };
      summarySheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
      summarySheet.getRow(1).height = 35;
      
      // Date Range
      summarySheet.mergeCells('A2:E2');
      summarySheet.getCell('A2').value = `Period: ${options.fromDate || 'All'} to ${options.toDate || 'All'}`;
      summarySheet.getCell('A2').font = { bold: true, size: 11 };
      summarySheet.getCell('A2').alignment = { horizontal: 'center' };
      summarySheet.getRow(2).height = 25;
      
      // Headers
      const sumHeaders = ['Rank', 'Provider Name', 'Number of Credits Given', 'Total Amount', 'Avg Amount per Credit'];
      const sumHeaderRow = summarySheet.addRow(sumHeaders);
      sumHeaderRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFF' }, name: 'Calibri' };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '404040' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      });
      summarySheet.getRow(3).height = 30;
      
      let totalAmount = 0;
      let totalCredits = 0;
      
      (options.reportData || []).forEach((item, idx) => {
        const amt = item.totalAmount || 0;
        const creds = item.numberOfCreditsGiven || 0;
        const avg = creds > 0 ? amt / creds : 0;
        
        totalAmount += amt;
        totalCredits += creds;
        
        const row = summarySheet.addRow([
          idx + 1,
          item.providerName || 'N/A',
          creds,
          amt,
          avg
        ]);
        
        const rowColor = idx % 2 === 0 ? 'FFFFFF' : 'F2F2F2';
        row.eachCell((cell, colNumber) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowColor } };
          cell.border = {
            top: { style: 'thin', color: { argb: 'D0D0D0' } },
            left: { style: 'thin', color: { argb: 'D0D0D0' } },
            bottom: { style: 'thin', color: { argb: 'D0D0D0' } },
            right: { style: 'thin', color: { argb: 'D0D0D0' } }
          };
          cell.alignment = { vertical: 'middle' };
        });
        
        row.getCell(1).alignment = { horizontal: 'center' };
        row.getCell(3).alignment = { horizontal: 'center' };
        row.getCell(4).numFmt = '#,##0.00';
        row.getCell(5).numFmt = '#,##0.00';
      });
      
      // Total Row
      const sumTotalRow = summarySheet.addRow(['', 'TOTAL', totalCredits, totalAmount, totalCredits > 0 ? totalAmount/totalCredits : 0]);
      sumTotalRow.eachCell((cell) => {
        cell.font = { bold: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D9E1F2' } };
        cell.border = { top: { style: 'medium', color: { argb: '8EA9DB' } } };
      });
      sumTotalRow.getCell(3).alignment = { horizontal: 'center' };
      sumTotalRow.getCell(4).numFmt = '#,##0.00';
      sumTotalRow.getCell(5).numFmt = '#,##0.00';
      
      summarySheet.columns = [
        { width: 10 },
        { width: 45 },
        { width: 25 },
        { width: 25 },
        { width: 25 }
      ];
      
      
      // ==========================================
      // SHEET 2: DETAILS
      // ==========================================
      const detailSheet = workbook.addWorksheet('Details');
      
      detailSheet.mergeCells('A1:K1');
      detailSheet.getCell('A1').value = 'DETAILED CLAIMS AND ITEMS';
      detailSheet.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FFFFFF' }, name: 'Calibri' };
      detailSheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '5B9BD5' } };
      detailSheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
      detailSheet.getRow(1).height = 35;
      
      const detHeaders = [
        'Provider Name',
        'Institution',
        'Insured Name',
        'Provided Date',
        'Claim Amount',
        'Item Code',
        'Item Name',
        'Item Type',
        'Quantity',
        'Unit Price',
        'Total Price'
      ];
      const detHeaderRow = detailSheet.addRow(detHeaders);
      detHeaderRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFF' }, name: 'Calibri' };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '404040' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      });
      detailSheet.getRow(2).height = 30;
      
      let currentRow = 3;
      
      detailedClaims.forEach((claim, cIdx) => {
        const items = claim.providedItemResponses || [];
        const provName = claim.providerName || 'N/A';
        const instName = claim.institutionName || 'N/A';
        const insName = claim.insuredName || 'N/A';
        const date = claim.providedDate ? new Date(claim.providedDate).toLocaleDateString('en-GB') : 'N/A';
        const claimAmt = claim.amount || 0;
        
        const rowColor = cIdx % 2 === 0 ? 'FFFFFF' : 'F8F9FA';
        
        if (items.length === 0) {
          const row = detailSheet.addRow([
            provName, instName, insName, date, claimAmt,
            'N/A', 'N/A', 'N/A', 0, 0, 0
          ]);
          row.eachCell((cell) => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowColor } };
            cell.border = { bottom: { style: 'thin', color: { argb: 'E0E0E0' } } };
            cell.alignment = { vertical: 'middle', wrapText: true };
          });
          row.getCell(5).numFmt = '#,##0.00';
          currentRow++;
        } else {
          items.forEach((item, idx) => {
            const isFirst = idx === 0;
            const row = detailSheet.addRow([
              isFirst ? provName : '',
              isFirst ? instName : '',
              isFirst ? insName : '',
              isFirst ? date : '',
              isFirst ? claimAmt : '',
              item.itemCode || 'N/A',
              item.itemName || 'N/A',
              item.itemType || 'N/A',
              item.quantity || 0,
              item.unitPrice || 0,
              item.totalPrice || 0
            ]);
            
            row.eachCell((cell) => {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowColor } };
              // Only add bottom border on the last item of this claim
              if (idx === items.length - 1) {
                cell.border = { bottom: { style: 'thin', color: { argb: 'C0C0C0' } } };
              }
              cell.alignment = { vertical: 'middle', wrapText: true };
            });
            
            if (isFirst) {
              row.getCell(5).numFmt = '#,##0.00';
            }
            row.getCell(10).numFmt = '#,##0.00';
            row.getCell(11).numFmt = '#,##0.00';
            
            currentRow++;
          });
        }
      });
      
      detailSheet.columns = [
        { width: 35 },
        { width: 30 },
        { width: 25 },
        { width: 15 },
        { width: 18 },
        { width: 15 },
        { width: 35 },
        { width: 15 },
        { width: 10 },
        { width: 15 },
        { width: 15 }
      ];
      
      try {
        detailSheet.autoFilter = {
          from: 'A2',
          to: `K${detailSheet.rowCount}`
        };
        detailSheet.views = [
          { state: 'frozen', ySplit: 2, activeCell: 'A3', showGridLines: true }
        ];
      } catch (e) {
        console.warn('Could not set auto filter:', e);
      }
      
      // ==========================================
      // FINALIZE & DOWNLOAD
      // ==========================================
      const buffer = await workbook.xlsx.writeBuffer();
      const timestamp = new Date().toISOString().slice(0, 10);
      downloadFile(buffer, `Analytics_Provider_Credit_Report_${timestamp}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      
    } catch (error) {
      console.error('Error exporting Excel:', error);
      alert('Failed to export Excel file. Please try again.');
    } finally {
      exporting.value = false;
    }
  }

  return { exporting, exportExcel };
}
