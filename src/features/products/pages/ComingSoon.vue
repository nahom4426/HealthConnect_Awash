<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useModuleStore } from '@/stores/moduleStore';

// A registry module whose service has no screens in this app yet
const route = useRoute();
const router = useRouter();
const moduleStore = useModuleStore();
const entry = computed(() => moduleStore.registryByKey[route.params.moduleKey]);
</script>

<template>
  <div class="min-h-screen bg-surface-muted/60 flex items-center justify-center p-8">
    <div class="max-w-md w-full bg-white border border-line rounded-2xl p-8 text-center shadow-sm">
      <p class="text-[10px] font-extrabold uppercase tracking-widest text-primary">Coming soon</p>
      <h1 class="mt-2 text-xl font-black text-ink">{{ entry?.name || route.params.moduleKey }}</h1>
      <p class="mt-2 text-sm text-ink-subtle">
        This module is set up for you<template v-if="entry?.roleName"> as {{ entry.roleName }}</template>, but its screens aren't available in this app yet.
      </p>
      <p v-if="entry?.serviceId" class="mt-1 text-xs font-mono text-ink-subtle">{{ entry.serviceId }}</p>
      <button class="mt-6 px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold" @click="router.push('/module-select')">Back to modules</button>
    </div>
  </div>
</template>
