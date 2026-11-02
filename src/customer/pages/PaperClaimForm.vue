<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { currentUser, fullName } from '@/customer/session';
import { validateEthiopianPhone } from '@/customer/validators';
import { INK } from '@/customer/claimFormLayout';
import { paperForm, blankValues, missingFields, formFields, paperPageContent } from '@/customer/paperClaimForms';
import FormField from '@/customer/components/FormField.vue';

// One of Standard Insurance's other claim notification forms (Carriers Liability, CPM & CAR, Workmen's
// Compensation): the customer answers the questions, sees them written on the original form, and prints
// it or saves it as PDF to sign and hand in. The answers stay in this browser as a draft until cleared.
const route = useRoute();
const def = computed(() => paperForm(String(route.params.formId || '')));
const user = currentUser();
const profile = { name: fullName(user), phone: user?.mobilePhone || '' };

const DRAFT = (id) => `customer.paperForm.${id}`;
function loadDraft(d) {
  const blank = blankValues(d, profile);
  try {
    const saved = JSON.parse(localStorage.getItem(DRAFT(d.id)) || 'null');
    return saved && typeof saved === 'object' ? { ...blank, ...saved } : blank;
  } catch (e) {
    return blank;
  }
}

const values = reactive({});
const errors = reactive({});
const step = ref('fill');
const scale = ref(1);
const holder = ref(null);

function reset(fresh = false) {
  Object.keys(values).forEach((k) => delete values[k]);
  Object.keys(errors).forEach((k) => delete errors[k]);
  if (!def.value) return;
  if (fresh) { try { localStorage.removeItem(DRAFT(def.value.id)); } catch (e) { /* nothing saved */ } }
  Object.assign(values, fresh ? blankValues(def.value, profile) : loadDraft(def.value));
  step.value = 'fill';
}
watch(def, () => reset(), { immediate: true });
watch(values, () => {
  if (!def.value) return;
  try { localStorage.setItem(DRAFT(def.value.id), JSON.stringify(values)); } catch (e) { /* private mode: no draft */ }
}, { deep: true });

const required = computed(() => new Set(def.value?.required || []));
const label = (f) => (required.value.has(f.key) ? `${f.label} *` : f.label);

function validate() {
  Object.keys(errors).forEach((k) => delete errors[k]);
  for (const key of missingFields(def.value, values)) errors[key] = 'Please fill this in';
  for (const f of formFields(def.value)) {
    if (f.type === 'tel' && String(values[f.key] || '').trim()) {
      const message = validateEthiopianPhone(values[f.key]);
      if (message) errors[f.key] = message;
    }
  }
  return !Object.keys(errors).length;
}

async function preview() {
  if (!validate()) {
    await nextTick();
    document.querySelector('[aria-invalid="true"]')?.focus();
    return;
  }
  step.value = 'preview';
  window.scrollTo({ top: 0 });
  await nextTick();
  requestAnimationFrame(fitToScreen);
}

function clearForm() {
  if (window.confirm('Clear all your answers on this form?')) reset(true);
}

// The sheets: the same drawing as the motor form (ClaimFormPrint.vue)
const PX_PER_PT = 96 / 72;
const pages = computed(() => {
  if (!def.value) return [];
  const content = paperPageContent(def.value, values);
  return def.value.images.map((image, i) => ({ no: i + 1, image, ...content[i] }));
});
const pt = (n) => `${n}pt`;
const blockTop = (b) => b.top - (b.lineHeight - b.size * 1.15) / 2;

function fitToScreen() {
  const width = def.value?.page.width || 612;
  const available = holder.value?.clientWidth || width * PX_PER_PT;
  scale.value = Math.min(1, available / (width * PX_PER_PT));
}
const printForm = () => window.print();

// These forms are a different paper size from the motor form, so the page size is set while this page is open
let pageStyle = null;
function setPageSize() {
  pageStyle?.remove();
  if (!def.value) return;
  pageStyle = document.createElement('style');
  pageStyle.textContent = `@page { size: ${def.value.page.width}pt ${def.value.page.height}pt; margin: 0; }`;
  document.head.appendChild(pageStyle);
}
watch(def, setPageSize);

onMounted(() => {
  setPageSize();
  window.addEventListener('resize', fitToScreen);
});
onBeforeUnmount(() => {
  pageStyle?.remove();
  window.removeEventListener('resize', fitToScreen);
});
</script>

<template>
  <div class="pf-root mx-auto max-w-3xl">
    <div v-if="!def" class="rounded-2xl border border-line bg-surface p-6 text-center">
      <p class="font-medium">We couldn’t find that claim form.</p>
      <router-link to="/forms" class="mt-2 inline-block text-sm text-primary underline">See all claim forms</router-link>
    </div>

    <template v-else-if="step === 'fill'">
      <router-link to="/forms" class="text-sm text-primary underline">← All claim forms</router-link>
      <h1 class="mt-3 text-2xl font-semibold">{{ def.title }} claim</h1>
      <p class="mt-1 text-ink-muted">
        {{ def.subtitle }}. Answer what you can; we write it on Standard Insurance’s form for you to print, sign and bring to your branch.
      </p>

      <form class="mt-6 space-y-5" novalidate @submit.prevent="preview">
        <section v-for="sec in def.sections" :key="sec.title" class="rounded-2xl border border-line bg-surface p-5 shadow-card">
          <h2 class="text-base font-semibold">{{ sec.title }}</h2>
          <div class="mt-3 grid gap-4 sm:grid-cols-2">
            <FormField
              v-for="f in sec.fields" :key="f.key" v-model="values[f.key]"
              :label="label(f)" :type="f.type || 'text'" :rows="f.rows || 0" :inputmode="f.inputmode"
              :autocomplete="f.type === 'tel' ? 'tel' : 'off'" :error="errors[f.key] || ''"
              :class="{ 'sm:col-span-2': f.rows }"
            />
          </div>
        </section>

        <p v-if="Object.keys(errors).length" role="alert" class="rounded-lg bg-error-soft px-3 py-2 text-sm text-error-strong">
          Please fill in the fields marked above.
        </p>

        <div class="flex flex-wrap items-center justify-between gap-3">
          <button type="button" class="rounded-xl border border-line px-4 py-2.5 text-sm font-medium hover:bg-surface-muted" @click="clearForm">Clear form</button>
          <button type="submit" class="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover">Preview the form</button>
        </div>
        <p class="text-xs text-ink-subtle">Your answers are kept on this device only until you clear them. Fields marked * are needed.</p>
      </form>
    </template>

    <template v-else>
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <button type="button" class="text-sm text-primary underline" @click="step = 'fill'">← Edit my answers</button>
        <button type="button" class="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover" @click="printForm">Print or save as PDF</button>
      </div>

      <div ref="holder" class="pf-holder">
        <div
          v-for="p in pages" :key="p.no" class="pf-outer"
          :style="{ width: `${def.page.width * PX_PER_PT * scale}px`, height: `${def.page.height * PX_PER_PT * scale}px` }"
        >
          <div
            class="pf-page" :aria-label="`${def.title} claim form, page ${p.no}`"
            :style="{ width: pt(def.page.width), height: pt(def.page.height), backgroundImage: `url(${p.image})`, transform: `scale(${scale})` }"
          >
            <span
              v-for="(c, i) in p.cells" :key="`l${i}`" class="pf-abs pf-line"
              :style="{ left: pt(c.left), top: pt(c.top), width: pt(c.width), fontSize: pt(c.size), color: INK }"
            >{{ c.text }}</span>

            <div
              v-for="(b, i) in p.blocks" :key="`b${i}`" class="pf-abs pf-block"
              :style="{ left: pt(b.left), top: pt(blockTop(b)), width: pt(b.width), fontSize: pt(b.size), lineHeight: pt(b.lineHeight), maxHeight: pt(b.lineHeight * b.lines), textIndent: pt(b.indent), color: INK }"
            >{{ b.text }}</div>
          </div>
        </div>
      </div>

      <p class="mt-4 text-xs text-ink-subtle print:hidden">{{ def.signNote }}</p>
    </template>
  </div>
</template>

<style>
@font-face {
  font-family: 'Noto Sans Ethiopic';
  src: url('../assets/NotoSansEthiopic-Regular.ttf') format('truetype');
  font-display: swap;
}
.pf-holder { display: flex; flex-direction: column; align-items: center; gap: 16px; }
.pf-outer { position: relative; box-shadow: 0 2px 12px rgb(0 0 0 / 0.15); background: #fff; }
.pf-page {
  position: absolute; top: 0; left: 0; transform-origin: top left;
  background-size: 100% 100%; background-repeat: no-repeat;
  font-family: Helvetica, Arial, 'Noto Sans Ethiopic', sans-serif;
}
.pf-abs { position: absolute; }
.pf-line { white-space: nowrap; overflow: hidden; line-height: 1.15; }
.pf-block { overflow: hidden; word-break: break-word; }
@media print {
  html, body { background: #fff !important; }
  .pf-root { max-width: none !important; margin: 0 !important; }
  .pf-holder { display: block; gap: 0; }
  .pf-outer { width: auto !important; height: auto !important; box-shadow: none; break-after: page; page-break-after: always; overflow: hidden; }
  .pf-outer:last-child { break-after: auto; page-break-after: auto; }
  .pf-page { position: relative; transform: none !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
</style>
