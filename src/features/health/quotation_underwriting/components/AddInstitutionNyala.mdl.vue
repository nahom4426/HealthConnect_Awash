<script setup>
import ModalParent from '@/components/ModalParent.vue';
import { useForm } from "@/components/new_form_builder/useForm";
import { useApiRequest } from "@/composables/useApiRequest";
import { toasted } from "@/utils/utils";
import { closeModal } from "@customizer/modal-x";
import { useInstitution } from '@/features/health/institutions/store/institutionStore';
import { createInstitution } from "@/features/health/institutions/api/institutionApi";
import InstitutionForm from "../form/InstitutionForm.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import Button from "@/components/Button.vue";
import { ref } from 'vue';

const { submit } = useForm("institution-form");
const req = useApiRequest();
const institutionStore = useInstitution();
const showLocationSection = ref(false);
const showAdditionalSection = ref(false);

function create({ values }) {
  req.send(
    () => createInstitution(values),
    (res) => {
      if (res.success) {
        institutionStore.addInstitution(res.data);
        toasted(res.success, "Institution created successfully", res.error);
        closeModal();
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
    <div class="max-h-[80vh] overflow-y-auto">
      <InstitutionForm 
        :showLocationSection="showLocationSection"
        :showAdditionalSection="showAdditionalSection"
        @toggle-location="showLocationSection = !showLocationSection"
        @toggle-additional="showAdditionalSection = !showAdditionalSection"
      />
    </div>

    <template #bottom>
      <div class="flex gap-4 justify-end p-6 border-t border-line bg-surface-muted">
        <Button 
          type="button"
          @click="closeModal" 
          class="px-6 py-3 border-2 border-line-strong text-ink-muted hover:bg-surface-muted rounded-lg transition-colors duration-200 font-medium"
        >
          Cancel
        </Button>
        <Button 
          type="button"
          :pending="req.pending.value" 
          @click="submit(create)" 
          class="px-8 py-3 bg-gradient-to-r from-primary to-primary hover:from-primary hover:to-primary-hover text-white rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-xl flex items-center gap-2"
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
/* Custom scrollbar */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: rgb(var(--surface-muted));
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: rgb(var(--line-strong));
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgb(var(--line-strong));
}
</style>