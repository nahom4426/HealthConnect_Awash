<script setup>
import { closeModal, getModal } from "@customizer/modal-x";
import Button from "./Button.vue";
import icons from "@/utils/icons";

const props = defineProps({
  data: Object,
});

function yes() {
  closeModal(true);
}

function no() {
  closeModal(false);
}
</script>
<template>
  <div class="h-full bg-dark/50 grid place-items-center">
    <div class="bg-base-clr2 flex- flex-col gap-4 rounded p-4 w-[23rem]">
      <div class="h-12 border-b flex items-center justify-between">
        <p class="font-bold">{{ data?.title || "Erx" }}</p>
        <div class="cursor-pointer" @click="closeModal()">
          <i v-html="icons.closes"></i>
        </div>
      </div>
      <p class="p-2 text-dark/80">{{ data?.message }}</p>
      <div class="flex justify-end py-2 items-center gap-2">
        <Button @click="no" class="text-sm border-dark border">No</Button>
        <Button @click="yes" class="text-sm !text-white" type="primary"
          >Yes</Button
        >
      </div>
    </div>
  </div>
</template>
