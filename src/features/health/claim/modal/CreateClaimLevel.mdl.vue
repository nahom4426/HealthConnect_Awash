<script setup>
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import Button from "@/components/Button.vue";
import { useForm } from "@/components/new_form_builder/useForm";
import { useApiRequest } from "@/composables/useApiRequest";
import { createClaimLevel } from "../api/claimLevelApi";
import { closeModal } from "@customizer/modal-x";
import ClaimLevelForm from "../components/form/ClaimLevelForm.vue";
import { ref } from "vue";
import { toasted } from "@/utils/utils";
import { useClaimLevel } from "../store/claimLevelStore";

const emit = defineEmits(['success']);
const claimLevelStore = useClaimLevel();

const { submit } = useForm("createClaimLevelForm");
const api = useApiRequest();
const formRef = ref(null);

function handleCreate({ values, reset }) {
  const payload = {
    claimLevel: values.claimLevel,
    min: parseFloat(values.min),
    max: parseFloat(values.max),
  };

  // Validation
  if (payload.min >= payload.max) {
    toasted(false, "", "Maximum amount must be greater than minimum amount");
    return;
  }

  api.send(
    () => createClaimLevel(payload),
    (res) => {
      if (res.success) {
        // Add the new claim level to the store
        claimLevelStore.addClaimLevel({
          claimLevelUuid: res.data?.claimLevelUuid || res.claimLevelUuid,
          claimLevel: payload.claimLevel,
          minAmount: payload.min,
          maxAmount: payload.max,
          ...res.data
        });
        
        toasted(res.success, "Claim Level Created", res.error);
        reset();
        closeModal();
        emit('success');
      } else {
        toasted(false, "Failed to Create Claim Level", res.error || "");
      }
    }
  );
}
</script>

<template>
  <ModalParent>
    <NewFormParent
      size="lg"
      title="Create Claim Level Limit"
      subtitle="Configure claim level amount ranges"
    >
      <ClaimLevelForm 
        ref="formRef"
        formId="createClaimLevelForm" 
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
            Create Level
          </Button>
        </div>
      </template>
    </NewFormParent>
  </ModalParent>
</template>
