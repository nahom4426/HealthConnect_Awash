<script setup>
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import Button from "@/components/Button.vue";
import { useForm } from "@/components/new_form_builder/useForm";
import { useApiRequest } from "@/composables/useApiRequest";
import { updateClaimLevel } from "../api/claimLevelApi";
import { closeModal } from "@customizer/modal-x";
import ClaimLevelForm from "../components/form/ClaimLevelForm.vue";
import { computed, ref } from "vue";
import { toasted } from "@/utils/utils";
import { useClaimLevel } from "../store/claimLevelStore";

const props = defineProps({
  data: {
    type: Object,
    required: true,
    default: () => ({
      claimLevelUuid: '',
      claimLevel: '',
      min: 0,
      max: 0,
    })
  }
});

const emit = defineEmits(['success']);

// Extract values from nested data prop
const claimLevelData = computed(() => props.data?.data || props.data);
const claimLevelUuid = computed(() => claimLevelData.value.claimLevelUuid);

const { submit } = useForm("editClaimLevelForm");
const api = useApiRequest();
const pending = ref(false);
const claimLevelStore = useClaimLevel();

function handleUpdate({ values }) {
  if (!claimLevelUuid.value) {
    toasted(false, '', 'Claim Level UUID is missing');
    return;
  }

  if (parseFloat(values.min) >= parseFloat(values.max)) {
    toasted(false, '', 'Maximum amount must be greater than minimum amount');
    return;
  }

  const payload = {
    claimLevel: values.claimLevel,
    min: parseFloat(values.min),
    max: parseFloat(values.max),
  };

  pending.value = true;

  api.send(
    () => updateClaimLevel(claimLevelUuid.value, payload),
    (res) => {
      pending.value = false;
      if (res.success) {
        // Update the store instead of reloading
        claimLevelStore.updateClaimLevel(claimLevelUuid.value, {
          claimLevel: values.claimLevel,
          minAmount: parseFloat(values.min) ,
          maxAmount: parseFloat(values.max),
        });
        toasted(res.success, 'Claim Level updated successfully', res.error);
        closeModal();
        emit('success');
      } else {
        toasted(false, 'Failed to update Claim Level', res.error || '');
      }
    }
  );
}
</script>

<template>
  <ModalParent>
    <NewFormParent
      size="md"
      title="Edit Claim Level Limit"
      subtitle="Update claim level information"
    >
      <ClaimLevelForm 
        :data="claimLevelData" 
        formId="editClaimLevelForm"
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
            @click.prevent="submit(handleUpdate)"
            type="primary"
            size="lg"
            class="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Update Level
          </Button>
        </div>
      </template>
    </NewFormParent>
  </ModalParent>
</template>
