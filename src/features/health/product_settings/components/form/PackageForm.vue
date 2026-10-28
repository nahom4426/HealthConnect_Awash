<script setup>
import Form from "@/components/new_form_builder/Form.vue";
import Input from "@/components/new_form_elements/Input.vue";
import Textarea from "@/components/new_form_elements/Textarea.vue";
import Select from "@/components/new_form_elements/Select.vue";
import Toggle from "@/components/new_form_elements/Toggle.vue";
import { computed, onMounted, ref, watch } from 'vue';
import { getPackages } from "../../api/coverageApi";

const props = defineProps({
  data: {
    type: Object,
    default: () => ({})
  },
  formId: {
    type: String,
    default: "packageForm"
  }
});

console.log('PackageForm props:', props);

// Create a reactive copy of the data
const formData = ref({
  packageName: '',
  packageCategory: '',
  packageDescription: '',
  maxLimit: 0,
  status: 'ACTIVE',
  gender: 'BOTH',
  allServices: false,
  exclusive_benefit: false,
  benefit_pooling: false,
  benefit_pooling_from: null,
});

const allPackages = ref([]);

const currentPackageUuid = computed(() => props?.data?.packageUuid || props?.data?.data?.packageUuid || null);

const cSectionShareOptions = computed(() => {
  return (allPackages.value || [])
    .filter(p => p?.packageUuid && p.packageUuid !== currentPackageUuid.value)
    .map(p => ({ value: p.packageUuid, label: p.packageName }));
});

// Initialize formData when props change
watch(() => props.data, (newData) => {
  if (newData) {
    formData.value = {
      packageName: newData.packageName || '',
      packageCategory: newData.packageCategory || '',
      packageDescription: newData.packageDescription || '',
      maxLimit: newData.maxLimit || 0,
      status: newData.status || 'ACTIVE',
      gender: newData.gender || 'BOTH',
      allServices: newData.allServices || false,
      exclusive_benefit: newData.exclusiveServices || newData.exclusive_benefit || false,
      benefit_pooling: newData.benefit_pooling || false,
      benefit_pooling_from: newData.benefit_pooling_from || null,
    };
  }
}, { immediate: true });

watch(
  () => formData.value.benefit_pooling,
  (enabled) => {
    if (!enabled) {
      formData.value.benefit_pooling_from = null;
    }
  }
);

onMounted(async () => {
  try {
    const res = await getPackages();
    allPackages.value = res?.data || [];
  } catch (e) {
    console.error('Failed to load packages for c_section_share_from:', e);
    allPackages.value = [];
  }
});

const genderOptions = ['BOTH', 'FEMALE', 'MALE'];
const categoryOptions = ['Medical', 'Dental', 'Vision', 'Pharmacy', 'Mental Health', 'Wellness', 'Preventive'];
const statusOptions = ['ACTIVE', 'INACTIVE'];
</script>

<template>
  <Form 
    class="grid grid-cols-1 gap-6 p-6 lg:grid-cols-2" 
    :inner="false" 
    :id="formId" 
    v-slot="{}"
  >
    <!-- Header Section with Gradient -->
    <div class="mb-2 lg:col-span-2">
      <div class="flex gap-2 items-center">
        <div class="w-1 h-8 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full"></div>
        <h3 class="text-lg font-semibold text-gray-900">Package Information</h3>
      </div>
      <p class="mt-1 text-sm text-gray-500">Define the basic details and coverage parameters for this benefit package</p>
    </div>

    <!-- Package Name - Full Width -->
    <div class="lg:col-span-2">
      <Input
        name="packageName"
        validation="required"
        label="Benefit Package Name"
        v-model="formData.packageName"
        :attributes="{
          placeholder: 'e.g. Comprehensive Health Plan, Premium Dental Coverage',
          maxlength: 50
        }"
        hint="Choose a descriptive name that clearly identifies this package"
      />
    </div>

    <!-- Category & Gender - Side by Side -->
    <Select
      name="packageCategory"
      validation="required"
      label="Package Category"
      v-model="formData.packageCategory"
      :options="categoryOptions"
      :attributes="{
        placeholder: 'Select category',
      }"
      hint="Categorize for easier management"
    />

    <Select
      name="gender"
      validation="required"
      label="Gender Eligibility"
      v-model="formData.gender"
      :options="genderOptions"
      hint="Which genders can enroll in this package?"
    />

    <!-- Coverage Limits Section -->
    <div class="pt-6 mt-2 border-t border-gray-200 lg:col-span-2">
      <div class="flex gap-2 items-center mb-1">
        <div class="w-1 h-6 bg-blue-600 rounded-full"></div>
        <h3 class="text-base font-medium text-gray-900">Coverage Configuration</h3>
      </div>
      
      <div class="grid grid-cols-1 gap-6 mt-4 lg:grid-cols-2">
        <Input
          name="maxLimit"
          validation="numeric|min_value:1"
          label="Maximum Coverage Amount"
          v-model="formData.maxLimit"
          :attributes="{
            placeholder: 'e.g. 50000',
            min: '1',
            step: '1000'
          }"
          prefix="$"
          hint="Maximum benefit amount per coverage period"
        />

        <Select
          name="status"
          validation="required"
          label="Package Status"
          v-model="formData.status"
          :options="statusOptions"
          hint="Active packages are available for enrollment"
        />
      </div>
    </div>

    <!-- Package Features Section -->
    <div class="pt-6 mt-2 border-t border-gray-200 lg:col-span-2">
      <div class="flex gap-2 items-center mb-1">
        <div class="w-1 h-6 bg-indigo-600 rounded-full"></div>
        <h3 class="text-base font-medium text-gray-900">Package Features</h3>
      </div>
      <p class="mb-4 text-sm text-gray-500">Configure special features and restrictions for this package</p>
      
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <!-- Service Exclusivity Toggle - Professional naming and description -->
        <div class="p-5 bg-gray-50 rounded-xl border border-gray-200">
          <Toggle
            v-model="formData.exclusive_benefit"
            name="exclusive_benefit"
            label="Service Exclusivity"
            description="When enabled, services assigned to this package cannot be used in any other package"
          />
          <div class="pl-11 mt-3">
            <p class="text-xs text-gray-500">
              <span class="font-medium text-indigo-600">● Exclusive mapping:</span> 
              Services will be dedicated to this package only
            </p>
          </div>
        </div>

        <!-- All Services Toggle -->
        <div class="p-5 bg-gray-50 rounded-xl border border-gray-200">
          <Toggle
            v-model="formData.allServices"
            name="allServices"
            label="Universal Coverage"
            description="Enable to automatically include all available services in this package"
          />
          <div class="pl-11 mt-3">
            <p class="text-xs text-gray-500">
              <span class="font-medium text-blue-600">● Auto-include:</span> 
              New services will be automatically added to this package
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- C-Section Sharing Section -->
    <div class="pt-6 mt-2 border-t border-gray-200 lg:col-span-2">
      <div class="flex gap-2 items-center mb-4">
        <div class="w-1 h-6 bg-purple-600 rounded-full"></div>
        <h3 class="text-base font-medium text-gray-900">Advanced Benefits</h3>
      </div>
      
      <div class="p-5 bg-gray-50 rounded-xl border border-gray-200">
      <Toggle
  v-model="formData.benefit_pooling"
  name="benefit_pooling"
  label="Benefit Pooling"
  description="Enable benefit pooling across packages - unused benefits from other packages can be utilized when this package's coverage limit is reached"
/>

        <!-- C-Section Share From - Conditional -->
        <div v-if="formData.benefit_pooling" class="pl-11 mt-5">
          <Select
            v-model="formData.benefit_pooling_from"
            name="benefit_pooling_from"
            :obj="true"
            :options="cSectionShareOptions"
            :validation="formData.benefit_pooling ? 'required' : ''"
            label="Select Source Package"
            :attributes="{
              placeholder: 'Choose a package to share benefits from',
            }"
            hint="The selected package's C-Section coverage will apply to this package"
          />
          
          <div v-if="cSectionShareOptions.length === 0" class="p-3 mt-3 bg-amber-50 rounded-lg border border-amber-200">
            <p class="flex gap-2 items-center text-xs text-amber-700">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>No other packages available for benefit sharing. Create additional packages first.</span>
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Description - Full Width at Bottom -->
    <div class="lg:col-span-2">
      <Textarea
        name="packageDescription"
        label="Package Description"
        v-model="formData.packageDescription"
        :attributes="{
          placeholder: 'Provide a detailed description of what this package covers, including any limitations or special conditions...',
          rows: 4,
          maxlength: 500
        }"
        hint="Clear description helps members understand their benefits"
      />
    </div>
  </Form>
</template>

<style scoped>
/* Smooth transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Custom styling for form sections */
:deep(.form-section) {
  transition: all 0.2s ease;
}

:deep(.toggle-description) {
  color: #6b7280;
  font-size: 0.875rem;
  line-height: 1.25rem;
}
</style>