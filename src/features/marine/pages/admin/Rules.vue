<script setup>
// Rules admin (plan 6.7): referral rules, accumulation limits, warranties, authority matrix, inland
// limits and deadline rules. Each tab saves on its own with a required change note; switching tabs
// with unsaved changes asks first.
import { computed, onMounted, ref } from "vue";
import { onBeforeRouteLeave } from "vue-router";
import { openModal } from "@customizer/modal-x";
import Button from "@/components/Button.vue";
import { toasted } from "@/utils/utils";
import MarinePageHeader from "../../components/MarinePageHeader.vue";
import PageState from "../../components/PageState.vue";
import { cardClass, inputClass, inputBorder } from "../../components/styles";
import { getRules, saveRules } from "../../api/marineApi";
import { notifyError } from "../../api/marineClient";
import { COMMODITY_CLASSES, DEADLINE_BASES, DEADLINE_KINDS, REFERRAL_CONDITIONS, ROLE_LABELS, WARRANTY_CONDITIONS } from "../../constants";
import { formatDateTime } from "../../utils/format";

const TABS = [
  { key: "referral", label: "Referral rules" },
  { key: "accumulation", label: "Accumulation limits" },
  { key: "warranties", label: "Warranties" },
  { key: "authority", label: "Authority matrix" },
  { key: "inland", label: "Inland limits" },
  { key: "deadlines", label: "Deadline rules" },
];
const rules = ref(null);
const draft = ref(null);
const tab = ref("referral");
const note = ref("");
const errors = ref({});
const saving = ref(false);
const loadError = ref(null);

async function load() {
  const res = await getRules();
  if (!res.ok) return (loadError.value = res.error);
  rules.value = res.data;
  draft.value = structuredClone(res.data[tab.value]);
}
onMounted(load);

const dirty = computed(() => rules.value && JSON.stringify(draft.value) !== JSON.stringify(rules.value[tab.value]));
const confirmDiscard = () =>
  new Promise((resolve) =>
    openModal("MarineConfirm", { title: "Discard unsaved changes?", message: `Your changes to ${TABS.find((t) => t.key === tab.value).label.toLowerCase()} will be lost.`, confirmLabel: "Discard", danger: true }, (r) =>
      resolve(!!r?.confirmed)
    )
  );

async function selectTab(key) {
  if (key === tab.value) return;
  if (dirty.value && !(await confirmDiscard())) return;
  tab.value = key;
  draft.value = structuredClone(rules.value[key]);
  note.value = "";
  errors.value = {};
}
onBeforeRouteLeave(() => !dirty.value || confirmDiscard());

async function save() {
  errors.value = {};
  if (!note.value.trim()) return (errors.value = { note: "Say what changed and why" });
  saving.value = true;
  const res = await saveRules(tab.value, { data: draft.value, note: note.value.trim() });
  saving.value = false;
  if (res.ok) {
    rules.value = res.data;
    draft.value = structuredClone(res.data[tab.value]);
    note.value = "";
    toasted(true, `${TABS.find((t) => t.key === tab.value).label} saved`);
  } else if (res.error.status === 422) errors.value = res.error.fieldMap();
  else notifyError(res.error);
}

const condType = (c) => REFERRAL_CONDITIONS.find((x) => x.value === c)?.type;
function setCondition(row, c) {
  row.condition = c;
  const t = condType(c);
  row.value = t === "classes" || t === "ports" ? [] : t === "screening" ? "POTENTIAL" : "";
}
const listText = (v) => [].concat(v ?? []).join(", ");
const fromListText = (row, text) => (row.value = text.split(",").map((x) => x.trim().toUpperCase()).filter(Boolean));
const toggleClass = (row, c) => (row.value = row.value.includes(c) ? row.value.filter((x) => x !== c) : [...row.value, c]);
const addRule = () => draft.value.push({ id: `r${Date.now()}`, name: "", condition: "SUM_INSURED_OVER", value: "", active: true });
const addWarranty = () => draft.value.push({ id: `w${Date.now()}`, name: "", condition: "VESSEL_AGE_MAX", value: "", action: "REFER", loadPct: "", active: true });
const cell = (path, extra = "") => [inputClass, "!h-9", extra, inputBorder(errors.value[path])];
const recent = computed(() => (rules.value?.changes ?? []).filter((c) => c.section === tab.value).slice(-3).reverse());
</script>

<template>
  <div class="marine-page">
    <MarinePageHeader title="Underwriting rules" subtitle="Reference rules already in use. A quotation lists the ones its last rating triggered." :crumbs="[{ label: 'Marine' }, { label: 'Marine Settings' }, { label: 'Underwriting rules' }]">
      <template #badge><span class="px-2 py-0.5 text-xs font-semibold rounded-full bg-warning-soft text-warning-strong">Reference</span></template>
    </MarinePageHeader>
    <p role="status" class="p-4 mb-4 text-sm rounded-xl bg-warning-soft text-warning-strong">
      These figures are reference values. They are already in use on this screen, and they are not approved production rules. The 20-year vessel warranty and its 10% loading are part of that reference set, not an approved tariff. Replace each section, with a change note, before this book is used for live business.
      No section on this page is marked approved. The quotation and declaration underwriting section shows the rules the last rating triggered.
    </p>
    <PageState v-if="!rules && !loadError" kind="loading" />
    <PageState v-else-if="loadError" kind="error" :message="loadError.message" @retry="load" />
    <template v-else>
      <div role="tablist" class="flex overflow-x-auto gap-1 mb-4 border-b border-line">
        <button
          v-for="t in TABS"
          :key="t.key"
          role="tab"
          type="button"
          :aria-selected="tab === t.key"
          :class="['px-4 py-2 -mb-px text-sm font-medium whitespace-nowrap border-b-2', tab === t.key ? 'border-primary text-primary' : 'border-transparent text-ink-muted hover:text-ink']"
          @click="selectTab(t.key)"
        >
          {{ t.label }}<span v-if="tab === t.key && dirty" class="ml-1 text-warning-strong" aria-label="unsaved">•</span>
        </button>
      </div>

      <section role="tabpanel" :class="[cardClass, 'overflow-hidden']">
        <!-- Referral rules -->
        <div v-if="tab === 'referral'" class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-surface-muted"><tr class="text-xs font-semibold text-left uppercase text-ink-subtle"><th class="px-3 py-2">Name</th><th class="px-3 py-2">Condition</th><th class="px-3 py-2">Value</th><th class="px-3 py-2">Active</th><th class="px-3 py-2"><span class="sr-only">Remove</span></th></tr></thead>
            <tbody>
              <tr v-for="(r, i) in draft" :key="r.id" class="align-top border-t border-line">
                <td class="px-3 py-2"><input v-model="r.name" aria-label="Rule name" :class="cell(`${i}.name`)" /></td>
                <td class="px-3 py-2"><select :value="r.condition" aria-label="Condition" :class="cell('')" @change="setCondition(r, $event.target.value)"><option v-for="c in REFERRAL_CONDITIONS" :key="c.value" :value="c.value">{{ c.label }}</option></select></td>
                <td class="px-3 py-2 min-w-[16rem]">
                  <div v-if="condType(r.condition) === 'classes'" class="flex flex-wrap gap-1">
                    <button v-for="c in COMMODITY_CLASSES" :key="c" type="button" :aria-pressed="r.value.includes(c)" :class="['px-2 py-0.5 text-xs rounded-full border', r.value.includes(c) ? 'border-primary bg-primary/10 text-primary' : 'border-line text-ink-muted']" @click="toggleClass(r, c)">{{ c.toLowerCase() }}</button>
                  </div>
                  <input v-else-if="condType(r.condition) === 'ports'" :value="listText(r.value)" aria-label="Ports (UN/LOCODE, comma separated)" placeholder="SOBBO, ERMSW" :class="cell('')" @change="fromListText(r, $event.target.value)" />
                  <select v-else-if="condType(r.condition) === 'screening'" v-model="r.value" aria-label="Screening result" :class="cell('')"><option value="POTENTIAL">Potential</option><option value="CONFIRMED">Confirmed</option></select>
                  <input v-else v-model="r.value" inputmode="numeric" aria-label="Value" :class="cell('', 'tabular-nums text-right')" />
                </td>
                <td class="px-3 py-2"><input v-model="r.active" type="checkbox" aria-label="Active" class="mt-2.5 accent-[rgb(var(--primary))]" /></td>
                <td class="px-3 py-2 text-right"><button type="button" class="mt-2 text-sm font-medium text-error hover:underline" @click="draft.splice(i, 1)">Remove</button></td>
              </tr>
            </tbody>
          </table>
          <div class="p-3 border-t border-line"><Button variant="outline" size="sm" @click="addRule">Add rule</Button></div>
        </div>

        <!-- Accumulation -->
        <div v-else-if="tab === 'accumulation'" class="grid gap-4 p-4 max-w-xl sm:grid-cols-2">
          <label class="flex flex-col gap-1 text-sm font-medium text-ink">Soft limit (ETB) per vessel and voyage<input v-model="draft.softLimit" inputmode="numeric" :class="cell('softLimit', 'text-right tabular-nums')" /><span v-if="errors.softLimit" class="text-xs text-error">{{ errors.softLimit }}</span><span class="text-xs text-ink-subtle">Over this, quotes refer.</span></label>
          <label class="flex flex-col gap-1 text-sm font-medium text-ink">Hard limit (ETB)<input v-model="draft.hardLimit" inputmode="numeric" :class="cell('hardLimit', 'text-right tabular-nums')" /><span v-if="errors.hardLimit" class="text-xs text-error">{{ errors.hardLimit }}</span><span class="text-xs text-ink-subtle">Over this, only a senior underwriter can approve.</span></label>
        </div>

        <!-- Warranties -->
        <div v-else-if="tab === 'warranties'" class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-surface-muted"><tr class="text-xs font-semibold text-left uppercase text-ink-subtle"><th class="px-3 py-2">Name</th><th class="px-3 py-2">Condition</th><th class="px-3 py-2">Value</th><th class="px-3 py-2">Action</th><th class="px-3 py-2">Load %</th><th class="px-3 py-2">Active</th><th class="px-3 py-2"></th></tr></thead>
            <tbody>
              <tr v-for="(w, i) in draft" :key="w.id" class="border-t border-line">
                <td class="px-3 py-2"><input v-model="w.name" aria-label="Warranty name" :class="cell('')" /></td>
                <td class="px-3 py-2"><select v-model="w.condition" aria-label="Condition" :class="cell('')"><option v-for="c in WARRANTY_CONDITIONS" :key="c.value" :value="c.value">{{ c.label }}</option></select></td>
                <td class="px-3 py-2"><input v-model="w.value" :disabled="w.condition === 'CLASS_REQUIRED'" aria-label="Value" :class="cell('', 'w-20 tabular-nums text-right')" /></td>
                <td class="px-3 py-2"><select v-model="w.action" aria-label="Action" :class="cell('')"><option value="REFER">Refer</option><option value="LOAD">Load %</option></select></td>
                <td class="px-3 py-2"><input v-model="w.loadPct" :disabled="w.action !== 'LOAD'" aria-label="Load %" :class="cell('', 'w-20 tabular-nums text-right')" /></td>
                <td class="px-3 py-2"><input v-model="w.active" type="checkbox" aria-label="Active" class="accent-[rgb(var(--primary))]" /></td>
                <td class="px-3 py-2 text-right"><button type="button" class="text-sm font-medium text-error hover:underline" @click="draft.splice(i, 1)">Remove</button></td>
              </tr>
            </tbody>
          </table>
          <div class="p-3 border-t border-line"><Button variant="outline" size="sm" @click="addWarranty">Add warranty</Button></div>
        </div>

        <!-- Authority -->
        <table v-else-if="tab === 'authority'" class="w-full text-sm">
          <thead class="bg-surface-muted"><tr class="text-xs font-semibold text-left uppercase text-ink-subtle"><th class="px-3 py-2">Role</th><th class="px-3 py-2 text-right">Max sum insured (ETB)</th><th class="px-3 py-2">Can override rate</th><th class="px-3 py-2">Can waive warranty</th></tr></thead>
          <tbody>
            <tr v-for="a in draft" :key="a.role" class="border-t border-line">
              <td class="px-3 py-2 font-medium text-ink">{{ ROLE_LABELS[a.role] }}</td>
              <td class="px-3 py-2"><input v-model="a.maxSumInsured" inputmode="numeric" :aria-label="`${ROLE_LABELS[a.role]} max sum insured`" :class="cell('', 'text-right tabular-nums max-w-[14rem] ml-auto')" /></td>
              <td class="px-3 py-2"><input v-model="a.canOverrideRate" type="checkbox" :aria-label="`${ROLE_LABELS[a.role]} can override rate`" class="accent-[rgb(var(--primary))]" /></td>
              <td class="px-3 py-2"><input v-model="a.canWaiveWarranty" type="checkbox" :aria-label="`${ROLE_LABELS[a.role]} can waive warranty`" class="accent-[rgb(var(--primary))]" /></td>
            </tr>
          </tbody>
        </table>

        <!-- Inland -->
        <div v-else-if="tab === 'inland'" class="grid gap-4 p-4 max-w-xl sm:grid-cols-2">
          <label class="flex flex-col gap-1 text-sm font-medium text-ink">Per-vehicle limit (ETB)<input v-model="draft.perVehicle" inputmode="numeric" :class="cell('perVehicle', 'text-right tabular-nums')" /><span v-if="errors.perVehicle" class="text-xs text-error">{{ errors.perVehicle }}</span></label>
          <label class="flex flex-col gap-1 text-sm font-medium text-ink">Per-convoy limit (ETB)<input v-model="draft.perConvoy" inputmode="numeric" :class="cell('perConvoy', 'text-right tabular-nums')" /><span v-if="errors.perConvoy" class="text-xs text-error">{{ errors.perConvoy }}</span></label>
        </div>

        <!-- Deadlines -->
        <table v-else-if="tab === 'deadlines'" class="w-full text-sm">
          <thead class="bg-surface-muted"><tr class="text-xs font-semibold text-left uppercase text-ink-subtle"><th class="px-3 py-2">Kind</th><th class="px-3 py-2">Base date</th><th class="px-3 py-2 text-right">Days</th><th class="px-3 py-2">Alerts (days before)</th></tr></thead>
          <tbody>
            <tr v-for="(d, i) in draft" :key="d.kind" class="border-t border-line">
              <td class="px-3 py-2 font-medium text-ink">{{ DEADLINE_KINDS[d.kind] }}</td>
              <td class="px-3 py-2"><select v-model="d.base" aria-label="Base date" :class="cell('')"><option v-for="(l, k) in DEADLINE_BASES" :key="k" :value="k">{{ l }}</option></select></td>
              <td class="px-3 py-2"><input v-model.number="d.days" type="number" min="1" aria-label="Days" :class="cell(`${i}.days`, 'text-right tabular-nums w-24 ml-auto')" /></td>
              <td class="px-3 py-2"><input :value="d.alerts.join(', ')" aria-label="Alert windows" :class="cell('')" @change="d.alerts = $event.target.value.split(',').map((x) => Number(x.trim())).filter((x) => x > 0)" /></td>
            </tr>
          </tbody>
        </table>

        <ul v-if="Object.keys(errors).filter((k) => k !== 'note').length" role="alert" class="px-4 py-2 text-sm border-t border-line bg-error-soft text-error-strong">
          <li v-for="(m, k) in errors" v-show="k !== 'note'" :key="k">{{ m }}</li>
        </ul>
        <footer class="flex flex-wrap gap-3 items-end p-4 border-t border-line bg-surface-muted">
          <label class="flex flex-col flex-1 gap-1 min-w-[16rem] text-sm font-medium text-ink">
            Change note (required)
            <input v-model="note" placeholder="What changed and why" :class="[inputClass, inputBorder(errors.note)]" />
            <span v-if="errors.note" class="text-xs text-error">{{ errors.note }}</span>
          </label>
          <Button :disabled="!dirty" :pending="saving" @click="save">Save {{ TABS.find((t) => t.key === tab).label.toLowerCase() }}</Button>
        </footer>
      </section>
      <ul v-if="recent.length" class="mt-3 space-y-0.5 text-xs text-ink-muted">
        <li v-for="(c, i) in recent" :key="i">{{ formatDateTime(c.at) }} · {{ c.by }}: {{ c.note }}</li>
      </ul>
    </template>
  </div>
</template>
