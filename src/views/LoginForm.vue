<script setup>
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Form } from '@/components/new_form_builder';
import Input from '@/components/new_form_elements/Input.vue';
import InputPassword from '@/components/new_form_elements/InputPassword.vue';
import { useApiRequest } from '@/composables/useApiRequest';
import { login } from '@/features/shared/auth/authApi';
import { useAuthStore } from '@/stores/auth';
import { toasted } from '@/utils/utils';

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();
const req = useApiRequest();
const forgotReq = useApiRequest(false);
const resetReq = useApiRequest(false);

const showSuccess = ref(false);
const loginError = ref('');
const errorKey = ref(0);
const showForgot = ref(false);
const forgotStep = ref('request');
const forgotEmail = ref('');
const resetCode = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const rememberMe = ref(false);

const passwordMismatch = computed(() =>
  newPassword.value && confirmPassword.value
    ? newPassword.value !== confirmPassword.value
    : false
);

function reRoute() {
  const target = route.query.redirect || '/module-select';
  router.push(target);
}

// The backend reports bad credentials as a 500, so map auth-ish failures to a friendly message.
function friendlyLoginError(res) {
  const msg = String(res?.error || '');
  if (/credential|password|unauthori|not found|invalid/i.test(msg) || res?.status === 401) {
    return 'The username or password you entered is incorrect.';
  }
  if (typeof res?.status === 'string' || /network/i.test(msg)) {
    return 'We could not reach the server. Check your connection and try again.';
  }
  return msg || 'Sign in failed. Please try again.';
}

function showLoginError(message) {
  loginError.value = message;
  errorKey.value++;
}

function clearLoginError() {
  if (loginError.value) loginError.value = '';
}

function loginUser({ values }) {
  if (req.pending.value || showSuccess.value) return;
  clearLoginError();

  req.send(
    () => login(values),
    (res) => {
      // responseHandler resolves (never rejects) on HTTP errors, so check the outcome here.
      if (!res?.success) {
        showLoginError(friendlyLoginError(res));
        return;
      }

      let userObj = res;
      if (res && res.data) userObj = res.data;
      if (userObj && userObj.data) userObj = userObj.data;

      if (!userObj || typeof userObj !== 'object') {
        showLoginError('Sign in failed. Please try again.');
        return;
      }

      if (userObj.roleCode) {
        localStorage.setItem('standard_active_testing_role', userObj.roleCode);
      }
      showSuccess.value = true;
      auth.setAuth(userObj);
      localStorage.setItem('userDetail', JSON.stringify(userObj));
      setTimeout(() => reRoute(), 900);
    }
  ).catch(() => showLoginError('Sign in failed. Please try again.'));
}

function openForgot() {
  clearLoginError();
  showForgot.value = true;
  forgotStep.value = 'request';
  forgotEmail.value = '';
  resetCode.value = '';
  newPassword.value = '';
  confirmPassword.value = '';
}

function handleForgotPassword() {
  forgotReq.send(
    () => Promise.resolve({ success: true }),
    () => {
      forgotStep.value = 'reset';
      toasted(true, 'Reset code sent', 'Check your email for the reset code');
    }
  );
}

function handleResetPassword() {
  resetReq.send(
    () => Promise.resolve({ success: true }),
    () => {
      toasted(true, 'Password Updated', 'You can now sign in with your new password');
      showForgot.value = false;
    }
  );
}
</script>

<template>
  <div class="lf-root">

    <!-- ── Success overlay (only after a successful sign-in) ── -->
    <Transition name="success">
      <div v-if="showSuccess" class="lf-success-overlay" role="status" aria-live="polite">
        <div class="lf-success-inner">
          <div class="lf-success-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path class="lf-check-path" d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <h3 class="lf-success-title">You're signed in</h3>
          <p class="lf-success-sub">Taking you to your workspace…</p>
          <div class="lf-progress-track"><div class="lf-progress-bar"></div></div>
        </div>
      </div>
    </Transition>

    <!-- ── LOGIN VIEW ── -->
    <div v-if="!showForgot" class="lf-view">
      <header class="lf-header">
        <h2 class="lf-title">Sign in</h2>
        <p class="lf-subtitle">Welcome back. Enter your details to access your dashboard.</p>
      </header>

      <Transition name="alert">
        <div v-if="loginError" :key="errorKey" class="lf-alert" role="alert">
          <svg class="lf-alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="9"/>
            <path stroke-linecap="round" d="M12 8v4.5M12 16h.01"/>
          </svg>
          <div class="lf-alert-text">
            <strong>Couldn't sign you in</strong>
            <span>{{ loginError }}</span>
          </div>
          <button type="button" class="lf-alert-close" aria-label="Dismiss" @click="clearLoginError">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
        </div>
      </Transition>

      <Form v-slot="{ submit }" id="login-form">
        <div
          class="lf-fields"
          :class="{ 'lf-has-error': loginError }"
          @input="clearLoginError"
          @keydown.enter.prevent="submit(loginUser)"
        >
          <div class="lf-field">
            <Input
              :focus="true"
              validation="required"
              name="email"
              label="Username or email"
              :attributes="{ placeholder: 'e.g. adjustor@standardinsurance.com', autocomplete: 'username', type: 'text' }"
            />
          </div>

          <div class="lf-field">
            <InputPassword
              validation="required"
              name="password"
              label="Password"
              :attributes="{ placeholder: 'Enter your password', autocomplete: 'current-password' }"
            />
          </div>

          <div class="lf-options">
            <label class="lf-remember">
              <input type="checkbox" v-model="rememberMe" class="lf-checkbox" />
              <span>Keep me signed in</span>
            </label>
            <button type="button" @click.prevent="openForgot" class="lf-link">Forgot password?</button>
          </div>

          <button
            type="button"
            class="lf-btn"
            :disabled="req.pending.value || showSuccess"
            :aria-busy="req.pending.value"
            @click.prevent="submit(loginUser)"
          >
            <span>{{ req.pending.value ? 'Signing in…' : 'Sign in' }}</span>
            <span class="lf-btn-orb" aria-hidden="true">
              <span v-if="req.pending.value" class="lf-spinner"></span>
              <svg v-else class="lf-btn-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M5 12h14m-5-5l5 5-5 5"/>
              </svg>
            </span>
          </button>
        </div>
      </Form>

      <p class="lf-help">
        Having trouble signing in? <a href="#" class="lf-link">Contact support</a>
      </p>
    </div>

    <!-- ── FORGOT PASSWORD VIEW ── -->
    <div v-else class="lf-view">
      <button type="button" @click="showForgot = false" class="lf-back">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
        Back to sign in
      </button>

      <header class="lf-header">
        <h2 class="lf-title">{{ forgotStep === 'request' ? 'Reset your password' : 'Choose a new password' }}</h2>
        <p class="lf-subtitle">
          {{ forgotStep === 'request'
            ? "Enter the email on your account and we'll send you a reset code."
            : 'Enter the code from your email and pick a new password.' }}
        </p>
      </header>

      <div v-if="forgotStep === 'request'" class="lf-fields">
        <div class="lf-field">
          <Input
            name="forgotEmail"
            label="Email address"
            :attributes="{ placeholder: 'you@standardinsurance.com', type: 'email' }"
            :modelValue="forgotEmail"
            @update:modelValue="forgotEmail = $event"
          />
        </div>
        <button type="button" class="lf-btn" :disabled="forgotReq.pending.value" @click="handleForgotPassword">
          <span v-if="forgotReq.pending.value" class="lf-spinner" aria-hidden="true"></span>
          <span>Send reset code</span>
        </button>
      </div>

      <div v-else class="lf-fields">
        <div class="lf-field">
          <Input
            name="resetCode"
            label="Reset code"
            :attributes="{ placeholder: '· · · · · ·', type: 'text', class: 'text-center font-mono tracking-widest text-lg' }"
            :modelValue="resetCode"
            @update:modelValue="resetCode = $event"
          />
        </div>
        <div class="lf-field">
          <Input
            name="newPassword"
            label="New password"
            :attributes="{ placeholder: 'Create a strong password', type: 'password' }"
            :modelValue="newPassword"
            @update:modelValue="newPassword = $event"
          />
        </div>
        <div class="lf-field">
          <Input
            name="confirmPassword"
            label="Confirm password"
            :attributes="{ placeholder: 'Re-enter your password', type: 'password' }"
            :modelValue="confirmPassword"
            @update:modelValue="confirmPassword = $event"
          />
        </div>
        <p v-if="passwordMismatch" class="lf-error-msg">Passwords do not match</p>
        <div class="lf-reset-actions">
          <button type="button" class="lf-btn lf-btn-ghost" @click="forgotStep = 'request'">Back</button>
          <button
            type="button"
            class="lf-btn"
            :disabled="resetReq.pending.value || passwordMismatch"
            @click="handleResetPassword"
          >
            <span v-if="resetReq.pending.value" class="lf-spinner" aria-hidden="true"></span>
            <span>Update password</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Theme tokens (--si-*) are defined on .login-wrapper in Login.vue. */
.lf-root { position: relative; }

.lf-view { animation: lfFadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both; }

/* ── Header ── */
.lf-header { margin-bottom: 1.75rem; }
.lf-title {
  font-family: var(--si-display, inherit);
  font-size: 2rem; font-weight: 700; letter-spacing: -0.02em; line-height: 1.15;
  color: var(--si-text); margin: 0 0 0.5rem;
}
.lf-subtitle { font-size: 0.9375rem; line-height: 1.55; color: var(--si-text-muted); margin: 0; }

/* ── Error alert ── */
.lf-alert {
  display: flex; align-items: flex-start; gap: 0.75rem;
  padding: 0.875rem 0.875rem 0.875rem 1rem; margin-bottom: 1.25rem;
  border-radius: 16px;
  background: var(--si-danger-bg);
  border: 1px solid var(--si-danger-border);
  color: var(--si-danger-text);
  animation: lfShake 0.42s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}
.lf-alert-icon { width: 20px; height: 20px; flex-shrink: 0; margin-top: 1px; color: var(--si-danger); }
.lf-alert-text { display: flex; flex-direction: column; gap: 2px; flex: 1; font-size: 0.875rem; line-height: 1.45; }
.lf-alert-text strong { font-weight: 700; color: var(--si-danger-strong); }
.lf-alert-close {
  width: 28px; height: 28px; flex-shrink: 0; margin: -4px -2px 0 0;
  display: grid; place-items: center; border-radius: 8px;
  background: none; border: none; cursor: pointer; color: inherit; opacity: 0.7;
}
.lf-alert-close:hover { opacity: 1; background: var(--si-danger-border); }
.lf-alert-close svg { width: 16px; height: 16px; }

/* ── Fields ── */
.lf-fields { display: flex; flex-direction: column; gap: 1.125rem; }
.lf-fields > *:nth-child(1) { animation: lfFadeUp 0.5s 0.06s both; }
.lf-fields > *:nth-child(2) { animation: lfFadeUp 0.5s 0.12s both; }
.lf-fields > *:nth-child(3) { animation: lfFadeUp 0.5s 0.18s both; }
.lf-fields > *:nth-child(4) { animation: lfFadeUp 0.5s 0.24s both; }

.lf-field :deep(.flex-col) { align-items: stretch !important; text-align: left; }
.lf-field :deep(label) {
  font-size: 0.8125rem; font-weight: 600; letter-spacing: 0;
  color: var(--si-text) !important; margin-bottom: 0.25rem; overflow: visible;
}
/* The bordered box rendered by NewInputLayout */
.lf-field :deep(.border) {
  height: 54px; border-radius: 16px !important;
  background: var(--si-input-bg);
  border: 1.5px solid var(--si-input-border) !important;
  box-shadow: none;
  transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
}
.lf-field :deep(.border:hover) { border-color: var(--si-input-border-hover) !important; }
.lf-field :deep(.border:focus-within) {
  border-color: var(--si-primary) !important;
  background: var(--si-input-bg-focus);
  box-shadow: 0 0 0 4px var(--si-ring) !important;
}
.lf-field :deep(.border-red-300),
.lf-has-error .lf-field :deep(.border) { border-color: var(--si-danger) !important; }
.lf-field :deep(.border-red-300:focus-within),
.lf-has-error .lf-field :deep(.border:focus-within) { box-shadow: 0 0 0 4px var(--si-danger-ring) !important; }

.lf-field :deep(input) {
  height: 100%; padding: 0 1rem !important;
  font-size: 0.9375rem !important; color: var(--si-text) !important;
  background: transparent !important;
}
.lf-field :deep(input[type='password']),
.lf-field :deep(.cursor-pointer) + input,
.lf-field :deep(.flex.w-full:has(.cursor-pointer) input) { padding-right: 3rem !important; }
.lf-field :deep(input::placeholder) { color: var(--si-placeholder) !important; }
.lf-field :deep(.flex.w-full) { height: 100%; align-items: center; }
.lf-field :deep(.cursor-pointer) { color: var(--si-text-muted); }
.lf-field :deep(.cursor-pointer:hover) { color: var(--si-text); }
.lf-field :deep(.cursor-pointer svg) { width: 20px; height: 20px; }

/* Field validation message from InputError */
.lf-field :deep(.text-red-500),
.lf-field :deep(.text-red-600),
.lf-field :deep([class*='text-red']) { color: var(--si-danger) !important; font-size: 0.78rem; }

/* ── Options row ── */
.lf-options { display: flex; justify-content: space-between; align-items: center; gap: 1rem; font-size: 0.875rem; }
.lf-remember { display: flex; align-items: center; gap: 0.55rem; cursor: pointer; color: var(--si-text-muted); user-select: none; }
.lf-remember:hover { color: var(--si-text); }
.lf-checkbox { width: 17px; height: 17px; accent-color: var(--si-primary); cursor: pointer; }

.lf-link {
  font-weight: 600; font-size: inherit; color: var(--si-link);
  background: none; border: none; padding: 0; cursor: pointer; text-decoration: none;
  border-radius: 4px;
}
.lf-link:hover { text-decoration: underline; text-underline-offset: 3px; }
.lf-link:focus-visible { outline: 2px solid var(--si-primary); outline-offset: 2px; }

/* ── Buttons ── */
.lf-btn {
  position: relative; width: 100%; height: 58px; margin-top: 0.4rem;
  display: inline-flex; align-items: center; justify-content: center; gap: 0.55rem;
  border: none; border-radius: 999px; cursor: pointer;
  font-family: inherit; font-size: 1rem; font-weight: 500; letter-spacing: 0.01em; color: #fff;
  background: var(--si-btn-bg);
  box-shadow: var(--si-btn-shadow);
  transition: transform 0.15s ease, box-shadow 0.2s ease, filter 0.2s ease, opacity 0.2s;
  overflow: hidden;
}
.lf-btn::after {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.18) 50%, transparent 70%);
  transform: translateX(-100%); transition: transform 0.7s ease;
}
.lf-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: var(--si-btn-shadow-hover); background: var(--si-btn-bg-hover, var(--si-btn-bg)); }
.lf-btn:hover:not(:disabled)::after { transform: translateX(100%); }
.lf-btn:active:not(:disabled) { transform: translateY(0); }
.lf-btn:focus-visible { outline: none; box-shadow: var(--si-btn-shadow), 0 0 0 4px var(--si-ring-strong); }
.lf-btn:disabled { cursor: progress; opacity: 0.85; }
/* White circle with arrow, as on standardinsurancesc.com */
.lf-btn-orb {
  position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
  width: 42px; height: 42px; border-radius: 50%;
  display: grid; place-items: center;
  background: #fff; color: var(--si-btn-bg);
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.lf-btn-orb .lf-spinner { border-color: rgba(13, 79, 128, 0.25); border-top-color: #0D4F80; }
.lf-btn-arrow { width: 20px; height: 20px; transition: transform 0.25s ease; }
.lf-btn:hover:not(:disabled) .lf-btn-orb { transform: translateY(-50%) rotate(-35deg) scale(1.05); }

.lf-btn-ghost {
  width: auto; padding: 0 1.25rem; flex-shrink: 0;
  background: transparent; color: var(--si-text);
  border: 1.5px solid var(--si-input-border); box-shadow: none;
}
.lf-btn-ghost:hover:not(:disabled) { background: var(--si-input-bg); box-shadow: none; }

.lf-spinner {
  width: 18px; height: 18px; border-radius: 50%;
  border: 2.5px solid rgba(255,255,255,0.35); border-top-color: #fff;
  animation: lfSpin 0.7s linear infinite;
}

/* ── Misc ── */
.lf-help { margin: 1.75rem 0 0; text-align: center; font-size: 0.875rem; color: var(--si-text-muted); }

.lf-back {
  display: inline-flex; align-items: center; gap: 0.35rem; margin-bottom: 1.5rem;
  font-size: 0.875rem; font-weight: 600; color: var(--si-text-muted);
  background: none; border: none; padding: 0; cursor: pointer;
}
.lf-back:hover { color: var(--si-text); }
.lf-back svg { width: 16px; height: 16px; transition: transform 0.2s; }
.lf-back:hover svg { transform: translateX(-3px); }

.lf-error-msg { font-size: 0.8rem; color: var(--si-danger); margin: -0.5rem 0 0; }
.lf-reset-actions { display: flex; gap: 0.75rem; }

/* ── Success overlay ── */
.lf-success-overlay {
  position: fixed; inset: 0; z-index: 200;
  display: grid; place-items: center;
  background: var(--si-overlay);
  backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
}
.lf-success-inner { text-align: center; padding: 2rem; }
.lf-success-badge {
  width: 72px; height: 72px; margin: 0 auto 1.25rem; border-radius: 50%;
  display: grid; place-items: center;
  background: var(--si-accent); color: #fff;
  box-shadow: 0 0 0 10px rgba(254,147,18,0.15), 0 12px 30px rgba(254,147,18,0.35);
  animation: lfPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
.lf-success-badge svg { width: 34px; height: 34px; }
.lf-check-path { stroke-dasharray: 32; stroke-dashoffset: 32; animation: lfDraw 0.45s 0.25s ease-out forwards; }
.lf-success-title { font-size: 1.375rem; font-weight: 800; color: #fff; margin: 0 0 0.35rem; letter-spacing: -0.01em; }
.lf-success-sub { font-size: 0.9rem; color: rgba(255,255,255,0.7); margin: 0 0 1.5rem; }
.lf-progress-track { width: 180px; height: 3px; margin: 0 auto; border-radius: 99px; background: rgba(255,255,255,0.15); overflow: hidden; }
.lf-progress-bar { height: 100%; border-radius: 99px; background: var(--si-accent); animation: lfProgress 0.9s ease-out forwards; }

/* ── Transitions & keyframes ── */
.success-enter-active { transition: opacity 0.3s ease; }
.success-enter-from { opacity: 0; }
.alert-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.alert-leave-to { opacity: 0; transform: translateY(-4px); }

@keyframes lfFadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
@keyframes lfShake {
  10%, 90% { transform: translateX(-1px); }
  20%, 80% { transform: translateX(3px); }
  30%, 50%, 70% { transform: translateX(-5px); }
  40%, 60% { transform: translateX(5px); }
}
@keyframes lfSpin { to { transform: rotate(360deg); } }
@keyframes lfPop { from { transform: scale(0.4); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@keyframes lfDraw { to { stroke-dashoffset: 0; } }
@keyframes lfProgress { from { width: 0; } to { width: 100%; } }

@media (prefers-reduced-motion: reduce) {
  .lf-view, .lf-fields > *, .lf-alert, .lf-success-badge { animation: none !important; }
  .lf-btn, .lf-btn::after { transition: none; }
}
</style>
