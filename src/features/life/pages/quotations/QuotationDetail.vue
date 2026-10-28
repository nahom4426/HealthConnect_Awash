<script setup>
// One group quotation: members, riders, reinsurance treaty and the status actions
// (issue → accept → pay → issue policy). Drafts show a checklist of what is left to do.
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { openModal } from "@customizer/modal-x";
import Button from "@/components/Button.vue";
import TabGroup from "@/components/TabGroup.vue";
import { toasted } from "@/utils/utils";
import LifePageHeader from "../../components/LifePageHeader.vue";
import LifeStatusBadge from "../../components/LifeStatusBadge.vue";
import LifePager from "../../components/LifePager.vue";
import RateTableEditor from "../../components/RateTableEditor.vue";
import { useLifeResource, fileForm } from "../../composables/useLifeResource";
import { useLifePagedList } from "../../composables/useLifePagedList";
import { confirmAction } from "../../composables/confirmAction";
import { TreatyStatus } from "../../constants/statuses";
import { formatAmount, formatDate, quotationStatusLabel } from "../../constants/labels";
import { insuredName, quotationActions, quotedRiderSpec, riderChanges } from "../../quotations/quotationRules";
import {
  acceptQuotation, createQuotedRider, deleteInsuredPerson, deleteQuotation, deleteQuotedRider, exportInsuredPersonSample, getInsuredPersonListReinsured,
  getInsuredPersons, getQuotation, getQuotedRiders, importInsuredPerson, issueQuotation, reviseQuotation, updateQuotedRider,
} from "../../api/quotationApi";
import { getRiders } from "../../api/productApi";
import { createPolicyTreatyMapping, deletePolicyTreatyMapping, getPolicyTreatyMappingList, getReinsuranceTreatys } from "../../api/reinsuranceApi";

const route = useRoute();
const router = useRouter();
let uuid = route.params.quotationUuid;

const quotation = useLifeResource(getQuotation);
const q = computed(() => quotation.data.value || {});
const can = computed(() => quotationActions(q.value));
const draft = computed(() => can.value.edit);

// ── members ──
const reinsuredOnly = ref(false);
const members = useLifePagedList((p) => (reinsuredOnly.value ? getInsuredPersonListReinsured(uuid, p) : getInsuredPersons(uuid, p)));
watch(reinsuredOnly, () => { members.page.value = 1; members.reload(); });
const hasMembers = ref(false);
watch(members.rows, (rows) => { if (!reinsuredOnly.value && !members.search.value) hasMembers.value = rows.length > 0; });
const importing = ref(false);

// ── riders ──
const quotedRiders = useLifeResource(() => getQuotedRiders({ quotationUuid: uuid }), { initial: [] });
const riderLibrary = useLifeResource(getRiders, { initial: [] });
const riderSpec = computed(() => quotedRiderSpec(riderLibrary.data.value || []));
const savingRiders = ref(false);

// ── reinsurance ──
const mappings = useLifeResource(() => getPolicyTreatyMappingList(uuid), { initial: [], map: (d) => (Array.isArray(d) ? d : d ? [d] : []) });
const treaties = useLifeResource(() => getReinsuranceTreatys({ status: TreatyStatus.ACTIVE, page: 1, limit: 100 }), { initial: [] });
const treatyToAdd = ref("");
const mapping = ref(false);
const unmappedTreaties = computed(() => (treaties.data.value || []).filter((t) => !mappings.data.value.some((m) => m.reinsuranceTreatyUuid === t.reinsuranceTreatyUuid)));

const TABS = ["Members", "Riders", "Reinsurance", "Details"];
const tab = ref("Members");
const loaded = new Set();
function loadTab(t) {
  if (loaded.has(t)) return;
  loaded.add(t);
  if (t === "Members") members.reload();
  if (t === "Riders") { quotedRiders.load(); riderLibrary.load(); }
  if (t === "Reinsurance") { mappings.load(); treaties.load(); }
}
watch(tab, loadTab);

function reloadAll() {
  loaded.clear();
  quotation.load(uuid);
  loadTab(tab.value);
  if (tab.value !== "Members") { loaded.add("Members"); members.reload(); }
}
reloadAll();
// A revision opens on this same route with a new id
watch(() => route.params.quotationUuid, (v) => {
  if (!v || v === uuid) return;
  uuid = v;
  hasMembers.value = false;
  tab.value = "Members";
  reloadAll();
});

// Draft checklist
const steps = computed(() => [
  { label: "Details", done: !!q.value.institutionUuid && !!q.value.term },
  { label: "Members", done: hasMembers.value, hint: "Add at least one member" },
  { label: "Riders", done: (quotedRiders.data.value || []).length > 0, optional: true },
  { label: "Reinsurance", done: (mappings.data.value || []).length > 0, optional: true },
]);

// ── actions ──
const editDetails = () => openModal("LifeQuotationForm", { quotation: q.value }, (saved) => saved && quotation.load(uuid));
const addMember = () => openModal("LifeInsuredForm", { quotation: q.value }, (saved) => saved && members.reload());
const editMember = (p) => openModal("LifeInsuredForm", { quotation: q.value, insured: p }, (saved) => saved && members.reload());

function removeMember(p) {
  confirmAction({ title: `Remove ${insuredName(p)}?`, message: "The member is taken off this quotation.", confirmText: "Remove", tone: "danger" }, async () => {
    const res = await deleteInsuredPerson(p.insuredUuid);
    if (res?.success) { toasted(true, "Member removed"); members.reload(); }
  });
}

const fileInput = ref(null);
async function onImport(e) {
  const file = e.target.files?.[0];
  e.target.value = "";
  if (!file) return;
  importing.value = true;
  const res = await importInsuredPerson(fileForm(file), { institutionUuid: q.value.institutionUuid, qutoationUuid: uuid });
  importing.value = false;
  if (res?.success) { toasted(true, res.data?.message || "Members imported"); members.page.value = 1; members.reload(); }
}
async function downloadTemplate() {
  const res = await exportInsuredPersonSample();
  if (!res?.success || !(res.data instanceof Blob)) return;
  const a = document.createElement("a");
  a.href = URL.createObjectURL(res.data);
  a.download = "life-insured-members-template.xlsx";
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

async function saveRiders(rows) {
  const { create, update } = riderChanges(rows, quotedRiders.data.value || [], uuid);
  savingRiders.value = true;
  const results = await Promise.all([create.length ? createQuotedRider(create) : null, update.length ? updateQuotedRider(update) : null]);
  savingRiders.value = false;
  if (results.every((r) => r === null || r?.success)) toasted(true, "Riders saved");
  quotedRiders.load();
}
function removeRider(row) {
  const name = riderLibrary.data.value.find((r) => r.riderUuid === row.riderUuid)?.riderName || "this rider";
  confirmAction({ title: `Remove ${name}?`, message: "It is taken off this quotation.", confirmText: "Remove", tone: "danger" }, async () => {
    const res = await deleteQuotedRider(row.quotedRiderUuid);
    if (res?.success) { toasted(true, "Rider removed"); quotedRiders.load(); }
  });
}

async function addMapping() {
  if (!treatyToAdd.value) return;
  mapping.value = true;
  const res = await createPolicyTreatyMapping({ quotationUuid: uuid, reinsuranceTreatyUuid: treatyToAdd.value, status: TreatyStatus.ACTIVE });
  mapping.value = false;
  if (res?.success) { toasted(true, "Treaty linked"); treatyToAdd.value = ""; mappings.load(); }
}
function removeMapping(m) {
  confirmAction({ title: `Unlink ${m.treatyCode || "treaty"}?`, message: "Cession for this quotation will no longer use this treaty.", confirmText: "Unlink", tone: "danger" }, async () => {
    const res = await deletePolicyTreatyMapping(m.policyTreatyMappingUuid);
    if (res?.success) { toasted(true, "Treaty unlinked"); mappings.load(); }
  });
}

function statusStep(fn, { title, message, confirmText, done }) {
  confirmAction({ title, message, confirmText }, async () => {
    const res = await fn(uuid);
    if (res?.success) { toasted(true, done); reloadAll(); }
  });
}
const issue = () => {
  if (!hasMembers.value) { toasted(false, "Add at least one member before issuing"); tab.value = "Members"; return; }
  statusStep(issueQuotation, { title: "Issue this quotation?", message: "Premiums are fixed and it is sent to the client. Members and riders can no longer be changed.", confirmText: "Issue", done: "Quotation issued" });
};
const accept = () => statusStep(acceptQuotation, { title: "Mark as accepted?", message: `Confirm that ${q.value.institutionName || "the client"} accepted the quotation. Finance can then record the payment.`, confirmText: "Mark accepted", done: "Quotation accepted" });
const pay = () => openModal("LifeQuotationPayment", { quotation: q.value }, (saved) => saved && reloadAll());
const issuePolicyNow = () => openModal("LifeIssuePolicy", { quotation: q.value }, (saved) => saved && reloadAll());
function revise() {
  confirmAction({ title: "Revise this quotation?", message: "A new draft version is created from it for the renewal or change. This one stays as it is.", confirmText: "Create revision" }, async () => {
    const res = await reviseQuotation(uuid);
    if (res?.success) {
      toasted(true, "Revision created");
      if (res.data?.quotationUuid && res.data.quotationUuid !== uuid) router.push(`/life/quotations/${res.data.quotationUuid}`);
      else reloadAll();
    }
  });
}
function remove() {
  confirmAction({ title: "Delete this draft?", message: "The quotation, its members and riders are removed. This can't be undone.", confirmText: "Delete", tone: "danger" }, async () => {
    const res = await deleteQuotation(uuid);
    if (res?.success) { toasted(true, "Draft deleted"); router.push("/life/quotations"); }
  });
}

const details = computed(() => [
  ["Institution", q.value.institutionName],
  ["Term", q.value.term ? `${q.value.term} year${q.value.term === 1 ? "" : "s"}` : null],
  ["Contact person", q.value.contactPersonFullName],
  ["Contact phone", q.value.contactPhone],
  ["Prepared by", q.value.quotedByFullName],
  ["Institution life insurance no.", q.value.institutionLifeInsuranceNumber],
  ["PO number", q.value.poNumber],
  ["PV number", q.value.pvNumber],
]);
const money = computed(() => [
  ["Requested premium", q.value.requestedPremium],
  ["Withholding tax", q.value.withHoldingTax],
  ["Revenue stamp", q.value.revenueStamp],
  ["Net premium", q.value.netPremium],
  ["Free cover limit", q.value.fclAmount],
  ["Average sum-assured multiplier", q.value.averageSumassuredMultiplier],
]);
const timeline = computed(() => [
  ["Created", q.value.createdAt ?? q.value.audit?.createdAt],
  ["Issued", q.value.issueDate],
  ["Accepted", q.value.acceptedDate],
  ["Paid", q.value.paidDate, q.value.paidByFullName],
  ["Policy issued", q.value.policyIssuedDate],
]);
</script>

<template>
  <div class="p-4 md:p-6">
    <div v-if="quotation.error.value && !quotation.loading.value && !quotation.data.value" class="flex flex-col gap-3 items-center px-6 py-16 text-center">
      <p class="text-sm font-semibold text-ink">Couldn't load this quotation</p>
      <p class="max-w-md text-sm text-ink-muted">{{ quotation.error.value }}</p>
      <div class="flex gap-2">
        <Button variant="outline" size="sm" @click="router.push('/life/quotations')">Back to quotations</Button>
        <Button size="sm" @click="quotation.load(uuid)">Try again</Button>
      </div>
    </div>

    <template v-else>
      <LifePageHeader
        :title="q.quotationNumber || (quotation.loading.value && !q.quotationUuid ? 'Loading…' : 'Draft quotation')"
        :subtitle="[q.institutionName, q.term ? `${q.term}-year group term life` : ''].filter(Boolean).join(' · ')"
        back="/life/quotations"
      >
        <template v-if="q.quotationStatus" #badge>
          <LifeStatusBadge :status="q.quotationStatus" />
          <LifeStatusBadge v-if="q.policyStatus && q.policyIssuedDate" :status="q.policyStatus" />
        </template>
        <template #actions>
          <Button v-if="can.remove" variant="ghost" class="!text-error" @click="remove">Delete draft</Button>
          <Button v-if="can.edit" variant="outline" @click="editDetails">Edit details</Button>
          <Button v-if="can.issue" @click="issue">Issue quotation</Button>
          <Button v-if="can.accept" @click="accept">Mark accepted</Button>
          <Button v-if="can.pay" @click="pay">Record payment</Button>
          <Button v-if="can.issuePolicy" @click="issuePolicyNow">Issue policy</Button>
          <Button v-if="can.revise" variant="outline" @click="revise">Revise</Button>
        </template>
      </LifePageHeader>

      <!-- Draft checklist -->
      <ol v-if="draft" class="flex flex-wrap gap-2 mb-5" aria-label="Before issuing">
        <li v-for="(s, i) in steps" :key="s.label">
          <button
            type="button"
            :class="['inline-flex gap-2 items-center py-1.5 pr-3 pl-1.5 text-xs font-medium rounded-full border', s.done ? 'border-success/40 bg-success-soft text-success-strong' : 'border-line bg-surface text-ink-muted hover:border-primary/50']"
            @click="s.label !== 'Details' ? (tab = s.label) : editDetails()"
          >
            <span :class="['grid place-items-center w-5 h-5 text-[11px] rounded-full', s.done ? 'bg-success text-white' : 'bg-surface-raised text-ink-subtle']">{{ s.done ? "✓" : i + 1 }}</span>
            {{ s.label }}<span v-if="s.optional && !s.done" class="text-ink-subtle">(optional)</span>
          </button>
        </li>
      </ol>
      <p v-else-if="q.quotationStatus" class="mb-5 text-xs text-ink-subtle">
        {{ quotationStatusLabel[q.quotationStatus] }} — {{ { ISSUED: "waiting for the client to accept.", ACCEPTED: "waiting for payment.", PAID: q.policyIssuedDate ? "the policy has been issued." : "ready to issue the policy." }[q.quotationStatus] }}
        Members and riders are read-only.
      </p>

      <TabGroup v-model="tab" :tabs="TABS" class="mb-4" />

      <!-- Members -->
      <section v-show="tab === 'Members'" class="overflow-hidden rounded-2xl border bg-surface border-line shadow-card">
        <div class="flex flex-wrap gap-3 justify-between items-center px-4 py-3 border-b border-line">
          <div class="flex flex-wrap gap-3 items-center">
            <input v-model="members.search.value" type="search" placeholder="Search members" aria-label="Search members" class="px-3 w-60 h-9 text-sm rounded-lg border outline-none bg-surface-muted border-line text-ink focus:border-primary focus:ring-2 focus:ring-primary/15" />
            <label class="inline-flex gap-2 items-center text-sm cursor-pointer text-ink-muted">
              <input v-model="reinsuredOnly" type="checkbox" class="w-4 h-4 rounded accent-primary" />
              Above retention only
            </label>
          </div>
          <div v-if="draft" class="flex flex-wrap gap-2">
            <input ref="fileInput" type="file" accept=".xlsx,.xls,.csv" class="hidden" @change="onImport" />
            <Button variant="ghost" size="sm" @click="downloadTemplate">Excel template</Button>
            <Button variant="outline" size="sm" :pending="importing" @click="fileInput?.click()">Import Excel</Button>
            <Button size="sm" @click="addMember">Add member</Button>
          </div>
        </div>
        <div v-if="members.error.value && !members.loading.value" class="flex flex-col gap-3 items-center px-6 py-12 text-center">
          <p class="text-sm font-semibold text-ink">Couldn't load members</p>
          <p class="max-w-md text-sm text-ink-muted">{{ members.error.value }}</p>
          <Button variant="outline" size="sm" @click="members.reload()">Try again</Button>
        </div>
        <div v-else class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-surface-muted">
              <tr class="text-xs font-semibold tracking-wide text-left uppercase text-ink-subtle">
                <th class="px-4 py-3">Member</th>
                <th class="px-4 py-3">Gender</th>
                <th class="px-4 py-3">Born</th>
                <th class="px-4 py-3 text-right">Sum assured</th>
                <th class="px-4 py-3 text-right">Rate</th>
                <th class="px-4 py-3 text-right">Premium</th>
                <th class="px-4 py-3">Riders</th>
                <th v-if="draft" class="px-4 py-3"><span class="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              <template v-if="members.loading.value">
                <tr v-for="i in 5" :key="i" class="border-t border-line"><td v-for="j in (draft ? 8 : 7)" :key="j" class="px-4 py-3.5"><div class="h-4 rounded animate-pulse bg-surface-raised"></div></td></tr>
              </template>
              <tr v-else-if="!members.rows.value.length">
                <td :colspan="draft ? 8 : 7" class="px-6 py-14 text-center">
                  <p class="text-sm font-semibold text-ink">{{ members.search.value ? "No members match your search" : reinsuredOnly ? "No members above the retention limit" : "No members yet" }}</p>
                  <p v-if="draft && !members.search.value && !reinsuredOnly" class="mt-1 text-sm text-ink-muted">Import the institution's staff list from the Excel template, or add members one by one.</p>
                </td>
              </tr>
              <tr v-for="p in members.rows.value" v-else :key="p.insuredUuid" class="border-t border-line hover:bg-surface-muted/60">
                <td class="px-4 py-3">
                  <span class="font-medium text-ink">{{ insuredName(p) }}</span>
                  <span class="block text-xs text-ink-subtle">{{ [p.insuranceId, p.position, p.phone].filter(Boolean).join(" · ") }}</span>
                </td>
                <td class="px-4 py-3 text-ink-muted">{{ p.gender || "—" }}</td>
                <td class="px-4 py-3 whitespace-nowrap text-ink-muted">{{ formatDate(p.birthDate) }}</td>
                <td class="px-4 py-3 text-right tabular-nums text-ink">{{ formatAmount(p.sumAssured) }}</td>
                <td class="px-4 py-3 text-right whitespace-nowrap tabular-nums text-ink-muted">{{ p.rate != null ? `${p.rate} / ${p.rateUnit ?? "—"}` : "—" }}</td>
                <td class="px-4 py-3 text-right tabular-nums text-ink">{{ formatAmount(p.premium) }}</td>
                <td class="px-4 py-3 text-ink-muted">
                  <span v-if="p.quotedRiders?.length" :title="p.quotedRiders.map((r) => `${r.riderName}: ${formatAmount(r.premium)}`).join('\n')">{{ p.quotedRiders.length }} rider{{ p.quotedRiders.length === 1 ? "" : "s" }}</span>
                  <span v-else>—</span>
                </td>
                <td v-if="draft" class="px-4 py-3">
                  <div class="flex gap-1 justify-end">
                    <Button variant="ghost" size="sm" @click="editMember(p)">Edit</Button>
                    <Button variant="ghost" size="sm" class="!text-error" @click="removeMember(p)">Remove</Button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <LifePager v-model:page="members.page.value" :total-pages="members.totalPages.value" :disabled="members.loading.value" />
      </section>

      <!-- Riders -->
      <div v-show="tab === 'Riders'" class="grid gap-2">
        <p class="text-xs text-ink-muted">Riders add cover on top of the term benefit for every member. Sums assured must stay within each rider's limits; premiums are calculated by the system.</p>
        <RateTableEditor
          :spec="riderSpec"
          :rows="quotedRiders.data.value"
          :loading="quotedRiders.loading.value || riderLibrary.loading.value"
          :saving="savingRiders"
          :load-error="quotedRiders.error.value || riderLibrary.error.value"
          :readonly="!draft"
          keep-order
          empty-hint="Add a row for each rider the institution wants."
          @save="saveRiders"
          @remove="removeRider"
          @retry="quotedRiders.load(); riderLibrary.load()"
        />
      </div>

      <!-- Reinsurance -->
      <section v-show="tab === 'Reinsurance'" class="p-5 rounded-2xl border bg-surface border-line shadow-card">
        <h2 class="text-sm font-semibold text-ink">Reinsurance treaty</h2>
        <p class="mt-1 text-xs text-ink-muted">Members above the treaty's retention are ceded under it. Use “Above retention only” on the Members tab to see who needs the treaty's medical evidence.</p>
        <div v-if="mappings.error.value && !mappings.loading.value" class="flex flex-col gap-3 items-start mt-4">
          <p class="text-sm text-ink-muted">{{ mappings.error.value }}</p>
          <Button variant="outline" size="sm" @click="mappings.load()">Try again</Button>
        </div>
        <ul v-else class="mt-4 rounded-xl border divide-y border-line divide-line">
          <li v-if="mappings.loading.value" class="px-4 py-3"><div class="w-1/3 h-4 rounded animate-pulse bg-surface-raised"></div></li>
          <li v-else-if="!mappings.data.value.length" class="px-4 py-3 text-sm text-ink-subtle">No treaty linked yet.</li>
          <li v-for="m in mappings.data.value" v-else :key="m.policyTreatyMappingUuid" class="flex gap-3 justify-between items-center px-4 py-3">
            <span class="text-sm text-ink">
              <span class="px-2 py-0.5 mr-2 font-mono text-xs font-semibold rounded-md bg-surface-raised">{{ m.treatyCode || "—" }}</span>{{ m.treatyDescription }}
            </span>
            <span class="flex gap-2 items-center">
              <LifeStatusBadge :status="m.status" />
              <Button v-if="draft" variant="ghost" size="sm" class="!text-error" @click="removeMapping(m)">Unlink</Button>
            </span>
          </li>
        </ul>
        <div v-if="draft" class="flex flex-wrap gap-2 items-center mt-4">
          <select v-model="treatyToAdd" aria-label="Treaty to link" :disabled="treaties.loading.value" class="px-3 min-w-[18rem] h-9 text-sm rounded-lg border outline-none bg-surface border-line text-ink focus:border-primary">
            <option value="">{{ treaties.loading.value ? "Loading treaties…" : unmappedTreaties.length ? "Choose an active treaty" : "No other active treaties" }}</option>
            <option v-for="t in unmappedTreaties" :key="t.reinsuranceTreatyUuid" :value="t.reinsuranceTreatyUuid">{{ t.treatyCode }} — {{ t.treatyDescription }}</option>
          </select>
          <Button size="sm" :disabled="!treatyToAdd" :pending="mapping" @click="addMapping">Link treaty</Button>
        </div>
      </section>

      <!-- Details -->
      <div v-show="tab === 'Details'" class="grid gap-5 lg:grid-cols-3">
        <section class="p-5 rounded-2xl border lg:col-span-2 bg-surface border-line shadow-card">
          <h2 class="text-sm font-semibold text-ink">Quotation</h2>
          <dl class="grid gap-x-6 gap-y-3 mt-3 sm:grid-cols-2">
            <div v-for="[label, value] in details" :key="label">
              <dt class="text-xs text-ink-subtle">{{ label }}</dt>
              <dd class="text-sm text-ink">{{ value || "—" }}</dd>
            </div>
          </dl>
          <h2 class="mt-6 text-sm font-semibold text-ink">Premium</h2>
          <p class="text-xs text-ink-subtle">As calculated and recorded by the system.</p>
          <dl class="grid gap-x-6 gap-y-3 mt-3 sm:grid-cols-3">
            <div v-for="[label, value] in money" :key="label">
              <dt class="text-xs text-ink-subtle">{{ label }}</dt>
              <dd class="text-sm tabular-nums text-ink">{{ label.startsWith("Average") ? (value ?? "—") : formatAmount(value) }}</dd>
            </div>
          </dl>
        </section>
        <section class="p-5 rounded-2xl border bg-surface border-line shadow-card">
          <h2 class="text-sm font-semibold text-ink">Timeline</h2>
          <ol class="grid gap-3 mt-3">
            <li v-for="[label, date, by] in timeline" :key="label" class="flex gap-3 items-start">
              <span :class="['mt-1.5 w-2 h-2 rounded-full shrink-0', date ? 'bg-primary' : 'bg-line']"></span>
              <span class="text-sm">
                <span :class="date ? 'text-ink' : 'text-ink-subtle'">{{ label }}</span>
                <span class="block text-xs text-ink-subtle">{{ date ? formatDate(date) : "Not yet" }}{{ by ? ` · ${by}` : "" }}</span>
              </span>
            </li>
          </ol>
          <template v-if="q.beginDate">
            <h2 class="mt-6 text-sm font-semibold text-ink">Cover period</h2>
            <p class="mt-1 text-sm text-ink">{{ formatDate(q.beginDate) }} – {{ formatDate(q.endDate) }}</p>
          </template>
        </section>
      </div>
    </template>
  </div>
</template>
