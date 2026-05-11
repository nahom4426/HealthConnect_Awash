<script setup lang="ts">
import Form from "@/components/new_form_builder/Form.vue";
import Input from "@/components/new_form_elements/Input.vue";
import Select from "@/components/new_form_elements/Select.vue";
import { useAuthStore } from "@/stores/auth";
import { computed } from "vue";
const authStore = useAuthStore();
const u = computed(() => authStore.auth?.user ?? authStore.auth ?? {});
</script>

<template>
  <div>
    <Form class="space-y-6" id="ProfileForm" :inner="false">
      <div
        class="border border-base-clr/20 grid grid-cols-2 gap-6 rounded-md p-5"
      >
        <Input
          label="First Name"
          validation="required"
          :value="u.firstName"
          name="firstName"
          :attributes="{
            placeholder: 'Enter your First Name',
          }"
        />
        <Input
          label="Father's Name"
          :value="u.fatherName"
          validation="required"
          name="fatherName"
          :attributes="{
            placeholder: 'Enter your Father\'s Name',
          }"
        />
        <Input
          label="Grandfather's Name"
          :value="u.grandFatherName"
          validation="required"
          name="grandFatherName"
          :attributes="{
            placeholder: 'Enter your Grandfather\'s Name',
          }"
        />
        <Select
          label="Gender"
          name="gender"
          :options="['MALE', 'FEMALE']"
          :attributes="{
            type: 'text',
            placeholder: 'Enter Your Gender',
          }"
          :modelValue="u.gender"
        />
      </div>
      <div
        class="border border-base-clr/20 grid grid-cols-2 gap-6 rounded-md p-5"
      >
        <Input
          label="Phone Number"
          :value="u.mobilePhone"
          validation="required"
          name="phone"
          :attributes="{
            placeholder: 'Enter your phone number',
          }"
        />
        <Input
          label="Email"
          :value="u.email"
          validation="required"
          name="email"
          :attributes="{
            placeholder: 'Enter your email',
          }"
        />
      </div>
    </Form>
  </div>
</template>
