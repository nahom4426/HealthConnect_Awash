<script setup>
// Count of items needing the user (plan section 3): referrals assigned to them and overdue claim
// deadlines, with a dropdown linking to each.
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useDashboard } from "../composables/useDashboard";
import { formatDate } from "../utils/format";
import { DEADLINE_KINDS } from "../constants";

const { data } = useDashboard();
const open = ref(false);
const root = ref(null);
const count = computed(() => data.value?.bell ?? 0);
const referrals = computed(() => data.value?.widgets?.myReferrals?.rows ?? []);
const deadlines = computed(() => (data.value?.widgets?.deadlines?.rows ?? []).filter((d) => d.dueDate < new Date().toISOString().slice(0, 10)));

const close = (e) => root.value && !root.value.contains(e.target) && (open.value = false);
onMounted(() => document.addEventListener("pointerdown", close));
onBeforeUnmount(() => document.removeEventListener("pointerdown", close));
</script>

<template>
  <div ref="root" class="relative">
    <button
      type="button"
      class="relative grid place-items-center w-8 h-8 rounded-lg border border-line bg-surface text-ink-muted hover:text-ink"
      :aria-label="`Alerts: ${count} item${count === 1 ? '' : 's'} need you`"
      :aria-expanded="open"
      @click="open = !open"
    >
      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
      <span v-if="count" class="absolute -top-1.5 -right-1.5 grid place-items-center px-1 min-w-[1.1rem] h-[1.1rem] text-[10px] font-bold text-white rounded-full bg-error">{{ count }}</span>
    </button>
    <div v-if="open" class="absolute right-0 top-full z-40 p-2 mt-1 w-80 rounded-xl border shadow-pop bg-surface border-line">
      <p v-if="!referrals.length && !deadlines.length" class="px-2 py-3 text-sm text-ink-muted">Nothing needs you right now.</p>
      <template v-if="referrals.length">
        <p class="px-2 pt-1 text-xs font-semibold tracking-wide uppercase text-ink-subtle">Your referrals</p>
        <RouterLink v-for="r in referrals" :key="r.id" :to="`/marine/underwriting/${r.id}`" class="block px-2 py-1.5 text-sm rounded-lg hover:bg-surface-muted" @click="open = false">
          {{ r.quoteNo }} <span class="text-ink-subtle">· {{ r.insured?.name }}</span>
        </RouterLink>
      </template>
      <template v-if="deadlines.length">
        <p class="px-2 pt-2 text-xs font-semibold tracking-wide uppercase text-ink-subtle">Overdue deadlines</p>
        <RouterLink v-for="d in deadlines" :key="d.id" :to="`/marine/claims/${d.claimId}?tab=deadlines`" class="block px-2 py-1.5 text-sm rounded-lg hover:bg-surface-muted" @click="open = false">
          {{ d.claimNo }} <span class="text-ink-subtle">· {{ DEADLINE_KINDS[d.kind] }} due {{ formatDate(d.dueDate) }}</span>
        </RouterLink>
      </template>
    </div>
  </div>
</template>
