<script setup>
// Rate table editor (plan 5.6, MAR-26 to MAR-29). Only drafts are editable. Cells with errors are
// outlined and listed in a banner; Activate stays disabled until there are none.
import { computed, onMounted, ref, watch } from "vue";
import { onBeforeRouteLeave, useRoute } from "vue-router";
import { openModal } from "@customizer/modal-x";
import Button from "@/components/Button.vue";
import { toasted } from "@/utils/utils";
import MarinePageHeader from "../../components/MarinePageHeader.vue";
import PageState from "../../components/PageState.vue";
import DetailTabs from "../../components/DetailTabs.vue";
import AuditTimeline from "../../components/AuditTimeline.vue";
import { cardClass, inputClass } from "../../components/styles";
import { getRateTable, listRateTables, activateRateTable, updateRateTable } from "../../api/marineApi";
import { notifyError } from "../../api/marineClient";
import { AGE_BAND_ACTIONS, MODES, productLabel } from "../../constants";
import { validateRateTable } from "../../utils/rateTable";
import { addDays, formatDate, todayIso } from "../../utils/format";

const route = useRoute();
const t = ref(null);
const loading = ref(true);
const loadError = ref(null);
const saving = ref(false);
const activating = ref(false);
const dirty = ref(false);
let tracking = false;

async function load() {
  loading.value = true;
  tracking = false;
  const res = await getRateTable(route.params.id);
  loading.value = false;
  if (!res.ok) return (loadError.value = res.error);
  t.value = res.data;
  dirty.value = false;
  setTimeout(() => (tracking = true));
}
onMounted(load);
watch(t, () => tracking && (dirty.value = true), { deep: true });

const editable = computed(() => t.value?.status === "DRAFT");
const problems = computed(() => (t.value ? validateRateTable(t.value) : []));
const bad = computed(() => new Set(problems.value.map((p) => p.path)));
const cell = (path, extra = "") => [inputClass, "!h-9", extra, bad.value.has(path) ? "border-error ring-1 ring-error" : "border-line"];
const tabCount = (tab) => problems.value.filter((p) => p.tab === tab).length;
const tabLabel = (key, label) => (tabCount(label) ? `${label} ⚠` : label);

async function save() {
  saving.value = true;
  const res = await updateRateTable(t.value.id, t.value);
  saving.value = false;
  if (!res.ok) return notifyError(res.error, { onStale: load });
  tracking = false;
  t.value = res.data;
  dirty.value = false;
  setTimeout(() => (tracking = true));
  toasted(true, `${res.data.name} saved`);
  return true;
}

async function activate() {
  if (problems.value.length) return;
  const others = await listRateTables({ size: 50 });
  const current = others.ok ? others.data.content.find((x) => x.status === "ACTIVE" && x.product === t.value.product) : null;
  openModal(
    "MarineConfirm",
    {
      title: `Activate ${t.value.name}?`,
      message: `Version ${t.value.name} becomes active from ${formatDate(t.value.effectiveFrom)}${current ? `; version ${current.name} retires on ${formatDate(addDays(t.value.effectiveFrom, -1))}` : ""}. Quotes rated after that use the new rates.`,
      confirmLabel: "Activate",
    },
    async (r) => {
      if (!r?.confirmed) return;
      activating.value = true;
      if (dirty.value && !(await save())) return (activating.value = false);
      const res = await activateRateTable(t.value.id);
      activating.value = false;
      if (!res.ok) return notifyError(res.error, { onStale: load });
      toasted(true, `${res.data.name} is now active`);
      load();
    }
  );
}

// Row helpers
const addRoute = () => t.value.routeFactors.push({ originRegion: "", destination: "", mode: "SEA", factor: "1.00" });
const addBand = () => {
  const last = t.value.ageBands.at(-1);
  t.value.ageBands.push({ fromAge: last ? Number(last.toAge) + 1 : 0, toAge: 99, loadingPct: "0", action: "LOAD" });
};

onBeforeRouteLeave(
  () =>
    !dirty.value ||
    new Promise((resolve) =>
      openModal("MarineConfirm", { title: "Leave without saving?", message: "Your changes to this rate table will be lost.", confirmLabel: "Leave", danger: true }, (r) => resolve(!!r?.confirmed))
    )
);
</script>

<template>
  <div class="p-4 md:p-6">
    <PageState v-if="loading && !t" kind="loading" />
    <PageState v-else-if="loadError?.status === 404" kind="notFound"><RouterLink to="/marine/admin/rate-tables"><Button variant="outline" size="sm">Back to rate tables</Button></RouterLink></PageState>
    <PageState v-else-if="loadError" kind="error" :message="loadError.message" @retry="load" />

    <template v-else-if="t">
      <MarinePageHeader
        :title="t.name"
        :status="t.status"
        entity="rateTable"
        :subtitle="`${productLabel(t.product)} · effective from ${formatDate(t.effectiveFrom)}${t.effectiveTo ? ` to ${formatDate(t.effectiveTo)}` : ''}${editable ? '' : ' · read-only'}`"
        :crumbs="[{ label: 'Marine' }, { label: 'Rate tables', to: '/marine/admin/rate-tables' }, { label: t.name }]"
      >
        <template v-if="editable" #actions>
          <Button variant="outline" :disabled="!dirty" :pending="saving" @click="save">Save</Button>
          <span :title="problems.length ? 'Fix the errors first' : ''"><Button :disabled="!!problems.length" :pending="activating" @click="activate">Activate</Button></span>
        </template>
      </MarinePageHeader>

      <div v-if="editable && problems.length" role="alert" class="p-3 mb-4 rounded-xl border bg-error-soft border-error/30">
        <p class="text-sm font-semibold text-error-strong">{{ problems.length }} {{ problems.length === 1 ? "problem blocks" : "problems block" }} activation</p>
        <ul class="mt-1 text-sm list-disc list-inside text-error-strong"><li v-for="p in problems" :key="p.path + p.message">{{ p.tab }}: {{ p.message }}</li></ul>
      </div>

      <DetailTabs
          :panel-disabled="!editable"
          :tabs="[
            { key: 'general', label: tabLabel('general', 'General') },
            { key: 'commodity', label: tabLabel('commodity', 'Commodity rates') },
            { key: 'clause', label: tabLabel('clause', 'Clause factors') },
            { key: 'route', label: tabLabel('route', 'Route factors') },
            { key: 'age', label: tabLabel('age', 'Vessel age bands') },
            { key: 'war', label: tabLabel('war', 'War and strikes') },
            { key: 'history', label: 'History' },
          ]"
        >
          <template #general>
            <section :class="[cardClass, 'p-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3']">
              <label class="flex flex-col gap-1 text-sm font-medium text-ink">Version name<input v-model="t.name" :class="cell('name')" /></label>
              <label class="flex flex-col gap-1 text-sm font-medium text-ink">Effective from<input v-model="t.effectiveFrom" type="date" :min="todayIso()" :class="cell('effectiveFrom')" /></label>
              <div class="hidden lg:block" />
              <label class="flex flex-col gap-1 text-sm font-medium text-ink">Uplift %<input v-model="t.general.upliftPct" inputmode="decimal" :class="cell('general.upliftPct', 'text-right tabular-nums')" /></label>
              <label class="flex flex-col gap-1 text-sm font-medium text-ink">Minimum premium (ETB)<input v-model="t.general.minPremium" inputmode="decimal" :class="cell('general.minPremium', 'text-right tabular-nums')" /></label>
              <label class="flex flex-col gap-1 text-sm font-medium text-ink">VAT %<input v-model="t.general.vatPct" inputmode="decimal" :class="cell('general.vatPct', 'text-right tabular-nums')" /></label>
              <label class="flex flex-col gap-1 text-sm font-medium text-ink">Stamp duty (ETB)<input v-model="t.general.stampDuty" inputmode="decimal" :class="cell('general.stampDuty', 'text-right tabular-nums')" /></label>
            </section>
          </template>

          <template #commodity>
            <section :class="[cardClass, 'overflow-hidden max-w-xl']">
              <table class="w-full text-sm">
                <thead class="bg-surface-muted"><tr class="text-xs font-semibold text-left uppercase text-ink-subtle"><th class="px-4 py-2">Commodity class</th><th class="px-4 py-2 text-right">Base rate %</th></tr></thead>
                <tbody>
                  <tr v-for="(r, i) in t.commodityRates" :key="r.commodityClass" class="border-t border-line">
                    <td class="px-4 py-2 text-ink">{{ r.commodityClass.charAt(0) + r.commodityClass.slice(1).toLowerCase() }}</td>
                    <td class="px-4 py-2"><input v-model="r.ratePct" inputmode="decimal" :aria-label="`${r.commodityClass} base rate %`" :class="cell(`commodityRates.${i}.ratePct`, 'text-right tabular-nums')" /></td>
                  </tr>
                </tbody>
              </table>
            </section>
          </template>

          <template #clause>
            <section :class="[cardClass, 'p-4 grid gap-4 sm:grid-cols-3 max-w-2xl']">
              <label v-for="c in ['ICC_A', 'ICC_B', 'ICC_C']" :key="c" class="flex flex-col gap-1 text-sm font-medium text-ink">
                {{ c.replace("_", " ") }} factor
                <input v-model="t.clauseFactors[c]" inputmode="decimal" :class="cell(`clauseFactors.${c}`, 'text-right tabular-nums')" />
              </label>
            </section>
          </template>

          <template #route>
            <section :class="[cardClass, 'overflow-hidden']">
              <table class="w-full text-sm">
                <thead class="bg-surface-muted"><tr class="text-xs font-semibold text-left uppercase text-ink-subtle"><th class="px-3 py-2">Origin region</th><th class="px-3 py-2">Destination</th><th class="px-3 py-2">Mode</th><th class="px-3 py-2 text-right">Factor</th><th class="px-3 py-2"><span class="sr-only">Remove</span></th></tr></thead>
                <tbody>
                  <tr v-for="(r, i) in t.routeFactors" :key="i" class="border-t border-line">
                    <td class="px-3 py-2"><input v-model="r.originRegion" aria-label="Origin region" :class="cell(`routeFactors.${i}.originRegion`)" /></td>
                    <td class="px-3 py-2"><input v-model="r.destination" aria-label="Destination" :class="cell(`routeFactors.${i}.destination`)" /></td>
                    <td class="px-3 py-2"><select v-model="r.mode" aria-label="Mode" :class="cell(`routeFactors.${i}.mode`)"><option v-for="m in MODES" :key="m.value" :value="m.value">{{ m.label }}</option></select></td>
                    <td class="px-3 py-2"><input v-model="r.factor" inputmode="decimal" aria-label="Factor" :class="cell(`routeFactors.${i}.factor`, 'text-right tabular-nums !w-24 ml-auto')" /></td>
                    <td class="px-3 py-2 text-right"><button v-if="editable" type="button" class="text-sm font-medium text-error hover:underline" @click="t.routeFactors.splice(i, 1)">Remove</button></td>
                  </tr>
                </tbody>
              </table>
              <div v-if="editable" class="p-3 border-t border-line"><Button variant="outline" size="sm" @click="addRoute">Add route</Button></div>
            </section>
          </template>

          <template #age>
            <section :class="[cardClass, 'overflow-hidden max-w-3xl']">
              <p class="px-4 pt-3 text-xs text-ink-muted">Bands must run from 0 to 99 years with no overlaps or gaps. Refer sends the quote to an underwriter; Decline stops it.</p>
              <table class="w-full text-sm">
                <thead class="bg-surface-muted"><tr class="text-xs font-semibold text-left uppercase text-ink-subtle"><th class="px-3 py-2">From age</th><th class="px-3 py-2">To age</th><th class="px-3 py-2 text-right">Loading %</th><th class="px-3 py-2">Action</th><th class="px-3 py-2"><span class="sr-only">Remove</span></th></tr></thead>
                <tbody>
                  <tr v-for="(b, i) in t.ageBands" :key="i" class="border-t border-line">
                    <td class="px-3 py-2"><input v-model.number="b.fromAge" type="number" min="0" max="99" aria-label="From age" :class="cell(`ageBands.${i}.fromAge`, 'tabular-nums')" /></td>
                    <td class="px-3 py-2"><input v-model.number="b.toAge" type="number" min="0" max="99" aria-label="To age" :class="cell(`ageBands.${i}.toAge`, 'tabular-nums')" /></td>
                    <td class="px-3 py-2"><input v-model="b.loadingPct" inputmode="decimal" aria-label="Loading %" :class="cell(`ageBands.${i}.loadingPct`, 'text-right tabular-nums')" /></td>
                    <td class="px-3 py-2"><select v-model="b.action" aria-label="Action" :class="cell(`ageBands.${i}.action`)"><option v-for="a in AGE_BAND_ACTIONS" :key="a" :value="a">{{ a.charAt(0) + a.slice(1).toLowerCase() }}</option></select></td>
                    <td class="px-3 py-2 text-right"><button v-if="editable" type="button" class="text-sm font-medium text-error hover:underline" @click="t.ageBands.splice(i, 1)">Remove</button></td>
                  </tr>
                </tbody>
              </table>
              <div v-if="editable" class="p-3 border-t border-line"><Button variant="outline" size="sm" @click="addBand">Add band</Button></div>
            </section>
          </template>

          <template #war>
            <section :class="[cardClass, 'p-4 grid gap-4 sm:grid-cols-2 max-w-xl']">
              <label class="flex flex-col gap-1 text-sm font-medium text-ink">Default war rate %<input v-model="t.warStrikes.warRatePct" inputmode="decimal" :class="cell('warStrikes.warRatePct', 'text-right tabular-nums')" /></label>
              <label class="flex flex-col gap-1 text-sm font-medium text-ink">Strikes rate %<input v-model="t.warStrikes.strikesRatePct" inputmode="decimal" :class="cell('warStrikes.strikesRatePct', 'text-right tabular-nums')" /></label>
              <p class="text-xs sm:col-span-2 text-ink-subtle">Per-route war rates (for example the Red Sea) are an open question with underwriting; they will be added here once agreed.</p>
            </section>
          </template>

          <template #history>
            <section :class="[cardClass, 'p-4']"><AuditTimeline entity="rateTable" :entity-id="t.id" /></section>
          </template>
        </DetailTabs>
    </template>
  </div>
</template>
