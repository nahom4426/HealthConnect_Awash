<template>
  <div class="relative">
    <input
      ref="fileInput"
      type="file"
      accept=".xlsx,.xls,.csv"
      class="hidden"
      @change="handleFileUpload"
    />
    <button
      @click="triggerFileInput"
      :disabled="disabled"
      class="flex gap-2 items-center px-4 py-2 text-sm font-medium bg-white rounded-xl border shadow-sm transition-all duration-200 text-slate-700 border-slate-200/60 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <svg class="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
      Import Excel
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { read, utils } from 'xlsx'

const props = defineProps<{
  disabled?: boolean
  mappings?: Record<string, string>
  requiredFields?: string[]
}>()

const emit = defineEmits<{
  import: [data: any[]]
  error: [message: string]
}>()

const fileInput = ref<HTMLInputElement>()

function triggerFileInput() {
  fileInput.value?.click()
}

function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string' && value.trim() === '') return true
  if (typeof value === 'number' && isNaN(value)) return true
  return false
}

function isNumericString(value: any): boolean {
  if (typeof value !== 'string') return false
  const trimmed = value.trim()
  if (trimmed === '') return false
  return !isNaN(Number(trimmed)) && isFinite(Number(trimmed))
}

function findHeaderRow(sheet: any): number {
  // Get all cell data
  const range = utils.decode_range(sheet['!ref'] || 'A1')
  const data: any[][] = []
  
  // Build data array from sheet
  for (let row = range.s.r; row <= range.e.r; row++) {
    const rowData: any[] = []
    let hasData = false
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = utils.encode_cell({ r: row, c: col })
      const cell = sheet[cellAddress]
      const value = cell ? cell.v : ''
      rowData.push(value)
      if (value && String(value).trim()) {
        hasData = true
      }
    }
    data.push(rowData)
    if (hasData) {
      // Check if this row looks like headers (contains expected column names)
      const rowStr = rowData.map(String).join(' ').toLowerCase()
      const expectedHeaders = props.mappings ? Object.keys(props.mappings) : ['plan type', 'family size', 'min balance', 'max balance', 'rate']
      
      // Check if this row contains any expected header
      const hasExpectedHeader = expectedHeaders.some(header => 
        rowStr.includes(header.toLowerCase())
      )
      
      // Also check if this row has multiple non-empty cells (likely headers row)
      const nonEmptyCount = rowData.filter(cell => cell && String(cell).trim()).length
      
      if (hasExpectedHeader || nonEmptyCount >= 4) {
        return row
      }
    }
  }
  
  // If no header row found, return row 4 (the row after title, subtitle, and info)
  return 4
}

function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (!file) return

  console.log('📁 Import file:', file.name, 'size:', file.size)

  const reader = new FileReader()
  
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target?.result as ArrayBuffer)
      const workbook = read(data, { type: 'array' })
      
      console.log('📊 Workbook sheets:', workbook.SheetNames)
      
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      
      console.log('📋 Worksheet ref:', worksheet['!ref'])
      
      // Find the header row (skip title rows)
      const headerRowIndex = findHeaderRow(worksheet)
      console.log(`🔍 Found header row at index: ${headerRowIndex}`)
      
      // Get all data as 2D array starting from header row
      const allData = utils.sheet_to_json(worksheet, {
        header: 1,
        defval: '',
        raw: false
      })
      
      console.log('📄 Total rows parsed:', allData.length)
      
      if (allData.length === 0) {
        emit('error', 'Excel file is empty')
        return
      }
      
      // Get headers from the found header row
      const headers = allData[headerRowIndex]?.map((h: any) => {
        const cleaned = String(h || '').trim()
        return cleaned
      }) || []
      
      console.log('🏷️ Detected headers:', headers)
      console.log('🏷️ Expected mappings:', props.mappings)
      
      // Check which expected headers were found
      const expectedHeaders = props.mappings ? Object.keys(props.mappings) : []
      const foundHeaders = expectedHeaders.filter(eh => headers.includes(eh))
      const missingHeaders = expectedHeaders.filter(eh => !headers.includes(eh))
      console.log('✅ Found headers:', foundHeaders)
      console.log('❌ Missing headers:', missingHeaders)
      
      if (missingHeaders.length > 0) {
        console.warn('⚠️ Missing expected headers:', missingHeaders)
      }
      
      // Process data rows (rows after header row)
      const rows = allData.slice(headerRowIndex + 1).filter((row: any[], index: number) => {
        const hasData = row.some((cell: any) => {
          if (cell === null || cell === undefined) return false
          if (typeof cell === 'string' && cell.trim() === '') return false
          if (typeof cell === 'number' && isNaN(cell)) return false
          return true
        })
        
        if (!hasData) {
          console.log(`  Row ${headerRowIndex + index + 2}: Empty - skipping`)
        }
        
        return hasData
      })
      
      console.log(`📊 Found ${rows.length} non-empty data rows`)
      
      if (rows.length === 0) {
        emit('error', 'No data rows found in Excel file')
        return
      }
      
      const skippedRows: number[] = []
      const importedRows: any[] = []
      
      // Map each row to object
      rows.forEach((row: any[], rowIndex: number) => {
        const actualRow = headerRowIndex + rowIndex + 2 // +2 for 1-based indexing
        const obj: any = {}
        
        console.log(`\n--- Row ${actualRow} ---`)
        
        headers.forEach((header: string, colIndex: number) => {
          let value = row[colIndex]
          
          // Skip empty cells
          if (isEmpty(value)) {
            console.log(`  Col ${colIndex} [${header}]: Empty, skipping`)
            return
          }
          
          console.log(`  Col ${colIndex} [${header}]: raw="${value}" (${typeof value})`)
          
          // Convert numeric strings to numbers
          if (isNumericString(value)) {
            const numVal = Number(value)
            console.log(`    → Converting to number: ${numVal}`)
            value = numVal
          }
          
          // Apply mapping - if header exists in mappings, use mapped key, otherwise use header
          const key = props.mappings?.[header] || header
          obj[key] = value
          console.log(`    → Mapping "${header}" → "${key}" = ${value}`)
        })
        
        console.log(`  📦 Result object:`, obj)
        
        // Check required fields
        const fieldsToCheck = props.requiredFields || ['planTypeDisplay', 'minBalance', 'maxBalance', 'rate']
        const missing: string[] = []
        
        fieldsToCheck.forEach(field => {
          // Check if the field exists in the object (not undefined or empty string)
          const value = obj[field]
          if (value === undefined || value === null || value === '') {
            missing.push(field)
          }
        })
        
        if (missing.length > 0) {
          console.log(`  ❌ Row ${actualRow} SKIPPED - missing: ${missing.join(', ')}`)
          console.log(`  Expected fields:`, fieldsToCheck)
          console.log(`  Got:`, Object.keys(obj))
          skippedRows.push(actualRow)
        } else {
          console.log(`  ✅ Row ${actualRow} VALID`)
          importedRows.push(obj)
        }
      })
      
      console.log('\n📊 Import summary:')
      console.log(`  Total rows: ${rows.length}`)
      console.log(`  Imported: ${importedRows.length}`)
      console.log(`  Skipped: ${skippedRows.length}`)
      console.log('  Imported data:', importedRows)
      
      if (importedRows.length === 0) {
        let msg = 'No valid data rows found. '
        if (skippedRows.length > 0) {
          msg += `${skippedRows.length} row(s) skipped at rows: ${skippedRows.join(', ')}. `
        }
        msg += `Required fields: ${(props.requiredFields || ['Plan Type', 'Min Balance', 'Max Balance', 'Rate']).join(', ')}`
        emit('error', msg)
        return
      }
      
      if (skippedRows.length > 0) {
        console.warn(`⚠️ Skipped ${skippedRows.length} rows: ${skippedRows.join(', ')}`)
      }
      
      emit('import', importedRows)
    } catch (error: any) {
      console.error('❌ Parse error:', error)
      emit('error', `Failed to parse Excel file: ${error.message}`)
    }
  }

  reader.onerror = () => {
    console.error('❌ FileReader error')
    emit('error', 'Failed to read file')
  }

  reader.readAsArrayBuffer(file)
  target.value = ''
}
</script>