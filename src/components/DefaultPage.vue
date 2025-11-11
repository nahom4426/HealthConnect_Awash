<!-- DefaultPage.vue -->
<script setup>
import icons from "@/utils/icons";
import { ref, watch } from "vue";

const props = defineProps({
  modelValue: String,
  placeholder: String,
  first: {
    type: Boolean,
    default: true,
  },
});
const emit = defineEmits(["update:modelValue"]);

const search = ref(props.modelValue || "");

watch(search, () => {
  emit("update:modelValue", search.value);
});
</script>

<template>
  <div class="flex flex-col h-full bg-white rounded-2xl p-6 gap-6">
    <div
      class="flex flex-col md:flex-row justify-between items-start md:items-center gap-8"
    >
      <!-- Search Bar -->
      <div
        v-if="props.first"
        tabindex="0"
        class="w-full md:max-w-[28rem] bg-white h-[3.5rem] focus-within:border-primary flex items-center rounded-lg overflow-hidden"
      >
     	<span class="size-10 text-base-clr border-r grid place-items-center" v-html='icons.search' />
				<input v-model="search" :placeholder="placeholder || 'Search...'" class="!shadow-none flex-1 px-3 h-full" />
          <button v-if="button" class="px-3 h-full border-l">
            {{ button }}
          </button>
      </div>
      <slot v-else name="first"> </slot>

      <div class="flex items-center gap-5 w-full md:w-auto">
        <slot name="header"> </slot>
        
        <slot name="filter"> </slot>

        <slot name="add-action"> </slot>

        <slot name="more" />
      </div>
    </div>

    <slot :search="search" />
  </div>
</template>
