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
import ClaimStatusRow from "../../components/ClaimStatusRow.vue";
import { useRouter } from "vue-router";

const serviceType = ref("CREDIT");
const institutionUuid = ref(null);
const contractUuid = ref(null);
const active = ref(ServiceTypes.creditService);
const search = ref("");
const store = useProcessClaimByInstitutionBatch();
const router = useRouter();

const tableRowKeys = computed(() => {
  const nameKey = active.value === ServiceTypes.cashService ? "institutionName" : "providerName";
  return [nameKey, "totalAmount", "period", "claimStatus"];
});

const tableHeaders = computed(() => {
  const nameHeader = active.value === ServiceTypes.cashService ? "Institution / Policyholder" : "Healthcare Provider / Facility";
  return {
    head: [nameHeader, "Total Claim Value", "Contract Period", "Adjudication Status", "Actions"],
    row: tableRowKeys.value,
  };
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

function navigateToDetail(row) {
  const targetId = row.claimUuid || row.batchCode || '';
  if (active.value === ServiceTypes.cashService) {
    router.push(`/process_claims/cash_detail/${targetId}`);
  } else {
    router.push(`/process_claims/detail/${targetId}`);
  }
}

// Calculate summary metrics for backoffice stats
const activeClaimsList = computed(() => store.claims || []);
const totalValue = computed(() => {
  return activeClaimsList.value.reduce((acc, c) => acc + (Number(c.totalAmount) || 0), 0);
});
const pendingCount = computed(() => activeClaimsList.value.length);
</script>

<template>
  <ClaimByBatchDataProvider
    :store="store"
    :creditService="active == ServiceTypes.creditService"
    :status="PaymentStatus.PENDING"
    :params="{
      providerUuid: contractUuid,
      institutionUuid: institutionUuid,
      serviceType
    }"
    :search="search"
    v-slot="{ claims, pending: dataPending, search: paginationSearch, send: refreshData }"
  >
    <div class="space-y-6 p-4 md:p-6 bg-slate-50/50 min-h-screen">
      <!-- Standard Backoffice Header Banner -->
      <div class="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#5a0016] via-[#03396C] to-[#3a000e] text-white shadow-xl p-6 md:p-8">
        <!-- Decorative Background Accents -->
        <div class="absolute -right-10 -bottom-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute right-40 -top-10 w-48 h-48 bg-rose-400/10 rounded-full blur-2xl pointer-events-none"></div>

        <div class="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div class="space-y-2">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/30 text-amber-200 text-xs font-semibold tracking-wide uppercase">
              <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              Standard Insurance S.C. Backoffice Operations
            </div>
            <h1 class="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              Claims Adjudication Hub
            </h1>
            <p class="text-sm md:text-base text-rose-100/80 max-w-2xl">
              Review, verify, and process incoming credit provider batches & reimbursable cash claims for Standard Insurance policyholders.
            </p>
          </div>

          <!-- Quick Action / Status Badge -->
          <div class="flex items-center gap-3">
            <button
              @click="refreshData"
              class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md transition-all border border-white/15 shadow-sm active:scale-95"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Batches
            </button>
          </div>
        </div>

        <!-- Backoffice KPI Summary Cards -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/15">
          <div class="bg-white/10 backdrop-blur-sm rounded-xl p-3.5 border border-white/10">
            <span class="text-xs text-rose-200/80 uppercase font-medium">Pending Batches</span>
            <div class="text-xl md:text-2xl font-black text-white mt-1">{{ pendingCount }}</div>
            <span class="text-[11px] text-amber-300 flex items-center gap-1 mt-0.5">
              <span>●</span> Awaiting Adjudication
            </span>
          </div>

          <div class="bg-white/10 backdrop-blur-sm rounded-xl p-3.5 border border-white/10">
            <span class="text-xs text-rose-200/80 uppercase font-medium">Total Batch Portfolio</span>
            <div class="text-xl md:text-2xl font-black text-amber-300 mt-1">
              ETB {{ totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
            </div>
            <span class="text-[11px] text-rose-200/90 mt-0.5 block">Active Page Total</span>
          </div>

          <div class="bg-white/10 backdrop-blur-sm rounded-xl p-3.5 border border-white/10">
            <span class="text-xs text-rose-200/80 uppercase font-medium">Selected Channel</span>
            <div class="text-base md:text-lg font-bold text-white mt-1 flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              {{ active === ServiceTypes.creditService ? 'Credit Service' : 'Cash Service' }}
            </div>
            <span class="text-[11px] text-rose-200/80 mt-0.5 block">
              {{ active === ServiceTypes.creditService ? 'Provider Network' : 'Direct Reimbursement' }}
            </span>
          </div>

          <div class="bg-white/10 backdrop-blur-sm rounded-xl p-3.5 border border-white/10">
            <span class="text-xs text-rose-200/80 uppercase font-medium">SLA Target</span>
            <div class="text-base md:text-lg font-bold text-emerald-300 mt-1 flex items-center gap-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              &lt; 48 Hours
            </div>
            <span class="text-[11px] text-emerald-200/80 mt-0.5 block">Standard Review Window</span>
          </div>
        </div>
      </div>

      <!-- Controls & Table Area -->
      <DefaultPage v-model="search">
        <template #header>
          <div class="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <!-- Modern Channel Segmented Toggle -->
            <div class="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 shadow-inner">
              <button
                type="button"
                @click="active = ServiceTypes.creditService"
                :class="[
                  'flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200',
                  active === ServiceTypes.creditService
                    ? 'bg-[#03396C] text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                ]"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                Credit Service (Providers)
              </button>

              <button
                type="button"
                @click="active = ServiceTypes.cashService"
                :class="[
                  'flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200',
                  active === ServiceTypes.cashService
                    ? 'bg-[#03396C] text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                ]"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                Cash Service (Direct)
              </button>
            </div>

            <!-- Filters -->
            <FilterOnDetector :watch="[institutionUuid, contractUuid]" class="flex flex-wrap items-center gap-2">
              <SearchSelect
                placeholder="Filter by Institution"
                :searchCb="(data) => getInstitutionsPolicyByStatus({ ...data, status: Status.ACTIVE })"
                :selectCb="handleInstitutionSelect"
                :option="{ label: 'institutionName', value: 'institutionUuid' }"
                class="min-w-[200px]"
              />
              <SearchSelect
                v-if="ServiceTypes.creditService == active"
                placeholder="Filter by Provider / Facility"
                :searchCb="(data) => getProviders({ ...data, status: Status.ACTIVE })"
                :selectCb="handleContractSelect"
                :option="{ label: 'providerName', value: 'providerUuid' }"
                class="min-w-[200px]"
              />
              <Button 
                v-if="ServiceTypes.cashService == active" 
                type="primary" 
                @click="navigateToCreateCashClaims"
                class="bg-[#03396C] hover:bg-[#600018] text-white shadow-md text-xs font-bold rounded-lg py-2.5 px-4"
              >
                <i class="mr-1.5">+</i>
                Create Cash Claim
              </Button>
            </FilterOnDetector>
          </div>
        </template>

        <!-- Main Data Table Container -->
        <div class="mt-2 rounded-xl border border-slate-200/80 shadow-sm bg-white overflow-hidden">
          <Table
            :pending="dataPending"
            :virtual="true"
            :itemKey="'claimUuid'"
            :virtualHeight="600"
            :virtualItemSize="64"
            :headers="tableHeaders"
            :rows="claims"
            :rowCom="ClaimStatusRow"
            @row="navigateToDetail"
          >
            <template #row>
              <ClaimStatusRow
                :rowData="claims"
                :rowKeys="tableRowKeys"
                :onView="navigateToDetail"
                :onRowClick="navigateToDetail"
              />
            </template>
          </Table>
        </div>
      </DefaultPage>
    </div>
  </ClaimByBatchDataProvider>
</template>

