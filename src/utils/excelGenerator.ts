import JSZip from 'jszip'

interface ColumnConfig {
  header: string
  key: string
  width?: number
  readOnly?: boolean
  dropdown?: string[]
}

interface ExportOptions {
  title?: string
  subtitle?: string
  packageName?: string
  packageUuid?: string
  exportDate?: string
  totalRates?: number
}

export async function generateExcelWithDropdowns(
  data: any[],
  columns: ColumnConfig[],
  filename: string,
  options: ExportOptions = {}
): Promise<void> {
  const zip = new JSZip()

  const sharedStrings = collectSharedStrings(data, columns, options)
  const stringIndexMap = new Map<string, number>()
  sharedStrings.forEach((s, i) => stringIndexMap.set(s, i))

  const sheetXml = generateSheetXml(data, columns, stringIndexMap, options)
  zip.file('xl/worksheets/sheet1.xml', sheetXml)

  const sharedStringsXml = generateSharedStringsXml(sharedStrings)
  zip.file('xl/sharedStrings.xml', sharedStringsXml)

  zip.file('xl/styles.xml', generateStylesXml())

  zip.file('xl/workbook.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
              xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
      <sheets>
        <sheet name="Benefit Rates" sheetId="1" r:id="rId1"/>
      </sheets>
    </workbook>`)

  zip.file('xl/_rels/workbook.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
      <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
      <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
      <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>
    </Relationships>`)

  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
      <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
      <Default Extension="xml" ContentType="application/xml"/>
      <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
      <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
      <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
      <Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>
    </Types>`)

  const rootRels = zip.folder('_rels')
  if (rootRels) {
    rootRels.file('.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
        <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
      </Relationships>`)
  }

  const blob = await zip.generateAsync({ type: 'blob' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

function generateStylesXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
      <fonts count="6">
        <font><sz val="11"/><name val="Calibri"/></font>
        <font><b/><sz val="11"/><name val="Calibri"/></font>
        <font><b/><sz val="20"/><name val="Calibri"/><color rgb="1E3A5F"/></font>
        <font><b/><sz val="12"/><name val="Calibri"/><color rgb="4F46E5"/></font>
        <font><sz val="10"/><name val="Calibri"/><color rgb="6B7280"/></font>
        <font><b/><sz val="11"/><name val="Calibri"/><color rgb="FFFFFF"/></font>
      </fonts>
      <fills count="6">
        <fill><patternFill patternType="none"/></fill>
        <fill><patternFill patternType="gray125"/></fill>
        <fill><patternFill patternType="solid"><fgColor rgb="F0F0F0"/></patternFill></fill>
        <fill><patternFill patternType="solid"><fgColor rgb="F8FAFC"/></patternFill></fill>
        <fill><patternFill patternType="solid"><fgColor rgb="4F46E5"/></patternFill></fill>
        <fill><patternFill patternType="solid"><fgColor rgb="EEF2FF"/></patternFill></fill>
      </fills>
      <borders count="3">
        <border><left/><right/><top/><bottom/><diagonal/></border>
        <border>
          <bottom style="thin"><color rgb="E5E7EB"/></bottom>
        </border>
        <border>
          <bottom style="medium"><color rgb="4F46E5"/></bottom>
        </border>
      </borders>
      <cellStyleXfs count="1">
        <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
      </cellStyleXfs>
      <cellXfs count="8">
        <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
        <xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>
        <xf numFmtId="0" fontId="0" fillId="2" borderId="0" xfId="0" applyFill="1"/>
        <xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
        <xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
        <xf numFmtId="0" fontId="4" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
        <xf numFmtId="0" fontId="5" fillId="4" borderId="2" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
        <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"/>
      </cellXfs>
    </styleSheet>`
}

function generateSheetXml(
  data: any[], 
  columns: ColumnConfig[], 
  stringIndexMap: Map<string, number>,
  options: ExportOptions
): string {
  let xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
  xml += '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">\n'
  
  // Column widths
  xml += '  <cols>\n'
  columns.forEach((col, i) => {
    xml += `    <col min="${i + 1}" max="${i + 1}" width="${col.width || 20}" customWidth="1"/>\n`
  })
  xml += '  </cols>\n'

  xml += '  <sheetData>\n'
  
  const lastCol = getColLetter(columns.length - 1)
  const packageName = options.packageName || 'Benefit Package Rates'
  const totalRates = options.totalRates ?? data.length
  
  // Row 1: Package Name - Large, bold, dark blue, CENTERED (style 3)
  const titleIdx = stringIndexMap.get(packageName) ?? 0
  xml += `    <row r="1" ht="40" customHeight="1">\n`
  xml += `      <c r="A1" t="s" s="3"><v>${titleIdx}</v></c>\n`
  xml += `    </row>\n`

  // Row 2: Subtitle - CENTERED (style 4)
  const subtitleText = 'Rate Configuration'
  const subtitleIdx = stringIndexMap.get(subtitleText) ?? 0
  xml += `    <row r="2" ht="24" customHeight="1">\n`
  xml += `      <c r="A2" t="s" s="4"><v>${subtitleIdx}</v></c>\n`
  xml += `    </row>\n`

  // Row 3: Export info - CENTERED (style 5)
  const exportDate = options.exportDate || new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
  const infoText = `Exported: ${exportDate}  •  Total Rates: ${totalRates}`
  const infoIdx = stringIndexMap.get(infoText) ?? 0
  xml += `    <row r="3" ht="20" customHeight="1">\n`
  xml += `      <c r="A3" t="s" s="5"><v>${infoIdx}</v></c>\n`
  xml += `    </row>\n`

  // Row 4: Empty spacer
  xml += `    <row r="4" ht="10" customHeight="1">\n`
  xml += `      <c r="A4" s="0"/>\n`
  xml += `    </row>\n`

  // Row 5: Column headers - Indigo bg, white text, CENTERED (style 6)
  const headerRowNum = 5
  xml += `    <row r="${headerRowNum}" ht="30" customHeight="1">\n`
  columns.forEach((col, i) => {
    const colLetter = getColLetter(i)
    const idx = stringIndexMap.get(col.header) ?? 0
    xml += `      <c r="${colLetter}${headerRowNum}" t="s" s="6"><v>${idx}</v></c>\n`
  })
  xml += `    </row>\n`

  // Data rows (starting from row 6)
  data.forEach((row, rowIdx) => {
    const rowNum = headerRowNum + 1 + rowIdx
    
    xml += `    <row r="${rowNum}">\n`
    columns.forEach((col, colIdx) => {
      const colLetter = getColLetter(colIdx)
      const value = row[col.key]
      const cellStyle = col.readOnly ? '2' : '7'
      
      if (value === null || value === undefined || value === '') {
        xml += `      <c r="${colLetter}${rowNum}" s="${cellStyle}"/>\n`
      } else if (typeof value === 'number') {
        xml += `      <c r="${colLetter}${rowNum}" s="${cellStyle}"><v>${value}</v></c>\n`
      } else {
        const strValue = String(value)
        const idx = stringIndexMap.get(strValue)
        if (idx !== undefined) {
          xml += `      <c r="${colLetter}${rowNum}" t="s" s="${cellStyle}"><v>${idx}</v></c>\n`
        } else {
          xml += `      <c r="${colLetter}${rowNum}" t="inlineStr" s="${cellStyle}"><is><t>${escapeXml(strValue)}</t></is></c>\n`
        }
      }
    })
    xml += `    </row>\n`
  })
  xml += '  </sheetData>\n'

  // Merge cells for centered headers
  xml += `  <mergeCells count="3">\n`
  xml += `    <mergeCell ref="A1:${lastCol}1"/>\n`
  xml += `    <mergeCell ref="A2:${lastCol}2"/>\n`
  xml += `    <mergeCell ref="A3:${lastCol}3"/>\n`
  xml += `  </mergeCells>\n`

  // Data validations (dropdowns)
  const extendedLastRow = Math.max(headerRowNum + data.length + 100, headerRowNum + 200)
  
  const validationsXml: string[] = []
  
  columns.forEach((col, colIdx) => {
    if (col.dropdown && col.dropdown.length > 0) {
      const colLetter = getColLetter(colIdx)
      const sqref = `${colLetter}${headerRowNum + 1}:${colLetter}${extendedLastRow}`
      const formula1 = col.dropdown.map(opt => escapeXml(opt)).join(',')
      
      validationsXml.push(`    <dataValidation 
      type="list" 
      allowBlank="1" 
      showDropDown="1" 
      sqref="${sqref}">
      <formula1>"${formula1}"</formula1>
    </dataValidation>`)
    }
  })

  if (validationsXml.length > 0) {
    xml += `  <dataValidations count="${validationsXml.length}">\n`
    xml += validationsXml.join('\n')
    xml += '\n  </dataValidations>\n'
  }

  xml += '</worksheet>'
  return xml
}

function collectSharedStrings(
  data: any[], 
  columns: ColumnConfig[],
  options: ExportOptions
): string[] {
  const set = new Set<string>()
  
  const packageName = options.packageName || 'Benefit Package Rates'
  set.add(packageName)
  set.add('Rate Configuration')
  
  const exportDate = options.exportDate || new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
  const totalRates = options.totalRates ?? data.length
  set.add(`Exported: ${exportDate}  •  Total Rates: ${totalRates}`)
  
  columns.forEach(col => set.add(col.header))
  
  columns.forEach(col => {
    if (col.dropdown) {
      col.dropdown.forEach(opt => set.add(opt))
    }
  })
  
  data.forEach(row => {
    columns.forEach(col => {
      const val = row[col.key]
      if (typeof val === 'string' && val !== '') {
        set.add(val)
      }
    })
  })
  
  return Array.from(set).sort()
}

function generateSharedStringsXml(strings: string[]): string {
  let xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
  xml += `<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${strings.length}" uniqueCount="${strings.length}">\n`
  
  strings.forEach(s => {
    xml += `  <si><t xml:space="preserve">${escapeXml(s)}</t></si>\n`
  })
  
  xml += '</sst>'
  return xml
}

function getColLetter(index: number): string {
  let letter = ''
  let num = index
  while (num >= 0) {
    letter = String.fromCharCode((num % 26) + 65) + letter
    num = Math.floor(num / 26) - 1
  }
  return letter
}

function escapeXml(str: string): string {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}