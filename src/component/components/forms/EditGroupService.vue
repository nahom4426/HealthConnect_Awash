<script setup>
import api from "@/scripts/api";
import { onMounted, ref, toRefs, watch } from "vue";
import { useRoute } from "vue-router";
import { useToast } from "vue-toastification";
import loader from "@/components/loader/loader.vue";
import customInput from "@/components/forms/custom/input.vue";
import familyPlans from '@/scripts/plans';

const toast = useToast();
const route = useRoute();

const props = defineProps({
  services: {
    type: Object,
    required: true,
  },
});

const { services } = toRefs(props);

const isLoading = ref(false);
const plans = ref([]);
const item = ref(services.value.item);
const familyPoolBenefit = ref(services.value.familyPoolBenefit);
const maxBenefitForEmployee = ref(services.value.maxBenefitForEmployee);
const maxBenefitForSpouse = ref(services.value.maxBenefitForSpouse);
const maxBenefitForChildren = ref(services.value.maxBenefitForChildren);
const maxAllowedDependants = ref(services.value.maxAllowedDependants);
const maxAllowedDependantAge = ref(services.value.maxAllowedDependantAge);
const planType = ref(services.value.planType);
const excessAllowed = ref(services.value.excessAllowed)

const emit = defineEmits(["save"]);

watch(maxBenefitForEmployee, (newVal) => {
  maxBenefitForEmployee.value = newVal.toLocaleString();
})

const UpdateService = async () => {
  try {
    await api.put(`/insured-service/${services.value.allowedUuid}`,
      {
        payerInstitutionContractUuid: route.params.id,
        packageUuid: services.value.packageUuid,
        maxBenefitForEmployee: maxBenefitForEmployee.value,
        maxBenefitForSpouse: maxBenefitForSpouse.value,
        maxBenefitForChildren: maxBenefitForChildren.value,
        familyPoolBenefit: familyPoolBenefit.value,
        maxAllowedDependants: maxAllowedDependants.value,
        maxAllowedDependantAge: maxAllowedDependantAge.value,
        planType: planType.value,
        status: 'ACTIVE',
        excessAllowed: excessAllowed.value
      }).then((data) => {
        toast.success(data.message);
        emit("save");
      });
  } catch (e) {
    toast.error(e.message);
  }
};

onMounted(async () => {
  plans.value = familyPlans
});
</script>

<template>
  <div class="space-y-10 divide-y divide-gray-900/10 flex items-center justify-center">
    <div v-if="isLoading" class="flex items-center justify-center h-[40vh]">
      <loader />
    </div>
    <div v-if="!isLoading">
      <form @submit.prevent="onSubmit" class="md:col-span-2">
        <div class="px-4 py-6 sm:p-8">
          <div class="flex max-w-2xl gap-x-1 sm:grid-cols-6">
            <div class="sm:col-span-6 text-sm font-semibold bg-gray-100 px-2">
              Service Details
            </div>
            <div class="flex flex-wrap">
              <div class="flex flex-col space-y-1 m-2 flex-grow">
                <customInput type="text" label="Service Name" v-model="item" placeholder="" :required="true"
                  class="cursor-not-allowed" :disabled="true" />
              </div>
              <div class="flex flex-col space-y-1 m-2 flex-grow">
                <label for="selectPlan">Select Plan</label>
                <select v-model="planType"
                  class="block w-60 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:leading-6">
                  <option v-for="plan in plans" :key="plan.name" :value="plan.name">
                    {{ plan.name }}
                  </option>
                </select>
              </div>
              <div class="flex flex-col space-y-1 m-2 flex-grow" v-if="planType === 'Family_Plan'">
                <customInput type="number" label="Family Pool Benefit" v-model="familyPoolBenefit" placeholder=""
                  :required="true" :disabled="true" />
              </div>
              <div class="flex flex-col space-y-1 m-2 flex-grow"
                v-if="planType === 'Individual_Plan' || planType === 'Family_Shared_Plan'">
                <customInput type="text" label="Employee Benefit" v-model="maxBenefitForEmployee" placeholder=""
                  :required="true" :disabled="true" />
              </div>
              <div class="flex flex-col space-y-1 m-2 flex-grow"
                v-if="planType === 'Individual_Plan' || planType === 'Family_Shared_Plan'">
                <customInput type="text" label="Spouse Benefit" v-model="maxBenefitForSpouse" placeholder=""
                  :required="true" :disabled="true" />
              </div>
              <div class="flex flex-col space-y-1 m-2 flex-grow"
                v-if="planType === 'Individual_Plan' || planType === 'Family_Shared_Plan'">
                <customInput type="text" label="Children Benefit" v-model="maxBenefitForChildren" placeholder=""
                  :required="true" :disabled="true" />
              </div>
              <div class="flex flex-col space-y-1 m-2 flex-grow">
                <customInput type="number" label="Max. Dependent Age" v-model="maxAllowedDependantAge" placeholder=""
                  :required="true" :disabled="true" />
              </div>
              <div class="flex flex-col space-y-1 m-2 flex-grow">
                <customInput type="number" label="Max. Allowed Dependents" v-model="maxAllowedDependants" placeholder=""
                  :required="true" :disabled="true" />
              </div>

              <div class="flex flex-col flex-grow">
                <label class="p-1 mt-2" for="Excess Allowed">Excess Allowed</label>
                <input type="checkbox" v-model="excessAllowed" placeholder="" :required="true" class="p-2 mt-2" />
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>
