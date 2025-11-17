<script setup>
import { ref, computed } from 'vue';
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import { closeModal } from "@customizer/modal-x";
import Form from "@/components/new_form_builder/Form.vue";
import Input from "@/components/new_form_elements/Input.vue";
import Button from "@/components/Button.vue";
import { useApiRequest } from "@/composables/useApiRequest";
import { createCoverage } from "../api/groupServiceApi";
import Select from "@/components/new_form_elements/Select.vue";
import Switch from "@/components/Switch.vue";
import PackageSelector from "@/components/PackageSelector.vue";
import { useRoute } from "vue-router";
import { toasted } from '@/utils/utils';
import { useFamily } from '../store/FamilyStore';
const familysStore = useFamily();
const route = useRoute();
const packageUuids = ref([]);
const coverageApi = useApiRequest();
const planType = ref('Individual_Plan');
const currentStep = ref(1);
const totalSteps = 2;

const isIndividualPlan = computed(() => planType.value === 'Individual_Plan');

function handleCreateCoverage({ values }) {
  const processedValues = {
    ...values,
    packageUuids: packageUuids.value || [],
    planType: planType.value,
    status: 'ACTIVE',
    payerInstitutionContractUuid: route.params.id || '',
    maxBenefitForEmployee: Number(values.maxBenefitForEmployee) || 0,
    maxBenefitForSpouse: isIndividualPlan.value ? 0 : Number(values.maxBenefitForSpouse) || 0,
    maxBenefitForChildren: isIndividualPlan.value ? 0 : Number(values.maxBenefitForChildren) || 0,
    familyPoolBenefit: isIndividualPlan.value ? 0 : Number(values.familyPoolBenefit) || 0,
    maxAllowedDependants: isIndividualPlan.value ? 0 : Number(values.maxAllowedDependants) || 0,
    maxAllowedDependantAge: isIndividualPlan.value ? 0 : Number(values.maxAllowedDependantAge) || 0,
    excessAllowed: Boolean(values.excessAllowed)
  };

  console.log("Submitting:", processedValues);

  coverageApi.send(
    () => createCoverage(processedValues),
    (res) => {
      if (res.success) {
         familysStore.add(res.data);
        toasted(res.success,"Coverage plan created successfully!", res.error);
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
      :title="currentStep === 1 ? 'Select Packages & Plan Type' : 'Configure Benefits'"
      subtitle="Create New Coverage Plan"
    >
      <Form
        class="grid grid-cols-1 gap-8 p-6"
        id="coverageForm"
        v-slot="{ submit }"
        :initial-values="{
          maxBenefitForEmployee: 0,
          maxBenefitForSpouse: 0,
          maxBenefitForChildren: 0,
          familyPoolBenefit: 0,
          maxAllowedDependants: 0,
          maxAllowedDependantAge: 0,
          excessAllowed: false
        }"
      >
        <!-- Step Indicator -->
        <div class="flex items-center justify-center mb-6">
          <div class="flex items-center">
            <div 
              class="w-8 h-8 rounded-full flex items-center justify-center font-bold"
              :class="currentStep >= 1 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'"
            >
              1
            </div>
            <div 
              class="w-16 h-1 mx-2"
              :class="currentStep >= 2 ? 'bg-primary' : 'bg-gray-200'"
            ></div>
            <div 
              class="w-8 h-8 rounded-full flex items-center justify-center font-bold"
              :class="currentStep >= 2 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'"
            >
              2
            </div>
          </div>
        </div>

        <!-- Step 1 -->
        <Transition name="fade" mode="out-in">
          <div v-if="currentStep === 1" class="space-y-8">
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 class="text-lg font-bold text-gray-900 mb-4">Select Benefit Packages</h3>
              <PackageSelector
                v-model="packageUuids"
                label=""
                validation="required"
              />
            </div>

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
                    ? 'border-primary bg-blue-50' 
                    : 'border-gray-200 hover:border-blue-300'"
                >
                  <div class="flex items-center">
                    <div class="w-5 h-5 rounded-full border flex items-center justify-center mr-3"
                      :class="planType === option.value ? 'border-primary bg-blue-500' : 'border-gray-300'">
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

        <!-- Step 2 -->
        <Transition name="fade" mode="out-in">
          <div v-if="currentStep === 2" class="space-y-8">
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 class="text-lg font-bold text-gray-900 mb-6">Benefit Limits</h3>
              <div class="space-y-4">
                <Input
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

            <Transition name="fade">
              <div v-if="!isIndividualPlan" class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 class="text-lg font-bold text-gray-900 mb-6">Dependent Settings</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    name="maxAllowedDependants"
                    label="Max Number of Dependents"
                    type="number"
                    :attributes="{ min: 0 }"
                    class="bg-gray-50 rounded-lg"
                  />
                  <Input
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

            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <Switch
                name="excessAllowed"
                label="Allow Excess Payments"
                description="Enable if members can pay additional costs beyond coverage"
              />
            </div>

            <div class="flex justify-between">
              <Button
                @click.prevent="prevStep"
                type="secondary"
                class="border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-lg"
              >
                Back
              </Button>
              <Button
                :pending="coverageApi.pending.value"
                type="primary"
                class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
                @click.prevent="submit(handleCreateCoverage)"
              >
                Create Coverage Plan
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
