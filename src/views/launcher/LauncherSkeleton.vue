<script setup>
// Placeholder shaped like the launcher's cards while GET /modules/me loads.
// variant "modules": a module tile grid; "products": category tabs, search and product cards;
// "stats": the Dashboard's figures and panels.
defineProps({ variant: { type: String, default: 'modules' } });
</script>

<template>
  <div role="status" aria-live="polite" aria-busy="true">
    <span class="sr-only">Loading your modules…</span>

    <div v-if="variant === 'modules'" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" aria-hidden="true">
      <div v-for="n in 8" :key="n" class="sk-card rounded-2xl border border-line bg-white p-6" :style="{ animationDelay: `${n * 60}ms` }">
        <div class="mb-5 flex items-center justify-between">
          <span class="sk h-8 w-8 rounded-lg"></span>
          <span class="sk h-5 w-16 rounded-full"></span>
        </div>
        <span class="sk mb-3 block h-4 w-2/3 rounded-md"></span>
        <span class="sk mb-2 block h-3 w-full rounded-md"></span>
        <span class="sk mb-6 block h-3 w-4/5 rounded-md"></span>
        <div class="flex items-center justify-between border-t border-line/60 pt-3.5">
          <span class="sk h-3 w-20 rounded-md"></span>
          <span class="sk h-3 w-12 rounded-md"></span>
        </div>
      </div>
    </div>

    <div v-else-if="variant === 'stats'" class="space-y-6" aria-hidden="true">
      <div class="flex gap-2">
        <span v-for="n in 5" :key="n" class="sk h-9 rounded-full" :style="{ width: `${n === 1 ? 120 : 92}px` }"></span>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <div v-for="n in 4" :key="n" class="sk-card rounded-2xl border border-line bg-white p-5" :style="{ animationDelay: `${n * 60}ms` }">
          <div class="flex items-start justify-between">
            <span class="space-y-3">
              <span class="sk block h-3 w-24 rounded-md"></span>
              <span class="sk block h-7 w-16 rounded-md"></span>
            </span>
            <span class="sk h-10 w-10 rounded-xl"></span>
          </div>
          <span class="sk mt-4 block h-1.5 w-full rounded-full"></span>
          <span class="sk mt-2 block h-2.5 w-3/4 rounded-md"></span>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-8">
        <div v-for="n in 8" :key="n" class="flex items-center gap-2.5 rounded-xl border border-line bg-white py-2 pl-2 pr-3">
          <span class="sk h-10 w-14 shrink-0 rounded-lg"></span>
          <span class="flex-1 space-y-1.5">
            <span class="sk block h-3 w-3/4 rounded-md"></span>
            <span class="sk block h-2.5 w-1/2 rounded-md"></span>
          </span>
        </div>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div class="sk-card lg:col-span-3 rounded-2xl border border-line bg-white p-5">
          <span class="sk mb-6 block h-3.5 w-36 rounded-md"></span>
          <div v-for="n in 4" :key="n" class="mb-4">
            <span class="sk mb-2 block h-3 w-28 rounded-md"></span>
            <span class="sk block h-2.5 rounded-full" :style="{ width: `${100 - n * 18}%` }"></span>
          </div>
        </div>
        <div class="sk-card lg:col-span-2 rounded-2xl border border-line bg-white p-5">
          <span class="sk mb-6 block h-3.5 w-28 rounded-md"></span>
          <span class="sk mb-5 block h-3 w-full rounded-full"></span>
          <div class="grid grid-cols-2 gap-3">
            <span v-for="n in 6" :key="n" class="sk block h-3 rounded-md"></span>
          </div>
        </div>
      </div>
    </div>

    <div v-else aria-hidden="true">
      <div class="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div class="flex gap-2">
          <span v-for="n in 3" :key="n" class="sk h-10 w-36 rounded-xl"></span>
        </div>
        <span class="sk block h-10 w-full rounded-xl lg:w-72"></span>
      </div>
      <span class="sk mb-6 block h-9 w-80 rounded-xl"></span>

      <div class="mb-4 flex items-center gap-3">
        <span class="sk h-3 w-40 rounded-md"></span>
        <span class="h-px flex-1 bg-line"></span>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        <div v-for="n in 6" :key="n" class="sk-card flex flex-col rounded-2xl border border-line bg-white p-5" :style="{ animationDelay: `${n * 60}ms` }">
          <div class="mb-4 flex items-start justify-between">
            <span class="sk h-11 w-11 rounded-xl"></span>
            <span class="sk h-5 w-14 rounded-full"></span>
          </div>
          <span class="sk mb-3 block h-4 w-3/5 rounded-md"></span>
          <span class="sk mb-2 block h-3 w-full rounded-md"></span>
          <span class="sk mb-4 block h-3 w-4/5 rounded-md"></span>
          <div class="mb-5 flex gap-1.5">
            <span class="sk h-6 w-16 rounded-lg"></span>
            <span class="sk h-6 w-14 rounded-lg"></span>
          </div>
          <div class="mt-auto flex justify-end">
            <span class="sk h-8 w-24 rounded-xl"></span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* A light band sweeping across each block */
.sk {
  display: inline-block;
  background: linear-gradient(90deg, rgb(var(--line) / 0.55) 25%, rgb(var(--line) / 0.95) 37%, rgb(var(--line) / 0.55) 63%);
  background-size: 400% 100%;
  animation: sk-shimmer 1.4s ease-in-out infinite;
}

.sk-card {
  animation: sk-fade 0.35s ease-out both;
}

@keyframes sk-shimmer {
  0% { background-position: 100% 50%; }
  100% { background-position: 0 50%; }
}

@keyframes sk-fade {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: none; }
}

@media (prefers-reduced-motion: reduce) {
  .sk, .sk-card { animation: none; }
}
</style>
