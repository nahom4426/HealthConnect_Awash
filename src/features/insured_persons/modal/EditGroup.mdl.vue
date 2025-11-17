<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import { closeModal } from "@customizer/modal-x";
import Form from "@/components/new_form_builder/Form.vue";
import Input from "@/components/new_form_elements/Input.vue";
import Button from "@/components/Button.vue";
import { useApiRequest } from "@/composables/useApiRequest";
import Select from "@/components/new_form_elements/Select.vue";
import Switch from "@/components/Switch.vue";
import PackageSelector from "@/components/PackageSelector.vue";
import { updateCoverage } from '../api/groupServiceApi';
import { toasted } from '@/utils/utils';
import { useFamily } from '../store/FamilyStore';
// import { useFamily } from '../store/familyStore';

const familysStore = useFamily();

const props = defineProps({
  data: Object
});

const coverageApi = useApiRequest();
const packageUuids = ref([]);
const planType = ref('Individual_Plan');
const currentStep = ref(1);
const totalSteps = 2;

// Form initial values - using a more robust structure
const formValues = ref({
  maxBenefitForEmployee: 0,
  maxBenefitForSpouse: 0,
  maxBenefitForChildren: 0,
  familyPoolBenefit: 0,
  maxAllowedDependants: 0,
  maxAllowedDependantAge: 0,
  excessAllowed: false
});
console.log("Received packages data:", props.data);
console.log("Received packages data:", props.data.packages);
console.log("Converted packageUuids:", packageUuids.value);
// Initialize form with existing data
onMounted(() => {
  if (props.data) {
    // Handle packageUuids - ensure it's always an array
  
    // Handle packageUuids - convert packages object to array of UUIDs
    if (props.data.packages && typeof props.data.packages === 'object') {
      packageUuids.value = Object.keys(props.data.packages);
    } else {
      packageUuids.value = Array.isArray(props.data.packageUuids) 
        ? [...props.data.packageUuids]
        : props.data.packageUuid 
          ? [props.data.packageUuid]
          : [];
    }
    planType.value = props.data.planType || 'Individual_Plan';
    
    // Update form values with proper type conversion
    formValues.value = {
      maxBenefitForEmployee: Number(props.data.maxBenefitForEmployee) || 0,
      maxBenefitForSpouse: Number(props.data.maxBenefitForSpouse) || 0,
      maxBenefitForChildren: Number(props.data.maxBenefitForChildren) || 0,
      familyPoolBenefit: Number(props.data.familyPoolBenefit) || 0,
      maxAllowedDependants: Number(props.data.maxAllowedDependants) || 0,
      maxAllowedDependantAge: Number(props.data.maxAllowedDependantAge) || 0,
      excessAllowed: Boolean(props.data.excessAllowed)
    };

    console.log("Initialized values:", {
      packageUuids: packageUuids.value,
      planType: planType.value,
      formValues: formValues.value
    });
  }
});

const isIndividualPlan = computed(() => planType.value === 'Individual_Plan');

// Watch for plan type changes
watch(planType, (newVal) => {
  if (newVal === 'Individual_Plan') {
    // Reset family-specific values when switching to individual plan
    formValues.value = {
      ...formValues.value,
      maxBenefitForSpouse: 0,
      maxBenefitForChildren: 0,
      familyPoolBenefit: 0,
      maxAllowedDependants: 0,
      maxAllowedDependantAge: 0
    };
  }
});

function handleUpdateCoverage() {
  // Create a shallow copy of props.data without the packages property
  const { packages, ...dataWithoutPackages } = props.data;
  
  // Use the reactive formValues directly
  const processedValues = {
    ...dataWithoutPackages, // Spread all props.data except packages
    ...formValues.value,
    packageUuids: packageUuids.value,
    planType: planType.value,
    // Ensure all numbers are properly converted
    maxBenefitForEmployee: Number(formValues.value.maxBenefitForEmployee) || 0,
    maxBenefitForSpouse: isIndividualPlan.value ? 0 : Number(formValues.value.maxBenefitForSpouse) || 0,
    maxBenefitForChildren: isIndividualPlan.value ? 0 : Number(formValues.value.maxBenefitForChildren) || 0,
    familyPoolBenefit: isIndividualPlan.value ? 0 : Number(formValues.value.familyPoolBenefit) || 0,
    maxAllowedDependants: isIndividualPlan.value ? 0 : Number(formValues.value.maxAllowedDependants) || 0,
    maxAllowedDependantAge: isIndividualPlan.value ? 0 : Number(formValues.value.maxAllowedDependantAge) || 0,
    excessAllowed: Boolean(formValues.value.excessAllowed)
  };

  console.log("Submitting values:", processedValues);

coverageApi.send(
  () => updateCoverage(props.data.allowedUuid, processedValues),
  (res) => {
    if (res.success) {
      // Create the full updated object to store
      const updatedData = {
        ...props.data,
        ...processedValues,
        packages: props.data.packages // preserve original packages
      };
      familysStore.update(props.data.allowedUuid, updatedData);
      toasted(res.success, "Coverage plan updated successfully!", res.error);
      closeModal();
    }
  }
);
}

function nextStep() {
  currentStep.value++;
}

function prevStep() {
  currentStep.value--;
}
</script>

<template>
  <ModalParent>
    <NewFormParent
      size="lg"
      :title="currentStep === 1 ? 'Edit Packages & Plan Type' : 'Edit Benefits'"
      subtitle="Update Coverage Plan"
    >
      <Form
        class="grid grid-cols-1 gap-8 p-6"
        id="editCoverageForm"
        v-slot="{ values }"
        :key="`form-${currentStep}`"
        :initial-values="formValues"
        @submit="handleUpdateCoverage"
      >
        <!-- Step Indicator -->
        <div class="flex items-center justify-center mb-6">
          <!-- ... (keep existing step indicator code) -->
        </div>

        <!-- Step 1: Package Selection and Plan Type -->
        <Transition name="fade" mode="out-in">
          <div v-if="currentStep === 1" class="space-y-8">
            <!-- Package Selection -->
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 class="text-lg font-bold text-gray-900 mb-4">Benefit Packages</h3>
              <PackageSelector
                v-model="packageUuids"
                label=""
                validation="required"
              />
            </div>

            <!-- Plan Type -->
              <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 class="text-lg font-bold text-gray-900 mb-4">Plan Type</h3>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div 
                  v-for="option in [
                    { value: 'Individual_Plan', label: 'Individual' },
                    { value: 'Family_Plan', label: 'Family' },
                    { value: 'Family_Shared_Plan', label: 'Family Shared' }
                  ]"
                  :key="option.value"
                  @click="planType = option.value"
                  class="p-4 border rounded-lg cursor-pointer transition-all"
                  :class="planType === option.value 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-blue-300'"
                >
                  <div class="flex items-center">
                    <div class="w-5 h-5 rounded-full border flex items-center justify-center mr-3"
                      :class="planType === option.value ? 'border-blue-500 bg-blue-500' : 'border-gray-300'">
                      <div v-if="planType === option.value" class="w-2 h-2 rounded-full bg-white"></div>
                    </div>
                    <span class="font-medium">{{ option.label }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex justify-end">
              <Button
                @click.prevent="nextStep"
                type="primary"
                class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
                :disabled="!packageUuids.length"
              >
                Continue
              </Button>
            </div>
          </div>
        </Transition>

        <!-- Step 2: Benefit Configuration -->
        <Transition name="fade" mode="out-in">
          <div v-if="currentStep === 2" class="space-y-8">
            <!-- Debug current values -->
            <div v-if="false" class="bg-gray-100 p-4 rounded-lg">
              <pre>Current form values: {{ values }}</pre>
              <pre>Current planType: {{ planType }}</pre>
              <pre>Stored formValues: {{ formValues }}</pre>
            </div>

            <!-- Benefit Limits -->
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 class="text-lg font-bold text-gray-900 mb-6">Benefit Limits</h3>
              <div class="space-y-4">
                <Input
                  v-model="formValues.maxBenefitForEmployee"
                  name="maxBenefitForEmployee"
                  label="Employee Max Benefit"
                  type="number"
                  :attributes="{ min: 0, step: 100 }"
                  prefix="$"
                  class="bg-gray-50 rounded-lg"
                />

                <TransitionGroup name="fade">
                  <div v-if="!isIndividualPlan" key="spouse-benefit">
                    <Input
                      v-model="formValues.maxBenefitForSpouse"
                      name="maxBenefitForSpouse"
                      label="Spouse Max Benefit"
                      type="number"
                      :attributes="{ min: 0, step: 100 }"
                      prefix="$"
                      class="bg-gray-50 rounded-lg"
                    />
                  </div>
                  <div v-if="!isIndividualPlan" key="children-benefit">
                    <Input
                      v-model="formValues.maxBenefitForChildren"
                      name="maxBenefitForChildren"
                      label="Children Max Benefit"
                      type="number"
                      :attributes="{ min: 0, step: 100 }"
                      prefix="$"
                      class="bg-gray-50 rounded-lg"
                    />
                  </div>
                  <div v-if="!isIndividualPlan" key="family-pool">
                    <Input
                      v-model="formValues.familyPoolBenefit"
                      name="familyPoolBenefit"
                      label="Family Pool Benefit"
                      type="number"
                      :attributes="{ min: 0, step: 100 }"
                      prefix="$"
                      class="bg-gray-50 rounded-lg"
                    />
                  </div>
                </TransitionGroup>
              </div>
            </div>

            <!-- Dependent Settings -->
            <Transition name="fade">
              <div v-if="!isIndividualPlan" class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 class="text-lg font-bold text-gray-900 mb-6">Dependent Settings</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    v-model="formValues.maxAllowedDependants"
                    name="maxAllowedDependants"
                    label="Max Number of Dependents"
                    type="number"
                    :attributes="{ min: 0 }"
                    class="bg-gray-50 rounded-lg"
                  />
                  <Input
                    v-model="formValues.maxAllowedDependantAge"
                    name="maxAllowedDependantAge"
                    label="Max Dependent Age"
                    type="number"
                    :attributes="{ min: 0 }"
                    suffix="years"
                    class="bg-gray-50 rounded-lg"
                  />
                </div>
              </div>
            </Transition>

            <!-- Excess Allowed -->
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <Switch
                v-model="formValues.excessAllowed"
                name="excessAllowed"
                label="Allow Excess Payments"
                description="Enable if members can pay additional costs beyond coverage"
              />
            </div>

            <!-- Form Actions -->
            <div class="flex justify-between">
              <Button
                @click.prevent="prevStep"
                type="secondary"
                class="border border-gray-300 text-white bg-gray-600 hover:bg-gray-500 px-6 py-3 rounded-lg"
              >
                Back
              </Button>
              <Button
                :pending="coverageApi.pending.value"
                type="primary"
                class="bg-primary hover:bg-primary-100 text-white px-6 py-3 rounded-lg"
                @click.prevent="handleUpdateCoverage"
              >
                Update Coverage Plan
              </Button>
            </div>
          </div>
        </Transition>
      </Form>
    </NewFormParent>
  </ModalParent>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.fade-move {
  transition: transform 0.3s ease;
}

.radio-option {
  transition: all 0.2s ease;
}
.radio-option:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}
</style>