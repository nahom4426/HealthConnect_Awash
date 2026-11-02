<script setup>
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { signIn } from '@/customer/api';
import { setSession, isCustomer } from '@/customer/session';
import standardLogo from '@/assets/img/standard_logo_bilingual.svg';

const route = useRoute();
const router = useRouter();

const userName = ref('');
const password = ref('');
const showPassword = ref(false);
const busy = ref(false);
const error = ref('');

const notice = computed(() => (route.query.expired ? 'Your session ended. Please sign in again.' : ''));

function friendly(e) {
  const status = e?.response?.status;
  const text = String(e?.response?.data?.message || e?.response?.data?.detail || e?.response?.data?.error || '');
  if (!e?.response) return 'We could not reach the server. Check your connection and try again.';
  if (status === 502 || status === 503 || status === 504) return 'The service is temporarily unavailable. Please try again in a moment.';
  // The backend reports a wrong password as 400 "Invalid credentials provided" (older builds: 401 / 500)
  if (/credential|password|unauthori|not found|invalid/i.test(text) || status === 401 || status === 403 || status === 500) {
    return 'The username or password you entered is incorrect.';
  }
  return text || 'Sign in failed. Please try again.';
}

async function submit() {
  if (busy.value) return;
  error.value = '';
  if (!userName.value.trim() || !password.value) { error.value = 'Enter your username and password.'; return; }
  busy.value = true;
  try {
    const user = await signIn(userName.value, password.value);
    if (!user?.token) throw Object.assign(new Error('no token'), { response: { status: 401 } });
    if (!isCustomer(user)) {
      // This site is for policyholders; staff use the staff portal. Nothing is stored.
      error.value = 'This website is for customers. Staff, please use the staff portal.';
      return;
    }
    setSession({
      token: user.token,
      refreshToken: user.refreshToken,
      user: {
        userUuid: user.userUuid, email: user.email, firstName: user.firstName, fatherName: user.fatherName,
        grandFatherName: user.grandFatherName, mobilePhone: user.mobilePhone, roleName: user.roleName, userType: user.userType,
      },
    });
    const to = typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/') ? route.query.redirect : '/policies';
    router.replace(to);
  } catch (e) {
    error.value = friendly(e);
  } finally {
    busy.value = false;
    password.value = '';
  }
}
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center bg-canvas px-4 py-10 text-ink">
    <img :src="standardLogo" alt="Standard Insurance S.C. — ስታንዳርድ ኢንሹራንስ አ.ማ." class="mb-8 h-12 w-auto" />

    <main class="w-full max-w-sm rounded-2xl border border-line bg-surface p-6 shadow-card sm:p-8">
      <h1 class="text-xl font-semibold">Sign in</h1>
      <p class="mt-1 text-sm text-ink-muted">Report and follow your motor claims.</p>

      <p v-if="notice" role="status" class="mt-4 rounded-lg bg-warning-soft px-3 py-2 text-sm text-warning-strong">{{ notice }}</p>

      <form class="mt-5 space-y-4" novalidate @submit.prevent="submit">
        <label class="block text-sm font-medium">Email or phone number
          <input
            v-model="userName" type="text" autocomplete="username" inputmode="email" autocapitalize="none" spellcheck="false"
            class="mt-1 h-11 w-full rounded-xl border border-line bg-canvas px-3 text-sm outline-none focus:border-primary focus:shadow-focus"
            :aria-invalid="!!error"
          />
        </label>

        <label class="block text-sm font-medium">Password
          <span class="relative mt-1 block">
            <input
              v-model="password" :type="showPassword ? 'text' : 'password'" autocomplete="current-password"
              class="h-11 w-full rounded-xl border border-line bg-canvas px-3 pr-16 text-sm outline-none focus:border-primary focus:shadow-focus"
              :aria-invalid="!!error"
            />
            <button type="button" class="absolute inset-y-0 right-2 px-2 text-xs font-medium text-primary" :aria-pressed="showPassword" @click="showPassword = !showPassword">
              {{ showPassword ? 'Hide' : 'Show' }}
            </button>
          </span>
        </label>

        <p v-if="error" role="alert" class="rounded-lg bg-error-soft px-3 py-2 text-sm text-error-strong">{{ error }}</p>

        <button type="submit" :disabled="busy" class="h-11 w-full rounded-xl bg-primary text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60">
          {{ busy ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>

      <p class="mt-5 text-xs text-ink-subtle">Forgot your password or don’t have an account yet? Please contact your Standard Insurance branch.</p>
    </main>

    <p class="mt-6 text-xs text-ink-subtle">© {{ new Date().getFullYear() }} Standard Insurance S.C.</p>
  </div>
</template>
