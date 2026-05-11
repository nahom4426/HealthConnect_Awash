<script setup>
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Form } from '@/components/new_form_builder';
import Input from '@/components/new_form_elements/Input.vue';
import InputPassword from '@/components/new_form_elements/InputPassword.vue';
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
  req.send(
    () => login(values),
    (res) => {
      if (res.success) {
        showSuccess.value = true;
        auth.setAuth(res.data);
        localStorage.setItem('userDetail', JSON.stringify(res.data));
        setTimeout(() => reRoute(), 1000);
      } else {
        toasted(false, '', res.error || 'Invalid credentials');
      }
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
  // Implement forgot password logic
  forgotReq.send(
    () => Promise.resolve({ success: true }),
    () => {
      forgotStep.value = 'reset';
      toasted(true, 'Reset code sent', 'Check your email for the reset code');
    }
  );
}

function handleResetPassword() {
  // Implement reset password logic
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
  <div class="relative">
    
    <!-- Success Overlay -->
    <Transition name="success">
      <div v-if="showSuccess" class="flex absolute inset-0 z-50 justify-center items-center bg-white rounded-3xl">
        <div class="text-center">
          <div class="flex justify-center items-center mx-auto mb-6 w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full animate-bounce-in">
            <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <h3 class="mb-2 text-2xl font-bold text-gray-900">Welcome Back!</h3>
          <p class="mb-6 text-gray-500">Redirecting to your dashboard...</p>
          <div class="overflow-hidden mx-auto w-48 h-1 bg-gray-100 rounded-full">
            <div class="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full animate-progress"></div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Main Card -->
    <div class="p-8 bg-white rounded-3xl shadow-2xl shadow-blue-500/10 lg:p-10 animate-fade-in">
      
      <!-- Login View -->
      <div v-if="!showForgot">
        <!-- Header -->
        <div class="mb-8 text-center">
          <h2 class="mb-2 text-3xl font-bold text-gray-900">Welcome Back</h2>
          <p class="text-gray-500">Sign in to access your dashboard</p>
        </div>

        <!-- Form -->
        <Form v-slot="{ submit }" id="login-form">
          <div class="space-y-5" @keydown.enter.prevent="submit(loginUser)">
            
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

            <!-- Options -->
            <div class="flex justify-between items-center text-sm">
              <label class="flex gap-2 items-center cursor-pointer group">
                <input type="checkbox" v-model="rememberMe" 
                       class="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                <span class="text-gray-600 transition-colors group-hover:text-gray-900">Remember me</span>
              </label>
              <button type="button" @click.prevent="openForgot" 
                      class="font-medium text-blue-600 transition-colors hover:text-blue-700">
                Forgot password?
              </button>
            </div>

            <!-- Submit Button -->
            <button
              type="button"
              :disabled="req.pending.value"
              @click.prevent="submit(loginUser)"
              class="relative w-full group"
            >
              <div class="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl opacity-60 blur transition duration-300 group-hover:opacity-100"></div>
              <div class="flex relative justify-center items-center px-6 py-3.5 leading-none bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
                <span v-if="!req.pending.value" class="flex gap-2 items-center font-semibold text-white">
                  Sign In
                  <svg class="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                  </svg>
                </span>
                <span v-else class="flex gap-2 items-center font-semibold text-white">
                  <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Authenticating...
                </span>
              </div>
            </button>

          </div>
        </Form>

        <!-- Trust Badges -->
        <div class="flex gap-4 justify-center items-center mt-8 text-xs text-gray-400">
          <div class="flex gap-1.5 items-center">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
            256-bit SSL
          </div>
          <div class="w-1 h-1 bg-gray-300 rounded-full"></div>
          <div class="flex gap-1.5 items-center">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
            Secure Auth
          </div>
        </div>
      </div>

      <!-- Forgot Password View -->
      <div v-else>
        <!-- Back Button -->
        <button type="button" @click="showForgot = false" 
                class="flex gap-2 items-center mb-6 text-gray-500 transition-colors hover:text-gray-700 group">
          <svg class="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Back to Sign In
        </button>

        <!-- Header -->
        <div class="mb-8 text-center">
          <div class="flex justify-center items-center mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl">
            <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
            </svg>
          </div>
          <h2 class="mb-2 text-2xl font-bold text-gray-900">{{ forgotStep === 'request' ? 'Reset Password' : 'New Password' }}</h2>
          <p class="text-gray-500">{{ forgotStep === 'request' ? 'Enter your email to receive a reset code' : 'Enter the code and choose a new password' }}</p>
        </div>

        <!-- Request Reset -->
        <div v-if="forgotStep === 'request'" class="space-y-5">
          <div>
            <label class="block mb-2 text-sm font-medium text-gray-700">Email Address</label>
            <input v-model="forgotEmail" type="email" placeholder="you@company.com"
                   class="px-4 py-3 w-full rounded-xl border border-gray-200 transition-all outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          </div>
          <button type="button" @click="handleForgotPassword" :disabled="forgotReq.pending.value"
                  class="relative w-full group">
            <div class="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl opacity-60 blur transition duration-300 group-hover:opacity-100"></div>
            <div class="flex relative justify-center items-center px-6 py-3.5 leading-none bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
              <span class="flex gap-2 items-center font-semibold text-white">
                <span v-if="!forgotReq.pending.value">Send Reset Code</span>
                <span v-else>Sending...</span>
              </span>
            </div>
          </button>
        </div>

        <!-- Reset Password -->
        <div v-else class="space-y-5">
          <div>
            <label class="block mb-2 text-sm font-medium text-gray-700">Reset Code</label>
            <input v-model="resetCode" type="text" placeholder="Enter code from email"
                   class="px-4 py-3 w-full font-mono text-lg tracking-widest text-center rounded-xl border border-gray-200 transition-all outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          </div>
          <div>
            <label class="block mb-2 text-sm font-medium text-gray-700">New Password</label>
            <input v-model="newPassword" type="password" placeholder="Create a strong password"
                   class="px-4 py-3 w-full rounded-xl border border-gray-200 transition-all outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          </div>
          <div>
            <label class="block mb-2 text-sm font-medium text-gray-700">Confirm Password</label>
            <input v-model="confirmPassword" type="password" placeholder="Re-enter your password"
                   :class="{'border-red-300 focus:border-red-500 focus:ring-red-100': passwordMismatch}"
                   class="px-4 py-3 w-full rounded-xl border border-gray-200 transition-all outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
            <p v-if="passwordMismatch" class="mt-1 text-sm text-red-500">Passwords do not match</p>
          </div>
          <div class="flex gap-3">
            <button type="button" @click="forgotStep = 'request'"
                    class="px-6 py-3 font-medium text-gray-700 rounded-xl border-2 border-gray-200 transition-colors hover:bg-gray-50">
              Back
            </button>
            <button type="button" @click="handleResetPassword" 
                    :disabled="resetReq.pending.value || passwordMismatch"
                    class="relative flex-1 group">
              <div class="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl opacity-60 blur transition duration-300 group-hover:opacity-100"></div>
              <div class="flex relative justify-center items-center px-6 py-3 leading-none bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
                <span class="flex gap-2 items-center font-semibold text-white">
                  <span v-if="!resetReq.pending.value">Update Password</span>
                  <span v-else>Updating...</span>
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="pt-6 mt-8 text-center border-t border-gray-100">
        <p class="text-sm text-gray-400">
          Need help? 
          <a href="#" class="font-medium text-blue-600 hover:text-blue-700">Contact Support</a>
        </p>
      </div>
    </div>

  </div>
</template>

<style scoped>
/* Success animations */
.success-enter-active {
  transition: all 0.3s ease-out;
}

.success-leave-active {
  transition: all 0.2s ease-in;
}

.success-enter-from {
  opacity: 0;
  transform: scale(0.95);
}

.success-leave-to {
  opacity: 0;
  transform: scale(1.05);
}

@keyframes bounce-in {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
  70% { transform: scale(0.9); }
  100% { transform: scale(1); }
}

.animate-bounce-in {
  animation: bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes progress {
  from { width: 0%; }
  to { width: 100%; }
}

.animate-progress {
  animation: progress 1s ease-in-out;
}

/* Fade in animation */
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.5s ease-out;
}
</style>