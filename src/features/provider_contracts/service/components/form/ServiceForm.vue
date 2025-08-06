<script setup>
import Form from "@/components/new_form_builder/Form.vue";
import Input from "@/components/new_form_elements/Input.vue";
import Textarea from "@/components/new_form_elements/Textarea.vue";

const props = defineProps({
  services: {
    type: Object,
    Required: false,
  },
});
console.log(props.services);
</script>
<template>
  <Form
    class="grid grid-cols-3 gap-4"
    :inner="false"
    id="serviceForm"
    v-slot="{}"
  >
    <div class="col-span-3">
      <Input
        name="serviceName"
        validation="required"
        label="Service Name"
        :value="props.services?.serviceName || ''"
        :attributes="{
          placeholder: 'Enter Service Name',
        }"
      />
    </div>
    <Input
      name="serviceCode"
      validation="required"
      label="Item Code"
      :value="props.services?.serviceCode || ''"
      :attributes="{
        placeholder: 'Item Code',
      }"
    />

    <Input
      name="serviceCategory"
      validation="required"
      label="Category"
      :value="props.services?.serviceCategory || ''"
      :attributes="{
        placeholder: 'Category',
      }"
    />
    <Input
      name="serviceSubCategory"
      validation="required"
      label="Sub Category"
      :value="props.services?.serviceSubCategory || ''"
      :attributes="{
        placeholder: 'Sub Category',
      }"
    />

    <!-- <Input
      name="price"
      validation="required"
      label="Price"
      :value="props.services?.price || ''"
      :attributes="{
        placeholder: 'Price',
      }"
    /> -->
    <div class="col-span-3">
      <Textarea
        name="serviceDescription"
        label="Description"
        :value="props.services?.serviceDescription || ''"
        :attributes="{
          placeholder: 'Enter Description',
        }"
      />
    </div>
  </Form>
</template>
