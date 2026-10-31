<script setup>
// One life claim (GET /claim/v2/{uuid}): the event, the document checklist, the assessment, payees
// and payments, and the steps so far. The actions offered follow the claim's status and the
// person's privileges; every amount shown is the backend's.
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { openModal } from "@customizer/modal-x";
import Button from "@/components/Button.vue";
import { toasted } from "@/utils/utils";
import { lifeCan } from "@/features/life/privileges";
import PageHeader from "@/components/PageHeader.vue";
import StatusBadge from "@/components/StatusBadge.vue";
import ListTable from "@/components/ListTable.vue";
import { useLifeResource } from "../../composables/useLifeResource";
import { confirmAction } from "../../composables/confirmAction";
import { formatAmount, formatDate } from "../../constants/labels";
import { claimActions, claimTimeline, claimTypeLabel, documentTypeLabel, formatFileSize, missingDocuments, personName } from "../../claims/claimRules";
import { deleteClaim, deleteClaimAttachment, getAttachment, getClaimAttachments, getClaimLogs_1, getLifeClaim } from "../../api/claimApi";

const route = useRoute();
const router = useRouter();
const uuid = route.params.claimUuid;
const side = route.query.side === "agency" ? "agency" : "insurance";
const back = side === "agency" ? "/life/claims/agency" : "/life/claims/insurance";

const claim = useLifeResource(getLifeClaim);
const c = computed(() => claim.data.value || {});
const documents = useLifeResource(() => getClaimAttachments(uuid), { initial: [] });
const logs = useLifeResource(() => getClaimLogs_1(uuid), { initial: [], map: (d) => (Array.isArray(d) ? d : []) });
function loadAll() {
  claim.load(uuid);
  documents.load();
  logs.load();
}
loadAll();

const claimTitle = computed(() => {
  if (c.value.claimNumberCode) return `Claim ${c.value.claimNumberCode}`;
  if (claim.loading.value && !c.value.claimUuid) return "Loading…";
  return c.value.status === "SAVED" ? "Draft claim" : "Claim";
});
const can = computed(() => {
  const a = claimActions(c.value);
  const prepare = lifeCan("Life_Claim_Prepare");
  const review = lifeCan("Life_Claim_Review");
  return {
    submit: a.submit && prepare,
    remove: a.remove && prepare,
    documents: a.documents && prepare,
    register: a.register && review,
    review: a.review && review,
    assess: a.assess && review,
    approve: a.approve && lifeCan("Life_Claim_Approve"),
    authorize: a.authorize && lifeCan("Life_Claim_Authorize"),
    pay: a.pay && lifeCan("Life_Claim_Pay"),
    requestInfo: a.requestInfo && review,
    reject: a.reject && lifeCan(["Life_Claim_Review", "Life_Claim_Approve"]),
  };
});
const missing = computed(() => missingDocuments(c.value));
const assessed = computed(() => c.value.approvedAmount != null);

const facts = computed(() => [
  ["Insured", c.value.insuredName],
  ["Policy", c.value.policyNumber],
  ["Claim type", [claimTypeLabel(c.value.claimType), c.value.riderName].filter(Boolean).join(" · ")],
  ["Date of event", c.value.eventDate && formatDate(c.value.eventDate)],
  ["Place of event", c.value.placeOfEvent],
  ["Cover", c.value.coverStart ? `${formatDate(c.value.coverStart)} – ${formatDate(c.value.coverEnd)}` : ""],
  ["Notified by", [c.value.notifiedByName, c.value.notifiedByRelationship, c.value.notifiedByPhone].filter(Boolean).join(" · ")],
  ["Amount claimed", c.value.claimedAmount != null ? formatAmount(c.value.claimedAmount) : ""],
  ["Sum assured", c.value.sumAssured != null ? formatAmount(c.value.sumAssured) : ""],
]);
const assessment = computed(() => [
  ["Eligible amount", c.value.eligibleAmount],
  ["Approved amount", c.value.approvedAmount],
  ...(c.value.deductions || []).map((d) => [`Less: ${d.reason}`, d.amount]),
  ["Less: outstanding premium", c.value.outstandingPremiumDeducted],
]);
const timeline = computed(() => claimTimeline(c.value));

const payeeColumns = computed(() => [
  { key: "name", label: "Payee" },
  { key: "sharePercent", label: "Share", align: "right" },
  { key: "bank", label: "Bank account" },
  { key: "amount", label: "Amount", align: "right" },
  { key: "paid", label: "Paid" },
]);
const paymentFor = (payeeUuid) => (c.value.payments || []).find((p) => p.payeeUuid === payeeUuid);

// ── actions ──
const reloadAfter = (done) => done && loadAll();
const decide = (action) => openModal("LifeClaimDecision", { action, claim: c.value }, reloadAfter);
function submitClaim() {
  if (missing.value.length) {
    confirmAction({ title: "Submit with documents missing?", message: `Still missing: ${missing.value.map((d) => d.description || documentTypeLabel(d.documentType)).join(", ")}. The insurer can't review the claim until every checklist document is attached.`, confirmText: "Submit anyway" }, () => decide("submit"));
  } else decide("submit");
}
const assess = () => openModal("LifeClaimAssessment", { claim: c.value }, reloadAfter);
const pay = () => openModal("LifeClaimPayment", { claim: c.value }, reloadAfter);
function remove() {
  confirmAction({ title: "Delete this draft claim?", message: "The claim and its documents are removed. This can't be undone.", confirmText: "Delete", tone: "danger" }, async () => {
    const res = await deleteClaim(uuid);
    if (res?.success) { toasted(true, "Draft claim deleted"); router.push({ path: back, query: { status: "SAVED" } }); }
  });
}

const attach = (attachment, documentType) => openModal("LifeClaimDocument", { claimUuid: uuid, attachment, documentType, checklist: c.value.documents || [] }, (saved) => saved && (documents.load(), claim.load(uuid)));
function removeDocument(a) {
  confirmAction({ title: `Remove ${a.fileName}?`, message: "The document is taken off the claim.", confirmText: "Remove", tone: "danger" }, async () => {
    const res = await deleteClaimAttachment(a.claimAttachmentUuid);
    if (res?.success) { toasted(true, "Document removed"); documents.load(); claim.load(uuid); }
  });
}
const opening = ref("");
async function openDocument(a) {
  opening.value = a.claimAttachmentUuid;
  const res = await getAttachment({ claimAttachmentUuid: a.claimAttachmentUuid });
  opening.value = "";
  if (!res?.success || !(res.data instanceof Blob)) return;
  const url = URL.createObjectURL(res.data);
  const w = window.open(url, "_blank", "noopener");
  if (!w) { const link = document.createElement("a"); link.href = url; link.download = a.fileName || "document"; link.click(); }
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
</script>

<template>
  <div class="p-4 md:p-6">
    <div v-if="claim.error.value && !claim.loading.value && !claim.data.value" class="flex flex-col gap-3 items-center px-6 py-16 text-center">
      <p class="text-sm font-semibold text-ink">Couldn't load this claim</p>
      <p class="max-w-md text-sm text-ink-muted">{{ claim.error.value }}</p>
      <div class="flex gap-2">
        <Button variant="outline" size="sm" @click="router.push(back)">Back to claims</Button>
        <Button size="sm" @click="claim.load(uuid)">Try again</Button>
      </div>
    </div>

    <template v-else>
      <PageHeader :title="claimTitle" :subtitle="[c.insuredName, c.policyNumber].filter(Boolean).join(' · ')" :back="{ path: back, query: c.status ? { status: c.status } : {} }">
        <template v-if="c.status" #badge><StatusBadge :status="c.status" /></template>
        <template #actions>
          <Button v-if="can.remove" variant="ghost" class="!text-error" @click="remove">Delete draft</Button>
          <Button v-if="can.reject" variant="ghost" class="!text-error" @click="decide('reject')">Reject</Button>
          <Button v-if="can.requestInfo" variant="outline" @click="decide('requestInfo')">Ask for information</Button>
          <Button v-if="can.submit" @click="submitClaim">{{ c.status === "INFO_REQUESTED" ? "Submit again" : "Submit to insurer" }}</Button>
          <Button v-if="can.register" @click="decide('register')">Register</Button>
          <Button v-if="can.review" :disabled="missing.length > 0" :title="missing.length ? 'Every checklist document must be attached first' : undefined" @click="decide('review')">Mark reviewed</Button>
          <Button v-if="can.assess" :variant="assessed ? 'outline' : 'primary'" @click="assess">{{ assessed ? "Change assessment" : "Assess" }}</Button>
          <Button v-if="can.approve" @click="decide('approve')">Approve</Button>
          <Button v-if="can.authorize" @click="decide('authorize')">Authorize</Button>
          <Button v-if="can.pay" @click="pay">Record payment</Button>
        </template>
      </PageHeader>

      <p v-if="c.status === 'INFO_REQUESTED' && c.infoRequestComment" class="px-4 py-2.5 mb-5 text-sm rounded-xl bg-warning-soft text-warning-strong">
        <span class="font-semibold">The insurer asked for more information:</span> {{ c.infoRequestComment }}
      </p>
      <p v-if="side === 'insurance' && (c.contestable || c.suicideExclusionFlag)" class="px-4 py-2.5 mb-5 text-sm rounded-xl bg-warning-soft text-warning-strong">
        <template v-if="c.contestable">The event is within the contestable period: check the application for non-disclosure. </template>
        <template v-if="c.suicideExclusionFlag">Suspected suicide within the exclusion period.</template>
      </p>
      <p v-if="can.review && missing.length" class="px-4 py-2.5 mb-5 text-xs rounded-xl bg-surface-muted text-ink-muted">
        To mark it reviewed, every checklist document must be attached. Missing: {{ missing.map((d) => d.description || documentTypeLabel(d.documentType)).join(", ") }}.
      </p>

      <div class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div class="grid gap-5 min-w-0">
          <!-- Claim -->
          <section class="p-5 rounded-2xl border bg-surface border-line shadow-card">
            <h2 class="text-sm font-semibold text-ink">Claim</h2>
            <dl class="grid gap-x-6 gap-y-3 mt-3 sm:grid-cols-2 lg:grid-cols-3">
              <div v-for="[label, value] in facts" :key="label">
                <dt class="text-xs text-ink-subtle">{{ label }}</dt>
                <dd class="text-sm text-ink">{{ claim.loading.value && !c.claimUuid ? "…" : value || "—" }}</dd>
              </div>
            </dl>
            <div v-if="c.causeOfEvent" class="mt-4">
              <p class="text-xs text-ink-subtle">Cause of event</p>
              <p class="text-sm whitespace-pre-line text-ink">{{ c.causeOfEvent }}</p>
            </div>
          </section>

          <!-- Assessment -->
          <section v-if="assessed || can.assess" class="p-5 rounded-2xl border bg-surface border-line shadow-card">
            <h2 class="text-sm font-semibold text-ink">Assessment</h2>
            <p v-if="!assessed" class="mt-2 text-sm text-ink-muted">Not assessed yet. The outstanding premium on the policy is {{ formatAmount(c.outstandingPremium ?? 0) }}.</p>
            <template v-else>
              <dl class="grid gap-2 mt-3 max-w-md">
                <div v-for="[label, value] in assessment" :key="label" class="flex gap-3 justify-between text-sm">
                  <dt class="text-ink-muted">{{ label }}</dt>
                  <dd class="tabular-nums text-ink">{{ formatAmount(value ?? 0) }}</dd>
                </div>
                <div class="flex gap-3 justify-between pt-2 text-sm font-semibold border-t border-line">
                  <dt class="text-ink">Net payable</dt>
                  <dd class="tabular-nums text-ink">{{ formatAmount(c.netPayable) }}</dd>
                </div>
              </dl>
              <p v-if="c.decisionNote" class="mt-3 text-sm whitespace-pre-line text-ink-muted">{{ c.decisionNote }}</p>
            </template>
          </section>

          <!-- Payees -->
          <section class="p-5 rounded-2xl border bg-surface border-line shadow-card">
            <h2 class="text-sm font-semibold text-ink">Payees</h2>
            <p class="text-xs text-ink-muted">The net payable is split by share once the claim is assessed.</p>
            <ListTable bare class="mt-3" :columns="payeeColumns" :rows="c.payees || []" row-key="payeeUuid" :loading="claim.loading.value && !c.claimUuid" empty-title="No payees on this claim." :skeleton-rows="1">
              <template #cell-name="{ row }"><span class="text-ink">{{ row.name }}</span></template>
              <template #cell-sharePercent="{ row }"><span class="tabular-nums text-ink-muted">{{ row.sharePercent }}%</span></template>
              <template #cell-bank="{ row }"><span class="text-ink-muted">{{ [row.bankName, row.accountNumber].filter(Boolean).join(" · ") || "—" }}</span></template>
              <template #cell-amount="{ row }"><span class="tabular-nums text-ink">{{ row.amount != null ? formatAmount(row.amount) : "—" }}</span></template>
              <template #cell-paid="{ row }">
                <span v-if="row.paid" class="text-success-strong">Paid<span v-if="paymentFor(row.payeeUuid)" class="block text-xs text-ink-subtle">{{ paymentFor(row.payeeUuid).paymentVoucherNumber }} · {{ formatDate(paymentFor(row.payeeUuid).paymentDate) }}</span></span>
                <span v-else class="text-ink-subtle">No</span>
              </template>
            </ListTable>
            <p v-if="c.paymentOrderCode" class="mt-3 text-xs text-ink-muted">Payment order {{ c.paymentOrderCode }}</p>
          </section>

          <!-- Documents -->
          <section class="p-5 rounded-2xl border bg-surface border-line shadow-card">
            <div class="flex flex-wrap gap-3 justify-between items-center">
              <div>
                <h2 class="text-sm font-semibold text-ink">Documents</h2>
                <p class="text-xs text-ink-muted">The checklist for this claim type. Each item is ticked once a file is attached for it.</p>
              </div>
              <Button v-if="can.documents" size="sm" @click="attach()">Attach document</Button>
            </div>
            <ul v-if="c.documents?.length" class="grid gap-2 mt-4 sm:grid-cols-2">
              <li v-for="d in c.documents" :key="d.documentType" class="flex gap-3 justify-between items-center px-3 py-2 rounded-xl border border-line">
                <span class="flex gap-2 items-center text-sm">
                  <span :class="['grid place-items-center w-5 h-5 text-xs rounded-full shrink-0', d.received ? 'bg-success text-white' : 'border border-line-strong text-transparent']" aria-hidden="true">✓</span>
                  <span :class="d.received ? 'text-ink' : 'text-ink-muted'">{{ d.description || documentTypeLabel(d.documentType) }}<span class="sr-only">{{ d.received ? " (attached)" : " (missing)" }}</span></span>
                </span>
                <Button v-if="can.documents && !d.received" variant="ghost" size="sm" @click="attach(null, d.documentType)">Attach</Button>
              </li>
            </ul>
            <div v-if="documents.error.value && !documents.loading.value" class="flex gap-3 items-center mt-4 text-sm text-ink-muted">
              {{ documents.error.value }} <Button variant="outline" size="sm" @click="documents.load()">Try again</Button>
            </div>
            <ul v-else class="mt-4 rounded-xl border divide-y border-line divide-line">
              <li v-if="documents.loading.value" class="px-4 py-3"><div class="w-1/3 h-4 rounded animate-pulse bg-surface-raised"></div></li>
              <li v-else-if="!documents.data.value.length" class="px-4 py-3 text-sm text-ink-subtle">No files attached.</li>
              <li v-for="a in documents.data.value" v-else :key="a.claimAttachmentUuid" class="flex flex-wrap gap-3 justify-between items-center px-4 py-2.5">
                <span class="text-sm">
                  <span class="text-ink">{{ a.fileName }}</span>
                  <span class="block text-xs text-ink-subtle">{{ [formatFileSize(a.fileSize), formatDate(a.createdAt ?? a.audit?.createdAt)].filter((x) => x && x !== '—').join(" · ") }}</span>
                </span>
                <span class="flex gap-1">
                  <Button variant="ghost" size="sm" :pending="opening === a.claimAttachmentUuid" @click="openDocument(a)">Open</Button>
                  <template v-if="can.documents">
                    <Button variant="ghost" size="sm" @click="attach(a)">Replace</Button>
                    <Button variant="ghost" size="sm" class="!text-error" @click="removeDocument(a)">Remove</Button>
                  </template>
                </span>
              </li>
            </ul>
          </section>
        </div>

        <aside class="grid gap-5 self-start">
          <!-- Steps -->
          <section class="p-5 rounded-2xl border bg-surface border-line shadow-card">
            <h2 class="text-sm font-semibold text-ink">Progress</h2>
            <ol class="grid gap-3 mt-3">
              <li v-for="s in timeline" :key="s.label" class="flex gap-3 items-start">
                <span :class="['mt-1.5 w-2 h-2 rounded-full shrink-0', s.date ? 'bg-primary' : 'bg-line']"></span>
                <span class="text-sm">
                  <span :class="s.date ? 'text-ink' : 'text-ink-subtle'">{{ s.label }}</span>
                  <span class="block text-xs text-ink-subtle">{{ s.date ? formatDate(s.date) : "Not yet" }}</span>
                  <span v-if="s.date && s.comment" class="block mt-0.5 text-xs whitespace-pre-line text-ink-muted">{{ s.comment }}</span>
                </span>
              </li>
            </ol>
          </section>

          <!-- History -->
          <section class="p-5 rounded-2xl border bg-surface border-line shadow-card">
            <h2 class="text-sm font-semibold text-ink">History</h2>
            <p v-if="logs.error.value" class="mt-3 text-sm text-ink-muted">{{ logs.error.value }}</p>
            <ol v-else class="grid gap-3 mt-3">
              <li v-if="logs.loading.value" class="h-4 rounded animate-pulse bg-surface-raised"></li>
              <li v-else-if="!logs.data.value.length" class="text-sm text-ink-subtle">No history yet.</li>
              <li v-for="(l, i) in logs.data.value" v-else :key="i" class="text-sm">
                <span class="flex gap-2 justify-between">
                  <span class="font-medium text-ink">{{ l.status || personName(l) || "Update" }}</span>
                  <span class="text-xs text-ink-subtle">{{ formatDate(l.actionDate ?? l.audit?.createdAt) }}</span>
                </span>
                <span v-if="l.status && personName(l)" class="block text-xs text-ink-subtle">{{ personName(l) }}</span>
                <span v-if="l.comment" class="block mt-0.5 text-xs whitespace-pre-line text-ink-muted">{{ l.comment }}</span>
              </li>
            </ol>
          </section>
        </aside>
      </div>
    </template>
  </div>
</template>
