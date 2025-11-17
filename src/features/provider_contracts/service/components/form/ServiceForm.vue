<!-- ServiceForm.vue -->
<script setup>
import Form from "@/components/new_form_builder/Form.vue";
import Input from "@/components/new_form_elements/Input.vue";
import Textarea from "@/components/new_form_elements/Textarea.vue";
import Select from "@/components/new_form_elements/Select.vue";


const props = defineProps({
  services: {
    type: Object,
    required: false,
  },
});

const statusOptions = [
  ['ACTIVE', 'INACTIVE'] // or ['ACTIVE', 'INACTIVE']
];
</script>

<template>
  <Form
    class="grid grid-cols-1 md:grid-cols-2 gap-6"
    :inner="false"
    id="serviceForm"
    v-slot="{}"
  >
    <!-- First Column -->
    <div class="space-y-6">
      <div>
        <Input
          name="item"
          validation="required|min:3"
          label="Service Name"
          :value="props.services?.item || ''"
          :attributes="{
            readonly,
            placeholder: 'e.g. X-Ray Scan',
          }"
        />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <Input
          name="itemCode"
          validation="required|alpha_dash"
          label="Item Code"
          :value="props.services?.itemCode || ''"
          :attributes="{
            readonly,
            placeholder: 'e.g. XR-100',
          }"
        />

        <Input
          name="price"
          validation="required|numeric|min_value:0"
          label="Price ($)"
          type="number"
          :value="props.services?.price || ''"
          :attributes="{
           
            placeholder: '0.00',
            step: '0.01',
            min: '0'
          }"
        />
      </div>

    
    </div>

    <!-- Second Column -->
    <div class="space-y-6">
      <div class="grid grid-cols-2 gap-4">
        <Input
          name="category"
          validation="required"
          label="Category"
          :value="props.services?.category || ''"
          :attributes="{
            readonly,
            placeholder: 'e.g. Radiology',
          }"
        />

        <Input
          name="subCategory"
          validation="required"
          label="Sub Category"
          :value="props.services?.subCategory || ''"
          :attributes="{
            readonly,
            placeholder: 'e.g. Diagnostic',
          }"
        />
      </div>
      
    

      <div>
        <Textarea
          name="description"
          label="Description"
          validation="max:500"
          :value="props.services?.description || ''"
          :attributes="{
            readonly,
            placeholder: 'Enter detailed description (max 500 chars)',
            rows: 4
          }"
        />
      </div>
    </div>
  </Form>
</template>

<style scoped>
/* Add custom styles if needed */
</style>