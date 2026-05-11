<script setup>
import ModalParent from '@/components/ModalParent.vue';
import { useForm } from "@/components/new_form_builder/useForm";
import { useApiRequest } from "@/composables/useApiRequest";
import { toasted } from "@/utils/utils";
import { closeModal } from "@customizer/modal-x";
import { useInstitution } from '@/features/institutions/store/institutionStore';
import { createInstitution } from "@/features/institutions/api/institutionApi";
import InstitutionForm from "../form/InstitutionForm.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import Button from "@/components/Button.vue";
import { ref } from 'vue';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}) 
  }
});

const { submit } = useForm("institution-form");
const req = useApiRequest();
const institutionStore = useInstitution();
const showLocationSection = ref(false);
const showAdditionalSection = ref(false);

function normalizeEmptyStringsToNull(input) {
  if (input === "") return null;
  if (Array.isArray(input)) return input.map(normalizeEmptyStringsToNull);
  if (input && typeof input === "object") {
    return Object.fromEntries(
      Object.entries(input).map(([key, value]) => [key, normalizeEmptyStringsToNull(value)])
    );
  }
  return input;
}

function create({ values }) {
  const payload = normalizeEmptyStringsToNull(values);
  req.send(
    () => createInstitution(payload),
    (res) => {
      if (res.success) {
        institutionStore.addInstitution(res.data);
        toasted(res.success, "Institution created successfully", res.error);
        props.data.onRefetch?.();
        closeModal();
      } else {
        toasted(false, "", res?.error || "Failed to create institution");
      }
    }
  );
}
</script>

<template>
    <ModalParent>
  <NewFormParent
    size="lg"
    title="Add New Institution"
    subtitle="Create a comprehensive institution profile with location details"
  >
    <div class="max-h-[80vh] overflow-y-auto form-scrollbar">
      <InstitutionForm 
        :data="data"
        :showLocationSection="showLocationSection"
        :showAdditionalSection="showAdditionalSection"
        @toggle-location="showLocationSection = !showLocationSection"
        @toggle-additional="showAdditionalSection = !showAdditionalSection"
      />
    </div>

    <template #bottom>
      <div class="flex gap-4 justify-end p-6 bg-gray-50 border-t border-gray-200">
        <Button 
          type="button"
          @click="closeModal" 
          class="px-6 py-3 font-medium text-gray-700 rounded-lg border-2 border-gray-300 transition-colors duration-200 hover:bg-gray-100"
        >
          Cancel
        </Button>
        <Button 
          type="button"
          :pending="req.pending.value" 
          @click="submit(create)" 
          class="flex gap-2 items-center px-8 py-3 font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg transition-all duration-200 hover:from-blue-600 hover:to-blue-700 hover:shadow-xl"
        >
          <svg v-if="!req.pending.value" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          {{ req.pending.value ? 'Creating...' : 'Add Institution' }}
        </Button>
      </div>
    </template>
  </NewFormParent>
  </ModalParent>
</template>

<style scoped>
 :deep(.form-scrollbar) {
  overflow-y: scroll;
 }

 :deep(.form-scrollbar::-webkit-scrollbar) {
  width: 6px;
 }

 :deep(.form-scrollbar::-webkit-scrollbar-track) {
  background: #f1f1f1;
  border-radius: 3px;
 }

 :deep(.form-scrollbar::-webkit-scrollbar-thumb) {
  background: #c1c1c1;
  border-radius: 3px;
 }

 :deep(.form-scrollbar::-webkit-scrollbar-thumb:hover) {
  background: #a8a8a8;
 }
</style>