<script setup>
import Form from "@/components/new_form_builder/Form.vue";
import Input from "@/components/new_form_elements/Input.vue";
import Textarea from "@/components/new_form_elements/Textarea.vue";

const props = defineProps({
  drugs: {
    type: Object,
    Required: false,
  },
});
console.log(props.drugs);
</script>
<template>
  <Form class="grid grid-cols-3 gap-4" :inner="false" id="drugForm" v-slot="{}">
    <div class="col-span-3">
      <Input
        name="drugName"
        validation="required"
        label="Drug Name"
        :value="props.drugs?.drugName || ''"
        :attributes="{
          placeholder: 'Enter Drug Name',
        }"
      />
    </div>
    <Input
      name="drugCode"
      validation="required"
      label="Drug Code"
      :value="props.drugs?.drugCode || ''"
      :attributes="{
        placeholder: 'Enter Drug Code',
      }"
    />

    <Input
      name="category"
      validation="required"
      label="Category"
      :value="props.drugs?.category || ''"
      :attributes="{
        placeholder: 'Category',
      }"
    />
    <Input
      name="subCategory"
      validation="required"
      label="Sub Category"
      :value="props.drugs?.subCategory || ''"
      :attributes="{
        placeholder: 'Enter Sub Category',
      }"
    />

    <Input
      name="price"
      validation="required"
      label="Price"
      :value="props.drugs?.price || ''"
      :attributes="{
        placeholder: 'Price',
      }"
    />

    <Input
      name="dosage"
      validation="required"
      label="Dosage"
      :value="props.drugs?.dosage || ''"
      :attributes="{
        placeholder: 'Dosage',
      }"
    />
    <Input
      name="manufacturer"
      validation="required"
      label="Manufacturer"
      :value="props.drugs?.manufacturer || ''"
      :attributes="{
        placeholder: 'Manufacturer',
      }"
    />
  </Form>
</template>
