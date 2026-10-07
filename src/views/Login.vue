<script setup>
import LoginForm from "./LoginForm.vue";
import logo from "@/assets/img/logo.png";
import mark from "@/assets/img/awash-mark.png";

const year = new Date().getFullYear();

const highlights = [
  { title: "Policy management", text: "Issue, amend and renew institutional policies in one place." },
  { title: "Claims processing", text: "Verify, approve and settle claims with a clear audit trail." },
  { title: "Provider network", text: "Manage contracts, services and limits across providers." },
];
</script>

<template>
  <div class="overflow-y-auto h-full bg-surface">
    <div class="grid min-h-full lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] xl:grid-cols-2">
      <!-- Brand panel (desktop) -->
      <aside class="hidden overflow-hidden relative flex-col justify-between p-10 text-white lg:flex xl:p-14 bg-primary">
        <div class="absolute inset-0 opacity-[0.07] pointer-events-none brand-grid" aria-hidden="true" />
        <div class="absolute -right-40 -bottom-40 w-[28rem] h-[28rem] rounded-full blur-3xl bg-brand-accent/20 pointer-events-none" aria-hidden="true" />

        <div class="flex relative gap-3 items-center">
          <span class="grid place-items-center w-10 h-10 bg-white rounded-xl">
            <img :src="mark" alt="" class="w-7 h-7" />
          </span>
          <span class="text-lg font-semibold tracking-tight">Awash Insurance</span>
        </div>

        <div class="relative max-w-md">
          <p class="text-sm font-medium tracking-wide uppercase text-brand-accent">Health Connect</p>
          <h2 class="!px-0 mt-3 text-3xl font-semibold tracking-tight leading-tight xl:text-4xl">
            Health insurance operations, in one workspace.
          </h2>
          <ul class="mt-10 space-y-5">
            <li v-for="item in highlights" :key="item.title" class="flex gap-3">
              <span class="grid place-items-center mt-0.5 w-5 h-5 rounded-full bg-white/15 shrink-0" aria-hidden="true">
                <svg class="w-3 h-3" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 10.5 3 3 7-7" /></svg>
              </span>
              <div>
                <p class="font-medium">{{ item.title }}</p>
                <p class="text-sm text-white/70">{{ item.text }}</p>
              </div>
            </li>
          </ul>
        </div>

        <p class="relative text-sm text-white/60">© {{ year }} Awash Insurance Company S.C.</p>
      </aside>

      <!-- Form -->
      <main class="flex flex-col justify-center px-4 py-10 sm:px-8">
        <div class="mx-auto w-full max-w-[400px]">
          <img :src="logo" alt="Awash Insurance" class="mb-10 w-auto h-11 lg:hidden" />
          <LoginForm />
          <p class="mt-10 text-xs text-center lg:hidden text-ink-subtle">© {{ year }} Awash Insurance Company S.C.</p>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.brand-grid {
  background-image: linear-gradient(to right, #fff 1px, transparent 1px),
    linear-gradient(to bottom, #fff 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(ellipse at 30% 40%, #000 20%, transparent 75%);
}
</style>
