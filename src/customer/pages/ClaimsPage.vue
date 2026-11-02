<script setup>
import { ref, onMounted } from 'vue';
import { listMyClaims, describeError } from '@/customer/api';
import { currentUser } from '@/customer/session';

const claims = ref([]);
const loading = ref(true);
const error = ref('');

const fmt = (d) => (d ? new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—');
const tone = (s) => {
  if (s === 'REJECTED' || s === 'WITHDRAWN') return 'bg-error-soft text-error-strong';
  if (s === 'HANDOVER_COMPLETED') return 'bg-success-soft text-success-strong';
  return 'bg-warning-soft text-warning-strong';
};

onMounted(async () => {
  try {
    const userUuid = currentUser()?.userUuid;
    claims.value = userUuid ? await listMyClaims(userUuid) : [];
  } catch (e) {
    error.value = describeError(e, 'We could not load your claims.');
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="mx-auto max-w-3xl">
    <div class="flex items-center justify-between gap-3">
      <h1 class="text-2xl font-semibold">My claims</h1>
      <router-link to="/policies" class="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover">File a claim</router-link>
    </div>

    <p v-if="loading" class="mt-6 text-ink-muted">Loading…</p>
    <p v-else-if="error" role="alert" class="mt-6 rounded-lg bg-error-soft px-3 py-2 text-sm text-error-strong">{{ error }}</p>
    <div v-else-if="!claims.length" class="mt-6 rounded-2xl border border-line bg-surface p-8 text-center">
      <p class="font-medium">You haven’t filed a claim yet.</p>
      <p class="mt-1 text-sm text-ink-muted">When you do, you can follow it here.</p>
    </div>

    <ul v-else class="mt-6 space-y-3">
      <li v-for="c in claims" :key="c.claimUuid">
        <router-link :to="`/claims/${c.claimUuid}`" class="block rounded-2xl border border-line bg-surface p-4 shadow-card transition-colors hover:border-primary">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="font-semibold">{{ c.claimNumber || 'Draft' }}</p>
              <p class="truncate text-sm text-ink-muted">{{ c.policyNumber }} · {{ c.plateNumber || 'vehicle' }}</p>
            </div>
            <span class="shrink-0 rounded-full px-3 py-1 text-xs font-semibold" :class="tone(c.status)">{{ c.statusLabel || c.status }}</span>
          </div>
          <p class="mt-2 text-xs text-ink-subtle">Accident {{ fmt(c.incidentDate) }} · Filed {{ fmt(c.createdAt) }}</p>
        </router-link>
      </li>
    </ul>
  </div>
</template>
