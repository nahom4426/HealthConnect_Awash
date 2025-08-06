<script setup>
import * as session from '@/scripts/session';
import { useRouter } from 'vue-router';
import LayoutAuthenticated from '@/layouts/LayoutAuthenticated.vue';
import SectionMain from '@/components/section/SectionMain.vue';
import SectionTitleLineWithButton from '@/components/section/SectionTitleLineWithButton.vue';
import { mdiReceiptTextOutline, mdiPlus, mdiEyeOutline } from '@mdi/js';
import { onMounted, ref, computed } from 'vue';
// import { makeAuthenticatedRequest } from '@/scripts/api';
import { useToast } from 'vue-toastification';
import Loader from '@/components/loader/loader.vue';
import Modal from '@/components/modal.vue';


const router = useRouter();
const toast = useToast();
const user = session.getUser();

const Genders = ref([
    { 'name': 'Male' },
    { 'name': 'Female' }
])
const countries = ref([])
const loading = ref(false)
const branches = ref([])
const branch = ref('')

// const fetchInsuranceBranches = async () => {
//     loading.value = true;
//     try {
//         await makeAuthenticatedRequest({
//             method: 'Get',
//             url: '/api/feta/insurance/dropdown',
//         }).then((data) => {
//             branches.value = data;
//             loading.value = false;
//         });
//     } catch (error) {
//         toast.error(error.message)
//     }
// };

onMounted(async () => {

});
</script>
<template>
    <div class="w-full h-max">
        <Modal :open="showDetail" @close="showDetail = !showDetail" :icon="mdiReceiptTextOutline" className="h-9 w-9"
            title="Report Detail" class="pt-10">
        </Modal>
        <SectionMain>
            <SectionTitleLineWithButton :icon="mdiReceiptTextOutline" :title="'Claim  Reports'" main>
            </SectionTitleLineWithButton>
            <div class="mt-8 flow-root">
                <div class="w-full flex flex-row justify-start">
                    <div class="sm:col-span-2 m-4">
                        <div class="mt-1">
                            <input id="beginDate" name="beginDate" v-model="beginDate" type="date"
                                autocomplete="beginDate"
                                class="block w-48 px-2 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
                        </div>
                    </div>
                    <div class="sm:col-span-2">
                        <p class="my-6">to</p>
                    </div>
                    <div class="sm:col-span-2 m-4">
                        <div class="mt-1">
                            <input id="endDate" name="endDate" v-model="endDate" type="date" autocomplete="endDate"
                                class="block w-48 px-2 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
                        </div>
                    </div>
                </div>
                <div class="w-full flex flex-row justify-start">
                    <div class="sm:col-span-1 m-5 flex flex-col items-start">
                        <p class="text-md font-bold">Filter By</p>
                    </div>
                    <div class="sm:col-span-2 m-4 flex items-center">
                        <label for="sex" class="text-md font-medium mr-2">Gender</label>
                        <select name="gender" id="gender" v-model="gender" placeholder="Select Gender"
                            style="inline-size: 200px;"
                            class="truncate block w-full px-4 py-2 rounded-md bg-gray-100 border-1 focus:border-gray-500 focus:bg-white focus:ring-0">
                            <option v-for="gender in Genders" :key="gender.name" :value="gender.name"
                                class="py-1 hover:bg-red-500 hover:text-white">
                                {{ gender.name }}
                            </option>
                        </select>
                    </div>
                    <div class="sm:col-span-2 m-4 flex items-center">
                        <label for="insuranceBranch" class="text-md font-medium mr-2">Branch</label>
                        <select name="branch" id="branch" v-model="branch" placeholder="Select Insurance Branch"
                            style="inline-size: 200px;"
                            class="truncate block w-full px-4 py-2 rounded-md bg-gray-100 border-1 focus:border-gray-500 focus:bg-white focus:ring-0">
                            <option v-for="insurance in branches" :key="insurance.insuranceUuid"
                                :value="insurance.insuranceUuid" class="py-1 hover:bg-red-500 hover:text-white">
                                {{ insurance.branch }}
                            </option>
                        </select>
                    </div>
                    <div class="sm:col-span-2 m-4 flex items-center">
                        <label for="destinationCountry" class="text-md font-medium mr-2">Destination Country</label>
                        <select name="branch" id="branch" v-model="destinationCountry"
                            placeholder="Select Insurance Branch" style="inline-size: 200px;"
                            class="truncate block w-full px-4 py-2 rounded-md bg-gray-100 border-1 focus:border-gray-500 focus:bg-white focus:ring-0">
                            <option v-for="country in countries" :key="country.name" :value="country.name"
                                class="py-1 hover:bg-red-500 hover:text-white">
                                {{ country.name }}
                            </option>
                        </select>
                    </div>
                    <!-- <div class="sm:col-span-2 m-4 flex items-center">
                            <div class="mt-1">
                                <label for="incoming" class="text-md font-medium mr-2">Any thing needed</label>
                                <input type="checkbox" v-model="checked" class="h-8 w-8" />
                            </div>
                        </div> -->
                    <div class="sm:col-span-3 m-2">
                        <div class="mt-1">
                            <button type="submit" @click="filterPolicyPackages"
                                class="bg-primary hover:bg-primary focus:ring-4 text-white focus:outline-none focus:ring-blue-300 font-medium rounded-lg duration-200 text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                                Generate Report
                            </button>
                        </div>
                    </div>
                </div>
                <div class="w-full flex flex-col gap-3">
                    <div class="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                        <div class="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                            <div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                                <table class="min-w-full divide-y divide-gray-300">
                                    <thead class="bg-gray-50">
                                        <tr>
                                            <th scope="col"
                                                class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                                            </th>
                                            <th scope="col"
                                                class="py-3.5 text-left text-sm font-semibold text-gray-900">
                                                Full Name
                                            </th>
                                            <th scope="col"
                                                class="py-3.5 text-left text-sm font-semibold text-gray-900">
                                                Passport Number
                                            </th>
                                            <th scope="col"
                                                class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                                Certificate No.
                                            </th>
                                            <th scope="col"
                                                class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                                Phone
                                            </th>
                                            <th scope="col"
                                                class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                                Status
                                            </th>
                                            <th scope="col"
                                                class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-gray-200 bg-white" v-if="!isLoading">
                                        <tr v-for="(claim, index) in reports" :key="claim.claimUuid"
                                            @click="claimDetailView(claim)" class="cursor-pointer">
                                            <td
                                                class="whitespace-nowrap py-2 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                                {{ index + 1 }}
                                            </td>
                                            <td class="whitespace-nowrap py-2 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6"
                                                v-if="claim.firstName">
                                                {{ claim.firstName }} {{ claim.fatherName }}
                                            </td>
                                            <td class="whitespace-nowrap py-2 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6"
                                                v-else>
                                                {{ claim.insuredFullName }}
                                            </td>
                                            <td class="whitespace-nowrap px-3 py-2 text-sm text-gray-500">
                                                {{ claim.passportNumber }}
                                            </td>
                                            <td class="whitespace-nowrap px-3 py-2 text-sm text-gray-500">
                                                {{ claim.certificateNumber }}
                                            </td>
                                            <td class="whitespace-nowrap px-3 py-2 text-sm text-gray-500">
                                                {{ claim.insuredPhone }}
                                            </td>
                                            <td class="whitespace-nowrap px-3 py-2 text-sm text-gray-500">
                                                {{ claim.status }}
                                            </td>
                                            <td class="whitespace-nowrap px-3 py-2 text-sm text-gray-500">
                                                <div
                                                    class="bg-primary px-2 py-1 w-[50%] text-white text-center cursor-pointer rounded-md">
                                                    <div class="text-base capitalize">view</div>
                                                </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                                <!-- <div class="min-w-full divide-y divide-gray-300 mt-4 items-center mb-4 px-80">
                                        <p>No reports Generated</p>
                                    </div> -->
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
                        No Reports Found
                    </div>
                </div>
            </div>
            <div v-if="isLoading" class="min-w-full flex items-center mx-auto justify-center">
                <Loader />
            </div>
        </SectionMain>
    </div>
</template>
