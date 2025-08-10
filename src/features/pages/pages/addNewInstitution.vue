<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from '@/toast/store/toast';
import { useApiRequest } from "@/composables/useApiRequest";
import DefaultPage from "@/components/DefaultPage.vue";
import CustomInput from "@/components/forms/custom/input.vue";
import icons from "@/utils/icons";

const toast = useToast();
const router = useRouter();
const apiRequest = useApiRequest();

// Form data
const formData = ref({
  institutionName: '',
  tinNumber: '',
  email: '',
  telephone: '',
  category: '',
  address1: '',
  address2: '',
  address3: '',
  state: '',
  country: 'Ethiopia'
});

// Form validation refs
const inputRefs = ref({
  name: null,
  email: null,
  category: null,
  telephone: null,
  state: null,
  city: null,
  subCity: null,
  woreda: null
});

const isLoading = ref(false);

const saveContract = async () => {
  // Validate all inputs
  Object.values(inputRefs.value).forEach(ref => ref?.validateInput());
  
  // Check if any errors exist
  const hasErrors = Object.values(inputRefs.value).some(ref => ref?.hasError);
  
  if (hasErrors) return;

  isLoading.value = true;
  
  try {
    const response = await apiRequest.post('/institution', {
      ...formData.value,
      latitude: 0,
      longitude: 0,
      status: 'ACTIVE'
    });

    if (response.data) {
      toast.success('Institution Registered Successfully!');
      router.push({
        name: 'add-institution-contracts',
        params: { Uuid: response.data.institutionUuid }
      });
    }
  } catch (error) {
    toast.error(error.message || 'Failed to save institution');
    console.error(error);
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <DefaultPage title="Add Policy Holders">
    <template #add-action>
      <button
        @click="router.go(-1)"
        class="flex justify-center items-center gap-2 rounded-md px-6 py-4 text-primary bg-gray-100"
      >
        <i v-html="icons.arrow_left"></i>
        <p class="text-base">Back</p>
      </button>
    </template>

    <template #default>
      <div class="w-full mx-auto bg-white rounded-xl shadow-md overflow-hidden p-8 m-3">
        <div class="grid space-y-4">
          <!-- Policy Holder Information -->
          <div class="sm:col-span-6 text-sm font-semibold bg-gray-100 px-2">
            Policy Holder Information
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <CustomInput 
              type="text" 
              ref="inputRefs.name"
              label="Group Policy Name"
              v-model="formData.institutionName" 
              :max-length="40" 
              :required="true"
            />

            <CustomInput 
              type="text" 
              label="Tin Number"
              v-model="formData.tinNumber" 
              :max-length="25"
            />

            <CustomInput 
              type="text" 
              ref="inputRefs.email"
              label="Email" 
              v-model="formData.email"
              :max-length="35" 
              :required="true" 
              :is-email="true"
            />
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CustomInput 
              type="text" 
              ref="inputRefs.category"
              label="Business Category"
              v-model="formData.category" 
              :required="true"
            />

            <CustomInput 
              type="text" 
              ref="inputRefs.telephone"
              label="Telephone" 
              placeholder="+251910023296"
              v-model="formData.telephone" 
              :max-length="13" 
              :required="true"
              :is-phone="true"
            />
          </div>

          <!-- Address Information -->
          <div class="sm:col-span-6 text-sm font-semibold bg-gray-100 px-2">
            Address Information
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <CustomInput 
              type="text" 
              label="Country"
              v-model="formData.country" 
              :required="true" 
              :disabled="true"
            />

            <CustomInput 
              type="text" 
              ref="inputRefs.state"
              label="State" 
              v-model="formData.state"
              :required="true"
            />

            <CustomInput 
              type="text" 
              ref="inputRefs.city"
              label="City" 
              v-model="formData.address3"
              :required="true"
            />
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CustomInput 
              type="text" 
              ref="inputRefs.subCity"
              label="Sub City" 
              v-model="formData.address2"
              :required="true"
            />

            <CustomInput 
              type="text" 
              ref="inputRefs.woreda"
              label="Woreda" 
              v-model="formData.address1"
              :required="true"
            />
          </div>
        </div>

        <div class="flex justify-end mt-8">
          <button 
            @click="saveContract" 
            :disabled="isLoading"
            class="flex justify-center items-center gap-2 rounded-md px-6 py-4 bg-primary text-white disabled:opacity-50"
          >
            <i v-if="isLoading" v-html="icons.loader"></i>
            <span>{{ isLoading ? 'Processing...' : 'Next' }}</span>
          </button>
        </div>
      </div>
    </template>
  </DefaultPage>
</template>