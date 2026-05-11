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
    class="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6"
    :inner="false"
    id="privilegeForm"
  >
    <!-- Privilege Name -->
    <div class="sm:col-span-1">
      <Input
        name="privilegeName"
        validation="required"
        label="Privilege Name"
        :value="props.privilege?.privilegeName || ''"
        :attributes="{
          placeholder: 'e.g., Create_User, Delete_Role',
         
        }"
      />
    </div>

    <!-- Privilege Category -->
    <div class="sm:col-span-1">
      <Input
        :value="props.privilege?.privilegeCategory || ''"
        name="privilegeCategory"
        label="Privilege Category"
        validation="required"
        :attributes="{
          placeholder: 'e.g., user, role, provider',
         
        }"
      />
    </div>

    <!-- Privilege Description -->
    <div class="sm:col-span-2">
      <Input
        validation="required"
        name="privilegeDescription"
        :value="props.privilege?.privilegeDescription || ''"
        label="Privilege Description"
        :attributes="{
          placeholder: 'Describe what this privilege allows users to do',
         
        }"
      />
    </div>

    <!-- Privilege Type (Admin Only) -->
    <!-- <div v-privilege.role="'ADMIN'" class="sm:col-span-2">
      <Select
        :obj="true"
        :value="props.privilege?.privilegeType"
        name="privilegeType"
        validation="required"
        label="Privilege Type"
        :options="privilegeType"
        :attributes="{
          placeholder: 'Select who can use this privilege',
         
        }"
      />
    </div> -->
  </Form>
</template>
