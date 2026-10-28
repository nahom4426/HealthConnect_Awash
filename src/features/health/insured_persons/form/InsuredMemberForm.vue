<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useForm } from "@/components/new_form_builder/useForm";
import Form from "@/components/new_form_builder/Form.vue";
import Input from "@/components/new_form_elements/Input.vue";
import Select from "@/components/new_form_elements/Select.vue";
import Button from "@/components/Button.vue";
import InputEmail from "@/components/new_form_elements/InputEmail.vue";
import ModalFormSubmitButton from "@/components/new_form_builder/ModalFormSubmitButton.vue";
import { useAuthStore } from "@/stores/auth";
import FamilyGroup from "../pages/FamilyGroup.vue";
import FamilyDataProvider from "../components/FamilyDataProvider.vue";
import { 
  ethiopianRegions, 
  citiesByRegion, 
  subCitiesByCity, 
  getCitiesByRegion, 
  getSubCitiesByCity 
} from '@/components/ethiopianLocations';

// 💡 NEW: import FamilyGroup component
// import FamilyGroup from "@/components/EmployeePayerGroup/FamilyGroup.vue";

const auth = useAuthStore();

const props = defineProps({
  initialData: { type: Object, default: () => ({}) },
  isEdit: { type: Boolean, default: false },
  institutionId: { type: String, required: true },
  pending: { type: Boolean, default: false },
  onSubmit: { type: Function, required: true },
  onCancel: { type: Function, required: true },
});

// Form data
const employeePhoto = ref(null);
const firstName = ref("");
const fatherName = ref("");
const institutionId = ref(auth.auth?.user?.payerUuid || "");
const grandFatherName = ref("");
const gender = ref("Male");
const role = ref("");
const dateOfBirth = ref("");
const inactiveDate = ref("");
const idNumber = ref("");
const phoneNumber = ref("");
const countryCode = ref("+254");
const woreda = ref(""); // Woreda
const subcity = ref(""); // Sub City
const city = ref(""); // City
const state = ref("Addis Ababa");
const email = ref("");
const status = ref("ACTIVE");
const hasInactiveDate = ref("no");
const previewImage = ref("");
const payerId = ref("");
const allowedUuid = ref(""); // 💡 NEW

// Computed properties for dynamic dropdowns
const availableCities = computed(() => {
  return getCitiesByRegion(state.value);
});

const availableSubCities = computed(() => {
  return getSubCitiesByCity(city.value);
});

const isAddisAbaba = computed(() => {
  return state.value === 'Addis Ababa';
});

// Watch for state changes to reset city and sub-city
watch(state, (newState) => {
  city.value = '';
  subcity.value = '';
  woreda.value = '';
});

// Watch for city changes to reset sub-city
watch(city, (newCity) => {
  subcity.value = '';
  woreda.value = '';
});

onMounted(() => {
  if (props.initialData && Object.keys(props.initialData).length > 0) {
    payerId.value = props.initialData.payerUuid || "";
    allowedUuid.value = props.initialData.allowedUuid || ""; // 💡 NEW
    firstName.value = props.initialData.firstName || "";
    fatherName.value = props.initialData.fatherName || "";
    grandFatherName.value =
      props.initialData.grandFatherName ||
      props.initialData.grandfatherName ||
      "";
    gender.value = props.initialData.gender || "Male";
    role.value = props.initialData.position || "";
    dateOfBirth.value = props.initialData.birthDate?.split("T")[0] || "";
    inactiveDate.value = props.initialData.inactiveDate?.split("T")[0] || "";
    idNumber.value = props.initialData.idNumber || "";
    state.value = props.initialData.state || "Addis Ababa";
    city.value = props.initialData.city || ""; // City
    subcity.value = props.initialData.subcity || ""; // Sub City
    woreda.value = props.initialData.woreda || ""; // Woreda

    email.value = props.initialData.email || "";
    status.value = props.initialData.status || "ACTIVE";

    const fullPhone = props.initialData.phone || "";
    const possibleCodes = ["+254", "+1", "+44", "+91"];
    const matchedCode = possibleCodes.find((code) =>
      fullPhone.startsWith(code)
    );

    if (matchedCode) {
      countryCode.value = matchedCode;
      phoneNumber.value = fullPhone.slice(matchedCode.length);
    } else {
      countryCode.value = "+254";
      phoneNumber.value = fullPhone;
    }

    if (props.initialData.photoUrl) {
      previewImage.value = props.initialData.photoUrl;
    } else if (props.initialData.photoBase64) {
      previewImage.value = props.initialData.photoBase64;
    }
  }
});

function handleFileUpload(event) {
  const file = event.target?.files?.[0];
  if (file) {
    employeePhoto.value = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImage.value = e.target?.result;
    };
    reader.readAsDataURL(file);
  }
}

function browseFiles() {
  const fileInput = document.getElementById("employee-photo-upload");
  if (fileInput) fileInput.click();
}

function normalizeEmptyToNull(value) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (value instanceof File) return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? null : value;
  }
  return value;
}

function normalizePayload(payload) {
  const normalized = {};
  for (const [key, value] of Object.entries(payload)) {
    normalized[key] = normalizeEmptyToNull(value);
  }
  return normalized;
}

function handleSubmit() {
  const formData = {
    firstName: firstName.value,
    payerUuid: institutionId.value || payerId.value,
    allowedUuid: allowedUuid.value, // 💡 Include selected group
    fatherName: fatherName.value,
    grandFatherName: grandFatherName.value,
    gender: gender.value,
    birthDate: dateOfBirth.value ? `${dateOfBirth.value}T00:00:00.000Z` : null,
    inactiveDate: inactiveDate.value ? `${inactiveDate.value}T00:00:00.000Z` : null,
    idNumber: idNumber.value,
      ...(phoneNumber.value && {
      phone: `${phoneNumber.value}`,
    }),
    state: state.value,
    woreda: woreda.value, // Woreda
    subcity: subcity.value, // Sub City
    city: city.value, // City
    email: email.value,
    status: status.value,
    country: "Ethiopia",
  };

  if (employeePhoto.value) {
    formData.employeePhoto = employeePhoto.value;
  } else if (previewImage.value && props.isEdit && props.initialData.photoBase64) {
    formData.photoBase64 = props.initialData.photoBase64;
  }

  props.onSubmit(normalizePayload(formData));
}

const genderOptions = [
  "Male",
  "Female",
  "Adult Male",
  "Adult Female",
  "Child Male",
  "Child Female",
  "BOTH",
];
const statusOptions = ["ACTIVE", "INACTIVE"];
</script>

<template>
  <Form
    id="employee-form"
    :inner="true"
    class="bg-white rounded-lg shadow-sm"
    @submit.prevent="handleSubmit"
  >
    <!-- Header -->

    <div class="p-6 space-y-6">
      <!-- Top section: Photo and Personal Info -->
      <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div class="col-span-1">
          <div
            class="bg-white p-5 border border-[#75778B33] rounded-lg flex flex-col items-center justify-center h-full"
          >
            <div
              class="w-56 h-52 bg-[#F6F7FA] rounded-lg flex items-center justify-center mb-4 overflow-hidden"
            >
              <img
                v-if="previewImage"
                :src="previewImage"
                alt="Employee photo"
                class="object-cover w-full h-full"
              />
              <svg
                v-else
                xmlns="http://www.w3.org/2000/svg"
                class="w-24 h-24 text-gray-300"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <button
              type="button"
              @click="browseFiles"
              class="flex justify-center items-center px-5 py-3 w-full text-white rounded bg-primary hover:bg-teal-800"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="mr-2 w-5 h-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z"
                  clip-rule="evenodd"
                />
              </svg>
              Upload Photo
            </button>
            <input
              id="employee-photo-upload"
              type="file"
              accept="image/*"
              class="hidden"
              @change="handleFileUpload"
            />
          </div>
        </div>

        <!-- Personal Information -->
        <div
          class="col-span-2 border border-[#75778B33] p-5 grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <!-- First Name -->
          <div>
            <label class="block mb-1 text-sm font-medium text-gray-700">
              First Name <span class="text-red-500">*</span>
            </label>
            <Input
              v-model="firstName"
              name="firstName"
              validation="required|alpha"
              :attributes="{
                placeholder: 'Enter first name',
                required: true
              }"
            />
          </div>

          <!-- Father's Name -->
          <div>
            <label class="block mb-1 text-sm font-medium text-gray-700">
              Father's Name <span class="text-red-500">*</span>
            </label>
            <Input
              v-model="fatherName"
              name="fatherName"
              validation="required|alpha"
              :attributes="{
                placeholder: 'Enter father\'s name',
                required: true
              }"
            />
          </div>

          <!-- Grandfather's Name -->
          <div>
            <Input
              v-model="grandFatherName"
              name="grandFatherName"
              label="Grandfather's Name"
              :attributes="{
                placeholder: 'Enter Grand father\'s name',
              }"
            />
          </div>

          <!-- Group -->
          <!-- <div>
          
            <FamilyDataProvider :id="institutionId" v-slot="{ group, pending, error }">
              <Select
                v-model="allowedUuid"
                name="allowedUuid"
                label=" Select Allowed Groups"
                :options="group || []"
                :pending="pending"
                :obj="true"
                :attributes="{
                  placeholder: 'Select group',
                  // required: true
                }"
              />
              <p v-if="error" class="mt-2 text-sm text-red-600">{{ error }}</p>
            </FamilyDataProvider>
          </div> -->


          <div>
            <label class="block mb-1 text-sm font-medium text-gray-700">
              Gender 
            </label>
            <Select
              v-model="gender"
              name="gender"
           
              :options="genderOptions"
              :attributes="{
                placeholder: 'Select Gender',
     
              }"
            />
          </div>

          <!-- Date of Birth -->
          <div>
            <label class="block mb-1 text-sm font-medium text-gray-700">
              Date of Birth
            </label>
            <Input
              v-model="dateOfBirth"
              name="dateOfBirth"
              type="date"
              :attributes="{
                placeholder: 'Select Date',
                type: 'date',
                max: new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]
              }"
            />
          </div>
        </div>
      </div>


      <!-- Middle section: Employee ID and Address -->
      <div
        class="grid grid-cols-1 border border-[#75778B33] md:grid-cols-2 gap-6 p-5"
      >
        <!-- Employee ID -->
        <div class="pb-1">
          <label class="block mb-2 text-sm font-medium text-gray-700">
            Insurance ID
          </label>
          <Input
            v-model="idNumber"
            name="idNumber"
          
            :attributes="{
              placeholder: 'Enter Insurance ID',
       
            }"
          />
        </div>

        <!-- Phone Number -->
        <div class="py-1">
          <label class="block mb-1 text-sm font-medium text-gray-700">
            Phone Number
          </label>
          <div class="flex gap-2 w-full">
            <Input  
              v-model="phoneNumber"
              name="phoneNumber"
              validation="phone"
              :attributes="{
                placeholder: 'Enter phone number',
                
              }"
            />
          </div>
        </div>

        <!-- Email -->
        <div class="py-1">
          <label class="block mb-1 text-sm font-medium text-gray-700">
            Email
          </label>
          <InputEmail
            v-model="email"
            name="email"
            validation="email"
            :attributes="{
              placeholder: 'Enter email'
            }"
          />
        </div>
      </div>

      <!-- Address Information -->
      <div class="border border-[#75778B33] p-5">
        <h3 class="text-md font-medium text-[#75778B] mb-4">Address Information</h3>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <!-- State/Region -->
          <div>
            <label class="block text-sm font-medium text-[#75778B] mb-1">
              State/Region 
            </label>
            <Select
              v-model="state"
              name="state"
              :options="ethiopianRegions"
              :attributes="{
                placeholder: 'Select State/Region',
              }"
            />
          </div>
          
          <!-- City -->
          <div>
            <label class="block text-sm font-medium text-[#75778B] mb-1">
              City 
            </label>
            <Select
              v-if="availableCities.length > 0"
              v-model="city"
              name="city"
              :options="availableCities"
              :attributes="{
                placeholder: 'Select City',
              }"
            />
            <Input
              v-else
              v-model="city"
              name="city"
              :attributes="{
                placeholder: 'Enter City',
              }"
            />
          </div>
          
          <!-- Sub City -->
          <div>
            <label class="block text-sm font-medium text-[#75778B] mb-1">
              Sub City 
            </label>
            <Select
              v-if="isAddisAbaba && availableSubCities.length > 0"
              v-model="subcity"
              name="subcity"
              :options="availableSubCities"
              :attributes="{
                placeholder: 'Select Sub City',
              }"
            />
            <Input
              v-else
              v-model="subcity"
              name="subcity"
              :attributes="{
                placeholder: 'Enter Sub City',
              }"
            />
          </div>
          
          <!-- Woreda -->
          <div>
            <label class="block text-sm font-medium text-[#75778B] mb-1">
              Woreda 
            </label>
            <Input
              v-model="woreda"
              name="woreda"
              :attributes="{
                placeholder: 'Enter Woreda',
              }"
            />
          </div>
        </div>
      </div>

      <!-- Bottom section: Insurance Status -->
    <div class="flex gap-6 mt-6">
  <!-- Status Selection -->
  <div class="border border-[#75778B33] rounded-lg w-[33%] p-5 bg-white shadow-sm">
    <label class="block mb-3 text-sm font-medium text-gray-700">
      Insurance Status
    </label>
    <div class="flex space-x-4">
      <!-- Active Option -->
      <label
        class="inline-flex items-center p-3 rounded-md transition-all cursor-pointer"
        :class="{ 
          'text-[#02676B] bg-[#DFF1F1] border-2 border-[#02676B]': status === 'ACTIVE',
          'border border-gray-200 hover:bg-gray-50': status !== 'ACTIVE'
        }"
      >
        <input
          type="radio"
          v-model="status"
          value="ACTIVE"
          class="form-radio h-5 w-5 text-[#02676B] focus:ring-[#DFF1F1]"
        />
        <span class="ml-2 font-medium">Active</span>
      </label>
      
      <!-- Inactive Option -->
      <label
        class="inline-flex items-center p-3 rounded-md transition-all cursor-pointer"
        :class="{ 
          'text-[#D92D20] bg-[#FEE4E2] border-2 border-[#D92D20]': status === 'INACTIVE',
          'border border-gray-200 hover:bg-gray-50': status !== 'INACTIVE'
        }"
      >
        <input
          type="radio"
          v-model="status"
          value="INACTIVE"
          class="form-radio h-5 w-5 text-[#D92D20] focus:ring-[#FEE4E2]"
          @change="hasInactiveDate = 'no'"
        />
        <span class="ml-2 font-medium">Inactive</span>
      </label>
    </div>
  </div>

  <!-- Active Options (only shown when status is ACTIVE) -->
  <div 
    v-if="status === 'ACTIVE'"
    class="border border-[#75778B33] rounded-lg w-[33%] p-5 bg-white shadow-sm transition-all"
  >
    <!-- Inactive Date Question -->
    <div class="mb-4">
      <label class="block mb-2 text-sm font-medium text-gray-700">
        Does this Employee have an inactive date?
      </label>
      <div class="flex space-x-4">
        <label 
          class="inline-flex items-center p-2 px-3 rounded-md cursor-pointer"
          :class="{
            'bg-[#DFF1F1] border border-[#02676B]': hasInactiveDate === 'yes',
            'border border-gray-200 hover:bg-gray-50': hasInactiveDate !== 'yes'
          }"
        >
          <input
            type="radio"
            v-model="hasInactiveDate"
            value="yes"
            class="form-radio h-4 w-4 text-[#02676B]"
          />
          <span class="ml-2">Yes</span>
        </label>
        <label 
          class="inline-flex items-center p-2 px-3 rounded-md cursor-pointer"
          :class="{
            'bg-gray-100 border border-gray-400': hasInactiveDate === 'no',
            'border border-gray-200 hover:bg-gray-50': hasInactiveDate !== 'no'
          }"
        >
          <input
            type="radio"
            v-model="hasInactiveDate"
            value="no"
            class="w-4 h-4 text-gray-600 form-radio"
          />
          <span class="ml-2">No</span>
        </label>
      </div>
    </div>

    <!-- Inactive Date Field (only shown when 'yes' is selected) -->
   
  </div> 
  <div v-if="hasInactiveDate === 'yes'"
    class="border border-[#75778B33] rounded-lg w-[33%] p-5 bg-white shadow-sm transition-all"
  >
      <label class="block mb-2 text-sm font-medium text-gray-700">
        Future Inactive Date
      </label>
      <Input
        v-model="inactiveDate"
        name="inactiveDate"
        type="date"
        :attributes="{
          class: 'w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#02676B]',
          min: new Date().toISOString().split('T')[0]
        }"
        @input="validateFutureDate(inactiveDate)"
      />
      <p v-if="dateError" class="mt-1 text-xs text-red-500">{{ dateError }}</p>
      <p v-else class="mt-1 text-xs text-gray-500">Must be a future date</p>
    </div>
</div>
    </div>
    

    <!-- Form Actions -->
    <div
      class="flex justify-end px-6 py-4 space-x-4 bg-white rounded-b-lg border-t border-gray-200"
    >
      <Button
        type="button"
        @click="props.onCancel"
        class="px-6 py-2 text-gray-700 bg-white rounded-md border border-gray-300 hover:bg-gray-50"
        :disabled="pending"
      >
        Cancel
      </Button>
      <!-- <Button
        type="submit"
        class="px-6 py-2 text-white bg-teal-700 rounded-md hover:bg-teal-800"
        :disabled="pending"
      >
        {{ isEdit ? 'Update Employee' : 'Add Employee' }}
      </Button> -->
      <ModalFormSubmitButton
        :pending="pending"
        :btn-text="isEdit ? 'Update Employee' : 'Add Employee'"
        class="bg-[#02676B] hover:bg-[#014F4F] text-white px-6 py-3 border-[#02676B] hover:border-[#014F4F]"
      />
    </div>
  </Form>
</template>

<style scoped lang="postcss">
/* Additional styling for the form */
:deep(.form-control) {
  @apply bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5;
}

:deep(.form-select) {
  @apply bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5;
}

:deep(.form-textarea) {
  @apply bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5;
}
</style>
