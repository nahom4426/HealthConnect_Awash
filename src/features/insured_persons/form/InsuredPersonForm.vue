<script setup lang="ts">
import { ref, defineProps, defineEmits, defineExpose } from "vue";
import { Gender } from "@/utils/utils";
import { Status } from "@/types/interface";
import Form from "@/components/new_form_builder/Form.vue";
import { Input, Select } from "@/components/new_form_elements";
// import DatePicker from '@/components/new_form_elements/DatePicker.vue';
import type { InsuredPerson } from "@/types/interface";

const props = defineProps({
  insuredPerson: {
    type: Object as () => InsuredPerson,
    default: () => ({}),
  },
  institutionId: {
    type: String,
    required: true,
  },
  innerValidate: {
    type: Boolean,
    default: true,
  },

  pending: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["submit", "cancel"]);

// Form data
const title = ref(props.insuredPerson?.title || "");
const firstName = ref(props.insuredPerson?.firstName || "");
const fatherName = ref(props.insuredPerson?.fatherName || "");
const grandFatherName = ref(props.insuredPerson?.grandFatherName || "");
const email = ref(props.insuredPerson?.email || "");
const phone = ref(props.insuredPerson?.phone || "");
const birthDate = ref(props.insuredPerson?.birthDate || "");
const gender = ref(props.insuredPerson?.gender || "");
const branchOffice = ref(props.insuredPerson?.branchOffice || "");
const position = ref(props.insuredPerson?.position || "");
const idNumber = ref(props.insuredPerson?.idNumber || "");
const premium = ref(props.insuredPerson?.premium || 0);
const address1 = ref(props.insuredPerson?.address1 || "");
const address2 = ref(props.insuredPerson?.address2 || "");
const address3 = ref(props.insuredPerson?.address3 || "");
const state = ref(props.insuredPerson?.state || "");
const country = ref(props.insuredPerson?.country || "Ethiopia");
const status = ref(props.insuredPerson?.status || Status.ACTIVE);

// Handle form submission
function handleSubmit() {
  // Validate required fields before submission
  const requiredFields = [
    { name: "Title", value: title.value },
    { name: "Institution", value: props.institutionId },
    { name: "First Name", value: firstName.value },
    { name: "Father Name", value: fatherName.value },
    { name: "Grand Father Name", value: grandFatherName.value },
    { name: "Email", value: email.value },
    { name: "Phone", value: phone.value },
    { name: "Birth Date", value: birthDate.value },
    { name: "Gender", value: gender.value },
    { name: "Branch Office", value: branchOffice.value },
    { name: "Position", value: position.value },
    { name: "ID Number", value: idNumber.value },
    { name: "Address 1", value: address1.value },
    { name: "Address 2", value: address2.value },
    { name: "Address 3", value: address3.value },
    { name: "State", value: state.value },
  ];

  const missingFields = requiredFields
    .filter((field) => !field.value)
    .map((field) => field.name);

  if (missingFields.length > 0) {
    console.error("Missing required fields:", missingFields);
    alert(`Please fill in all required fields: ${missingFields.join(", ")}`);
    return;
  }

  // Create payload
  const payload = {
    email: email.value,
    payerUuid: props.institutionId,
    premium: Number(premium.value) || 0,
    title: title.value,
    firstName: firstName.value,
    fatherName: fatherName.value,
    grandFatherName: grandFatherName.value,
    birthDate: birthDate.value,
    phone: phone.value,
    branchOffice: branchOffice.value,
    position: position.value,
    idNumber: idNumber.value,
    address1: address1.value,
    address2: address2.value,
    address3: address3.value,
    state: state.value,
    country: country.value,
    status: status.value,
    gender: gender.value,
  };

  // If editing, include the UUID
  if (props.insuredPerson?.insuredPersonUuid) {
    payload.insuredPersonUuid = props.insuredPerson.insuredPersonUuid;
  }

  console.log("Submitting insured person data:", payload);
  emit("submit", payload);
}

// Expose the handleSubmit method to parent components
defineExpose({
  handleSubmit,
});
</script>

<template>
  <Form
    :inner="innerValidate"
    id="insured-person-form"
    class="grid grid-cols-3 gap-4"
  >
    <!-- Personal Information -->
    <div class="col-span-3 mb-2">
      <h2 class="text-lg font-semibold">Personal Information</h2>
      <hr class="my-2" />
    </div>

    <Select
      label="Title"
      name="title"
      :options="['Mr.', 'Mrs.', 'Ms.']"
      v-model="title"
      validation="required"
      :attributes="{
        placeholder: 'Select Title',
      }"
    />

    <Input
      label="First Name"
      name="firstName"
      v-model="firstName"
      validation="required|max-25"
      :attributes="{
        placeholder: 'Enter First Name',
      }"
    />

    <Input
      label="Father Name"
      name="fatherName"
      v-model="fatherName"
      validation="required|max-25"
      :attributes="{
        placeholder: 'Enter Father Name',
      }"
    />

    <Input
      label="Grand Father Name"
      name="grandFatherName"
      v-model="grandFatherName"
      validation="required|max-25"
      :attributes="{
        placeholder: 'Enter Grand Father Name',
      }"
    />

    <!-- Use a standard HTML date input as fallback -->
    <!-- <DatePicker
      label="Birth Date"
      name="birthDate"
      v-model="birthDate"
      validation="required"
      :attributes="{
        placeholder: 'Select Birth Date',
        max: new Date().toISOString().split('T')[0],
        class: 'form-control '
      }"
    /> -->
    <Input
      name="birthDate"
      label="Date of Birth"
      v-model="birthDate"
      validation="required"
      :attributes="{
        type: 'date',
        placeholder: 'Enter Grand Father\'s Name',
      }"
    />
    <Select
      label="Gender"
      name="gender"
      :options="['MALE', 'FEMALE', 'OTHER']"
      v-model="gender"
      validation="required"
      :attributes="{
        placeholder: 'Select Gender',
      }"
    />

    <!-- Contact Information -->
    <div class="col-span-3 mt-4 mb-2">
      <h2 class="text-lg font-semibold">Contact Information</h2>
      <hr class="my-2" />
    </div>

    <Input
      label="Email"
      name="email"
      v-model="email"
      validation="required|email"
      :attributes="{
        placeholder: 'Enter Email',
        type: 'email',
      }"
    />

    <Input
      label="Phone"
      name="phone"
      v-model="phone"
      validation="required"
      :attributes="{
        placeholder: 'Enter Phone Number',
        type: 'tel',
      }"
    />

    <Input
      label="ID Number"
      name="idNumber"
      v-model="idNumber"
      validation="required"
      :attributes="{
        placeholder: 'Enter ID Number',
      }"
    />

    <!-- Employment Information -->
    <div class="col-span-3 mt-4 mb-2">
      <h2 class="text-lg font-semibold">Employment Information</h2>
      <hr class="my-2" />
    </div>

    <Input
      label="Branch Office"
      name="branchOffice"
      v-model="branchOffice"
      validation="required"
      :attributes="{
        placeholder: 'Enter Branch Office',
      }"
    />

    <Input
      label="Position"
      name="position"
      v-model="position"
      validation="required"
      :attributes="{
        placeholder: 'Enter Position',
      }"
    />

    <Input
      label="Premium"
      name="premium"
      v-model="premium"
      validation="required|numeric"
      :attributes="{
        placeholder: 'Enter Premium Amount',
        type: 'number',
      }"
    />

    <!-- Address Information -->
    <div class="col-span-3 mt-4 mb-2">
      <h2 class="text-lg font-semibold">Address Information</h2>
      <hr class="my-2" />
    </div>

    <Input
      label="Country"
      name="country"
      v-model="country"
      validation="required"
      :attributes="{
        placeholder: 'Enter Country',
      }"
    />

    <Input
      label="State/Region"
      name="state"
      v-model="state"
      validation="required"
      :attributes="{
        placeholder: 'Enter State/Region',
      }"
    />

    <Input
      label="City"
      name="address3"
      v-model="address3"
      validation="required"
      :attributes="{
        placeholder: 'Enter City',
      }"
    />

    <Input
      label="Sub City"
      name="address2"
      v-model="address2"
      validation="required"
      :attributes="{
        placeholder: 'Enter Sub City',
      }"
    />

    <Input
      label="address1"
      name="address1"
      v-model="address1"
      validation="required"
      :attributes="{
        placeholder: 'Enter address1',
      }"
    />

    <Select
      label="Status"
      name="status"
      :options="[Status.ACTIVE, Status.PENDING, Status.SUSPENDED]"
      v-model="status"
      validation="required"
      :attributes="{
        placeholder: 'Select Status',
      }"
    />
  </Form>
</template>
