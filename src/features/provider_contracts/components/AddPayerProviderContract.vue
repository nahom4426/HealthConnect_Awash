<script setup>
import * as session from '@/scripts/session';
import { useRouter, useRoute } from 'vue-router';
import api from '@/scripts/api';
import { mdiHospitalBuilding, mdiPlus } from '@mdi/js';
import { ref, onMounted } from 'vue';
import { useForm, ErrorMessage } from 'vee-validate';
import { registerInstitutionSchema } from '@/validations/validations';
import { Field } from 'vee-validate';
import { useToast } from '@/toast/store/toast';

const toast = useToast();
const route = useRoute();

const isLoading = ref('false');
const contractName = ref('');
const contractCode = ref('');
const beginDate = ref('');
const endDate = ref('');
const description = ref('');

const emit = defineEmits(['close'])

const { errors } = useForm({
  validationSchema: registerInstitutionSchema,
});

const createContract = async () => {
  isLoading.value = true;
  try {
    await api.post('/payer-provider-contract', {
      providerUuid: route.params.Uuid,
      contractName: contractName.value,
      contractCode: contractCode.value,
      description: description.value,
      beginDate: beginDate.value,
      endDate: endDate.value,
    }).then((data) => {
      isLoading.value = false;
      toast.success(data.message);
      emit('close')
    });
  } catch (e) {
    isLoading.value = false;
    toast.error(e.message);
  }
};

</script>

<template>
  <div class="flex justify-center items-center space-y-10 divide-y divide-gray-900/10">
    <div class="">
      <form @submit.prevent="submit" class="md:col-span-2">
        <div class="px-4 py-6 sm:px-8 sm:py-4">
          <div class="grid grid-cols-1 gap-y-4 gap-x-6 max-w-2xl sm:grid-cols-6">
            <div class="px-2 text-lg font-semibold bg-gray-100 sm:col-span-6">
              Contract Info
            </div>
            <div class="sm:col-span-3">
              <label for="contract-name" class="block font-medium leading-6 text-gray-900">Contract Name</label>
              <div class="mt-1">
                <input type="text" v-model="contractName" name="Contract Name" id="contract-name" rules="required"
                  class="block py-1.5 w-full text-gray-600 rounded-md border-0 ring-1 ring-inset ring-gray-300 shadow-sm placeholder:text-gray-400 focus:ring-1 focus:ring-inset focus:ring-indigo-300 sm:leading-6" />
                <ErrorMessage name="Contract Name" class="text-xs text-red-600" />
              </div>
            </div>

            <div class="sm:col-span-3">
              <label for="contract-code" class="block font-medium leading-6 text-gray-900">Contract Code</label>
              <div class="mt-1">
                <input type="text" v-model="contractCode" name="Contract Code" id="contract-code" rules="required"
                  class="block py-1.5 w-full text-gray-600 rounded-md border-0 ring-1 ring-inset ring-gray-300 shadow-sm placeholder:text-gray-400 focus:ring-1 focus:ring-inset focus:ring-indigo-300 sm:leading-6" />
                <ErrorMessage name="Contract Code" class="text-xs text-red-600" />
              </div>
            </div>

            <div class="sm:col-span-3">
              <label for="status" class="block font-medium leading-6 text-gray-900">Effective Date From</label>
              <div class="mt-1">
                <input type="date" v-model="beginDate" name="beginDate" id="beginDate" rules="required"
                  class="block py-1.5 w-full text-gray-600 rounded-md border-0 ring-1 ring-inset ring-gray-300 shadow-sm placeholder:text-gray-400 focus:ring-1 focus:ring-inset focus:ring-indigo-300 sm:leading-6" />

                <ErrorMessage name="beginDate" class="text-xs text-red-600" />
              </div>
            </div>
            <div class="sm:col-span-3">
              <label for="premium" class="block font-medium leading-6 text-gray-900">Effective Date To</label>
              <div class="mt-1">
                <input type="datetime-local" v-model="endDate" name="endDate" id="endDate" rules="required"
                  class="block py-1.5 w-full text-gray-600 rounded-md border-0 ring-1 ring-inset ring-gray-300 shadow-sm placeholder:text-gray-400 focus:ring-1 focus:ring-inset focus:ring-indigo-300 sm:leading-6" />
                <ErrorMessage name="endDate" class="text-xs text-red-600" />
              </div>
            </div>

            <div class="flex col-span-full">
              <div>
                <label for="street-address" class="block font-medium leading-6 text-gray-900">Description</label>
                <div class="mt-1">
                  <Field v-slot="{ errors }" v-model="description" name="Description" rules="required">
                    <textarea v-model="description" name="Description" class="rounded-lg" placeholder="Write here . . ."
                      rows="2" cols="30" :class="errors[0]
        ? 'ring-1 ring-red-600 focus:ring-1 focus:ring-red-600 border-red-600 focus:border-red-600 focus:outline-none'
        : ''
        " />
                    <small v-if="errors[0]" class="mt-1 font-light text-red-600">{{ errors[0] }}</small>
                  </Field>
                </div>
              </div>

              <div class="flex gap-x-6 justify-start items-end py-3 ml-10 w-full border-gray-900/10">
                <button type="submit" @click="createContract"
                  class="px-3 py-2 w-full text-xl font-semibold text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
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
