<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import DefaultPage from "@/components/DefaultPage.vue";
import Table from "@/components/Table.vue";
import QuotationDataProviderByStatus from "@/features/quotation/components/quotationDataProviderByStatus.vue";
import SavedQuotationStatusRow from "@/features/quotation/components/SavedQuotationStatusRow.vue";

const router = useRouter()
const search = ref("")
const selectedType = ref("")

function goToStageExclusion() {
  router.push('/stage_exclusion')
}
</script>

<template>
  <DefaultPage v-model="search" placeholder="Search by institution or insured name...">
    <template #filter>
      <select
        v-model="selectedType"
        class="px-4 py-2.5 text-sm bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-700 min-w-[160px] h-11 transition-all duration-200 hover:border-gray-300"
      >
        <option value="">📋 All Types</option>
        <option value="QUOTATION">📄 Quotation</option>
        <option value="INCLUSION">➕ Inclusion</option>
        <option value="EXCLUSION">➖ Exclusion</option>
      </select>
    </template>

    <template #add-action>
      <button
        v-if="selectedType === 'INCLUSION' || selectedType === 'EXCLUSION'"
        @click="goToStageExclusion"
        class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 h-11"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        <span>Create New</span>
      </button>
    </template>

    <div class="flex flex-col gap-4">
      <QuotationDataProviderByStatus
        ref="provider"
        :status="'PENDING'"
        :search="search"
        :type="selectedType"
        v-slot="{ quotations, pending, currentPage, itemsPerPage, totalPages, setPage, setLimit }"
      >
        <Table
          :pending="pending"
          :rowCom="SavedQuotationStatusRow"
          :headers="{
            head: [
   
              'Quotation Code',
              'Policy Holder',
              'Premium / Sum Insured',
              'Created Date / Type',
              'Status',
              'Actions',
            ],
            row: [
         
              'quotationCode',
              'policyHolderInfo',
              'premiumInfo',
              'dateTypeInfo',
              'status',
              'actions',
            ],
          }"
          :cells="{
            policyHolderInfo: (_: any, r: any) => ({
              name: r.institutionName || r.insuredName || '—',
              policyType: r.policyType || 'N/A'
            }),
            premiumInfo: (_: any, r: any) => ({
              totalPremium: new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', minimumFractionDigits: 2 }).format(r.totalPremium || 0),
              totalSumInsured: new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', minimumFractionDigits: 2 }).format(r.totalSumInsured || 0)
            }),
            dateTypeInfo: (_: any, r: any) => ({
              createdDate: r.createdDate ? new Date(r.createdDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—',
              type: r.type || 'QUOTATION'
            }),
          }"
          :rows="quotations"
          :pagination="{
            currentPage: currentPage?.value || 1,
            itemsPerPage: itemsPerPage?.value || 25,
            totalPages: totalPages?.value || 1,
            onPageChange: (p) => setPage(p),
            onLimitChange: (l) => setLimit(l),
          }"
        />
      </QuotationDataProviderByStatus>
    </div>
  </DefaultPage>
</template>