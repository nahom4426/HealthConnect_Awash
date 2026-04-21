import { ref } from 'vue';
import { formatCurrency, formatDateToYYMMDD } from '@/utils/utils';

/**
 * Composable for exporting claim details to Excel with professional styling
 * @param {Object} options - Configuration options
 * @param {Function} options.fetchDataFn - Function to fetch all data rows
 * @param {String} options.reportTitle - Title for the report
 * @param {String} options.fileName - Base name for the exported file
 * @param {Array} options.headers - Array of header strings
 * @param {Function} options.mapRowData - Function to map row data to array format
 * @param {Object} options.columnWidths - Object mapping column indices to widths
 * @param {Object} options.claimInfo - Additional claim information
 */
export function useExportExcel(options = {}) {
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
    
    // Clean up
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  async function exportExcel() {
    if (exporting.value) return;
    exporting.value = true;

    try {
      const rows = await options.fetchDataFn();
      
      // Dynamically import exceljs - use relative path if needed
      const ExcelJS = await import('exceljs');
      
      // Create workbook
      const workbook = new ExcelJS.Workbook();
      
      // Create main worksheet
      const worksheet = workbook.addWorksheet(options.worksheetName || 'Claim Details');

      // Get common data from first row or options
      const firstRow = rows[0] || {};
      const providerName = options.claimInfo?.providerName || firstRow.providerName || 'N/A';
      const institutionName = options.claimInfo?.institutionName || firstRow.institutionName || 'N/A';
      const claimUuid = options.claimInfo?.claimUuid || firstRow.claimUuid || 'N/A';
      const batchCode = options.claimInfo?.batchCode || firstRow.batchCode || 'N/A';

      // Calculate totals
      const totalAmount = rows.reduce((sum, row) => sum + (row.amount || 0), 0);
      const totalItems = rows.reduce((sum, row) => {
        const items = row.providedItemResponses || [];
        return sum + items.reduce((itemSum, item) => itemSum + (item.quantity || 0), 0);
      }, 0);

      const headerCount = options.headers.length;
      const lastColumn = String.fromCharCode(64 + headerCount);

      // Main Title
      worksheet.mergeCells(`A1:${lastColumn}1`);
      worksheet.getCell('A1').value = options.reportTitle || 'CLAIM DETAILS REPORT';
      worksheet.getCell('A1').font = { 
        bold: true, 
        size: 20, 
        color: { argb: 'FFFFFF' },
        name: 'Calibri'
      };
      worksheet.getCell('A1').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '2E75B6' }
      };
      worksheet.getCell('A1').alignment = { 
        horizontal: 'center',
        vertical: 'middle'
      };

      // Claim Information
      worksheet.mergeCells(`A2:${lastColumn}2`);
      worksheet.getCell('A2').value = `Provider: ${providerName} | Institution: ${institutionName} | Claim: ${claimUuid}`;
      worksheet.getCell('A2').font = { 
        bold: true, 
        size: 12, 
        color: { argb: 'FFFFFF' } 
      };
      worksheet.getCell('A2').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '4472C4' }
      };
      worksheet.getCell('A2').alignment = { horizontal: 'center' };

      // Batch and Summary Info
      worksheet.mergeCells(`A3:${lastColumn}3`);
      worksheet.getCell('A3').value = `Batch: ${batchCode} | Total Amount: ${formatCurrency(totalAmount)} | Total Items: ${totalItems} | Records: ${rows.length}`;
      worksheet.getCell('A3').font = { 
        italic: true, 
        size: 11, 
        color: { argb: 'FFFFFF' } 
      };
      worksheet.getCell('A3').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '5B9BD5' }
      };
      worksheet.getCell('A3').alignment = { horizontal: 'center' };

      // Generation Info
      worksheet.mergeCells(`A4:${lastColumn}4`);
      worksheet.getCell('A4').value = `Generated on ${formatDateToYYMMDD(new Date())}`;
      worksheet.getCell('A4').font = { 
        italic: true, 
        size: 10, 
        color: { argb: '666666' } 
      };
      worksheet.getCell('A4').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'F8F9FA' }
      };
      worksheet.getCell('A4').alignment = { horizontal: 'center' };

      // Add headers
      const headerRow = worksheet.addRow(options.headers);
      headerRow.eachCell((cell, colNumber) => {
        cell.font = { 
          bold: true, 
          color: { argb: 'FFFFFF' },
          size: 11,
          name: 'Calibri'
        };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '404040' }
        };
        cell.alignment = { 
          horizontal: 'center',
          vertical: 'middle',
          wrapText: true
        };
        cell.border = {
          top: { style: 'thin', color: { argb: '000000' } },
          left: { style: 'thin', color: { argb: '000000' } },
          bottom: { style: 'thin', color: { argb: '000000' } },
          right: { style: 'thin', color: { argb: '000000' } }
        };
      });

      // Add data rows with detailed item information
      let currentRow = 6; // Start after headers and info rows
      
      rows.forEach((row, rowIndex) => {
        const items = row.providedItemResponses || [];
        const hasMultipleItems = items.length > 1;
        
        // Use the provided mapRowData function if available, otherwise use default mapping
        const getRowData = options.mapRowData || ((row, item, isFirstItem) => {
          const providedDate = row.providedDate 
            ? new Date(row.providedDate).toLocaleDateString('en-GB')
            : 'N/A';
          
          return [
            isFirstItem ? (rowIndex + 1) : '',
            isFirstItem ? (row.institutionName || 'N/A') : '',
            isFirstItem ? (row.insuredName || 'N/A') : '',
            item?.itemCode || 'N/A',
            item?.itemName || 'N/A',
            item?.quantity || 0,
            item?.unitPrice || 0,
            item?.totalPrice || 0,
            isFirstItem ? (row.amount || 0) : '',
            isFirstItem ? providedDate : '',
            isFirstItem ? (row.serviceClaimStatus || 'PENDING') : ''
          ];
        });

        // Add main service row (first item)
        const firstItem = items[0] || {};
        const mainRowData = getRowData(row, firstItem, true);
        const mainRow = worksheet.addRow(mainRowData);
        
        // Style main row
        const rowColor = rowIndex % 2 === 0 ? 'FFFFFF' : 'F2F2F2';
        mainRow.eachCell((cell, colNumber) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: rowColor }
          };
          cell.border = {
            top: { style: 'thin', color: { argb: 'D0D0D0' } },
            left: { style: 'thin', color: { argb: 'D0D0D0' } },
            bottom: { style: 'thin', color: { argb: 'D0D0D0' } },
            right: { style: 'thin', color: { argb: 'D0D0D0' } }
          };
          cell.font = {
            size: 10,
            name: 'Calibri',
            color: { argb: '000000' }
          };
          cell.alignment = { 
            vertical: 'middle',
            wrapText: true 
          };
          
          // Apply currency format to amount columns (assuming columns 7, 8, 9 are amounts)
          if (colNumber >= 7 && colNumber <= 9 && cell.value) {
            cell.numFmt = '$#,##0.00';
          }
        });
        
        // Add additional items if they exist
        if (hasMultipleItems) {
          items.slice(1).forEach((item, itemIndex) => {
            const itemRowData = getRowData(row, item, false);
            const itemRow = worksheet.addRow(itemRowData);
            
            // Style item rows
            itemRow.eachCell((cell, colNumber) => {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: rowColor }
              };
              cell.border = {
                top: { style: 'thin', color: { argb: 'D0D0D0' } },
                left: { style: 'thin', color: { argb: 'D0D0D0' } },
                bottom: { style: 'thin', color: { argb: 'D0D0D0' } },
                right: { style: 'thin', color: { argb: 'D0D0D0' } }
              };
              cell.font = {
                size: 10,
                name: 'Calibri',
                color: { argb: '333333' }
              };
              cell.alignment = { 
                vertical: 'middle',
                wrapText: true 
              };
              
              // Apply currency format
              if (colNumber >= 7 && colNumber <= 9 && cell.value) {
                cell.numFmt = '$#,##0.00';
              }
            });
            
            // Merge identical cells for service information across multiple items
            if (options.mergeColumns && options.mergeColumns.length > 0) {
              options.mergeColumns.forEach(col => {
                try {
                  worksheet.mergeCells(currentRow + 1, col, currentRow + 1 + itemIndex, col);
                } catch (e) {
                  // Ignore merge errors
                  console.warn('Could not merge cells:', e);
                }
              });
            }
          });
        }
        
        currentRow += Math.max(1, items.length);
      });

      // Set column widths
      if (options.columnWidths) {
        worksheet.columns = options.columnWidths;
      } else {
        // Default column widths for claim details
        worksheet.columns = [
          { width: 8 },  // #
          { width: 20 }, // Institution
          { width: 25 }, // Insured Name
          { width: 15 }, // Item Code
          { width: 30 }, // Item Name
          { width: 12 }, // Quantity
          { width: 15 }, // Unit Price
          { width: 15 }, // Total Price
          { width: 12 }, // Amount
          { width: 15 }, // Provided Date
          { width: 15 }, // Status
        ];
      }

      // Set row heights
      worksheet.getRow(1).height = 35;
      worksheet.getRow(2).height = 25;
      worksheet.getRow(3).height = 22;
      worksheet.getRow(4).height = 20;
      worksheet.getRow(5).height = 30;

      // Add auto-filter
      try {
        worksheet.autoFilter = {
          from: 'A5',
          to: `${lastColumn}${worksheet.rowCount}`
        };
      } catch (e) {
        console.warn('Could not set auto filter:', e);
      }

      // Freeze header rows
      worksheet.views = [
        { state: 'frozen', ySplit: 5, activeCell: 'A6', showGridLines: true }
      ];

      // Generate Summary Sheet
      const summarySheet = workbook.addWorksheet('Summary');
      
      // Summary Title
      summarySheet.mergeCells('A1:D1');
      summarySheet.getCell('A1').value = 'CLAIM SUMMARY';
      summarySheet.getCell('A1').font = { 
        bold: true, 
        size: 18, 
        color: { argb: 'FFFFFF' } 
      };
      summarySheet.getCell('A1').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '70AD47' }
      };
      summarySheet.getCell('A1').alignment = { horizontal: 'center' };
      summarySheet.getRow(1).height = 30;

      // Claim Info
      summarySheet.mergeCells('A2:D2');
      summarySheet.getCell('A2').value = `Provider: ${providerName} | Batch: ${batchCode}`;
      summarySheet.getCell('A2').font = { 
        bold: true, 
        size: 12, 
        color: { argb: 'FFFFFF' } 
      };
      summarySheet.getCell('A2').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '5B9BD5' }
      };
      summarySheet.getCell('A2').alignment = { horizontal: 'center' };
      summarySheet.getRow(2).height = 25;

      // Add summary statistics
      const summaryRows = [
        ['Total Claims', rows.length],
        ['Total Amount', totalAmount],
        ['Total Items', totalItems],
        ['Average per Claim', totalAmount / (rows.length || 1)],
        ['Processed Claims', rows.filter(r => r.serviceClaimStatus === 'PROCESSED').length],
        ['Pending Claims', rows.filter(r => r.serviceClaimStatus !== 'PROCESSED').length],
        ['Generated On', new Date().toISOString().split('T')[0]]
      ];

      // Summary headers
      const summaryHeaderRow = summarySheet.addRow(['Metric', 'Value', '', '']);
      summaryHeaderRow.font = { bold: true, color: { argb: 'FFFFFF' } };
      summaryHeaderRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '404040' }
      };
      summaryHeaderRow.height = 28;

      // Summary data
      summaryRows.forEach(([metric, value], index) => {
        const dataRow = summarySheet.addRow([metric, value, '', '']);
        dataRow.height = 24;
        
        dataRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: index % 2 === 0 ? 'FFFFFF' : 'F3F3F3' }
        };
        
        // Style the metric cell
        dataRow.getCell(1).font = { bold: true };
        dataRow.getCell(1).alignment = { horizontal: 'left' };
        
        // Style the value cell
        const valueCell = dataRow.getCell(2);
        valueCell.alignment = { horizontal: 'right' };
        
        // Apply currency format to amount cells
        if (metric.includes('Amount') || metric.includes('Average')) {
          valueCell.numFmt = '$#,##0.00';
        }
        
        // Add borders
        dataRow.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'D0D0D0' } },
            left: { style: 'thin', color: { argb: 'D0D0D0' } },
            bottom: { style: 'thin', color: { argb: 'D0D0D0' } },
            right: { style: 'thin', color: { argb: 'D0D0D0' } }
          };
        });
      });

      // Style summary columns
      summarySheet.columns = [
        { width: 25 },
        { width: 20 },
        { width: 25 },
        { width: 25 }
      ];

      // Generate buffer and save
      const buffer = await workbook.xlsx.writeBuffer();
      
      const timestamp = new Date().toISOString().slice(0, 10);
      const fileName = options.fileName || 'Claim_Details';
      
      // Use native download instead of file-saver
      downloadFile(buffer, `${fileName}_${batchCode}_${timestamp}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    } catch (error) {
      console.error('Error exporting Excel:', error);
      alert('Failed to export Excel file. Please try again.');
    } finally {
      exporting.value = false;
    }
  }

  return {
    exporting,
    exportExcel
  };
}