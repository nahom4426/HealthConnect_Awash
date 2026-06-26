<script setup>
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import { closeModal, openModal } from "@customizer/modal-x";
import { ref } from "vue";
import Table from "@/components/Table.vue";
import CoverageDataProvider from "@/features/product_settings/components/CoverageDataProvider.vue";
import Input from "@/components/new_form_elements/Input.vue";

const props = defineProps({
  data: {
    type: Object,
    required: true,
    default: () => ({}),
  },
});
console.log("aaap",props.data)
const dataProvider = ref();
const search = ref("");

function handlePageChange(page) {
  if (dataProvider.value) {
    dataProvider.value.setPage(page);
  }
}

function handleLimitChange(limit) {
  if (dataProvider.value) {
    dataProvider.value.setLimit(limit);
  }
}

function selectPackage(pkg) {
  if (!pkg?.packageUuid) return;

  closeModal();
  openModal("AssignProviderServicesToPackage", {
    packageUuid: pkg.packageUuid,
    packageName: pkg.packageName,
    payerProviderContractUuid: props.data?.payerProviderContractUuid,
    providerName: props.data?.providerName,
  });
}
</script>

<template>
  <ModalParent>
    <NewFormParent
      size="xl"
      title="Assign Services to Package"
      subtitle="Select a coverage package, then choose the services you want to assign"
    >
      <div class="pb-4">
        <Input
          v-model="search"
          placeholder="Search packages..."
          :attributes="{ class: 'h-10 w-full' }"
        />
      </div>
      <CoverageDataProvider
        ref="dataProvider"
        :search="search"
        v-slot="{ packages, pending, currentPage, itemsPerPage, totalPages }"
      >
        <Table
          :pending="pending"
          :headers="{
            head: [
              'Benefit Name',
              'Category',
              'Description',
              'Max Limit',
              'Gender',
              'All Services',
              'Status',
              'Actions',
            ],
            row: [
              'packageName',
              'packageCategory',
              'packageDescription',
              'maxLimit',
              'gender',
              'allServices',
              'status',
              'actions',
            ],
          }"
          :rows="packages"
          :pagination="{
            currentPage,
            itemsPerPage,
            totalPages,
            onPageChange: handlePageChange,
            onLimitChange: handleLimitChange,
          }"
        >
          <template #actions="{ row }">
            <button
              class="px-4 py-2 text-sm font-semibold text-white rounded-lg bg-primary"
              type="button"
              @click.stop="selectPackage(row)"
            >
              Select
            </button>
          </template>
        </Table>
      </CoverageDataProvider>

      <div class="flex gap-3 justify-end pt-4 border-t border-gray-200">
        <button
          type="button"
          class="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg"
          @click="closeModal()"
        >
          Cancel
        </button>
      </div>
    </NewFormParent>
  </ModalParent>
</template>
