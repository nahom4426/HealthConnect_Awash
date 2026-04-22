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
      `/insured_persons/${payerInstitutionContractUuid}/${institutionUuid}/${row.quotationUuid}`
    );
  }
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
      description: r?.description,
      status: r?.status,
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

    <div class="p-3">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="w-full sm:max-w-md">
          <input
            v-model="search"
            class="px-3 py-2 w-full bg-white rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search by quotation code or debit number"
            type="text"
          />
        </div>
      </div>
    </div>

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
        :rowComProps="{ onInsured: goToInsured }"
        :headers="{
          head: [
            'Quotation Code',
            'Debit Number',
            'Issued Date',
            'Accepted Date',
            'PO Date',
            'Total Premium',
            'Total Coverage',
            'Status',
            'actions',
          ],
          row: [
            'quotationCode',
            'policyDebitNumber',
            'issuedDate',
            'acceptedDate',
            'poDate',
            'totalPremium',
            'totalCoverage',
            'status',
          ],
        }"
        :cells="{
          issuedDate: (_v, r) => (r?.issuedDate ? new Date(r.issuedDate).toLocaleString() : ''),
          acceptedDate: (_v, r) => (r?.acceptedDate ? new Date(r.acceptedDate).toLocaleString() : ''),
          poDate: (_v, r) => (r?.poDate ? new Date(r.poDate).toLocaleString() : ''),
          totalPremium: (_v, r) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'ETB' }).format(Number(r?.totalPremium) || 0),
          totalCoverage: (_v, r) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'ETB' }).format(Number(r?.totalCoverage) || 0),
        }"
        :rows="mapRows(quotations)"
      />
    </IssuedPolicyQuotationDataProvider>
  </DefaultPage>
</template>
