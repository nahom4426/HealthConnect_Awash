<script setup>
import { useForm } from "./useForm";
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

var { formEl, submit, valid } = useForm(
  props.id,
  props.inner,
  props.childrenName
);

</script>
<template>
  <form autocomplete="off" :id="id" ref="formEl" action="">
    <slot v-if="inner" :valid="valid" :submit="submit"></slot>
    <slot v-else></slot>
  </form>
</template>
