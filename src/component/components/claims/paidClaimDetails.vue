<script setup>
import * as session from '@/scripts/session';
import { useRouter, useRoute } from 'vue-router';
import LayoutAuthenticated from '@/layouts/LayoutAuthenticated.vue';
import SectionMain from '@/components/section/SectionMain.vue';
import SectionTitleLineWithButton from '@/components/section/SectionTitleLineWithButton.vue';
import SvgIcon from '@jamescoyle/vue-icon';
import { Icon } from '@iconify/vue';
import { mdiReceiptTextOutline } from '@mdi/js';
import { onMounted, ref, computed } from 'vue';
import api from '@/scripts/api';
import { useToast } from 'vue-toastification';
import Loader from '@/components/loader/loader.vue';
import { formatCurrency } from '@/util/utils';

const router = useRouter();
const route = useRoute();
const toast = useToast();
const user = session.getUser();

const claims = ref([{}]);
const providerUuid = ref('');
const isLoading = ref(false);
const title = ref('Paid Claims');
const batchCode = ref('');
const buttonTitle = ref('')

const fetchPaidClaims = async () => {
    isLoading.value = !isLoading.value
    try {
        await api.get(`/claim/payment/settled/list/detail?paymentCode=${route.params.id}&page=1&limit=25`).then((data) => {
            isLoading.value = false;
            claims.value = data;
            batchCode.value = data[0].paymentCode
        });
    } catch (error) {
        isLoading.value = false;
        toast.error(error.message);
    }
}

const ViewVoucher = () => {
    router.push({
        name: 'paymentVoucherSlip',
        params: {
            bCode: batchCode.value
        }
    })
}

const handleModalState = (claim) => {
    router.push({
        name: 'paid-batch-details',
        params: {
            id: claim?.paymentCode,
            Uuid: claim?.institutionUuid
        },
    })
};

onMounted(async () => {
    fetchPaidClaims()
    buttonTitle.value = 'View CPV'
});
</script>
<template>
    <div class="w-full h-max">
        <SectionMain>
            <SectionTitleLineWithButton :icon="mdiReceiptTextOutline" :title="title + ' (' + batchCode + ')'" main>
                <div class="bg-primary px-2 py-1 w-max text-white text-center cursor-pointer rounded-md"
                    @click="ViewVoucher">
                    {{ buttonTitle }}
                </div>
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
                                                Institution Name
                                            </th>
                                            <th scope="col"
                                                class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                                Institution Insurance Number.
                                            </th>
                                            <th scope="col"
                                                class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                                Provider Name
                                            </th>
                                            <th scope="col"
                                                class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                                Total Amount
                                            </th>
                                            <th scope="col"
                                                class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                                Claim Number
                                            </th>
                                            <th scope="col"
                                                class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                                Paid Date
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
                                            <td class="whitespace-nowrap px-3 py-2 text-sm text-gray-500">
                                                {{ claim?.institutionName }}
                                            </td>
                                            <td class="whitespace-nowrap px-3 py-2 text-sm text-gray-500">
                                                {{ claim?.institutionInsuranceNumber }}
                                            </td>
                                            <td class="whitespace-wrap px-3 py-2 text-sm text-gray-500">
                                                {{ claim?.providerName }}
                                            </td>
                                            <td class="whitespace-nowrap px-3 py-2 text-sm text-gray-500">
                                                {{ formatCurrency(claim?.totalAmount) }}
                                            </td>
                                            <td class="whitespace-wrap px-3 py-2 text-sm text-gray-500">
                                                {{ claim?.batchCode }}
                                            </td>
                                            <td class="whitespace-nowrap px-3 py-2 text-sm text-gray-500">
                                                {{ claim?.paidDate }}
                                            </td>
                                            <td class="whitespace-nowrap px-3 py-2 text-sm text-gray-500"
                                                @click="handleModalState(claim)">
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
