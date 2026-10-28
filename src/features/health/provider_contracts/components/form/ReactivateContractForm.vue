<script setup>
import Form from "@/components/new_form_builder/Form.vue";
import Input from "@/components/new_form_elements/Input.vue";
import Textarea from "@/components/new_form_elements/Textarea.vue";
import { computed } from 'vue';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({})
  },
  formId: {
    type: String,
    default: "reactivateContractForm"
  }
});

// Handle nested data structure
const contractData = computed(() => {
  if (props.data && props.data.data) {
    return {
      contractName: props.data.data.contractName || '',
      contractCode: props.data.data.contractCode || '',
      description: props.data.data.description || '',
      beginDate: formatDateForInput(props.data.data.beginDate),
      endDate: formatDateForInput(props.data.data.endDate)
    };
  }
  return {
    contractName: props.data.contractName || '',
    contractCode: props.data.contractCode || '',
    description: props.data.description || '',
    beginDate: formatDateForInput(props.data.beginDate),
    endDate: formatDateForInput(props.data.endDate)
  };
});

function formatDateForInput(isoDate) {
  if (!isoDate) return "";
  try {
    const date = new Date(isoDate);
    return date.toISOString().split('T')[0];
  } catch (error) {
    return "";
  }
}
</script>

<template>
  <Form 
    class="p-1 space-y-5" 
    :inner="false" 
    :id="formId" 
    v-slot="{}"
  >
    <!-- Info Banner -->
    <div class="flex gap-3 items-start p-4 bg-blue-50 rounded-r-lg border-l-4 border-blue-500">
      <div class="flex-shrink-0 mt-0.5">
        <svg class="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
        </svg>
      </div>
      <div class="flex-1">
        <p class="text-sm font-medium text-blue-900">Contract Reactivation</p>
        <p class="mt-1 text-xs text-blue-700">Review and update the contract details below. The contract will be set to ACTIVE status upon submission.</p>
      </div>
    </div>

    <!-- Contract Name and Code Side by Side -->
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Input
        name="contractName"
        validation="required|min:3|max:100"
        label="Contract Name"
        :value="contractData.contractName"
        :attributes="{
          placeholder: 'Enter contract name'
        }"
      />

      <Input
        name="contractCode"
        validation="required|min:2|max:50"
        label="Contract Code"
        :value="contractData.contractCode"
        :attributes="{
          placeholder: 'Enter contract code'
        }"
      />
    </div>

    <!-- Description -->
    <Textarea
      name="description"
      validation="max:500"
      label="Description"
      :value="contractData.description"
      :attributes="{
        placeholder: 'Enter contract description (optional)',
        rows: 3,
        maxlength: 500
      }"
    />

    <!-- Date Range -->
    <div class="p-5 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200">
      <div class="flex gap-2 items-center mb-4">
        <svg class="w-5 h-5 text-[#02676B]" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
        </svg>
        <h3 class="text-sm font-semibold text-gray-800">Contract Period</h3>
      </div>
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          name="beginDate"
          type="date"
          validation="required"
          label="📅 Begin Date"
          :value="contractData.beginDate"
          :attributes="{
            placeholder: 'Select begin date',
            type: 'date'
          }"
        />

        <Input
          name="endDate"
          type="date"
          validation="required"
          label="📅 End Date"
          :value="contractData.endDate"
          :attributes="{
            placeholder: 'Select end date',
            type: 'date'
          }"
        />
      </div>
    </div>

    <!-- Status Display -->
    <div class="p-5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
      <label class="flex gap-2 items-center mb-3 text-sm font-semibold text-gray-700">
        <svg class="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
        </svg>
        New Status
      </label>
      <div class="flex gap-3 items-center px-4 py-3 bg-white rounded-lg border border-green-300 shadow-sm">
        <div class="flex-shrink-0">
          <div class="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
        </div>
        <div class="flex-1">
          <span class="text-lg font-bold text-green-700">ACTIVE</span>
          <p class="mt-0.5 text-xs text-green-600">Contract will be reactivated</p>
        </div>
        <svg class="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
        </svg>
      </div>
    </div>
  </Form>
</template>
