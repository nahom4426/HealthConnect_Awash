<script setup lang="ts">
import { ref } from 'vue'
import DefaultPage from "@/components/DefaultPage.vue";
import Table from "@/components/Table.vue";
import QuotationDataProviderByStatus from "@/features/quotation/components/quotationDataProviderByStatus.vue";
import AcceptedQuotationRow from "@/features/quotation/components/AcceptedQuotationRow.vue";
import { useRouter } from 'vue-router'

type AcceptedQuotationRow = {
  quotationUuid: string
  institutionUuid: string
  institutionName: string
  institutionPhone: string
  description: string
  quotationCode: string
  policyDebitNumber: string
  totalPremium: number
  totalSumInsured: number
  createdDate: string
  status: string
}

const rows = ref<AcceptedQuotationRow[]>([])
const router = useRouter()
</script>
<template>
  <DefaultPage>
    <QuotationDataProviderByStatus v-slot="{ quotations, pending }" :status="'ACCEPTED'">
      <Table
        :pending="pending"
        :rowCom="AcceptedQuotationRow"
        :headers="{
          head: [
            'Quotation Code',
            'Institution',
            'Phone',
            'Total Premium',
            'Total Sum Insured',
            'Created Date',
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
            'status',
          ],
        }"
        :cells="{
          totalPremium: (_: any, r: any) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'ETB' }).format(r.totalPremium || 0),
          totalSumInsured: (_: any, r: any) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'ETB' }).format(r.totalSumInsured || 0),
          createdDate: (_: any, r: any) => new Date(r.createdDate).toLocaleDateString(),
        }"
        :rows="quotations"
      >
      </Table>
    </QuotationDataProviderByStatus>
  </DefaultPage>
</template>

