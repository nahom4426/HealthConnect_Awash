<script setup>
import DefaultPage from "@/components/DefaultPage.vue";
import ClaimByBatchDataProvider from "../../components/ClaimByBatchDataProvider.vue";
import Table from "@/components/Table.vue";
import { formatCurrency } from "@/utils/utils";
import Button from "@/components/Button.vue";
import FilterOnDetector from "@/components/FilterOnDetector.vue";
import SearchSelect from "@/components/SearchSelect.vue";
import { getProviders } from "@/features/providers/api/providerApi";
import { getInstitutionsPolicyByStatus } from "@/features/institutions/api/institutionApi";
import { ref, computed, watch } from "vue";
import { ServiceTypes, Status, PaymentStatus } from "@/types/interface";
import Toogle from "@/components/Toogle.vue";
import { useProcessClaimByInstitutionBatch } from "../../store/processClaimByInstitutionBatchStore";
import VerifyClaimStatusRow from "../../components/VerifyClaimStatusRow.vue";
import { useRouter } from "vue-router";

const serviceType = ref("CREDIT");
const institutionUuid = ref(null);
const contractUuid = ref(null);
const active = ref(ServiceTypes.creditService);
const search = ref("");
const store = useProcessClaimByInstitutionBatch();
const router = useRouter();

const tableRowKeys = computed(() => {
  if (active.value === ServiceTypes.cashService) {
    // For Cash service: only show provider name, no institution
    return ["institutionName","providerName", "totalAmount", "period", "claimStatus"];
  } else {
    // For Credit service: show both institution and provider
    return ["institutionName", "providerName", "totalAmount", "period", "claimStatus"];
  }
});

const tableHeaders = computed(() => {
  if (active.value === ServiceTypes.cashService) {
    return {
      head: [ "Institution", "Provider Name", "Total Amount", "Contract Period", "Status", "Actions"],
      row: ["institutionName","providerName", "totalAmount", "period", "claimStatus"],
    };
  } else {
    return {
      head: [ "Institution", "Provider Name", "Total Amount", "Contract Period", "Status", "Actions"],
      row: ["institutionName", "providerName", "totalAmount", "period", "claimStatus"],
    };
  }
});

// Update serviceType based on active toggle
watch(active, (newActive) => {
  if (newActive === ServiceTypes.creditService) {
    serviceType.value = "CREDIT";
    console.log('🔄 Switched to CREDIT service');
  } else if (newActive === ServiceTypes.cashService) {
    serviceType.value = "CASH";
    console.log('🔄 Switched to CASH service');
  }
});

function formatDate(date) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function navigateToCreateCashClaims() {
  router.push('/create_cash_claims');
}

function formatContractPeriod(row) {
  return row.beginDate || row.endDate
    ? `${formatDate(row.beginDate)} - ${formatDate(row.endDate)}`
    : "-";
}

function handleInstitutionSelect(result) {
  if (result) {
    institutionUuid.value = result.institutionUuid;
  } else {
    institutionUuid.value = null;
  }
}

function handleContractSelect(result) {
  if (result) {
    contractUuid.value = result.contractUuid || result.providerUuid;
  } else {
    contractUuid.value = null;
  }
}
function navigateToServicesPage(row) {
  if (row && row.claimUuid) {
    const institutionName = row.institutionName || row.payerInstitutionName || 'N/A';
    router.push({
      path: `/verify_claims/detail/${row.claimUuid}`,
      state: { institutionName },
      query: { institutionName } // Also pass as query param for fallback
    });
  }
}
</script>

<template>
  <ClaimByBatchDataProvider
    :store="store"
    :creditService="active == ServiceTypes.creditService"
    :status="PaymentStatus.PROCESSED"
    :params="{
      providerUuid: contractUuid,
      institutionUuid: institutionUuid,
      serviceType
    }"
    :search="search"
    v-slot="{ claims, pending: dataPending, search: paginationSearch }"
  >
    <DefaultPage v-model="search">
      <template #header>
        <Toogle
          v-model="active"
          :items="[
            { name: ServiceTypes.creditService },
            { name: ServiceTypes.cashService }
          ]"
        />
        <FilterOnDetector :watch="[institutionUuid, contractUuid]">
          <SearchSelect
            placeholder="Filter by Institution"
            :searchCb="(data) => getInstitutionsPolicyByStatus({ ...data, status: Status.ACTIVE })"
            :selectCb="handleInstitutionSelect"
            :option="{ label: 'institutionName', value: 'institutionUuid' }"
          />
          <SearchSelect
            v-if="ServiceTypes.creditService == active"
            placeholder="Filter by a Provider / Contract"
            :searchCb="(data) => getProviders({ ...data, status: Status.ACTIVE })"
            :selectCb="handleContractSelect"
            :option="{ label: 'providerName', value: 'providerUuid' }"
          />
          <Button v-if="ServiceTypes.cashService == active" type="primary" @click="navigateToCreateCashClaims">
            <i icon="plus"></i>
            Create Cash Claims
          </Button>
        </FilterOnDetector>
      </template>

      <Table
        :pending="dataPending"
        :virtual="true"
        :itemKey="'claimUuid'"
        :virtualHeight="600"
        :virtualItemSize="64"
        :headers="tableHeaders"
        :rows="claims"
        :rowCom="VerifyClaimStatusRow"
        @row-click="navigateToServicesPage"
      >
        <template #row>
          <VerifyClaimStatusRow
            :rowData="claims"
            :rowKeys="tableRowKeys"
            :serviceType="active"
            :onView="navigateToServicesPage"
            :onRowClick="navigateToServicesPage"
            :currentPage="1"
            :perPage="25"
          />
        </template>
      </Table>
    </DefaultPage>
  </ClaimByBatchDataProvider>
</template>