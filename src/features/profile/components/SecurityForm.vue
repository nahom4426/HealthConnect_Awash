<script setup>
// import FormSubmitButton from "@/components/FormSubmitButton.vue";
import InputPassword from "@/components/new_form_elements/InputPassword.vue";
import { computed } from "vue";
import { useApiRequest } from "@/composables/useApiRequest";
import { useAuthStore } from "@/stores/auth";
import { changePassword } from "../api/profileApi";
import Form from "@/components/new_form_builder/Form.vue";
import { toasted } from "@/utils/utils";
import ModalFormSubmitButton from "@/components/new_form_builder/ModalFormSubmitButton.vue";
import { closeModal } from "@customizer/modal-x";

const api = useApiRequest();
const authStore = useAuthStore();
const u = computed(() => authStore.auth?.user ?? authStore.auth ?? {});
function handleChangePassword({ values }) {

  api.send(
    () => changePassword(u.value?.userUuid, values),
    (res) => {
      toasted(res.success, "Password Changed Successfully", res.error);
      if (res.success) {
        try { closeModal(); } catch {}
      }
    }
  );
}
</script>

<template>
  <div class="flex justify-center w-full">
    <Form
    v-slot="{submit}"
      class="flex flex-col w-[33rem] box-border rounded-md border px-5 py-8 border-base-clr/20 gap-6"
      id="SecurityForm"
    >
      <div class="flex flex-col gap-4 w-full text-center">
        <span class="text-lg font-semibold text-base-clr"
          >Change Login Password</span
        >
        <span class="text-base-clr">
          Enter your new password in the provided field. After creating a strong
          password, confirm it by entering it again. Keep your password
          confidential and avoid using easily guessable information.</span
        >
      </div>
      <InputPassword
        name="oldPassword"
        label="Password"
        validation="required"
        :attributes="{
          placeholder: 'Enter your current password',
        }"
      />
      <InputPassword
        name="newPassword"
        label="New Password"
        validation="required"
        :attributes="{
          placeholder: 'Enter new password',
        }"
      />
        <!-- validation="required|equalTo-newPassword" -->

      <InputPassword
      validation="required|equalTo-newPassword"
        name="confirmPassword"
        label="Confirm Password"
        :attributes="{
          placeholder: 'Reenter your new password',
        }"
      />
      <ModalFormSubmitButton
        class="box-border w-full h-14"
        @click.prevent="submit(handleChangePassword)"
        btn-text="Change Password"
      />

    </Form>
  </div>
</template>
