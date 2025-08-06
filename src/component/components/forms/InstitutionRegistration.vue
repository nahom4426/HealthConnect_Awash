<script setup>
import * as session from '@/scripts/session';
import api from '@/scripts/api';
import { ref } from 'vue';
import { useForm } from 'vee-validate';
import { registerInstitutionSchema } from '@/validations/validations';
import { Field } from 'vee-validate';

import { useToast } from 'vue-toastification';

const provider = ref({});

const { errors, handleSubmit, defineInputBinds } = useForm({
  validationSchema: registerInstitutionSchema,
});

const institutionInsuranceNumber = ref('');
const insuranceCoverage = ref('');
const contractName = ref('');
const description = ref('');
const endDate = ref('');
const beginDate = ref('');
const contractCode = ref('');
const premium = ref('');
const status = ref('Active');

const toast = useToast();

const institutionUuid = ref('');

const SaveContract = async () => {
  try {
    await api.post(`/payer-institution-contract`,
      {
        institutionUuid: institutionUuid.value,
        contractName: contractName.value,
        description: description.value,
        contractCode: contractCode.value,
        premium: parseFloat(premium.value),
        beginDate: beginDate.value,
        endDate: endDate.value,
        insuranceCoverage: insuranceCoverage.value,
        institutionInsuranceNumber: institutionInsuranceNumber.value,
        status: status.value,
      }).then((data) => {
        toast.success(data.message);
      });
  } catch {
    toast.error(errors.message);
  }
};
</script>

<template>
  <div class="space-y-10 divide-y divide-gray-900/10 flex items-center justify-center">
    <div class=" ">
      <div class="px-4 py-6 sm:p-8">
        <div class="grid max-w-2xl grid-cols-1 gap-x-6 sm:grid-cols-6">
          <div class="sm:col-span-6 text-lg font-semibold bg-gray-100 px-2">
            Institution Info
          </div>
          <div class="sm:col-span-3">
            <label for="first-name" class="block text-sm font-medium leading-6 text-gray-900">Institution Insurance
              Number</label>
            <div class="mt-1">
              <input type="text" v-model="institutionInsuranceNumber" name="institutionInsuranceNumber"
                id="institutionInsuranceNumber" autocomplete="institutionInsuranceNumber"
                class="block w-48 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
              <p class="mt-1 text-sm text-red-600" id="email-error">
                {{ errors.institutionInsuranceNumber }}
              </p>
            </div>
          </div>

          <div class="sm:col-span-3">
            <label for="last-name" class="block text-sm font-medium leading-6 text-gray-900">Insurance Coverage</label>
            <div class="mt-1">
              <input type="text" v-model="insuranceCoverage" name="insuranceCoverage" id="insuranceCoverage"
                autocomplete="insuranceCoverage"
                class="block w-48 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
              <p class="mt-1 text-sm text-red-600" id="email-error">
                {{ errors.insuranceCoverage }}
              </p>
            </div>
          </div>

          <div class="sm:col-span-3">
            <label for="last-name" class="block text-sm font-medium leading-6 text-gray-900">Select Institution</label>
            <div class="mt-1">
              <input type="institutionUuid" v-model="institutionUuid" name="institutionUuid" id="institutionUuid"
                autocomplete="institutionUuid"
                class="block w-48 px-3 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
              <p class="mt-1 text-sm text-red-600" id="email-error">
                {{ errors.institutionUuid }}
              </p>
            </div>
          </div>

          <div class="sm:col-span-3">
            <label for="last-name" class="block text-sm font-medium leading-6 text-gray-900">Group Policy Name</label>
            <div class="mt-1">
              <input type="text" v-model="contractName" name="contractName" id="contractName"
                autocomplete="contractName"
                class="block w-48 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
              <p class="mt-1 text-sm text-red-600" id="email-error">
                {{ errors.contractName }}
              </p>
            </div>
          </div>
          <div class="sm:col-span-3">
            <label for="last-name" class="block text-sm font-medium leading-6 text-gray-900">Group Policy Number</label>
            <div class="mt-1">
              <input type="text" v-model="contractCode" name="contractCode" id="contractCode"
                autocomplete="contractCode"
                class="block w-48 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
              <p class="mt-1 text-sm text-red-600" id="email-error">
                {{ errors.contractCode }}
              </p>
            </div>
          </div>

          <div class="sm:col-span-3">
            <label for="date" class="block text-sm font-medium leading-6 text-gray-900">Premium</label>
            <div class="mt-1">
              <input id="premium" v-model="premium" name="premium" type="number" autocomplete="premium"
                class="block w-48 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
              <p class="mt-1 text-sm text-red-600" id="email-error">
                {{ errors.premium }}
              </p>
            </div>
          </div>

          <div class="sm:col-span-3">
            <label for="date" class="block text-sm font-medium leading-6 text-gray-900">Effective Date</label>
            <div class="mt-1">
              <input id="beginDate" v-model="beginDate" name="beginDate" type="date" autocomplete="beginDate"
                class="block w-48 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
              <p class="mt-1 text-sm text-red-600" id="email-error">
                {{ errors.beginDate }}
              </p>
            </div>
          </div>
          <div class="sm:col-span-3">
            <label for="date" class="block text-sm font-medium leading-6 text-gray-900">End Date</label>
            <div class="mt-1">
              <input id="endDate" name="endDate" v-model="endDate" type="date" autocomplete="endDate"
                class="block w-48 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
              <p class="mt-1 text-sm text-red-600" id="email-error">
                {{ errors.endDate }}
              </p>
            </div>
          </div>

          <div class="sm:col-span-3">
            <label for="status" class="block font-medium leading-6 text-gray-900">Status</label>
            <div class="mt-2">
              <Field as="select" name="status" v-model="status"
                class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:leading-6">
                <option value="active">Active</option>
                <option value="closed">Closed</option>
              </Field>
              <p class="mt-2 text-red-600" id="email-error">
                {{ errors.status }}
              </p>
            </div>
          </div>

          <div class="col-span-full">
            <label for="Description" class="block text-sm font-medium leading-6 text-gray-900">Description</label>
            <div class="mt-1">
              <textarea rows="4" v-model="description" name="description" id="description"
                class="block w-64 h-20 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"></textarea>
              <p class="mt-1 text-sm text-red-600" id="email-error">
                {{ errors.description }}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div class="flex items-center justify-end gap-x-6 border-gray-900/10 px-4 sm:px-8">
        <button @click="SaveContract" type="submit"
          class="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
          Save
        </button>
      </div>
    </div>
  </div>
</template>
