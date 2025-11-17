<script setup>
//import { mdiAttachment } from "@mdi/js";
import InputParent from "../new_form_builder/InputParent.vue";
//import BaseIcon from "../base/BaseIcon.vue";
import InputLayout from "./NewInputLayout.vue";
import { watch, ref } from "vue";

const props = defineProps({
  modelValue: {
    required: false,
  },
  attributes: {
    type: Object,
  },
});
const emit = defineEmits(["update:modelValue"]);
const file = ref(props.modelValue || "");

watch(file, () => {
  emit("update:modelValue", file.value);
});
</script>
<template>
  <InputParent
    v-model="file"
    :attributes="{ ...attributes, type: 'file' }"
    v-slot="{ setRef, error, value, name, changeValue }"
  >
    {{ console.log(name, value) }}
    <InputLayout :error="error" :label="$attrs?.label">
      <div class="flex max-w-full gap-4 items-center">
        <label
          class="flex-1 w-full cursor-pointer gap-1 flex items-center h-full px-2 rounded"
        >
          <div class="min-w-[2rem] min-h-[2rem] grid place-items-center">
            <!--<img src="@/assets/img/ArrowAction.svg" />-->
          </div>
          <p class="truncate w-[calc(100% - 2rem)] text-sm" :class="[!value?.name ? 'text-sm text-gray-400' : '']">
            {{ value?.name || attributes?.placeholder }}
          </p>
          <input class="hidden" :ref="setRef" />
        </label>
      </div>
    </InputLayout>
  </InputParent>
</template>

<style></style>
