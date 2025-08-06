<script setup>
import { computed, ref, watch, watchEffect } from 'vue';
import { mdiCurrencyUsd } from '@mdi/js';
import BaseButton from '@/components/base/BaseButton.vue';
import Modal from '@/components/modal.vue';
import claimDetail from '@/components/claims/claimDetail.vue';
import { onMounted } from 'vue';
import api from '@/scripts/api';
import NoData from '@/assets/img/no-data-here.png';
import loader from '@/components/loader/loader.vue';
import selectMenu from '@/components/selectMenu.vue';
import * as session from '@/scripts/session';
import invoice from '@/components/invoice.vue';
import { useRouter } from 'vue-router';
import badge from '@/components/badge/badge.vue';

const user = session.getUser();
const privileges = user?.privileges;
console.log(privileges);


const router = useRouter();
const openClaimDetailModal = ref(false);
const emit = defineEmits(['delete']);
const claims = ref([]);
const loading = ref(false);
const claim = ref({});
const claimTypes = ref('');
const roleType = ref('');
const orderBy = ref('asc');
const openInvoiceModal = ref(false);
const distinctProviders = ref([]);
const selectedClaims = ref([]);

onMounted(async () => {
  if (privileges.includes('ROLE_Read-Requested-Claims-Payer')) {
    await fetchClaims();
  }

  if (privileges.includes('ROLE_Read-Reviewed-Claims-Payer')) {
    await fetchClaimReviewed();
  }

  if (
    privileges.includes('ROLE_Read-Audited-Claims-Payer') &&
    privileges.includes('ROLE_Approver')
  ) {
    await fetchClaimAudited();
  }

  if (privileges.includes('ROLE_Finance')) {
    await fetchClaimsApproved();
  }
});

const handleModalState = (claimUuid) => {
  router.push({ name: 'claim-detail', params: { id: claimUuid } });
};

const handleInvoiceDetailModal = () => {
  fetchClaimsApproved();
  openInvoiceModal.value = !openInvoiceModal.value;
};

const fetchClaims = async () => {
  loading.value = true;
  await api.get('/claim/payment/requested/list?status=Requested&page=1&limit=25').then((data) => {
    console.log('claims are here', data);
    claims.value = data;
    claimTypes.value = 'Requested';
    roleType.value = 'Reviewer';
    loading.value = false;
  });
};

const fetchClaimReviewed = async () => {
  loading.value = true;
  await api.get(`/claim/payment/reviewed/list?page=1&limit=25`,).then((data) => {
    claims.value = data;
    claimTypes.value = 'Reviewed';
    roleType.value = 'Auditor';
    loading.value = false;
  });
};

const fetchClaimAudited = async () => {
  console.log('fetchClaimAudited');
  loading.value = true;
  await api.get(`/claim/payment/audited/list?page=1&limit=25`).then((data) => {
    claims.value = data;
    claimTypes.value = 'Audited';
    roleType.value = 'Approver';
    loading.value = false;
  });
};

const fetchClaimsApproved = async () => {
  loading.value = true;
  await api.get(`/claim/payment/approved/list?page=1&limit=25`,).then((data) => {
    claims.value = data;
    claimTypes.value = 'Approved';
    roleType.value = 'Payer';
    loading.value = false;
  });
};

const handleClaimChecked = async () => {
  if (roleType.value === 'Reviewer') {
    fetchClaims();
    handleModalState();
  } else if (roleType.value === 'Auditor') {
    fetchClaimReviewed();
    handleModalState();
  } else if (roleType.value === 'Approver') {
    fetchClaimAudited();
    handleModalState();
  }
};

const handleSort = (column) => {
  if (orderBy.value === 'asc') {
    claims.value.sort((a, b) => {
      if (a[column] && b[column]) {
        return a[column].localeCompare(b[column]);
      } else {
        return 0;
      }
    });
    orderBy.value = 'desc';
  } else {
    claims.value.sort((a, b) => {
      if (a[column] && b[column]) {
        return b[column].localeCompare(a[column]);
      } else {
        return 0;
      }
    });
    orderBy.value = 'asc';
  }
};

watch(claims, () => {
  distinctProviders.value = [
    ...new Set(claims.value.map((claim) => claim.providerName)),
  ].map((providerName, index) => {
    const providerUuid = claims.value.find(
      (claim) => claim.providerName === providerName
    ).providerUuid;
    return {
      id: index + 1,
      name: providerName,
      uuid: providerUuid,
    };
  });
});

const filteredClaims = ref(claims);

const filterByProvider = (providerUuid) => {
  if (providerUuid == 'all' || !providerUuid) {
    filteredClaims.value = claims.value;
    return;
  } else {
    filteredClaims.value = claims.value.filter((claim) => {
      return claim.providerUuid === providerUuid;
    });
  }
};

const selectAllClaims = (event) => {
  if (event.target.checked) {
    selectedClaims.value = filteredClaims.value.map((claim) => claim.claimUuid);
    console.log(selectedClaims.value);
  } else {
    selectedClaims.value = [];
    console.log(selectedClaims.value);
  }
};

const fullInfoOfSelectedClaims = computed(() => {
  return filteredClaims.value.filter((claim) =>
    selectedClaims.value.includes(claim.claimUuid)
  );
});

watchEffect(() => {
  console.log('fullInfoOfSelectedClaims', fullInfoOfSelectedClaims.value);
});

const fetchClaimLog = async (claimUuid) => {
  await api.get(`/claim/logs?claimUuid=${claimUuid}`,).then((data) => {
    console.log('log for the claim is ', data);
  });
};
</script>
<template>
  <div class="h-full">
    <Modal :open="openClaimDetailModal" @close="handleModalState" title="Claim Information">
      <claimDetail :claim="claim" @claim-checked="handleClaimChecked" :role="roleType" />
    </Modal>

    <Modal :open="openInvoiceModal" @close="handleInvoiceDetailModal" title="Payment Information"
      titleClass="border-b-2 border-gray-400 pb-2">
      <invoice :claims-to-be-payed="fullInfoOfSelectedClaims" @payment-completed="handleInvoiceDetailModal" />
    </Modal>

    <div class="py-6 px-2 rounded-t-lg flex items-center justify-between">
      <span class="text-2xl text-gray-700 font-semibold">
        {{ claimTypes }} Claims
      </span>
      <span class="mr-3 capitalize text-xs text-gray-500">
        you have {{ roleType }} role
      </span>
    </div>

    <div v-if="roleType === 'Payer'"
      class="px-4 sm:px-6 lg:px-8 bg-[#EABFFF]/10 py-4 flex items-center justify-between">
      <div class="flex items-center">
        <selectMenu :providers="distinctProviders" @providerSelected="filterByProvider" />
      </div>

      <div v-if="selectedClaims.length > 0">
        <div>
          <span class="text-xs text-primary mb-2">{{ selectedClaims.length }} claim selected</span>
        </div>
        <BaseButton icon-w="w-4" icon-h="h-4" color="success" class="bg-primary hover:bg-primary0 focus:ring-0" label="Proceed
        payment" :icon="mdiCurrencyUsd" @click="handleInvoiceDetailModal" />
      </div>
    </div>

    <div class="min-h-[70vh] flex items-center justify-center flex-col gap-5" v-if="!claims.length && !loading">
      <img :src="NoData" alt="" />
      <div class="text-sm text-primary font-semibold">
        No {{ claimTypes }} claims found
      </div>
    </div>

    <div class="min-h-[70vh] flex items-center justify-center" v-if="loading">
      <loader />
    </div>

    <div class="px-4 sm:px-6 lg:px-8" v-if="claims.length">
      <div class="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div class="inline-block min-w-full py-2 align-middle">
          <table class="min-w-full divide-y divide-gray-300">
            <thead>
              <tr>
                <th scope="col" class="px-3 py-3.5 text-left text-base font-semibold text-gray-900">
                  <input type="checkbox" @change="selectAllClaims" />
                </th>
                <th scope="col" class="px-3 py-3.5 text-left text-base font-semibold text-gray-900">
                  No.
                </th>

                <th scope="col" class="px-3 py-3.5 text-left text-base font-semibold text-gray-900">
                  Policy Holder Name
                </th>

                <th scope="col" class="px-3 py-3.5 text-left text-base font-semibold text-gray-900">
                  Provider Name
                </th>
                <th scope="col" class="px-3 py-3.5 text-left text-base font-semibold text-gray-900">
                  Provider Phone
                </th>
                <th scope="col" class="px-3 py-3.5 text-left text-base font-semibold text-gray-900">
                  Group Name
                </th>
                <th scope="col" class="px-3 py-3.5 text-left text-base font-semibold text-gray-900">
                  Total Amount
                </th>
                <th scope="col" class="px-3 py-3.5 text-left text-base font-semibold text-gray-900">
                  Status
                </th>
                <th scope="col" class="px-3 py-3.5 text-left text-base font-semibold text-gray-900 cursor-pointer"
                  @click="handleSort('claimDate')">
                  Claim Date
                  <span v-if="orderBy === 'asc'">▲</span>
                  <span v-if="orderBy === 'desc'">▼</span>
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 bg-white">
              <!-- clickable cell -->
              <tr v-for="(claim, index) in filteredClaims" :key="claim.claimUuid" :class="[
                ' cursor-pointer hover:bg-gray-100',
                selectedClaims.includes(claim.claimUuid)
                  ? ' bg-primary0 hover:bg-primary0'
                  : 'text-gray-900 ',
              ]" @click="handleModalState(claim.claimUuid, $event)">
                <td v-if="roleType === 'Payer'"
                  class="whitespace-nowrap px-3 py-2 border-b border-gray-600 text-base text-gray-500">
                  <input type="checkbox" :value="claim.claimUuid" v-model="selectedClaims" @click.stop />
                </td>
                <td class="whitespace-nowrap px-3 py-2 border-b border-gray-600 text-base text-gray-500">
                  {{ index + 1 }}
                </td>
                <td class="whitespace-nowrap px-3 py-2 border-b border-gray-600 text-base text-gray-500"
                  v-if="claim.dependantUuid == null">
                  {{ claim?.title }}
                  {{
                    claim.firstName +
                    ' ' +
                    claim.fatherName +
                    ' ' +
                    claim.grandFatherName
                  }}
                </td>
                <td class="whitespace-nowrap px-3 py-2 border-b border-gray-600 text-base text-gray-500" v-else>
                  {{
                    claim.dependantFirstName +
                    ' ' +
                    claim.dependantFatherName +
                    ' ' +
                    claim.dependantGrandFatherName
                  }}
                </td>

                <td class="whitespace-nowrap px-3 py-2 border-b border-gray-600 text-base text-gray-500">
                  {{ claim.providerName }}
                </td>
                <td class="whitespace-nowrap px-3 py-2 border-b border-gray-600 text-base text-gray-500">
                  {{ claim.providerPhone }}
                </td>

                <td class="whitespace-nowrap px-3 py-2 border-b border-gray-600 text-base text-gray-500">
                  {{ claim.institutionName }}
                </td>
                <td class="whitespace-nowrap px-3 py-2 border-b border-gray-600 text-base text-gray-500">
                  {{ claim.totalAmount }}
                </td>
                <td class="whitespace-nowrap px-3 py-2 border-b border-gray-600 text-base text-gray-500">
                  <badge :status="claimTypes" />
                </td>
                <td class="whitespace-nowrap px-3 py-2 border-b border-gray-600 text-base text-gray-500">
                  {{ claim.claimDate }}
                </td>
                <td class="whitespace-nowrap px-3 py-2 border-b border-gray-600 text-base text-gray-500">
                  <div class="bg-primary px-2 py-1  text-white text-center cursor-pointer rounded-md">
                    <div class="text-base capitalize">view</div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>