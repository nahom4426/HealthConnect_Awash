<script setup>
import InputParent from "../../new_form_builder/InputParent.vue";

const props = defineProps({
  name: {
    type: String,
    required: true,
  },
  options: {
    type: Array,
    required: true,
  },
});
</script>

<template>
  <InputParent
    :name="name"
    v-slot="{ error, setRef, value, changeValue }"
  >
    <p v-if="error" class="text-xs text-red-500 mb-1.5">{{ error }}</p>
    <div :ref="setRef" class="flex flex-wrap gap-3">
      <label
        v-for="option in options"
        :key="typeof option === 'object' ? option.value : option"
        class="flex items-center gap-2 cursor-pointer group"
      >
        <span class="relative flex items-center justify-center">
          <input
            :checked="value == (typeof option === 'object' ? option.value : option)"
            @change="() => changeValue(typeof option === 'object' ? option.value : option)"
            :name="name"
            type="radio"
            :value="typeof option === 'object' ? option.value : option"
            class="sr-only"
          />
          <!-- Custom radio visual -->
          <span
            class="w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-150"
            :class="value == (typeof option === 'object' ? option.value : option)
              ? 'border-primary'
              : 'border-gray-300 group-hover:border-gray-400'"
          >
            <span
              v-if="value == (typeof option === 'object' ? option.value : option)"
              class="w-2 h-2 rounded-full bg-primary"
            />
          </span>
        </span>
        <span class="text-sm text-gray-700 select-none">
          {{ typeof option === 'object' ? option.label : option }}
        </span>
      </label>
    </div>
  </InputParent>
</template>
