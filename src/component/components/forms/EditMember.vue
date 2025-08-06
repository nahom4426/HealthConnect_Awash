<script setup>
import api from "@/scripts/api";
import { ref, toRefs } from "vue";
import { mdiCheck } from '@mdi/js';
import { useToast } from "vue-toastification";
import BaseButton from '@/components/base/BaseButton.vue';
import { array } from 'yup';

const isFileSelected = ref(false)
const importedFile = ref(null)

const emit = defineEmits(["save"])

const props = defineProps({
  user: {
    type: array,
    required: true
  }
});

const toast = useToast()
const { user } = toRefs(props)

const firstName = ref(user.value.firstName)
const fatherName = ref(user.value.fatherName)
const grandFatherName = ref(user.value.grandFatherName)
const phone = ref(user.value.phone)
const address1 = ref(user.value.address1)
const address2 = ref(user.value.address2)
const address3 = ref(user.value.address3)
const state = ref(user.value.state)
const beginDate = ref(user.value.beginDate)
const endDate = ref(user.value.endDate)
const premium = ref(user.value.premium)
const profileImageInput = ref("null")
const insuredUuid = ref(user.value.insuredUuid)

const Edit = async () => {

  try {
    await api.put(`/insuredperson/${user.value.insuredUuid}`,
      {
        email: user.value.email,
        institutionUuid: user.value.institutionUuid,
        payerInstitutionConractUuid: user.value.payerInstitutionConractUuid,
        premium: premium.value,
        title: user.value.title,
        firstName: firstName.value,
        fatherName: fatherName.value,
        grandFatherName: grandFatherName.value,
        birthDate: user.value.birthDate,
        phone: phone.value,
        branchOffice: user.value.branchOffice,
        position: user.value.position,
        idNumber: user.value.idNumber,
        insuranceId: user.value.insuranceId,
        address1: address1.value,
        address2: address2.value,
        address3: address3.value,
        state: state.value,
        country: user.value.country,
        beginDate: beginDate.value,
        endDate: endDate.value,
        gender: user.value.gender,
        status: user.value.status,
      }).then((data) => {
        emit("save", data);
        toast.success(data.message);
      });
  } catch (e) {
    toast.error(e.message);
  }
};

const open = () => {
  profileImageInput.value.click();
}

async function onFileSelect(event) {
  var input = event.target;
  var file = input.files[0];

  var output = document.getElementById("preview_img");
  output.src = URL.createObjectURL(event.target.files[0]);
  output.onload = function () {
    URL.revokeObjectURL(output.src);
  };
  if (output.src) {
    isFileSelected.value = event.target.files.length > 0
    importedFile.value = event.target.files[0]
  }
}

const addProfilePicture = async () => {
  let formData = new FormData();
  formData.append("file", importedFile.value);
  console.log(importedFile.value)
  try {
    await api.put(
      // headers: {
      //   "Content-Type": "multipart/form-data",
      // },
      `/insuredperson/profile-picture/${insuredUuid.value}`, formData).then((data) => {
        toast.success(data.message);
      });
  } catch (error) {
    toast.error(error.message);
  }
}

</script>

<template>
  <div class="px-4 py-6 sm:p-8">
    <div>
      <form @submit="addProfilePicture" enctype="multipart/form-data"
        class="relative w-44 h-44 col-span-6 flex justify-center mx-auto">
        <input class="invisible" type="file" accept="image/*" ref="profileImageInput" @change="onFileSelect" />
        <div class="w-40 h-40 absolute rounded-xl overflow-clip">
          <img class="object-contain w-40" id="preview_img" src=""
            alt="https://media.istockphoto.com/id/1337144146/vector/d" />
        </div>
        <div @click="open"
          class="w-40 h-40 group hover:bg-gray-200 opacity-60 rounded-xl absolute flex justify-center items-center cursor-pointer transition duration-500">
        </div>
      </form>
    </div>
    <div class="relative w-44 col-span-2 flex justify-center mx-auto">
      <BaseButton v-show="isFileSelected" :icon="mdiCheck" title="Save Profile" color="whiteDark"
        @click="addProfilePicture" label="Save Profile" />
    </div>
    <div class="mt-6 grid max-w-2xl grid-cols-1 gap-x-6 sm:grid-cols-6">
      <div class="sm:col-span-6 text-lg font-semibold bg-gray-100 px-2">
        Members Info
      </div>

      <div class="sm:col-span-2 sm:col-start-1">
        <label for="city" class="block text-sm font-medium leading-6 text-gray-900">First Name</label>
        <div class="mt-1">
          <input type="text" name="firstName" id="firstName" v-model="firstName" autocomplete="firstName"
            class="block w-48 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
        </div>
      </div>

      <div class="sm:col-span-2">
        <label for="Father's Name" class="block text-sm font-medium leading-6 text-gray-900">Father's Name</label>
        <div class="mt-1">
          <input type="text" name="fatherName" v-model="fatherName" id="fatherName" autocomplete="address-level1"
            class="block w-48 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
        </div>
      </div>

      <div class="sm:col-span-2">
        <label for="GrandFather" class="block text-sm font-medium leading-6 text-gray-900">Grandfather's Name</label>
        <div class="mt-1">
          <input type="text" v-model="grandFatherName" name="grandFatherName" id="grandFatherName"
            autocomplete="grandFatherName"
            class="block w-48 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
        </div>
      </div>

      <span class="sm:col-span-6 mt-1 cursor-none font-semibold bg-gray-100 w-full px-2 text-lg">Address</span>

      <div class="sm:col-span-2 sm:col-start-1">
        <label for="city" class="block text-sm font-medium leading-6 text-gray-900">City</label>
        <div class="mt-1">
          <input type="text" name="address1" id="address1" v-model="address1" autocomplete="address1"
            class="block w-48 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
        </div>
      </div>

      <div class="sm:col-span-2">
        <label for="Subcity" class="block text-sm font-medium leading-6 text-gray-900">Subcity</label>
        <div class="mt-1">
          <input type="text" name="address2" v-model="address2" id="address2" autocomplete="address2"
            class="block w-48 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
        </div>
      </div>

      <div class="sm:col-span-2">
        <label for="woreda" class="block text-sm font-medium leading-6 text-gray-900">Woreda</label>
        <div class="mt-1">
          <input type="text" v-model="address3" name="address3" id="address3" autocomplete="address3"
            class="block w-48 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
        </div>
      </div>

      <div class="sm:col-span-2">
        <label for="Region" class="block text-sm font-medium leading-6 text-gray-900">Region</label>
        <div class="mt-1">
          <input placeholder="" id="state" name="state" v-model="state" type="state" autocomplete="state"
            class="block w-48 rounded-md border-0 px-2 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
        </div>
      </div>
      <div class="sm:col-span-3">
        <label for="Telephone" class="block text-sm font-medium leading-6 text-gray-900">Telephone</label>
        <div class="mt-1">
          <input id="phone" name="phone" v-model="phone" type="phone" autocomplete="phone"
            class="block w-48 px-2 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
        </div>
      </div>

      <div class="sm:col-span-2">
        <label for="date" class="block text-sm font-medium leading-6 text-gray-900">Effective Date</label>
        <div class="mt-1">
          <input id="date" v-model="beginDate" name="date" type="date" autocomplete="date"
            class="block w-48 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
        </div>
      </div>
      <div class="sm:col-span-3">
        <label for="date" class="block text-sm font-medium leading-6 text-gray-900">End Date</label>
        <div class="mt-1">
          <input id="date" name="date" v-model="endDate" type="date" autocomplete="date"
            class="block w-48 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
        </div>
      </div>

    </div>

    <div class="flex justify-end gap-x-6 border-gray-900/10 px-4 sm:px-8">
      <button @click="Edit()"
        class="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
        Save
      </button>
    </div>
  </div>
</template>
