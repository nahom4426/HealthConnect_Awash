<script setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import Button from "@/components/Button.vue";
import { Form } from "@/components/new_form_builder";
import Input from "@/components/new_form_elements/Input.vue";
import InputPassword from "@/components/new_form_elements/InputPassword.vue";
import { useApiRequest } from "@/composables/useApiRequest";
import { checkResetCodeAndSetPassword, forgotPassword, login } from "@/features/auth/authApi";
import { useAuthStore } from "@/stores/auth";
import { toasted } from "@/utils/utils";

const req = useApiRequest();
const forgotReq = useApiRequest(false);
const resetReq = useApiRequest(false);
const auth = useAuthStore();
const router = useRouter();

/* ---------- Sign in ---------- */
const signedIn = ref(false);

function loginUser({ values }) {
  req.send(
    () => login(values),
    (res) => {
      if (res.success) {
        signedIn.value = true;
        auth.setAuth(res.data);
        router.replace("/dashboard");
      }
    }
  );
}

/* ---------- Forgot password (request code → set new password) ---------- */
const view = ref("login"); // 'login' | 'request' | 'reset'
const forgotEmail = ref("");
const passwordResetCode = ref("");
const newPassword = ref("");
const confirmPassword = ref("");
const showNewPassword = ref(false);

const passwordMismatch = computed(
  () => !!newPassword.value && !!confirmPassword.value && newPassword.value !== confirmPassword.value
);

function openForgotPassword() {
  forgotEmail.value = "";
  passwordResetCode.value = "";
  newPassword.value = "";
  confirmPassword.value = "";
  view.value = "request";
}

function submitForgotPasswordRequest() {
  if (!forgotEmail.value) {
    toasted(false, "", "Email is required");
    return;
  }
  forgotReq.send(
    () => forgotPassword(forgotEmail.value),
    (res) => {
      if (res?.success) {
        toasted(true, "Reset code sent. Please check your email.", "");
        view.value = "reset";
      }
    }
  );
}

function submitResetPassword() {
  if (!passwordResetCode.value || !newPassword.value || !confirmPassword.value) {
    toasted(false, "", "All fields are required");
    return;
  }
  if (passwordMismatch.value) {
    toasted(false, "", "Passwords do not match");
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
        toasted(true, "Password updated successfully. You can now sign in.", "");
        view.value = "login";
      }
    }
  );
}
</script>

<template>
  <div>
    <!-- Sign in -->
    <template v-if="view === 'login'">
      <header class="mb-7 text-center">
        <h1 id="login-title" class="!px-0 text-xl font-semibold tracking-tight sm:text-2xl text-ink">Sign in to Health Connect</h1>
        <p class="mt-1.5 text-sm text-ink-muted">Welcome back. Enter your work email and password.</p>
      </header>

      <Form v-slot="{ submit }" id="login-form" @submit="submit(loginUser)">
        <div class="space-y-5">
          <Input
            :focus="true"
            label="Email address"
            validation="required|email"
            name="email"
            :attributes="{
              placeholder: 'name@company.com',
              autocomplete: 'username',
              inputmode: 'email',
            }"
          />

          <div class="relative">
            <InputPassword
              label="Password"
              validation="required"
              name="password"
              :attributes="{ placeholder: 'Enter your password' }"
            />
            <button
              type="button"
              class="absolute top-0 right-0 text-sm font-medium rounded text-primary hover:underline underline-offset-2"
              @click="openForgotPassword"
            >
              Forgot password?
            </button>
          </div>

          <Button
            type="primary"
            size="lg"
            html-type="submit"
            class="w-full"
            :pending="req.pending.value || signedIn"
          >
            Sign in
          </Button>
        </div>
      </Form>
    </template>

    <!-- Forgot password: request code -->
    <template v-else-if="view === 'request'">
      <header class="mb-7">
        <button type="button" class="inline-flex gap-1.5 items-center mb-6 text-sm font-medium text-ink-muted hover:text-ink" @click="view = 'login'">
          <svg class="w-4 h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 10H4m0 0 5-5m-5 5 5 5" /></svg>
          Back to sign in
        </button>
        <h1 id="login-title" class="!px-0 text-xl font-semibold tracking-tight sm:text-2xl text-ink">Reset your password</h1>
        <p class="mt-1.5 text-sm text-ink-muted">Enter your account email and we'll send you a reset code.</p>
      </header>

      <form class="space-y-5" @submit.prevent="submitForgotPasswordRequest">
        <div class="flex flex-col gap-1.5">
          <label for="forgot-email" class="text-sm font-medium text-ink">Email address</label>
          <div class="input-shell">
            <input
              id="forgot-email"
              v-model="forgotEmail"
              v-focus="true"
              type="email"
              required
              autocomplete="email"
              class="skip_custom-input"
              placeholder="name@company.com"
            />
          </div>
        </div>
        <Button type="primary" size="lg" html-type="submit" class="w-full" :pending="forgotReq.pending.value">
          Send reset code
        </Button>
      </form>
    </template>

    <!-- Forgot password: set new password -->
    <template v-else>
      <header class="mb-7">
        <button type="button" class="inline-flex gap-1.5 items-center mb-6 text-sm font-medium text-ink-muted hover:text-ink" @click="view = 'request'">
          <svg class="w-4 h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 10H4m0 0 5-5m-5 5 5 5" /></svg>
          Back
        </button>
        <h1 id="login-title" class="!px-0 text-xl font-semibold tracking-tight sm:text-2xl text-ink">Set a new password</h1>
        <p class="mt-1.5 text-sm text-ink-muted">
          Enter the code sent to <span class="font-medium text-ink">{{ forgotEmail }}</span> and choose a new password.
        </p>
      </header>

      <form class="space-y-5" @submit.prevent="submitResetPassword">
        <div class="flex flex-col gap-1.5">
          <label for="reset-code" class="text-sm font-medium text-ink">Reset code</label>
          <div class="input-shell">
            <input id="reset-code" v-model="passwordResetCode" v-focus="true" type="text" required autocomplete="one-time-code" class="skip_custom-input" placeholder="Enter the code from your email" />
          </div>
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="new-password" class="text-sm font-medium text-ink">New password</label>
          <div class="input-shell">
            <input
              id="new-password"
              v-model="newPassword"
              :type="showNewPassword ? 'text' : 'password'"
              required
              autocomplete="new-password"
              class="skip_custom-input"
              placeholder="Enter a new password"
            />
            <button
              type="button"
              class="!flex-none grid place-items-center w-10 text-ink-subtle hover:text-ink"
              :aria-label="showNewPassword ? 'Hide passwords' : 'Show passwords'"
              :aria-pressed="showNewPassword"
              @click="showNewPassword = !showNewPassword"
            >
              <svg class="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M2.5 12C3.5 9.5 7 5 12 5s8.5 4.5 9.5 7c-1 2.5-4.5 7-9.5 7s-8.5-4.5-9.5-7Z" />
                <circle cx="12" cy="12" r="3" />
                <path v-if="showNewPassword" d="M3 3l18 18" />
              </svg>
            </button>
          </div>
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="confirm-password" class="text-sm font-medium text-ink">Confirm new password</label>
          <div class="input-shell" :class="{ 'input-shell--error': passwordMismatch }">
            <input
              id="confirm-password"
              v-model="confirmPassword"
              :type="showNewPassword ? 'text' : 'password'"
              required
              autocomplete="new-password"
              class="skip_custom-input"
              placeholder="Re-enter the new password"
              :aria-invalid="passwordMismatch || undefined"
              :aria-describedby="passwordMismatch ? 'confirm-password-error' : undefined"
            />
          </div>
          <p v-if="passwordMismatch" id="confirm-password-error" class="text-xs text-error" role="alert">Passwords do not match</p>
        </div>

        <Button
          type="primary"
          size="lg"
          html-type="submit"
          class="w-full"
          :pending="resetReq.pending.value"
          :disabled="passwordMismatch"
        >
          Update password
        </Button>
      </form>
    </template>

    <p class="pt-5 mt-7 text-xs text-center border-t text-ink-subtle border-line">
      Need access or help signing in? Contact your system administrator.
    </p>
  </div>
</template>
