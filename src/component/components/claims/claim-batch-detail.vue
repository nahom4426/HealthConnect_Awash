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
const batchCode = ref('');
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
const paymentMethod = ref('')
const paymentWay = ref('')
const creditClaimBatchCode = ref('')
const importedFile = ref(null)


const currentRole = computed(() => {
    console.log("gehrfveuwathbvrhjtivurt " + user?.personalInfos.role);
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

const confirmApprove = async () => {
    claimCheckLoading.value = true;
    const role = user?.personalInfos.role;

    if (route.params.Uuid === 'cash') {
        if ((role === 'Reviewer' || role === 'Admin') && route.params.status === 'Requested') {
            await api.put(`/cash-credit/process/credit-request`, {
                comment: description.value,
                creditClaimBatchCode: creditClaimBatchCode.value,
                cashCreditUuidRequest: selected.value.map(service => {
                    return { cashCreditUuid: service.cashCreditUuid };
                })
            }).then((data) => {
                toast.success(data.message);
                router.push('/ClaimManagement/Processed-Claims');
                claimCheckLoading.value = false;
            });
        } else if ((role === 'Checker' || role === 'Admin') && route.params.status === 'Processed') {
            await api.put(`/cash-credit/check/credit-request`, {
                comment: description.value,
                creditClaimBatchCode: creditClaimBatchCode.value,
                cashCreditUuidRequest: selected.value.map(service => {
                    return { cashCreditUuid: service.cashCreditUuid };
                })
            }).then((data) => {
                toast.success(data.message);
                router.push('/ClaimManagement/Checked-Claims');
                claimCheckLoading.value = false;
            });
        } else if ((role === 'Approver' || role === 'Admin') && route.params.status === 'Checked') {
            await api.put(`/cash-credit/approve/credit-request`, {
                comment: description.value,
                creditClaimBatchCode: creditClaimBatchCode.value,
                cashCreditUuidRequest: selected.value.map(service => {
                    return { cashCreditUuid: service.cashCreditUuid };
                })
            }).then((data) => {
                toast.success(data.message);
                router.push("/ClaimManagement/Approved-Claims");
                claimCheckLoading.value = false;
            });
        } else if ((role === 'Authorizer' || role === 'Admin') && route.params.status === 'Approved') {
            await api.put(`/cash-credit/authorize/credit-request`, {
                comment: description.value,
                creditClaimBatchCode: creditClaimBatchCode.value,
                cashCreditUuidRequest: selected.value.map(service => {
                    return { cashCreditUuid: service.cashCreditUuid };
                })
            }).then((data) => {
                toast.success(data.message);
                router.push('/ClaimManagement/Authorized-Claims');
                claimCheckLoading.value = false;
            });
        } else if ((role === 'Finance' || role === 'Admin') && route.params.status === 'Authorized') {
            await api.put(`/claim/settle/payment`, params.value).then((data) => {
                toast.success(data.message);
                emit('claim-checked');
                router.push('/');
                claimCheckLoading.value = false;
            });
        }
    } else {
        if ((role === 'Reviewer' || role === 'Admin') && route.params.status === 'Requested') {
            await api.put(`/claim/approve/processedBy`, {
                comment: description.value,
                batchCode: batchCode.value,
                claimUuidRequest: selected.value
            }).then((data) => {
                toast.success(data.message);
                router.push('');
                claimCheckLoading.value = false;
            });
        } else if ((role === 'Checker' || role === 'Admin') && route.params.status === 'Processed') {
            await api.put(`/claim/approve/checkedBy`, {
                comment: description.value,
                batchCode: batchCode.value,
                claimUuidRequest: selected.value
            }).then((data) => {
                toast.success(data.message);
                router.push('/');
                claimCheckLoading.value = false;
            });
        } else if ((role === 'Approver' || role === 'Admin') && route.params.status === 'Checked') {
            await api.put(`/claim/approve/approvedBy`, {
                comment: description.value,
                batchCode: batchCode.value,
                claimUuidRequest: selected.value
            }).then((data) => {
                toast.success(data.message);
                router.push('/');
                claimCheckLoading.value = false;
            });
        } else if ((role === 'Authorizer' || role === 'Admin') && route.params.status === 'Approved') {
            await api.put(`/claim/approve/authorizedBy`, {
                comment: description.value,
                batchCode: batchCode.value,
                claimUuidRequest: selected.value
            }).then((data) => {
                toast.success(data.message);
                router.back();
                claimCheckLoading.value = false;
            });
        } else if ((role === 'Finance' || role === 'Admin') && route.params.status === 'Authorized') {
            await api.put(`/claim/settle/payment`, params.value).then((data) => {
                toast.success(data.message);
                emit('claim-checked');
                router.back();
                claimCheckLoading.value = false;
            });
        }
    }
};

const fetchRequestedForPayment = async () => {
    isLoading.value = !isLoading.value
    try {
        await api.get(`/claim/payment/requested/list/detail?batchCode=${route.params.id}&providerUuid=${route.params.Uuid}&status=${route.params.status}&page=1&limit=25`,).then((data) => {
            isLoading.value = false;
            claims.value = data;
            batchCode.value = data[0].batchCode
        });
    } catch (error) {
        isLoading.value = false;
        toast.error(error.message);
    }
}
const fetchCashRequestedForPayment = async () => {
    isLoading.value = !isLoading.value
    try {
        await api.get(`/cash-credit/requested/list/details?batchCode=${route.params.id}&page=1&limit=25`,).then((data) => {
            isLoading.value = false;
            claims.value = data;
            creditClaimBatchCode.value = data[0].batchCode
        });
    } catch (error) {
        isLoading.value = false;
        toast.error(error.message);
    }
}

const handleModalState = (claimUuid) => {
    router.push({ name: 'claim-detail-page', params: { id: claimUuid, Uuid: route.params.id, caId: '10', status: route.params.status } });
};

const approvePayment = () => {
    approveModal.value = !approveModal.value
}

const addRemark = () => {
    approveModal.value = !approveModal.value
}

const handleFileChange = async (event) => {
    importedFile.value = event.target.files[0];
};

const select = () => {
    selected.value = [];
    if (!selectAll.value) {
        claims.value.forEach(claim => {
            selected.value.push(claim);
        })
    }
};

onMounted(async () => {
    if (route.params.Uuid == 'cash') {
        fetchCashRequestedForPayment()
    } else {
        fetchRequestedForPayment()
    }
    if (route.params.status == 'Requested') {
        buttonTitle.value = 'Process'
    } else if (route.params.status == 'Processed') {
        buttonTitle.value = 'Verify'
    } else if (route.params.status == 'Checked') {
        buttonTitle.value = 'Approve'
    } else if (route.params.status == 'Approved') {
        buttonTitle.value = 'Authorize'
    } else {
        buttonTitle.value = ''
    }
});
</script>
<template>
    <div class="w-full h-max">
        <ConfirmModal v-model="approveModal" @confirm="confirmApprove" icon="simple-line-icons:check"
            :title="buttonTitle + ' ' + 'Claim'"
            :description="'Are you sure you want to ' + buttonTitle + ' this claim?'" :confirmButton=buttonTitle
            iconClass="text-primary p-1 text-3xl" iconWrapperClass="bg-primary rounded-full p-1"
            confirmButtonClass="inline-flex w-full justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary sm:ml-3 sm:w-auto duration-300" />

        <Modal :open="openCheckNumber" @close="openCheckNumber = false" title="Payment Details" :autoClose="true">
            <div class="flex flex-col pb-5 m-4">
                <h3 class="flex gap-x-1 font-semibold text-gray-600 mb-3">
                    Payment <span class="text-red-600">*</span>
                </h3>
                <select v-model="paymentMethod"
                    class="block w-60 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:leading-6">
                    <option value="Cash">Cash</option>
                    <option value="BankTransfer">Bank Transfer</option>
                    <option value="Other">Other</option>
                </select>

                <customInput label="" placeholder="Check Number" type="text" v-model="checkNumber" :required="true"
                    v-if="paymentMethod === 'Cash'" />
                <customInput label="" placeholder="Enter Payment Method" type="text" v-model="paymentWay"
                    :required="true" v-else-if="paymentMethod === 'Other'" />
                <div class="sm:col-span-2" v-else-if="paymentMethod === 'BankTransfer'">
                    <label for="Attachment" class="text-sm font-medium text-gray-900">Add Attachment</label>
                    <div class="block mt-1 text-sm font-medium leading-6 text-gray-900">
                        <div
                            class="flex rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600 sm:w-[15rem]">
                            <input type="file" name="attachment" id="attachment"
                                class="px-4 block flex-1 py-1 border-0 bg-transparent text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
                                placeholder="attachment" @change="handleFileChange($event)" />
                        </div>
                        <p class="mt-1 text-sm text-red-600" id="email-error">
                        </p>
                    </div>
                </div>
                <customInput label="" placeholder="amount" type="number" v-model="amount" :required="true"
                    v-if="paymentMethod" />
                <div class="flex justify-end mt-5">
                    <button
                        class="text-lg px-3 py-2 font-semibold text-white bg-primary0 rounded-lg hover:shadow-lg duration-200 hover:bg-primary"
                        @click="approvePayment">
                        Submit
                    </button>
                </div>

            </div>
        </Modal>
        <Modal :open="openRemark" @close="openRemark = false" title="Add Remark" :autoClose="true">
            <div class="flex flex-col w-80 pb-5 mt-8">
                <textarea rows="4" v-model="description" name="description" id="description" placeholder="Remark ..."
                    class="block w-full h-20 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"></textarea>
                <div class="flex justify-end mt-5">
                    <button
                        class="text-lg px-4 py-2 font-semibold text-white bg-primary rounded-lg hover:shadow-lg duration-200 hover:bg-primary"
                        @click="addRemark">
                        Add
                    </button>
                </div>
            </div>
        </Modal>
        <SectionMain>
            <SectionTitleLineWithButton :icon="mdiReceiptTextOutline" :title="title + ' (' + batchCode + ')'" main>
                <div class="bg-primary px-4 py-2 w-max text-white text-center cursor-pointer rounded-md"
                    @click="handleClaimChecked" v-if="$route.params.status != 'Authorized'">
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
                                                #
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
                                            <th scope="col"
                                                class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                                <input type="checkbox" v-model="selectAll" @click="select" />
                                                <i class="form-icon"></i>
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
                                                v-if="claim.relationship === null && !claim?.cashCreditUuid">
                                                {{ claim?.firstName }} {{ claim?.fatherName }} {{ claim?.grandFatherName
                                                }}
                                            </td>
                                            <td class="whitespace-nowrap px-3 py-2 text-sm text-gray-500"
                                                v-else-if="claim?.relationship != null && !claim?.cashCreditUuid">
                                                {{ claim?.dependantFirstName }} {{ claim?.dependantFatherName }} {{
                                                    claim?.dependantGrandFatherName }}
                                            </td>
                                            <td class="whitespace-nowrap px-3 py-2 text-sm text-gray-500"
                                                v-else-if="claim?.cashCreditUuid">
                                                {{ claim?.fullName }}
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
                                            <td
                                                class="whitespace-nowrap py-2 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                                <input type="checkbox" :value="claim" v-model="selected" />
                                                <i class="form-icon"></i>
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
