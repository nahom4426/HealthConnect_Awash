<template>
  <div class="p-6 bg-white rounded-lg shadow-md space-y-6">
    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <div
        class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"
      ></div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="text-center py-8">
      <p class="text-red-500 text-lg">{{ error }}</p>
      <button
        @click="fetchInsuredData"
        class="mt-4 px-4 py-2 bg-primary text-white rounded-md"
      >
        Retry
      </button>
    </div>

    <!-- Content when data is loaded -->
    <div v-else>
      <!-- Insured Info -->
      <div class="flex flex-col md:flex-row gap-6 items-start">
        <!-- Image -->
        <div
          class="space-y-3 py-4 m-2 w-[14rem] h-[12rem] flex items-center justify-center"
        >
          <img
            :src="
              insuredData.profilePictureBase64 ||
              'https://randomuser.me/api/portraits/men/75.jpg'
            "
            alt="Profile"
            class="rounded-lg border border-gray-200 w-full h-full object-cover"
          />
        </div>

        <!-- Left Info -->
        <div
          class="space-y-3 w-full md:w-[38rem] h-[12rem] m-2 py-4 pl-8 bg-[#F6F7FA]"
        >
          <div class="flex items-center gap-4 py-2">
            <h3 class="text-xs font-normal text-[#75778B] w-28">Full Name</h3>
            <p class="text-sm font-medium text-[#373946]">
              {{ insuredData.firstName }} {{ insuredData.fatherName }}
              {{ insuredData.grandFatherName }}
            </p>
          </div>
          <div class="flex items-center gap-4 py-2">
            <h3 class="text-xs font-normal text-[#75778B] w-28">Role</h3>
            <p class="text-sm font-medium text-[#373946]">
              {{ insuredData.position || "N/A" }}
            </p>
          </div>
          <div class="flex items-center gap-4 py-2">
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
          <div class="flex items-center gap-4 py-2">
            <h3 class="text-xs font-normal text-[#75778B] w-28">Employee ID</h3>
            <p class="text-sm font-medium text-[#373946]">
              {{ insuredData.idNumber || insuredData.employeeId || "N/A" }}
            </p>
          </div>
          <div class="flex items-center gap-4 py-2">
            <h3 class="text-xs font-normal text-[#75778B] w-28">Address</h3>
            <p class="text-sm font-medium text-[#373946]">
              {{ insuredData.address || "N/A" }}, {{ insuredData.state || "" }},
              {{ insuredData.country || "" }}
            </p>
          </div>
          <div class="flex items-center gap-4 py-2">
            <h3 class="text-xs font-normal text-[#75778B] w-28">Gender</h3>
            <p class="text-sm font-medium text-[#373946]">
              {{ insuredData.gender || "N/A" }}
            </p>
          </div>
        </div>
      </div>

      <!-- Dependants Section -->
       <div v-if="insuredData.dependantCoverage === false" class="mt-6">
  <div class="flex items-start gap-4 p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
    <div class="text-yellow-500">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
      </svg>
    </div>
    <div class="text-sm text-yellow-800">
      <h3 class="font-semibold text-base">Dependants Not Allowed</h3>
      <p>This company does not allow coverage for dependants under this contract or policy.</p>
    </div>
  </div>
</div>

      <div v-if="insuredData.dependantCoverage == true" class="mt-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold">Dependants</h3>
          <button @click="showNewDependentForm = !showNewDependentForm">
            <span
              v-if="showNewDependentForm"
              class="px-6 py-3 border border-gray-300 rounded-md text-gray-700 bg-white"
              >Cancel</span
            >
            <span
              v-else
              class="px-6 py-3 bg-primary text-white rounded-md flex items-center"
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
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
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
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ index + 1 }}
                  </td>

                  <!-- Full Name with Photo -->
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <img
                        :src="
                          dependent.profilePictureBase64 ||
                          'https://randomuser.me/api/portraits/lego/1.jpg'
                        "
                        class="h-10 w-10 rounded-full object-cover"
                        alt="Profile"
                      />
                      <!-- <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">{{ dependent.fullName }}</div>
                      </div> -->
                    </div>
                  </td>
                  <td
                    class="px-6 py-4 font-medium whitespace-nowrap text-sm text-gray-900"
                  >
                    {{
                      dependent.fullName ||
                      `${dependent.firstName} ${dependent.fatherName} ${dependent.grandFatherName}`
                    }}
                  </td>
                  <!-- Relationship -->
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ dependent.relationship }}
                  </td>

                  <!-- Age -->
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ calculateAge(dependent.birthDate) }}
                  </td>

                  <!-- Gender -->
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ capitalizeFirstLetter(dependent.gender) }}
                  </td>

                  <!-- Dependant Group -->
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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
                      class="px-2 py-1 rounded-full text-xs font-medium"
                    >
                      {{
                        dependent.status === "ACTIVE" ? "Active" : "Inactive"
                      }}
                    </span>
                  </td>

                  <!-- Actions -->
                  <td
                    class="px-6 py-4 whitespace-nowrap text-left text-sm font-medium"
                  >
                    <div class="relative">
                      <button
                        @click="
                          toggleDropdown(
                            $event,
                            dependent.dependantUuid || index
                          )
                        "
                        class="text-indigo-600 ml-4 hover:text-indigo-900"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          class="h-5 w-5"
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
                        class="dropdown-menu hidden absolute right-0 z-10 w-44 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                      >
                        <div class="py-1">
                          <button
                            @click.stop="startEdit(dependent)"
                            class="block w-full text-start py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <div
                              class="flex items-start justify-start pl-4 gap-4"
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
                              class="flex items-center justify-start pl-4 gap-4"
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
                              class="flex items-center justify-start pl-4 gap-4"
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
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ index + 1 }}
                  </td>

                  <!-- Photo Upload -->
                  <td class="py-4 px-3 whitespace-nowrap">
                    <div class="relative flex flex-col items-start">
                      <label
                        for="edit-photo-upload"
                        class="cursor-pointer flex items-center justify-center w-16 h-16 bg-[#DFF1F1] rounded hover:bg-blue-100 overflow-hidden relative"
                      >
                        <img
                          :src="
                            photoPreview ||
                            editingDependent.profilePictureBase64 ||
                            'https://randomuser.me/api/portraits/lego/1.jpg'
                          "
                          class="w-full h-full object-cover"
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
                  <td class="pr-6 py-4 pt-6">
                    <Input
                      v-model="editingDependent.fullName"
                      class="text-sm p-1 border rounded w-full"
                      validation="required"
                      :attributes="{
                        placeholder: 'First Middle Last',
                      }"
                      required
                    />
                    <p class="text-xs text-gray-500 mt-1">
                      Enter full name separated by spaces
                    </p>
                  </td>

                  <!-- Relationship -->
                  <td class="px-6 py-4 whitespace-nowrap">
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

                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex space-x-2">
                      <button
                        @click="saveEdit"
                        class="text-green-600 hover:text-green-800"
                        :disabled="savingEdit"
                      >
                        <span
                          v-if="savingEdit"
                          class="px-6 py-3 bg-primary text-white rounded-md flex items-center"
                          >⏳</span
                        >
                        <span
                          v-else
                          class="px-6 py-3 bg-primary text-white rounded-md flex items-center"
                          >✓ Save</span
                        >
                      </button>
                      <button
                        @click="cancelEdit"
                        class="text-green-600 border hover:bg-green-700 p-2"
                      >
                        ✕ Cancel
                      </button>
                    </div>
                  </td>
                </template>
              </tr>

              <!-- New dependent form row -->
              <tr v-if="showNewDependentForm" class="">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ dependentsList.length + 1 }}
                </td>
                <td class="py-4 px-3 whitespace-nowrap">
                  <div class="relative flex flex-col items-start">
                    <!-- Upload Box -->
                    <label
                      for="dependent-photo-upload"
                      class="cursor-pointer flex items-center justify-center w-16 h-16 bg-[#DFF1F1] rounded hover:bg-blue-100 overflow-hidden relative"
                    >
                      <template v-if="newDependent.photo">
                        <img
                          :src="newDependent.photo"
                          class="w-full h-full object-cover"
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
                      class="absolute top-0 right-0 bg-white text-red-600 hover:text-red-800 rounded-full p-0.5 shadow-md"
                      title="Remove image"
                    >
                      <!-- X SVG -->
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-4 w-4"
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


                <td class="pr-6 py-4 pt-6">
                  <Input
                    v-model="newDependent.fullName"
                    class="text-sm p-1 border rounded w-full"
                    validation="required"
                    :attributes="{
                      placeholder: 'First Middle Last',
                    }"
                    required
                  />
                  <p class="text-xs text-gray-500 mt-1">
                    Enter full name separated by spaces
                  </p>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
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

                <td class="px-6 py-4 whitespace-nowrap">
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
                <td class="px-6 py-4 whitespace-nowrap">
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
                <td class="px-6 py-4 whitespace-nowrap">
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

                <td class="px-6 py-4 whitespace-nowrap">
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
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div class="flex space-x-2">
                    <button
                      @click="saveDependent"
                      class="text-green-600 hover:text-green-800"
                      :disabled="savingDependent"
                    >
                      <span
                        v-if="savingDependent"
                        class="px-6 py-3 bg-primary text-white rounded-md flex items-center"
                        >⏳</span
                      >
                      <span
                        v-else
                        class="px-6 py-3 bg-primary text-white rounded-md flex items-center"
                        >✓ save
                      </span>
                    </button>
                    <button
                      @click="cancelAddDependent"
                      class="text-green-600 border hover:bg-green-700 p-2"
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

<script setup lang="ts">
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

const dependentStore = useDependentStore();
const route = useRoute();
const router = useRouter();
const insuredPersonUuid = route.params.insuredPersonUuid as string;
const apiRequest = useApiRequest();
const activeTab = ref("dependents");
const showNewDependentForm = ref(false);
const savingDependent = ref(false);
const loading = ref(true);
const error = ref("");
const insuredData = ref<any>({});
const editingDependentIndex = ref(-1);
const editingDependent = ref(null);
const photoPreview = ref(null);

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
  return insuredData.value?.dependants || [];
});

const newDependent = ref({
  id: insuredPersonUuid,
  photo: "",
  fullName: "",
  relationship: "Spouse",
  age: null,
  group: "C-Family",
  gender: "Male", // Added for gender selection
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
            // Calculate age from birth date if available
            let age = null;
            if (dep.dependantBirthDate) {
              const birthDate = new Date(dep.dependantBirthDate);
              const today = new Date();
              age = today.getFullYear() - birthDate.getFullYear();
              const m = today.getMonth() - birthDate.getMonth();
              if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
              }
            }

            // Construct full name from parts
            const fullName = [
              dep.dependantFirstName || "",
              dep.dependantFatherName || "",
              dep.dependantGrandFatherName || "",
            ]
              .filter(Boolean)
              .join(" ");

            return {
              ...dep,
              fullName,
              age,
              // Ensure these fields exist
              dependantUuid: dep.dependantUuid || dep.id,
              gender: dep.dependantGender || dep.gender || "Male",
              status: dep.dependantStatus || dep.status || "ACTIVE",
              relationship: dep.relationship || "Other",
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
function calculateAge(birthDate: string) {
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
  // Reset form
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

  // Parse the full name into parts
  const nameParts = newDependent.value.fullName.split(" ");

  // Calculate birthdate from age
  const birthDate = new Date();
  if (newDependent.value.age) {
    birthDate.setFullYear(birthDate.getFullYear() - newDependent.value.age);
  }

  // Format the date as required by the API (ISO format with time)
  const formattedBirthDate = `${
    birthDate.toISOString().split("T")[0]
  }T00:00:00.000Z`;

  // Create the dependant object according to the API requirements
  const dependantData = {
    insuredPersonUuid: insuredPersonUuid,
    dependantFirstName: nameParts[0] || "",
    dependantFatherName: nameParts[1] || "",
    dependantGrandFatherName: nameParts[2] || "",
    dependantGender: newDependent.value.gender?.toLowerCase() || "male",
    dependantBirthDate: formattedBirthDate,
    relationship: newDependent.value.relationship,
    dependantStatus: newDependent.value.status,
  };

  // Create FormData
  const formData = new FormData();

  // Append the dependant data as JSON string
  formData.append("dependant", JSON.stringify(dependantData));

  // Handle photo upload - use the actual file from the input element
  const fileInput = document.querySelector(
    'input[type="file"]'
  ) as HTMLInputElement;
  if (fileInput && fileInput.files && fileInput.files.length > 0) {
    const photoFile = fileInput.files[0];
    console.log("Using actual file from input:", photoFile);
    formData.append("photo", photoFile);
  }

  // Call API with explicit content type
  apiRequest.send(() => createdependant(formData), handleDependantResponse);
}

function handleDependantResponse(response: any) {
  savingDependent.value = false;
  console.log("API Response:", response);

  if (response.success) {
    toasted(true, "Dependant added successfully", "");

    // Refresh the data to show the new dependant
    fetchInsuredData();

    // Hide the form
    showNewDependentForm.value = false;
  } else {
    toasted(false, "", response.error || "Failed to add dependant");
  }
}

// Modified handlePhotoUpload function to work with both new and editing dependents
function handlePhotoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  // Check if we're editing a dependent or adding a new one
  if (editingDependentIndex.value >= 0) {
    // For editing existing dependent
    reader.onload = (e) => {
      photoPreview.value = e.target.result;
      editingDependent.value.profilePictureBase64 = e.target.result;
    };
  } else {
    // For new dependent
    reader.onload = (e) => {
      newDependent.value.photo = e.target.result;
    };
  }

  reader.readAsDataURL(file);
  console.log("File selected:", file);
}

// Fetch data on component mount
onMounted(() => {
  fetchInsuredData();
});

function toggleDropdown(event, rowId) {
  event.stopPropagation();
  closeAllDropdowns(); // Close any open dropdowns first
  const dropdown = document.getElementById(`dropdown-${rowId}`);
  if (dropdown) {
    dropdown.classList.toggle("hidden");
  }
}

// Close dropdown when clicking outside or when an option is selected
function closeAllDropdowns() {
  document.querySelectorAll(".dropdown-menu").forEach((el) => {
    el.classList.add("hidden");
  });
}

// Call this when component mounts
onMounted(() => {
  window.addEventListener("click", closeAllDropdowns);
});

// Call this when component unmounts
onUnmounted(() => {
  window.removeEventListener("click", closeAllDropdowns);
});

// Modified handler functions to close dropdown after action
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
  // Navigate to the insured person details page
  router.push(`/insured-persons/${insuredUuid}`);
}

async function handleActivateWithClose(dependantUuid: string) {
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

      // ✅ Find and update the dependent locally
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

async function handleDeactivateWithClose(dependantUuid: string) {
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

      // ✅ Find and update the dependent locally
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

// Function to update a dependant
function updateDependant(dependant) {
  const savingDependant = ref(true);

  // Format the data for the API
  const dependantData = {
    dependantUuid: dependant.dependantUuid,
    insuredPersonUuid: insuredPersonUuid,
    dependantFirstName: dependant.fullName.split(" ")[0] || "",
    dependantFatherName: dependant.fullName.split(" ")[1] || "",
    dependantGrandFatherName: dependant.fullName.split(" ")[2] || "",
    dependantGender: dependant.gender.toLowerCase(),
    dependantBirthDate: calculateBirthDateFromAge(dependant.age),
    relationship: dependant.relationship,
    dependantStatus: dependant.status,
  };

  apiRequest.send(
    () => updatedependant(dependantData),
    (response) => {
      savingDependant.value = false;

      if (response.success) {
        toasted(true, "Dependant updated successfully", "");
        fetchInsuredData(); // Refresh the data
      } else {
        toasted(false, "", response.error || "Failed to update dependant");
      }
    }
  );
}

// Function to toggle dependant status
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
        fetchInsuredData(); // Refresh the data
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

// Helper function to calculate birth date from age
function calculateBirthDateFromAge(age) {
  const birthDate = new Date();
  if (age) {
    birthDate.setFullYear(birthDate.getFullYear() - age);
  }
  return `${birthDate.toISOString().split("T")[0]}T00:00:00.000Z`;
}
function startEdit(dependent) {
  closeAllDropdowns();

  // Find the exact index in the array (not just by ID)
  const index = dependentsList.value.findIndex(
    (d, i) =>
      (d.dependantUuid === dependent.dependantUuid || d.id === dependent.id) &&
      i === dependent.index
  );

  // Create properly formatted copy
  const dependentCopy = {
    ...dependent,
    gender: dependent.gender ? capitalizeFirstLetter(dependent.gender) : "Male",
    fullName:
      dependent.fullName ||
      [dependent.firstName, dependent.fatherName, dependent.grandFatherName]
        .filter(Boolean)
        .join(" "),
    birthDate: dependent.birthDate || dependent.dependantBirthDate,
    dependantGroup: dependent.dependantGroup || dependent.group || "C-Family",
    status: dependent.status || dependent.dependantStatus || "ACTIVE",
  };

  // Store the original array index
  dependentCopy.originalIndex =
    index !== -1 ? index : dependentsList.value.indexOf(dependent);

  editingDependentIndex.value = dependentCopy.originalIndex;
  editingDependent.value = dependentCopy;
  photoPreview.value = dependent.profilePictureBase64 || null;
}

async function saveEdit() {
  if (!editingDependent.value?.fullName?.trim()) {
    toasted(false, "", "Full name is required");
    return;
  }

  try {
    const formData = new FormData();
    const nameParts = editingDependent.value.fullName.split(" ");

    // Create an object for updateRequest
    const updateRequest = {
      firstName: nameParts[0] || "",
      otherName: nameParts.slice(1).join(" ") || "",
      gender: editingDependent.value.gender.toLowerCase(),
      birthDate: editingDependent.value.birthDate,
      status: editingDependent.value.status,
      relationship: editingDependent.value.relationship,
      title: editingDependent.value.title || "",
      phone: editingDependent.value.phone || "",
    };

    // Append updateRequest as a JSON string
    formData.append("updateRequest", JSON.stringify(updateRequest));

    // Handle profile picture upload
    if (
      photoPreview.value &&
      photoPreview.value !== editingDependent.value.profilePictureBase64
    ) {
      if (photoPreview.value.startsWith("data:")) {
        const blob = await fetch(photoPreview.value).then((res) => res.blob());
        formData.append("profilePicture", blob, "profile.jpg");
      } else {
        formData.append("profilePicture", photoPreview.value);
      }
    } else if (editingDependent.value.profilePictureBase64) {
      // If no new photo is selected, but there is an existing one, keep it (optional)
      const existingBlob = await fetch(
        editingDependent.value.profilePictureBase64
      ).then((res) => res.blob());
      formData.append("profilePicture", existingBlob, "profile.jpg");
    } else {
      // Do not append null if no photo is selected
      // formData.append('profilePicture', null); // Removed this line
    }

    // Call API
    const response = await updatedependant(
      editingDependent.value.dependantUuid,
      formData
    );

    // Update local state with the response data
    const updatedDependent = {
      ...editingDependent.value,
      ...response.data,
      profilePictureBase64:
        photoPreview.value || editingDependent.value.profilePictureBase64,
      fullName: editingDependent.value.fullName,
      gender: editingDependent.value.gender,
    };

    // Update the specific item in the list
    dependentsList.value.splice(
      editingDependentIndex.value,
      1,
      updatedDependent
    );

    // Reset editing state
    editingDependentIndex.value = -1;
    photoPreview.value = null;

    toasted(true, "Dependent updated successfully", "");
  } catch (error) {
    console.error("Update failed:", error);
    toasted(
      false,
      "",
      "Failed to update dependent: " +
        (error.response?.data?.message || error.message)
    );
  }
}
function cancelEdit() {
  // Reset editing state
  editingDependentIndex.value = -1;
  photoPreview.value = null;
}
// In your component's methods
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}
</script>
