<script setup>
import { ref } from "vue";
import icons from "@/utils/icons";

const props = defineProps({
  modelValue: String,
  label: String,
  required: Boolean,
  min: {
    type: String,
    default: undefined,
  },
  max: {
    type: String,
    default: undefined,
  },
  placeholder: {
    type: String,
    default: "mm/dd/yyyy",
  },
  error: {
    type: Boolean,
    default: false,
  },
  errorMessage: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["update:modelValue"]);
const inputRef = ref(null);

const openDatePicker = () => {
  inputRef.value?.showPicker?.();
};

const updateValue = (e) => {
  emit("update:modelValue", e.target.value);
};
</script>

<template>
  <div>
    <label v-if="label" class="block mb-1 text-sm font-medium text-gray-700">
      {{ label }} <span v-if="required" class="text-red-500">*</span>
    </label>
    <div
      class="flex items-center bg-[#FFFFFF] rounded-md px-4 h-10 text-[#75778B] cursor-pointer border border-gray-300"
      :class="{ 'border-red-500': error }"
      @click="openDatePicker"
    >
      <span class="mr-2" v-html="icons.date" />
      <input
        ref="inputRef"
        type="date"
        class="flex-1 w-full h-7 text-sm bg-transparent appearance-none outline-none"
        :value="modelValue"
        @input="updateValue"
        :placeholder="placeholder"
        :min="min"
        :max="max"
      />
    </div>
    <p v-if="error && errorMessage" class="mt-1 text-xs text-red-500">
      {{ errorMessage }}
    </p>
    <p v-else-if="error" class="mt-1 text-xs text-red-500">
      {{ label }} is required
    </p>
  </div>
</template>
