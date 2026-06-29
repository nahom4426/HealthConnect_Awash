<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

import Button from '@/components/Button.vue';
import { Form } from '@/components/new_form_builder';
import Input from '@/components/new_form_elements/Input.vue';
import InputPassword from '@/components/new_form_elements/InputPassword.vue';

import { useApiRequest } from '@/composables/useApiRequest';

import {
  login,
  forgotPassword,
  checkResetCodeAndSetPassword,
} from '@/features/auth/authApi';

import { useAuthStore } from '@/stores/auth';
import { toasted } from '@/utils/utils';

const req = useApiRequest();
const forgotReq = useApiRequest(false);
const resetReq = useApiRequest(false);

const auth = useAuthStore();
const router = useRouter();

const showForgotPassword = ref(false);
const forgotStep = ref('request');

const forgotEmail = ref('');
const passwordResetCode = ref('');
const newPassword = ref('');
const confirmPassword = ref('');

const passwordMismatch = computed(() => {
  if (!newPassword.value || !confirmPassword.value) return false;
  return newPassword.value !== confirmPassword.value;
});

function loginUser({ values }) {
  req.send(
    () => login(values),
    (res) => {
      if (res.success) {
        auth.setAuth(res.data);
        localStorage.setItem('userDetail', JSON.stringify(res.data));
        router.replace('/dashboard');
        toasted(true, 'Loggedin Successfully');
      }
    }
  );
}

function handleSubmit(submitFn) {
  submitFn(loginUser);
}

function openForgotPassword() {
  showForgotPassword.value = true;
  forgotStep.value = 'request';

  forgotEmail.value = '';
  passwordResetCode.value = '';
  newPassword.value = '';
  confirmPassword.value = '';
}

function closeForgotPassword() {
  showForgotPassword.value = false;
}

function submitForgotPasswordRequest() {
  if (!forgotEmail.value) {
    toasted(false, '', 'Email is required');
    return;
  }

  forgotReq.send(
    () => forgotPassword(forgotEmail.value),
    (res) => {
      if (res?.success) {
        toasted(true, 'Reset code sent successfully');
        forgotStep.value = 'reset';
      }
    }
  );
}

function submitResetPassword() {
  if (
    !passwordResetCode.value ||
    !newPassword.value ||
    !confirmPassword.value
  ) {
    toasted(false, '', 'All fields are required');
    return;
  }

  if (passwordMismatch.value) {
    toasted(false, '', 'Passwords do not match');
    return;
  }

  resetReq.send(
    () =>
      checkResetCodeAndSetPassword({
        passwordResetCode: passwordResetCode.value,
        newPassword: newPassword.value,
        confirmPassword: confirmPassword.value,
      }),
    (res) => {
      if (res?.success) {
        toasted(true, 'Password updated successfully');
        closeForgotPassword();
      }
    }
  );
}
</script>
<template>
  <div
    class="bg-[#F7F7F9] sm:w-full shadow-lg min-h-fit py-24 px-16 items-center justify-center flex flex-col rounded-3xl gap-10"
  >
    <div class="flex flex-col gap-4 items-center w-full">
      <img class="h-30" src="/src/assets/img/logo.png" />
      <p class="text-2xl font-bold text-primary">HealthConnect</p>
    </div>

    <div class="grid w-full">

      <!-- LOGIN FORM -->
      <Form
        v-if="!showForgotPassword"
        v-slot="{ submit }"
        id="login-form"
        @submit="handleSubmit(submit)"
        class="flex flex-col gap-8 w-full"
      >
        <div class="space-y-4">
          <Input
            :focus="true"
            validation="required|email"
            label="Email"
            name="email"
            :attributes="{
              placeholder: 'Email',
            }"
          />

          <InputPassword
            validation="required"
            label="Password"
            name="password"
            :attributes="{
              placeholder: 'Password',
            }"
          />

          <div class="flex justify-end">
            <button
              type="button"
              class="text-sm text-primary font-medium hover:underline"
              @click="openForgotPassword"
            >
              Forgot Password?
            </button>
          </div>
        </div>

        <Button
          class="h-16 text-base font-bold rounded-md"
          :pending="req.pending.value"
          @click.prevent="submit(loginUser)"
          type="primary"
        >
          Login
        </Button>
      </Form>

      <!-- FORGOT PASSWORD -->
      <div
        v-else
        class="flex flex-col gap-5 w-full"
      >
        <div class="flex justify-between items-center">
          <h2 class="text-xl font-bold text-primary">
            Forgot Password
          </h2>

          <button
            type="button"
            class="text-sm font-medium text-primary hover:underline"
            @click="closeForgotPassword"
          >
            Back to Login
          </button>
        </div>

        <!-- REQUEST RESET CODE -->
        <template v-if="forgotStep === 'request'">
          <Input
            label="Email"
            name="forgotEmail"
            :attributes="{
              placeholder: 'Enter your email'
            }"
            v-model="forgotEmail"
          />

          <Button
            type="primary"
            :pending="forgotReq.pending.value"
            @click="submitForgotPasswordRequest"
          >
            Send Reset Code
          </Button>
        </template>

        <!-- RESET PASSWORD -->
        <template v-else>
          <div class="flex flex-col gap-4">

            <input
              v-model="passwordResetCode"
              type="text"
              placeholder="Reset Code"
              class="border rounded-md px-4 py-3"
            />

            <input
              v-model="newPassword"
              type="password"
              placeholder="New Password"
              class="border rounded-md px-4 py-3"
            />

            <input
              v-model="confirmPassword"
              type="password"
              placeholder="Confirm Password"
              class="border rounded-md px-4 py-3"
            />

            <p
              v-if="passwordMismatch"
              class="text-red-500 text-sm"
            >
              Passwords do not match
            </p>

            <div class="flex gap-3">
              <Button
                @click="forgotStep = 'request'"
              >
                Back
              </Button>

              <Button
                type="primary"
                :pending="resetReq.pending.value"
                :disabled="passwordMismatch"
                @click="submitResetPassword"
              >
                Update Password
              </Button>
            </div>
          </div>
        </template>
      </div>

    </div>
  </div>
</template>