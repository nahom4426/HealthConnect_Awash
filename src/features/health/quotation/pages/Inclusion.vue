<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import DefaultPage from "@/components/DefaultPage.vue";
import Table from "@/components/Table.vue";
import QuotationDataProviderByStatus from "@/features/quotation/components/quotationDataProviderByStatus.vue";
import InclusionRowCom from "@/features/quotation/components/InclusionRow.vue";

const router = useRouter()
const search = ref("")
</script>

<template>
  <DefaultPage v-model="search" placeholder="Search by institution...">
    <div class="flex flex-col gap-4">
      <QuotationDataProviderByStatus
        ref="provider"
        :status="'PAID'"
        :search="search"
        :type="'QUOTATION'"
        v-slot="{ quotations, pending, currentPage, itemsPerPage, totalPages, setPage, setLimit }"
      >
        <Table
          :pending="pending"
          :rowCom="InclusionRowCom"
          :headers="{
            head: [
              'Quotation Code',
              'Institution',
              'Phone',
              'Total Premium',
              'Total Sum Insured',
              'Created Date',
              'Status',
              'Contract UUID',    // ADD THIS to match row
              'actions',
            ],
            row: [
              'quotationCode',
              'institutionName',
              'institutionPhone',
              'totalPremium',
              'totalSumInsured',
              'createdDate',
              'status',
              'payerInstitutionContractUuid',  // ADD THIS
              'quotationUuid',                 // ADD THIS for navigation
            ],
          }"
          :cells="{
            totalPremium: (_: any, r: any) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'ETB' }).format(r.totalPremium || 0),
            totalSumInsured: (_: any, r: any) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'ETB' }).format(r.totalSumInsured || 0),
            createdDate: (_: any, r: any) => r.createdDate ? new Date(r.createdDate).toLocaleDateString() : '—',
            // Hide the contract UUID column but keep it for data passing
            payerInstitutionContractUuid: (_: any, r: any) => r.payerInstitutionContractUuid?.slice(0, 8) + '...' || '—',
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