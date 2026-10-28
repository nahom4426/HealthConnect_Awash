<template>
  <div class="space-y-6">
    <!-- No Coverage Alert -->
    <div v-if="insuredData.dependantCoverage === false" class="flex gap-4 items-start p-4 bg-yellow-50 rounded-2xl border border-yellow-300 shadow-md">
      <div class="flex-shrink-0 text-yellow-500">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
        </svg>
      </div>
      <div class="text-sm text-yellow-800">
        <h3 class="text-base font-semibold">Dependents Not Allowed</h3>
        <p>This company does not allow coverage for dependents under this contract or policy.</p>
      </div>
    </div>

    <!-- Dependents Section -->
    <div v-else>
      <!-- Header with Add Button -->
      <div class="flex justify-between items-center mb-6">
        <div>
          <h3 class="text-2xl font-bold text-gray-900">Dependents</h3>
          <p class="mt-1 text-sm text-gray-600">Manage and view dependent information</p>
        </div>
        <button 
          @click="toggleNewDependentForm"
           v-if="!isReadOnly"
          :class="`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
            showNewDependentForm
              ? 'bg-red-100 text-red-700 hover:bg-red-200'
              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg'
          }`"
        >
          <svg v-if="!showNewDependentForm" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
          {{ showNewDependentForm ? 'Cancel' : 'Add Dependent' }}
        </button>
      </div>

      <!-- Empty State -->
      <div v-if="dependentsList.length === 0 && !showNewDependentForm" class="py-12 text-center bg-gray-50 rounded-2xl border-2 border-gray-300 border-dashed">
        <svg class="mx-auto mb-4 w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 3.75l-2.25 2.25-1.5-1.5" />
        </svg>
        <p class="font-medium text-gray-600">No dependents added yet</p>
        <p class="mt-1 text-sm text-gray-500">Click "Add Dependent" to get started</p>
      </div>

      <!-- Dependents Table -->
      <div v-else-if="dependentsList.length > 0 || showNewDependentForm" class="overflow-visible relative rounded-2xl border shadow-md border-slate-200">
        <div class="overflow-x-auto overflow-y-visible">
          <table class="w-full divide-y divide-slate-200">
            <thead class="bg-gradient-to-r from-slate-700 to-slate-800">
              <tr>
                <th v-for="header in headers" :key="header" class="px-6 py-4 text-xs font-bold tracking-wider text-left text-white uppercase">
                  {{ header }}
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <!-- New dependent form row (ONE LINE) -->
              <tr v-if="showNewDependentForm" class="bg-blue-50">
                <td class="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                  {{ dependentsList.length + 1 }}
                </td>

                <!-- Photo upload -->
                <td class="px-3 py-4 whitespace-nowrap">
                  <div class="flex relative flex-col items-start">
                    <label
                      for="dependent-photo-upload"
                      class="cursor-pointer flex items-center justify-center w-12 h-12 bg-[#DFF1F1] rounded hover:bg-blue-100 overflow-hidden relative"
                    >
                      <template v-if="newDependentPhotoPreview">
                        <img :src="newDependentPhotoPreview" class="object-cover w-full h-full" />
                      </template>
                      <template v-else>
                        <span class="text-2xl text-[#02676B] font-bold">+</span>
                      </template>
                    </label>

                    <button
                      v-if="newDependentPhotoPreview"
                      @click.stop="newDependentPhotoPreview = null; newDependent.photo = null"
                      class="absolute -top-2 -right-2 p-0.5 text-red-600 bg-white rounded-full shadow-md hover:text-red-800"
                      title="Remove image"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>

                    <input
                      id="dependent-photo-upload"
                      type="file"
                      @change="handleNewDependentPhotoUpload"
                      class="hidden"
                      accept="image/*"
                    />
                  </div>
                </td>

                <!-- Full Name -->
                <td class="py-3 pt-5 pr-4 min-w-[180px]">
                  <Input
                    v-model="newDependent.fullName"
                    label=""
                    validation="required"
                    :attributes="{ placeholder: 'First Middle Last', class: 'w-full input-compact' }"
                    required
                  />
                  <p class="mt-1 text-xs text-gray-500">Enter full name separated by spaces</p>
                </td>

                <!-- ID Number -->
                <td class="px-6 py-4 whitespace-nowrap min-w-[130px]">
                  <Input
                    v-model="newDependent.idNumber"
                    label=""
                    :attributes="{ placeholder: 'ID Number', class: 'w-full input-compact' }"
                  />
                </td>

                <!-- Relationship -->
                <td class="px-6 py-4 whitespace-nowrap min-w-[130px]">
                  <Select
                    v-model="newDependent.relationship"
                    label=""
                    validation="required"
                    :options="newDependentRelationshipOptions"
                    :attributes="{ placeholder: 'Relationship', required: true, class: 'w-full input-compact' }"
                  />
                </td>

                <!-- Age -->
                <td class="px-6 py-4 whitespace-nowrap min-w-[90px]">
                  <Input
                    v-model.number="newDependent.age"
                    label=""
                    validation="num|min:0"
                    :attributes="{ placeholder: 'Age', type: 'number', min: 0, class: 'w-full input-compact' }"
                  />
                </td>

                <!-- Gender -->
                <td class="px-6 py-4 whitespace-nowrap min-w-[110px]">
                  <Select
                    v-model="newDependent.gender"
                    label=""
                    validation="required"
                    :options="['Male', 'Female']"
                    :attributes="{ placeholder: 'Gender', required: true, class: 'w-full input-compact' }"
                  />
                </td>

                <!-- Status -->
                <td class="px-6 py-4 whitespace-nowrap min-w-[120px]">
                  <Select
                    v-model="newDependent.status"
                    label=""
                    validation="required"
                    :options="['ACTIVE', 'SUSPENDED']"
                    :attributes="{ placeholder: 'Status', required: true, class: 'w-full input-compact' }"
                  />
                </td>

                <!-- Actions -->
                <td class="px-6 py-4 text-sm font-medium whitespace-nowrap">
                  <div class="flex gap-2">
                    <button
                      @click="saveDependent"
                      class="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg transition-colors duration-200 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      :disabled="savingDependent"
                    >
                      <span v-if="savingDependent" class="flex gap-2 items-center">
                        <svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Saving...
                      </span>
                      <span v-else>Save</span>
                    </button>
                    <button
                      @click="cancelAddDependent"
                      class="px-4 py-2 text-sm font-medium text-gray-700 bg-white rounded-lg border border-gray-300 transition-colors duration-200 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </td>
              </tr>

              <tr v-for="(dependent, index) in dependentsList" :key="dependent.dependantUuid" class="transition-colors hover:bg-slate-50">
                <template v-if="editingDependentIndex === index">
                  <td class="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                    {{ index + 1 }}
                  </td>

                  <!-- Photo upload (edit) -->
                  <td class="px-3 py-4 whitespace-nowrap">
                    <div class="flex relative flex-col items-start">
                      <label
                        :for="`edit-dependent-photo-${editingDependentIndex}`"
                        class="cursor-pointer flex items-center justify-center w-12 h-12 bg-[#DFF1F1] rounded hover:bg-blue-100 overflow-hidden relative"
                      >
                        <template v-if="editingDependentPhotoPreview || dependent.profile || dependent.profilePictureBase64 || dependent.photoUrl">
                          <img
                            :src="editingDependentPhotoPreview || getProfileUrl(dependent.profile) || getProfileUrl(dependent.profilePictureBase64) || getProfileUrl(dependent.photoUrl)"
                            class="object-cover w-full h-full"
                            @error="(e) => (e.target.src = genderFallbackUrl(dependent.gender))"
                          />
                        </template>
                        <template v-else>
                          <span class="text-2xl text-[#02676B] font-bold">+</span>
                        </template>
                      </label>

                      <button
                        v-if="editingDependentPhotoPreview || dependent.profile || dependent.profilePictureBase64 || dependent.photoUrl"
                        @click.stop="editingDependentPhotoPreview = null; editingDependent.profile = null"
                        class="absolute -top-2 -right-2 p-0.5 text-red-600 bg-white rounded-full shadow-md hover:text-red-800"
                        title="Remove image"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>

                      <input
                        :id="`edit-dependent-photo-${editingDependentIndex}`"
                        type="file"
                        @change="handleEditingDependentPhotoUpload"
                        class="hidden"
                        accept="image/*"
                      />
                    </div>
                  </td>

                  <!-- Full Name -->
                  <td class="py-3 pt-5 pr-4 min-w-[180px]">
                    <Input
                      v-model="editingDependent.fullName"
                      label=""
                      validation="required"
                      :attributes="{ placeholder: 'First Middle Last', class: 'w-full input-compact' }"
                      required
                    />
                  </td>

                  <!-- ID Number -->
                  <td class="px-6 py-4 whitespace-nowrap min-w-[130px]">
                    <Input
                      v-model="editingDependent.idNumber"
                      label=""
                      :attributes="{ placeholder: 'ID Number', class: 'w-full input-compact' }"
                    />
                  </td>

                  <!-- Relationship -->
                  <td class="px-6 py-4 whitespace-nowrap min-w-[130px]">
                    <Select
                      v-model="editingDependent.relationship"
                      label=""
                      :options="editingDependentRelationshipOptions"
                      :attributes="{ placeholder: 'Relationship', class: 'w-full input-compact' }"
                    />
                  </td>

                  <!-- Age -->
                  <td class="px-6 py-4 whitespace-nowrap min-w-[90px]">
                    <Input
                      v-model.number="editingDependent.age"
                      label=""
                      :attributes="{ placeholder: 'Age', type: 'number', min: 0, class: 'w-full input-compact' }"
                    />
                  </td>

                  <!-- Gender -->
                  <td class="px-6 py-4 whitespace-nowrap min-w-[110px]">
                    <Select
                      v-model="editingDependent.gender"
                      label=""
                      :options="['Male', 'Female']"
                      :attributes="{ placeholder: 'Gender', class: 'w-full input-compact' }"
                    />
                  </td>

                  <!-- Status -->
                  <td class="px-6 py-4 whitespace-nowrap min-w-[120px]">
                    <Select
                      v-model="editingDependent.status"
                      label=""
                      :options="['ACTIVE', 'SUSPENDED']"
                      :attributes="{ placeholder: 'Status', class: 'w-full input-compact' }"
                    />
                  </td>

                  <!-- Actions -->
                  <td class="px-6 py-4 text-sm font-medium whitespace-nowrap">
                    <div class="flex gap-2">
                      <button
                        @click="updateDependent({ values: editingDependent })"
                        type="button"
                        class="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg transition-colors duration-200 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        :disabled="isUpdating"
                      >
                        <span v-if="isUpdating" class="flex gap-2 items-center">
                          <svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Saving...
                        </span>
                        <span v-else>Save</span>
                      </button>
                      <button
                        @click="cancelEdit"
                        type="button"
                        class="px-4 py-2 text-sm font-medium text-gray-700 bg-white rounded-lg border border-gray-300 transition-colors duration-200 hover:bg-gray-50"
                        :disabled="isUpdating"
                      >
                        Cancel
                      </button>
                    </div>
                  </td>
                </template>

                <template v-else>
                  <!-- Index -->
                  <td class="px-6 py-4 text-sm font-medium text-gray-900">{{ index + 1 }}</td>

                  <!-- Photo -->
                  <td class="px-6 py-4 whitespace-nowrap">
                    <img
                      :src="
                        getProfileUrl(dependent.profile) ||
                        getProfileUrl(dependent.profilePictureBase64) ||
                        getProfileUrl(dependent.photoUrl) ||
                        genderFallbackUrl(dependent.gender)
                      "
                      class="object-cover w-10 h-10 rounded-full border-2 border-blue-300"
                      alt="Profile"
                      @error="(e) => (e.target.src = genderFallbackUrl(dependent.gender))"
                    />
                  </td>

                  <!-- Full Name -->
                  <td class="px-6 py-4 text-sm font-semibold text-gray-900">
                    {{ dependent.fullName || `${dependent.firstName} ${dependent.fatherName} ${dependent.grandFatherName}` }}
                  </td>
                  <td class="px-6 py-4 text-sm text-green-600">{{ dependent.idNumber }}</td>
                  <!-- Relationship -->
                  <td class="px-6 py-4 text-sm text-gray-600">{{ dependent.relationship }}</td>

                  <!-- Age -->
                  <td class="px-6 py-4 text-sm text-gray-600">{{ dependent.age || calculateAge(dependent.birthDate) }}</td>

                  <!-- Gender -->
                  <td class="px-6 py-4 text-sm text-gray-600">{{ capitalizeFirstLetter(dependent.gender) }}</td>

                  <!-- Status -->
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span :class="`px-3 py-1 text-xs font-semibold rounded-full ${
                      dependent.status === 'ACTIVE'
                        ? 'bg-teal-100 text-teal-700'
                        : dependent.status === 'SUSPENDED'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-slate-100 text-slate-700'
                    }`">
                      {{ dependent.status === 'ACTIVE' ? 'Active' : dependent.status === 'SUSPENDED' ? 'Suspended' : 'Inactive' }}
                    </span>
                  </td>

                  <!-- Actions -->
                  <td class="px-6 py-4 text-sm font-medium whitespace-nowrap">
                    <div class="flex gap-2">
                      <!-- Edit Button -->
                      <button
                        @click="startEdit(dependent)"
                         v-if="!isReadOnly"
                        class="flex gap-2 items-center p-2 text-blue-600 bg-blue-50 rounded-lg transition-colors hover:bg-blue-100 group"
                        title="Edit"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span class="max-w-0 overflow-hidden text-xs font-semibold whitespace-nowrap opacity-0 transition-all duration-200 group-hover:max-w-[120px] group-hover:opacity-100">
                          Edit
                        </span>
                      </button>

                      <!-- Benefits Button -->
                      <button
                        @click="
                          openModal('AddDependentPackages', {
                            payerInstitutionContractUuid: insuredData?.payerInstitutionContractUuid,
                            insuredUuid: insuredData?.insuredUuid || insuredPersonUuid,
                            dependantUuid: dependent?.dependantUuid,
                            quotationUuid: insuredData?.quotationUuid,
                            gender: dependent?.gender,
                          })
                        "
                        class="flex gap-2 items-center p-2 text-green-600 bg-green-50 rounded-lg transition-colors hover:bg-green-100 group"
                        title="Benefits"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                        </svg>
                        <span class="max-w-0 overflow-hidden text-xs font-semibold whitespace-nowrap opacity-0 transition-all duration-200 group-hover:max-w-[120px] group-hover:opacity-100">
                          Benefits
                        </span>
                      </button>

                      <!-- Status Toggle Button -->
                      <button
                       v-if="(dependent.status === 'SUSPENDED' || dependent.status === 'Suspended' || (dependent.status !== 'ACTIVE' && dependent.status !== 'Active')) && !isReadOnly"
                        @click="handleActivateWithClose(dependent.dependantUuid)"
                        class="flex gap-2 items-center p-2 text-teal-600 bg-teal-50 rounded-lg transition-colors hover:bg-teal-100 group"
                        title="Activate"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span class="max-w-0 overflow-hidden text-xs font-semibold whitespace-nowrap opacity-0 transition-all duration-200 group-hover:max-w-[120px] group-hover:opacity-100">
                          Activate
                        </span>
                      </button>

                      <button
                        v-if="(dependent.status === 'ACTIVE' || dependent.status === 'Active')&& !isReadOnly"
                        @click="handleDeactivateWithClose(dependent.dependantUuid)"
                        class="flex gap-2 items-center p-2 bg-red-50 rounded-lg transition-colors text-slate-600 hover:bg-red-100 group"
                        title="Deactivate"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span class="max-w-0 overflow-hidden text-xs font-semibold whitespace-nowrap opacity-0 transition-all duration-200 group-hover:max-w-[120px] group-hover:opacity-100">
                          Deactivate
                        </span>
                      </button>
                    </div>
                  </td>
                </template>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, ref, computed, onMounted, onUnmounted } from 'vue';

import Input from '@/components/new_form_elements/Input.vue';
import Select from '@/components/new_form_elements/Select.vue';
import { createdependant, updatedependant, updatedependantstatus } from '../api/dependantsApi';
import { toasted } from '@/utils/utils';
import { openModal } from '@customizer/modal-x';
import { useRoute } from 'vue-router';
const route = useRoute();
const isReadOnly = computed(() => route.query.pageContext != 'amend');
const emit = defineEmits(['onDependentUpdated']);

const props = defineProps({
  insuredData: { type: Object, required: true },
  insuredPersonUuid: { type: String, required: true },
  onDependentUpdated: { type: Function, default: () => {} },
});

async function notifyDependentUpdated() {
  try {
    emit('onDependentUpdated');
    await props.onDependentUpdated();
  } catch (e) {
    // ignore
  }
}

const showNewDependentForm = ref(false);
const savingDependent = ref(false);
const editingDependentIndex = ref(-1);
const editingDependent = ref(null);
const newDependentPhotoPreview = ref(null);
const editingDependentPhotoPreview = ref(null);
const isUpdating = ref(false);

const headers = ['#', 'Photo', 'Full Name','ID Number', 'Relationship', 'Age', 'Gender', 'Status', 'Actions'];

const dependentsList = computed(() => {
  return props.insuredData?.dependants || props.insuredData?.dependantResponses || [];
});

const RELATIONSHIP_OPTIONS = ['Spouse', 'Child', 'Son', 'Daughter', 'Father', 'Mother', 'Brother', 'Sister', 'Employee'];
const UNIQUE_RELATIONSHIPS = ['Spouse', 'Father', 'Mother'];

const hasSpouseDependent = computed(() => {
  return dependentsList.value.some((d) => normalizeRelationship(d?.relationship) === 'spouse');
});

function hasRelationshipOnce(rel) {
  const normalized = normalizeRelationship(rel);
  return dependentsList.value.some((d) => normalizeRelationship(d?.relationship) === normalized);
}

const newDependentRelationshipOptions = computed(() => {
  const base = [...RELATIONSHIP_OPTIONS];
  return base.filter((opt) => {
    const isUnique = UNIQUE_RELATIONSHIPS.includes(opt);
    if (!isUnique) return true;
    return !hasRelationshipOnce(opt);
  });
});

const editingDependentRelationshipOptions = computed(() => {
  const base = [...RELATIONSHIP_OPTIONS];
  const currentRel = editingDependent.value?.relationship;
  return base.filter((opt) => {
    const isUnique = UNIQUE_RELATIONSHIPS.includes(opt);
    if (!isUnique) return true;
    // allow keeping the current relationship even if it's already used (editing itself)
    if (normalizeRelationship(currentRel) === normalizeRelationship(opt)) return true;
    return !hasRelationshipOnce(opt);
  });
});

function normalizeRelationship(rel) {
  return String(rel || '').trim().toLowerCase();
}

function normalizeGender(genderLike) {
  const g = String(genderLike || '').trim().toLowerCase();
  if (!g) return null;
  if (g.includes('female')) return 'female';
  if (g.includes('male')) return 'male';
  return null;
}

function nullIfEmpty(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string' && value.trim() === '') return null;
  return value;
}

function toDateInputValue(dateLike) {
  if (!dateLike) return '';
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function toIsoFromDateInput(dateStr) {
  if (!dateStr) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(`${dateStr}T00:00:00.000Z`).toISOString();
  }
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function genderFallbackUrl(gender) {
  const g = String(gender || '').trim().toLowerCase();
  if (g.includes('female')) return '/src/assets/img/female.png';
  if (g.includes('male')) return '/src/assets/img/male.png';
  return '/src/assets/img/profile.png';
}

function getProfileUrl(profileData) {
  if (!profileData) return null;
  if (typeof profileData !== 'string') return null;
  if (profileData.startsWith('iVBORw0KGgo') || profileData.startsWith('/9j/') || !profileData.startsWith('http')) {
    return `data:image/png;base64,${profileData}`;
  }
  return profileData;
}

function calculateAge(birthDate) {
  if (!birthDate) return 'N/A';
  const today = new Date();
  const birthDateObj = new Date(birthDate);
  if (Number.isNaN(birthDateObj.getTime())) return 'N/A';
  let age = today.getFullYear() - birthDateObj.getFullYear();
  const monthDiff = today.getMonth() - birthDateObj.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
    age--;
  }
  return age;
}

function capitalizeFirstLetter(string) {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

const newDependent = ref({
  fullName: '',
  idNumber: '',
  relationship: 'Spouse',
  birthDate: '',
  age: null,
  gender: 'Male',
  status: 'ACTIVE',
  photo: null,
});

function ensureNewDependentDefaultRelationship() {
  const opts = newDependentRelationshipOptions.value;
  if (!opts.length) return;
  if (!opts.some((o) => normalizeRelationship(o) === normalizeRelationship(newDependent.value.relationship))) {
    newDependent.value.relationship = opts[0];
  }
}

function toggleNewDependentForm() {
  if (!showNewDependentForm.value) {
    cancelEdit();
  }
  showNewDependentForm.value = !showNewDependentForm.value;
  if (showNewDependentForm.value) {
    ensureNewDependentDefaultRelationship();
  }
}

function startEdit(dependent) {
  showNewDependentForm.value = false;
  editingDependentIndex.value = dependentsList.value.indexOf(dependent);
  const derivedAge = dependent.birthDate ? calculateAge(dependent.birthDate) : null;
  editingDependent.value = {
    ...dependent,
    fullName: dependent.fullName || `${dependent.firstName || ''} ${dependent.fatherName || ''} ${dependent.grandFatherName || ''}`.trim(),
    idNumber: dependent.idNumber || '',
    birthDate: toDateInputValue(dependent.birthDate),
    age: typeof dependent.age === 'number' ? dependent.age : (typeof derivedAge === 'number' ? derivedAge : null),
    gender: normalizeGender(dependent.gender) === 'female' ? 'Female' : 'Male',
  };
  editingDependentPhotoPreview.value = null;
}

function cancelEdit() {
  editingDependentIndex.value = -1;
  editingDependent.value = null;
  editingDependentPhotoPreview.value = null;
}

async function updateDependent({ values }) {
  if (!values.fullName || String(values.fullName).trim() === '') {
    toasted(false, '', 'Full name is required');
    return;
  }

  if (!values.dependantUuid) {
    toasted(false, '', 'Missing dependent identifier');
    return;
  }

  const nameParts = values.fullName?.split(' ') || [];
  let birthDateValue = nullIfEmpty(toIsoFromDateInput(values.birthDate) || values.birthDate);
  if (!birthDateValue && values.age !== null && values.age !== undefined && values.age !== '') {
    const birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - Number(values.age));
    birthDateValue = birthDate.toISOString();
  }
  const dependantRequest = {
    insuredPersonUuid: props.insuredPersonUuid,
    title: nullIfEmpty(values.title),
    firstName: nameParts[0] || '',
    fatherName: nullIfEmpty(nameParts[1] || ''),
    grandFatherName: nullIfEmpty(nameParts[2] || ''),
    idNumber: nullIfEmpty(values.idNumber),
    relationship: nullIfEmpty(values.relationship),
    birthDate: nullIfEmpty(birthDateValue),
    phone: nullIfEmpty(values.phone),
    status: nullIfEmpty(values.status),
    gender: normalizeGender(values.gender),
  };

  const formData = new FormData();
  formData.append('dependantRequest', JSON.stringify(dependantRequest));

  if (editingDependentPhotoPreview.value?.startsWith('data:')) {
    const blob = await fetch(editingDependentPhotoPreview.value).then((res) => res.blob());
    formData.append('profile', blob, 'profile.jpg');
  }

  isUpdating.value = true;
  try {
    console.log('🔹 Updating dependent:', values.dependantUuid, dependantRequest);
    const response = await updatedependant(values.dependantUuid, formData);
    if (response.success) {
      toasted(true, 'Dependent updated successfully', '');
      editingDependentIndex.value = -1;
      editingDependentPhotoPreview.value = null;
      await notifyDependentUpdated();
    } else {
      toasted(false, '', response.error || 'Failed to update dependent');
    }
  } catch (error) {
    toasted(false, '', 'An error occurred while updating');
    console.error('Update error:', error);
  } finally {
    isUpdating.value = false;
  }
}

async function saveDependent() {
  if (!newDependent.value.fullName) {
    toasted(false, '', 'Please fill in required fields');
    return;
  }

  // Enforce single-spouse rule defensively (even if UI options are bypassed)
  if (hasSpouseDependent.value && normalizeRelationship(newDependent.value.relationship) === 'spouse') {
    toasted(false, '', 'Only one spouse is allowed for this insured person');
    return;
  }

  savingDependent.value = true;
  try {
    const nameParts = newDependent.value.fullName.split(' ');
    let birthDateIso = null;
    if (newDependent.value.birthDate) {
      birthDateIso = toIsoFromDateInput(newDependent.value.birthDate) || newDependent.value.birthDate;
    } else if (newDependent.value.age !== null && newDependent.value.age !== undefined && newDependent.value.age !== '') {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - Number(newDependent.value.age));
      birthDateIso = birthDate.toISOString();
    }

    const dependantData = {
      insuredPersonUuid: props.insuredPersonUuid,
      title: null,
      firstName: nameParts[0] || '',
      fatherName: nullIfEmpty(nameParts[1] || ''),
      grandFatherName: nullIfEmpty(nameParts[2] || ''),
      idNumber: nullIfEmpty(newDependent.value.idNumber),
      relationship: newDependent.value.relationship,
      birthDate: nullIfEmpty(birthDateIso),
      phone: null,
      status: newDependent.value.status,
      gender: normalizeGender(newDependent.value.gender) || 'male',
    };

    const formData = new FormData();
    formData.append('dependantRequest', JSON.stringify(dependantData));

    if (newDependentPhotoPreview.value?.startsWith('data:')) {
      const blob = await fetch(newDependentPhotoPreview.value).then((res) => res.blob());
      formData.append('profile', blob, 'profile.jpg');
    }

    const response = await createdependant(formData);

    if (response.success) {
      toasted(true, 'Dependent added successfully', '');
      showNewDependentForm.value = false;
      newDependentPhotoPreview.value = null;
      newDependent.value = {
        fullName: '',
        idNumber: '',
        relationship: newDependentRelationshipOptions.value?.[0] || 'Child',
        birthDate: '',
        age: null,
        gender: 'Male',
        status: 'ACTIVE',
        photo: null,
      };
      ensureNewDependentDefaultRelationship();
      await notifyDependentUpdated();
    } else {
    }
  } catch (error) {
    console.error('Save dependent error:', error);
  } finally {
    savingDependent.value = false;
  }
}

function cancelAddDependent() {
  if (savingDependent.value) return;
  showNewDependentForm.value = false;
  newDependentPhotoPreview.value = null;
  newDependent.value = {
    fullName: '',
    idNumber: '',
    relationship: newDependentRelationshipOptions.value?.[0] || 'Child',
    birthDate: '',
    age: null,
    gender: 'Male',
    status: 'ACTIVE',
    photo: null,
  };
  ensureNewDependentDefaultRelationship();
}

function handleNewDependentPhotoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    toasted(false, '', 'File size should be less than 5MB');
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    newDependentPhotoPreview.value = e.target.result;
    newDependent.value.photo = e.target.result;
  };
  reader.readAsDataURL(file);
}

function handleEditingDependentPhotoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    toasted(false, '', 'File size should be less than 5MB');
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    editingDependentPhotoPreview.value = e.target.result;
  };
  reader.readAsDataURL(file);
}

async function handleActivateWithClose(id) {
  try {
    const response = await updatedependantstatus(id, 'ACTIVE');
    if (response.success) {
      toasted(true, 'Dependent activated successfully', '');
      await notifyDependentUpdated();
    } else {
      // toasted(false, '', response.error || 'Failed to activate dependent');
    }
  } catch (error) {
    // toasted(false, '', 'An error occurred while activating');
    console.error('Activate error:', error);
  }
}

async function handleDeactivateWithClose(id) {
  try {
    const response = await updatedependantstatus(id, 'SUSPENDED');
    if (response.success) {
      toasted(true, 'Dependent deactivated successfully', '');
      await notifyDependentUpdated();
    } else {
      // toasted(false, '', response.error || 'Failed to deactivate dependent');
    }
  } catch (error) {
    // toasted(false, '', 'An error occurred while deactivating');
    console.error('Deactivate error:', error);
  }
}
</script>

<style scoped>
.input-compact {
  padding: 0.5rem;
  font-size: 0.875rem;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>