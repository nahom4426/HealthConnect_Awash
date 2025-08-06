<script setup>
import * as session from '@/scripts/session';
import { useRouter, useRoute } from 'vue-router';
import SectionMain from '@/components/section/SectionMain.vue';
import SectionTitleLineWithButton from '@/components/section/SectionTitleLineWithButton.vue';
import SvgIcon from '@jamescoyle/vue-icon';
import { mdiReceiptTextOutline } from '@mdi/js';
import { onMounted, ref, computed } from 'vue';
import api from '@/scripts/api';
import { useToast } from 'vue-toastification';
import Loader from '@/components/loader/loader.vue';
import ConfirmModal from '@/components/ConfirmModal.vue';
import { formatCurrency } from '@/util/utils';

const router = useRouter();
const route = useRoute();
const toast = useToast();
const user = session.getUser();

const claims = ref([{}]);
const isLoading = ref(false);
const title = ref('Paid Claims');
const batchCode = ref('');
const approveModal = ref(false)
const buttonTitle = ref('')



const currentRole = computed(() => {
    if (user?.personalInfos.role && user?.personalInfos.role == 'ROLE_Finance') {
        return 'Finance';
    } else if (
        user?.personalInfos.role &&
        user?.personalInfos.role == 'PayerClaimReviewer'
    ) {
        return 'Reviewer';
    } else if (
        user?.personalInfos.role &&
        user?.personalInfos.role == 'PayerClaimAuditor'
    ) {
        return 'Auditor';
    } else if (
        user?.personalInfos.role &&
        user?.personalInfos.role == 'PayerClaimApprover'
    ) {
        return 'Approver';
    } else if (
        user?.personalInfos.role &&
        user?.personalInfos.role == 'Superman'
    ) {
        return 'Admin';
    }
});


const fetchRequestedForPayment = async () => {
    isLoading.value = !isLoading.value
    try {
        await api.get(`/claim/payment/settled/patients/list?paymentCode=${route.params.id}&institutionUuid=${route.params.Uuid}&page=1&limit=25`,).then((data) => {
            isLoading.value = false;
            claims.value = data;
            batchCode.value = data[0].batchCode
        });
    } catch (error) {
        isLoading.value = false;
        toast.error(error.message);
    }
}

const handleModalState = (claimUuid) => {
    router.push({ name: 'claim-detail-page', params: { id: claimUuid, Uuid: route.params.id, status: 'Paid' } });
};

onMounted(async () => {
    fetchRequestedForPayment()
});
</script>
<template>
    <div class="w-full h-max">
        <ConfirmModal v-model="approveModal" @confirm="confirmApprove" icon="simple-line-icons:check"
            :title="buttonTitle + ' ' + 'Claim'"
            :description="'Are you sure you want to ' + buttonTitle + ' this claim?'" :confirmButton=buttonTitle
            iconClass="text-primary p-1 text-3xl" iconWrapperClass="bg-primary rounded-full p-1"
            confirmButtonClass="inline-flex w-full justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary sm:ml-3 sm:w-auto duration-300" />
        <SectionMain>
            <SectionTitleLineWithButton :icon="mdiReceiptTextOutline" :title="title + ' (' + batchCode + ')'" main>
            </SectionTitleLineWithButton>
            <div class="mt-1 flow-root">
                <div class="w-full flex flex-col gap-3">
                    <!-- <div class="flex flex-wrap" v-if="addedFilters">
                            <div class="sm:col-span-1 m-6 flex flex-col items-start">
                                <p class="text-md font-bold">Filter By</p>
                            </div>
                            <div class="sm:col-span-2 m-1">
                                <label for="insurance" class="text-sm font-normal">Service Date/from</label>
                                <div class="">
                                    <input id="beginDate" name="beginDate" v-model="beginDate" type="date"
                                        autocomplete="beginDate"
                                        class="block w-full px-4 py-2 rounded-md bg-gray-100 border-1 focus:border-gray-500 focus:bg-white focus:ring-0" />
                                </div>
                            </div>
                            <div class="sm:col-span-2 m-1">
                                <label for="insurance" class="text-sm font-normal">Service Date/to</label>
                                <div class="">
                                    <input id="endDate" name="endDate" v-model="endDate" type="date" autocomplete="endDate"
                                        class="block w-full px-4 py-2 rounded-md bg-gray-100 border-1 focus:border-gray-500 focus:bg-white focus:ring-0" />
                                </div>
                            </div>
                            <div class="sm:col-span-2 m-1">
                                <label for="insurance" class="text-sm font-normal">Insurance Name</label>
                                <div
                                    class="flex rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600 sm:w-[250px]">
                                    <select name="payerUuid" id="payerUuid" v-model="payerUuid"
                                        class="truncate block w-full px-4 py-2 rounded-md bg-gray-100 border-1 focus:border-gray-500 focus:bg-white focus:ring-0">
                                        <option v-for="payer in payers" :key="payer.payerUuid" :value="payer.payerUuid"
                                            class="py-1 hover:bg-red-500 hover:text-white">
                                            {{ payer.payerName }}
                                        </option>
                                    </select>
                                </div>
                            </div>
                        </div> -->
                    <div class="-mx-4 -my-2 overflow-auto sm:-mx-6 lg:-mx-8">
                        <div class="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                            <div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                                <table class="min-w-full divide-y divide-gray-300">
                                    <thead class="bg-gray-50 border-t-2 border-solid border-black">
                                        <tr>
                                            <th scope="col"
                                                class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                                            </th>
                                            <th scope="col"
                                                class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                                                Full Name
                                            </th>
                                            <th scope="col"
                                                class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                                Insurance ID.
                                            </th>
                                            <th scope="col"
                                                class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                                Institution
                                            </th>
                                            <th scope="col"
                                                class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                                Relationship
                                            </th>
                                            <th scope="col"
                                                class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                                Claim Number
                                            </th>
                                            <th scope="col"
                                                class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                                Paid Amount
                                            </th>
                                            <th scope="col"
                                                class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-gray-200 bg-white">
                                        <tr v-for="(claim, index) in claims" :key="claim.claimUuid"
                                            class="cursor-pointer">
                                            <td
                                                class="whitespace-nowrap py-2 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                                {{ index + 1 }}
                                            </td>
                                            <td class="whitespace-nowrap py-2 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6"
                                                v-if="claim.firstName != null">
                                                {{ claim?.firstName }} {{ claim?.fatherName }} {{ claim?.grandFatherName
                                                }}
                                            </td>
                                            <td class="whitespace-nowrap px-3 py-2 text-sm text-gray-500" v-else>
                                                {{ claim?.dependantFirstName }} {{ claim?.dependantFatherName }} {{
                                                    claim?.dependantGrandFatherName }}
                                            </td>
                                            <td class="whitespace-nowrap px-3 py-2 text-sm text-gray-500">
                                                {{ claim?.insuranceId }}
                                            </td>
                                            <td class="whitespace-wrap px-3 py-2 text-sm text-gray-500">
                                                {{ claim?.institutionName }}
                                            </td>
                                            <td class="whitespace-nowrap px-3 py-2 text-sm text-gray-500"
                                                v-if="claim?.relationship != null">
                                                {{ claim?.relationship }}
                                            </td>
                                            <td class="whitespace-nowrap px-3 py-2 text-sm text-gray-500" v-else>
                                                Main Member
                                            </td>
                                            <td class="whitespace-wrap px-3 py-2 text-sm text-gray-500">
                                                {{ claim?.claimCode }}
                                            </td>
                                            <td class="whitespace-nowrap px-3 py-2 text-sm text-gray-500">
                                                {{ formatCurrency(claim?.totalAmount) }}
                                            </td>
                                            <td class="whitespace-nowrap px-3 py-2 text-sm text-gray-500"
                                                @click="handleModalState(claim?.claimUuid)">
                                                <div
                                                    class="bg-primary px-2 py-1 w-[100%] text-white text-center cursor-pointer rounded-md">
                                                    <div class="text-base capitalize">view</div>
                                                </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div v-if="!isLoading && !claims" class="min-w-full flex items-center mx-auto justify-center mt-50">
                <div class="flex flex-col items-center">
                    <div class="round-xl flex gap-0.5 item-center text-black px-3 py-2">
                        <div class="text-[#55555550] h-32 w-32">
                            <svg-icon type="mdi" :path="mdiReceiptTextOutline" class="w-full h-full"></svg-icon>
                        </div>
                    </div>
                    <div class="block font-sans text-2xl antialiased font-Medium leading-relaxed text-inherit">
                        No Paid Claims Found
                    </div>
                </div>
            </div>
            <div v-if="isLoading" class="min-w-full flex items-center mx-auto justify-center">
                <Loader />
            </div>
        </SectionMain>
    </div>
</template>
