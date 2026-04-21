<script setup>
import NewFormParent from "@/components/NewFormParent.vue";
import Button from "@/components/Button.vue";
import InstitutionForm from "@/features/underwriting/form/InstitutionForm.vue";
import { useForm } from "@/components/new_form_builder/useForm";
import { useApiRequest } from "@/composables/useApiRequest";
import { toasted } from "@/utils/utils";
import { useInstitution } from "@/features/institutions/store/institutionStore";
import { createInstitution } from "@/features/institutions/api/institutionApi";
import { useRouter } from "vue-router";
import { ref } from "vue";
import { openModal } from "@customizer/modal-x";

const router = useRouter();
const { submit } = useForm("institution-form");
const req = useApiRequest();
const institutionStore = useInstitution();
const showLocationSection = ref(false);
const showAdditionalSection = ref(false);

function onCancel() {
  router.back();
}

function onCreate({ values }) {
  req.send(
    () => createInstitution(values),
    (res) => {
      if (res.success) {
        institutionStore.addInstitution(res.data);
        toasted(res.success, "Institution created successfully", res.error);
        const institutionUuid = res?.data?.institutionUuid;
        openModal(
          "addConfirmation",
          {
            title: "Proceed to create quotation",
            message:
              "Do you want to proceed to create a quotation for this institution now?",
            confirmLabel: "Proceed",
            cancelLabel: "Not now",
          },
          (confirm) => {
            if (confirm && institutionUuid) {
              router.push({ path: `/new_quotation/generate/${institutionUuid}` });
            } else {
              router.push({ path: "/institution_policy" });
            }
          }
        );
      }
    }
  );
}
</script>

<template>
  <div class=" w-full">
    
      <div class=" overflow-y-auto">
        <InstitutionForm 
          :showLocationSection="showLocationSection"
          :showAdditionalSection="showAdditionalSection"
          @toggle-location="showLocationSection = !showLocationSection"
          @toggle-additional="showAdditionalSection = !showAdditionalSection"
        />
      </div>

      
        <div class="flex gap-4 justify-end p-6 border-t border-gray-200 bg-gray-50">
          <Button 
            type="secondary"
            @click="onCancel" 
            class="px-6 py-3 border-2 border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200 font-medium"
          >
            Cancel
          </Button>
          <Button 
            type="elevated"
            :pending="req.pending.value" 
            @click="submit(onCreate)" 
            class="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            <!-- <svg v-if="!req.pending.value" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg> -->
            {{ req.pending.value ? 'Creating...' : 'Add Institution' }}     
          </Button>
        </div>
      
    
  </div>
</template>
