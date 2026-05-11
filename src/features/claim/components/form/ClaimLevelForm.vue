<script setup>
import Form from "@/components/new_form_builder/Form.vue";
import Input from "@/components/new_form_elements/Input.vue";
import Select from "@/components/new_form_elements/Select.vue";
import { computed } from 'vue';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({})
  },
  formId: {
    type: String,
    default: "claimLevelForm"
  }
});

const claimLevelData = computed(() => {
  // Handle triple nesting: props.data.data.data
  let sourceData = props.data;
  
  // Navigate through nested data structures
  if (sourceData?.data?.data) {
    sourceData = sourceData.data.data;
  } else if (sourceData?.data) {
    sourceData = sourceData.data;
  }
  
  console.log('ClaimLevelForm sourceData:', sourceData);
  
  return {
    claimLevel: sourceData?.claimLevel || '',
    min: sourceData?.minAmount !== undefined && sourceData?.minAmount !== null 
      ? sourceData.minAmount 
      : (sourceData?.min !== undefined && sourceData?.min !== null ? sourceData.min : ''),
    max: sourceData?.maxAmount !== undefined && sourceData?.maxAmount !== null 
      ? sourceData.maxAmount 
      : (sourceData?.max !== undefined && sourceData?.max !== null ? sourceData.max : ''),
  };
});

const levelOptions = ['LEVEL1', 'LEVEL2', 'LEVEL3', 'LEVEL4', 'LEVEL5'];
</script>

<template>
  <Form 
    class="grid grid-cols-1 md:grid-cols-2 gap-6 p-4" 
    :inner="false" 
    :id="formId" 
    v-slot="{}"
  >
    <!-- Claim Level Select -->
    <div class="md:col-span-2">
      <Select
        name="claimLevel"
        validation="required"
        label="Claim Level"
        :value="claimLevelData.claimLevel"
        :options="levelOptions"
        :attributes="{
          placeholder: 'Select a level',
          required: true
        }"
      />
    </div>

    <!-- Min and Max Limits -->
    <div class="md:col-span-2 border-t pt-4">
      <h3 class="text-lg font-medium text-gray-900 mb-4">Amount Range</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          name="min"
          validation="required|numeric|min_value:0"
          label="Minimum Amount"
          :value="`${claimLevelData.min}`"
          :attributes="{
            placeholder: '0.00',
            min: '0',
            step: '0.01',
            required: true
          }"
          prefix="ETB"
        />

        <Input
          name="max"
          validation="required|numeric|min_value:1"
          label="Maximum Amount"
          :value="claimLevelData.max"
          :attributes="{
            placeholder: '0.00',
            min: '1',
            step: '0.01',
            required: true
          }"
          prefix="ETB"
        />
        
      </div>
    </div>

    <!-- Info Box -->
    <div class="md:col-span-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-start gap-3">
      <svg class="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
      </svg>
      <p class="text-sm text-blue-800">
        Claims within this range will be automatically assigned to the selected level for processing.
      </p>
    </div>
  </Form>
</template>
