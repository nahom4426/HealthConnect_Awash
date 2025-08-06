<script setup>
import api from "@/scripts/api";
import { onMounted, ref, toRefs, watch } from "vue";
import { useRoute } from "vue-router";
import { useToast } from "vue-toastification";
import loader from "@/components/loader/loader.vue";
import customInput from "@/components/forms/custom/input.vue";

const toast = useToast();
const route = useRoute();
const emit = defineEmits(["close"]);

const props = defineProps({
    Uuid: {
        type: String,
        required: true
    }
})

const { Uuid } = toRefs(props);

const isLoading = ref(false);
const providedDate = ref('');
const serviceCoverage = ref('');
const serviceDescription = ref('');
const amount = ref('');
const services = ref([]);

const fetchServices = async () => {
    isLoading.value = true;
    await api.get(`/cash-service/list/${Uuid.value}`,).then((data) => {
        services.value = data;
        emit('close');
        isLoading.value = false;
    });
};

const UpdateService = async () => {
    try {
        await api.put(`/insured-service/${services.value.allowedUuid}`, {
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
        });
    } catch (e) {
        toast.error(e.message);
    }
};

onMounted(async () => {
    //fetchServices();
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
                            Cash Service Details
                        </div>
                        <div class="flex flex-wrap">
                            <div class="flex flex-col space-y-1 m-2 flex-grow">
                                <customInput type="date" label="Service Provided Date" v-model="providedDate"
                                    placeholder="" :required="true" class="cursor-not-allowed" :disabled="true" />
                            </div>
                            <!-- <div class="flex flex-col space-y-1 m-2 flex-grow">
                                <label for="selectPlan">Select Service Coverage</label>
                                <select v-model="serviceCoverage"
                                    class="block w-60 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:leading-6">
                                    <option v-for="plan in plans" :key="plan.name" :value="plan.name">
                                        {{ plan.name }}
                                    </option>
                                </select>
                            </div> -->
                            <div class="flex flex-col space-y-1 m-2 flex-grow">
                                <customInput type="text" label="Service Coverage" v-model="serviceCoverage"
                                    placeholder="" :required="true" class="cursor-not-allowed" :disabled="true" />
                            </div>
                            <div class="flex flex-col space-y-1 m-2 flex-grow">
                                <customInput type="text" label="Service Description" v-model="serviceDescription"
                                    placeholder="" :required="true" class="cursor-not-allowed" :disabled="true" />
                            </div>
                            <div class="flex flex-col space-y-1 m-2 flex-grow">
                                <customInput type="text" label="Amount" v-model="amount" placeholder="" :required="true"
                                    :disabled="true" />
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    </div>
</template>
