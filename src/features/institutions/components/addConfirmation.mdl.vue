<script setup>
defineOptions({ name: 'addConfirmation.mdl' });
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import Button from "@/components/Button.vue";
import { closeModal } from "@customizer/modal-x";
import icons from "@/utils/icons";

const props = defineProps({
  data: {
    type: Object,
    required: false,
    default: () => ({}),
  },
});

const title = props.data?.title || "Confirmation";
const message = props.data?.message || "Are you sure you want to continue?";
const confirmLabel = props.data?.confirmLabel || "Proceed";
const cancelLabel = props.data?.cancelLabel || "Cancel";
const iconName = props.data?.icon || "question";

function onCancel() {
  closeModal(false);
}

function onConfirm() {
  closeModal(true);
}
</script>

<template>
  <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <ModalParent>
      <NewFormParent
        class="m-2 p-2"
        size="md"
        :title="title"
        :subtitle="message"
      >
        <div class="space-y-6">
          <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <i v-html="icons[iconName] ?? icons.question" class="w-6 h-6 text-white"></i>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-800">{{ title }}</h3>
                <p class="text-sm text-gray-600">{{ message }}</p>
              </div>
            </div>
          </div>
        </div>

        <template #bottom>
          <div class="flex gap-4 m-2 p-2 justify-end items-center w-full">
            <Button
              @click="onCancel"
              variant="outline"
              class="border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              {{ cancelLabel }}
            </Button>
            <Button
              @click="onConfirm"
              class="bg-blue-500 hover:bg-blue-600 text-white"
            >
              {{ confirmLabel }}
            </Button>
          </div>
        </template>
      </NewFormParent>
    </ModalParent>
  </div>
  
</template>
