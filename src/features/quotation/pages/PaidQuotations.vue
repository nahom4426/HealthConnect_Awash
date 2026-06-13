<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import DefaultPage from "@/components/DefaultPage.vue";
import Table from "@/components/Table.vue";
import QuotationDataProviderByStatus from "@/features/quotation/components/quotationDataProviderByStatus.vue";
import PaidQuotationRowCom from "@/features/quotation/components/PaidQuotationRow.vue";

const router = useRouter()
const search = ref("")
const selectedType = ref("")
const selectedStatus = ref("PAID")

function goToStageExclusion() {
  router.push('/stage_exclusion')
}
</script>

<template>
  <DefaultPage v-model="search" placeholder="Search by institution...">
    <template #filter>
      <div class="flex gap-2 items-center">
        <!-- Status Filter Select -->
        <select
          v-model="selectedStatus"
          class="px-3 py-2 text-sm bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-gray-700 outline-none min-w-[120px] h-10 sm:h-12"
        >
          <option value="PAID">Paid</option>
          <option value="UNPAID">Unpaid</option>
        </select>

        <!-- Type Filter Select at last end top -->
        <select
          v-model="selectedType"
          class="px-3 py-2 text-sm bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-gray-700 outline-none min-w-[150px] h-10 sm:h-12"
        >
          <option value="">All Types</option>
          <option value="QUOTATION">Quotation</option>
          <option value="INCLUSION">Inclusion</option>
          <option value="EXCLUSION">Exclusion</option>
        </select>
      </div>
    </template>

    <template #add-action>
      <!-- Action Button if INCLUSION or EXCLUSION is chosen -->
      <button
        v-if="selectedType === 'INCLUSION' || selectedType === 'EXCLUSION'"
        @click="goToStageExclusion"
        class="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary/90 rounded-lg shadow-sm transition-colors h-10 sm:h-12"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        <span>New</span>
      </button>
    </template>

    <div class="flex flex-col gap-4">
      <!-- Table Component inside Data Provider -->
      <QuotationDataProviderByStatus
        ref="provider"
        :status="selectedStatus"
        :search="search"
        :type="selectedType"
        v-slot="{ quotations, pending, currentPage, itemsPerPage, totalPages, setPage, setLimit }"
      >
        <Table
          :pending="pending"
          :rowCom="PaidQuotationRowCom"
          :headers="{
            head: [
              'Quotation Code',
              'Institution',
              'Phone',
              'Total Premium',
              'Total Sum Insured',
              'Created Date',
              'Type',
              'Status',
              'actions',
            ],
            row: [
              'quotationCode',
              'institutionName',
              'institutionPhone',
              'totalPremium',
              'totalSumInsured',
              'createdDate',
              'type',
              'status',
            ],
          }"
          :cells="{
            totalPremium: (_: any, r: any) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'ETB' }).format(r.totalPremium || 0),
            totalSumInsured: (_: any, r: any) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'ETB' }).format(r.totalSumInsured || 0),
            createdDate: (_: any, r: any) => r.createdDate ? new Date(r.createdDate).toLocaleDateString() : '—',
            type: (_: any, r: any) => r.type || 'QUOTATION',
          }"
          :rows="quotations"
          :pagination="{
            currentPage: currentPage?.value || 1,
            itemsPerPage: itemsPerPage?.value || 25,
            totalPages: totalPages?.value || 1,
            onPageChange: (p: number) => setPage(p),
            onLimitChange: (l: number) => setLimit(l),
          }"
        >
        </Table>
      </QuotationDataProviderByStatus>
    </div>
  </DefaultPage>
</template>
