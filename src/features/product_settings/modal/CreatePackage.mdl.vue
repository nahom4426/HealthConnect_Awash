<script setup>
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import Button from "@/components/Button.vue";
import { useForm } from "@/components/new_form_builder/useForm";
import { useApiRequest } from "@/composables/useApiRequest";
import { createPackage } from "../api/coverageApi";
import { useCoverage } from "../store/coverageStore";
import { closeModal } from "@customizer/modal-x";
import { useToast } from "@/toast/store/toast";
import PackageForm from "../components/form/PackageForm.vue";
import { ref } from "vue";

const { submit } = useForm("createPackageForm");
const { addToast } = useToast();
const api = useApiRequest();
const coverageStore = useCoverage();
const formRef = ref(null);

function handleCreate({ values, reset }) {
  const payload = {
    packageName: values.packageName,
    packageCategory: values.packageCategory,
    packageDescription: values.packageDescription,
    minLimit: parseInt(values.minLimit),
    maxLimit: parseInt(values.maxLimit),
    status: values.status || "ACTIVE",
    gender: values.gender,
    packageCode: generatePackageCode(values.packageCategory) // Added auto-generated code
  };

  // Validate min/max limits
  if (payload.minLimit >= payload.maxLimit) {
    addToast('Maximum limit must be greater than minimum limit', '', 'error');
    return;
  }

  api.send(
    () => createPackage(payload),
    (response) => {
      if (response.success) {
        coverageStore.addPackage(response.data);
        addToast('Package created successfully', '', 'success');
        reset();
        closeModal();
        
        // Refresh package list if needed
        coverageStore.setPagination({
          currentPage: 1,
          itemsPerPage: coverageStore.itemsPerPage,
          totalPages: Math.ceil((coverageStore.totalItems + 1) / coverageStore.itemsPerPage),
          totalItems: coverageStore.totalItems + 1
        });
      } else {
        addToast('Failed to create package', response.error || '', 'error');
      }
    }
  );
}

function generatePackageCode(category) {
  const prefix = category.substring(0, 3).toUpperCase();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${randomNum}`;
}
</script>

<template>
  <ModalParent>
    <NewFormParent
      size="lg"
      title="Create New Coverage Package"
      subtitle="Configure benefits and coverage limits"
    >
      <PackageForm 
        ref="formRef"
        formId="createPackageForm" 
      />

      <template #bottom>
        <div class="flex justify-end gap-3 w-full p-4 border-t border-gray-200">
          <Button
            @click="closeModal"
            type="secondary"
            size="lg"
            class="border border-gray-300 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button
            :pending="api.pending.value"
            @click.prevent="submit(handleCreate)"
            type="primary"
            size="lg"
            class="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Create Package
          </Button>
        </div>
      </template>
    </NewFormParent>
  </ModalParent>
</template>