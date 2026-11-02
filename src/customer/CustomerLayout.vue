<script setup>
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { currentUser, fullName, clearSession } from '@/customer/session';
import { applyTheme, isDark } from '@/customer/theme';
import standardLogo from '@/assets/img/standard_logo_bilingual.svg';

const route = useRoute();
const router = useRouter();
const dark = ref(isDark());

const name = computed(() => fullName(currentUser()) || currentUser()?.email || '');
const links = [
  { to: '/policies', label: 'File a claim', active: () => route.path.startsWith('/policies') },
  { to: '/forms', label: 'Claim forms', active: () => route.path.startsWith('/forms') },
  { to: '/claims', label: 'My claims', active: () => route.path.startsWith('/claims') },
];

function toggleTheme() { dark.value = !dark.value; applyTheme(dark.value); }
function signOut() { clearSession(); router.replace({ name: 'login' }); }
</script>

<template>
  <div class="min-h-screen bg-canvas text-ink">
    <header class="sticky top-0 z-20 border-b border-line bg-surface/95 backdrop-blur print:hidden">
      <div class="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">
        <router-link to="/policies" class="flex items-center">
          <img :src="standardLogo" alt="Standard Insurance S.C." class="h-9 w-auto" />
        </router-link>

        <nav class="ml-4 hidden gap-1 sm:flex" aria-label="Main">
          <router-link
            v-for="l in links" :key="l.to" :to="l.to"
            class="rounded-lg px-3 py-2 text-sm font-medium transition-colors"
            :class="l.active() ? 'bg-primary text-white' : 'text-ink-muted hover:bg-surface-muted'"
          >{{ l.label }}</router-link>
        </nav>

        <div class="ml-auto flex items-center gap-2">
          <span v-if="name" class="hidden max-w-[14rem] truncate text-sm text-ink-muted md:inline">{{ name }}</span>
          <button type="button" class="rounded-lg border border-line px-2.5 py-2 text-sm hover:bg-surface-muted" :aria-label="dark ? 'Switch to light mode' : 'Switch to dark mode'" @click="toggleTheme">{{ dark ? '☀' : '☾' }}</button>
          <button type="button" class="rounded-lg border border-line px-3 py-2 text-sm font-medium hover:bg-surface-muted" @click="signOut">Sign out</button>
        </div>
      </div>

      <nav class="flex gap-1 border-t border-line px-4 py-2 sm:hidden" aria-label="Main">
        <router-link
          v-for="l in links" :key="l.to" :to="l.to"
          class="flex-1 rounded-lg px-3 py-2 text-center text-sm font-medium"
          :class="l.active() ? 'bg-primary text-white' : 'text-ink-muted'"
        >{{ l.label }}</router-link>
      </nav>
    </header>

    <main class="mx-auto max-w-5xl px-4 py-6 sm:py-8">
      <router-view />
    </main>

    <footer class="mx-auto max-w-5xl px-4 pb-8 text-xs text-ink-subtle print:hidden">
      Standard Insurance S.C. · Need help with a claim? Call your branch or visit
      <a href="https://standardinsurancesc.com/" target="_blank" rel="noopener noreferrer" class="underline">standardinsurancesc.com</a>.
    </footer>
  </div>
</template>
