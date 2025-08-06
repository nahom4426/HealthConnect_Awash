<script setup>
import api from "@/scripts/api";
import { onMounted, ref } from "vue";
import { useForm, ErrorMessage } from "vee-validate";
import { registerInstitutionSchema } from "@/validations/validations";
import { useToast } from "vue-toastification";

const { errors, handleSubmit, defineInputBinds } = useForm({
    validationSchema: registerInstitutionSchema,
});

const payerInstitutionContractUuid = ref("");
const payerProviderContractUuid = ref("");
const status = ref("Active");

const toast = useToast();

const emit = defineEmits(["save"]);

const UpdateInstitutionContract = async () => {
    try {
        await api.makeAuthenticatedRequest({
            method: "PUT",
            url: `/api/claimconnect/map-contract/${mapContractUuid}`,
            data: {
                payerInstitutionContractUuid: payerInstitutionContractUuid.value,
                payerProviderContractUuid: payerProviderContractUuid.value
            },
        }).then((data) => {
            emit("save", data);
            toast.success("Institution updated successfully");
        });
    } catch {
        toast.error(errors.message);
    }
}

const fetchContractInstitutions = () => {

}

const fetchPayerProviderContract = () => {

}

onMounted(async () => {
    fetchContractInstitutions()
    fetchPayerProviderContract()
})

</script>

<template>
    <div class="space-y-10 divide-y divide-gray-900/10 flex items-center justify-center">
        <div class=" ">
            <form @submit.prevent="onSubmit" class="md:col-span-2">
                <div class="px-4 py-6 sm:p-8">
                    <div class="grid max-w-2xl grid-cols-1 gap-x-6 sm:grid-cols-6">
                        <div class="sm:col-span-6 text-lg mt-2 mb-2 font-semibold bg-gray-100 px-2">Contract Info
                        </div>
                        <div class="sm:col-span-4">
                            <label for="institutionUuid" class="block font-medium leading-6 text-gray-900">Payer
                                Institution
                                Contract Name</label>
                            <div class="mt-1">
                                <select v-model="payerInstitutionContractUuid"
                                    class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:text-xl sm:leading-6">
                                    <option v-for="name in contracts" :key="name.payerInstitutionContractUuid"
                                        :value="name.payerInstitutionContractUuid">{{
                                            name.providerName }}</option>
                                </select>
                                <ErrorMessage name="Institution" class="text-xs text-red-600" />
                            </div>
                        </div>
                        <div class="sm:col-span-4">
                            <label for="institutionUuid" class="block font-medium leading-6 text-gray-900">Payer
                                Provider
                                Contract Name</label>
                            <div class="mt-1">
                                <select v-model="payerProviderContractUuid"
                                    class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:text-xl sm:leading-6">
                                    <option v-for="name in contracts" :key="name.payerProviderContractUuid"
                                        :value="name.payerProviderContractUuid">{{
                                            name.providerName }}</option>
                                </select>
                                <ErrorMessage name="Institution" class="text-xs text-red-600" />
                            </div>
                        </div>
                    </div>
                </div>
                <div class="flex items-center justify-end gap-x-6 border-gray-900/10 px-4 py-4 sm:px-8">
                    <button @click="UpdateInstitutionContract" type="submit"
                        class="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                        Save
                    </button>
                </div>
            </form>
        </div>
    </div>
</template>
