<script setup>
import Form from '@/components/new_form_builder/Form.vue';
import Input from '@/components/new_form_elements/Input.vue';
import Select from '@/components/new_form_elements/Select.vue';
import { ref, computed, watch } from 'vue';
import { useRoute } from 'vue-router';

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
const emit = defineEmits(["submit"]);

const route = useRoute();

// Helper function to convert ISO date to YYYY-MM-DD format
const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  try {
    return dateString.split('T')[0];
  } catch (err) {
    console.error('Error formatting date:', err);
    return '';
  }
};

// Form state with props data or defaults
const formData = ref({
  contractName: props.data?.contractName || '',
  policyNumber: props.data?.policyNumber || '',
  benefit: props.data?.benefit || 0,
  premium: props.data?.premium || 0,
  beginDate: formatDateForInput(props.data?.beginDate) || '',
  endDate: formatDateForInput(props.data?.endDate) || '',
  status: props.data?.status || 'ACTIVE'
});

function getInstitutionCode(name) {
  const cleaned = String(name || '').trim();
  if (!cleaned) return 'INST';

  const parts = cleaned.split(/\s+/).filter(Boolean);
  const initials = parts.map(p => p[0]).join('').toUpperCase();

  if (initials.length >= 3) return initials.slice(0, 3);
  return cleaned.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 3) || 'INST';
}

function applyAutoDefaults() {
  if (props.isEdit) return;

  const institutionName = props.data?.institutionName || route.params?.institutionName;
  const suffix = Date.now().toString().slice(-5);
  const instCode = getInstitutionCode(institutionName);

  const today = new Date();
  const nextYear = new Date(today);
  nextYear.setFullYear(today.getFullYear() + 1);
  const todayStr = today.toISOString().split('T')[0];
  const nextYearStr = nextYear.toISOString().split('T')[0];

  if (!formData.value.contractName) {
    formData.value.contractName = `${institutionName || 'Institution'} Awash ${suffix}`;
  }
  if (!formData.value.policyNumber) {
    formData.value.policyNumber = `${instCode}-AWS-${suffix}`;
  }

  if (!formData.value.beginDate) {
    formData.value.beginDate = todayStr;
  }
  if (!formData.value.endDate) {
    formData.value.endDate = nextYearStr;
  }
}

applyAutoDefaults();

// Watch for changes in props.data and update formData with formatted dates
watch(() => props.data, (newData) => {
  if (newData) {
    formData.value = {
      contractName: newData.contractName || '',
      policyNumber: newData.policyNumber || '',
      benefit: newData.benefit || 0,
      premium: newData.premium || 0,
      beginDate: formatDateForInput(newData.beginDate) || '',
      endDate: formatDateForInput(newData.endDate) || '',
      status: newData.status || 'ACTIVE'
    };

    applyAutoDefaults();
  }
}, { deep: true });

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
  if (validateForm()) {
    emit('submit', formData.value);
  } else {
    console.warn('⚠️ Form validation failed', formData.value);
  }
};


</script>

<template>
  <Form id="create-contract-form" :inner="false" class="p-6 space-y-8">
    <!-- Contract Information Section -->
    <div class="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
      <div class="flex gap-3 items-center mb-6">
        <div class="flex justify-center items-center w-10 h-10 bg-blue-500 rounded-lg">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
        </div>
        <div>
          <h3 class="text-xl font-bold text-gray-800">Contract Details</h3>
          <p class="text-sm text-gray-600">Basic information about the contract</p>
        </div>
      </div>
      
      <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Input
          name="contractName"
          label="Policy Name"
          validation="required"
          v-model="formData.contractName"
          :attributes="{ 
            placeholder: 'e.g., MedcoTech Awash 12345',
          }"
        />
        <Input
          name="policyNumber"
          label="Policy Number"
          validation="required"
          v-model="formData.policyNumber"
          :attributes="{ 
            placeholder: 'e.g., MED-AWS-12345',
          }"
        />
      </div>
    </div>

    <!-- Financial Information Section -->
     <div class="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
      <div class="flex gap-3 items-center mb-6">
        <div class="flex justify-center items-center w-10 h-10 bg-green-500 rounded-lg">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <div>
          <h3 class="text-xl font-bold text-gray-800">Financial Details</h3>
          <p class="text-sm text-gray-600">Benefit and premium amounts</p>
        </div>
      </div>
      
      <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Input
          name="benefit"
          label="Benefit Amount"
          type="number"
          validation="numeric"
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
          validation="numeric"
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
    <div class="p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
      <div class="flex gap-3 items-center mb-6">
        <div class="flex justify-center items-center w-10 h-10 bg-purple-500 rounded-lg">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
        </div>
        <div>
          <h3 class="text-xl font-bold text-gray-800">Timeline & Status</h3>
          <p class="text-sm text-gray-600">Contract validity period and current status</p>
        </div>
      </div>
      
      <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
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
              placeholder: 'MM/DD/YYYY',
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
      <div v-if="!isDateValid && formData.beginDate && formData.endDate" class="p-3 mt-4 bg-red-50 rounded-lg border border-red-200">
        <div class="flex gap-2 items-center">
          <svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span class="text-sm font-medium text-red-600">End date must be after the effective date</span>
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