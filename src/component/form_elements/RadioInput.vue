<script setup>
import { InputParent } from '@/form_builder';
import InputError from './InputError.vue';
import { ref, watch } from 'vue';

const props = defineProps({
  modelValue: {
    required: false
  },
  options: {
    type: Array,
    required: true
  },
  value: {
    type: String
  },
  name: {
    type: String, 
    required: true
  }
})

const emit = defineEmits(["update:modelValue"]);

const val = ref(props.modelValue || props.value || '')

function change(selected, validate) {
  val.value = selected
  emit('update:modelValue', selected)
  validate(selected)
}

watch(val, () => {
  console.log(val.value)
})
</script>

<template>
  <InputParent v-model="val" v-slot="{ error, setRef, emit }">
    <div :ref="setRef" :class="`flex flex-col gap-1 ${$attrs.class}`">
      <div class="p-2  rounded-md flex border flex-col gap-1">
        <div class="flex flex-c gap-2 items-center" :key="option.value" v-for="option in options">
          <input :checked="val == option.value" @change="change(option.value, emit)" :name="name" :value="option.value" type="radio" class="w-[1rem] h-[1rem]" />
          <p class="text-sm">{{ option.label }}</p>
        </div>
      </div>
      <InputError :error="error" />
    </div>
  </InputParent>
</template>