<script setup>
import { useRouter, useRoute } from 'vue-router';
import SectionMain from '@/components/section/SectionMain.vue';
import api from '@/scripts/api'
import { mdiPlus, mdiSecurity, mdiAccountMultipleCheckOutline, mdiMenu } from '@mdi/js';
import { onMounted, ref, computed, toRefs, watch } from 'vue';
import Modal from '@/components/modal.vue';
import SectionTitleLineWithButton from '@/components/section/SectionTitleLineWithButton.vue';
import { useToast } from 'vue-toastification';
import Loader from '@/components/loader/loader.vue';
import BaseButton from '@/components/base/BaseButton.vue';
import EditInstitution from '@/components/forms/EditInstitutionPayerProviderContract.vue';
import SvgIcon from '@jamescoyle/vue-icon';
import ConfirmModal from '@/components/ConfirmModal.vue';

const router = useRouter()
const toast = useToast()
const route = useRoute()

const dropdownIndex = ref(null)
const openForm = ref(false)
const isLoading = ref(false)
const bidInstitutions = ref([])
const institutionName = ref('')
const institutionUuid = ref('')
const institutionPhone = ref('')
const insuranceNumber = ref('')
const showInput = ref(false)
const showInput1 = ref(false)
const showInput2 = ref(false)
const showInput3 = ref(false)
const approveModal = ref(false)
const contractCode = ref('')
const selectedInstitution = ref('')
const search = ref(sessionStorage.getItem("searchTerm") || "");

watch(search, (newSearchTerm) => {
    sessionStorage.setItem("searchTerm", newSearchTerm);
    if (newSearchTerm === "") {
        fetchInstitutionsInThisContract('');
    } else {
        fetchInstitutionsInThisContract(newSearchTerm);
    }
});

contractCode.value = route.params.payerProviderContractCode

const props = defineProps({
    payerProviderContractUuid: {
        type: String,
        required: true,
    }
})

const { payerProviderContractUuid } = toRefs(props)

const openModal = (mapContractUuid) => {
    selectedInstitution.value = mapContractUuid
    openForm.value = true
    dropdownIndex.value = null
}

const toggleButton = () => {
    showInput.value = true
}
const toggleButton1 = () => {
    showInput1.value = true
}
const toggleButton2 = () => {
    showInput2.value = true
}

const toggleButton3 = () => {
    showInput3.value = true
}

const displayMenu = (index) => {
    dropdownIndex.value = dropdownIndex.value === index ? null : index;
}

const navigateToAddInstitutionsPage = () => {
    router.push({
        name: 'addInstitutions',
        params: {
            payerProviderContractUuid: payerProviderContractUuid.value
        }
    })
}

const RemoveInstitution = (mapContractUuid) => {
    institutionUuid.value = mapContractUuid
    approveModal.value = !approveModal.value;
}

const removeInstitutions = async (institutionUuid) => {
    isLoading.value = true
    try {
        await api.delete(`/map_contract/${institutionUuid}`).then((data) => {
            isLoading.value = false
            toast.success(data.message)
            if (data) {
                fetchInstitutionsInThisContract()
            }
        })
    } catch (error) {
        isLoading.value = false
        toast.error(error.message)
    }
}

const fetchInstitutionsInThisContract = async (searchKey) => {
    isLoading.value = true
    try {
        await api.get(`/map_contract/institutions-mapped-to-contracts/${payerProviderContractUuid.value}?search=${searchKey}&status=ACTIVE`).then((data) => {
            isLoading.value = false
            bidInstitutions.value = data
        })
    } catch (error) {
        isLoading.value = false
        toast.error(error.message)
    }
}

const filteredItems = computed(() => {
    if (!search.value) {
        return bidInstitutions.value
    } else {
        return bidInstitutions.value.filter(item =>
            item.institutionName.toLowerCase().includes(search.value.toLowerCase()) &&
            item.institutionPhone.toLowerCase().includes(search.value.toLowerCase()) &&
            item.insuranceNumber.toLowerCase().includes(search.value.toLowerCase())
        )
    }
})

onMounted(() => {
    fetchInstitutionsInThisContract('')
})
</script>

<template>
    <div class="w-full h-max">
        <ConfirmModal v-model="approveModal" @confirm="removeInstitutions(serviceUuid)" icon="simple-line-icons:check"
            title="Remove Institution" description="Are you sure you want to Remove this Institution From Contract?"
            confirmButton="Remove" iconClass="text-red p-1 text-3xl" iconWrapperClass="bg-red rounded-full p-1"
            confirmButtonClass="inline-flex w-full justify-center rounded-md bg-red-800 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-900 sm:ml-3 sm:w-auto duration-300" />


        <Modal :open="openForm" @close="openForm = !openForm" :icon="mdiAccountMultipleCheckOutline" className="h-9 w-9"
            title="Edit Contract Detail" class="pt-10">
            <EditInstitution :priceItems="selectedInstitution" />
        </Modal>
        <SectionMain>
            <SectionTitleLineWithButton :icon="mdiSecurity"
                :title="'Institutions in' + ' ' + contractCode + ' ' + 'Contract'" main>
                <div class="flex space-x-2">
                    <form id="searchContractInst" class="w-full md:w-[40%] lg:w-[80%] mt-2">
                        <label for="default-search"
                            class="mb-1 text-sm font-medium text-gray-900 sr-only dark:text-white">Search</label>
                        <div class="relative">
                            <input type="text" v-model="search" id="default-search"
                                class="block w-full px-4 py-2 ps-4 text-sm text-gray-900 border border-gray-300 rounded-lg bg-white focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                placeholder="Search . . ." required />
                        </div>
                    </form>
                    <div class="mt-2">
                        <BaseButton :icon="mdiPlus" title="Assign Institutions to provider contract" color="whiteDark"
                            @click="navigateToAddInstitutionsPage" label="Assign Institution" />
                    </div>
                </div>

            </SectionTitleLineWithButton>
            <div class="mt-1 flow-root">
                <div class="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div class="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        <div class="shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                            <table class="min-w-full divide-y divide-gray-300">
                                <thead class="bg-gray-50 border-t-2 border-solid border-black">
                                    <tr>
                                        <th scope="col"
                                            class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                                            @click="sort('contractCode')">#</th>
                                        <th scope="col"
                                            class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                                            @click="toggleButton">
                                            <div>
                                                <input v-if="showInput" type="text" v-model="institutionName"
                                                    placeholder="Institution Name"
                                                    class="h-4 box-content rounded-md w-25">
                                                <p v-else>
                                                    Institution Name
                                                </p>
                                            </div>
                                        </th>
                                        <th scope="col"
                                            class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                                            @click="sort('payerPhone')">
                                            <div @click="toggleButton1">
                                                <input v-if="showInput1" type="text" v-model="institutionPhone"
                                                    placeholder="Institution Phone"
                                                    class="h-4 box-content rounded-md w-25">
                                                <p v-else>
                                                    Institution Phone
                                                </p>
                                            </div>
                                        </th>
                                        <th scope="col"
                                            class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            <div @click="toggleButton3">
                                                <input v-if="showInput3" type="text"
                                                    v-model="payerInstitutionContractCode" placeholder="Contract Code"
                                                    class="h-4 box-content rounded-md w-25">
                                                <p v-else>
                                                    Contract Code
                                                </p>
                                            </div>
                                        </th>
                                        <th scope="col"
                                            class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                                            @click="sort('payerName')">
                                            <div @click="toggleButton2">
                                                <input v-if="showInput2" type="text" v-model="insuranceNumber"
                                                    placeholder="Insurance Number"
                                                    class="h-4 box-content rounded-md w-25">
                                                <p v-else>
                                                    Insurance Number
                                                </p>
                                            </div>
                                        </th>
                                        <th scope="col"
                                            class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                                            @click="sort('payerName')">
                                            Effective Date
                                        </th>
                                        <th scope="col"
                                            class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                                            @click="sort('payerName')">
                                            End Date
                                        </th>
                                        <th scope="col"
                                            class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                                            @click="sort('payerName')">Premium</th>
                                        <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                            <span class="sr-only">Actions</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-200 bg-white">
                                    <tr v-for="(service, index) in filteredItems" :key="service.mapContractUuid"
                                        class="h-2 box-content even:bg-gray-100">
                                        <td class="whitespace-nowrap px-3 py-2 text-sm text-gray-500">{{ index + 1 }}
                                        </td>
                                        <td class="whitespace-wrap px-3 py-2 text-sm text-gray-500">{{
            service.institutionName }}</td>
                                        <td class="whitespace-wrap px-3 py-2 text-sm text-gray-500">{{
            service.institutionPhone }}</td>
                                        <td class="whitespace-wrap px-3 py-2 text-sm text-gray-500">{{
            service.payerInstitutionContractCode }}</td>
                                        <td
                                            class="whitespace-wrap py-2 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                            {{ service.insuranceNumber }}</td>
                                        <td
                                            class="whitespace-wrap py-2 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                            {{ service.payerInstitutionBeginDate }}</td>
                                        <td
                                            class="whitespace-wrap py-2 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                            {{ service.payerInstitutionEndDate }}</td>
                                        <td class="whitespace-wrap px-3 py-2 text-sm text-gray-500">{{ service.premium
                                            }}</td>
                                        <td
                                            class="relative whitespace-nowrap py-2 pl-3 pr-2 text-right text-sm font-medium sm:pr-6">
                                            <div class="relative inline-block text-left">
                                                <button type="button" @click="displayMenu(index)"
                                                    class="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-indigo-500"
                                                    id="options-menu" aria-haspopup="true">
                                                    <svg-icon type="mdi" :path="mdiMenu"></svg-icon>
                                                </button>

                                                <div v-if="dropdownIndex === index"
                                                    class="origin-top-right absolute right-0 mt-2 mb-2 w-40 rounded-md shadow-lg bg-gray-100 ring-1 ring-black ring-opacity-5 z-20">
                                                    <div class="py-1" role="menu" aria-orientation="horizontal"
                                                        aria-labelledby="options-menu">
                                                        <span @click.prevent="openModal(service.mapContractUuid)"
                                                            class="block px-4 py-2 text-sm hover:bg-white hover:text-gray-900"
                                                            role="menuitem">Edit</span>
                                                        <span
                                                            @click.prevent="RemoveInstitution(service.mapContractUuid)"
                                                            class="block px-4 py-2 text-sm hover:bg-white hover:text-gray-900"
                                                            role="menuitem">Remove Institution</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            <p v-if="filteredItems && filteredItems.length === 0"
                                class="min-w-full divide-y divide-gray-300 mt-4 items-center mb-4 px-80">No Items
                                Were Found</p>
                        </div>
                    </div>
                </div>
            </div>
        </SectionMain>
    </div>
</template>
