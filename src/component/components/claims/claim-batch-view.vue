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
import customInput from '@/components/forms/custom/input.vue';
import Modal from '@/components/modal.vue';
import { formatCurrency } from '@/util/utils';

const router = useRouter();
const route = useRoute();
const toast = useToast();
const user = session.getUser();

const claims = ref([{}]);
const isLoading = ref(false);
const title = ref('Requested Payment');
const selectAll = ref(false)
const selected = ref([])
const params = ref([])
const approveModal = ref(false)
const claimCheckLoading = ref(false)
const openCheckNumber = ref(false)
const buttonTitle = ref('')
const checkNumber = ref('')
const description = ref('')
const openRemark = ref(false)

console.log(user);

const fetchRequestedForPayment = async () => {
    isLoading.value = !isLoading.value
    try {
        await api.get(`/claim/payment/requested/list/detail?batchCode=${route.params.id}&providerUuid=${route.params.Uuid}&status=${route.params.status}&page=1&limit=25`,).then((data) => {
            isLoading.value = false;
            claims.value = data;
        });
    } catch (error) {
        isLoading.value = false;
        toast.error(error.message);
    }
}

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

const handleClaimChecked = () => {
    console.log(route.params.status);
    if (route.params.status === 'Authorized') {
        openCheckNumber.value = !openCheckNumber.value
    } else {
        openRemark.value = !openRemark.value
    }
}

params.value = selected.value.map((claim) => {
    return {
        claimUuid: claim.claimUuid,
        providerUuid: user?.providerUuid,
        checkNumber: checkNumber.value,
        transactionNumber: '',
        paidByFullName: user?.firstName + ' ' + user?.fatherName
    }
});

const handleModalState = (claimUuid) => {
    router.push({ name: 'claim-detail-page', params: { id: claimUuid, status: route.params.status } });
};

onMounted(async () => {
    fetchRequestedForPayment()
});
</script>
<template>
    <div class="w-full h-max">

        <SectionMain>
            <SectionTitleLineWithButton :icon="mdiReceiptTextOutline" title="Completed Services" main>
            </SectionTitleLineWithButton>
            <div class="mt-1 flow-root">
                <div class="w-full flex flex-col gap-3">
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
                                                Claim Amount
                                            </th>
                                            <th scope="col"
                                                class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-gray-200 bg-white">
                                        <tr v-for="(claim, index) in claims" :key="claim.claimUuid"
                                            class="cursor-pointer even:bg-gray-100">
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
                        No Claims Found
                    </div>
                </div>
            </div>
            <div v-if="isLoading" class="min-w-full flex items-center mx-auto justify-center">
                <Loader />
            </div>
        </SectionMain>
    </div>
</template>
