<script setup>
import api from "@/scripts/api";
import { onMounted, ref, toRefs } from "vue";
import { useForm } from "vee-validate";
import { registerInstitutionSchema } from "@/validations/validations";
import { useToast } from "vue-toastification";
import loader from "@/components/loader/loader.vue";
const { errors } = useForm({
  validationSchema: registerInstitutionSchema,
});

const props = defineProps({
  institutionId: {
    type: String,
    required: true,
  },
});

const { institutionId } = toRefs(props);
const toast = useToast();

const isLoading = ref(true);
const institutionUuid = ref("");
const email = ref("");
const payerUuid = ref("");
const institutionName = ref("");
const description = ref("");
const telephone = ref("");
const tinNumber = ref("");
const category = ref("");
const address1 = ref("");
const address2 = ref("");
const address3 = ref("");
const state = ref("");
const country = ref("");
const longitude = ref("");
const latitude = ref("");
const status = ref("");

onMounted(async () => {
  await fetchInstitutions();
});

const fetchInstitutions = async () => {
  try {
    await api.get(`/institution/${institutionId.value}`,).then((data) => {
      isLoading.value = false;
      institutionUuid.value = data.institutionUuid;
      email.value = data.email;
      institutionName.value = data.institutionName;
      description.value = data.description;
      telephone.value = data.telephone;
      tinNumber.value = data.tinNumber;
      category.value = data.category;
      address1.value = data.address1;
      address2.value = data.address2;
      address3.value = data.address3;
      state.value = data.state;
      country.value = data.country;
      latitude.value = data.latitude;
      longitude.value = data.longitude;
      status.value = data.status;
    });
  } catch (e) {
    toast.error(errors.message);
  }
};

const emit = defineEmits(["save"]);

const UpdateInstitution = async () => {
  try {
    await api.put(`/institution/${institutionId.value}`,
      {
        institutionName: institutionName.value,
        tinNumber: tinNumber.value,
        email: email.value,
        description: description.value,
        telephone: telephone.value,
        category: category.value,
        address1: address1.value,
        address2: address2.value,
        address3: address3.value,
        state: state.value,
        country: country.value,
        payerUuid: payerUuid.value,
        latitude: latitude.value,
        longitude: longitude.value,
        status: status.value,
      }).then((data) => {
        console.log(data);
        emit("save", data);
        toast.success(data.message);
      });
  } catch (e) {
    toast.error(e.message);
  }
};
</script>

<template>
  <div class="space-y-10 divide-y divide-gray-900/10 flex items-center justify-center">
    <div v-if="isLoading" class="flex items-center justify-center h-[40vh]">
      <loader />
    </div>
    <form @submit.prevent="onSubmit" class="md:col-span-2">
      <div class="px-4 py-6 sm:p-8">
        <div class="grid max-w-2xl grid-cols-1 gap-x-6 sm:grid-cols-6">
          <div class="sm:col-span-6 text-lg font-semibold bg-gray-100 px-2">
            Institution Info
          </div>
          <div class="sm:col-span-3">
            <label for="first-name" class="block text-sm font-medium leading-6 text-gray-900">Institution Name</label>
            <div class="mt-1">
              <input type="text" v-model="institutionName" name="institutionName" id="institutionName"
                autocomplete="institutionName"
                class="block w-48 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
            </div>
          </div>

          <div class="sm:col-span-3">
            <label for="last-name" class="block text-sm font-medium leading-6 text-gray-900">Phone Number</label>
            <div class="mt-1">
              <input type="telephone" v-model="telephone" name="telephone" id="telephone" autocomplete="telephone"
                class="px-2 block w-48 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
            </div>
          </div>

          <div class="sm:col-span-3">
            <label for="last-name" class="block text-sm font-medium leading-6 text-gray-900">city</label>
            <div class="mt-1">
              <input type="text" v-model="address1" name="address1" id="address1" autocomplete="address1"
                class="block w-48 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
            </div>
          </div>
          <div class="sm:col-span-3">
            <label for="last-name" class="block text-sm font-medium leading-6 text-gray-900">Sub City</label>
            <div class="mt-1">
              <input type="text" v-model="address2" name="address2" id="address2" autocomplete="address2"
                class="block w-48 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
            </div>
          </div>

          <div class="sm:col-span-3">
            <label for="date" class="block text-sm font-medium leading-6 text-gray-900">
              Region</label>
            <div class="mt-1">
              <input id="state" v-model="state" name="state" type="state" autocomplete="state"
                class="block px-2 w-48 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
            </div>
          </div>
          <div class="sm:col-span-3">
            <label for="date" class="block text-sm font-medium leading-6 text-gray-900">category</label>
            <div class="mt-1">
              <input id="category" name="category" v-model="category" type="category" autocomplete="category"
                class="block px-2 w-48 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
            </div>
          </div>
          <div class="col-span-full">
            <label for="Description" class="block text-sm font-medium leading-6 text-gray-900">Description</label>
            <div class="mt-1">
              <textarea rows="4" v-model="description" name="comment" id="comment"
                class="block w-48 h-20 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
            </div>
          </div>
        </div>
      </div>
      <div class="flex items-center justify-end gap-x-6 border-gray-900/10 px-4 py-4 sm:px-8">
        <button @click="UpdateInstitution" type="submit"
          class="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
          Save
        </button>
      </div>
    </form>
  </div>
</template>
