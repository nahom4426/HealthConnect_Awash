<script setup>
import { onMounted, ref } from 'vue';
import serviceList from './serviceList.vue';
import api from '@/scripts/api';
import loader from '../loader/loader.vue';
import NoData from '@/assets/img/no-data-here.png';
import BaseButton from '../base/BaseButton.vue';
import { mdiCheckAll } from '@mdi/js';
import { useToast } from 'vue-toastification';
import router from '@/routes/router';

const props = defineProps({
  claim: {
    type: Object,
    default: {},
  },
  role: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['claim-checked']);
const toast = useToast();

const loading = ref(false);
const claimCheckLoading = ref(false);
const services = ref([]);
const CheckSubmitLabel = ref('Submit');

onMounted(async () => {
  console.log(props.claim.claimUuid);
  await fetchClaimServices(props.claim.claimUuid);
});

const fetchClaimServices = async (claimUuid) => {
  loading.value = true;
  await api.get(`/claim/claimed-services?claimUuid=${claimUuid}`,).then((data) => {
    services.value = data;
    loading.value = false;
  });
};

const handleClaimChecked = async (claimUuid, role) => {
  claimCheckLoading.value = true;
  console.log(claimUuid);
  console.log(role);
  if (role === 'Reviewer') {
    await api.put(`/claim/approve/checkedBy?claimUuid=${claimUuid}`,).then((data) => {
      toast.success('Claim Checked Successfully');
      router.push('/ClaimManagement/Checked-Claims')
      emit('claim-checked');
      claimCheckLoading.value = false;
    });
  } else if (role === 'Auditor') {
    await api.put(`/claim/approve/auditedBy?claimUuid=${claimUuid}`).then((data) => {
      router.push('/ClaimManagement/Approved-Claims')
      toast.success('Claim Audited Successfully');
      emit('claim-checked');
      claimCheckLoading.value = false;
    });
  } else if (role === 'Approver') {
    await api.put(`/claim/approve/approvedBy?claimUuid=${claimUuid}`).then((data) => {
      router.push('/ClaimManagement/Authorized-Claims')
      toast.success('Claim Approved Successfully');
      emit('claim-checked');
      claimCheckLoading.value = false;
    });
  }
};

if (claimCheckLoading.value) {
  CheckSubmitLabel.value = 'Loading...';
}

console.log(props.role);
</script>

<template>
  <div class="w-[50vw]">
    <div class="px-4 sm:px-0">
      <p class="mt-1 max-w-2xl text-xl leading-6 text-gray-500">
        Full Claim Info.
      </p>
    </div>
    <div class="mt-6 border-t border-gray-100">
      <dl class="divide-y divide-gray-100">
        <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
          <dt class="text-xl font-medium leading-6 text-gray-900">
            Insured Person Name
          </dt>
          <dd class="mt-1 text-xl leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
            {{ claim?.title }}
            {{
              claim.firstName +
              ' ' +
              claim.fatherName +
              ' ' +
              claim.grandFatherName
            }}
          </dd>
        </div>
        <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
          <dt class="text-xl font-medium leading-6 text-gray-900">
            Insured Person's Phone
          </dt>
          <dd class="mt-1 text-xl leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
            {{ claim.insuredPhone }}
          </dd>
        </div>

        <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
          <dt class="text-xl font-medium leading-6 text-gray-900">
            Provider Name
          </dt>
          <dd class="mt-1 text-xl leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
            {{ claim.providerName }}
          </dd>
        </div>
        <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
          <dt class="text-xl font-medium leading-6 text-gray-900">
            Provide Phone
          </dt>
          <dd class="mt-1 text-xl leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
            {{ claim.providerPhone }}
          </dd>
        </div>

        <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
          <dt class="text-xl font-medium leading-6 text-gray-900">
            Insurance Id
          </dt>
          <dd class="mt-1 text-xl leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
            {{ claim.insuranceId }}
          </dd>
        </div>

        <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
          <dt class="text-xl font-medium leading-6 text-gray-900">
            MRN Number
          </dt>
          <dd class="mt-1 text-xl leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
            {{ claim.mrnNumber }}
          </dd>
        </div>

        <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
          <dt class="text-xl font-medium leading-6 text-gray-900">services</dt>
          <dd class="mt-1 text-xl leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
            <div class="h-20 flex items-center justify-center" v-if="loading">
              <loader />
            </div>
            <div class="h-20 flex items-center" v-if="!services">
              <span class="text-gray-500">no services available !</span>
            </div>

            <serviceList v-if="!loading && services" :services="services" />
          </dd>
        </div>
      </dl>
      <div class="w-full flex justify-end gap-6 py-3 pt-2">
        <BaseButton v-if="role === 'payer'" icon-w="w-4" icon-h="h-4" color="danger" label="Decline" />
        <BaseButton v-if="role !== 'payer'" icon-w="w-4" icon-h="h-4" color="success" :label="CheckSubmitLabel"
          :icon="claimCheckLoading ? null : mdiCheckAll" @click="handleClaimChecked(claim.claimUuid, role)" />
      </div>
    </div>
  </div>
</template>
