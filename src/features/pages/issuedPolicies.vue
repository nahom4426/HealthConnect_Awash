<script setup>
import SectionMain from "@/components/section/SectionMain.vue";
import api from "@/scripts/api";
import { mdiFileDocumentCheck, mdiOfficeBuilding, mdiPlus } from "@mdi/js";
import { onMounted, ref, watch } from "vue";
import Modal from "@/components/modal.vue";
import SectionTitleLineWithButton from "@/components/section/SectionTitleLineWithButton.vue";
import InstitutionList from "@/components/institution/issued-list.vue";
import DeleteInstitution from "@/components/actions/deleteInstitution.vue";
import loader from "@/components/loader/loader.vue";

const open = ref(false);
const deleteInstitutionModalOpen = ref(false);
const institutions = ref([]);
const loading = ref(false);
const deleteLoading = ref(false);
const InstitutionToDelete = ref("");
const Status = ref('ACTIVE');
const search = ref(sessionStorage.getItem("searchTerm") || "");

watch(search, (newSearchTerm) => {
    sessionStorage.setItem("searchTerm", newSearchTerm);
    if (newSearchTerm === "") {
        fetchInstitutions('', Status.value);
    } else {
        fetchInstitutions(newSearchTerm, Status.value);
    }
});

watch(Status, async (newStatus, oldStatus) => {
    if (newStatus !== oldStatus) {
        fetchInstitutions('', newStatus)
    }
});

onMounted(async () => {
    await fetchInstitutions('', Status.value);
});
const handleModalClose = async (modalValue) => {
    if (modalValue === "delete") {
        deleteInstitutionModalOpen.value = !deleteInstitutionModalOpen.value;
    } else {
        open.value = !open.value;
        await fetchInstitutions(search.value, Status.value);
    }
};

const CatchInstitutionToBeDeleted = (id) => {
    InstitutionToDelete.value = id;
    deleteInstitutionModalOpen.value = !deleteInstitutionModalOpen.value;
};

const fetchInstitutions = async (searchKey, status) => {
    loading.value = true;
    await api.get(`/institution/policy-holders/list?search=${searchKey}&page=1&limit=25&status=${status}`).then((data) => {
        institutions.value = data;
        loading.value = false;
    });
};
</script>
<template>
    <div class="w-full h-max">
        <Modal :open="deleteInstitutionModalOpen" @close="handleModalClose('delete')">
            <DeleteInstitution @confirmed="handleInstitutionDelete" @canceled="handleModalClose('delete')"
                :loading="deleteLoading" />
        </Modal>
        <SectionMain>
            <SectionTitleLineWithButton :icon="mdiFileDocumentCheck" title="Issued Policies" main>
                <div class="flex space-x-4">
                    <form id="searchEliService" class="w-full mt-7">
                        <label for="default-search"
                            class="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white">Search</label>
                        <div class="relative">
                            <input type="text" v-model="search" id="default-search"
                                class="block w-full px-4 py-2 ps-4 text-sm text-gray-900 border border-gray-300 rounded-lg bg-white focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                placeholder="Search . . ." required />
                        </div>
                    </form>
                    <div class="mb-4">
                        <label for="institution" class="text-sm font-normal">Status</label>
                        <div
                            class="flex rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600 sm:w-[160px]">
                            <select name="status" id="status" v-model="Status"
                                class="truncate block w-full px-2 py-2 rounded-md bg-gray-100 border-1 focus:border-gray-500 focus:bg-white focus:ring-0">
                                <option value="ACTIVE" class="py-1 hover:bg-red-500 hover:text-white">Active</option>
                                <option value="SUSPENDED" class="py-1 hover:bg-red-500 hover:text-white">Suspended
                                </option>
                                <option value="HISTORY" class="py-1 hover:bg-red-500 hover:text-white">History</option>
                            </select>
                        </div>
                    </div>
                </div>
            </SectionTitleLineWithButton>
            <div class="min-h-[70vh]">
                <div v-if="loading" class="flex items-center justify-center h-[40vh]">
                    <loader />
                </div>

                <InstitutionList @save="fetchInstitutions" v-if="!loading" :institutions="institutions"
                    @delete="(id) => CatchInstitutionToBeDeleted(id)" />
            </div>
        </SectionMain>
    </div>
</template>
