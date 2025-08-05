<script setup>
import Form from "@/components/new_form_builder/Form.vue";
import Input from "@/components/new_form_elements/Input.vue";
import Select from "@/components/new_form_elements/Select.vue";
import { ref, watch, onMounted } from "vue";
import vPrivilege from "@/directives/vPrivilage";

const props = defineProps({
  privilege: {
    type: Object,
    default: () => ({}),
  },
});

const privilegeType = ref([
  {
    label: "For All",
    value: "FOR_ALL",
  },
  {
    label: "Admin",
    value: "FOR_SYSTEM_ADMIN",
  },
  {
    label: "Provider",
    value: "FOR_PROVIDER",
  },
  {
    label: "Payer",
    value: "FOR_PAYER",
  },
]);
</script>
<template>
  <Form
    class="grid grid-cols-2 gap-x-20 gap-y-4"
    :inner="false"
    id="privilegeForm"
  >
    <Input
      name="privilegeName"
      validation="required"
      label="Privilege Name"
      :value="props.privilege?.privilegeName || ''"
      :attributes="{
        placeholder: 'Enter Privilege',
      }"
    />
    <Input
      validation="required"
      name="privilegeDescription"
      :value="props.privilege?.privilegeDescription || ''"
      label="Privilege Description"
      :attributes="{
        placeholder: 'Enter Privilege description',
      }"
    />
    <Input
      :value="props.privilege?.privilegeCategory || ''"
      name="privilegeCategory"
      label="Privilege Category"
      validation="required"
      :attributes="{
        placeholder: 'Enter Privilege Category',
      }"
    />
     <Input
      :value="props.privilege?.privilegeType || ''"
      name="privilegeType"
      label="Privilege Type"
      validation="required"
      :attributes="{
        placeholder: 'Enter Privilege Type',
      }"
    />
    <div v-privilege.role="'ADMIN'">
      <Select
        :obj="true"
        :value="props.privilege?.privilegeType"
        name="privilegeType"
        validation="required"
        label="Privilege Type"
        :options="privilegeType"
        :attributes="{
          placeholder: 'Enter Privilege Type',
        }"
      />
    </div>
  </Form>
</template>
