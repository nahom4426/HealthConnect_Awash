<script setup>
// Public certificate check: opened by scanning the certificate's QR code.
// No sign-in and no app shell. Shows the number, vessel and voyage only.
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import StatusBadge from "../../components/StatusBadge.vue";
import { verifyCertificate } from "../../api/marineApi";
import { formatDate } from "../../utils/format";

const route = useRoute();
const result = ref(null);
const error = ref(null);
const loading = ref(true);
const INSURER_PHONE = "+251 11 551 8400";

onMounted(async () => {
  document.title = "Verify certificate · Standard Insurance";
  const res = await verifyCertificate(route.params.token);
  loading.value = false;
  if (res.ok) result.value = res.data;
  else error.value = res.error;
});
</script>

<template>
  <div class="flex flex-col min-h-screen bg-canvas">
    <header class="flex gap-3 items-center px-4 py-3 text-white bg-[#0c4a6e]">
      <img src="/standard-seal.png" alt="" class="w-9 h-9 rounded-full bg-white/95 object-contain p-0.5" />
      <div>
        <p class="text-sm font-semibold leading-tight">Standard Insurance S.C.</p>
        <p class="text-xs opacity-80">Marine cargo certificate check</p>
      </div>
    </header>

    <main class="flex-1 px-4 py-6 mx-auto w-full max-w-md">
      <div v-if="loading" class="p-6 space-y-3 rounded-2xl animate-pulse bg-surface" aria-busy="true" aria-label="Checking certificate">
        <div class="mx-auto w-32 h-8 rounded-full bg-surface-raised"></div>
        <div v-for="i in 5" :key="i" class="h-4 rounded bg-surface-raised"></div>
      </div>

      <div v-else-if="error?.status === 429" role="alert" class="p-6 text-center rounded-2xl bg-surface">
        <p class="text-base font-semibold text-ink">Too many checks. Try again in a minute.</p>
      </div>

      <div v-else-if="error" role="alert" class="p-6 text-center rounded-2xl bg-surface">
        <p class="text-base font-semibold text-ink">We couldn't verify this certificate.</p>
        <p class="mt-2 text-sm text-ink-muted">Check the QR code or contact the insurer.</p>
        <a :href="`tel:${INSURER_PHONE.replace(/\s/g, '')}`" class="inline-block mt-4 text-sm font-semibold text-primary">{{ INSURER_PHONE }}</a>
      </div>

      <div v-else-if="result" class="overflow-hidden rounded-2xl border bg-surface border-line">
        <div class="flex flex-col gap-2 items-center px-4 py-6 text-center border-b border-line">
          <StatusBadge entity="verify" :status="result.status" size="lg" />
          <p v-if="result.status === 'VALID'" class="text-sm text-ink-muted">This certificate is genuine and in force.</p>
          <p v-else-if="result.status === 'SUPERSEDED'" class="text-sm text-ink-muted">A newer version of this certificate exists. Ask the holder for it.</p>
          <p v-else-if="result.status === 'CANCELLED'" class="text-sm text-ink-muted">This certificate was cancelled and gives no cover.</p>
          <p v-else-if="result.status === 'EXPIRED'" class="text-sm text-ink-muted">The period of this certificate has ended.</p>
          <p v-else class="text-sm text-ink-muted">This certificate is still being issued. Check again shortly.</p>
        </div>
        <dl class="divide-y divide-line">
          <div v-for="row in [
            ['Certificate no', `${result.certNo} (version ${result.version})`],
            ['Vessel', result.vesselName],
            ['Voyage', result.voyage],
            ['Issued', result.issuedAt ? formatDate(result.issuedAt) : '—'],
          ]" :key="row[0]" class="px-4 py-3">
            <dt class="text-xs font-medium text-ink-subtle">{{ row[0] }}</dt>
            <dd class="mt-0.5 text-base text-ink break-words">{{ row[1] || "—" }}</dd>
          </div>
        </dl>
      </div>
    </main>

    <footer class="px-4 py-4 text-xs text-center text-ink-subtle">Questions? Call Standard Insurance on {{ INSURER_PHONE }}.</footer>
  </div>
</template>
