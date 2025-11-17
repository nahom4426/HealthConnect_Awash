<script setup>
import { ref, onMounted } from "vue";
import { useApiRequest } from "@/composables/useApiRequest";
import {
  getInsuredPersonById,
  updateInsuredPerson,
} from "../api/insuredPersonsApi";
import { toasted } from "@/utils/utils";
import InsuredPersonForm from "../form/InsuredPersonForm.vue";
import Button from "@/components/Button.vue";

const props = defineProps({
  insuredPersonUuid: {
    type: String,
    required: true,
  },
  insuredPerson: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(["close", "updated"]);

const insuredPersonData = ref(props.insuredPerson || {});
const getRequest = useApiRequest();
const updateRequest = useApiRequest();
const formRef = ref(null);

// Fetch insured person data if not provided
onMounted(() => {
  if (!props.insuredPerson || Object.keys(props.insuredPerson).length === 0) {
    getRequest.send(
      () => getInsuredPersonById(props.insuredPersonUuid),
      (response) => {
        if (response.data) {
          insuredPersonData.value = response.data;
        }
      }
    );
  }
});

// Handle form submission
function handleSubmit(data) {
  updateRequest.send(
    () => updateInsuredPerson(props.insuredPersonUuid, data),
    (response) => {
      if (response.success) {
        toasted(true, "Insured person updated successfully");
        emit("updated", response.data);
        emit("close");
      } else {
        toasted(false, response.error || "Failed to update insured person");
      }
    }
  );
}

// Handle cancel button click
function handleCancel() {
  emit("close");
}
</script>

<template>
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
  >
    <div
      class="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto"
    >
      <div class="bg-gray-50 p-4 border-b flex justify-between items-center">
        <h1 class="font-medium text-lg">Edit Insured Person</h1>
        <button
          @click="emit('close')"
          class="text-gray-500 hover:text-gray-700"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div
        v-if="getRequest.pending.value"
        class="flex justify-center items-center p-8"
      >
        <div
          class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"
        ></div>
      </div>

      <div v-else class="p-6">
        <InsuredPersonForm
          ref="formRef"
          :insuredPerson="insuredPersonData"
          :pending="updateRequest.pending.value"
          @submit="handleSubmit"
        />

        <div class="flex justify-end gap-4 mt-6">
          <Button @click="handleCancel" type="secondary"> Cancel </Button>
          <Button
            @click="formRef?.handleSubmit()"
            type="primary"
            :loading="updateRequest.pending.value"
          >
            Update Insured Person
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
