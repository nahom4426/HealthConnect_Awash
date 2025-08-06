<script setup>
import SectionMain from "@/component/section/SectionMain.vue";
import api from "@/scripts/api";
import { mdiOfficeBuilding, mdiFileDocumentEdit } from "@mdi/js";
import { onMounted, ref, watch } from "vue";
import Modal from "@/component/modal.vue";
import SectionTitleLineWithButton from "@/component/section/SectionTitleLineWithButton.vue";
import InstitutionList from "@/component/institution/institution-list.vue";
import DeleteInstitution from "@/component/actions/deleteInstitution.vue";
import loader from "@/component/loader/loader.vue";

const open = ref(false);
const deleteInstitutionModalOpen = ref(false);
const institutions = ref([]);
const loading = ref(false);
const deleteLoading = ref(false);
const InstitutionToDelete = ref("");
const search = ref(sessionStorage.getItem("searchTerm") || "");

watch(search, (newSearchTerm) => {
  sessionStorage.setItem("searchTerm", newSearchTerm);
  if (newSearchTerm === "") {
    fetchInstitutions('');
  } else {
    fetchInstitutions(newSearchTerm);
  }
});

onMounted(async () => {
  await fetchInstitutions('');
});
const handleModalClose = async (modalValue) => {
  if (modalValue === "delete") {
    deleteInstitutionModalOpen.value = !deleteInstitutionModalOpen.value;
  } else {
    open.value = !open.value;
    await fetchInstitutions('');
  }
};

const CatchInstitutionToBeDeleted = (id) => {
  InstitutionToDelete.value = id;
  deleteInstitutionModalOpen.value = !deleteInstitutionModalOpen.value;
};

const fetchInstitutions = async (searchKey) => {
  loading.value = true;
  await api.get(`/institution/list?search=${searchKey}&page=1&limit=25&status=ACTIVE`).then((data) => {
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
      <SectionTitleLineWithButton :icon="mdiFileDocumentEdit" title="Active Institutions" main>
        <form class="mt-2 w-[20%]">
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
