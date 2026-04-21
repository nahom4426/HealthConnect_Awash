<template>
  <div class="p-6 min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
    <!-- Loading state -->
    <div v-if="loading && !refreshing" class="flex justify-center items-center py-20">
      <div class="w-12 h-12 rounded-full border-4 animate-spin border-primary border-t-primary"></div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="mx-auto max-w-10xl">
      <div class="p-8 text-center bg-red-50 rounded-2xl border border-red-200">
        <svg class="mx-auto mb-4 w-16 h-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="mb-4 text-lg font-semibold text-red-800">{{ error }}</p>
        <button
          @click="fetchInsuredData"
          class="px-6 py-2 font-semibold text-white bg-red-600 rounded-lg transition-colors hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    </div>


    <!-- Content when data is loaded -->
    <div v-else class="mx-auto max-w-10xl">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-4xl font-bold text-gray-900">Insured Person Details</h1>
        <p class="mt-2 text-gray-600">Manage insured person and dependent information</p>
      </div>

      <!-- Tab Navigation -->
      <div class="flex gap-2 p-1 mb-8 bg-white rounded-2xl border border-gray-100 shadow-lg">
        <button
          @click="activeTab = 'details'"
          :class="`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-semibold transition-all ${
            activeTab === 'details'
              ? 'bg-gradient-to-r from-primary to-blue-700 text-white shadow-lg'
              : 'text-gray-700 hover:bg-gray-100'
          }`"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Insured Details
        </button>
        <button
          @click="activeTab = 'dependents'"
          :class="`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-semibold transition-all ${
            activeTab === 'dependents'
              ? 'bg-gradient-to-r from-primary to-blue-700 text-white shadow-lg'
              : 'text-gray-700 hover:bg-gray-100'
          }`"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 3.75l-2.25 2.25-1.5-1.5" />
          </svg>
          Dependents
        </button>
      </div>

      <!-- Tab Content -->
      <div class="p-8 bg-white rounded-2xl border border-gray-100 shadow-lg">
        <!-- Insured Details Tab -->
        <div v-if="activeTab === 'details'" class="animate-fadeIn">
          <InsuredDetailsTab :insuredData="insuredData" />
        </div>

        <!-- Dependents Tab -->
        <div v-else-if="activeTab === 'dependents'" class="animate-fadeIn">
         <DependentsTab 
          :insuredData="insuredData"
          :insuredPersonUuid="insuredPersonUuid"
          @onDependentUpdated="handleDependentUpdated"
        />
        </div>
      </div>
    </div>
  </div>

</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { getInsuredById } from '../api/insuredPersonsApi';
import InsuredDetailsTab from '../components/InsuredDetailsTab.vue';
import DependentsTab from '../components/DependentsTab.vue';

const route = useRoute();
const insuredPersonUuid = route.params.insuredPersonUuid;

const activeTab = ref('dependents');
const loading = ref(true);
const refreshing = ref(false); // Add this for refresh state
const error = ref('');
const insuredData = ref({});

// Handle dependent updates
async function handleDependentUpdated() {
  refreshing.value = true;
  await fetchInsuredData();
  refreshing.value = false;
}

// Fetch insured person data
async function fetchInsuredData() {
  // Don't show main loading if just refreshing
  if (!refreshing.value) {
    loading.value = true;
  }
  
  error.value = '';

  try {
    const response = await getInsuredById(insuredPersonUuid);
    console.log('API Response:', response);

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
              dep.firstName || '',
              dep.fatherName || '',
              dep.grandFatherName || '',
            ]
              .filter(Boolean)
              .join(' ');

            return {
              ...dep,
              fullName,
              age,
              dependantUuid: dep.dependantUuid || dep.id,
              gender: dep.gender || 'Male',
              status: dep.dependantStatus || dep.status || 'ACTIVE',
              relationship: dep.relationship || 'Other',
            };
          }
        );
      } else if (
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
              dep.firstName || '',
              dep.fatherName || '',
              dep.grandFatherName || dep.grandfatherName || '',
            ]
              .filter(Boolean)
              .join(' ');

            return {
              ...dep,
              fullName,
              age,
              dependantUuid: dep.dependantUuid || dep.id,
              gender: dep.gender || 'Male',
              status: dep.status || 'ACTIVE',
              relationship: dep.relationship || 'Other',
              profile: dep.profile || null,
              profilePictureBase64: dep.profilePictureBase64 || null,
            };
          }
        );
      }
    } else {
      error.value = 'Failed to load insured person data';
    }
  } catch (err) {
    console.error('Failed to fetch insured person:', err);
    error.value = 'Failed to load insured person data';
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchInsuredData();
});
</script>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-out;
}
</style>