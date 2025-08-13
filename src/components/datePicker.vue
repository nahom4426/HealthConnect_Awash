<script setup>
import { ref } from "vue";
import icons from "@/utils/icons";

const props = defineProps({
  modelValue: String,
  label: String,
  required: Boolean,
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
    <label v-if="label" class="block text-sm font-medium text-gray-700 mb-1">
      {{ label }} <span v-if="required" class="text-red-500">*</span>
    </label>
    <div
      class="flex items-center bg-[#F6F7FA] rounded-lg px-4 py-3 text-[#75778B] cursor-pointer border border-gray-300"
      :class="{ 'border-red-500': error }"
      @click="openDatePicker"
    >
      <span class="mr-2" v-html="icons.date" />
      <input
        ref="inputRef"
        type="date"
        class="bg-transparent h-7 outline-none flex-1 text-sm appearance-none w-full"
        :value="modelValue"
        @input="updateValue"
        :placeholder="placeholder"
      />
    </div>
    <p v-if="error && errorMessage" class="text-red-500 text-xs mt-1">
      {{ errorMessage }}
    </p>
    <p v-else-if="error" class="text-red-500 text-xs mt-1">
      {{ label }} is required
    </p>
  </div>
</template>
