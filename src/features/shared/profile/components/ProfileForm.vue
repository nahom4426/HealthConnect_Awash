<script setup lang="ts">
import Form from "@/components/new_form_builder/Form.vue";
import Input from "@/components/new_form_elements/Input.vue";
import Select from "@/components/new_form_elements/Select.vue";
import { useAuthStore } from "@/stores/auth";
const authStore = useAuthStore();
</script>

<template>
  <div>
    <Form class="space-y-8" id="ProfileForm" :inner="false">
      <fieldset>
        <legend class="mb-1 text-sm font-semibold text-ink">Personal information</legend>
        <p class="mb-4 text-sm text-ink-muted">Your name as it appears across Health Connect.</p>
        <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input
          label="First Name"
          validation="required"
          :value="authStore.auth?.user?.firstName"
          name="firstName"
          :attributes="{
            placeholder: 'Enter your First Name',
          }"
        />
        <Input
          label="Father’s Name"
          :value="authStore.auth?.user?.fatherName"
          validation="required"
          name="fatherName"
          :attributes="{
            placeholder: 'Enter your Father’s Name',
          }"
        />
        <Input
          label="Grandfather’s Name"
          :value="authStore.auth?.user?.grandFatherName"
          validation="required"
          name="grandFatherName"
          :attributes="{
            placeholder: 'Enter your Grandfather’s Name',
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
          :value="authStore.auth?.user?.gender"
        />
        </div>
      </fieldset>
      <fieldset class="pt-6 border-t border-line">
        <legend class="sr-only">Contact information</legend>
        <p class="mb-1 text-sm font-semibold text-ink" aria-hidden="true">Contact information</p>
        <p class="mb-4 text-sm text-ink-muted">How we reach you about your account.</p>
        <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input
          label="Phone Number"
          :value="authStore.auth?.user?.mobilePhone"
          validation="required"
          name="phone"
          :attributes="{
            placeholder: 'Enter your phone number',
          }"
        />
        <Input
          label="Email"
          :value="authStore.auth?.user?.email"
          validation="required"
          name="email"
          :attributes="{
            placeholder: 'Enter your email',
          }"
        />
        </div>
      </fieldset>
    </Form>
  </div>
</template>
