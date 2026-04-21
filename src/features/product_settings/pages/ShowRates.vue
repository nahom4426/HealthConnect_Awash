<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPackageRates } from '../api/benefitRangeApi'
import { useApiRequest } from '@/composables/useApiRequest'
import { useToast } from '@/toast/store/toast'
import { Plan, type BenefitRanges, type Status } from '@/types/interface'
import Table from '@/components/Table.vue'
import DefaultPage from '@/components/DefaultPage.vue'
import icons from '@/utils/icons'

interface ExtendedBenefitRanges extends BenefitRanges {
  planType: string
  description?: string
  packageName?: string
}

const route = useRoute()
const router = useRouter()
const { addToast } = useToast()
const api = useApiRequest()

const packageUuid = route.params.packageUuid as string
const rates = ref<ExtendedBenefitRanges[]>([])
const loading = ref(true)
const packageName = ref('')

onMounted(async () => {
  await fetchRates()
})

async function fetchRates() {
  loading.value = true

  api.send(() => getPackageRates(packageUuid), (res: any) => {
    rates.value = (res?.data as ExtendedBenefitRanges[]) || []

    if (!res?.success) {
      addToast({
        type: 'error',
        title: 'Failed to fetch rates',
        message: res?.error || 'Unable to load package rates'
      })
    }

    // Extract package name from first rate if available
    if (rates.value.length > 0 && (rates.value[0] as any).packageName) {
      packageName.value = (rates.value[0] as any).packageName
    }

    loading.value = false
  })
}

function goBack() {
  router.go(-1)
}

function formatPlanType(planType: string) {
  switch (planType) {
    case Plan['Individual Plan']:
      return 'Individual Plan'
    case Plan['Family Plan']:
      return 'Family Plan'
    case Plan['Family Shared Plan']:
      return 'Family Shared Plan'
    default:
      return planType
  }
}

function formatFamilySize(familySize: number, planType: string) {
  if (planType === Plan['Individual Plan']) {
    return familySize // For individual plans, this might be a string like 'Member', 'Spouse', etc.
  }
  return familySize // For family plans, this is numeric
}
</script>

<template>
  <DefaultPage :placeholder="'Search rates...'"><!-- title attribute is ignored by DefaultPage but harmless -->
    <template #add-action>
      <button
        @click.prevent="goBack"
        class="flex justify-center items-center gap-2 rounded-md px-6 py-4 text-primary bg-gray-100 hover:bg-gray-200 transition-colors"
      >
        <i v-html="icons.back"></i>
        <p class="text-base">Back</p>
      </button>
    </template>

    <template #default>
      <Table
        :pending="loading"
        :headers="{
          head: [
            'Plan Type',
            'Family Size',
            'Min Limit',
            'Max Limit',
            'Rate',
            'Description',
            'Status',
          ],
          row: [
            'planType',
            'familySize',
            'minLimit',
            'maxLimit',
            'rate',
            'description',
            'status',
          ],
        }"
        :rows="rates"
        :show-pagination="false"
        placeholder="No rates found for this package"
      >
        <template #row="{ row }">
          <tr class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              {{ formatPlanType(row.planType) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ formatFamilySize(row.familySize, row.planType) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ row.minLimit?.toLocaleString() || 'N/A' }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ row.maxLimit?.toLocaleString() || 'N/A' }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              {{ row.rate?.toLocaleString() || 'N/A' }}
            </td>
            <td class="px-6 py-4 text-sm text-gray-900">
              <div class="max-w-xs truncate" :title="row.description">
                {{ row.description || 'N/A' }}
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span 
                :class="[
                  'px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full',
                  row.status === 'ACTIVE' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                ]"
              >
                {{ row.status || 'UNKNOWN' }}
              </span>
            </td>
          </tr>
        </template>
      </Table>

      <!-- Summary Stats -->
      <div v-if="rates.length > 0" class="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div class="flex items-center">
            <div class="flex-shrink-0 bg-blue-100 rounded-lg p-3">
              <i v-html="icons.coverage" class="w-6 h-6 text-blue-600"></i>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Total Rates</p>
              <p class="text-2xl font-bold text-gray-900">{{ rates.length }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div class="flex items-center">
            <div class="flex-shrink-0 bg-green-100 rounded-lg p-3">
              <i v-html="icons.eye" class="w-6 h-6 text-green-600"></i>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Active Rates</p>
              <p class="text-2xl font-bold text-gray-900">
                {{ rates.filter(r => r.status === 'ACTIVE').length }}
              </p>
            </div>
          </div>
        </div>

        <div class="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div class="flex items-center">
            <div class="flex-shrink-0 bg-yellow-100 rounded-lg p-3">
              <i v-html="icons.sales" class="w-6 h-6 text-yellow-600"></i>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Avg Rate</p>
              <p class="text-2xl font-bold text-gray-900">
                {{ Math.round(rates.reduce((sum, r) => sum + (r.rate || 0), 0) / rates.length).toLocaleString() }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </template>
  </DefaultPage>
</template>
