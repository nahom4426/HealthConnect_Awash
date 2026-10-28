<script setup>
import DefaultPage from "@/components/DefaultPage.vue";
import Table from "@/components/Table.vue";
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import IssuedPolicyQuotationDataProvider from "@/features/quotation/components/IssuedPolicyQuotationDataProvider.vue";
import IssuedPolicyQuotationRow from "@/features/quotation/components/IssuedPolicyQuotationRow.vue";

const route = useRoute();
const router = useRouter();
const search = ref("");

const policyUuid = computed(() => route.params.payerInstitutionContractUuid);

function goToInsured(row) {
  const payerInstitutionContractUuid = route.params.payerInstitutionContractUuid;
  const institutionUuid = row?.institutionUuid || route.params?.institutionUuid;
  if (institutionUuid && payerInstitutionContractUuid) {
    router.push(
      `/insured_persons/${payerInstitutionContractUuid}/${institutionUuid}/${payerInstitutionContractUuid}/${row?.institutionName}`
    );
  }
}

function goToDetails(row) {
  const quotationUuid = row?.quotationUuid;
  if (!quotationUuid) return;
  router.push({ name: 'ViewIssuedQuotation', params: { quotationUuid }, query: { viewOnly: '1' } });
}

function mapRows(listRaw) {
  return (Array.isArray(listRaw) ? listRaw : []).map((r) => {
    const totalPremium = Array.isArray(r?.quoatedServices)
      ? r.quoatedServices.reduce(
          (sum, s) => sum + (Number(s?.premium) || 0),
          0
        )
      : 0;

    const totalCoverage = Array.isArray(r?.quoatedServices)
      ? r.quoatedServices.reduce(
          (sum, s) => sum + (Number(s?.coverage) || 0),
          0
        )
      : 0;

    return {
      quotationUuid: r?.quotationUuid,
      institutionUuid: r?.institutionUuid,
      quotationCode: r?.quotationCode,
      policyDebitNumber: r?.policyDebitNumber,
      issuedDate: r?.issuedDate,
      acceptedDate: r?.acceptedDate,
      poDate: r?.poDate,
      dates: {
        issuedDate: r?.issuedDate,
        acceptedDate: r?.acceptedDate,
        poDate: r?.poDate,
      },
      description: r?.description,
      status: r?.status,
      quoatedServices: Array.isArray(r?.quoatedServices) ? r.quoatedServices : [],
      totalPremium,
      totalCoverage,
      id: r?.quotationUuid || r?.id,
    };
  });
}
</script>

<template>
  <DefaultPage>
    <template #header>
      <h1>Policy Quotations</h1>
    </template>

  

    <IssuedPolicyQuotationDataProvider
      v-slot="{ quotations, pending, error }"
      :policyUuid="policyUuid"
      :search="search"
      :auto="true"
    >
      <div v-if="error" class="p-3 text-red-600">{{ error }}</div>

      <Table
        :pending="pending"
        :rowCom="IssuedPolicyQuotationRow"
        :rowComProps="{ onInsured: goToInsured, onDetails: goToDetails }"
        :headers="{
          head: [
            'Quotation Code',
            'Debit Number',
            'Services',
            'Dates',
            'Total Premium',
            'Total Coverage',
            'Status',
            'actions',
          ],
          row: [
            'quotationCode',
            'policyDebitNumber',
            'quoatedServices',
            'dates',
            'totalPremium',
            'totalCoverage',
            'status',
          ],
        }"
        :cells="{
          quoatedServices: (_v, r) => {
            const list = Array.isArray(r?.quoatedServices) ? r.quoatedServices : [];
            if (!list.length) return '';
            return list
              .map((s, i) => {
                const planType = s?.planType || '';
                const premium = Number(s?.premium) || 0;
                const coverage = Number(s?.coverage) || 0;
                return `${i + 1}. ${planType} | Premium: ${premium} | Coverage: ${coverage}`;
              })
              .join('\n');
          },
          totalPremium: (_v, r) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'ETB' }).format(Number(r?.totalPremium) || 0),
          totalCoverage: (_v, r) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'ETB' }).format(Number(r?.totalCoverage) || 0),
        }"
        :rows="mapRows(quotations)"
      />
    </IssuedPolicyQuotationDataProvider>
  </DefaultPage>
</template>
