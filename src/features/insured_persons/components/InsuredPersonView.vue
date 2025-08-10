<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { Status } from '@/types/interface';
import { useRoute } from 'vue-router';
import { getInsuredPersonById, updateInsuredPerson } from '../api/insuredPersonsApi';
import Button from '@/components/Button.vue';
import Select from '@/components/new_form_elements/Select.vue';
import Input from '@/components/new_form_elements/Input.vue';
import { watch } from 'vue';
import { v4 as uuidv4 } from 'uuid'; // Make sure to install and import uuid

const route = useRoute();
const person = ref(null);
const loading = ref(true);
const error = ref(null);
const isEditing = ref(false);
const editedPerson = ref(null);

onMounted(async () => {
  const insuredPersonUuid = route.params.insuredPersonId as string;
  if (!insuredPersonUuid) {
    error.value = 'Invalid insured person ID';
    loading.value = false;
    return;
  }

  try {
    const response = await getInsuredPersonById(insuredPersonUuid);
    person.value = response.data;
    editedPerson.value = JSON.parse(JSON.stringify(person.value));
  } catch (err) {
    console.error('Failed to fetch insured person:', err);
    error.value = 'Failed to load insured person data';
  } finally {
    loading.value = false;
  }
});

function getStatusStyle(status) {
  const base = "inline-flex justify-center items-center min-w-[80px] px-3 py-1 rounded text-sm font-semibold";

  switch (status?.toUpperCase()) {
    case "APPROVED":
      return `${base} bg-green-100 text-green-800`;
      case "ACTIVE":
      return `${base} bg-green-100 text-green-800`;
      case "SUBMITTED":
      return `${base} bg-yellow-100 text-yellow-800`;
        // Light green for active
    case "INACTIVE":
      return `${base} bg-red-100 text-red-800`;    // Light gray for inactive
    case "PENDING":
      return `${base} bg-yellow-100 text-yellow-800`; // Light yellow for pending
    case "ACCEPTED":
      return `${base} bg-blue-100 text-blue-800`;     // Light blue for accepted
    case "REJECTED":
      return `${base} bg-red-100 text-red-800`;       // Light red for rejected
    case "RESUBMITTED":
      return `${base} bg-purple-100 text-purple-800`;
    case "SUSPENDED":
      return `${base} bg-yellow-100 text-yellow-800`; // Light yellow for suspended
    default:
      return `${base} bg-gray-100 text-gray-800`;    // Default light gray
  }
}

function formatName(person: any) {
  return `${person.insuredTitle || ''} ${person.firstName || ''} ${person.fatherName || ''} ${person.grandFatherName || ''}`.trim();
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString();
}

function toggleEdit() {
  isEditing.value = !isEditing.value;
  if (!isEditing.value) {
    editedPerson.value = JSON.parse(JSON.stringify(person.value));
  }
}

async function saveChanges() {
  try {
    loading.value = true;
    const response = await updateInsuredPerson(editedPerson.value.insuredPersonUuid, editedPerson.value);
    // Update the person ref with the new data
    person.value = { ...person.value, ...editedPerson.value };
    isEditing.value = false;
    // Show success message (you can implement this using a toast notification or other method)
    console.log('Insured person updated successfully');
  } catch (err) {
    console.error('Failed to update insured person:', err);
    // Show error message (you can implement this using a toast notification or other method)
    console.error('Failed to update insured person');
  } finally {
    loading.value = false;
  }
}

function addDependant() {
  if (!editedPerson.value.dependants) {
    editedPerson.value.dependants = [];
  }
  editedPerson.value.dependants.push({
    dependantUuid: uuidv4(),
    dependantFirstName: '',
    dependantFatherName: '',
    dependantGrandFatherName: '',
    relationship: '',
    dependantGender: '',
    dependantBirthDate: '',
    dependantStatus: 'ACTIVE'
  });
}

watch(person, (newValue) => {
  if (newValue) {
    editedPerson.value = JSON.parse(JSON.stringify(newValue));
  }
}, { deep: true });
</script>

<template>
  <div v-if="loading" class="text-center py-12 text-lg font-semibold text-gray-600 animate-pulse">
    Loading...
  </div>
  
  <div v-else-if="error" class="text-center py-8 text-red-600 text-lg font-semibold">
    {{ error }}
  </div>
  
  <div v-else-if="person" class="bg-white shadow-xl rounded-2xl overflow-hidden">
    <div class="px-6 py-5 bg-blue-50 border-b border-gray-200 flex justify-between items-center">
      <h2 class="text-2xl font-bold text-blue-900">Insured Person Details</h2>
      <Button v-if="!isEditing" @click="toggleEdit" type="primary">Edit</Button>
    </div>

    <div class="p-6 space-y-10">
      <!-- PERSONAL + CONTACT -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <!-- PERSONAL INFO -->
        <div>
          <h3 class="text-xl font-semibold text-gray-800 mb-4">Personal Information</h3>
          <div class="space-y-4">
            <template v-if="isEditing">
              <!-- Input fields in edit mode -->
              <Select v-model="editedPerson.insuredTitle" :options="['Mr', 'Mrs', 'Ms', 'Dr']" label="Title" name="insuredTitle"
                :attributes="{ placeholder: 'Select Title', class: 'w-full input-compact' }" />
              <Input v-model="editedPerson.firstName" label="First Name" name="firstName"
                :attributes="{ placeholder: 'Enter First Name', class: 'w-full input-compact' }" />
              <Input v-model="editedPerson.fatherName" label="Father's Name" name="fatherName"
                :attributes="{ placeholder: 'Enter Fathers Name', class: 'w-full input-compact' }" />
              <Input v-model="editedPerson.grandFatherName" label="Grandfather's Name" name="grandFatherName"
                :attributes="{ placeholder: 'Enter Grandfathers Name', class: 'w-full input-compact' }" />
              <Select v-model="editedPerson.gender" :options="['Male','Female']" label="Gender" name="gender"
                :attributes="{ placeholder: 'Select Gender', class: 'w-full input-compact' }" />
              <Input v-model="editedPerson.birthDate" type="date" label="Birth Date" name="birthDate"
                :attributes="{ class: 'w-full input-compact' }" />
            </template>
            <template v-else>
              <p class="text-sm text-gray-700">👤 <span class="font-medium">Name:</span> {{ formatName(person) }}</p>
              <p class="text-sm text-gray-700">🚻 <span class="font-medium">Gender:</span> {{ person.gender }}</p>
              <p class="text-sm text-gray-700">🎂 <span class="font-medium">Birth Date:</span> {{ formatDate(person.birthDate) }}</p>
            </template>
          </div>
        </div>

        <!-- CONTACT INFO -->
        <div>
          <h3 class="text-xl font-semibold text-gray-800 mb-4">Contact Information</h3>
          <div class="space-y-4">
            <template v-if="isEditing">
              <Input v-model="editedPerson.phone" label="Phone" name="phone"
                :attributes="{ placeholder: 'Enter Phone Number', class: 'w-full input-compact' }" />
              <Input v-model="editedPerson.email" label="Email" name="email"
                :attributes="{ placeholder: 'Enter Email Address', class: 'w-full input-compact' }" />
              <Input v-model="editedPerson.address1" label="Address 1" name="address1"
                :attributes="{ placeholder: 'Enter Address 1', class: 'w-full input-compact' }" />
              <Input v-model="editedPerson.address2" label="Address 2" name="address2"
                :attributes="{ placeholder: 'Enter Address 2', class: 'w-full input-compact' }" />
            </template>
            <template v-else>
              <p class="text-sm text-gray-700">📞 <span class="font-medium">Phone:</span> {{ person.phone }}</p>
              <p class="text-sm text-gray-700">📧 <span class="font-medium">Email:</span> {{ person.email }}</p>
              <p class="text-sm text-gray-700">🏠 <span class="font-medium">Address:</span> {{ person.address1 }}, {{ person.address2 }}</p>
            </template>
          </div>
        </div>
      </div>

      <!-- INSURANCE + STATUS -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 class="text-xl font-semibold text-gray-800 mb-4">Insurance Details</h3>
          <div class="space-y-2">
            <template v-if="isEditing">
              <Input v-model="editedPerson.insuranceId" label="Insurance ID" name="insuranceId"
                :attributes="{ placeholder: 'Enter Insurance ID', class: 'w-full input-compact' }" />
            </template>
            <template v-else>
              <p class="text-sm text-gray-700">🆔 <span class="font-medium">Insurance ID:</span> {{ person.insuranceId }}</p>
              <p class="text-sm text-gray-700">🔑 <span class="font-medium">Insured UUID:</span> {{ person.insuredPersonUuid }}</p>
            </template>
          </div>
        </div>
        <div>
          <h3 class="text-xl font-semibold text-gray-800 mb-4">Status</h3>
          <div>
            <template v-if="isEditing">
              <Select v-model="editedPerson.status" :options="['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING']" label="Status" name="status"
                :attributes="{ placeholder: 'Select Status', class: 'w-full input-compact' }" />
            </template>
            <template v-else>
              <span class="inline-block px-3 py-1 rounded-full text-sm font-semibold" :class="getStatusStyle(person.status)">
                {{ person.status }}
              </span>
            </template>
          </div>
        </div>
      </div>

      <!-- DEPENDANTS -->
      <div>
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-semibold text-gray-800">Dependants</h3>
          <Button v-if="isEditing" @click="addDependant" type="secondary" class="text-sm">Add Dependent</Button>
        </div>
        <div v-if="editedPerson.dependants && editedPerson.dependants.length > 0" class="mt-4 space-y-6">
          <div
            v-for="(dependant, index) in editedPerson.dependants"
            :key="dependant.dependantUuid"
            class="p-4 bg-gray-100 rounded-xl shadow-sm"
          >
            <template v-if="isEditing">
              <!-- Editable dependant fields -->
              <Input v-model="dependant.dependantFirstName" label="First Name"
                :name="`dependant-${index}-firstName`" :attributes="{ class: 'w-full input-compact' }" />
              <Input v-model="dependant.dependantFatherName" label="Father's Name"
                :name="`dependant-${index}-fatherName`" :attributes="{ class: 'w-full input-compact' }" />
              <Input v-model="dependant.dependantGrandFatherName" label="Grandfather's Name"
                :name="`dependant-${index}-grandFatherName`" :attributes="{ class: 'w-full input-compact' }" />
              <Input v-model="dependant.relationship" label="Relationship"
                :name="`dependant-${index}-relationship`" :attributes="{ class: 'w-full input-compact' }" />
              <Select v-model="dependant.dependantGender" :options="['Male','Female']" label="Gender"
                :name="`dependant-${index}-gender`" :attributes="{ class: 'w-full input-compact' }" />
              <Input v-model="dependant.dependantBirthDate" type="date" label="Birth Date"
                :name="`dependant-${index}-birthDate`" :attributes="{ class: 'w-full input-compact' }" />
              <Select v-model="dependant.dependantStatus" :options="['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING']"
                label="Status" :name="`dependant-${index}-status`" :attributes="{ class: 'w-full input-compact' }" />
            </template>
            <template v-else>
              <h4 class="font-semibold text-gray-900">
                {{ dependant.dependantFirstName }} {{ dependant.dependantFatherName }} {{ dependant.dependantGrandFatherName }}
              </h4>
              <p class="text-sm text-gray-700">Relationship: {{ dependant.relationship }}</p>
              <p class="text-sm text-gray-700">Gender: {{ dependant.dependantGender }}</p>
              <p class="text-sm text-gray-700">Birth Date: {{ formatDate(dependant.dependantBirthDate) }}</p>
              <p class="text-sm text-gray-700">Status: {{ dependant.dependantStatus }}</p>
            </template>
          </div>
        </div>
        <p v-else class="mt-2 text-sm text-gray-600">No dependants found.</p>
      </div>
       <div v-if="isEditing" class="p-4 m-2 px-2 gap-4 flex justify-end ">
      <Button class="px-2" @click="saveChanges" type="primary">Save</Button>
      <Button @click="toggleEdit" type="secondary">Cancel</Button>
    </div>
    </div>
  </div>
</template>


<style scoped>
.input-compact {
  padding: 0.5rem;
  font-size: 0.875rem;
}
</style>