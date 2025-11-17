<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { 
  ethiopianRegions, 
  getCitiesByRegion, 
  getSubCitiesByCity 
} from '@/components/ethiopianLocations';
import ModalFormSubmitButton from '@/components/new_form_builder/ModalFormSubmitButton.vue';

const props = defineProps({
  initialData: {
    type: Object,
    default: () => ({})
  },
  isEdit: {
    type: Boolean,
    default: false
  },
  pending: {
    type: Boolean,
    default: false
  },
  onSubmit: {
    type: Function,
    required: true
  },
  onCancel: {
    type: Function,
    required: true
  }
});

// Form data
const providerUuid = ref('');
const providerLogo = ref(null); 
const providerName = ref('');
const threeDigitAcronym = ref('');
const category = ref('');
const telephone = ref('');
const countryCode = ref('+251');
const state = ref('Addis Ababa');
const address3 = ref(''); // City
const address2 = ref(''); // Sub City
const address1 = ref(''); // Woreda
const tin = ref('');
const email = ref('');
const memo = ref('');
const previewImage = ref('');

// Computed properties
const availableCities = computed(() => getCitiesByRegion(state.value));
const availableSubCities = computed(() => getSubCitiesByCity(address3.value));
const isAddisAbaba = computed(() => state.value === 'Addis Ababa');

// Initialize form data
onMounted(() => {
  if (props.initialData && Object.keys(props.initialData).length > 0) {
    providerUuid.value = props.initialData.providerUuid || '';
    providerName.value = props.initialData.providerName || '';
    threeDigitAcronym.value = props.initialData.threeDigitAcronym || '';
    category.value = props.initialData.category || '';
    state.value = props.initialData.state || 'Addis Ababa';
    address3.value = props.initialData.address3 || '';
    address2.value = props.initialData.address2 || '';
    address1.value = props.initialData.address1 || '';
    tin.value = props.initialData.tinNumber || '';
    email.value = props.initialData.email || '';
    memo.value = props.initialData.description || props.initialData.memo || '';

    const fullTelephone = props.initialData.telephone || '';
    telephone.value = fullTelephone.startsWith('+251') ? fullTelephone.slice(4) : fullTelephone;

    // Always set the preview image from initial data
    if (props.initialData.logoBase64) {
      previewImage.value = props.initialData.logoBase64;
      // Convert base64 to blob for submission
      providerLogo.value = base64ToBlob(props.initialData.logoBase64, 'logo.png');
    } else if (props.initialData.logoUrl) {
      previewImage.value = props.initialData.logoUrl;
      // If we have a logo URL but no base64, we need to handle this
      // For now, we'll fetch the image and convert to blob
      fetchLogoFromUrl(props.initialData.logoUrl);
    }
    
    console.log('Initial data loaded with logo:', !!previewImage.value);
  }
});

// Helper function to convert base64 to blob
function base64ToBlob(base64Data, filename) {
  try {
    // Check if base64Data is a data URL or raw base64
    const base64 = base64Data.includes('base64,') 
      ? base64Data.split(',')[1] 
      : base64Data;
    
    const byteCharacters = atob(base64);
    const byteArrays = [];
    
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);
      
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    
    const blob = new Blob(byteArrays, { type: 'image/png' });
    return new File([blob], filename, { type: 'image/png' });
  } catch (error) {
    console.error('Error converting base64 to blob:', error);
    return null;
  }
}

// Function to fetch logo from URL and convert to blob
async function fetchLogoFromUrl(url) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    providerLogo.value = new File([blob], 'logo.png', { type: blob.type });
    console.log('Logo fetched from URL and converted to file');
  } catch (error) {
    console.error('Error fetching logo from URL:', error);
  }
}

const categoryOptions = [
  'Government provider',
  'Private provider',
  'NGO provider'
];

function handleSubmit() {
  console.log('=== FORM SUBMISSION START ===');
  
  // Create the providerRequest object as expected by the backend
  const providerRequest = {
    providerUuid:providerUuid.value,
    providerName: providerName.value,
    threeDigitAcronym: threeDigitAcronym.value,
    category: category.value,
    telephone: `${countryCode.value}${telephone.value}`,
    state: state.value,
    address3: address3.value, // City
    address2: address2.value, // Sub City
    address1: address1.value, // Woreda
    address: `${address1.value}, ${address2.value}, ${address3.value}, ${state.value}`, // Combined address
    tinNumber: tin.value,
    email: email.value,
    description: memo.value,
    country: 'Ethiopia',
    // Add other required fields from Swagger
    to_company: '', // Add this field if needed
    format: '', // Add this field if needed
    address4: '', // Add missing address fields
    address5: '',
    address6: '',
    address7: '',
    status: 'ACTIVE'
  };

  // Include providerUuid for edits
  if (props.isEdit && providerUuid.value) {
    providerRequest.providerUuid = providerUuid.value;
  }

  console.log('Provider Request:', providerRequest);

  // Prepare the final payload structure
  const formData = new FormData();
  
  // Append providerRequest as JSON string
  formData.append('providerRequest', JSON.stringify(providerRequest));
  
  // ALWAYS append logo if it exists - don't check for changes
  if (providerLogo.value) {
    console.log('Adding file to FormData with parameter name "file":', providerLogo.value);
    formData.append('logo', providerLogo.value);
  } else {
    console.log('WARNING: No logo file available for submission');
  }

  // Debug: Log FormData contents
  console.log('FormData contents:');
  for (let [key, value] of formData.entries()) {
    console.log(`- ${key}:`, value);
  }

  console.log('=== FORM SUBMISSION END ===');

  props.onSubmit(formData);
}

</script>

<template>
  <form @submit.prevent="handleSubmit" class="bg-white rounded-xl shadow-sm">
    <!-- Provider Information Section -->
    <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100 mb-6">
      <div class="flex items-center gap-3 mb-6">
        <div class="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
          </svg>
        </div>
        <div>
          <h3 class="text-xl font-bold text-gray-800">Provider Information</h3>
          <p class="text-sm text-gray-600">Basic details about the healthcare provider</p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Provider Logo - READONLY -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700">
            Provider logo
          </label>
          <div class="flex items-center gap-4">
            <div v-if="previewImage" class="relative">
              <img :src="previewImage" alt="Logo preview" class="h-20 w-20 object-cover rounded-lg border-2 border-gray-200" />
            </div>
            <div v-else class="h-20 w-20 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
              <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
            </div>
            <div class="flex-1">
              <p class="text-sm text-gray-500">Logo from external system</p>
            </div>
          </div>
        </div>
        
        <!-- Provider Name and Acronym -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700">
            Provider Name <span class="text-red-500">*</span>
          </label>
          <div class="flex w-full gap-2">
            <input
              v-model="threeDigitAcronym"
              placeholder="ABC"
              class="w-20 p-3 bg-gray-50 border-2 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              maxlength="3"
              pattern="^[A-Z]{3}$"
              title="Three-digit acronym must be uppercase letters"
              required
              readonly
            />
            <input
              v-model="providerName"
              placeholder="Provider legal name"
              class="flex-1 p-3 bg-gray-50 border-2 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              readonly
            />
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        <!-- Category -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700">
            Category <span class="text-red-500">*</span>
          </label>
          <select
            v-model="category"
            class="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
            disabled
          >
            <option value="">Select company category</option>
            <option v-for="option in categoryOptions" :key="option" :value="option">
              {{ option }}
            </option>
          </select>
        </div>
        
        <!-- Phone Number -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700">
            Phone Number <span class="text-red-500">*</span>
          </label>
          <div class="flex w-full gap-2">
            <select
              v-model="countryCode"
              class="w-20 p-3 bg-gray-50 border-2 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              disabled
            >
              <option value="+251">+251</option>
            </select>
            <input
              v-model="telephone"
              placeholder="Phone number"
              class="flex-1 p-3 bg-gray-50 border-2 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              readonly
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Address Information Section -->
    <div class="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100 mb-6">
      <div class="flex items-center gap-3 mb-6">
        <div class="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
        </div>
        <div>
          <h3 class="text-xl font-bold text-gray-800">Address Information</h3>
          <p class="text-sm text-gray-600">Location details of the provider</p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- State/Region -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700">
            State/Region 
          </label>
          <select
            v-model="state"
            class="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled
          >
            <option value="">Select State/Region</option>
            <option v-for="region in ethiopianRegions" :key="region" :value="region">
              {{ region }}
            </option>
          </select>
        </div>
        
        <!-- City -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700">
            City 
          </label>
          <select
            v-if="availableCities.length > 0"
            v-model="address3"
            class="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled
          >
            <option value="">Select City</option>
            <option v-for="city in availableCities" :key="city" :value="city">
              {{ city }}
            </option>
          </select>
          <input
            v-else
            v-model="address3"
            placeholder="Enter City"
            class="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            readonly
          />
        </div>
        
        <!-- Sub City -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700">
            Sub City 
          </label>
          <select
            v-if="isAddisAbaba && availableSubCities.length > 0"
            v-model="address2"
            class="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled
          >
            <option value="">Select Sub City</option>
            <option v-for="subCity in availableSubCities" :key="subCity" :value="subCity">
              {{ subCity }}
            </option>
          </select>
          <input
            v-else
            v-model="address2"
            placeholder="Enter Sub City"
            class="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            readonly
          />
        </div>
        
        <!-- Woreda -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700">
            Woreda 
          </label>
          <input
            v-model="address1"
            placeholder="Enter Woreda"
            class="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            readonly
          />
        </div>
      </div>
    </div>

    <!-- Additional Information Section -->
    <div class="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100 mb-6">
      <div class="flex items-center gap-3 mb-6">
        <div class="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
          </svg>
        </div>
        <div>
          <h3 class="text-xl font-bold text-gray-800">Additional Information</h3>
          <p class="text-sm text-gray-600">Tax and contact details</p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- TIN -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700">
            TIN <span class="text-red-500">*</span>
          </label>
          <input
            v-model="tin"
            placeholder="Tax Identification Number"
            class="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
            readonly
          />
        </div>
        
        <!-- Email -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700">
            Provider's Email 
          </label>
          <input
            v-model="email"
            type="email"
            placeholder="provider@example.com"
            class="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
            readonly
          />
        </div>
      </div>
      
      <!-- Description -->
      <div class="space-y-2 mt-4">
        <label class="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          v-model="memo"
          placeholder="Provider description"
          rows="3"
          class="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          readonly
        ></textarea>
      </div>
    </div>
    
    <!-- Form Actions -->
    <div class="pt-4 px-6 border-t border-gray-200 flex justify-end space-x-4">
      <button
        type="button"
        @click="props.onCancel"
        class="text-gray-700 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
        :disabled="pending"
      >
        Back
      </button>
    
       <ModalFormSubmitButton
        :pending="pending"
        :btn-text="isEdit ? 'Update Provider' : 'Add Provider'"
        class="bg-[#02676B] hover:bg-[#014F4F] text-white px-6 py-3 border-[#02676B] hover:border-[#014F4F]"
      />
    </div>
  </form>
</template>

<style scoped>
input[readonly], select[disabled], textarea[readonly] {
  @apply bg-gray-100 cursor-not-allowed;
}

/* Enhanced select dropdown styling */


/* Smooth transitions */
* {
  transition: all 0.2s ease-in-out;
}
</style>