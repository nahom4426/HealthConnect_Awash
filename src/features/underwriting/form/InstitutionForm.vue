<script setup>
import Form from "@/components/new_form_builder/Form.vue";
import Input from "@/components/new_form_elements/Input.vue";
import Select from "@/components/new_form_elements/Select.vue";
import { ethiopianRegions, getCitiesByRegion, getSubCitiesByCity } from "@/components/ethiopianLocations";
import { ref, computed, watch } from "vue";

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}) // Provide empty object as default
  },
  isEdit: {
    type: Boolean,
    default: false
  },
  showLocationSection: Boolean,
  showAdditionalSection: Boolean
});

const emit = defineEmits(["toggle-location", "toggle-additional"]);

// Initialize form state with props data or defaults
const formData = ref({
  // Basic info
  institutionName: props.data?.institutionName || '',
  tinNumber: props.data?.tinNumber || '',
  email: props.data?.email || '',
  telephone: props.data?.telephone || '',
  category: props.data?.category || '',
  description: props.data?.description || '',
  
  // Location info
  state: props.data?.state || 'Addis Ababa',
  address1: props.data?.address1 || '', // woreda
  address2: props.data?.address2 || '', // subCity
  address3: props.data?.address3 || '', // city
  country: props.data?.country || 'Ethiopia',
  latitude: props.data?.latitude || 9.145,
  longitude: props.data?.longitude || 40.4897,
  
  // Additional info
  referralType: props.data?.referralType || 'On Man',
  referredBy: props.data?.referredBy || '',
  
  // System fields
  institutionUuid: props.data?.institutionUuid || ''
});

// Computed values for location dropdowns
const availableCities = computed(() => getCitiesByRegion(formData.value.state));
const availableSubCities = computed(() => getSubCitiesByCity(formData.value.address3));
const isAddisAbaba = computed(() => formData.value.state === "Addis Ababa");

// Watchers for dependent field resets
watch(() => formData.value.state, () => {
  formData.value.address3 = '';
  formData.value.address2 = '';
});

watch(() => formData.value.address3, () => {
  formData.value.address2 = '';
});

// Handle map location change
const openMapPicker = () => {
  console.log("Open map picker");
};
</script>

<!-- The template remains the same -->
<template>
  <Form id="institution-form" :inner="false" class="space-y-8 p-6">
    <!-- Basic Information Section -->
    <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
      <div class="flex items-center gap-3 mb-6">
        <div class="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
          </svg>
        </div>
        <div>
          <h3 class="text-xl font-bold text-gray-800">Basic Information</h3>
          <p class="text-sm text-gray-600">Essential details about the institution</p>
        </div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input 
          name="institutionName" 
          label="Institution Name" 
          validation="required"
          v-model="formData.institutionName"
          :attributes="{ 
            placeholder: 'Enter institution name',
          }"
        />
        <Input 
          name="tinNumber" 
          label="TIN Number" 
          validation="required"
          type="number"
          v-model="formData.tinNumber"
          :attributes="{ 
            placeholder: 'Enter TIN number',
          }"
        />
        <Input 
          name="email" 
          label="Email Address" 
          validation="required|email"
          v-model="formData.email"
          :attributes="{ 
            placeholder: 'institution@example.com',
          }"
        />
        <Input 
          name="telephone" 
          label="Phone Number"
          validation="required"
          v-model="formData.telephone"
          :attributes="{ 
            placeholder: '+251 911 123 456',
          }"
        />
        <Input 
          name="category" 
          label="Institution Category"
          v-model="formData.category"
          :attributes="{ 
            placeholder: 'Hospital, Clinic, Health Center',
          }"
        />
        <Input 
          name="description" 
          label="Description"
          v-model="formData.description"
          :attributes="{ 
            placeholder: 'Brief description of services',
          }"
        />
      </div>
    </div>

    <!-- Location Information Section -->
    <div class="border border-gray-200 rounded-xl overflow-hidden">
      <button 
        type="button"
        @click="emit('toggle-location')"
        class="w-full flex items-center justify-between p-6 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 transition-colors duration-200"
      >
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
          </div>
          <div class="text-left">
            <h3 class="text-xl font-bold text-gray-800">Location Information</h3>
            <p class="text-sm text-gray-600">Address and geographical details</p>
          </div>
        </div>
        <svg 
          class="w-5 h-5 text-gray-600 transition-transform duration-200" 
          :class="{ 'rotate-180': showLocationSection }"
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      <div v-show="showLocationSection" class="p-6 space-y-6 bg-white">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Region/State -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Region/State</label>
            <Select
              name="state"
              v-model="formData.state"
              :options="ethiopianRegions"
              :attributes="{
                placeholder: 'Select region',
              }"
            />
          </div>

          <!-- City -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">City</label>
            <Select
              name="address3"
              v-if="availableCities.length > 0"
              v-model="formData.address3"
              :options="availableCities"
              :attributes="{
                placeholder: 'Select city',
              }"
            />
            <Input
              v-else
              v-model="formData.address3"
              :attributes="{
                placeholder: 'Enter city name',
              }"
            />
          </div>

          <!-- Sub City (only for Addis) -->
          <div v-if="isAddisAbaba">
            <label class="block text-sm font-semibold text-gray-700 mb-2">Sub City</label>
            <Select
              name="address2"
              v-if="availableSubCities.length > 0"
              v-model="formData.address2"
              :options="availableSubCities"
              :attributes="{
                placeholder: 'Select sub city',
              }"
            />
            <Input
              v-else
              v-model="formData.address2"
              :attributes="{
                placeholder: 'Enter sub city',
              }"
            />
          </div>

          <!-- Woreda -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Woreda</label>
            <Input
              name="address1"
              v-model="formData.address1"
              :attributes="{
                placeholder: 'Enter woreda',
              }"
            />
          </div>

          <!-- Country -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Country</label>
            <Input
              name="country"
              v-model="formData.country"
              :attributes="{
                readonly: true,
                placeholder: 'Ethiopia',
              }"
            />
          </div>

          <!-- Map Coordinates -->
          <div class="md:col-span-2">
            <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <label class="block text-sm font-semibold text-gray-700 mb-3">GPS Coordinates</label>
                  <div class="grid grid-cols-2 gap-4">
                    <div class="bg-white p-3 rounded-lg border border-gray-200">
                      <div class="text-xs text-gray-500 mb-1">Latitude</div>
                      <div class="font-mono text-sm font-semibold text-gray-800">{{ formData.latitude.toFixed(6) }}</div>
                    </div>
                    <div class="bg-white p-3 rounded-lg border border-gray-200">
                      <div class="text-xs text-gray-500 mb-1">Longitude</div>
                      <div class="font-mono text-sm font-semibold text-gray-800">{{ formData.longitude.toFixed(6) }}</div>
                    </div>
                  </div>
                </div>
                <button 
                  type="button"
                  @click="openMapPicker"
                  class="ml-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200 flex items-center gap-2 shadow-md hover:shadow-lg"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                  </svg>
                  Change Location
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Additional Information Section -->
    <div class="border border-gray-200 rounded-xl overflow-hidden">
      <button 
        type="button"
        @click="emit('toggle-additional')"
        class="w-full flex items-center justify-between p-6 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 transition-colors duration-200"
      >
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <div class="text-left">
            <h3 class="text-xl font-bold text-gray-800">Additional Information</h3>
            <p class="text-sm text-gray-600">Referral and partnership details</p>
          </div>
        </div>
        <svg 
          class="w-5 h-5 text-gray-600 transition-transform duration-200" 
          :class="{ 'rotate-180': showAdditionalSection }"
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      <div v-show="showAdditionalSection" class="p-6 space-y-6 bg-white">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Referral Type</label>
            <Select
              name="referralType"
              v-model="formData.referralType"
              :options="['On Man', 'Government', 'Private', 'Other']"
              :attributes="{
                placeholder: 'Select referral type',
              }"
            />
          </div>
          
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Referred By</label>
            <Input
              name="referredBy"
              v-model="formData.referredBy"
              :attributes="{
                placeholder: 'Enter referrer name',
              }"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Hidden status field -->
    <input type="hidden" name="status" value="ACTIVE" />
  </Form>
</template>

<style scoped>
/* Enhanced form styling */
:deep(.form-control) {
  @apply border-2 border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block w-full p-3 transition-all duration-200;
}

:deep(.form-select) {
  @apply border-2 border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block w-full p-3 transition-all duration-200;
}

/* Enhanced select dropdown styling */
:deep(select) {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.75rem center;
  background-repeat: no-repeat;
  background-size: 1.25em 1.25em;
  padding-right: 3rem;
}

/* Smooth transitions */
* {
  transition: all 0.2s ease-in-out;
}
div[v-show] {
  transition: all 0.3s ease-in-out;
}
</style>
