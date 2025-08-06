<script setup>
import SectionMain from "@/components/section/SectionMain.vue";
import api from "@/scripts/api";
import { mdiFileDocumentPlus } from "@mdi/js";
import { onMounted, ref } from "vue";
import Modal from "@/components/modal.vue";
import SectionTitleLineWithButton from "@/components/section/SectionTitleLineWithButton.vue";
import InstitutionList from "@/components/institution/tobeIssuedList.vue";
import DeleteInstitution from "@/components/actions/deleteInstitution.vue";
import loader from "@/components/loader/loader.vue";

const open = ref(false);
const deleteInstitutionModalOpen = ref(false);
const institutions = ref([]);
const loading = ref(false);
const deleteLoading = ref(false);
const InstitutionToDelete = ref("");

onMounted(async () => {
    await fetchInstitutions();
});
const handleModalClose = async (modalValue) => {
    if (modalValue === "delete") {
        deleteInstitutionModalOpen.value = !deleteInstitutionModalOpen.value;
    } else {
        open.value = !open.value;
        await fetchInstitutions();
    }
};

const CatchInstitutionToBeDeleted = (id) => {
    InstitutionToDelete.value = id;
    deleteInstitutionModalOpen.value = !deleteInstitutionModalOpen.value;
};

const fetchInstitutions = async () => {
    loading.value = true;
    await api.get("/payer-institution-contract/list/pending/policies").then((data) => {
        institutions.value = data;
        loading.value = false;
    });
};
</script>
<template>
    <div>
        <Modal :open="deleteInstitutionModalOpen" @close="handleModalClose('delete')">
            <DeleteInstitution @confirmed="handleInstitutionDelete" @canceled="handleModalClose('delete')"
                :loading="deleteLoading" />
        </Modal>
        <SectionMain>
            <SectionTitleLineWithButton :icon="mdiFileDocumentPlus" title="Quoted Policies" main>
                <form id="searchEliService" class="w-full md:w-[40%] lg:w-[20%] mt-2">
                    <label for="default-search"
                        class="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white">Search</label>
                    <div class="relative">
                        <input type="text" v-model="search" id="default-search"
                            class="block w-full px-4 py-2 ps-4 text-sm text-gray-900 border border-gray-300 rounded-lg bg-white focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                            placeholder="Search . . ." required />
                    </div>
                </form>
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
