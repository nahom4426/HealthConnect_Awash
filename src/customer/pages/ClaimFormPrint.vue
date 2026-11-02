<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';
import { getClaim, describeError } from '@/customer/api';
import { PAGE, INK, ORANGE, pageContent, formDate } from '@/customer/claimFormLayout';
import page1 from '@/customer/assets/claim_form_page1.jpg';
import page2 from '@/customer/assets/claim_form_page2.jpg';

// Standard Insurance's own "Notification of Motor Accident" form with the customer's answers written on
// its blank lines: the same two pages and the same positions as the PDF the mobile app makes.
// "Print or save as PDF" opens the browser's print dialog (choose "Save as PDF").
const route = useRoute();
const claim = ref(null);
const loading = ref(true);
const error = ref('');
const scale = ref(1);
const holder = ref(null);

const PX_PER_PT = 96 / 72;
const form = computed(() => claim.value?.notificationForm || {});
const content = computed(() => pageContent(form.value));
const submitted = computed(() => formDate(claim.value?.createdAt));
const pages = computed(() => [
  { no: 1, image: page1, cells: content.value.lines[1] },
  { no: 2, image: page2, cells: content.value.lines[2], blocks: content.value.blocks },
]);

const pt = (n) => `${n}pt`;
// A block's first line sits at `top` in the PDF; CSS centres the text in its line box, so lift it by the difference
const blockTop = (b) => b.top - (b.lineHeight - b.size * 1.15) / 2;

function fitToScreen() {
  const available = holder.value?.clientWidth || PAGE.width * PX_PER_PT;
  scale.value = Math.min(1, available / (PAGE.width * PX_PER_PT));
}
const printForm = () => window.print();

onMounted(async () => {
  window.addEventListener('resize', fitToScreen);
  try {
    claim.value = await getClaim(route.params.claimUuid);
    if (!claim.value?.notificationForm) error.value = 'This claim has no claim form to print.';
  } catch (e) {
    error.value = e?.response?.status === 403 || e?.response?.status === 404
      ? 'We couldn’t find that claim on your account.'
      : describeError(e, 'We could not load this claim.');
  } finally {
    loading.value = false;
    requestAnimationFrame(fitToScreen);
  }
});
onBeforeUnmount(() => window.removeEventListener('resize', fitToScreen));
</script>

<template>
  <div class="cf-root mx-auto max-w-3xl">
    <div class="mb-4 flex items-center justify-between gap-3 print:hidden">
      <router-link :to="`/claims/${route.params.claimUuid}`" class="text-sm text-primary underline">← Back to my claim</router-link>
      <button v-if="claim && !error" type="button" class="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover" @click="printForm">Print or save as PDF</button>
    </div>

    <p v-if="loading" class="text-ink-muted">Loading…</p>
    <p v-else-if="error" role="alert" class="rounded-lg bg-error-soft px-3 py-2 text-sm text-error-strong">{{ error }}</p>

    <div v-else ref="holder" class="cf-holder">
      <div
        v-for="p in pages" :key="p.no" class="cf-outer"
        :style="{ width: `${PAGE.width * PX_PER_PT * scale}px`, height: `${PAGE.height * PX_PER_PT * scale}px` }"
      >
        <div
          class="cf-page" :aria-label="`Claim form, page ${p.no}`"
          :style="{ width: pt(PAGE.width), height: pt(PAGE.height), backgroundImage: `url(${p.image})`, transform: `scale(${scale})` }"
        >
          <!-- Claim number and date, in the empty corner left of the logo -->
          <div v-if="p.no === 1" class="cf-abs" :style="{ left: pt(34), top: pt(24), color: '#616161', fontSize: pt(8) }">
            <div>Claim No:</div>
            <div :style="{ color: ORANGE, fontWeight: 700, fontSize: pt(8.5) }">{{ claim.claimNumber }}</div>
            <div :style="{ fontSize: pt(7.5), marginTop: pt(2) }">Submitted: {{ submitted }}</div>
          </div>

          <span
            v-for="(c, i) in p.cells" :key="`l${i}`" class="cf-abs cf-line"
            :style="{ left: pt(c.left), top: pt(c.top), width: pt(c.width), fontSize: pt(c.size), color: INK }"
          >{{ c.text }}</span>

          <div
            v-for="(b, i) in p.blocks || []" :key="`b${i}`" class="cf-abs cf-block"
            :style="{ left: pt(b.left), top: pt(blockTop(b)), width: pt(b.width), fontSize: pt(b.size), lineHeight: pt(b.lineHeight), maxHeight: pt(b.lineHeight * b.lines), color: INK }"
          >{{ b.text }}</div>
        </div>
      </div>
    </div>

    <p v-if="claim && !error" class="mt-4 text-xs text-ink-subtle print:hidden">
      Sign the form (policyholder and driver) and bring it with the original driving licence and vehicle title deed (Libre) to your Standard Insurance branch.
    </p>
  </div>
</template>

<style>
@font-face {
  font-family: 'Noto Sans Ethiopic';
  src: url('../assets/NotoSansEthiopic-Regular.ttf') format('truetype');
  font-display: swap;
}
.cf-holder { display: flex; flex-direction: column; align-items: center; gap: 16px; }
.cf-outer { position: relative; box-shadow: 0 2px 12px rgb(0 0 0 / 0.15); background: #fff; }
.cf-page {
  position: absolute; top: 0; left: 0; transform-origin: top left;
  background-size: 100% 100%; background-repeat: no-repeat;
  font-family: Helvetica, Arial, 'Noto Sans Ethiopic', sans-serif;
}
.cf-abs { position: absolute; }
.cf-line { white-space: nowrap; overflow: hidden; line-height: 1.15; }
.cf-block { overflow: hidden; word-break: break-word; }
@media print {
  @page { size: 612pt 843pt; margin: 0; }
  html, body { background: #fff !important; }
  .cf-root { max-width: none !important; margin: 0 !important; }
  .cf-holder { display: block; gap: 0; }
  .cf-outer { width: 612pt !important; height: 843pt !important; box-shadow: none; break-after: page; page-break-after: always; overflow: hidden; }
  .cf-outer:last-child { break-after: auto; page-break-after: auto; }
  .cf-page { transform: none !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
</style>
