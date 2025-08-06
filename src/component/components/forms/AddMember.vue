<script setup>
import api from "@/scripts/api";
import { ref } from "vue";
import { useForm } from "vee-validate";
import { registerInstitutionSchema } from "@/validations/validations";
import { useToast } from "vue-toastification";
import { Field } from "vee-validate";
import { useRoute } from 'vue-router';
const { errors } = useForm({
  validationSchema: registerInstitutionSchema,
});

const toast = useToast()
const route = useRoute()

const email = ref("");
const title = ref("");
const firstName = ref("");
const fatherName = ref("");
const grandFatherName = ref("");
const birthDate = ref("");
const phone = ref("+251");
const branchOffice = ref("");
const position = ref("");
const insuranceId = ref("");
const address1 = ref("");
const address2 = ref("");
const address3 = ref("");
const state = ref("");
const country = ref("");
const beginDate = ref("");
const endDate = ref("");
const gender = ref("");
const status = ref("Active");

const emit = defineEmits(["save"]);

const handleMember = async () => {
  try {
    await api.post('/insuredperson',
      {
        email: email.value,
        institutionUuid: route.params.Uuid,
        payerInstitutionContractUuid: route.params.id,
        title: title.value,
        firstName: firstName.value,
        fatherName: fatherName.value,
        grandFatherName: grandFatherName.value,
        birthDate: birthDate.value,
        phone: phone.value,
        branchOffice: branchOffice.value,
        position: position.value,
        insuranceId: insuranceId.value,
        address1: address1.value,
        address2: address2.value,
        address3: address3.value,
        state: state.value,
        country: country.value,
        beginDate: beginDate.value,
        endDate: endDate.value,
        status: status.value,
        gender: gender.value,
      }).then((data) => {
        toast.success(data.message);
      });
  } catch {
    toast.error(errors.message);
  }
};
</script>

<template>
  <div class="px-4 py-6 sm:p-8">
    <div class="mt-6 grid max-w-2xl grid-cols-1 gap-x-6 sm:grid-cols-6">
      <div class="sm:col-span-6 text-lg font-semibold bg-gray-100 px-2">
        Members Info
      </div>

      <div class="sm:col-span-2 sm:col-start-1">
        <label for="city" class="block text-sm font-medium leading-6 text-gray-900">First Name</label>
        <div class="mt-1">
          <input type="text" name="firstName" id="firstName" v-model="firstName" autocomplete="firstName"
            class="block w-48 px-2 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
          <p class="mt-1 text-sm text-red-600" id="email-error">
            {{ errors.firstName }}
          </p>
        </div>
      </div>

      <div class="sm:col-span-2">
        <label for="Father's Name" class="block text-sm font-medium leading-6 text-gray-900">Father's Name</label>
        <div class="mt-1">
          <input type="text" name="fatherName" v-model="fatherName" id="FatherName" autocomplete="fatherName"
            class="block w-48 px-2 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
          <p class="mt-1 text-sm text-red-600" id="email-error">
            {{ errors.fatherName }}
          </p>
        </div>
      </div>

      <div class="sm:col-span-2">
        <label for="GrandFather" class="block text-sm font-medium leading-6 text-gray-900">Grandfather's Name</label>
        <div class="mt-1">
          <input type="text" v-model="grandFatherName" name="grandFatherName" id="grandFatherName"
            autocomplete="grandFatherName"
            class="block w-48 px-2 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
          <p class="mt-1 text-sm text-red-600" id="email-error">
            {{ errors.grandFatherName }}
          </p>
        </div>
      </div>

      <div class="sm:col-span-2">
        <label for="title" class="block text-sm font-medium leading-6 text-gray-900">Birth Date</label>
        <div class="mt-1">
          <input id="birthDate" name="birthDate" v-model="birthDate" type="date" autocomplete="birthDate"
            class="block w-48 px-2 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
          <p class="mt-1 text-sm text-red-600" id="email-error">
            {{ errors.birthDate }}
          </p>
        </div>
      </div>

      <div class="sm:col-span-2">
        <label for="Telephone" class="block text-sm font-medium leading-6 text-gray-900">Telephone</label>
        <div class="mt-1">
          <input id="phone" name="phone" v-model="phone" type="phone" autocomplete="phone"
            class="block w-48 px-2 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
          <p class="mt-1 text-sm text-red-600" id="email-error">
            {{ errors.phone }}
          </p>
        </div>
      </div>

      <div class="sm:col-span-2">
        <label for="title" class="block leading-6 text-gray-900">Title</label>
        <div class="mt-2">
          <Field as="select" name="title" v-model="title"
            class="block w-32 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:leading-6">
            <option value="Mr.">Mr.</option>
            <option value="Ms.">Ms.</option>
          </Field>
          <p class="mt-2 text-red-600" id="email-error">
            {{ errors.title }}
          </p>
        </div>
      </div>

      <div class="sm:col-span-2">
        <label for="email" class="block text-sm font-medium leading-6 text-gray-900">Email</label>
        <div class="mt-1">
          <input id="email" name="email" v-model="email" type="email" autocomplete="email"
            class="block w-48 px-2 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
          <p class="mt-1 text-sm text-red-600" id="email-error">
            {{ errors.email }}
          </p>
        </div>
      </div>

      <div class="sm:col-span-2">
        <label for="country" class="block text-sm font-medium leading-6 text-gray-900">
          Country</label>
        <div class="mt-1">
          <input id="country" name="country" v-model="country" type="country" autocomplete="country"
            class="block w-48 px-2 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
          <p class="mt-1 text-sm text-red-600" id="email-error">
            {{ errors.country }}
          </p>
        </div>
      </div>

      <div class="sm:col-span-2">
        <label for="gender" class="block text-sm font-medium leading-6 text-gray-900">
          Gender</label>
        <div class="mt-1">
          <input id="gender" name="gender" v-model="gender" type="gender" autocomplete="gender"
            class="block w-48 px-2 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
          <p class="mt-1 text-sm text-red-600" id="email-error">
            {{ errors.gender }}
          </p>
        </div>
      </div>

      <span class="sm:col-span-6 mt-1 cursor-none font-semibold bg-gray-100 w-full px-2 text-lg">Address</span>

      <div class="sm:col-span-2 sm:col-start-1">
        <label for="city" class="block text-sm font-medium leading-6 text-gray-900">City</label>
        <div class="mt-1">
          <input type="text" name="address1" id="address1" v-model="address1" autocomplete="city"
            class="block w-48 px-2 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
          <p class="mt-1 text-sm text-red-600" id="email-error">
            {{ errors.address1 }}
          </p>
        </div>
      </div>

      <div class="sm:col-span-2">
        <label for="Subcity" class="block text-sm font-medium leading-6 text-gray-900">Subcity</label>
        <div class="mt-1">
          <input type="text" name="address3" v-model="address3" id="Subcity" autocomplete="address-level1"
            class="block w-48 px-2 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
          <p class="mt-1 text-sm text-red-600" id="email-error">
            {{ errors.address3 }}
          </p>
        </div>
      </div>

      <div class="sm:col-span-2">
        <label for="woreda" class="block text-sm font-medium leading-6 text-gray-900">Woreda</label>
        <div class="mt-1">
          <input type="text" v-model="address2" name="address2" id="address2" autocomplete="address2"
            class="block w-48 px-2 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
          <p class="mt-1 text-sm text-red-600" id="email-error">
            {{ errors.address2 }}
          </p>
        </div>
      </div>

      <div class="sm:col-span-2">
        <label for="Region" class="block text-sm font-medium leading-6 text-gray-900">Region</label>
        <div class="mt-1">
          <input placeholder="" id="state" name="state" v-model="state" type="state" autocomplete="state"
            class="block w-48 px-2 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
          <p class="mt-1 text-sm text-red-600" id="email-error">
            {{ errors.state }}
          </p>
        </div>
      </div>

      <div class="sm:col-span-2">
        <label for="branchOffice" class="block text-sm font-medium leading-6 text-gray-900">Branch Office</label>
        <div class="mt-1">
          <input id="branchOffice" name="branchOffice" v-model="branchOffice" type="branchOffice"
            autocomplete="branchOffice"
            class="block w-48 px-2 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
          <p class="mt-1 text-sm text-red-600" id="email-error">
            {{ errors.branchOffice }}
          </p>
        </div>
      </div>

      <div class="sm:col-span-2">
        <label for="position" class="block text-sm font-medium leading-6 text-gray-900">
          Position</label>
        <div class="mt-1">
          <input id="position" name="position" v-model="position" type="position" autocomplete="position"
            class="block w-48 px-2 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
          <p class="mt-1 text-sm text-red-600" id="email-error">
            {{ errors.position }}
          </p>
        </div>
      </div>

      <div class="sm:col-span-2">
        <label for="insuranceId" class="block text-sm font-medium leading-6 text-gray-900">
          Insurance Id</label>
        <div class="mt-1">
          <input id="insuranceId" name="insuranceId" v-model="insuranceId" type="insuranceId" autocomplete="insuranceId"
            class="block w-48 px-2 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
          <p class="mt-1 text-sm text-red-600" id="email-error">
            {{ errors.insuranceId }}
          </p>
        </div>
      </div>

      <div class="sm:col-span-2">
        <label for="status" class="block leading-6 text-gray-900">Status</label>
        <div class="mt-2">
          <Field as="select" name="status" v-model="status"
            class="block w-48 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:leading-6">
            <option value="ACTIVE">Active</option>
            <option value="PENDING">Pending</option>
            <option value="SUSPENDED">Suspended</option>
          </Field>
          <p class="mt-2 text-red-600" id="email-error">
            {{ errors.status }}
          </p>
        </div>
      </div>
      <span class="sm:col-span-6 mt-1 cursor-none font-semibold bg-gray-100 w-full px-2 text-lg">Effective Date</span>
      <div class="sm:col-span-2">
        <label for="date" class="block text-sm font-medium leading-6 text-gray-900">Effective Date</label>
        <div class="mt-1">
          <input id="date" v-model="beginDate" name="date" type="date" autocomplete="date"
            class="block w-48 px-2 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
          <p class="mt-1 text-sm text-red-600" id="email-error">
            {{ errors.beginDate }}
          </p>
        </div>
      </div>
      <div class="sm:col-span-3">
        <label for="date" class="block text-sm font-medium leading-6 text-gray-900">End Date</label>
        <div class="mt-1">
          <input id="date" name="date" v-model="endDate" type="date" autocomplete="date"
            class="block w-48 px-2 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
          <p class="mt-1 text-sm text-red-600" id="email-error">
            {{ errors.endDate }}
          </p>
        </div>
      </div>
    </div>

    <div class="flex items-center justify-end gap-x-6 border-gray-900/10 px-4 py-4 sm:px-8">
      <button type="submit" @click="handleMember"
        class="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
        Save
      </button>
    </div>
  </div>
</template>
