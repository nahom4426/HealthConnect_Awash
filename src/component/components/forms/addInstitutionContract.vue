<script setup>
import * as session from "@/scripts/session";
import { useRouter } from "vue-router";
import LayoutAuthenticated from "@/layouts/LayoutAuthenticated.vue";
import SectionMain from "@/components/section/SectionMain.vue";
import api from "@/scripts/api";
import { mdiHospitalBuilding, mdiPlus } from "@mdi/js";
import SvgIcon from "@jamescoyle/vue-icon";
import { ref, onMounted } from "vue";
import { useForm } from "vee-validate";
import { registerInstitutionSchema } from "@/validations/validations";
import Modal from "@/components/modal.vue";
import { Field } from "vee-validate";

import { defineComponent } from "vue";

import { useToast } from "vue-toastification";

const provider = ref({});

const { errors, handleSubmit, defineInputBinds } = useForm({
  validationSchema: registerInstitutionSchema,
});

const contractName = defineInputBinds("contractName");
const contractCode = defineInputBinds("contractCode");
const beginDate = defineInputBinds("beginDate");
const endDate = defineInputBinds("endDate");
const insuranceCoverage = defineInputBinds("insuranceCoverage");
const institutionInsuranceNumber = defineInputBinds(
  "institutionInsuranceNumber"
);
const institutionUuid = defineInputBinds("institutionUuid");
const description = defineInputBinds("description");
const status = ref("Active");
const toast = useToast();

const openModal = async () => {
  console.log("modal open");
  console.log(registerModal.value);
  registerModal.value = !registerModal.value;
  open.value = true;
  console.log(registerModal.value);
};

const emit = defineEmits(["save"]);

const onSubmit = handleSubmit(async (data) => {
  await api.makeAuthenticatedRequest({
    method: "post",
    url: "/api/claimconnect/institution",
    data,
  }).then((data) => {
    emit("save", data);
    toast.success("Institution created successfully");
  });
});

onMounted(() => { });
</script>

<template>
  <div class="space-y-10 divide-y divide-gray-900/10 flex items-center justify-center">
    <div class=" ">
      <form @submit.prevent="onSubmit" class="md:col-span-2">
        <div class="px-4 py-6 sm:p-8">
          <div class="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <div class="sm:col-span-6 text-lg font-semibold bg-gray-100 px-2">
              Contract Info
            </div>
            <div class="sm:col-span-3">
              <label for="first-name" class="block text-xl font-medium leading-6 text-gray-900">Contract Name</label>
              <div class="mt-2">
                <input type="text" v-bind="contractName" name="first-name" id="first-name" autocomplete="given-name"
                  class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-xl sm:leading-6" />
                <p class="mt-2 text-xl text-red-600" id="email-error">
                  {{ errors.contractName }}
                </p>
              </div>
            </div>

            <div class="sm:col-span-3">
              <label for="contractCode" class="block text-xl font-medium leading-6 text-gray-900">Contract Code</label>
              <div class="mt-2">
                <input type="text" v-bind="contractCode" name="contractCode" id="contractCode"
                  autocomplete="contractCode"
                  class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-xl sm:leading-6" />
                <p class="mt-2 text-xl text-red-600" id="email-error">
                  {{ errors.contractCode }}
                </p>
              </div>
            </div>

            <div class="sm:col-span-3">
              <label for="status" class="block text-xl font-medium leading-6 text-gray-900">Status</label>
              <div class="mt-2">
                <Field as="select" name="status" v-model="status"
                  class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:text-xl sm:leading-6">
                  <option value="active">Active</option>
                  <option value="closed">Closed</option>
                </Field>
                <p class="mt-2 text-xl text-red-600" id="email-error">
                  {{ errors.status }}
                </p>
              </div>
            </div>

            <div class="sm:col-span-6 text-lg font-semibold bg-gray-100 px-2">
              Institution Info
            </div>

            <div class="sm:col-span-3">
              <label for="institutionUuid" class="block text-xl font-medium leading-6 text-gray-900">Select
                Institution</label>
              <div class="mt-2">
                <Field as="select" name="institutionUuid" v-model="institutionUuid"
                  class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:text-xl sm:leading-6">
                  <option value="active">Active</option>
                </Field>
                <p class="mt-2 text-xl text-red-600" id="email-error">
                  {{ errors.institutionUuid }}
                </p>
              </div>
            </div>

            <div class="sm:col-span-3">
              <label for="institutionInsuranceNumber"
                class="block text-xl font-medium leading-6 text-gray-900">Institution Insurance Number</label>
              <div class="mt-2">
                <input id="institutionInsuranceNumber" v-bind="institutionInsuranceNumber"
                  name="institutionInsuranceNumber" type="text" autocomplete="institutionInsuranceNumber"
                  class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-xl sm:leading-6" />
                <p class="mt-2 text-xl text-red-600" id="email-error">
                  {{ errors.institutionInsuranceNumber }}
                </p>
              </div>
            </div>

            <div class="sm:col-span-6 text-lg font-semibold bg-gray-100 px-2">
              Insurance Info
            </div>

            <div class="sm:col-span-3">
              <label for="institutionInsuranceNumber" class="block text-xl font-medium leading-6 text-gray-900">Start
                Date</label>
              <div class="mt-2">
                <input id="beginDate" v-bind="beginDate" name="beginDate" type="text" autocomplete="beginDate"
                  class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-xl sm:leading-6" />
                <p class="mt-2 text-xl text-red-600" id="email-error">
                  {{ errors.beginDate }}
                </p>
              </div>
            </div>
            <div class="sm:col-span-3">
              <label for="institutionInsuranceNumber" class="block text-xl font-medium leading-6 text-gray-900">End
                Date</label>
              <div class="mt-2">
                <input id="endDate" v-bind="endDate" name="endDate" type="text" autocomplete="endDate"
                  class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-xl sm:leading-6" />
                <p class="mt-2 text-xl text-red-600" id="email-error">
                  {{ errors.endDate }}
                </p>
              </div>
            </div>

            <div class="sm:col-span-3">
              <label for="insuranceCoverage" class="block text-xl font-medium leading-6 text-gray-900">Insurance
                Coverage</label>
              <div class="mt-2">
                <input id="insuranceCoverage" v-bind="insuranceCoverage" name="insuranceCoverage" type="text"
                  autocomplete="insuranceCoverage"
                  class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-xl sm:leading-6" />
                <p class="mt-2 text-xl text-red-600" id="email-error">
                  {{ errors.insuranceCoverage }}
                </p>
              </div>
            </div>

            <div class="col-span-full">
              <label for="street-address" class="block text-xl font-medium leading-6 text-gray-900">Description</label>
              <div class="mt-2">
                <textarea rows="4" v-bind="description" name="comment" id="comment"
                  class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-xl sm:leading-6" />
                <p class="mt-2 text-xl text-red-600" id="email-error">
                  {{ errors.description }}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div class="flex items-center justify-end gap-x-6 border-gray-900/10 px-4 py-4 sm:px-8">
          <button type="submit"
            class="rounded-md bg-indigo-600 px-3 py-2 text-xl font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
            Save
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
