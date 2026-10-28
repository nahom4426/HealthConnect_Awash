<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  getPackageRatesPerCover,
  updateBenefitRangesForPackage,
} from '../api/benefitRangeApi'
import { useApiRequest } from '@/composables/useApiRequest'
import { allMemberTYpes } from '@/types/interface'
import DefaultPage from '@/components/DefaultPage.vue'
import ExcelImportButton from '@/components/ExcelImportButton.vue'
import { generateExcelWithDropdowns } from '@/utils/excelGenerator'
import icons from '@/utils/icons'
import { toasted } from '@/utils/utils'

const route = useRoute()
const router = useRouter()
const api = useApiRequest()

const packageUuid = String(route.params.packageUuid || '')
const rates = ref<any[]>([])
const loading = ref(true)
const packageName = ref(String(route.query.packageName || ''))
const activeTab = ref<'Individual_Plan' | 'Family_Shared_Plan'>('Individual_Plan')

type RateRow = {
  familyBenefitRangeUuid?: string;
  packageUuid: string;
  planType: string;
  familySize: number;
  minBalance: number;
  maxBalance: number;
  rate: number;
  rateInput?: string;
  status?: string;
  description?: string;
  _isNew?: boolean;
  _id?: string;
}

const isManaging = ref(false)
const manageRows = ref<RateRow[]>([])
let rowIdCounter = 0

const i = icons as any

// ---------------------------------------------------------------------------
// Excel column definitions (for export via excelGenerator)
// ---------------------------------------------------------------------------
const excelColumns = [
  { header: 'Rate ID', key: 'familyBenefitRangeUuid', width: 38, readOnly: true },
  { header: 'Plan Type', key: 'planTypeDisplay', width: 25, dropdown: ['Individual Plan', 'Family Shared Plan'] },
  { header: 'Family Size', key: 'familySizeDisplay', width: 25, dropdown: allMemberTYpes.map((opt: any) => opt.label) },
  { header: 'Min Balance (ETB)', key: 'minBalance', width: 20 },
  { header: 'Max Balance (ETB)', key: 'maxBalance', width: 20 },
  { header: 'Rate (0-1)', key: 'rate', width: 15 },
  { header: 'Status', key: 'status', width: 15, dropdown: ['ACTIVE', 'INACTIVE'] },
  { header: 'Description', key: 'description', width: 30 },
]

const importRequiredFields = ['planTypeDisplay', 'minBalance', 'maxBalance', 'rate']

// Import mappings (Excel header -> field key)
const importMappings: Record<string, string> = {
  'Rate ID': 'familyBenefitRangeUuid',
  'Plan Type': 'planTypeDisplay',
  'Family Size': 'familySizeDisplay',
  'Min Balance (ETB)': 'minBalance',
  'Max Balance (ETB)': 'maxBalance',
  'Rate (0-1)': 'rate',
  'Status': 'status',
  'Description': 'description',
}

// Computed export data
const exportData = computed(() => {
  const sourceData = isManaging.value ? manageRows.value : rates.value
  return sourceData.map(r => ({
    familyBenefitRangeUuid: r.familyBenefitRangeUuid || '',
    planTypeDisplay: r.planType === 'Individual_Plan' ? 'Individual Plan' : 'Family Shared Plan',
    familySizeDisplay: r.planType === 'Individual_Plan'
      ? 'Member Only'
      : formatFamilySize(r.familySize, r.planType),
    minBalance: r.minBalance,
    maxBalance: r.maxBalance,
    rate: r.rate,
    status: r.status || 'ACTIVE',
    description: r.description || '',
  }))
})

// Tab-filtered rates
const activeTabRates = computed(() => {
  return sortedRates.value.filter(r => r.planType === activeTab.value)
})

const hasRates = computed(() => activeTabRates.value.length > 0)

const stats = computed(() => {
  if (!hasRates.value) return { total: 0, active: 0, avg: 0 }
  const activeRates = activeTabRates.value.filter(r => String(r?.status || '').toUpperCase() === 'ACTIVE')
  const sum = activeTabRates.value.reduce((acc, r) => acc + (Number(r?.rate) || 0), 0)
  return {
    total: activeTabRates.value.length,
    active: activeRates.length,
    avg: sum / activeTabRates.value.length
  }
})

function planTypePriority(planType: any) {
  const p = String(planType || '')
  if (p === 'Individual_Plan') return 1
  if (p === 'Family_Shared_Plan') return 2
  return 99
}

function sortRateRows(list: any[]) {
  return (Array.isArray(list) ? [...list] : []).sort((a: any, b: any) => {
    const na = a?._isNew ? 1 : 0
    const nb = b?._isNew ? 1 : 0
    if (na !== nb) return nb - na

    const pa = planTypePriority(a?.planType)
    const pb = planTypePriority(b?.planType)
    if (pa !== pb) return pa - pb

    const familySizeDiff = (Number(a?.familySize) || 0) - (Number(b?.familySize) || 0)
    if (familySizeDiff !== 0) return familySizeDiff

    const minDiff = (Number(a?.minBalance) || 0) - (Number(b?.minBalance) || 0)
    if (minDiff !== 0) return minDiff

    return 0
  })
}

const sortedRates = computed(() => sortRateRows(rates.value || []))

onMounted(async () => {
  await fetchRates()
})

async function fetchRates() {
  loading.value = true

  api.send(() => getPackageRatesPerCover(packageUuid), (res) => {
    const rawData = (res?.data || [])
    rates.value = rawData.map((r) => ({
      familyBenefitRangeUuid: r.familyBenefitRangeUuid,
      packageUuid: r.packageUuid || packageUuid,
      planType: r.planType || 'Individual_Plan',
      familySize: r.planType === 'Individual_Plan' ? 1 : (Number(r.familySize) || 1),
      minBalance: r.minBalance !== undefined ? Number(r.minBalance) : 0,
      maxBalance: r.maxBalance !== undefined ? Number(r.maxBalance) : 0,
      rate: Number(r.rate) || 0,
      status: r.status || 'ACTIVE',
      description: r.description || '',
    }))

    if (!res?.success) {
      toasted(false, '', res?.error || 'Unable to load package rates')
    }

    if (!packageName.value) {
      packageName.value = rates.value[0]?.packageName || 'Benefit Package Rates'
    }

    loading.value = false
  })
}

function goBack() {
  router.go(-1)
}

// ---------------------------------------------------------------------------
// Export Excel (with template support when no rates exist)
// ---------------------------------------------------------------------------
async function handleExportExcel() {
  const sourceData = isManaging.value ? manageRows.value : rates.value
  
  // If there's data, export it. If no data, export empty template
  const exportRows = sourceData.length > 0 ? exportData.value : []

  try {
    await generateExcelWithDropdowns(
      exportRows,
      excelColumns as any,
      `${packageName.value || 'package'}_rates`,
      {
        packageName: packageName.value || 'Benefit Package Rates',
        packageUuid: packageUuid,
        totalRates: sourceData.length || 0,
        subtitle: sourceData.length > 0 ? 'Rate Configuration' : 'Rate Configuration Template'
      }
    )
    
    const message = sourceData.length > 0 
      ? 'Excel exported successfully!' 
      : 'Empty template exported. Fill in the rates and import them back.'
    
    toasted(true, message)
  } catch (error: any) {
    console.error('Export error:', error)
    toasted(false, '', 'Failed to export Excel')
  }
}

function parsePlanType(raw: any): string | null {
  if (raw === undefined || raw === null || String(raw).trim() === '') return null
  
  const pt = String(raw).trim()
  
  // Must match EXACTLY one of the valid display values
  const validIndividual = ['Individual Plan', 'Individual', 'individual plan', 'individual']
  const validFamily = ['Family Shared Plan', 'Family Shared', 'family shared plan', 'family shared', 'Family Plan', 'family plan', 'Family']
  
  const lower = pt.toLowerCase()
  
  if (validIndividual.some(v => v.toLowerCase() === lower)) {
    return 'Individual_Plan'
  }
  
  if (validFamily.some(v => v.toLowerCase() === lower)) {
    return 'Family_Shared_Plan'
  }
  
  return null // Reject anything that doesn't match exactly
}

function parseFamilySize(raw: any, planType: string): number | null {
  // For Individual Plan, always return 1
  if (planType === 'Individual_Plan') return 1
  
  // For Family Shared Plan, validate against the options
  if (raw === undefined || raw === null || String(raw).trim() === '') return null
  
  const fsStr = String(raw).trim()
  
  // Try to match against the exact option labels
  const memberType = allMemberTYpes.find(
    (opt: any) => String(opt.label).toLowerCase() === fsStr.toLowerCase()
  )
  
  if (memberType) {
    return Number(memberType.value)
  }
  
  // If not found in the list, reject it
  return null
}

function parseStatus(raw: any): string | null {
  if (raw === undefined || raw === null || String(raw).trim() === '') return 'ACTIVE' // Default to ACTIVE if empty
  
  const s = String(raw).trim().toUpperCase()
  
  if (s === 'ACTIVE') return 'ACTIVE'
  if (s === 'INACTIVE') return 'INACTIVE'
  
  return null // Reject invalid status
}

function handleImport(data: any[]) {
  console.log('📥 Processing import data:', data)
  
  const skippedRows: { row: number; reason: string }[] = []
  const importedRows: RateRow[] = []

  data.forEach((row: any, idx: number) => {
    const rowNum = idx + 2 // +2 for header row and 1-based indexing
    const errors: string[] = []

    // Validate Plan Type
    const planType = parsePlanType(row.planTypeDisplay)
    if (!planType) {
      errors.push(`Invalid Plan Type "${row.planTypeDisplay}". Must be "Individual Plan" or "Family Shared Plan"`)
    }

    // Validate Family Size
    let familySize: number | null = null
    if (planType) {
      familySize = parseFamilySize(row.familySizeDisplay, planType)
      if (planType === 'Family_Shared_Plan') {
        if (familySize === null) {
          const validOptions = allMemberTYpes.map((o: any) => o.label).join(', ')
          errors.push(`Invalid Family Size "${row.familySizeDisplay}". Must be one of: ${validOptions}`)
        } else if (familySize < 1) {
          errors.push(`Family Size must be at least 1`)
        }
      } else if (planType === 'Individual_Plan') {
        // For Individual Plan, Family Size should be "Member Only" or empty
        const fsStr = String(row.familySizeDisplay || '').trim()
        if (fsStr && fsStr.toLowerCase() !== 'member only') {
          errors.push(`Individual Plan must have Family Size "Member Only" or empty, got "${fsStr}"`)
        }
      }
    }

    // Validate Min Balance
    const minBalance = row.minBalance !== undefined && row.minBalance !== '' ? Number(row.minBalance) : null
    if (minBalance === null || isNaN(minBalance)) {
      errors.push(`Min Balance is required and must be a number`)
    } else if (minBalance < 0) {
      errors.push(`Min Balance cannot be negative`)
    }

    // Validate Max Balance
    const maxBalance = row.maxBalance !== undefined && row.maxBalance !== '' ? Number(row.maxBalance) : null
    if (maxBalance === null || isNaN(maxBalance)) {
      errors.push(`Max Balance is required and must be a number`)
    } else if (maxBalance <= 0) {
      errors.push(`Max Balance must be greater than 0`)
    } else if (minBalance !== null && maxBalance <= minBalance) {
      errors.push(`Max Balance (${maxBalance}) must be greater than Min Balance (${minBalance})`)
    }

    // Validate Rate
    const rate = row.rate !== undefined && row.rate !== '' ? Number(row.rate) : null
    if (rate === null || isNaN(rate)) {
      errors.push(`Rate is required and must be a number`)
    } else if (rate <= 0 || rate > 1) {
      errors.push(`Rate must be between 0.0001 and 1, got ${rate}`)
    }

    // Validate Status
    let status: string | null = null
    if (row.status !== undefined && String(row.status).trim() !== '') {
      status = parseStatus(row.status)
      if (!status) {
        errors.push(`Invalid Status "${row.status}". Must be "ACTIVE" or "INACTIVE"`)
      }
    }

    // If any errors, skip this row
    if (errors.length > 0) {
      console.warn(`❌ Row ${rowNum} skipped:`, errors)
      skippedRows.push({ row: rowNum, reason: errors.join('; ') })
      return
    }

    // All validations passed - create the row
    const uuid = row.familyBenefitRangeUuid ? String(row.familyBenefitRangeUuid).trim() : undefined

    importedRows.push({
      familyBenefitRangeUuid: uuid,
      packageUuid,
      planType: planType!,
      familySize: planType === 'Individual_Plan' ? 1 : (familySize ?? 1),
      minBalance: minBalance!,
      maxBalance: maxBalance!,
      rate: rate!,
      rateInput: String(rate),
      status: status || 'ACTIVE',
      description: row.description ? String(row.description).trim() : '',
      _isNew: !uuid,
      _id: uuid ? `uuid-${uuid}` : `imported-${rowIdCounter++}`,
    })
  })

  // Show detailed skip reasons
  if (skippedRows.length > 0) {
    console.table(skippedRows)
    const details = skippedRows.map(s => `Row ${s.row}: ${s.reason}`).join('\n')
    console.warn('Skipped rows details:\n' + details)
  }

  if (importedRows.length === 0) {
    const msg = skippedRows.length > 0
      ? `No valid rows could be imported.\n\nSkipped rows:\n${skippedRows.map(s => `Row ${s.row}: ${s.reason}`).join('\n')}`
      : 'No valid rows found to import.'
    toasted(false, '', msg)
    return
  }

  // Enter manage mode if not already
  if (!isManaging.value) {
    startManage()
  }

  // Merge imported rows with existing manage rows
  let nextRows = [...manageRows.value]
  let updatedCount = 0
  let createdCount = 0

  for (const incoming of importedRows) {
    const matchIdx = incoming.familyBenefitRangeUuid
      ? nextRows.findIndex(r => r.familyBenefitRangeUuid === incoming.familyBenefitRangeUuid)
      : -1

    if (matchIdx >= 0) {
      // Update existing row
      nextRows[matchIdx] = {
        ...nextRows[matchIdx],
        planType: incoming.planType,
        familySize: incoming.familySize,
        minBalance: incoming.minBalance,
        maxBalance: incoming.maxBalance,
        rate: incoming.rate,
        rateInput: incoming.rateInput,
        status: incoming.status,
        description: incoming.description,
      }
      updatedCount++
    } else {
      // Add new row
      nextRows.push(incoming)
      createdCount++
    }
  }

  manageRows.value = sortRateRows(nextRows)

  // Build success message
  let message = ''
  if (updatedCount > 0 && createdCount > 0) {
    message = `✅ Imported ${importedRows.length} row(s): ${updatedCount} updated, ${createdCount} new.`
  } else if (updatedCount > 0) {
    message = `✅ Updated ${updatedCount} existing rate(s).`
  } else {
    message = `✅ Imported ${createdCount} new rate(s).`
  }
  
  if (skippedRows.length > 0) {
    message += ` ⚠️ ${skippedRows.length} row(s) skipped due to invalid data.`
    console.log('Skipped rows:', skippedRows)
  }

  toasted(true, message)
}

function handleImportError(message: string) {
  toasted(false, '', message)
}

function validateNonOverlappingRanges(rows: RateRow[]): { valid: boolean; error?: string } {
  const grouped = new Map<string, RateRow[]>()

  for (const row of rows) {
    if (String(row.status || '').toUpperCase() !== 'ACTIVE') continue
    const key = `${row.planType}_${row.familySize}`
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key)!.push(row)
  }

  for (const [key, groupRows] of grouped) {
    if (groupRows.length <= 1) continue

    const [planType, familySize] = key.split('_')
    const planLabel = formatPlanType(planType)
    const familyLabel = planType === 'Individual_Plan' ? 'Member Only' : formatFamilySize(Number(familySize), planType)
    const sorted = [...groupRows].sort((a, b) => Number(a.minBalance) - Number(b.minBalance))

    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        if (Number(sorted[i].maxBalance) >= Number(sorted[j].minBalance)) {
          return {
            valid: false,
            error: `Overlapping ranges detected for ${planLabel} (${familyLabel}): Range ${sorted[i].minBalance.toLocaleString()} - ${sorted[i].maxBalance.toLocaleString()} overlaps with ${sorted[j].minBalance.toLocaleString()} - ${sorted[j].maxBalance.toLocaleString()}.`
          }
        }
      }
    }
  }
  return { valid: true }
}

function startManage() {
  isManaging.value = true
  rowIdCounter = 0

  manageRows.value = sortRateRows((Array.isArray(rates.value) ? rates.value : []).map((r: any) => ({
    familyBenefitRangeUuid: r.familyBenefitRangeUuid,
    packageUuid: String(r.packageUuid || packageUuid),
    planType: String(r.planType || 'Individual_Plan'),
    familySize: r.planType === 'Individual_Plan' ? 1 : (Number(r.familySize) || 1),
    minBalance: Number(r.minBalance) || 0,
    maxBalance: Number(r.maxBalance) || 0,
    rate: Number(r.rate) || 0,
    rateInput: String(r.rate || '0'),
    status: r.status || 'ACTIVE',
    description: r.description || '',
    _isNew: false,
    _id: r.familyBenefitRangeUuid ? `uuid-${r.familyBenefitRangeUuid}` : `existing-${rowIdCounter++}`
  })))

  if (manageRows.value.filter(r => r.planType === activeTab.value).length === 0) {
    addManageRow()
  }
}

function cancelManage() {
  isManaging.value = false
  manageRows.value = []
}

function startManageAndAdd() {
  startManage()
  addManageRow()
}

function addManageRow() {
  if (api.pending.value) return

  const planType = activeTab.value
  const familySize = planType === 'Individual_Plan' ? 1 : 1

  manageRows.value = [...manageRows.value, {
    packageUuid,
    planType,
    familySize,
    minBalance: 0,
    maxBalance: 0,
    rate: 0,
    rateInput: '0',
    status: 'ACTIVE',
    description: '',
    _isNew: true,
    _id: `new-${rowIdCounter++}`
  }]

  manageRows.value = sortRateRows(manageRows.value as any)
}

function removeNewManageRow(row: RateRow) {
  if (row?._isNew) {
    manageRows.value = manageRows.value.filter(r => r._id !== row._id)
    return
  }

  manageRows.value = manageRows.value.map((r) => {
    if (r._id === row._id) {
      return { ...r, status: String(r.status || '').toUpperCase() === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE' }
    }
    return r
  })
}

function updateManageRow(rowId: string, field: keyof RateRow, value: any) {
  manageRows.value = manageRows.value.map((row) => {
    if (row._id === rowId) {
      const updated = { ...row, [field]: value }

      if (field === 'rateInput') {
        const str = String(value)
        if (str === '' || str === '0' || /^\d*\.?\d*$/.test(str)) {
          updated.rateInput = str
          const numVal = str === '' || str === '.' ? 0 : Number(str)
          updated.rate = isNaN(numVal) ? 0 : numVal
        }
      } else if (field === 'rate') {
        const numVal = Number(value)
        if (!isNaN(numVal)) {
          updated.rate = Math.max(0, Math.min(1, numVal))
          updated.rateInput = String(updated.rate)
        }
      }

      return updated
    }
    return row
  })
}

function saveManage() {
  if (!packageUuid) {
    toasted(false, '', 'Package UUID is missing')
    return
  }

  if (!Array.isArray(manageRows.value) || manageRows.value.length === 0) {
    toasted(false, '', 'Please add at least one rate')
    return
  }

  // Validation
  for (const [idx, r] of manageRows.value.entries()) {
    const planLabel = r.planType === 'Individual_Plan' ? 'Individual Plan' : 'Family Shared Plan'
    const prefix = `Row ${idx + 1} (${planLabel})`

    if (r.planType === 'Family_Shared_Plan') {
      if (!Number.isFinite(Number(r.familySize)) || Number(r.familySize) < 1) {
        toasted(false, '', `${prefix}: Family Size is required`)
        return
      }
    }

    if (r.minBalance === undefined || r.minBalance === null || !Number.isFinite(Number(r.minBalance)) || Number(r.minBalance) < 0) {
      toasted(false, '', `${prefix}: Min Balance must be a non-negative number`)
      return
    }

    if (r.maxBalance === undefined || r.maxBalance === null || !Number.isFinite(Number(r.maxBalance)) || Number(r.maxBalance) <= 0) {
      toasted(false, '', `${prefix}: Max Balance must be greater than 0`)
      return
    }

    if (Number(r.maxBalance) <= Number(r.minBalance)) {
      toasted(false, '', `${prefix}: Max Balance must be greater than Min Balance`)
      return
    }

    if (r.rate === undefined || r.rate === null || !Number.isFinite(Number(r.rate)) || Number(r.rate) <= 0 || Number(r.rate) > 1) {
      toasted(false, '', `${prefix}: Rate must be between 0.0001 and 1`)
      return
    }
  }

  const overlapCheck = validateNonOverlappingRanges(manageRows.value)
  if (!overlapCheck.valid) {
    toasted(false, '', overlapCheck.error || 'Overlapping ranges detected')
    return
  }

  // Build payload - include familyBenefitRangeUuid for existing rates, omit for new ones
  const allRates = manageRows.value.map((r) => {
    const payload: any = {
      packageUuid: packageUuid,
      familySize: r.planType === 'Individual_Plan' ? 1 : Number(r.familySize),
      minBalance: Number(r.minBalance),
      maxBalance: Number(r.maxBalance),
      rate: Number(r.rate),
      status: r.status || 'ACTIVE',
      planType: String(r.planType),
      description: r.description || '',
    }
    
    // Only include familyBenefitRangeUuid if it exists (updating existing rate)
    if (r.familyBenefitRangeUuid) {
      payload.familyBenefitRangeUuid = String(r.familyBenefitRangeUuid)
    }
    
    return payload
  })

  console.log('📤 Saving rates payload:', allRates)

  api.send(
    async () => {
      try {
        return await updateBenefitRangesForPackage(packageUuid, allRates as any)
      } catch (e: any) {
        return { success: false, error: e?.message || 'Failed to save rates' }
      }
    },
    async (res: any) => {
      if (res?.success) {
        toasted(true, 'Rates saved successfully!')
        cancelManage()
        await fetchRates()
      } else if (res?.error) {
        toasted(false, '', res.error)
      }
    }
  ).catch((e: any) => {
    toasted(false, '', e?.message || 'Failed to save rates')
  })
}

function formatPlanType(planType: any) {
  const labels: Record<string, string> = {
    Individual_Plan: 'Individual Plan',
    Family_Shared_Plan: 'Family Shared Plan',
  }
  return labels[String(planType)] || planType
}

function formatFamilySize(familySize: any, planType: any) {
  if (planType === 'Individual_Plan') return 'Member Only'
  const match = allMemberTYpes.find((opt: any) => Number(opt.value) === Number(familySize))
  return match ? match.label : `Member + ${familySize - 1}`
}

const familySizeOptions = allMemberTYpes

const filteredManageRows = computed(() => {
  return manageRows.value.filter(r => r.planType === activeTab.value)
})

const getStatusClass = (status: string) => {
  return String(status || '').toUpperCase() === 'ACTIVE'
    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20'
    : 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/20'
}
</script>
<template>
  <DefaultPage :placeholder="`Search ${packageName || 'rates'}...`">
    <template #add-action>
      <div class="flex gap-3 items-center">
        <button
          @click.prevent="goBack"
          class="flex gap-2 items-center px-1 py-2.5 bg-white rounded-xl border shadow-sm transition-all duration-200 group border-slate-200/60 text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:shadow"
        >
          <div class="p-1 rounded-full transition-colors bg-slate-100 group-hover:bg-slate-200">
            <i v-html="icons.back" class="block w-4 h-4"></i>
          </div>
          <span class="text-sm font-medium">Back</span>
        </button>

        <template v-if="!loading">
          <!-- Export Excel Button -->
       <button
  @click="handleExportExcel"
  :disabled="api.pending.value"
  class="flex gap-2 items-center px-4 py-2 text-sm font-medium bg-white rounded-xl border shadow-sm transition-all duration-200 text-slate-700 border-slate-200/60 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
>
  <svg class="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
  {{ hasRates ? 'Export Excel' : 'Download Template' }}
</button>

          <!-- Import Excel Button -->
          <ExcelImportButton
            :mappings="importMappings"
            :required-fields="importRequiredFields"
            :disabled="api.pending.value"
            @import="handleImport"
            @error="handleImportError"
          />

          <!-- Edit/Add Button -->
          <button
            v-if="!isManaging"
            @click.prevent="startManage"
            class="flex relative gap-2 items-center px-5 py-2.5 text-white rounded-xl shadow-md transition-all duration-200 bg-primary group shadow-primary/20 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5"
          >
            <div class="absolute inset-0 rounded-xl opacity-0 blur transition-opacity duration-300 bg-white/20 group-hover:opacity-100"></div>
            <i v-html="i?.dollar || i?.coins || i?.plus_circle || i?.plus" class="relative w-4 h-4"></i>
            <span class="relative text-sm font-medium">{{ hasRates ? 'Edit Rates' : 'Add Rate' }}</span>
          </button>
        </template>
      </div>
    </template>

    <template #default>
      <!-- Loading State -->
      <div v-if="loading" class="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <div v-for="n in 3" :key="n" class="p-6 bg-white rounded-2xl border shadow-sm border-slate-200/60">
          <div class="space-y-4 animate-pulse">
            <div class="flex justify-between">
              <div class="space-y-2">
                <div class="w-20 h-3 rounded-full bg-slate-200"></div>
                <div class="w-32 h-5 rounded-full bg-slate-300"></div>
                <div class="w-24 h-4 rounded-full bg-slate-200"></div>
              </div>
              <div class="w-16 h-6 rounded-full bg-slate-200"></div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div class="h-16 rounded-xl bg-slate-100"></div>
              <div class="h-16 rounded-xl bg-slate-100"></div>
            </div>
            <div class="h-20 bg-indigo-50 rounded-xl"></div>
          </div>
        </div>
      </div>

      <div v-else class="space-y-8">
        <!-- Tabs -->
        <div class="flex p-1 max-w-sm rounded-xl border bg-slate-100/80 border-slate-200/50">
          <button
            @click.prevent="activeTab = 'Individual_Plan'"
            :class="[
              'flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200',
              activeTab === 'Individual_Plan'
                ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/50'
                : 'text-slate-600 hover:text-slate-900'
            ]"
          >
            Per Individual
          </button>
          <button
            @click.prevent="activeTab = 'Family_Shared_Plan'"
            :class="[
              'flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200',
              activeTab === 'Family_Shared_Plan'
                ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/50'
                : 'text-slate-600 hover:text-slate-900'
            ]"
          >
            Per Family
          </button>
        </div>

        <!-- Empty State -->
      <!-- Empty State -->
<div v-if="!hasRates && !isManaging" class="flex flex-col justify-center items-center px-6 py-16 bg-white rounded-3xl border shadow-sm border-slate-200/60">
  <div class="relative mb-8">
    <div class="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full opacity-20 blur-2xl"></div>
    <div class="relative p-5 bg-white rounded-full ring-1 shadow-xl shadow-indigo-100 ring-slate-100">
      <i v-html="i?.dollar || i?.coins || i?.coverage" class="w-8 h-8 text-indigo-600"></i>
    </div>
  </div>
  <h3 class="text-xl font-bold tracking-tight text-slate-900">
    No rates configured for {{ activeTab === 'Individual_Plan' ? 'Individual' : 'Family Shared' }} Plan
  </h3>
  <p class="mt-2 max-w-sm text-center text-slate-500">
    Download the template, fill in your rates, and import them back. Or create them manually.
  </p>
  <div class="flex flex-wrap gap-3 justify-center mt-8">
    <!-- Download Template Button -->
    <button
      @click="handleExportExcel"
      class="flex gap-2 items-center px-5 py-3 font-medium text-white bg-emerald-600 rounded-xl shadow-lg transition-all duration-200 shadow-emerald-200 hover:bg-emerald-700 hover:-translate-y-0.5"
    >
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      Download Template
    </button>
    
    <!-- Import Button -->
    <ExcelImportButton
      :mappings="importMappings"
      :required-fields="importRequiredFields"
      @import="handleImport"
      @error="handleImportError"
    />
    
    <!-- Create Manually Button -->
    <button
      @click.prevent="startManage"
      class="flex gap-2 items-center px-5 py-3 font-medium text-white rounded-xl shadow-lg transition-all duration-200 bg-primary shadow-primary/20 hover:bg-primary/90 hover:-translate-y-0.5"
    >
      <i v-html="i?.plus_circle || i?.plus" class="w-4 h-4"></i>
      <span>Create Manually</span>
    </button>
  </div>
</div>

        <!-- Main Content Area -->
        <div v-else class="space-y-8">
          <div class="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            <!-- View Mode Cards -->
            <template v-if="!isManaging">
              <button
                type="button"
                @click.prevent="startManageAndAdd"
                class="flex relative justify-center items-center min-h-[320px] bg-white rounded-2xl border border-dashed shadow-sm transition-all duration-300 group border-slate-200/60 hover:border-primary/60 hover:shadow-lg"
              >
                <div class="absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 from-primary/10 to-primary/20 group-hover:opacity-100"></div>
                <div class="flex relative flex-col gap-3 items-center px-8">
                  <div class="flex justify-center items-center w-14 h-14 rounded-2xl shadow-lg transition-transform duration-300 bg-primary shadow-primary/20 group-hover:scale-105">
                    <i v-html="i?.plus" class="w-6 h-6 text-white"></i>
                  </div>
                  <div class="text-center">
                    <p class="text-base font-semibold text-slate-900">Add Rate Card</p>
                    <p class="mt-1 text-sm text-slate-500">
                      Configure rates for {{ activeTab === 'Individual_Plan' ? 'Individual' : 'Family Shared' }} Plan
                    </p>
                  </div>
                </div>
              </button>

              <div
                v-for="(r, idx) in activeTabRates"
                :key="r?.familyBenefitRangeUuid || idx"
                class="overflow-hidden relative bg-white rounded-2xl border shadow-sm transition-all duration-300 group border-slate-200/60 hover:shadow-xl hover:border-indigo-200"
              >
                <div class="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 transition-opacity group-hover:opacity-100"></div>
                <div class="p-6">
                  <div class="flex gap-4 justify-between items-start mb-5">
                    <div>
                      <p class="mb-1 text-xs font-semibold tracking-wider text-indigo-600 uppercase">Plan Type</p>
                      <p class="text-lg font-bold tracking-tight text-slate-900">{{ formatPlanType(r?.planType) }}</p>
                      <div v-if="r?.planType === 'Family_Shared_Plan'" class="flex gap-1.5 items-center mt-1.5">
                        <div class="p-0.5 rounded-full bg-slate-100">
                          <svg class="w-3 h-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <p class="text-sm font-medium text-slate-600">{{ formatFamilySize(r?.familySize, r?.planType) }}</p>
                      </div>
                    </div>
                    <span :class="['px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide shadow-sm', getStatusClass(r?.status)]">
                      {{ r?.status }}
                    </span>
                  </div>

                  <div class="mb-4 space-y-1">
                    <p class="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Balance Range</p>
                    <div class="flex gap-1 items-baseline">
                      <span class="text-lg font-semibold text-slate-800">{{ Number(r?.minBalance || 0).toLocaleString() }}</span>
                      <span class="text-xs font-medium text-slate-400">to</span>
                      <span class="text-lg font-semibold text-slate-800">{{ Number(r?.maxBalance || 0).toLocaleString() }}</span>
                      <span class="ml-1 text-xs font-semibold text-slate-500">ETB</span>
                    </div>
                  </div>

                  <div class="relative p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100/50">
                    <p class="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider mb-1">Premium Rate</p>
                    <p class="text-2xl font-bold tracking-tight text-indigo-950">
                      {{ Number(r?.rate || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 }) }}
                    </p>
                    <div class="absolute right-0 bottom-0 p-2 opacity-10">
                      <i v-html="i?.dollar || i?.coins" class="w-8 h-8"></i>
                    </div>
                  </div>

                  <p v-if="r?.description" class="mt-4 text-sm italic text-slate-500 line-clamp-2">"{{ r.description }}"</p>
                </div>
              </div>
            </template>

            <!-- Edit Mode Cards -->
            <template v-else>
              <button
                type="button"
                @click.prevent="addManageRow"
                :disabled="api.pending.value"
                class="flex relative justify-center items-center min-h-[320px] bg-white rounded-2xl border border-dashed shadow-sm transition-all duration-300 group border-slate-200/60 hover:border-primary/60 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div class="absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 from-primary/10 to-primary/20 group-hover:opacity-100"></div>
                <div class="flex relative flex-col gap-3 items-center px-8">
                  <div class="flex justify-center items-center w-14 h-14 rounded-2xl shadow-lg transition-transform duration-300 bg-primary shadow-primary/20 group-hover:scale-105">
                    <i v-html="i?.plus" class="w-6 h-6 text-white"></i>
                  </div>
                  <div class="text-center">
                    <p class="text-base font-semibold text-slate-900">Add Rate Card</p>
                    <p class="mt-1 text-sm text-slate-500">Add missing rate card</p>
                  </div>
                </div>
              </button>

              <div
                v-for="r in filteredManageRows"
                :key="r._id"
                :class="[
                  'overflow-hidden relative rounded-2xl border shadow-sm transition-all duration-300',
                  String(r?.status || '').toUpperCase() === 'INACTIVE'
                    ? 'bg-rose-50/60 border-rose-200/70 shadow-rose-100'
                    : r?._isNew
                      ? 'bg-indigo-50/40 border-indigo-200/70 shadow-indigo-100'
                      : 'bg-white border-slate-200/60'
                ]"
              >
                <div
                  :class="[
                    'absolute top-0 right-0 left-0 h-1',
                    String(r?.status || '').toUpperCase() === 'INACTIVE'
                      ? 'bg-gradient-to-r from-rose-500 to-red-500'
                      : r?._isNew
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500'
                        : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                  ]"
                ></div>

                <div class="p-6">
                  <div class="space-y-4">
                    <div class="flex justify-between items-center">
                      <span class="text-xs font-bold tracking-wider uppercase text-slate-500">{{ formatPlanType(r.planType) }}</span>
                      <span v-if="r._isNew" class="px-2 py-0.5 text-[10px] font-bold tracking-wider text-indigo-700 bg-indigo-100 rounded uppercase">New</span>
                      <span v-else-if="r.familyBenefitRangeUuid" class="px-2 py-0.5 text-[10px] font-mono text-slate-400 truncate max-w-[120px]" :title="r.familyBenefitRangeUuid">
                        {{ r.familyBenefitRangeUuid.slice(0, 8) }}…
                      </span>
                    </div>

                    <div v-if="r.planType === 'Family_Shared_Plan'">
                      <label class="block mb-1.5 text-xs font-semibold tracking-wider uppercase text-slate-600">Family Size</label>
                      <select
                        :value="r.familySize"
                        @change="(e) => updateManageRow(r._id!, 'familySize', Number((e.target as HTMLSelectElement).value))"
                        class="px-1 py-2.5 w-full text-sm bg-white rounded-xl border shadow-sm transition-all duration-200 outline-none border-slate-200 text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      >
                        <option v-for="opt in familySizeOptions" :key="opt.value" :value="Number(opt.value)">{{ opt.label }}</option>
                      </select>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                      <div>
                        <label class="block mb-1.5 text-xs font-semibold tracking-wider uppercase text-slate-600">Min Balance (ETB)</label>
                        <input
                          :value="r.minBalance"
                          @input="(e) => updateManageRow(r._id!, 'minBalance', (e.target as HTMLInputElement).value === '' ? 0 : Number((e.target as HTMLInputElement).value))"
                          type="number" min="0" step="1000"
                          class="px-1 py-2.5 w-full text-sm bg-white rounded-xl border shadow-sm transition-all duration-200 outline-none border-slate-200 text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label class="block mb-1.5 text-xs font-semibold tracking-wider uppercase text-slate-600">Max Balance (ETB)</label>
                        <input
                          :value="r.maxBalance"
                          @input="(e) => updateManageRow(r._id!, 'maxBalance', (e.target as HTMLInputElement).value === '' ? 0 : Number((e.target as HTMLInputElement).value))"
                          type="number" min="0" step="1000"
                          class="px-1 py-2.5 w-full text-sm bg-white rounded-xl border shadow-sm transition-all duration-200 outline-none border-slate-200 text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                      <div>
                        <label class="block mb-1.5 text-xs font-semibold tracking-wider uppercase text-slate-600">Rate (0.0001 - 1)</label>
                        <input
                          :value="r.rateInput"
                          @input="(e) => updateManageRow(r._id!, 'rateInput', (e.target as HTMLInputElement).value)"
                          @blur="(e) => {
                            const val = (e.target as HTMLInputElement).value;
                            const num = val === '' || val === '.' ? 0 : Number(val);
                            updateManageRow(r._id!, 'rate', isNaN(num) ? 0 : Math.min(1, Math.max(0, num)));
                          }"
                          type="text" inputmode="decimal" placeholder="0.0001"
                          class="px-1 py-2.5 w-full text-sm bg-white rounded-xl border shadow-sm transition-all duration-200 outline-none border-slate-200 text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label class="block mb-1.5 text-xs font-semibold tracking-wider uppercase text-slate-600">Status</label>
                        <select
                          :value="r.status"
                          @change="(e) => updateManageRow(r._id!, 'status', (e.target as HTMLSelectElement).value)"
                          class="px-1 py-2.5 w-full text-sm bg-white rounded-xl border shadow-sm transition-all duration-200 outline-none border-slate-200 text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        >
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="INACTIVE">INACTIVE</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label class="block mb-1.5 text-xs font-semibold tracking-wider uppercase text-slate-600">Description</label>
                      <input
                        :value="r.description"
                        @input="(e) => updateManageRow(r._id!, 'description', (e.target as HTMLInputElement).value)"
                        type="text" placeholder="Optional description"
                        class="px-1 py-2.5 w-full text-sm bg-white rounded-xl border shadow-sm transition-all duration-200 outline-none border-slate-200 text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </div>

                    <div class="flex justify-end pt-2">
                      <button type="button" class="text-sm font-medium text-rose-600 transition-colors hover:text-rose-700" @click.prevent="removeNewManageRow(r)">
                        {{ r._isNew ? 'Remove Card' : (String(r?.status || '').toUpperCase() === 'INACTIVE' ? 'Activate Card' : 'Deactivate Card') }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>

          <!-- Save/Cancel Buttons -->
          <div v-if="isManaging" class="flex gap-3 justify-end pt-4 border-t border-slate-200">
            <button
              @click.prevent="cancelManage"
              :disabled="api.pending.value"
              class="px-6 py-2.5 text-sm font-medium bg-white rounded-xl border shadow-sm transition-all duration-200 text-slate-700 border-slate-200/60 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              @click.prevent="saveManage"
              :disabled="api.pending.value"
              class="flex relative gap-2 items-center px-6 py-2.5 text-sm font-medium text-white rounded-xl shadow-md transition-all duration-200 bg-primary group shadow-primary/20 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <template v-if="api.pending.value">
                <svg class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0z" />
                </svg>
                <span>Saving...</span>
              </template>
              <template v-else>
                <i v-html="i?.check || i?.save" class="w-4 h-4"></i>
                <span>Save All Changes</span>
              </template>
            </button>
          </div>

          <!-- Stats Dashboard -->
          <div v-if="!isManaging" class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div class="overflow-hidden relative p-6 bg-white rounded-2xl border shadow-sm transition-all duration-300 group border-slate-200/60 hover:shadow-md">
              <div class="absolute -top-4 -right-4 w-24 h-24 rounded-full blur-2xl transition-colors bg-blue-500/5 group-hover:bg-blue-500/10"></div>
              <div class="flex relative gap-5 items-center">
                <div class="flex-shrink-0 p-3.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-200">
                  <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <p class="text-sm font-medium text-slate-500">Total Rates</p>
                  <p class="text-3xl font-bold tracking-tight text-slate-900">{{ stats.total }}</p>
                </div>
              </div>
            </div>

            <div class="overflow-hidden relative p-6 bg-white rounded-2xl border shadow-sm transition-all duration-300 group border-slate-200/60 hover:shadow-md">
              <div class="absolute -top-4 -right-4 w-24 h-24 rounded-full blur-2xl transition-colors bg-emerald-500/5 group-hover:bg-emerald-500/10"></div>
              <div class="flex relative gap-5 items-center">
                <div class="flex-shrink-0 p-3.5 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg shadow-emerald-200">
                  <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p class="text-sm font-medium text-slate-500">Active Rates</p>
                  <p class="text-3xl font-bold tracking-tight text-slate-900">{{ stats.active }}</p>
                </div>
              </div>
            </div>

            <div class="overflow-hidden relative p-6 bg-white rounded-2xl border shadow-sm transition-all duration-300 group border-slate-200/60 hover:shadow-md">
              <div class="absolute -top-4 -right-4 w-24 h-24 rounded-full blur-2xl transition-colors bg-amber-500/5 group-hover:bg-amber-500/10"></div>
              <div class="flex relative gap-5 items-center">
                <div class="flex-shrink-0 p-3.5 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg shadow-amber-200">
                  <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div>
                  <p class="text-sm font-medium text-slate-500">Average Rate</p>
                  <p class="text-3xl font-bold tracking-tight text-slate-900">
                    {{ Number(stats.avg || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 }) }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </DefaultPage>
</template>

<style scoped>
.flex-col {
  transition: all 0.2s ease;
}
.ring-1 {
  transition: background-color 0.2s ease, border-color 0.2s ease;
}
.inline-flex:hover {
  filter: brightness(0.98);
}
</style>