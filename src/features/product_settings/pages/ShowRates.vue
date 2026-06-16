<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  createBenefitRangesForPackage,
  getPackageRatesPerCover,
  updateBenefitRangesForPackage,
} from '../api/benefitRangeApi'
import { useApiRequest } from '@/composables/useApiRequest'
import { allMemberTYpes } from '@/types/interface'
import DefaultPage from '@/components/DefaultPage.vue'
import icons from '@/utils/icons'
import { toasted } from '@/utils/utils'

const route = useRoute()
const router = useRouter()
const api = useApiRequest()

const packageUuid = String(route.params.packageUuid || '')
const rates = ref<any[]>([])
const loading = ref(true)
const packageName = ref('')
const activeTab = ref<'Individual_Plan' | 'Family_Shared_Plan'>('Individual_Plan')

type RateRow = {
  familyBenefitRangeUuid?: string;
  packageUuid: string;
  planType: string;
  familySize: number;
  minBalance: number;
  maxBalance: number;
  rate: number;
  status?: string;
  description?: string;
  _isNew?: boolean;
}

const isManaging = ref(false)
const manageRows = ref<RateRow[]>([])

const i = icons as any

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

    const minDiff = (Number(a?.minBalance) || 0) - (Number(b?.minBalance) || 0)
    if (minDiff !== 0) return minDiff

    return (Number(a?.familySize) || 0) - (Number(b?.familySize) || 0)
  })
}

const sortedRates = computed(() => sortRateRows(rates.value || []))

onMounted(async () => {
  await fetchRates()
})

async function fetchRates() {
  loading.value = true

  api.send(() => getPackageRatesPerCover(packageUuid), (res) => {
    const rawData = (res?.data as any[]) || []
    rates.value = rawData.map((r: any) => ({
      familyBenefitRangeUuid: r.familyBenefitRangeUuid,
      packageUuid: String(r.packageUuid || packageUuid),
      planType: String(r.planType || 'Individual_Plan'),
      familySize: String(r.planType) === 'Individual_Plan' ? 0 : (Number(r.familySize) || 2),
      minBalance: r.minBalance !== undefined ? Number(r.minBalance) : (r.minLimit !== undefined ? Number(r.minLimit) : 0),
      maxBalance: r.maxBalance !== undefined ? Number(r.maxBalance) : (r.maxLimit !== undefined ? Number(r.maxLimit) : 0),
      rate: Number(r.rate) || 0,
      status: r.status || 'ACTIVE',
      description: r.description || '',
    }))

    if (!res?.success) {
      toasted(false, '', res?.error || 'Unable to load package rates')
    }

    if (rates.value.length > 0 && rates.value[0]?.packageName) {
      packageName.value = rates.value[0].packageName
    }

    loading.value = false
  })
}

function goBack() {
  router.go(-1)
}

function startManage() {
  isManaging.value = true
  manageRows.value = sortRateRows((Array.isArray(rates.value) ? rates.value : []).map((r: any) => ({
    familyBenefitRangeUuid: r.familyBenefitRangeUuid,
    packageUuid: String(r.packageUuid || packageUuid),
    planType: String(r.planType || 'Individual_Plan'),
    familySize: String(r.planType) === 'Individual_Plan' ? 0 : (Number(r.familySize) || 2),
    minBalance: Number(r.minBalance) || 0,
    maxBalance: Number(r.maxBalance) || 0,
    rate: Number(r.rate) || 0,
    status: r.status || 'ACTIVE',
    description: r.description || '',
    _isNew: false,
  })))

  // Auto-add row if active tab is empty in manage mode
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
  const familySize = planType === 'Individual_Plan' ? 0 : 2

  manageRows.value.push({
    packageUuid,
    planType,
    familySize,
    minBalance: 0,
    maxBalance: 0,
    rate: 0,
    status: 'ACTIVE',
    description: '',
    _isNew: true,
  })

  manageRows.value = sortRateRows(manageRows.value as any)
}

function removeNewManageRow(row: RateRow) {
  const idx = manageRows.value.indexOf(row)
  if (idx === -1) return

  if (row?._isNew) {
    manageRows.value.splice(idx, 1)
    return
  }

  row.status = String(row.status || '').toUpperCase() === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE'
}

// Validate rate between 0 and 1
function validateRate(row: RateRow) {
  if (row.rate < 0) row.rate = 0
  if (row.rate > 1) row.rate = 1
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

  for (const [idx, r] of manageRows.value.entries()) {
    const planLabel = r.planType === 'Individual_Plan' ? 'Individual Plan' : 'Family Shared Plan'
    const prefix = `Row ${idx + 1} (${planLabel})`
    
    if (r.planType === 'Family_Shared_Plan') {
      if (!Number.isFinite(Number(r.familySize)) || Number(r.familySize) <= 1) {
        toasted(false, '', `${prefix}: Family Size is required`)
        return
      }
    }
    
    if (r.minBalance === undefined || r.minBalance === null || !Number.isFinite(Number(r.minBalance)) || Number(r.minBalance) < 0) {
      toasted(false, '', `${prefix}: Min Balance must be a non-negative number`)
      return
    }
    
    if (r.maxBalance === undefined || r.maxBalance === null || !Number.isFinite(Number(r.maxBalance)) || Number(r.maxBalance) < Number(r.minBalance)) {
      toasted(false, '', `${prefix}: Max Balance must be greater than or equal to Min Balance`)
      return
    }
    
    if (r.rate === undefined || r.rate === null || String(r.rate).trim() === '' || !Number.isFinite(Number(r.rate))) {
      toasted(false, '', `${prefix}: Rate is required`)
      return
    }
    
    if (Number(r.rate) < 0 || Number(r.rate) > 1) {
      toasted(false, '', `${prefix}: Rate must be between 0 and 1`)
      return
    }
  }

  const toCreate = manageRows.value
    .filter((r) => !r?.familyBenefitRangeUuid)
    .map((r) => ({
      familySize: r.planType === 'Individual_Plan' ? 1 : Number(r.familySize),
      minBalance: Number(r.minBalance),
      maxBalance: Number(r.maxBalance),
      rate: Number(r.rate),
      status: r.status || 'ACTIVE',
      planType: String(r.planType),
      description: r.description || undefined,
    }))

  const toUpdate = manageRows.value
    .filter((r) => !!r?.familyBenefitRangeUuid)
    .map((r) => ({
      familyBenefitRangeUuid: String(r.familyBenefitRangeUuid),
      familySize: r.planType === 'Individual_Plan' ? 1 : Number(r.familySize),
      minBalance: Number(r.minBalance),
      maxBalance: Number(r.maxBalance),
      rate: Number(r.rate),
      status: r.status || 'ACTIVE',
      planType: String(r.planType),
      description: r.description || undefined,
    }))

  api.send(
    async () => {
      try {
        if (toCreate.length > 0) {
          const res: any = await createBenefitRangesForPackage(packageUuid, toCreate as any)
          if (!res?.success) return res
        }

        if (toUpdate.length > 0) {
          const res: any = await updateBenefitRangesForPackage(packageUuid, toUpdate as any)
          if (!res?.success) return res
        }

        return { success: true } as any
      } catch (e: any) {
        return { success: false, error: e?.message || 'Failed to save rates' } as any
      }
    },
    async (res: any) => {
      if (res?.success) {
        toasted(true, 'Rates saved successfully!', res?.error)
        cancelManage()
        await fetchRates()
        return
      }
    }
  )
  .catch((e: any) => {
    toasted(false, '', e?.message || 'Failed to save rates')
  })
}

function formatPlanType(planType: any) {
  switch (planType) {
    case 'Individual_Plan':
      return 'Individual Plan'
    case 'Family_Shared_Plan':
      return 'Family Shared Plan'
    default:
      return planType
  }
}

function formatFamilySize(familySize: any, planType: any) {
  if (planType === 'Individual_Plan') {
    return 'Member Only'
  }
  const match = allMemberTYpes.find((opt: any) => Number(opt.value) === Number(familySize))
  return match ? match.label : `Member + ${familySize - 1}`
}

const familySizeOptions = allMemberTYpes.filter((opt: any) => Number(opt.value) !== 1)

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
  <DefaultPage :placeholder="'Search rates...'">
    <template #add-action>
      <div class="flex gap-3 items-center">
        <!-- Modern Back Button -->
        <button
          @click.prevent="goBack"
          class="flex gap-2 items-center px-1 py-2.5 bg-white rounded-xl border shadow-sm transition-all duration-200 group border-slate-200/60 text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:shadow"
        >
          <div class="p-1 rounded-full transition-colors bg-slate-100 group-hover:bg-slate-200">
            <i v-html="icons.back" class="block w-4 h-4"></i>
          </div>
          <span class="text-sm font-medium">Back</span>
        </button>

        <!-- Modern Primary Action Button -->
        <template v-if="!loading">
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
      <!-- Loading State Skeleton -->
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
        <!-- Modern Segmented Tabs -->
        <div class="flex p-1 bg-slate-100/80 rounded-xl max-w-sm border border-slate-200/50">
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

        <!-- Empty State for the Active Tab -->
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
            Start building your package by adding rate cards for this plan type.
          </p>
          <button
            @click.prevent="startManage"
            class="flex gap-2 items-center px-6 py-3 mt-8 font-medium text-white rounded-xl shadow-lg transition-all duration-200 bg-primary shadow-primary/20 hover:bg-primary/90 hover:-translate-y-0.5"
          >
            <i v-html="i?.plus_circle || i?.plus" class="w-4 h-4"></i>
            <span>Create First Rate</span>
          </button>
        </div>

        <!-- Main Content Area -->
        <div v-else class="space-y-8">
          <!-- Card Grid -->
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
                <!-- Card Accent Border -->
                <div class="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 transition-opacity group-hover:opacity-100"></div>
                
                <div class="p-6">
                  <!-- Header -->
                  <div class="flex gap-4 justify-between items-start mb-5">
                    <div>
                      <p class="mb-1 text-xs font-semibold tracking-wider text-indigo-600 uppercase">Plan Type</p>
                      <p class="text-lg font-bold tracking-tight text-slate-900">{{ formatPlanType(r?.planType) }}</p>
                      
                      <!-- Family Size Display -->
                      <div v-if="r?.planType === 'Family_Shared_Plan'" class="flex gap-1.5 items-center mt-1.5">
                        <div class="p-0.5 rounded-full bg-slate-100">
                          <svg class="w-3 h-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <p class="text-sm font-medium text-slate-600">
                          {{ formatFamilySize(r?.familySize, r?.planType) }}
                        </p>
                      </div>
                    </div>
                    <span
                      :class="[
                        'px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide shadow-sm',
                        getStatusClass(r?.status)
                      ]"
                    >
                      {{ r?.status }}
                    </span>
                  </div>

                  <!-- Balance Range Display -->
                  <div class="mb-4 space-y-1">
                    <p class="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Balance Range</p>
                    <div class="flex gap-1 items-baseline">
                      <span class="text-lg font-semibold text-slate-800">
                        {{ Number(r?.minBalance || 0).toLocaleString() }}
                      </span>
                      <span class="text-xs text-slate-400 font-medium">to</span>
                      <span class="text-lg font-semibold text-slate-800">
                        {{ Number(r?.maxBalance || 0).toLocaleString() }}
                      </span>
                      <span class="text-xs text-slate-500 ml-1 font-semibold">ETB</span>
                    </div>
                  </div>

                  <!-- Rate Highlight -->
                  <div class="relative p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100/50">
                    <p class="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider mb-1">Premium Rate</p>
                    <p class="text-2xl font-bold tracking-tight text-indigo-950">
                      {{ Number(r?.rate || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 }) }}
                    </p>
                    <div class="absolute right-0 bottom-0 p-2 opacity-10">
                      <i v-html="i?.dollar || i?.coins" class="w-8 h-8"></i>
                    </div>
                  </div>

                  <p v-if="r?.description" class="mt-4 text-sm italic text-slate-500 line-clamp-2">
                    "{{ r.description }}"
                  </p>
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
                :key="r?.familyBenefitRangeUuid || `edit-${r.planType}-${r.minBalance}-${r.maxBalance}-${manageRows.indexOf(r)}`"
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
                    <!-- Readonly Plan Label -->
                    <div class="flex justify-between items-center">
                      <span class="text-xs font-bold uppercase tracking-wider text-slate-500">
                        {{ formatPlanType(r.planType) }}
                      </span>
                      <span v-if="r._isNew" class="px-2 py-0.5 text-[10px] font-bold tracking-wider text-indigo-700 bg-indigo-100 rounded uppercase">
                        New
                      </span>
                    </div>

                    <!-- Family Size (Only for Family Shared Plan) -->
                    <div v-if="r.planType === 'Family_Shared_Plan'">
                      <label class="block mb-1.5 text-xs font-semibold tracking-wider uppercase text-slate-600">Family Size</label>
                      <select
                        v-model="r.familySize"
                        class="px-1 py-2.5 w-full text-sm bg-white rounded-xl border shadow-sm transition-all duration-200 outline-none border-slate-200 text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      >
                        <option
                          v-for="opt in familySizeOptions"
                          :key="opt.value"
                          :value="Number(opt.value)"
                        >
                          {{ opt.label }}
                        </option>
                      </select>
                    </div>

                    <!-- Min & Max Balance inputs -->
                    <div class="grid grid-cols-2 gap-4">
                      <div>
                        <label class="block mb-1.5 text-xs font-semibold tracking-wider uppercase text-slate-600">
                          Min Balance (ETB)
                        </label>
                        <input
                          v-model="r.minBalance"
                          type="number"
                          min="0"
                          step="1000"
                          class="px-1 py-2.5 w-full text-sm bg-white rounded-xl border shadow-sm transition-all duration-200 outline-none border-slate-200 text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label class="block mb-1.5 text-xs font-semibold tracking-wider uppercase text-slate-600">
                          Max Balance (ETB)
                        </label>
                        <input
                          v-model="r.maxBalance"
                          type="number"
                          min="0"
                          step="1000"
                          class="px-1 py-2.5 w-full text-sm bg-white rounded-xl border shadow-sm transition-all duration-200 outline-none border-slate-200 text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <!-- Rate and Status Grid -->
                    <div class="grid grid-cols-2 gap-4">
                      <div>
                        <label class="block mb-1.5 text-xs font-semibold tracking-wider uppercase text-slate-600">
                          Rate (0-1)
                        </label>
                        <input
                          v-model="r.rate"
                          type="number"
                          min="0"
                          max="1"
                          step="0.0001"
                          class="px-1 py-2.5 w-full text-sm bg-white rounded-xl border shadow-sm transition-all duration-200 outline-none border-slate-200 text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label class="block mb-1.5 text-xs font-semibold tracking-wider uppercase text-slate-600">Status</label>
                        <select
                          v-model="r.status"
                          class="px-1 py-2.5 w-full text-sm bg-white rounded-xl border shadow-sm transition-all duration-200 outline-none border-slate-200 text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        >
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="INACTIVE">INACTIVE</option>
                        </select>
                      </div>
                    </div>

                    <!-- Description -->
                    <div>
                      <label class="block mb-1.5 text-xs font-semibold tracking-wider uppercase text-slate-600">Description</label>
                      <input
                        v-model="r.description"
                        type="text"
                        placeholder="Optional description"
                        class="px-1 py-2.5 w-full text-sm bg-white rounded-xl border shadow-sm transition-all duration-200 outline-none border-slate-200 text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </div>

                    <!-- Remove/deactivate button -->
                    <div class="flex justify-end pt-2">
                      <button
                        type="button"
                        class="text-sm font-medium text-rose-600 transition-colors hover:text-rose-700"
                        @click.prevent="removeNewManageRow(r)"
                      >
                        {{
                          r._isNew
                            ? 'Remove Card'
                            : (String(r?.status || '').toUpperCase() === 'INACTIVE'
                                ? 'Activate Card'
                                : 'Deactivate Card')
                        }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>

          <!-- Save/Cancel Buttons at the end -->
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

          <!-- Summary Dashboard Stats (only in view mode) -->
          <div v-if="!isManaging" class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <!-- Total Rates Card -->
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

            <!-- Active Rates Card -->
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

            <!-- Average Rate Card -->
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
/* Smooth row transitions */
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