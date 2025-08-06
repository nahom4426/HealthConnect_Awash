<script setup>
import * as session from '@/scripts/session';
import { useRouter } from 'vue-router';
import LayoutAuthenticated from '@/layouts/LayoutAuthenticated.vue';
import SectionMain from '@/components/section/SectionMain.vue';
import api from '@/scripts/api';
import { mdiHospitalBuilding, mdiPlus } from '@mdi/js';
import SvgIcon from '@jamescoyle/vue-icon';
import { ref } from 'vue';
import { useForm } from 'vee-validate';
import { registerInstitutionSchema } from '@/validations/validations';
import Modal from '@/components/modal.vue';

import { Field } from 'vee-validate';

import { useToast } from 'vue-toastification';

const provider = ref({});

const { errors, handleSubmit, defineInputBinds } = useForm({
  validationSchema: registerInstitutionSchema,
});

const institutionName = defineInputBinds("institutionName");
const tinNumber = defineInputBinds("tinNumber");
const email = defineInputBinds("email");
const description = defineInputBinds("description");
const telephone = defineInputBinds("telephone");
const category = defineInputBinds("category");
const address1 = defineInputBinds("address1");
const address2 = defineInputBinds("address2");
const address3 = defineInputBinds("address3");
const state = defineInputBinds("state");
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
  // data.country = 'Ethiopia';
  // console.log(data);

  await api.makeAuthenticatedRequest({
    method: "post",
    url: "/api/claimconnect/institution",
    data,
  }).then((data) => {
    //TODO: isloading = false
    // console.log(data);
    emit("save", data);
    toast.success("Institution created successfully");
  });
});
</script>

<template>
  <div class="space-y-10 divide-y divide-gray-900/10 flex items-center justify-center">
    <div class=" ">
      <form @submit.prevent="onSubmit" class="md:col-span-2">
        <div class="px-4 py-6 sm:p-8">
          <div class="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <div class="sm:col-span-6 text-lg font-semibold bg-gray-100 px-2">
              Personal Info
            </div>
            <div class="sm:col-span-2">
              <label for="position" class="block text-xl font-medium leading-6 text-gray-900">Title</label>
              <div class="mt-2">
                <input id="title" v-bind="title" name="title" type="text" autocomplete="title"
                  class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-xl sm:leading-6" />
                <p class="mt-2 text-xl text-red-600" id="email-error">
                  {{ errors.title }}
                </p>
              </div>
            </div>
            <div class="sm:col-span-2">
              <label for="first-name" class="block text-xl font-medium leading-6 text-gray-900">First Name</label>
              <div class="mt-2">
                <input type="text" v-bind="firstName" name="first-name" id="first-name" autocomplete="given-name"
                  class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-xl sm:leading-6" />
                <p class="mt-2 text-xl text-red-600" id="email-error">
                  {{ errors.firstName }}
                </p>
              </div>
            </div>

            <div class="sm:col-span-2">
              <label for="last-name" class="block text-xl font-medium leading-6 text-gray-900">Father Name</label>
              <div class="mt-2">
                <input type="text" v-bind="fatherName" name="last-name" id="last-name" autocomplete="family-name"
                  class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-xl sm:leading-6" />
                <p class="mt-2 text-xl text-red-600" id="email-error">
                  {{ errors.fatherName }}
                </p>
              </div>
            </div>

            <div class="sm:col-span-2">
              <label for="gfathername" class="block text-xl font-medium leading-6 text-gray-900">G.Father Name</label>
              <div class="mt-2">
                <input id="category" v-bind="grandFatherName" name="gfathername" type="text" autocomplete="category"
                  class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-xl sm:leading-6" />
                <p class="mt-2 text-xl text-red-600" id="email-error">
                  {{ errors.grandFatherName }}
                </p>
              </div>
            </div>
            <div class="sm:col-span-2">
              <label for="status" class="block text-xl font-medium leading-6 text-gray-900">Gender</label>
              <div class="mt-2">
                <Field as="select" name="status" v-model="gender"
                  class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:text-xl sm:leading-6">
                  <option value="male">male</option>
                  <option value="female">female</option>
                </Field>
                <p class="mt-2 text-xl text-red-600" id="email-error">
                  {{ errors.gender }}
                </p>
              </div>
            </div>
            <!--  -->
            <div class="sm:col-span-2">
              <label for="category" class="block text-xl font-medium leading-6 text-gray-900">Birthdate</label>
              <div class="mt-2">
                <input id="birthdate" v-bind="birthdate" name="birthdate" type="text" autocomplete="category"
                  class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-xl sm:leading-6" />
                <p class="mt-2 text-xl text-red-600" id="email-error">
                  {{ errors.birthdate }}
                </p>
              </div>
            </div>

            <div class="sm:col-span-2">
              <label for="position" class="block text-xl font-medium leading-6 text-gray-900">position</label>
              <div class="mt-2">
                <input id="category" v-bind="position" name="category" type="text" autocomplete="category"
                  class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-xl sm:leading-6" />
                <p class="mt-2 text-xl text-red-600" id="email-error">
                  {{ errors.position }}
                </p>
              </div>
            </div>

            <span class="sm:col-span-6 mt-2 cursor-none font-semibold bg-gray-100 w-full px-2 text-lg">Address</span>

            <div class="sm:col-span-2 sm:col-start-1">
              <label for="city" class="block text-xl font-medium leading-6 text-gray-900">City</label>
              <div class="mt-2">
                <input type="text" name="city" id="city" v-bind="address1" autocomplete="address-level2"
                  class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-xl sm:leading-6" />
                <p class="mt-2 text-xl text-red-600" id="email-error">
                  {{ errors.address1 }}
                </p>
              </div>
            </div>

            <div class="sm:col-span-2">
              <label for="region" class="block text-xl font-medium leading-6 text-gray-900">Subcity</label>
              <div class="mt-2">
                <input type="text" name="subcity" v-bind="address2" id="region" autocomplete="address-level1"
                  class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-xl sm:leading-6" />
                <p class="mt-2 text-xl text-red-600" id="email-error">
                  {{ errors.address2 }}
                </p>
              </div>
            </div>

            <div class="sm:col-span-2">
              <label for="woreda" class="block text-xl font-medium leading-6 text-gray-900">Woreda</label>
              <div class="mt-2">
                <input type="text" v-bind="address3" name="woreda" id="woreda" autocomplete="woreda"
                  class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-xl sm:leading-6" />
                <p class="mt-2 text-xl text-red-600" id="email-error">
                  {{ errors.address3 }}
                </p>
              </div>
            </div>

            <div class="sm:col-span-2">
              <label for="region" class="block text-xl font-medium leading-6 text-gray-900">Region</label>
              <div class="mt-2">
                <input type="text" v-bind="state" name="region" id="region" autocomplete="region"
                  class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-xl sm:leading-6" />
                <p class="mt-2 text-xl text-red-600" id="email-error">
                  {{ errors.state }}
                </p>
              </div>
            </div>

            <div class="sm:col-span-2">
              <label for="branchOffice" class="block text-xl font-medium leading-6 text-gray-900">Branch Office</label>
              <div class="mt-2">
                <input type="text" name="branchOffice" id="branchOffice" v-bind="branchOffice"
                  autocomplete="address-level2"
                  class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-xl sm:leading-6" />
                <p class="mt-2 text-xl text-red-600" id="email-error">
                  {{ errors.branchOffice }}
                </p>
              </div>
            </div>

            <div class="sm:col-span-2">
              <label for="idNumber" class="block text-xl font-medium leading-6 text-gray-900">Id Number</label>
              <div class="mt-2">
                <input type="text" name="idNumber" id="idNumber" v-bind="idNumber" autocomplete="address-level2"
                  class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-xl sm:leading-6" />
                <p class="mt-2 text-xl text-red-600" id="email-error">
                  {{ errors.idNumber }}
                </p>
              </div>
            </div>

            <span class="sm:col-span-6 mt-2 cursor-none font-semibold bg-gray-100 w-full px-2 text-lg">Insurance
              Info</span>
            <div class="sm:col-span-2">
              <label for="insuranceId" class="block text-xl font-medium leading-6 text-gray-900">Insurance Id</label>
              <div class="mt-2">
                <input type="text" name="insuranceId" id="insuranceId" v-bind="insuranceId"
                  autocomplete="address-level2"
                  class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-xl sm:leading-6" />
                <p class="mt-2 text-xl text-red-600" id="email-error">
                  {{ errors.insuranceId }}
                </p>
              </div>
            </div>

            <div class="sm:col-span-2">
              <label for="Status" class="block text-xl font-medium leading-6 text-gray-900">Status</label>
              <div class="mt-2">
                <input type="text" name="Status" id="Status" v-bind="status" autocomplete="address-level2"
                  class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-xl sm:leading-6" />
                <p class="mt-2 text-xl text-red-600" id="email-error">
                  {{ errors.status }}
                </p>
              </div>
            </div>

            <!-- Contact -->
            <div class="sm:col-span-6 font-semibold bg-gray-100 px-2 text-lg">
              Contact
            </div>
            <div class="sm:col-span-3">
              <label for="email" class="block text-xl font-medium leading-6 text-gray-900">Email address</label>
              <div class="mt-2">
                <input id="email" v-bind="email" name="email" type="email" autocomplete="email"
                  class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-xl sm:leading-6" />
                <p class="mt-2 text-xl text-red-600" id="email-error">
                  {{ errors.email }}
                </p>
              </div>
            </div>
            <div class="sm:col-span-3">
              <label for="country" class="block text-xl font-medium leading-6 text-gray-900">Phone Number</label>
              <div class="mt-2">
                <input id="phone" name="phone" v-bind="phone" type="phone" autocomplete="phone"
                  class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-xl sm:leading-6" />
                <p class="mt-2 text-xl text-red-600" id="email-error">
                  {{ errors.phone }}
                </p>
              </div>
            </div>
            <!--  -->
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
