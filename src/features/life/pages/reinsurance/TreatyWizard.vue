<script setup>
// New treaty in one go: POST /reinsurance/treaty/all with TreatyRequest
// { treaty, members, groupFcl, groupMedicalUnderwritingRanges }.
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { openModal } from "@customizer/modal-x";
import Button from "@/components/Button.vue";
import { formatCurrency, toasted } from "@/utils/utils";
import LifePageHeader from "../../components/LifePageHeader.vue";
import RateTableEditor from "../../components/RateTableEditor.vue";
import TreatyTermsFields from "../../components/TreatyTermsFields.vue";
import { useLifeResource } from "../../composables/useLifeResource";
import { confirmAction } from "../../composables/confirmAction";
import { RecordStatus, TreatyStatus } from "../../constants/statuses";
import { coverageLabel, formatDate, toDateTime, treatyTypeLabel } from "../../constants/labels";
import { fclGroupCreateSpec, memberSpec, overlappingRanges, validateTreaty } from "../../reinsurance/treatyRules";
import { createReinsuranceAllTreaty, getFclMedicalParameters, getReinsurers } from "../../api/reinsuranceApi";

const router = useRouter();
// Stable empty lists: a new [] each render would make the editors reset what was typed
const NO_ROWS = Object.freeze([]);
const STEPS = ["Terms", "Members", "Group free cover", "Medical ranges", "Review"];
const step = ref(0);

const terms = reactive({ treatyCode: "", treatyType: "", reinsuranceCoverage: "", retationLimit: "", riderRetentionLimit: "", policyCession: "", beginDate: "", endDate: "", treatyDescription: "" });
const termErrors = ref({});

const reinsurers = useLifeResource(() => getReinsurers({ status: RecordStatus.ACTIVE, page: 1, limit: 200 }), { initial: [], map: (d) => d || [] });
const tests = useLifeResource(() => getFclMedicalParameters({ status: TreatyStatus.ACTIVE, page: 1, limit: 200 }), { initial: [], map: (d) => d || [] });
onMounted(() => { reinsurers.load(); tests.load(); });

const membersSpec = computed(() => memberSpec(reinsurers.data.value, { withStatus: false }));
const membersEditor = ref(null);
const fclEditor = ref(null);
const members = ref([]);
const fcl = ref([]);
const ranges = ref([]); // { values, testUuids }
const stepError = ref("");

const testLabel = (uuid) => tests.data.value.find((t) => t.fclMedicalParameterUuid === uuid)?.label || "?";
const reinsurerName = (uuid) => reinsurers.data.value.find((r) => r.reinsurerUuid === uuid)?.name || uuid;
const rangeOverlaps = computed(() => overlappingRanges(ranges.value.map((r) => ({ ...r.values, insuranceType: "Group" }))));

function next() {
  stepError.value = "";
  if (step.value === 0) {
    termErrors.value = validateTreaty(terms);
    if (Object.keys(termErrors.value).length) return;
  }
  if (step.value === 1) {
    const { valid, rows } = membersEditor.value.collect();
    if (!valid) return;
    if (!rows.length) { stepError.value = "Add at least one reinsurer."; return; }
    members.value = rows;
  }
  if (step.value === 2) {
    const { valid, rows } = fclEditor.value.collect();
    if (!valid) return;
    fcl.value = rows;
  }
  if (step.value === 3 && rangeOverlaps.value.length) {
    stepError.value = "Two medical ranges overlap on both age and sum assured. Adjust them so each life falls in one range.";
    return;
  }
  step.value++;
}

function addRange(existing, index) {
  openModal("LifeRangeForm", { range: existing?.values, selected: existing?.testUuids, tests: tests.data.value, allowType: false }, (res) => {
    if (!res) return;
    if (index === undefined) ranges.value.push(res);
    else ranges.value.splice(index, 1, res);
  });
}

const submitting = ref(false);
function submit() {
  confirmAction(
    { title: "Create this treaty?", message: "It is saved as a whole — terms, members, free cover limits and medical ranges. You can still edit it before activating.", confirmText: "Create treaty" },
    async () => {
      submitting.value = true;
      const res = await createReinsuranceAllTreaty({
        treaty: {
          ...terms,
          treatyCode: terms.treatyCode.trim(),
          retationLimit: Number(terms.retationLimit), riderRetentionLimit: Number(terms.riderRetentionLimit), policyCession: Number(terms.policyCession),
          beginDate: toDateTime(terms.beginDate), endDate: toDateTime(terms.endDate),
        },
        members: members.value,
        groupFcl: fcl.value,
        groupMedicalUnderwritingRanges: ranges.value.map((r) => ({
          fclMedicalUnderwritingRanges: { lowerLimit: r.values.lowerLimit, upperLimit: r.values.upperLimit, minAge: r.values.minAge, maxAge: r.values.maxAge },
          fclMedicalParameters: r.testUuids,
        })),
      });
      submitting.value = false;
      if (res?.success) {
        toasted(true, "Treaty created");
        const id = res.data?.reinsuranceTreatyUuid;
        router.push(id ? `/life/reinsurance/treaties/${id}` : "/life/reinsurance/treaties");
      }
    }
  );
}

const money = (v) => (v === null || v === undefined || v === "" ? "—" : formatCurrency(v));
</script>

<template>
  <div class="p-4 md:p-6">
    <LifePageHeader title="New reinsurance treaty" subtitle="Set the terms, the reinsurers and their shares, the group free cover limits and the medical evidence required above them." back="/life/reinsurance/treaties" />

    <ol class="flex flex-wrap gap-2 mb-5" aria-label="Steps">
      <li v-for="(s, i) in STEPS" :key="s">
        <button
          type="button"
          :disabled="i > step"
          :aria-current="i === step ? 'step' : undefined"
          :class="['flex gap-2 items-center px-3 h-9 text-sm rounded-full border', i === step ? 'border-primary bg-primary text-white' : i < step ? 'border-primary/30 bg-primary/10 text-primary' : 'border-line text-ink-subtle']"
          @click="i < step && (step = i)"
        >
          <span class="grid place-items-center w-5 h-5 text-xs font-semibold rounded-full" :class="i === step ? 'bg-white/20' : 'bg-surface'">{{ i + 1 }}</span>
          {{ s }}
        </button>
      </li>
    </ol>

    <section class="p-5 rounded-2xl border bg-surface border-line shadow-card">
      <!-- 1 · Terms -->
      <TreatyTermsFields v-show="step === 0" :form="terms" :errors="termErrors" />

      <!-- 2 · Members -->
      <div v-show="step === 1">
        <p class="mb-3 text-sm text-ink-muted">Reinsurers taking part and the share of the ceded risk each one takes. Only active reinsurers can be picked.</p>
        <p v-if="!reinsurers.loading.value && !reinsurers.data.value.length" class="px-4 py-3 mb-3 text-sm rounded-xl bg-warning-soft text-warning-strong">
          No active reinsurers yet. <RouterLink to="/life/reinsurance/reinsurers" class="font-semibold underline">Add one first</RouterLink>.
        </p>
        <RateTableEditor ref="membersEditor" :spec="membersSpec" :rows="NO_ROWS" keep-order collect-only empty-hint="Add a row for each reinsurer." />
      </div>

      <!-- 3 · Group FCL -->
      <div v-show="step === 2">
        <p class="mb-3 text-sm text-ink-muted">For group schemes, the sum assured each member gets without medical evidence, by group size. Optional — leave empty if the treaty has none.</p>
        <RateTableEditor ref="fclEditor" :spec="fclGroupCreateSpec" :rows="NO_ROWS" collect-only empty-hint="Add a band for each group size." />
      </div>

      <!-- 4 · Medical ranges -->
      <div v-show="step === 3">
        <div class="flex flex-wrap gap-3 justify-between items-start mb-3">
          <p class="max-w-2xl text-sm text-ink-muted">Group lives above the free cover limit: for each age and sum-assured band, the tests the reinsurer requires. Individual-policy ranges can be added on the treaty afterwards.</p>
          <Button variant="outline" size="sm" @click="addRange()">Add range</Button>
        </div>
        <p v-if="!ranges.length" class="py-8 text-sm text-center text-ink-muted">No medical ranges. Optional — add them if the reinsurer requires evidence.</p>
        <ul v-else class="grid gap-2">
          <li v-for="(r, i) in ranges" :key="i" class="flex flex-wrap gap-3 justify-between items-center px-4 py-3 rounded-xl border border-line">
            <div class="text-sm">
              <p class="font-semibold text-ink">Age {{ r.values.minAge }}–{{ r.values.maxAge }} · {{ money(r.values.lowerLimit) }} – {{ money(r.values.upperLimit) }}</p>
              <p class="flex flex-wrap gap-1 mt-1"><span v-for="t in r.testUuids" :key="t" class="px-1.5 py-0.5 font-mono text-xs rounded bg-surface-raised text-ink">{{ testLabel(t) }}</span></p>
            </div>
            <div class="flex gap-1">
              <Button variant="ghost" size="sm" @click="addRange(r, i)">Edit</Button>
              <Button variant="ghost" size="sm" class="!text-error" @click="ranges.splice(i, 1)">Remove</Button>
            </div>
          </li>
        </ul>
      </div>

      <!-- 5 · Review -->
      <div v-if="step === 4" class="grid gap-5 text-sm">
        <div>
          <h2 class="mb-2 text-sm font-semibold text-ink">Terms</h2>
          <dl class="grid grid-cols-2 gap-x-6 gap-y-2 md:grid-cols-4">
            <div><dt class="text-xs text-ink-subtle">Code</dt><dd class="text-ink">{{ terms.treatyCode }}</dd></div>
            <div><dt class="text-xs text-ink-subtle">Type</dt><dd class="text-ink">{{ treatyTypeLabel[terms.treatyType] }} · {{ coverageLabel[terms.reinsuranceCoverage] }}</dd></div>
            <div><dt class="text-xs text-ink-subtle">Retention / rider retention</dt><dd class="tabular-nums text-ink">{{ money(terms.retationLimit) }} / {{ money(terms.riderRetentionLimit) }}</dd></div>
            <div><dt class="text-xs text-ink-subtle">Cession · period</dt><dd class="text-ink">{{ terms.policyCession }} % · {{ formatDate(terms.beginDate) }} – {{ formatDate(terms.endDate) }}</dd></div>
          </dl>
        </div>
        <div>
          <h2 class="mb-2 text-sm font-semibold text-ink">Members ({{ members.length }})</h2>
          <ul class="grid gap-1"><li v-for="m in members" :key="m.reinsurerUuid" class="text-ink">{{ reinsurerName(m.reinsurerUuid) }} — {{ m.participationType }}, {{ m.share }} % share, {{ m.reinsurnaceCommission }} % commission, {{ m.profitCommission }} % profit commission</li></ul>
        </div>
        <div>
          <h2 class="mb-2 text-sm font-semibold text-ink">Group free cover ({{ fcl.length }})</h2>
          <p v-if="!fcl.length" class="text-ink-muted">None</p>
          <ul v-else class="grid gap-1"><li v-for="f in fcl" :key="`${f.minLives}-${f.maxLives}`" class="text-ink">{{ f.minLives }}–{{ f.maxLives }} lives: {{ money(f.mfcl) }} free cover, average sum assured × {{ f.averageSumassuredMultiplier }}</li></ul>
        </div>
        <div>
          <h2 class="mb-2 text-sm font-semibold text-ink">Medical ranges ({{ ranges.length }})</h2>
          <p v-if="!ranges.length" class="text-ink-muted">None</p>
          <ul v-else class="grid gap-1"><li v-for="(r, i) in ranges" :key="i" class="text-ink">Age {{ r.values.minAge }}–{{ r.values.maxAge }}, {{ money(r.values.lowerLimit) }} – {{ money(r.values.upperLimit) }}: {{ r.testUuids.map(testLabel).join(", ") }}</li></ul>
        </div>
      </div>

      <p v-if="stepError" role="alert" class="mt-4 text-sm text-error">{{ stepError }}</p>

      <div class="flex gap-2 justify-between items-center pt-4 mt-5 border-t border-line">
        <Button variant="ghost" :disabled="step === 0" @click="step--">Back</Button>
        <Button v-if="step < STEPS.length - 1" @click="next">Continue</Button>
        <Button v-else :pending="submitting" @click="submit">Create treaty</Button>
      </div>
    </section>
  </div>
</template>
