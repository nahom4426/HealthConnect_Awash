<script setup>
import icons from "@/utils/icons";
import { ref, watch } from "vue"

const props = defineProps({
	modelValue: String,
  button: String,
	placeholder: String,
  showHeader: {
    type: Boolean,
    default: true
  }
});
const emit = defineEmits(['update:modelValue'])
const search = ref(props.modelValue);

watch(search, () => {
  emit('update:modelValue', search.value)
})
</script>
<template>
  <div class="flex flex-col min-h-full bg-white">
    <div class="flex items-center min-h-10 p-2 border-b">
      <slot v-if="showHeader" name="header">
				<div tabindex="0" class="w-[20rem] focus-within:border-primary overflow-hidden shadow-primary h-full flex items-center border rounded-md">
					<span class="size-10 text-base-clr border-r grid place-items-center" v-html='icons.search' />
					<input v-model="search" :placeholder="placeholder || 'Search...'" class="!shadow-none flex-1 px-3 h-full" />
          <button v-if="button" class="px-3 h-full border-l">
            {{ button }}
          </button>
				</div>
      </slot>
      <slot name="more" />
    </div>
    <slot :search="search" />
  </div>
</template>
