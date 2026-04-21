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
  hideSearch: {
    type: Boolean,
    default: false,
  },
  button: { type: String, default: "" }
});
const emit = defineEmits(["update:modelValue"]);

const search = ref(props.modelValue || "");

watch(search, () => {
  emit("update:modelValue", search.value);
});
</script>

<template>
  <div class="flex flex-col gap-3 p-3 h-full bg-white rounded-2xl sm:p-4 lg:p-6 sm:gap-4 lg:gap-6">
    <div
      class="flex flex-col gap-3 justify-between items-start md:flex-row md:items-center sm:gap-4 lg:gap-8"
    >
      <!-- Search Bar -->
      <div
        v-if="props.first && !props.hideSearch"
        tabindex="0"
        class="w-full md:max-w-[28rem] bg-white h-10 sm:h-12 lg:h-[3.5rem] focus-within:border-primary flex items-center rounded-lg overflow-hidden border border-gray-200"
      >
     	<span class="grid place-items-center w-8 h-8 text-sm border-r sm:w-10 sm:h-10 text-base-clr sm:text-base" v-html='icons.search' />
				<input v-model="search" :placeholder="placeholder || 'Search...'" class="!shadow-none flex-1 px-2 sm:px-3 h-full text-sm sm:text-base" />
          <button v-if="button" class="px-3 h-full border-l">
            {{ button }}
          </button>
      </div>
      <slot v-else name="first"> </slot>

      <div class="flex flex-col gap-2 justify-end items-stretch w-full sm:flex-row sm:items-center sm:gap-3 lg:gap-5 md:w-auto">
        <slot name="header"> </slot>
        
        <slot name="filter"> </slot>

        <slot name="add-action"> </slot>

        <slot name="more" />
      </div>
    </div>

    <slot :search="search" />
  </div>
</template>
