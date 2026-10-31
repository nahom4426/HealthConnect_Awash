<script setup>
// import FormSubmitButton from "@/components/FormSubmitButton.vue";
import InputPassword from "@/components/new_form_elements/InputPassword.vue";
import { useApiRequest } from "@/composables/useApiRequest";
import { useAuthStore } from "@/stores/auth";
import { changePassword } from "../api/profileApi";
import Form from "@/components/new_form_builder/Form.vue";
import { closeModal } from "@customizer/modal-x";
import { toasted } from "@/utils/utils";
import ModalFormSubmitButton from "@/components/new_form_builder/ModalFormSubmitButton.vue";

const api = useApiRequest();
const authStore = useAuthStore();
function handleChangePassword({ values }) {

  api.send(
    () => changePassword(authStore.auth?.user?.userUuid, values),
    (res) => {
      if (res.success) {
        toasted(res.success, "Password Changed Successfully", res.error);
        closeModal();
      }
    }
  );
}
</script>

<template>
  <div class="w-full max-w-lg">
    <Form
    v-slot="{submit}"
      class="flex flex-col gap-5"
      id="SecurityForm"
    >
      <div>
        <p class="text-sm font-semibold text-ink">Change password</p>
        <p class="mt-1 text-sm text-ink-muted">
          Use a strong password you don't use elsewhere, then confirm it. Keep it confidential.
        </p>
      </div>
      <InputPassword
        name="oldPassword"
        label="Current password"
        validation="required"
        :attributes="{
          placeholder: 'Enter your current password',
        }"
      />
      <InputPassword
        name="newPassword"
        label="New password"
        validation="required"
        :attributes="{
          placeholder: 'Enter new password',
          autocomplete: 'new-password',
        }"
      />
        <!-- validation="required|equalTo-newPassword" -->

      <InputPassword
      validation="required|equalTo-newPassword"
        name="confirmPassword"
        label="Confirm new password"
        :attributes="{
          placeholder: 'Re-enter your new password',
          autocomplete: 'new-password',
        }"
      />
      <ModalFormSubmitButton
        class="self-start mt-1"
        @click.prevent="submit(handleChangePassword)"
        btn-text="Update password"
      />

    </Form>
  </div>
</template>
