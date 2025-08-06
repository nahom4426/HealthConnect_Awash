<script setup>
import { ref, toRefs, computed } from 'vue';
import { Field, Form, useForm, ErrorMessage } from 'vee-validate';
import api from '@/scripts/api';
import buildClaimsArray from '@/helpers/buildClaimArray';
import { useToast } from 'vue-toastification';
import customInput from '@/components/forms/custom/input.vue'
import { useRouter } from 'vue-router';


const loading = ref(false);
const toast = useToast();
const router = useRouter();

const { handleSubmit } = useForm({});
const emit = defineEmits(['payment-completed']);

const props = defineProps({
  claimsToBePayed: {
    type: Object,
    required: true,
  },
});

const { claimsToBePayed } = toRefs(props);

const paymentWay = ref('');
const chequeNumber = ref('');
const importedFile = ref(null);
const otherWay = ref(null)
const providerName = ref('')
const providerPhone = ref('')
const selectedBatches = ref([]);
const settlePaymentRequest = ref([]);

providerName.value = claimsToBePayed?.value[0].providerName
providerPhone.value = claimsToBePayed?.value[0].providerPhone

claimsToBePayed.value.forEach((claim) => {
  selectedBatches.value.push(claim.batchCode)
})

const Amount = computed(() => {
  return claimsToBePayed.value.reduce((sum, claimBatch) => {
    return sum + parseInt(claimBatch.totalAmount);
  }, 0);
});

claimsToBePayed.value.forEach((claim) => {
  settlePaymentRequest.value.push({
    providerUuid: claimsToBePayed?.value[0].providerUuid,
    batchCode: selectedBatches.value,
    checkNumber: chequeNumber.value,
    paymentType: paymentWay.value,
    amount: Amount.value
  })
})

const payClaims = async () => {
  loading.value = true;
  await api.put(`/claim/settle/payment`, settlePaymentRequest.value).then((data) => {
    loading.value = false;
    emit('payment-completed');
    toast.success(data.message);
    router.push('/Finance/Paid-Claims')
  });
};
const payCashClaims = async () => {
  loading.value = true;
  await api.put(`/cash-credit/pay/credit-request`,
    {
      institutionUuid: claimsToBePayed?.value[0].institutionUuid,
      batchCode: selectedBatches.value,
      checkNumber: chequeNumber.value,
      paymentType: paymentWay.value,
      comment: '',
      paymentDate: '',
      amount: Amount.value
    }).then((data) => {
      loading.value = false;
      emit('payment-completed');
      toast.success(data.message);
      router.push('/Finance/Paid-Claims')
    });
};

const handleFileChange = async (event) => {
  importedFile.value = event.target.files[0];
  console.log("testing jkefhfiurhduisre " + JSON.stringify(claimsToBePayed?.value[0]));
};

const submit = handleSubmit(async (values) => {
  if (providerName.value != null) {
    payClaims();
  } else {
    payCashClaims();
  }


});

</script>

<template>
  <form class="2xl:w-[35vw] w-[55vw] mt-5 2xl:mt-10 mb-5" @submit.prevent="submit">
    <div class="flex justify-between items-center divide-x-2">
      <h1 class="">
        <div class="sm:col-span-3">
          <label for="Cheque Number" class="block font-medium leading-6 text-gray-500">Payment Method<span
              class="text-red-600">*</span></label>
          <div class="mt-2 w-[80%]">
            <select v-model="paymentWay"
              class="block w-60 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:leading-6">
              <option value="Cash">Cash</option>
              <option value="Check">Cheque</option>
              <option value="Bank">Bank Transfer</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div class="mt-2 w-[80%]" v-if="paymentWay === 'Check'">
            <customInput type="text" label="" placeholder="Cheque Number" v-model="chequeNumber" :required="true" />
          </div>
          <div class="mt-2 w-[80%]" v-else-if="paymentWay === 'Bank'">
            <input type="file" name="attachment" id="attachment"
              class="block w-60 rounded-md border-0 py-1.5 px-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:leading-6"
              placeholder="attachment" @change="handleFileChange($event)" />
          </div>
          <div class="mt-2 w-[80%]" v-else-if="paymentWay === 'Other'">
            <customInput type="text" label="" placeholder="New Payment Method" v-model="otherWay" :required="true" />
          </div>
          <div class="mt-2 w-[80%]">
            <customInput type="number" label="Total Amount" placeholder="" v-model='Amount' :disabled="true" />
          </div>

        </div>
      </h1>
      <div class="flex flex-col pl-10 font-light">
        <h3 class="text-gray-600 font-semibold">Payment to</h3>
        <h4 class="text-gray-600">{{ providerName }}</h4>
        <h4 class="text-gray-600 text-sm 2xl:text-base">
          Bole Sub-City Woreda-4
        </h4>
        <h4 class="text-gray-600 text-sm 2xl:text-base">Tel: {{ providerPhone }}</h4>
        <h4 class="text-gray-600 text-sm 2xl:text-base">Tin: 9309428834</h4>
      </div>
    </div>
    <div class="mt-10 flow-root">
      <div class="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div class="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
          <div
            class="overflow-hidden ring-1 ring-black ring-opacity-5 sm:rounded-lg max-h[15rem] xl:max-h-[20rem] overflow-y-auto">
            <table class="min-w-full divide-y divide-gray-300">
              <thead class="bg-gray-50 sticky top-0">
                <tr>
                  <th scope="col" class="py-3 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                    Policy holder Name
                  </th>
                  <th scope="col" class="px-3 py-3 text-left text-sm font-semibold text-gray-900">
                    Batch Claim Number
                  </th>
                  <th scope="col" class="px-3 py-3 text-left text-sm font-semibold text-gray-900">
                    Status
                  </th>
                  <th scope="col" class="px-3 py-3 text-left text-sm font-semibold text-gray-900">
                    Total Amount
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 bg-white">
                <tr v-for="claim in claimsToBePayed" :key="claim.id">
                  <td class="whitespace-nowrap py-2 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                    {{ claim.institutionName }}
                  </td>
                  <td class="whitespace-nowrap px-3 py-2 text-sm text-gray-500">
                    {{ claim.batchCode }}
                  </td>
                  <td class="whitespace-nowrap px-3 py-2 text-sm text-gray-500">
                    {{ claim.claimStatus }}
                  </td>
                  <td class="whitespace-nowrap px-3 py-2 text-sm text-gray-500 w-[18%]">
                    {{ claim.totalAmount }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="flex justify-end text-xl font-medium text-gray-600 mt-5">
            <div class="w-1/2 flex justify-between">
              <h3 class="flex-1"></h3>
              <h3 class="flex-1">Total</h3>
              <h3 class="flex-1">
                {{ Amount }}
              </h3>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="flex justify-end mt-10">
      <button type="submit"
        class="px-6 py-2 bg-primary hover:shadow-lg duration-150 text-white font-semibold rounded-lg">
        Issue CPV
      </button>
    </div>
  </form>
</template>
<style>
::-webkit-scrollbar {
  width: 3px;
  height: 7px;
}

::-webkit-scrollbar-thumb {
  background: linear-gradient(13deg, #af9bff 14%, #af9bff 64%);
  border-radius: 0px;
}

::-webkit-scrollbar-thumb:hover {
  background: #6b4ce8;
  opacity: 90%;
}

::-webkit-scrollbar-track {
  background: #fff;
  border-radius: 0px;
  box-shadow: inset 7px 10px 12px #fff;
}
</style>
