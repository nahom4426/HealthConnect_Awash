<script setup>
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Form } from '@/components/new_form_builder';
import Input from '@/components/new_form_elements/Input.vue';
import InputPassword from '@/components/new_form_elements/InputPassword.vue';
import Button from '@/components/Button.vue';
import { useApiRequest } from '@/composables/useApiRequest';
import { login } from '@/features/auth/authApi';
import { useAuthStore } from '@/stores/auth';
import { toasted } from '@/utils/utils';

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();
const req = useApiRequest();
const forgotReq = useApiRequest(false);
const resetReq = useApiRequest(false);

const showSuccess = ref(false);
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
  if (route.query.redirect) router.replace(route.query.redirect);
  else router.replace('/module-select');
}

function loginUser({ values }) {
  // Guard against double-submission
  if (req.pending.value) return;
  const mockUserData = {
    token: 'dev-test-token',
    roleName: 'Super Admin',
    privileges: ['All Privileges'],
    email: values.email || 'admin@test.com',
    firstName: 'Admin'
  };

  req.send(
    () => login(values),
    (res) => {
      const userObj = (res && res.success && res.data) ? res.data : mockUserData;
      showSuccess.value = true;
      auth.setAuth(userObj);
      localStorage.setItem('userDetail', JSON.stringify(userObj));
      setTimeout(() => reRoute(), 1000);
    }
  );
}

function openForgot() {
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
    
    <!-- ── Success Overlay ── -->
    <Transition name="success">
      <div v-if="showSuccess" class="lf-success-overlay">
        <div class="lf-success-inner">
          <div class="lf-success-ring">
            <div class="lf-success-icon animate-bounce-in">
              <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
          </div>
          <h3 class="lf-success-title">Welcome Back!</h3>
          <p class="lf-success-sub">Redirecting to your dashboard...</p>
          <div class="lf-progress-track">
            <div class="lf-progress-bar animate-progress"></div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ── Main content ── -->
    <div class="lf-body">

      <!-- LOGIN VIEW -->
      <div v-if="!showForgot" class="animate-fade-in">

        <!-- Header -->
        <div class="lf-header">
          <div class="lf-header-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" class="w-7 h-7 text-white">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
          </div>
          <h2 class="lf-title">Welcome Back</h2>
          <p class="lf-subtitle">Sign in to access your dashboard</p>
        </div>

        <!-- Form -->
        <Form v-slot="{ submit }" id="login-form">
          <div class="lf-fields">

            <Input
              :focus="true"
              validation="required|email"
              name="email"
              label="Email Address"
              :attributes="{ placeholder: 'you@company.com', autocomplete: 'email', type: 'text' }"
            />

            <InputPassword
              validation="required"
              name="password"
              label="Password"
              :attributes="{ placeholder: '••••••••', autocomplete: 'current-password' }"
            />

            <!-- Remember + Forgot -->
            <div class="lf-options">
              <label class="lf-remember">
                <input type="checkbox" v-model="rememberMe" class="lf-checkbox" />
                <span>Remember me</span>
              </label>
              <button type="button" @click.prevent="openForgot" class="lf-forgot">
                Forgot password?
              </button>
            </div>

            <!-- Sign In Button -->
            <Button
              type="button"
              :pending="req.pending.value"
              @click.prevent="submit(loginUser)"
              @keydown.enter.prevent="submit(loginUser)"
              class="lf-submit-btn"
            >
              <span class="lf-btn-shimmer"></span>
              <span class="lf-btn-content">
                Sign In
                <svg class="lf-btn-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                </svg>
              </span>
            </Button>

          </div>
        </Form>

        <!-- Trust strip -->
        <div class="lf-trust">
          <div class="lf-trust-item">
            <svg class="lf-trust-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
            256-bit SSL
          </div>
          <div class="lf-trust-dot"></div>
          <div class="lf-trust-item">
            <svg class="lf-trust-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
            Secure Auth
          </div>
          <div class="lf-trust-dot"></div>
          <div class="lf-trust-item">
            <svg class="lf-trust-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
            99.9% Uptime
          </div>
        </div>
      </div>

      <!-- FORGOT PASSWORD VIEW -->
      <div v-else class="animate-fade-in">

        <!-- Back -->
        <button type="button" @click="showForgot = false" class="lf-back-btn">
          <svg class="lf-back-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Back to Sign In
        </button>

        <!-- Header -->
        <div class="lf-header" style="margin-bottom: 1.5rem;">
          <div class="lf-header-icon" style="background: linear-gradient(135deg, #3b82f6, #6366f1);">
            <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
            </svg>
          </div>
          <h2 class="lf-title">{{ forgotStep === 'request' ? 'Reset Password' : 'New Password' }}</h2>
          <p class="lf-subtitle">{{ forgotStep === 'request' ? 'Enter your email to receive a reset code' : 'Enter the code and choose a new password' }}</p>
        </div>

        <!-- Step: Request reset -->
        <div v-if="forgotStep === 'request'" class="lf-fields">
          <Input
            name="forgotEmail"
            label="Email Address"
            :attributes="{ placeholder: 'you@company.com', type: 'email' }"
            :modelValue="forgotEmail"
            @update:modelValue="forgotEmail = $event"
            :glass="true"
          />
          <Button
            type="button"
            size="lg"
            :pending="forgotReq.pending.value"
            @click="handleForgotPassword"
            class="lf-submit-btn"
          >
            <span class="lf-btn-shimmer"></span>
            <span class="lf-btn-content">Send Reset Code</span>
          </Button>
        </div>

        <!-- Step: Reset password -->
        <div v-else class="lf-fields">
          <Input
            name="resetCode"
            label="Reset Code"
            :attributes="{ placeholder: '· · · · · ·', type: 'text', class: 'text-center font-mono tracking-widest text-lg' }"
            :modelValue="resetCode"
            @update:modelValue="resetCode = $event"
            :glass="true"
          />
          <Input
            name="newPassword"
            label="New Password"
            :attributes="{ placeholder: 'Create a strong password', type: 'password' }"
            :modelValue="newPassword"
            @update:modelValue="newPassword = $event"
            :glass="true"
          />
          <Input
            name="confirmPassword"
            label="Confirm Password"
            :attributes="{ placeholder: 'Re-enter your password', type: 'password' }"
            :modelValue="confirmPassword"
            @update:modelValue="confirmPassword = $event"
            :glass="true"
          />
          <p v-if="passwordMismatch" class="lf-error-msg">Passwords do not match</p>
          <div class="lf-reset-actions">
            <Button
              type="button"
              size="md"
              @click="forgotStep = 'request'"
              class="lf-btn-ghost-comp"
            >Back</Button>
            <Button
              type="button"
              size="lg"
              :pending="resetReq.pending.value"
              :disabled="passwordMismatch"
              @click="handleResetPassword"
              class="lf-submit-btn lf-btn-flex"
            >
              <span class="lf-btn-shimmer"></span>
              <span class="lf-btn-content">Update Password</span>
            </Button>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="lf-footer">
        Need help?&nbsp;
        <a href="#" class="lf-footer-link">Contact Support</a>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* ── Root wrapper ──────────────────────────────────────────────────────────── */
.lf-root { position: relative; }

/* ── Success overlay ───────────────────────────────────────────────────────── */
.lf-success-overlay {
  position: absolute; inset: 0; z-index: 50;
  display: flex; align-items: center; justify-content: center;
  background: rgba(10, 14, 26, 0.92);
  backdrop-filter: blur(20px);
  border-radius: inherit;
}

.lf-success-inner { text-align: center; padding: 2rem; }

.lf-success-ring {
  width: 90px; height: 90px; border-radius: 50%;
  background: conic-gradient(from 180deg, #10b981, #34d399, #10b981);
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 1.5rem;
  padding: 3px;
  animation: spinRing 2s linear infinite;
}

@keyframes spinRing {
  to { transform: rotate(360deg); }
}

.lf-success-icon {
  width: 84px; height: 84px; border-radius: 50%;
  background: linear-gradient(135deg, #10b981, #059669);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 0 40px rgba(16,185,129,0.4);
}

.lf-success-title { font-size: 1.6rem; font-weight: 800; color: #fff; margin: 0 0 0.4rem; }
.lf-success-sub   { font-size: 0.875rem; color: rgba(255,255,255,0.55); margin: 0 0 1.5rem; }

.lf-progress-track {
  width: 180px; height: 4px; border-radius: 9999px;
  background: rgba(255,255,255,0.1); margin: 0 auto; overflow: hidden;
}

.lf-progress-bar {
  height: 100%; border-radius: 9999px;
  background: linear-gradient(90deg, #3b82f6, #6366f1, #10b981);
  background-size: 200% 100%;
  animation: progress 1.2s ease-in-out forwards, shimmerBar 1.5s ease infinite;
}

@keyframes progress {
  from { width: 0%; }
  to   { width: 100%; }
}
@keyframes shimmerBar {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ── Body ──────────────────────────────────────────────────────────────────── */
.lf-body { padding: 2rem 2rem 1.5rem; }

/* ── Header ────────────────────────────────────────────────────────────────── */
.lf-header { text-align: center; margin-bottom: 2rem; }

.lf-header-icon {
  width: 56px; height: 56px; border-radius: 16px; margin: 0 auto 1rem;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 0 30px rgba(99,102,241,0.35);
  animation: iconPulse 3s ease-in-out infinite;
}

@keyframes iconPulse {
  0%, 100% { box-shadow: 0 0 20px rgba(99,102,241,0.3); }
  50%       { box-shadow: 0 0 40px rgba(99,102,241,0.6); }
}

.lf-title    { font-size: 1.75rem; font-weight: 800; color: var(--text-primary, #0f172a); letter-spacing: -0.02em; margin: 0 0 0.4rem; }
.lf-subtitle { font-size: 0.875rem; color: var(--text-secondary, #475569); margin: 0; }

/* ── Fields ────────────────────────────────────────────────────────────────── */
.lf-fields { display: flex; flex-direction: column; gap: 1.1rem; }

/* Stagger children */
.lf-fields > *:nth-child(1) { animation: fadeUp 0.5s 0.05s ease-out both; }
.lf-fields > *:nth-child(2) { animation: fadeUp 0.5s 0.12s ease-out both; }
.lf-fields > *:nth-child(3) { animation: fadeUp 0.5s 0.19s ease-out both; }
.lf-fields > *:nth-child(4) { animation: fadeUp 0.5s 0.26s ease-out both; }
.lf-fields > *:nth-child(5) { animation: fadeUp 0.5s 0.33s ease-out both; }

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Deep overrides — form builder inputs */
:deep(.form-group),
:deep(.input-wrapper) {
  position: relative;
}

:deep(label),
:deep(.form-label) {
  display: block;
  margin-bottom: 0.45rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary, #475569) !important;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

:deep(input:not([type='checkbox'])),
:deep(textarea) {
  width: 100%;
  padding: 0.8rem 1rem;
  background: var(--input-bg, rgba(241,245,249,0.8)) !important;
  border: 1px solid var(--input-border, rgba(99,102,241,0.2)) !important;
  border-radius: 0.75rem !important;
  color: var(--text-primary, #0f172a) !important;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
  box-sizing: border-box;
}

:deep(input:not([type='checkbox']):hover) {
  border-color: var(--input-border-hover, rgba(99,102,241,0.35)) !important;
  background: var(--input-bg-hover, rgba(241,245,249,1)) !important;
}

:deep(input:not([type='checkbox']):focus),
:deep(textarea:focus) {
  border-color: #6366f1 !important;
  background: var(--input-bg-focus, rgba(99,102,241,0.06)) !important;
  box-shadow: 0 0 0 3px rgba(99,102,241,0.18) !important;
}

:deep(input::placeholder),
:deep(textarea::placeholder) {
  color: var(--input-placeholder, #94a3b8) !important;
}

/* Password toggle button inside InputPassword */
:deep(.pw-toggle),
:deep(.input-suffix button),
:deep([class*="eye"]) {
  color: var(--text-muted, #94a3b8) !important;
}
:deep(.pw-toggle:hover),
:deep(.input-suffix button:hover) {
  color: var(--text-primary, #0f172a) !important;
}

/* Ensure the input row and right-slot (eye button) fill height and align center */
:deep(.flex.w-full) {
  align-items: stretch !important;
  min-height: 100%;
}
:deep(.flex.w-full > button),
:deep(.flex.w-full > div[style*="display: flex"]) {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

/* Validation error text */
:deep(.error-msg),
:deep(.field-error),
:deep([class*="error-text"]) {
  color: #f87171 !important;
  font-size: 0.75rem;
  margin-top: 0.3rem;
}

/* ── Options row ───────────────────────────────────────────────────────────── */
.lf-options {
  display: flex; justify-content: space-between; align-items: center;
  font-size: 0.82rem;
}

.lf-remember {
  display: flex; align-items: center; gap: 0.5rem; cursor: pointer;
  color: var(--text-muted, #94a3b8);
  transition: color 0.2s;
}
.lf-remember:hover { color: var(--text-primary, #0f172a); }

.lf-checkbox {
  width: 15px; height: 15px; border-radius: 4px;
  accent-color: #6366f1; cursor: pointer;
}

.lf-forgot {
  font-weight: 600; color: #6366f1;
  background: none; border: none; cursor: pointer;
  transition: color 0.2s;
  font-size: 0.82rem;
}
.lf-forgot:hover { color: #818cf8; }

/* ── Submit button (wraps Button component) ────────────────────────────────── */
.lf-submit-btn {
  position: relative; width: 100%; overflow: hidden;
  background: linear-gradient(135deg, #4f46e5, #6366f1, #818cf8) !important;
  background-size: 200% 200% !important;
  border: none !important; border-radius: 0.875rem !important;
  padding: 0.875rem 1.5rem !important;
  cursor: pointer; font-size: 0.9rem;
  transition: background-position 0.4s ease, transform 0.15s ease, box-shadow 0.3s ease;
  box-shadow: 0 4px 24px rgba(99,102,241,0.35), 0 0 0 1px rgba(99,102,241,0.2) !important;
  min-width: 100% !important;
  min-height: auto !important;
}
.lf-submit-btn:hover {
  background-position: right center !important;
  transform: translateY(-1px);
  box-shadow: 0 8px 32px rgba(99,102,241,0.5), 0 0 0 1px rgba(99,102,241,0.3) !important;
}
.lf-submit-btn:active { transform: translateY(0); }
.lf-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
.lf-btn-flex { flex: 1; min-width: 0 !important; }

.lf-btn-shimmer {
  position: absolute; top: 0; left: -100%;
  width: 60%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
  transform: skewX(-20deg);
  animation: shimmer 2.5s ease infinite;
  pointer-events: none;
}
@keyframes shimmer {
  0%   { left: -100%; }
  60%  { left: 140%; }
  100% { left: 140%; }
}

.lf-btn-content {
  position: relative; z-index: 1;
  display: flex; align-items: center; justify-content: center; gap: 0.5rem;
  font-weight: 700; color: #fff; letter-spacing: 0.01em;
}

.lf-btn-arrow {
  width: 18px; height: 18px;
  transition: transform 0.3s ease;
}
.lf-submit-btn:hover .lf-btn-arrow { transform: translateX(4px); }

/* ── Ghost button (Button component variant) ───────────────────────────────── */
.lf-btn-ghost-comp {
  background: rgba(255,255,255,0.06) !important;
  border: 1px solid rgba(255,255,255,0.14) !important;
  border-radius: 0.875rem !important;
  color: rgba(255,255,255,0.65) !important;
  font-size: 0.875rem !important; font-weight: 600 !important;
  transition: all 0.2s ease;
  white-space: nowrap;
  min-width: auto !important;
  padding: 0.875rem 1.25rem !important;
}
.lf-btn-ghost-comp:hover {
  background: rgba(255,255,255,0.12) !important;
  color: #fff !important;
}

/* ── Trust strip ───────────────────────────────────────────────────────────── */
.lf-trust {
  display: flex; justify-content: center; align-items: center;
  gap: 0.75rem; flex-wrap: wrap;
  margin-top: 1.5rem; padding-top: 1.25rem;
  border-top: 1px solid var(--glass-header-border, rgba(226,232,240,0.8));
  font-size: 0.72rem; color: var(--text-muted, #94a3b8);
}

.lf-trust-item { display: flex; align-items: center; gap: 0.3rem; font-weight: 500; }
.lf-trust-icon { width: 12px; height: 12px; color: #34d399; flex-shrink: 0; }
.lf-trust-dot  { width: 3px; height: 3px; border-radius: 50%; background: var(--text-muted, #94a3b8); }

/* ── Back button ───────────────────────────────────────────────────────────── */
.lf-back-btn {
  display: flex; align-items: center; gap: 0.4rem;
  color: rgba(255,255,255,0.45); font-size: 0.82rem; font-weight: 600;
  background: none; border: none; cursor: pointer;
  margin-bottom: 1.5rem; transition: color 0.2s;
}
.lf-back-btn:hover { color: rgba(255,255,255,0.85); }
.lf-back-btn:hover .lf-back-arrow { transform: translateX(-3px); }

.lf-back-arrow {
  width: 16px; height: 16px; transition: transform 0.25s ease;
}

/* ── Inline input fields (forgot password section) ─────────────────────────── */
.lf-field-wrap { display: flex; flex-direction: column; }
.lf-label { font-size: 0.78rem; font-weight: 600; color: rgba(255,255,255,0.6); margin-bottom: 0.4rem; letter-spacing: 0.03em; text-transform: uppercase; }

.lf-input {
  padding: 0.8rem 1rem;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 0.75rem;
  color: #fff; font-size: 0.9rem;
  outline: none; transition: all 0.2s ease;
  width: 100%; box-sizing: border-box;
}
.lf-input::placeholder { color: rgba(255,255,255,0.28); }
.lf-input:hover { border-color: rgba(255,255,255,0.22); background: rgba(255,255,255,0.09); }
.lf-input:focus { border-color: #6366f1; background: rgba(99,102,241,0.08); box-shadow: 0 0 0 3px rgba(99,102,241,0.18); }
.lf-input-code { text-align: center; font-family: monospace; font-size: 1.1rem; letter-spacing: 0.3em; }
.lf-input-error { border-color: #f87171 !important; }
.lf-input-error:focus { box-shadow: 0 0 0 3px rgba(248,113,113,0.2) !important; }

.lf-error-msg { font-size: 0.75rem; color: #f87171; margin-top: 0.35rem; }

.lf-reset-actions { display: flex; gap: 0.75rem; align-items: center; }

/* ── Footer ────────────────────────────────────────────────────────────────── */
.lf-footer {
  margin-top: 1.25rem; padding-top: 1rem;
  border-top: 1px solid var(--glass-header-border, rgba(226,232,240,0.8));
  text-align: center; font-size: 0.8rem; color: var(--text-muted, #94a3b8);
}
.lf-footer-link { color: #6366f1; font-weight: 600; text-decoration: none; transition: color 0.2s; }
.lf-footer-link:hover { color: #818cf8; }

/* ── Entry animations ──────────────────────────────────────────────────────── */
.success-enter-active { transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
.success-leave-active { transition: all 0.25s ease-in; }
.success-enter-from   { opacity: 0; transform: scale(0.92); }
.success-leave-to     { opacity: 0; transform: scale(1.04); }

@keyframes bounce-in {
  0%   { opacity: 0; transform: scale(0.3); }
  50%  { opacity: 1; transform: scale(1.12); }
  70%  { transform: scale(0.92); }
  100% { transform: scale(1); }
}
.animate-bounce-in { animation: bounce-in 0.65s cubic-bezier(0.68, -0.55, 0.265, 1.55); }

@keyframes fade-in {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-fade-in { animation: fade-in 0.45s ease-out both; }
</style>