<script setup>
import { useRouter, useRoute, onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router';
import SectionMain from '@/components/section/SectionMain.vue';
import api from '@/scripts/api'
import { mdiMenu, mdiHospitalBuilding, mdiPlus, mdiChevronDoubleRight, mdiChevronDoubleLeft } from '@mdi/js';
import { onMounted, ref, computed, toRefs, watch } from 'vue';
import SectionTitleLineWithButton from '@/components/section/SectionTitleLineWithButton.vue';
import { useToast } from 'vue-toastification';
import BaseButton from '@/components/base/BaseButton.vue';
import SvgIcon from '@jamescoyle/vue-icon';
import ConfirmModal from '@/components/ConfirmModal.vue';

const toast = useToast()
const router = useRouter()
const route = useRoute()

const totalPages = ref(null)
const currentPage = ref(1)
const itemsPerPage = ref(25)
const pageSizes = ref([25, 50, 75, 100, 125, 150])
const isLoading = ref(false)
const providers = ref([])
const providerName = ref('')
const phone = ref('')
const level = ref('')
const showLevel = ref(false)
const showName = ref(false)
const showPhone = ref(false)
const approveModal = ref(false)
const dropdownIndex = ref(null)
const institutionName = ref('')
const search = ref(localStorage.getItem('searchTerm') || '');

watch(search, (newSearchTerm) => {
    localStorage.setItem('searchTerm', newSearchTerm);
    if (newSearchTerm === '') {
        fetchProviders(currentPage.value, itemsPerPage.value);
    }
});

const toggleName = () => {
    showName.value = true
}
const togglePhone = () => {
    showPhone.value = true
}
const toggleLevel = () => {
    showLevel.value = true
}

const getInstitution = async () => {
    isLoading.value = true;
    await api.get(`/institution/${route.params.id}`).then((data) => {
        institutionName.value = data.institutionName;
        isLoading.value = false;
    });
};

const navigateToAddProviders = () => {
    router.push({
        name: 'addProvidersToContract',
        params: {
            Uuid: route.params.Uuid
        }
    });
}

const displayMenu = (index) => {
    dropdownIndex.value = dropdownIndex.value === index ? null : index;
}

const nextPage = () => {
    if (currentPage.value < totalPages.value) {
        currentPage.value++;
    }

    fetchProviders(currentPage.value, itemsPerPage.value)
}

const previousPage = () => {
    if (currentPage.value > 1) {
        currentPage.value--;
    }
    fetchProviders(currentPage.value, itemsPerPage.value)
}

const fetchProviders = async (currentPage, myItemsPerPage) => {
    isLoading.value = true
    try {
        await api.get(`/map_contract/providers-mapped-to-contracts/${route.params.Uuid}`).then((data) => {
            isLoading.value = false
            providers.value = data
        })
    } catch (error) {
        isLoading.value = false;
        toast.error(error.message)
    }
}

const handleItemsPerPageChange = () => {
    const itemsPage = itemsPerPage.value
    fetchProviders()
}

const activateOrDisableProvider = async (provider) => {
    isLoading.value = true;
    try {
        await api.put('/provider',
            {
                "providerUuid": provider.providerUuid,
                "providerName": provider.providerName,
                "description": provider.description,
                "email": provider.email,
                "telephone": provider.telephone,
                "category": provider.category,
                "level": provider.level,
                "address1": provider.address1,
                "address2": provider.address2,
                "address3": provider.address3,
                "state": provider.state,
                "country": provider.country,
                "tinNumber": provider.tinNumber,
                "latitude": 0,
                "longitude": 0,
                "status": provider.status
            }).then((data) => {
                isLoading.value = false
                toast.success(data.message)
            })
    } catch (error) {
        isLoading.value = false;
        toast.error(error.message)
    }
}

const filteredItems = computed(() => {
    if (!providerName.value && !phone.value && !level.value) {
        return providers.value;
    } else {
        return providers.value.filter(item =>
            item.providerName.toLowerCase().includes(providerName.value.toLowerCase()) &&
            item.level.toLowerCase().includes(level.value.toLowerCase())
        )
    }
})

onMounted(() => {
    handleItemsPerPageChange()
    getInstitution()
})
</script>

<template>
    <div class="w-full h-max">
        <ConfirmModal v-model="approveModal" @confirm="deleteConfirmedService(serviceUuid)"
            icon="simple-line-icons:check" title="Delete Service"
            description="Are you sure you need to Delete this Service?" confirmButton="Delete"
            iconClass="text-red p-1 text-3xl" iconWrapperClass="bg-red rounded-full p-1"
            confirmButtonClass="inline-flex w-full justify-center rounded-md bg-red-800 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-900 sm:ml-3 sm:w-auto duration-300" />
        <SectionMain>
            <SectionTitleLineWithButton :icon="mdiHospitalBuilding" :title="institutionName + ' ' + 'Providers List'"
                main>
                <div class="flex space-x-2">
                    <form class="w-full mb-2">
                        <label for="default-search"
                            class="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white">Search</label>
                        <div class="relative">
                            <input type="text" v-model="search" id="default-search"
                                class="block w-full p-4 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                placeholder="Search . . ." required />
                            <button type="submit" @click="fetchProviders"
                                class="text-white absolute end-2.5 bottom-2.5 bg-primary0 hover:bg-primary focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg duration-200 text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                                Search
                            </button>
                        </div>
                    </form>
                    <div class="mt-2">
                        <BaseButton :icon="mdiPlus" color="whiteDark" @click="navigateToAddProviders"
                            title="search and add providers to your database" label="Assign Providers" />
                    </div>
                </div>
            </SectionTitleLineWithButton>
            <div class="mt-2 flow-root">
                <div class="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div class="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        <div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                            <table class="min-w-full divide-y divide-gray-300">
                                <thead class="bg-gray-50">
                                    <tr>
                                        <th scope="col"
                                            class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                                            @click="sort('contractCode')">S.N</th>
                                        <th scope="col"
                                            class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                                            @click="toggleName">
                                            <div>
                                                <input v-if="showName" type="text" v-model="providerName"
                                                    placeholder="provider Name" class="h-4 box-content rounded-md w-25">
                                                <p v-else>
                                                    Provider Name
                                                </p>
                                            </div>
                                        </th>
                                        <th scope="col"
                                            class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                                            @click="sort('payerPhone')">
                                            <div @click="togglePhone">
                                                <input v-if="showPhone" type="text" v-model="phone"
                                                    placeholder="provider Phone"
                                                    class="h-4 box-content rounded-md w-25">
                                                <p v-else>
                                                    Contract Details
                                                </p>
                                            </div>
                                        </th>
                                        <th scope="col"
                                            class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            <div @click="toggleLevel">
                                                <input v-if="showLevel" type="text" v-model="level"
                                                    placeholder="provider Level"
                                                    class="h-4 box-content rounded-md w-25">
                                                <p v-else>
                                                    Effective Date
                                                </p>
                                            </div>
                                        </th>
                                        <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                            <span class="sr-only">Actions</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-200 bg-white">
                                    <tr v-for="(provider, index) in filteredItems"
                                        :key="provider.payerProviderContractUuid"
                                        class="h-2 box-content divide-gray-200 px-3 hover:bg-primary  duration-200 items-center even:bg-gray-50">
                                        <td class="whitespace-nowrap px-3 py-1.5 text-sm text-gray-500">{{ index + 1 }}
                                        </td>
                                        <td class="whitespace-nowrap px-3 py-1.5 text-sm text-gray-500">{{
                                            provider.providerName }}</td>
                                        <td class="whitespace-nowrap px-3 py-1 text-sm text-gray-500">{{
                                            provider.payerProviderContractName }}({{
                                                provider?.payerProviderContractCode }})</td>
                                        <td
                                            class="whitespace-nowrap py-1 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                            {{ provider.beginDate }} to {{ provider.endDate }}</td>
                                        <td
                                            class="whitespace-nowrap py-2 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                            <div class="relative inline-block text-left">
                                                <button type="button" @click="displayMenu(index)"
                                                    class="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-indigo-500"
                                                    id="options-menu" aria-haspopup="true">
                                                    <svg-icon type="mdi" :path="mdiMenu"></svg-icon>
                                                </button>

                                                <div v-if="dropdownIndex === index"
                                                    class="origin-bottom-right absolute bottom-6 mt-2 mb-0 w-40 rounded-md shadow-lg bg-gray-100 ring-1 ring-black ring-opacity-5 z-10">
                                                    <div class="py-1" role="menu" aria-orientation="horizontal"
                                                        aria-labelledby="options-menu">
                                                        <span @click.prevent="activateOrDisableProvider(provider)"
                                                            class="block px-4 py-2 text-sm hover:bg-white hover:text-gray-900"
                                                            role="menuitem">Activate</span>
                                                        <span @click.prevent="activateOrDisableProvider(provider)"
                                                            class="block px-4 py-2 text-sm text-gray-700 hover:bg-white hover:text-gray-900"
                                                            role="menuitem">Disable</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            <p v-if="filteredItems && filteredItems.length === 0"
                                class="min-w-full divide-y divide-gray-300 mt-4 items-center mb-4 px-80">No Providers
                                Were Found?<span class="cursor-pointer pl-4 text-primary"
                                    @click="navigateToAddProviders">Assign
                                    Provider</span></p>
                        </div>
                    </div>
                </div>
            </div>
            <div class="relative w-full flex justify-end mt-2 z-0">
                <div class="flex items-center space-x-2">
                    <div class="bg-white">
                        <BaseButton :icon="mdiChevronDoubleLeft" label="Previous" title="previous page"
                            color="whiteDark" @click="previousPage" :disabled="currentPage === 1" />
                    </div>
                    <div>
                        <div>
                            Items per page:
                            <select v-model="itemsPerPage" @change="handleItemsPerPageChange">
                                <option v-for="size in pageSizes" :key="size" :value="size">
                                    {{ size }}
                                </option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <BaseButton :icon="mdiChevronDoubleRight" label="Next" title="next page" color="whiteDark"
                            @click="nextPage" :disabled="currentPage === totalPages" />
                    </div>
                </div>
            </div>
        </SectionMain>
    </div>
</template>