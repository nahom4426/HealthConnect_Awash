<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { listMyPolicies, verifyPolicy, describeError } from '@/customer/api';
import { currentUser } from '@/customer/session';

const router = useRouter();

const policies = ref([]);
const loading = ref(true);
const loadError = ref('');

const policyNumber = ref('');
const checking = ref(false);
const findError = ref('');
const found = ref(null);

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—');
const money = (n) => (n == null ? '—' : `ETB ${Number(n).toLocaleString()}`);
const label = (c) => String(c || '').replace(/_/g, ' ').toLowerCase().replace(/^\w/, (m) => m.toUpperCase());
const endOf = (d) => { if (!d) return null; const x = new Date(d); x.setFullYear(x.getFullYear() + 1); x.setDate(x.getDate() - 1); return x; };

const canFile = computed(() => found.value?.valid === true);

function fileClaim(number) {
  router.push({ name: 'claim-new', params: { policyNumber: number } });
}

async function find() {
  const value = policyNumber.value.trim();
  findError.value = '';
  found.value = null;
  if (!value) { findError.value = 'Enter your policy number.'; return; }
  checking.value = true;
  try {
    found.value = await verifyPolicy(value);
  } catch (e) {
    findError.value = e?.response?.status === 403
      ? 'That policy is not registered to your account.'
      : describeError(e, 'We could not check that policy. Please try again.');
  } finally {
    checking.value = false;
  }
}

onMounted(async () => {
  try {
    const userUuid = currentUser()?.userUuid;
    policies.value = userUuid ? await listMyPolicies(userUuid) : [];
  } catch (e) {
    loadError.value = describeError(e, 'We could not load your policies.');
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="mx-auto max-w-3xl">
    <h1 class="text-2xl font-semibold">File a motor claim</h1>
    <p class="mt-1 text-ink-muted">Choose the policy the claim is for.</p>
    <p class="mt-1 text-sm text-ink-muted">
      Carriers liability, CPM &amp; CAR or workmen’s compensation claim?
      <router-link to="/forms" class="text-primary underline">See the other claim forms</router-link>.
    </p>

    <p v-if="loading" class="mt-6 text-ink-muted">Loading your policies…</p>
    <p v-else-if="loadError" role="alert" class="mt-6 rounded-lg bg-error-soft px-3 py-2 text-sm text-error-strong">{{ loadError }}</p>

    <ul v-else-if="policies.length" class="mt-6 space-y-3">
      <li v-for="p in policies" :key="p.policyNumber" class="rounded-2xl border border-line bg-surface p-5 shadow-card">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="text-xs text-ink-subtle">Policy</p>
            <p class="text-lg font-semibold">{{ p.policyNumber }}</p>
            <p class="mt-1 text-sm text-ink-muted">
              {{ [p.carName, p.carModel].filter(Boolean).join(' ') || 'Vehicle' }}<span v-if="p.makeYear"> · {{ p.makeYear }}</span>
              <span v-if="p.plateNumber"> · {{ p.plateNumber }}</span>
            </p>
            <p class="mt-1 text-xs text-ink-subtle">
              {{ label(p.coverageType) }}
              <template v-if="p.policyIssuedAt"> · {{ fmtDate(p.policyIssuedAt) }} – {{ fmtDate(endOf(p.policyIssuedAt)) }}</template>
              <template v-if="p.sumInsured != null"> · Sum insured {{ money(p.sumInsured) }}</template>
            </p>
          </div>
          <button type="button" class="h-11 shrink-0 rounded-xl bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-hover" @click="fileClaim(p.policyNumber)">
            File a claim
          </button>
        </div>
      </li>
    </ul>

    <div v-else class="mt-6 rounded-2xl border border-line bg-surface p-6 text-center">
      <p class="font-medium">We couldn’t find an active policy on your account.</p>
      <p class="mt-1 text-sm text-ink-muted">If you have one, enter its number below.</p>
    </div>

    <section class="mt-8 rounded-2xl border border-line bg-surface p-5 shadow-card">
      <h2 class="text-base font-semibold">Don’t see your policy?</h2>
      <p class="text-sm text-ink-muted">Enter the policy number from your certificate.</p>
      <form class="mt-3 flex flex-col gap-3 sm:flex-row" @submit.prevent="find">
        <label for="policyNumber" class="sr-only">Policy number</label>
        <input
          id="policyNumber" v-model="policyNumber" type="text" autocomplete="off" autocapitalize="characters"
          placeholder="e.g. AWI-MOT-POL-2026-123456"
          class="h-11 flex-1 rounded-xl border border-line bg-canvas px-3 text-sm outline-none focus:border-primary focus:shadow-focus"
          :aria-invalid="!!findError"
          @input="found = null; findError = ''"
        />
        <button type="submit" :disabled="checking" class="h-11 rounded-xl border border-line px-5 text-sm font-semibold hover:bg-surface-muted disabled:opacity-60">
          {{ checking ? 'Checking…' : 'Find policy' }}
        </button>
      </form>
      <p v-if="findError" role="alert" class="mt-3 rounded-lg bg-error-soft px-3 py-2 text-sm text-error-strong">{{ findError }}</p>

      <div v-if="found" class="mt-4 rounded-xl border p-4" :class="canFile ? 'border-success' : 'border-error'" aria-live="polite">
        <template v-if="canFile">
          <p class="font-semibold">{{ found.policyNumber }}
            <span class="ml-2 rounded-full bg-success-soft px-2.5 py-0.5 text-xs font-semibold text-success-strong">Active</span>
          </p>
          <p class="mt-1 text-sm text-ink-muted">
            {{ found.vehicleTypeAndMake }}<span v-if="found.plateNumber"> · {{ found.plateNumber }}</span>
            · {{ label(found.coverageType) }} · {{ fmtDate(found.startDate) }} – {{ fmtDate(found.endDate) }}
          </p>
          <button type="button" class="mt-3 h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover" @click="fileClaim(found.policyNumber)">
            File a claim on this policy
          </button>
        </template>
        <p v-else class="text-sm text-error-strong">{{ found.validationMessage || 'This policy cannot be used to file a claim.' }}</p>
      </div>
    </section>
  </div>
</template>
