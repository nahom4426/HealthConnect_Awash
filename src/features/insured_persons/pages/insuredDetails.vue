<template>
  <div class="p-6 space-y-6 bg-white rounded-lg shadow-md">
    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <div
        class="w-12 h-12 rounded-full border-t-2 border-b-2 animate-spin border-primary"
      ></div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="py-8 text-center">
      <p class="text-lg text-red-500">{{ error }}</p>
      <button
        @click="fetchInsuredData"
        class="px-4 py-2 mt-4 text-white rounded-md bg-primary"
      >
        Retry
      </button>
    </div>

    <!-- Content when data is loaded -->
    <div v-else>
      <!-- Insured Info -->
      <div class="flex flex-col gap-6 items-start md:flex-row">
        <!-- Image -->
        <div
          class="space-y-3 py-4 m-2 w-[14rem] h-[12rem] flex items-center justify-center"
        >
          <img
            :src="
              insuredData.profile ||
              insuredData.profilePictureBase64 ||
              insuredData.photoUrl ||
             imageSrc
            "
            alt="Profile"
            class="object-cover w-full h-full rounded-lg border border-gray-200"
            @error="(e) => (e.target.src =imageSrc)"
          />
        </div>

        <!-- Left Info -->
        <div
          class="space-y-3 w-full md:w-[38rem] h-[12rem] m-2 py-4 pl-8 bg-[#F6F7FA]"
        >
          <div class="flex gap-4 items-center py-2">
            <h3 class="text-xs font-normal text-[#75778B] w-28">Full Name</h3>
            <p class="text-sm font-medium text-[#373946]">
              {{ insuredData.firstName }} {{ insuredData.fatherName }}
              {{ insuredData.grandFatherName }}
            </p>
          </div>
          <div class="flex gap-4 items-center py-2">
            <h3 class="text-xs font-normal text-[#75778B] w-28">Role</h3>
            <p class="text-sm font-medium text-[#373946]">
              {{ insuredData.position || "N/A" }}
            </p>
          </div>
          <div class="flex gap-4 items-center py-2">
            <h3 class="text-xs font-normal text-[#75778B] w-28">Phone</h3>
            <p class="text-sm font-medium text-[#373946]">
              {{ insuredData.phone || "N/A" }}
            </p>
          </div>
        </div>

        <!-- Right Info -->
        <div
          class="space-y-3 w-full md:w-[38rem] h-[12rem] m-2 py-4 pl-8 bg-[#F6F7FA]"
        >
          <div class="flex gap-4 items-center py-2">
            <h3 class="text-xs font-normal text-[#75778B] w-28">Employee ID</h3>
            <p class="text-sm font-medium text-[#373946]">
              {{ insuredData.idNumber || insuredData.employeeId || "N/A" }}
            </p>
          </div>
          <div class="flex gap-4 items-center py-2">
            <h3 class="text-xs font-normal text-[#75778B] w-28">Address</h3>
            <p class="text-sm font-medium text-[#373946]">
              {{ insuredData.address || "N/A" }}, {{ insuredData.state || "" }},
              {{ insuredData.country || "" }}
            </p>
          </div>
          <div class="flex gap-4 items-center py-2">
            <h3 class="text-xs font-normal text-[#75778B] w-28">Gender</h3>
            <p class="text-sm font-medium text-[#373946]">
              {{ insuredData.gender || "N/A" }}
            </p>
          </div>
        </div>
      </div>

      <!-- Dependants Section -->
       <div v-if="insuredData.dependantCoverage === false" class="mt-6">
  <div class="flex gap-4 items-start p-4 bg-yellow-50 rounded-lg border border-yellow-300">
    <div class="text-yellow-500">
      <svg xmlns="http://www.w3.org/2000/svg" class="mt-1 w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
      </svg>
    </div>
    <div class="text-sm text-yellow-800">
      <h3 class="text-base font-semibold">Dependants Not Allowed</h3>
      <p>This company does not allow coverage for dependants under this contract or policy.</p>
    </div>
  </div>
</div>

      <div v-else class="mt-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold">Dependants</h3>
          <button @click="showNewDependentForm = !showNewDependentForm">
            <span
              v-if="showNewDependentForm"
              class="px-6 py-3 text-gray-700 bg-white rounded-md border border-gray-300"
              >Cancel</span
            >
            <span
              v-else
              class="flex items-center px-6 py-3 text-white rounded-md bg-primary"
              >Add Dependant</span
            >
          </button>
        </div>

        <!-- Dependants Table - ORIGINAL FORMAT PRESERVED -->
        <div class="">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th
                  v-for="header in headers"
                  :key="header"
                  class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                >
                  {{ header }}
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <!-- Existing dependents -->
              <tr
                v-for="(dependent, index) in dependentsList"
                :key="dependent.dependantUuid"
              >
                <template v-if="editingDependentIndex !== index">
                  <td class="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                    {{ index + 1 }}
                  </td>

                  <!-- Full Name with Photo -->
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <img
                        :src="
                          dependent.profile ||
                          dependent.profilePictureBase64 ||
                          dependent.photoUrl ||
                          'https://via.placeholder.com/80x80?text=No+Photo'
                        "
                        class="object-cover w-10 h-10 rounded-full"
                        alt="Profile"
                        @error="(e) => (e.target.src = 'https://via.placeholder.com/80x80?text=No+Photo')"
                      />
                      <!-- <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">{{ dependent.fullName }}</div>
                      </div> -->
                    </div>
                  </td>
                  <td
                    class="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap"
                  >
                    {{
                      dependent.fullName ||
                      `${dependent.firstName} ${dependent.fatherName} ${dependent.grandFatherName}`
                    }}
                  </td>
                  <!-- Relationship -->
                  <td class="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                    {{ dependent.relationship }}
                  </td>

                  <!-- Age -->
                  <td class="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                    {{ calculateAge(dependent.birthDate) }}
                  </td>

                  <!-- Gender -->
                  <td class="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                    {{ capitalizeFirstLetter(dependent.gender) }}
                  </td>

                  <!-- Dependant Group -->
                  <td class="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                    {{ dependent.dependantGroup || "N/A" }}
                  </td>

                  <!-- Status -->
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span
                      :class="
                        dependent.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      "
                      class="px-2 py-1 text-xs font-medium rounded-full"
                    >
                      {{
                        dependent.status === "ACTIVE" ? "Active" : "Inactive"
                      }}
                    </span>
                  </td>

                  <!-- Actions -->
                  <td
                    class="px-6 py-4 text-sm font-medium text-left whitespace-nowrap"
                  >
                    <div class="relative">
                      <button
                        @click="
                          toggleDropdown(
                            $event,
                            dependent.dependantUuid || index
                          )
                        "
                        class="ml-4 text-indigo-600 hover:text-indigo-900"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          class="w-5 h-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"
                          />
                        </svg>
                      </button>

                      <div
                        :id="`dropdown-${dependent.dependantUuid || index}`"
                        class="hidden absolute right-0 z-10 w-44 bg-white rounded-md ring-1 ring-black ring-opacity-5 shadow-lg dropdown-menu focus:outline-none"
                      >
                        <div class="py-1">
                          <button
                            @click.stop="startEdit(dependent)"
                            class="block py-2 w-full text-sm text-gray-700 text-start hover:bg-gray-100"
                          >
                            <div
                              class="flex gap-4 justify-start items-start pl-4"
                            >
                              <i v-html="icons.edits" />
                              Edit
                            </div>
                          </button>

                          <button
                            v-if="
                              dependent.status === 'INACTIVE' ||
                              dependent.status === 'Inactive'
                            "
                            @click.stop="
                              handleActivateWithClose(
                                dependent.dependantUuid || row.id
                              )
                            "
                            class="block w-full text-center py-2 text-sm text-[#28A745] hover:bg-gray-100"
                          >
                            <div
                              class="flex gap-4 justify-start items-center pl-4"
                            >
                              <i v-html="icons.activate" />
                              Activate
                            </div>
                          </button>

                          <button
                            v-if="
                              dependent.status === 'ACTIVE' ||
                              dependent.status === 'Active'
                            "
                            @click.stop="
                              handleDeactivateWithClose(
                                dependent.dependantUuid || row.id
                              )
                            "
                            class="block w-full text-center py-2 text-sm text-[#DB2E48] hover:bg-gray-100"
                          >
                            <div
                              class="flex gap-4 justify-start items-center pl-4"
                            >
                              <i v-html="icons.deactivate" />
                              Deactivate
                            </div>
                          </button>

                          <!-- Other dropdown options -->
                        </div>
                      </div>
                    </div>
                  </td>
                </template>

                <!-- When editing, show the edit form -->
                <template v-else>
                  <!-- Keep all cells in the same row structure -->
                  <td class="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                    {{ index + 1 }}
                  </td>

                  <!-- Photo Upload -->
                  <td class="px-3 py-4 whitespace-nowrap">
                    <div class="flex relative flex-col items-start">
                      <label
                        for="edit-photo-upload"
                        class="cursor-pointer flex items-center justify-center w-16 h-16 bg-[#DFF1F1] rounded hover:bg-blue-100 overflow-hidden relative"
                      >
                        <img
                          :src="
                            photoPreview ||
                            editingDependent.profilePictureBase64 ||
                            'https://via.placeholder.com/80x80?text=No+Photo'
                          "
                          class="object-cover w-full h-full"
                          @error="(e) => (e.target.src = 'https://via.placeholder.com/80x80?text=No+Photo')"
                        />
                      </label>
                      <input
                        id="edit-photo-upload"
                        type="file"
                        @change="handlePhotoUpload"
                        class="hidden"
                      />
                    </div>
                  </td>

                  <!-- Full Name -->
                  <td class="pt-4 mr-10">
                    <Input
                      v-model="editingDependent.fullName"
                      class="p-1 w-full text-sm rounded border"
                      validation="required"
                      :attributes="{
                        placeholder: 'First Middle Last',
                      }"
                      required
                    />
                    <p class="mt-1 text-xs text-gray-500">
                      Enter full name separated by spaces
                    </p>
                  </td>

                  <!-- Relationship -->
                  <td class="px-6 py-2 whitespace-nowrap">
                    <Select
                      v-model="editingDependent.relationship"
                      name="relationship"
                      validation="required"
                      :options="['Spouse', 'Child', 'Parent', 'Employee']"
                      :attributes="{
                        type: 'text',
                        placeholder: 'Select relationship',
                        required: true,
                      }"
                    />
                  </td>

                  <!-- Birth Date -->
                  <td class="px-6 py-4 whitespace-nowrap">
                    <Input
                      v-model="editingDependent.birthDate"
                      name="birthDate"
                      validation="required"
                      :attributes="{
                        placeholder: 'Birth date',
                        type: 'date',
                        required: true,
                      }"
                    />
                  </td>

                  <!-- Gender -->
                  <td class="px-6 py-4 whitespace-nowrap">
                    <Select
                      v-model="editingDependent.gender"
                      name="gender"
                      validation="required"
                      :options="['Male', 'Female']"
                      :attributes="{
                        type: 'text',
                        placeholder: 'Select gender',
                        required: true,
                      }"
                    />
                  </td>

                  <!-- Dependant Group -->
                  <td class="px-6 py-4 whitespace-nowrap">
                    <Select
                      v-model="editingDependent.dependantGroup"
                      name="group"
                      validation="required"
                      :options="['C-Family', 'Primary', 'Secondary']"
                      :attributes="{
                        placeholder: 'Select group',
                        required: true,
                      }"
                    />
                  </td>

                  <!-- Status -->
                  <td class="px-6 py-4 whitespace-nowrap">
                    <Select
                      v-model="editingDependent.status"
                      name="status"
                      validation="required"
                      :options="['ACTIVE', 'INACTIVE']"
                      :attributes="{
                        placeholder: 'Select status',
                        required: true,
                      }"
                    />
                  </td>

                  <td class="px-6 py-4 text-sm font-medium whitespace-nowrap">
    <div class="flex space-x-2">
      <!-- SAVE BUTTON -->
      <button
        @click="updateDependent({ values: editingDependent })"
        class="text-green-600 hover:text-green-800"
        :disabled="savingEdit"
      >
        <span
          v-if="savingEdit"
          class="flex items-center px-6 py-3 text-white rounded-md bg-primary"
        >
          ⏳
        </span>
        <span
          v-else
          class="flex items-center px-6 py-3 text-white rounded-md bg-primary"
        >
          ✓ Save
        </span>
      </button>

      <!-- CANCEL BUTTON -->
      <button
        @click="cancelEdit"
        class="p-2 text-green-600 border hover:bg-green-700"
      >
        ✕ Cancel
      </button>
    </div>
  </td>
                </template>
              </tr>

              <!-- New dependent form row -->
              <tr v-if="showNewDependentForm" class="">
                <td class="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                  {{ dependentsList.length + 1 }}
                </td>
                <td class="px-3 py-4 whitespace-nowrap">
                  <div class="flex relative flex-col items-start">
                    <!-- Upload Box -->
                    <label
                      for="dependent-photo-upload"
                      class="cursor-pointer flex items-center justify-center w-16 h-16 bg-[#DFF1F1] rounded hover:bg-blue-100 overflow-hidden relative"
                    >
                      <template v-if="newDependent.photo">
                        <img
                          :src="newDependent.photo"
                          class="object-cover w-full h-full"
                          @error="(e) => (e.target.src = 'https://via.placeholder.com/80x80?text=No+Photo')"
                        />
                      </template>
                      <template v-else>
                        <span class="text-3xl text-[#02676B] font-bold">+</span>
                      </template>
                    </label>

                    <!-- Close (X) icon in top-right corner -->
                    <button
                      v-if="newDependent.photo"
                      @click.stop="newDependent.photo = null"
                      class="absolute top-0 right-0 p-0.5 text-red-600 bg-white rounded-full shadow-md hover:text-red-800"
                      title="Remove image"
                    >
                      <!-- X SVG -->
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>

                    <!-- Hidden File Input -->
                    <input
                      id="dependent-photo-upload"
                      type="file"
                      @change="handlePhotoUpload"
                      class="hidden"
                    />
                  </div>
                </td>


                <td class="pt-4 mr-10">
                  <Input
                    v-model="newDependent.fullName"
                    class="p-1 w-full text-sm rounded border"
                    validation="required"
                    :attributes="{
                      placeholder: 'First Middle Last',
                    }"
                    required
                  />
                  <p class="mt-1 text-xs text-gray-500">
                    Enter full name separated by spaces
                  </p>
                </td>
                <td class="px-6 py-2 whitespace-nowrap">
                  <Select
                    v-model="newDependent.relationship"
                    name="relationship"
                    validation="required"
                    :options="['Spouse', 'Child', 'Parent', 'Employee']"
                    :attributes="{
                      type: 'text',
                      placeholder: 'Select relationship',
                      required: true,
                    }"
                  />
                </td>

                <td class="px-6 py-2 whitespace-nowrap">
                  <Input
                    v-model.number="newDependent.age"
                    name="age"
                    validation="required|num|min:0"
                    :attributes="{
                      placeholder: 'Enter age',
                      type: 'number',
                      min: 0,
                    }"
                  />
                </td>
                <td class="px-6 py-2 whitespace-nowrap">
                  <div class="space-y-2">
                    <Select
                      v-model="newDependent.gender"
                      name="gender"
                      validation="required"
                      :options="['Male', 'Female']"
                      :attributes="{
                        type: 'text',
                        placeholder: 'Select gender',
                        required: true,
                      }"
                    />
                  </div>
                </td>
                <td class="px-6 py-2 whitespace-nowrap">
                  <div class="space-y-2">
                    <Input
                      v-model="newDependent.group"
                      name="group"
                      validation="required|max-25"
                      :attributes="{
                        placeholder: 'Group',
                      }"
                    />
                  </div>
                </td>

                <td class="px-6 py-2 whitespace-nowrap">
                  <Select
                    v-model="newDependent.status"
                    name="status"
                    validation="required"
                    :options="['ACTIVE', 'INACTIVE']"
                    :attributes="{
                      placeholder: 'Select status',
                      required: true,
                    }"
                  />
                </td>
                <td class="px-6 py-2 text-sm font-medium whitespace-nowrap">
                  <div class="flex space-x-2">
                    <button
                      @click="saveDependent"
                      class="text-green-600 hover:text-green-800"
                      :disabled="savingDependent"
                    >
                      <span
                        v-if="savingDependent"
                        class="flex items-center px-6 py-3 text-white rounded-md bg-primary"
                        >⏳</span
                      >
                      <span
                        v-else
                        class="flex items-center px-6 py-3 text-white rounded-md bg-primary"
                        >✓ save
                      </span>
                    </button>
                    <button
                      @click="cancelAddDependent"
                      class="p-2 text-green-600 border hover:bg-green-700"
                    >
                      ✕ cancel
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted, computed, onUnmounted } from "vue";
import icons from "@/utils/icons";
import { useApiRequest } from "@/composables/useApiRequest";
import { getInsuredById } from "../api/insuredPersonsApi";
import { useRoute, useRouter } from "vue-router";
import {
  changeInsuredStatus,
  createdependant,
  updatedependant,
  updatedependantstatus,
} from "../api/dependantsApi";
import { toasted } from "@/utils/utils";
import Input from "@/components/new_form_elements/Input.vue";
import Select from "@/components/new_form_elements/Select.vue";
import { addToast } from "@/toast";
import { insuredMembers } from "../store/insuredPersonsStore";
import DependantsTable from "../components/DependantsTable.vue";
import { useDependentStore } from "../store/dependantPersonsStore";
import imageSrc from '@/assets/img/profile.png';
const dependentStore = useDependentStore();
const route = useRoute();
const router = useRouter();
const insuredPersonUuid = route.params.insuredPersonUuid;
const apiRequest = useApiRequest();
const activeTab = ref("dependents");
const showNewDependentForm = ref(false);
const savingDependent = ref(false);
const loading = ref(true);
const error = ref("");
const insuredData = ref({});
const editingDependentIndex = ref(-1);
const editingDependent = ref(null);
const photoPreview = ref(null);
const updateReq = useApiRequest()
const headers = [
  "#",
  "Photo",
  "Full Name",
  "Relationship",
  "Age",
  "Gender",
  "Dependant Group",
  "Status",
  "Actions",
];

const dependentsList = computed(() => {
  return (
    insuredData.value?.dependants ||
    insuredData.value?.dependantResponses ||
    []
  );
});

const newDependent = ref({
  id: insuredPersonUuid,
  photo: "",
  fullName: "",
  relationship: "Spouse",
  age: null,
  group: "C-Family",
  gender: "Male",
  status: "ACTIVE",
});

// Fetch insured person data
async function fetchInsuredData() {
  loading.value = true;
  error.value = "";

  try {
    const response = await getInsuredById(insuredPersonUuid);
    console.log("API Response:", response);

    if (response) {
      insuredData.value = response;

      // Process dependants to have a consistent format
      if (
        insuredData.value.dependants &&
        Array.isArray(insuredData.value.dependants)
      ) {
        insuredData.value.dependants = insuredData.value.dependants.map(
          (dep) => {
            let age = null;
            if (dep.birthDate) {
              const birthDate = new Date(dep.birthDate);
              const today = new Date();
              age = today.getFullYear() - birthDate.getFullYear();
              const m = today.getMonth() - birthDate.getMonth();
              if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
              }
            }

            const fullName = [
              dep.firstName || "",
              dep.fatherName || "",
              dep.grandFatherName || "",
            ]
              .filter(Boolean)
              .join(" ");

            return {
              ...dep,
              fullName,
              age,
              dependantUuid: dep.dependantUuid || dep.id,
              gender: dep.gender || dep.gender || "Male",
              status: dep.dependantStatus || dep.status || "ACTIVE",
              relationship: dep.relationship || "Other",
            };
          }
        );
      }
      else if (
        insuredData.value.dependantResponses &&
        Array.isArray(insuredData.value.dependantResponses)
      ) {
        insuredData.value.dependants = insuredData.value.dependantResponses.map(
          (dep) => {
            let age = null;
            if (dep.birthDate) {
              const birthDate = new Date(dep.birthDate);
              const today = new Date();
              age = today.getFullYear() - birthDate.getFullYear();
              const m = today.getMonth() - birthDate.getMonth();
              if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
              }
            }

            const fullName = [
              dep.firstName || "",
              dep.fatherName || "",
              dep.grandFatherName || dep.grandfatherName || "",
            ]
              .filter(Boolean)
              .join(" ");

            return {
              ...dep,
              fullName,
              age,
              dependantUuid: dep.dependantUuid || dep.id,
              gender: dep.gender || "Male",
              status: dep.status || "ACTIVE",
              relationship: dep.relationship || "Other",
              profile: dep.profile || null,
              profilePictureBase64: dep.profilePictureBase64 || null,
            };
          }
        );
      }
    } else {
      error.value = "Failed to load insured person data";
    }
  } catch (err) {
    console.error("Failed to fetch insured person:", err);
    error.value = "Failed to load insured person data";
  } finally {
    loading.value = false;
  }
}

// Calculate age from birthdate
function calculateAge(birthDate) {
  if (!birthDate) return "N/A";

  const today = new Date();
  const birthDateObj = new Date(birthDate);
  let age = today.getFullYear() - birthDateObj.getFullYear();
  const monthDiff = today.getMonth() - birthDateObj.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDateObj.getDate())
  ) {
    age--;
  }

  return age;
}

function addNewDependent() {
  showNewDependentForm.value = true;
  newDependent.value = {
    id: "",
    photo: "",
    fullName: "",
    relationship: "Spouse",
    age: null,
    group: "C-Family",
    status: "ACTIVE",
  };
}

function cancelAddDependent() {
  showNewDependentForm.value = false;
}

function saveDependent() {
  if (!newDependent.value.fullName) {
    toasted(false, "", "Please fill in required fields");
    return;
  }

  savingDependent.value = true;

  const nameParts = newDependent.value.fullName.split(" ");
  const birthDate = new Date();
  if (newDependent.value.age) {
    birthDate.setFullYear(birthDate.getFullYear() - newDependent.value.age);
  }

  const formattedBirthDate = `${birthDate.toISOString().split("T")[0]}T00:00:00.000Z`;

  const dependantData = {
    insuredPersonUuid: insuredPersonUuid,
    title: newDependent.value.title || "Mr",
    firstName: nameParts[0] || "",
    fatherName: nameParts[1] || "",
    grandFatherName: nameParts[2] || "",
    gender: newDependent.value.gender?.toLowerCase() || "male",
    birthDate: formattedBirthDate,
    relationship: newDependent.value.relationship,
    status: newDependent.value.status,
  };

  const formData = new FormData();
  formData.append("dependantRequest ", JSON.stringify(dependantData));

  const fileInput = document.querySelector('input[type="file"]');
  if (fileInput && fileInput.files && fileInput.files.length > 0) {
    const photoFile = fileInput.files[0];
    console.log("Using actual file from input:", photoFile);
    formData.append("profile", photoFile);
  }

  apiRequest.send(() => createdependant(formData), handleDependantResponse);
}

function handleDependantResponse(response) {
  savingDependent.value = false;
  console.log("API Response:", response);

  if (response.success) {
    toasted(true, "Dependant added successfully", "");
    fetchInsuredData();
    showNewDependentForm.value = false;
  } else {
    toasted(false, "", response.error || "Failed to add dependant");
  }
}

function handlePhotoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  if (editingDependentIndex.value >= 0) {
    reader.onload = (e) => {
      photoPreview.value = e.target.result;
      editingDependent.value.profilePictureBase64 = e.target.result;
    };
  } else {
    reader.onload = (e) => {
      newDependent.value.photo = e.target.result;
    };
  }

  reader.readAsDataURL(file);
  console.log("File selected:", file);
}

onMounted(() => {
  fetchInsuredData();
});

function toggleDropdown(event, rowId) {
  event.stopPropagation();
  closeAllDropdowns();
  const dropdown = document.getElementById(`dropdown-${rowId}`);
  if (dropdown) {
    dropdown.classList.toggle("hidden");
  }
}

function closeAllDropdowns() {
  document.querySelectorAll(".dropdown-menu").forEach((el) => {
    el.classList.add("hidden");
  });
}

onMounted(() => {
  window.addEventListener("click", closeAllDropdowns);
});

onUnmounted(() => {
  window.removeEventListener("click", closeAllDropdowns);
});

function handleEditWithClose(row) {
  closeAllDropdowns();
  handleEdit(row);
}

function handleViewWithClose(insuredUuid) {
  if (!insuredUuid) {
    console.error("No insured UUID provided");
    return;
  }
  closeAllDropdowns();
  router.push(`/insured-persons/${insuredUuid}`);
}

async function handleActivateWithClose(dependantUuid) {
  if (!dependantUuid) {
    console.error("No dependent UUID provided");
    return;
  }

  closeAllDropdowns();

  try {
    const response = await changeInsuredStatus(dependantUuid, "ACTIVE");
    if (response.success) {
      addToast({
        type: "success",
        title: "Status Updated",
        message: "Dependent has been activated successfully",
      });

      const index = dependentsList.value.findIndex(
        (d) => d.dependantUuid === dependantUuid
      );
      if (index !== -1) {
        dependentsList.value.splice(index, 1, {
          ...dependentsList.value[index],
          status: "ACTIVE",
        });
      }
    } else {
      throw new Error(response.error || "Failed to activate dependent");
    }
  } catch (error) {
    addToast({
      type: "error",
      title: "Activation Failed",
      message:
        error.message || "An error occurred while activating the dependent",
    });
  }
}

async function handleDeactivateWithClose(dependantUuid) {
  if (!dependantUuid) {
    console.error("No dependent UUID provided");
    return;
  }

  closeAllDropdowns();

  try {
    const response = await changeInsuredStatus(dependantUuid, "INACTIVE");
    if (response.success) {
      addToast({
        type: "success",
        title: "Status Updated",
        message: "Dependent has been deactivated successfully",
      });

      const index = dependentsList.value.findIndex(
        (d) => d.dependantUuid === dependantUuid
      );
      if (index !== -1) {
        dependentsList.value.splice(index, 1, {
          ...dependentsList.value[index],
          status: "INACTIVE",
        });
      }
    } else {
      throw new Error(response.error || "Failed to deactivate dependent");
    }
  } catch (error) {
    addToast({
      type: "error",
      title: "Deactivation Failed",
      message:
        error.message || "An error occurred while deactivating the dependent",
    });
  }
}

function updateDependant(dependant) {
  const savingDependant = ref(true);

  const dependantData = {
    dependantUuid: dependant.dependantUuid,
    insuredPersonUuid: insuredPersonUuid,
    title: dependant.title || "Mr",
    firstName: dependant.fullName.split(" ")[0] || "",
    fatherName: dependant.fullName.split(" ")[1] || "",
    grandFatherName: dependant.fullName.split(" ")[2] || "",
    gender: dependant.gender.toLowerCase(),
    birthDate: calculateBirthDateFromAge(dependant.age),
    relationship: dependant.relationship,
    status: dependant.status,
  };

  apiRequest.send(
    () => updatedependant(dependantData),
    (response) => {
      savingDependant.value = false;

      if (response.success) {
        toasted(true, "Dependant updated successfully", "");
        fetchInsuredData();
      } else {
        toasted(false, "", response.error || "Failed to update dependant");
      }
    }
  );
}

function toggleDependantStatus(dependant, newStatus) {
  apiRequest.send(
    () => updatedependantstatus(dependant.dependantUuid, newStatus),
    (response) => {
      if (response.success) {
        toasted(
          true,
          `Dependant ${
            newStatus === "ACTIVE" ? "activated" : "deactivated"
          } successfully`,
          ""
        );
        fetchInsuredData();
      } else {
        toasted(
          false,
          "",
          response.error || "Failed to update dependant status"
        );
      }
    }
  );
}

function calculateBirthDateFromAge(age) {
  const birthDate = new Date();
  if (age) {
    birthDate.setFullYear(birthDate.getFullYear() - age);
  }
  return `${birthDate.toISOString().split("T")[0]}T00:00:00.000Z`;
}

function startEdit(dependent) {
  closeAllDropdowns();

  const index = dependentsList.value.findIndex(
    (d, i) =>
      (d.dependantUuid === dependent.dependantUuid || d.id === dependent.id) &&
      i === dependent.index
  );

  const dependentCopy = {
    ...dependent,
    gender: dependent.gender ? capitalizeFirstLetter(dependent.gender) : "Male",
    fullName:
      dependent.fullName ||
      [dependent.firstName, dependent.fatherName, dependent.grandFatherName]
        .filter(Boolean)
        .join(" "),
    birthDate: dependent.birthDate || dependent.birthDate,
    dependantGroup: dependent.dependantGroup || dependent.group || "C-Family",
    status: dependent.status || dependent.status || "ACTIVE",
  };

  dependentCopy.originalIndex =
    index !== -1 ? index : dependentsList.value.indexOf(dependent);

  editingDependentIndex.value = dependentCopy.originalIndex;
  editingDependent.value = dependentCopy;
  photoPreview.value = dependent.profilePictureBase64 || null;
}
async function updateDependent({ values }) {
  const nameParts = values.fullName?.split(" ") || [];

  const dependantRequest = {
    insuredPersonUuid: insuredPersonUuid,
    title: values.title || "",
    firstName: nameParts[0] || "",
    fatherName: nameParts[1] || "",
    grandFatherName: nameParts[2] || "",
    relationship: values.relationship,
    birthDate: values.birthDate,
    phone: values.phone || "",
    status: values.status,
    gender: values.gender?.toLowerCase() || "",
  };

  const formData = new FormData();
  formData.append("dependantRequest", JSON.stringify(dependantRequest));

  // Add profile picture if available
  if (photoPreview.value && photoPreview.value !== values.profilePictureBase64) {
    if (photoPreview.value.startsWith("data:")) {
      const blob = await fetch(photoPreview.value).then((res) => res.blob());
      formData.append("profile", blob, "profile.jpg");
    }
  }

  updateReq.send(
    () => updatedependant(values.dependantUuid, formData),
    (res) => {
      if (res.success) {
        toasted(true, "Dependent updated successfully", "");
        
        const updatedDependent = {
          ...values,
          ...res.data,
          profilePictureBase64: photoPreview.value || values.profilePictureBase64,
          fullName: values.fullName,
          gender: values.gender,
        };

        dependentsList.value.splice(editingDependentIndex.value, 1, updatedDependent);
        editingDependentIndex.value = -1;
        photoPreview.value = null;
      } else {
        toasted(false, "", res.error || "Failed to update dependent");
      }
    }
  );
}



function cancelEdit() {
  editingDependentIndex.value = -1;
  photoPreview.value = null;
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}
</script>