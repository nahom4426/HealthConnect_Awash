<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import DefaultPage from "@/components/DefaultPage.vue";
import Table from "@/components/Table.vue";
import QuotationDataProviderByStatus from "@/features/quotation/components/quotationDataProviderByStatus.vue";
import IssuedQuotationRow from "@/features/quotation/components/IssuedQuotationRow.vue";
import { savedIssueQuotation } from '../api/quotationApi';
import { toasted } from "@/utils/utils";

type IssuedQuotationRow = {
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

const rows = ref<IssuedQuotationRow[]>([])
const router = useRouter()
const isAmending = ref(false)

async function handleAmend(quotationUuid: string) {
  if (!quotationUuid) return;
  
  isAmending.value = true;
  try {
    await savedIssueQuotation(quotationUuid, { quotationUuid });
    toasted(true, 'Quotation amended successfully');
    router.push({ 
      name: 'GenerateQuotation',
      query: { quotationUuid }
    });
  } catch (error: any) {
    const errorMessage = error?.response?.data?.message || 'Failed to amend quotation';
    toasted(false, errorMessage);
  } finally {
    isAmending.value = false;
  }
}
</script>
<template>
  <DefaultPage>
    <QuotationDataProviderByStatus v-slot="{ quotations, pending }" :status="'ISSUED'">
      <Table
        :pending="pending"
        :rowCom="IssuedQuotationRow"
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

