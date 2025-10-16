<script setup>
import Form from '@/components/new_form_builder/Form.vue';
import Input from '@/components/new_form_elements/Input.vue';
import Select from '@/components/new_form_elements/Select.vue';
import { ref, computed } from 'vue';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({})
  },
  isEdit: {
    type: Boolean,
    default: false
  }
});
console.log(props.data);
const emit = defineEmits(["submit"]);

// Form state with props data or defaults
const formData = ref({
  contractName: props.data?.contractName || '',
  contractCode: props.data?.contractCode || '',
  benefit: props.data?.benefit || 0,
  premium: props.data?.premium || 0,
  beginDate: props.data?.beginDate || '',
  endDate: props.data?.endDate || '',
  status: props.data?.status || 'ACTIVE'
});
console.log(formData.value);

const statusOptions = ['PENDING', 'ACTIVE', 'RENEWED','EXPIRED'];
const submitAttempted = ref(false);

// Date validation
const isDateValid = computed(() => {
  if (formData.value.beginDate && formData.value.endDate) {
    return new Date(formData.value.endDate) > new Date(formData.value.beginDate);
  }
  return true;
});

const validateForm = () => {
  submitAttempted.value = true;
  return isDateValid.value;
};

const submit = () => {
  console.log('🔹 ContractForm submit triggered with data:', formData.value);
  if (validateForm()) {
    emit('submit', formData.value);
  } else {
    console.warn('⚠️ Form validation failed', formData.value);
  }
};

console.log();

</script>

<template>
  <Form id="create-contract-form" :inner="false" class="space-y-8 p-6">
    <!-- Contract Information Section -->
    <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
      <div class="flex items-center gap-3 mb-6">
        <div class="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
        </div>
        <div>
          <h3 class="text-xl font-bold text-gray-800">Contract Details</h3>
          <p class="text-sm text-gray-600">Basic information about the contract</p>
        </div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          name="contractName"
          label="Policy Name"
          validation="required"
          v-model="formData.contractName"
          :attributes="{ 
            placeholder: 'e.g., Premium Health Plan',
          }"
        />
        <Input
          name="contractCode"
          label="Policy Code"
          validation="required"
          v-model="formData.contractCode"
          :attributes="{ 
            placeholder: 'e.g., PHP-001',
          }"
        />
      </div>
    </div>

    <!-- Financial Information Section -->
    <div class="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
      <div class="flex items-center gap-3 mb-6">
        <div class="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <div>
          <h3 class="text-xl font-bold text-gray-800">Financial Details</h3>
          <p class="text-sm text-gray-600">Benefit and premium amounts</p>
        </div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          name="benefit"
          label="Benefit Amount"
          type="number"
          validation="required|numeric"
          v-model="formData.benefit"
          :attributes="{ 
            placeholder: '0.00', 
            step: '0.01', 
            min: '0'
          }"
        />
        <Input
          name="premium"
          label="Premium Amount"
          type="number"
          validation="required|numeric"
          v-model="formData.premium"
          :attributes="{ 
            placeholder: '0.00', 
            step: '0.01', 
            min: '0'
          }"
        />
      </div>
    </div>

    <!-- Timeline & Status Section -->
    <div class="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
      <div class="flex items-center gap-3 mb-6">
        <div class="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
        </div>
        <div>
          <h3 class="text-xl font-bold text-gray-800">Timeline & Status</h3>
          <p class="text-sm text-gray-600">Contract validity period and current status</p>
        </div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Input
          name="beginDate"
          label="Effective Date"
          validation="required"
          v-model="formData.beginDate"
          :attributes="{
             type : 'date',
            min: new Date().toISOString().split('T')[0] // Today's date as minimum
          }"
          :error="!formData.beginDate && submitAttempted"
          :error-message="!formData.beginDate && submitAttempted ? 'Effective date is required' : ''"
        />
        
        <Input
          name="endDate"
          label="End Date"
          validation="required"
          v-model="formData.endDate"
          :attributes="{
              type : 'date',
            min: formData.beginDate || new Date().toISOString().split('T')[0]
          }"
          :error="(!formData.endDate || !isDateValid) && submitAttempted"
          :error-message="
            !formData.endDate && submitAttempted ? 'End date is required' : 
            (!isDateValid && submitAttempted ? 'End date must be after effective date' : '')
          "
        />
        
        <Select
          name="status"
          label="Status"
          validation="required"
          v-model="formData.status"
          :options="statusOptions"
          :attributes="{ 
            placeholder: 'Select status',
          }"
        />
      </div>
      
      <!-- Date validation error message -->
      <div v-if="!isDateValid && formData.beginDate && formData.endDate" class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
        <div class="flex items-center gap-2">
          <svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span class="text-sm text-red-600 font-medium">End date must be after the effective date</span>
        </div>
      </div>
    </div>
  </Form>
</template>

<style scoped>
:deep(.form-control),
:deep(.form-select) {
  @apply border-2 border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block w-full p-3 transition-all duration-200;
}

:deep(.error) {
  @apply border-red-500 focus:ring-red-500 focus:border-red-500;
}

.error-message {
  @apply text-red-500 text-xs mt-1;
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
</style>