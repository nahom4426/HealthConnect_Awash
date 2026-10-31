<script setup>
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { openModal } from "@customizer/modal-x";
import Button from "@/components/Button.vue";
import TabGroup from "@/components/TabGroup.vue";
import ListTable from "@/components/ListTable.vue";
import { formatCurrency, toasted } from "@/utils/utils";
import PageHeader from "@/components/PageHeader.vue";
import StatusBadge from "@/components/StatusBadge.vue";
import RateTableEditor from "../../components/RateTableEditor.vue";
import { useLifeResource } from "../../composables/useLifeResource";
import { confirmAction } from "../../composables/confirmAction";
import { RecordStatus, TreatyStatus } from "../../constants/statuses";
import { coverageLabel, formatDate, insuranceTypeLabel, treatyTypeLabel } from "../../constants/labels";
import { fclGroupSpec, memberSpec, overlappingRanges } from "../../reinsurance/treatyRules";
import {
  createFclMedicalUnderwritingRange, createFclUnderwritingRangeMedicalRequirement, createTreatyMember,
  deleteFclGroup, deleteFclMedicalUnderwritingRange, deleteFclUnderwritingRangeMedicalRequirement,
  deleteReinsuranceTreaty, deleteTreatyMember, getFclGroups, getFclMedicalParameters, getFclMedicalUnderwritingRanges,
  getFclUnderwritingRangeMedicalRequirements, getReinsuranceTreaty, getReinsurers, getTreatyMembers,
  updateFclGroup, updateFclMedicalUnderwritingRange, updateFclMedicalUnderwritingRangeStatus,
  updateReinsuranceTreatyStatus, updateTreatyMember,
} from "../../api/reinsuranceApi";

const route = useRoute();
const router = useRouter();
const treatyUuid = computed(() => route.params.treatyUuid);
const STATUSES = Object.values(TreatyStatus);

// The list endpoints filter by one status; a treaty's members, bands and ranges are few, so load all three
async function allStatuses(fn) {
  const results = await Promise.all(STATUSES.map((status) => fn({ status })));
  const failed = results.find((r) => !r?.success);
  return failed || { success: true, data: results.flatMap((r) => r.data || []) };
}

const treaty = useLifeResource(getReinsuranceTreaty);
const members = useLifeResource(() => allStatuses((p) => getTreatyMembers(treatyUuid.value, p)), { initial: [] });
const fcl = useLifeResource(() => allStatuses((p) => getFclGroups(treatyUuid.value, p)), { initial: [] });
const ranges = useLifeResource(async () => {
  const res = await allStatuses((p) => getFclMedicalUnderwritingRanges(treatyUuid.value, p));
  if (!res.success) return res;
  // Required tests per range (active and pending requirements)
  const withTests = await Promise.all(res.data.map(async (r) => {
    const req = await allStatuses((p) => getFclUnderwritingRangeMedicalRequirements(r.fclMedicalUnderwritingRangeUuid, p));
    return { ...r, requirements: (req.data || []).filter((q) => q.status !== TreatyStatus.REVISED) };
  }));
  return { success: true, data: withTests };
}, { initial: [] });
const reinsurers = useLifeResource(() => getReinsurers({ status: RecordStatus.ACTIVE, page: 1, limit: 200 }), { initial: [], map: (d) => d || [] });
const tests = useLifeResource(() => getFclMedicalParameters({ status: TreatyStatus.ACTIVE, page: 1, limit: 200 }), { initial: [], map: (d) => d || [] });

function loadAll() {
  treaty.load(treatyUuid.value);
  members.load(); fcl.load(); ranges.load(); reinsurers.load(); tests.load();
}
watch(treatyUuid, (id) => id && loadAll(), { immediate: true });

const t = computed(() => treaty.data.value);
const editable = computed(() => t.value && t.value.status !== TreatyStatus.REVISED);
const tab = ref("Members");
const money = (v) => (v === null || v === undefined ? "—" : formatCurrency(v));

// Reinsurers already on the treaty stay selectable even if no longer active
const membersSpec = computed(() => {
  const list = [...reinsurers.data.value];
  for (const m of members.data.value) if (!list.some((r) => r.reinsurerUuid === m.reinsurerUuid)) list.push({ reinsurerUuid: m.reinsurerUuid, name: m.reinsurerName || m.reinsurerUuid });
  return memberSpec(list);
});

// ── Treaty actions ──
function editTerms() {
  openModal("LifeTreatyForm", { treaty: t.value }, (saved) => saved && treaty.load(treatyUuid.value));
}
function setStatus(status) {
  const activate = status === TreatyStatus.ACTIVE;
  confirmAction(
    activate
      ? { title: `Activate ${t.value.treatyCode}?`, message: "New policies are ceded under this treaty from its start date. Check members, free cover limits and medical ranges first.", confirmText: "Activate" }
      : { title: `Mark ${t.value.treatyCode} as revised?`, message: "It stops applying to new policies and is kept for history. Policies already mapped keep it.", confirmText: "Mark revised" },
    async () => {
      const res = await updateReinsuranceTreatyStatus(treatyUuid.value, { status });
      if (res?.success) { toasted(true, activate ? "Treaty activated" : "Treaty marked revised"); treaty.load(treatyUuid.value); }
    }
  );
}
function removeTreaty() {
  confirmAction({ title: `Delete ${t.value.treatyCode}?`, message: "The treaty, its members, free cover limits and medical ranges are deleted. This can't be undone.", confirmText: "Delete treaty", tone: "danger" }, async () => {
    const res = await deleteReinsuranceTreaty(treatyUuid.value);
    if (res?.success) { toasted(true, "Treaty deleted"); router.push("/life/reinsurance/treaties"); }
  });
}

// ── Members: new rows are created one by one, existing rows go in one bulk update ──
const savingMembers = ref(false);
async function saveMembers(rows) {
  savingMembers.value = true;
  const created = rows.filter((r) => !r.treatyMemberUuid);
  const existing = rows.filter((r) => r.treatyMemberUuid);
  let ok = true;
  if (existing.length) ok = (await updateTreatyMember(treatyUuid.value, existing))?.success;
  for (const m of created) {
    if (!ok) break;
    ok = (await createTreatyMember({ ...m, reinsuranceTreatyUuid: treatyUuid.value }))?.success;
  }
  savingMembers.value = false;
  if (ok) toasted(true, "Members saved");
  members.load();
}
function removeMember(row) {
  confirmAction({ title: "Remove this member?", message: "The reinsurer is taken off the treaty.", confirmText: "Remove", tone: "danger" }, async () => {
    const res = await deleteTreatyMember(row.treatyMemberUuid);
    if (res?.success) { toasted(true, "Member removed"); members.load(); }
  });
}

// ── Group FCL: one bulk update with the full list (FclGroupRequest has no treaty field to create rows separately) ──
const savingFcl = ref(false);
async function saveFcl(rows) {
  savingFcl.value = true;
  const res = await updateFclGroup(treatyUuid.value, rows);
  savingFcl.value = false;
  if (res?.success) toasted(true, "Free cover limits saved");
  fcl.load();
}
function removeFcl(row) {
  confirmAction({ title: "Delete this band?", message: "The free cover limit for this group size is removed.", confirmText: "Delete", tone: "danger" }, async () => {
    const res = await deleteFclGroup(row.fclGroupUuid);
    if (res?.success) { toasted(true, "Band deleted"); fcl.load(); }
  });
}

// ── Medical ranges ──
const RANGE_COLUMNS = [
  { key: "insuranceType", label: "Applies to" },
  { key: "age", label: "Age" },
  { key: "sumAssured", label: "Sum assured", align: "right", class: "whitespace-nowrap" },
  { key: "tests", label: "Required tests" },
  { key: "status", label: "Status" },
  { key: "actions", label: "Actions", align: "right", srOnly: true },
];
const testLabel = (q) => q.label || tests.data.value.find((x) => x.fclMedicalParameterUuid === q.fclMedicalPararameterUuid)?.label || "?";
const overlaps = computed(() => overlappingRanges(ranges.data.value.filter((r) => r.status !== TreatyStatus.REVISED)));

function rangeBody(r, values = r) {
  return {
    fclMedicalUnderwritingRanges: {
      fclMedicalUnderwritingRangeUuid: r.fclMedicalUnderwritingRangeUuid,
      lowerLimit: values.lowerLimit, upperLimit: values.upperLimit, minAge: values.minAge, maxAge: values.maxAge, status: r.status,
    },
    fclMedicalParameters: r.requirements.map((q) => q.fclMedicalPararameterUuid),
  };
}

function addRange() {
  openModal("LifeRangeForm", { tests: tests.data.value }, async (res) => {
    if (!res) return;
    const created = await createFclMedicalUnderwritingRange({ reinsuranceTreatyUuid: treatyUuid.value, ...res.values });
    const rangeUuid = created?.data?.fclMedicalUnderwritingRangeUuid;
    if (!created?.success || !rangeUuid) return ranges.load();
    for (const paramUuid of res.testUuids) {
      await createFclUnderwritingRangeMedicalRequirement({ fclMedicalUnderwritingRangeUuid: rangeUuid, fclMedicalPararameterUuid: paramUuid });
    }
    toasted(true, "Medical range added");
    ranges.load();
  });
}

function editRange(range) {
  const selected = range.requirements.map((q) => q.fclMedicalPararameterUuid);
  openModal("LifeRangeForm", { range, tests: tests.data.value, selected }, async (res) => {
    if (!res) return;
    // Bands: bulk update with every range of the treaty, only this one changed (safe whether the
    // endpoint replaces or merges). Tests: added/removed one by one through the requirement endpoints.
    const all = ranges.data.value.map((r) => (r.fclMedicalUnderwritingRangeUuid === range.fclMedicalUnderwritingRangeUuid ? rangeBody(r, res.values) : rangeBody(r)));
    const upd = await updateFclMedicalUnderwritingRange(treatyUuid.value, all);
    if (upd?.success) {
      for (const paramUuid of res.testUuids.filter((u) => !selected.includes(u))) {
        await createFclUnderwritingRangeMedicalRequirement({ fclMedicalUnderwritingRangeUuid: range.fclMedicalUnderwritingRangeUuid, fclMedicalPararameterUuid: paramUuid });
      }
      for (const q of range.requirements.filter((q) => !res.testUuids.includes(q.fclMedicalPararameterUuid))) {
        await deleteFclUnderwritingRangeMedicalRequirement(q.fclUnderwritingRangeMedicalRequirementUuid);
      }
      toasted(true, "Medical range updated");
    }
    ranges.load();
  });
}

function setRangeStatus(range, status) {
  confirmAction({ title: status === TreatyStatus.ACTIVE ? "Activate this range?" : "Retire this range?", message: `Age ${range.minAge}–${range.maxAge}, ${money(range.lowerLimit)} – ${money(range.upperLimit)}.`, confirmText: status === TreatyStatus.ACTIVE ? "Activate" : "Retire" }, async () => {
    const res = await updateFclMedicalUnderwritingRangeStatus(range.fclMedicalUnderwritingRangeUuid, { status });
    if (res?.success) { toasted(true, "Range updated"); ranges.load(); }
  });
}
function removeRange(range) {
  confirmAction({ title: "Delete this medical range?", message: "Its test requirements are deleted with it.", confirmText: "Delete", tone: "danger" }, async () => {
    const res = await deleteFclMedicalUnderwritingRange(range.fclMedicalUnderwritingRangeUuid);
    if (res?.success) { toasted(true, "Range deleted"); ranges.load(); }
  });
}
</script>

<template>
  <div class="p-4 md:p-6">
    <div v-if="treaty.error.value && !treaty.loading.value" class="flex flex-col gap-3 items-center px-6 py-16 text-center rounded-2xl border bg-surface border-line">
      <p class="text-sm font-semibold text-ink">Couldn't load this treaty</p>
      <p class="max-w-md text-sm text-ink-muted">{{ treaty.error.value }}</p>
      <div class="flex gap-2">
        <Button variant="outline" size="sm" @click="loadAll">Try again</Button>
        <Button variant="ghost" size="sm" @click="router.push('/life/reinsurance/treaties')">Back to treaties</Button>
      </div>
    </div>

    <template v-else>
      <PageHeader :title="t?.treatyCode || (treaty.loading.value ? 'Loading treaty…' : 'Treaty')" :subtitle="t?.treatyDescription" back="/life/reinsurance/treaties">
        <template #badge><StatusBadge v-if="t" :status="t.status" /></template>
        <template v-if="t" #actions>
          <Button v-if="editable" variant="outline" @click="editTerms">Edit terms</Button>
          <template v-if="t.status === 'PENDING'">
            <Button variant="destructive" @click="removeTreaty">Delete</Button>
            <Button @click="setStatus('ACTIVE')">Activate</Button>
          </template>
          <Button v-else-if="t.status === 'ACTIVE'" variant="outline" @click="setStatus('REVISED')">Mark revised</Button>
        </template>
      </PageHeader>

      <dl v-if="t" class="grid grid-cols-2 gap-3 mb-5 md:grid-cols-3 xl:grid-cols-6">
        <div v-for="[label, value] in [
          ['Type', `${treatyTypeLabel[t.treatyType] || t.treatyType}`],
          ['Covers', coverageLabel[t.reinsuranceCoverage] || t.reinsuranceCoverage],
          ['Retention per life', money(t.retationLimit)],
          ['Rider retention', money(t.riderRetentionLimit)],
          ['Policy cession', `${t.policyCession ?? '—'} %`],
          ['Period', `${formatDate(t.beginDate)} – ${formatDate(t.endDate)}`],
        ]" :key="label" class="px-4 py-3 rounded-2xl border bg-surface border-line">
          <dt class="text-xs text-ink-subtle">{{ label }}</dt>
          <dd class="mt-1 text-sm font-semibold tabular-nums text-ink">{{ value }}</dd>
        </div>
      </dl>

      <p v-if="t && !editable" class="px-4 py-3 mb-4 text-sm rounded-xl bg-surface-muted text-ink-muted">This treaty has been revised and is kept for reference; it can't be changed.</p>

      <TabGroup v-model="tab" :tabs="['Members', 'Group free cover', 'Medical ranges']" class="mb-4" />

      <RateTableEditor
        v-if="tab === 'Members'"
        :spec="membersSpec"
        :rows="members.data.value"
        :loading="members.loading.value"
        :load-error="members.error.value"
        :saving="savingMembers"
        :readonly="!editable"
        :default-status="TreatyStatus.ACTIVE"
        keep-order
        send-all
        empty-hint="Add a row for each reinsurer taking a share."
        @retry="members.load()"
        @save="saveMembers"
        @remove="removeMember"
      />

      <RateTableEditor
        v-else-if="tab === 'Group free cover'"
        :spec="fclGroupSpec"
        :rows="fcl.data.value"
        :loading="fcl.loading.value"
        :load-error="fcl.error.value"
        :saving="savingFcl"
        :readonly="!editable"
        :default-status="TreatyStatus.ACTIVE"
        send-all
        empty-hint="Add a band for each group size."
        @retry="fcl.load()"
        @save="saveFcl"
        @remove="removeFcl"
      />

      <ListTable
        v-else
        :columns="RANGE_COLUMNS"
        :rows="ranges.data.value"
        row-key="fclMedicalUnderwritingRangeUuid"
        :loading="ranges.loading.value"
        :error="ranges.error.value"
        error-title="Couldn't load medical ranges"
        empty-title="No medical ranges"
        empty-hint="Add one for each band where the reinsurer requires evidence."
        :skeleton-rows="3"
        @retry="ranges.load()"
      >
        <template #toolbar>
          <div class="flex flex-wrap gap-3 justify-between items-center px-4 py-3 border-b border-line">
            <p class="text-sm text-ink-muted">Tests the reinsurer requires for lives in each age and sum-assured band.</p>
            <Button v-if="editable" size="sm" variant="outline" @click="addRange">Add range</Button>
          </div>
          <div v-if="overlaps.length" class="px-4 py-2.5 text-sm border-b bg-warning-soft border-line text-warning-strong">
            <p v-for="([a, b], i) in overlaps" :key="i">{{ insuranceTypeLabel[a.insuranceType] }} ranges age {{ a.minAge }}–{{ a.maxAge }} and {{ b.minAge }}–{{ b.maxAge }} overlap in sum assured; a life could fall in both.</p>
          </div>
        </template>
        <template #cell-insuranceType="{ row }"><span class="text-ink">{{ insuranceTypeLabel[row.insuranceType] || row.insuranceType }}</span></template>
        <template #cell-age="{ row }"><span class="tabular-nums text-ink">{{ row.minAge }}–{{ row.maxAge }}</span></template>
        <template #cell-sumAssured="{ row }"><span class="tabular-nums text-ink">{{ money(row.lowerLimit) }} – {{ money(row.upperLimit) }}</span></template>
        <template #cell-tests="{ row }">
          <span v-if="!row.requirements.length" class="text-ink-subtle">None</span>
          <span v-for="q in row.requirements" :key="q.fclUnderwritingRangeMedicalRequirementUuid" class="inline-block px-1.5 py-0.5 mr-1 mb-1 font-mono text-xs rounded bg-surface-raised text-ink" :title="q.testDescription">{{ testLabel(q) }}</span>
        </template>
        <template #cell-status="{ row }"><StatusBadge :status="row.status" /></template>
        <template #cell-actions="{ row }">
          <div v-if="editable" class="flex gap-1 justify-end">
            <Button variant="ghost" size="sm" @click="editRange(row)">Edit</Button>
            <Button v-if="row.status !== 'ACTIVE'" variant="ghost" size="sm" @click="setRangeStatus(row, 'ACTIVE')">Activate</Button>
            <Button v-else variant="ghost" size="sm" @click="setRangeStatus(row, 'REVISED')">Retire</Button>
            <Button variant="ghost" size="sm" class="!text-error" @click="removeRange(row)">Delete</Button>
          </div>
        </template>
      </ListTable>
    </template>
  </div>
</template>
