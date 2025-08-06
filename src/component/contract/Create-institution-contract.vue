<script setup>
import api from '@/scripts/api';
import { ref } from 'vue';
import { useRoute } from "vue-router";
import { Field, ErrorMessage, Form, useForm } from 'vee-validate';
import { useToast } from 'vue-toastification';
import ConfirmModal from '@/components/ConfirmModal.vue';
import customInput from '@/components/forms/custom/input.vue';

const { handleSubmit } = useForm({});
const loading = ref(false);
const toast = useToast();
const contractName = ref('');
const contractNameVal = ref(null);
const contractCode = ref('');
const contractCodeVal = ref(null);
const benefit = ref();
const benefitVal = ref(null);
const premium = ref();
const premiumVal = ref(null);
const beginDate = ref('');
const beginDateVal = ref(null);
const endDate = ref('');
const endDateVal = ref(null);
const status = ref(null);
const approveModal = ref(false);
const contractData = ref();

const emit = defineEmits(['refetch', 'close']);
const route = useRoute();


const submit = handleSubmit(async (values) => {
  contractData.value = {
    institutionUuid: route.params.Uuid,
    contractName: contractName.value,
    contractCode: contractCode.value,
    benefit: benefit.value,
    premium: premium.value,
    beginDate: beginDate.value,
    endDate: endDate.value,
    status: values['Status'],
  };
  contractNameVal.value.validateInput();
  contractCodeVal.value.validateInput();
  benefitVal.value.validateInput();
  premiumVal.value.validateInput();
  beginDateVal.value.validateInput();
  endDateVal.value.validateInput();
  if (!contractNameVal.value.hasError && !contractCodeVal.value.hasError && !benefitVal.value.hasError && !premiumVal.value.hasError && !beginDateVal.value.hasError && !endDateVal.value.hasError) {
    approveModal.value = true;
  }
});

async function confirmApprove() {
  loading.value = true;

  try {
    await api.post(`/payer-institution-contract`, contractData.value).then((data) => {
      console.log(data);
      loading.value = false;
      approveModal.value = false;
      emit('close');
      emit('refetch');
      toast.success(data.message);
    });
  } catch (error) {
    toast.error(error.message);
  }

}
</script>
<template>
  <div class="space-y-10 divide-y divide-gray-900/10 flex items-center justify-center">
    <ConfirmModal v-model="approveModal" @confirm="confirmApprove" icon="simple-line-icons:check"
      title="Create Institution Contract" description="Are you sure you want to create this institution contract?"
      confirmButton="create" iconClass="text-primary p-1 text-3xl" iconWrapperClass="bg-primary rounded-full p-1"
      confirmButtonClass="inline-flex w-full justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary sm:ml-3 sm:w-auto duration-300" />
    <div class=" ">
      <form @submit.prevent="submit" class="md:col-span-2">
        <div class="px-4 py-6 sm:px-8 sm:py-4">
          <div class="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-6">
            <div class="sm:col-span-3">
              <customInput type="text" ref="contractNameVal" label="Category Name" v-model="contractName"
                :required="true" />
            </div>

            <div class="sm:col-span-3">
              <customInput type="text" ref="contractCodeVal" label="Category Code" v-model="contractCode"
                :required="true" />
            </div>

            <div class="sm:col-span-3">
              <customInput type="number" ref="benefitVal" label="Benefit" v-model="benefit" :required="true" />
            </div>

            <div class="sm:col-span-3">
              <customInput type="number" ref="premiumVal" label="Premium" v-model="premium" :required="true" />
            </div>

            <div class="sm:col-span-3">
              <customInput type="date" ref="beginDateVal" label="Effective Date" v-model="beginDate" :required="true" />
            </div>

            <div class="sm:col-span-3">
              <customInput type="date" ref="endDateVal" label="End Date" v-model="endDate" :required="true" />
            </div>


            <div class="sm:col-span-3">
              <label for="status" class="block font-medium leading-6 text-gray-900">Status</label>
              <div class="mt-1">
                <Field as="select" name="Status" id="status"
                  class="block w-full rounded-md border-0 py-1.5 text-gray-600 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-1 focus:ring-inset focus:ring-indigo-300 sm:leading-6">
                  <option value="ACTIVE">Active</option>
                  <option value="PENDING">Pending</option>
                  <option value="CLOSED">Closed</option>
                </Field>
                <ErrorMessage name="Status" class="text-xs text-red-600" />
              </div>
            </div>
            <div class="col-span-full flex">
              <div class="flex items-end justify-end w-full gap-x-6 border-gray-900/10 py-3 ml-10">
                <button type="submit"
                  class="rounded-md bg-indigo-600 px-3 py-2 text-xl w-full font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>
