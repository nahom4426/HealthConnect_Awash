<script setup>
import Input from "./Input.vue";
import icons from "@/utils/icons";

const props = defineProps({
  attributes: {
    type: Object,
    required: true,
  },
});
</script>

<template>
  <Input
    :attributes="{
      ...attributes,
      type: 'text',
    }"
  >
  <template #left>
      <div class="h-full pt-2 w-12 grid place-items-center">
        <i v-html="icons.email" />
      </div>
    </template>
  </Input>
</template>
