<script setup>
// Certificate detail (plan 5.5, MAR-37, MAR-40): the PDF on the left; summary, verification link
// with QR, versions and the document event log on the right. Pending certificates poll every 5 s.
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { openModal } from "@customizer/modal-x";
import QRCode from "qrcode";
import Button from "@/components/Button.vue";
import { toasted } from "@/utils/utils";
import MarinePageHeader from "../../components/MarinePageHeader.vue";
import PageState from "../../components/PageState.vue";
import KeyValueGrid from "../../components/KeyValueGrid.vue";
import PdfPreview from "../../components/PdfPreview.vue";
import StatusBadge from "../../components/StatusBadge.vue";
import { cardClass } from "../../components/styles";
import { useResource } from "../../composables/useResource";
import { useCan } from "../../composables/useCan";
import { getCertificate, getCertificatePdf, logCertificateEvent } from "../../api/marineApi";
import { formatDate, formatDateTime } from "../../utils/format";
import { formatMoney } from "../../utils/money";

const route = useRoute();
const { data: c, loading, error, notFound, load, reload } = useResource(getCertificate);
onMounted(() => load(route.params.id));
watch(() => route.params.id, (id) => id && load(id));

// Pending: the backend is still rendering the PDF
let timer = null;
watch(
  () => c.value?.status,
  (s) => {
    clearInterval(timer);
    if (s === "PENDING") timer = setInterval(reload, 5000);
  }
);
onBeforeUnmount(() => clearInterval(timer));

const verifyLink = computed(() => (c.value ? `${location.origin}/verify/${c.value.token}` : ""));
const qr = ref("");
watch(verifyLink, async (url) => (qr.value = url ? await QRCode.toDataURL(url, { margin: 1, width: 160 }) : ""), { immediate: true });

async function copyLink() {
  try {
    await navigator.clipboard.writeText(verifyLink.value);
    toasted(true, "Verification link copied");
  } catch {
    toasted(false, "Couldn't copy. Select the link and copy it instead.");
  }
}

function email() {
  openModal("MarineEmailCertificate", { certificate: c.value }, (sent) => sent && reload());
}

async function onDownloaded() {
  await logCertificateEvent(c.value.id, "DOWNLOAD");
  reload();
}

const EVENT_LABELS = { EMAIL: "Emailed", DOWNLOAD: "Downloaded", PRINT: "Printed" };

const { can } = useCan();
// Only the newest version of an issued certificate can be amended or cancelled
const isCurrent = computed(() => c.value && ["ISSUED", "PENDING"].includes(c.value.status) && c.value.version === Math.max(...c.value.versions.map((v) => v.version)));
function cancel() {
  openModal("MarineCancelCertificate", { certificate: c.value }, (done) => done && reload());
}
</script>

<template>
  <div class="p-4 md:p-6">
    <PageState v-if="loading && !c" kind="loading" />
    <template v-else-if="notFound">
      <MarinePageHeader title="Certificate not found" :crumbs="[{ label: 'Marine' }, { label: 'Certificates', to: '/marine/certificates' }]" />
      <PageState kind="notFound"><RouterLink to="/marine/certificates"><Button variant="outline" size="sm">Back to certificates</Button></RouterLink></PageState>
    </template>
    <PageState v-else-if="error" kind="error" :message="error.message" @retry="load(route.params.id)" />

    <template v-else-if="c">
      <MarinePageHeader
        :title="`${c.certNo} · v${c.version}`"
        :status="c.status"
        entity="certificate"
        :subtitle="c.insured?.name"
        :crumbs="[{ label: 'Marine' }, { label: 'Certificates', to: '/marine/certificates' }, { label: c.certNo }]"
      >
        <template #actions>
          <Button variant="outline" :disabled="c.status === 'PENDING'" @click="email">Email</Button>
          <template v-if="can('certificate.amend') && isCurrent">
            <RouterLink :to="`/marine/certificates/${c.id}/amend`"><Button variant="outline">Amend</Button></RouterLink>
            <span :title="c.hasOpenClaim ? 'This certificate has an open claim' : ''">
              <Button variant="outline" :disabled="c.hasOpenClaim" @click="cancel">Cancel</Button>
            </span>
          </template>
        </template>
      </MarinePageHeader>

      <div class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem] items-start">
        <section :class="[cardClass, 'p-4 min-h-[36rem] flex flex-col']" aria-label="Certificate PDF">
          <div v-if="c.status === 'PENDING'" class="flex flex-col flex-1 gap-3 justify-center items-center py-20 text-center" role="status">
            <span class="w-8 h-8 rounded-full border-4 animate-spin border-primary/20 border-t-primary" aria-hidden="true"></span>
            <p class="text-sm font-semibold text-ink">PDF is being generated</p>
            <p class="text-xs text-ink-muted">This page checks again every 5 seconds.</p>
          </div>
          <PdfPreview v-else :fetcher="() => getCertificatePdf(c.id)" :file-name="`${c.certNo}-v${c.version}.pdf`" :version="`${c.id}-${c.status}`" @downloaded="onDownloaded" />
        </section>

        <div class="grid gap-4">
          <section :class="[cardClass, 'p-4']">
            <h2 class="mb-3 text-sm font-semibold text-ink">Summary</h2>
            <KeyValueGrid
              :cols="2"
              :items="[
                { label: 'Policy', value: c.policy?.policyNo, to: c.policy ? `/marine/policies/${c.policy.id}` : null },
                { label: 'Issued', value: c.issuedAt ? formatDateTime(c.issuedAt) : null },
                { label: 'Insured', value: c.insured?.name },
                { label: 'Vessel', value: c.vessel ? `${c.vessel.name} (IMO ${c.vessel.imo})` : 'By air' },
                { label: 'Voyage', value: `${c.loadingPort?.name ?? '—'} → ${c.dischargePort?.name ?? '—'}`, wide: true },
                { label: 'Final destination', value: c.finalDestination },
                { label: 'Sailing date', value: formatDate(c.sailingDate) },
                { label: 'Sum insured', value: formatMoney(c.sumInsured, c.currency) },
                { label: 'BL no', value: c.blNo },
                ...(c.inland ? [
                  { label: 'Inland leg', value: `${c.inland.fromName ?? c.inland.from} → ${c.inland.toName ?? c.inland.to}`, wide: true },
                  { label: 'Truck plate', value: c.inland.truckPlate },
                  { label: 'Driver', value: c.inland.driverName },
                  { label: 'Convoy', value: c.inland.convoyRef },
                ] : []),
                ...(c.openCover?.id ? [{ label: 'Open cover', value: c.openCover.coverNo, to: `/marine/open-covers/${c.openCover.id}` }] : []),
                ...(c.status === 'CANCELLED' ? [{ label: 'Cancelled', value: `${c.cancelReason?.replace(/_/g, ' ').toLowerCase()}: ${c.cancelNote}`, wide: true }] : []),
                ...(c.amendReason ? [{ label: 'Amendment reason', value: c.amendReason, wide: true }] : []),
              ]"
            />
          </section>

          <section :class="[cardClass, 'p-4']" aria-labelledby="cd-verify">
            <h2 id="cd-verify" class="mb-2 text-sm font-semibold text-ink">Verification</h2>
            <div class="flex gap-3 items-start">
              <img v-if="qr" :src="qr" alt="QR code to the verification page" class="w-24 h-24 rounded-lg border border-line" />
              <div class="min-w-0">
                <a :href="verifyLink" target="_blank" rel="noopener" class="block text-xs break-all text-primary hover:underline">{{ verifyLink }}</a>
                <Button variant="outline" size="xs" class="mt-2" @click="copyLink">Copy link</Button>
              </div>
            </div>
          </section>

          <section :class="[cardClass, 'p-4']">
            <h2 class="mb-2 text-sm font-semibold text-ink">Versions</h2>
            <ul class="text-sm divide-y divide-line">
              <li v-for="v in c.versions" :key="v.id" class="flex gap-2 justify-between items-center py-2">
                <RouterLink :to="`/marine/certificates/${v.id}`" :class="['font-medium', v.id === c.id ? 'text-ink' : 'text-primary hover:underline']">v{{ v.version }}</RouterLink>
                <StatusBadge entity="certificate" :status="v.status" />
                <span class="text-xs text-ink-muted">{{ v.issuedAt ? formatDateTime(v.issuedAt) : "—" }}</span>
              </li>
            </ul>
          </section>

          <section :class="[cardClass, 'p-4']">
            <h2 class="mb-2 text-sm font-semibold text-ink">Document events</h2>
            <p v-if="!c.events.length" class="text-sm text-ink-subtle">No prints, emails or downloads yet.</p>
            <ul v-else class="space-y-2 text-sm">
              <li v-for="(e, i) in [...c.events].reverse()" :key="i">
                <p class="text-ink"><span class="font-medium">{{ EVENT_LABELS[e.kind] ?? e.kind }}</span> by {{ e.by }}<span v-if="e.to"> to {{ e.to }}</span></p>
                <p class="text-xs text-ink-subtle">{{ formatDateTime(e.at) }}</p>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </template>
  </div>
</template>
