<script setup lang="ts">
import icons from "@/utils/icons";
import { computed, ref, watch, type PropType } from "vue";

type ArrayOfObjects = { value: string, label: string };

const props = defineProps({
  pending: {
    type: Boolean,
    default: false,
  },
  modelValue: String,
  options: {
    type: Array as PropType<string[] | ArrayOfObjects[]>,
    required: true,
  },
  placeholder: String,
});
const emit = defineEmits(["update:modelValue"]);
const value = ref(props.modelValue || props.placeholder || "Select");

const isArrayOfObjects = computed(() => {
  return Array.isArray(props.options) && typeof props.options[0] == "object";
});
</script>
<template>
  <div
    class="inline-flex relative h-10 border border-grey-300 rounded-md min-w-48 max-w-64"
  >
    <select
      v-model="value"
      @change="emit('update:modelValue', value)"
      class="min-w-0 bg-transparent pl-3 pr-9 *:truncate appearance-none w-full h-full"
    >
      <option disabled selected :value="placeholder ? placeholder : 'Select'">
        {{ placeholder ? placeholder : "Select" }}
      </option>
      <template v-if="isArrayOfObjects">
        <option
          :value="option.value"
          v-for="option in options as ArrayOfObjects[]"
          :key="option.value"
        >
          {{ option.label }}
        </option>
      </template>
      <template v-else="isArrayOfObjects">
        <option
          :value="option"
          v-for="option in options"
          :key="option as string"
        >
          {{ option }}
        </option>
      </template>
    </select>
    <div
      class="pointer-events-none absolute right-0 top-0 size-10 grid place-items-center"
    >
      <i v-if="!pending" v-html="icons.downAngle" />
      <i v-else class="animate-spin" v-html="icons.spinner" />
    </div>
  </div>
</template>
