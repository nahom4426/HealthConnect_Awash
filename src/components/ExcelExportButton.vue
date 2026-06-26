<template>
  <button
    @click="exportToExcel"
    :disabled="disabled"
    class="flex gap-2 items-center px-4 py-2 text-sm font-medium bg-white rounded-xl border shadow-sm transition-all duration-200 text-slate-700 border-slate-200/60 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
  >
    <svg class="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
    Export Excel
  </button>
</template>

<script setup lang="ts">
import { utils, writeFile } from 'xlsx'

const props = defineProps<{
  data: any[]
  filename?: string
  columns?: { header: string; key: string; width?: number }[]
  dropdownOptions?: Record<string, string[]>
  cascadingOptions?: Record<string, Record<string, string[]>>
  readOnlyColumns?: string[]
  disabled?: boolean
}>()

const emit = defineEmits<{
  export: []
}>()

function exportToExcel() {
  if (!props.data || props.data.length === 0) {
    console.warn('No data to export')
    return
  }

  console.log('📤 Starting export with', props.data.length, 'rows')

  const wb = utils.book_new()
  const headers = props.columns?.map(c => c.header) || Object.keys(props.data[0] || {})
  
  console.log('🏷️ Headers:', headers)
  console.log('🗺️ Columns config:', props.columns)
  
  // Build export data
  const exportData = props.data.map((row, idx) => {
    const newRow: any = {}
    props.columns?.forEach(col => {
      newRow[col.header] = row[col.key] ?? ''
    })
    console.log(`  Row ${idx}:`, newRow)
    return newRow
  })

  // Create worksheet
  const ws = utils.json_to_sheet(exportData, { header: headers })

  // Set column widths
  if (props.columns) {
    ws['!cols'] = props.columns.map(c => ({ wch: c.width || 20 }))
  }

  const lastRow = exportData.length + 100

  // For .xls (BIFF8), data validation uses a specific format
  // We need to use the 'list' type with Formula1 as a string of comma-separated values
  if (props.dropdownOptions) {
    Object.entries(props.dropdownOptions).forEach(([header, options]) => {
      const colIndex = headers.indexOf(header)
      if (colIndex >= 0) {
        const colLetter = utils.encode_col(colIndex)
        const range = `${colLetter}2:${colLetter}${lastRow}`
        const formula = `"${options.join(',')}"`
        
        console.log(`  Adding dropdown for ${header} (${colLetter}): ${formula}`)
        
        // BIFF8 data validation format
        if (!ws['!dataValidation']) ws['!dataValidation'] = []
        ;(ws['!dataValidation'] as any).push({
          type: 'list',
          allowBlank: 1,
          sqref: range,
          Formula1: formula
        })
      }
    })
  }

  // Handle cascading dropdowns (Plan Type -> Family Size)
  if (props.cascadingOptions) {
    Object.entries(props.cascadingOptions).forEach(([parentHeader, dependentConfig]) => {
      const parentColIndex = headers.indexOf(parentHeader)
      
      // Find the dependent header
      const depHeaders = Object.keys(dependentConfig)
      let depHeader = ''
      let depColIndex = -1
      
      // Look for Family Size or first dependent
      for (const h of depHeaders) {
        const idx = headers.indexOf(h)
        if (idx >= 0) {
          depHeader = h
          depColIndex = idx
          break
        }
      }
      
      if (parentColIndex >= 0 && depColIndex >= 0) {
        const parentColLetter = utils.encode_col(parentColIndex)
        const depColLetter = utils.encode_col(depColIndex)
        
        console.log(`  Cascading: ${parentHeader} (col ${parentColLetter}) -> ${depHeader} (col ${depColLetter})`)
        
        // For each parent value, create a hidden sheet and named range
        Object.entries(dependentConfig[depHeader] || {}).forEach(([parentValue, childOptions]: [string, any]) => {
          const safeName = parentValue.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 31)
          console.log(`    Creating named range "${safeName}" for "${parentValue}":`, childOptions)
          
          // Create hidden sheet with options
          const optionsArray = Array.isArray(childOptions) ? childOptions : []
          const hiddenSheet = utils.aoa_to_sheet([optionsArray])
          utils.book_append_sheet(wb, hiddenSheet, safeName)
          
          // Define named range
          if (!(wb as any).Workbook) (wb as any).Workbook = {}
          if (!(wb as any).Workbook.Names) (wb as any).Workbook.Names = []
          ;(wb as any).Workbook.Names.push({
            Name: safeName,
            Ref: `'${safeName}'!$A$1:$A$${optionsArray.length}`
          })
        })
        
        // Add INDIRECT validation to dependent column
        for (let r = 2; r <= lastRow; r++) {
          const fsCell = `${depColLetter}${r}`
          const ptCell = `${parentColLetter}${r}`
          const formula = `INDIRECT(SUBSTITUTE(SUBSTITUTE(${ptCell}," ","_"),"-","_"))`
          
          if (!ws['!dataValidation']) ws['!dataValidation'] = []
          ;(ws['!dataValidation'] as any).push({
            type: 'list',
            allowBlank: 1,
            sqref: fsCell,
            Formula1: formula
          })
        }
      }
    })
  }

  // Mark read-only columns with gray background
  if (props.readOnlyColumns && props.readOnlyColumns.length > 0) {
    const range = utils.decode_range(ws['!ref'] || 'A1')
    for (let R = range.s.r; R <= range.e.r; R++) {
      for (let C = range.s.c; C <= range.e.c; C++) {
        const cellRef = utils.encode_cell({ r: R, c: C })
        const header = headers[C]
        
        if (header && props.readOnlyColumns.includes(header)) {
          const cell = ws[cellRef]
          if (cell && typeof cell === 'object') {
            if (!cell.s) cell.s = {}
            cell.s.fill = { fgColor: { rgb: "F0F0F0" } }
            cell.s.font = { color: { rgb: "999999" }, italic: true }
          }
        }
      }
    }
  }

  utils.book_append_sheet(wb, ws, 'Rates')

  // Save as .xls
  let filename = props.filename || `rates_export_${new Date().toISOString().split('T')[0]}`
  if (!filename.endsWith('.xls')) filename += '.xls'
  
  console.log('💾 Saving as:', filename)
  
  try {
    writeFile(wb, filename, { bookType: 'biff8', type: 'binary' })
    console.log('✅ Export successful')
    emit('export')
  } catch (error: any) {
    console.error('❌ Export failed:', error)
  }
}
</script>