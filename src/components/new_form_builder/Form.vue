<script setup>
import { useForm } from "./useForm";
import { ref } from "vue";

const emit = defineEmits(["submit"]);

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  inner: {
    type: Boolean,
    default: true,
  },
  childrenName: {
    type: String,
  },
});

if (!props.id) {
  throw new Error("[id] is required for a new form");
}

const { formEl, submit, valid } = useForm(
  props.id,
  props.inner,
  props.childrenName
);

function handleNativeSubmit(e) {
  submit(() => {
    emit("submit", e);
  });
}

</script>
<template>
  <form autocomplete="off" :id="props.id" ref="formEl" action="" @submit.prevent="handleNativeSubmit">
    <slot v-if="props.inner" :valid="valid" :submit="submit"></slot>
    <slot v-else></slot>
  </form>
</template>
