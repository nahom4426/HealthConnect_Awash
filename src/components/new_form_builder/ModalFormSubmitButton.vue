<script setup>
import { inject } from "vue";
import Button from "../Button.vue";

defineProps({
  btnText: {
    type: String,
  },
  pending: {
    type: Boolean,
    default: false,
  },
  size: {
    type: String,
    default: "md",
  },
});

// Refs are unwrapped in the template, so this works for a provided ref or boolean
const pendingRequest = inject("pending", false);
</script>

<template>
  <Button
    type="primary"
    :size="size"
    :pending="pending || !!pendingRequest"
    html-type="submit"
  >
    {{ btnText }}
  </Button>
</template>
