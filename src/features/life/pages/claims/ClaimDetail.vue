<script setup>
// One life claim: member and policy, comments by stage, documents, timeline and sign-offs.
// The stage comes from the queue it was opened from (?side=&queue=), or from its status string.
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { openModal } from "@customizer/modal-x";
import Button from "@/components/Button.vue";
import { toasted } from "@/utils/utils";
import { lifeCan } from "@/features/life/privileges";
import PageHeader from "@/components/PageHeader.vue";
import StatusBadge from "@/components/StatusBadge.vue";
import PageNav from "@/components/PageNav.vue";
import { useLifeResource } from "../../composables/useLifeResource";
import { useLifePagedList } from "../../composables/useLifePagedList";
import { confirmAction } from "../../composables/confirmAction";
import { formatAmount, formatDate } from "../../constants/labels";
import { approvalTrail, claimActions, formatFileSize, personName, queueFromStatus, queuesFor } from "../../claims/claimRules";
import { deleteClaim, deleteClaimAttachment, getAttachment, getClaimApproverResponse, getClaimAttachments, getClaimDetails, getClaimLogs } from "../../api/claimApi";

const route = useRoute();
const router = useRouter();
const uuid = route.params.claimUuid;
const side = route.query.side === "agency" ? "agency" : "insurance";
const back = side === "agency" ? "/life/claims/agency" : "/life/claims/insurance";

const claim = useLifeResource(getClaimDetails);
const c = computed(() => claim.data.value || {});
const queue = computed(() => (queuesFor(side).some((q) => q.key === route.query.queue) ? route.query.queue : queueFromStatus(c.value.status)));
const stageLabel = computed(() => queuesFor(side).find((q) => q.key === queue.value)?.label);
// Registered claims are numbered CLN/LIFE/NNNN/YY (claimNumberCode); older ones may have no number
const claimTitle = computed(() => {
  const number = c.value.claimNumberCode || c.value.claimNumber;
  if (number) return `Claim ${number}`;
  if (claim.loading.value && !c.value.claimUuid) return "Loading…";
  return queue.value === "saved" ? "Draft claim" : "Claim";
});
const can = computed(() => {
  const a = claimActions(side, queue.value);
  const prepare = lifeCan("Life_Claim_Prepare");
  return {
    submit: a.submit && prepare,
    remove: a.remove && prepare,
    documents: a.documents && prepare,
    review: a.review && lifeCan("Life_Claim_Review"),
    approve: a.approve && lifeCan("Life_Claim_Approve"),
    reject: a.reject && lifeCan(["Life_Claim_Review", "Life_Claim_Approve"]),
  };
});

const documents = useLifeResource(() => getClaimAttachments(uuid), { initial: [] });
const approvers = useLifeResource(() => getClaimApproverResponse({ claimUuid: uuid }), { initial: [], map: (d) => (Array.isArray(d) ? d : d ? [d] : []) });
const logs = useLifePagedList((p) => getClaimLogs({ claimUuid: uuid, ...p }), { limit: 10 });

function loadAll() {
  claim.load(uuid);
  documents.load();
  approvers.load();
  logs.reload();
}
loadAll();

const trail = computed(() => approvalTrail(approvers.data.value[0] || {}));
const comments = computed(() => [
  ["Agency", c.value.agencyComment],
  ["Reviewer", c.value.reviewerComment],
  ["Approver", c.value.approverComment],
  ["Authorizer", c.value.authorizerComment],
].filter(([, v]) => v));
const facts = computed(() => [
  ["Member", personName(c.value)],
  ["Phone", c.value.insuredPhone],
  ["Certificate number", c.value.certificateNumber],
  ["Policy", c.value.agencyPolicyNumber],
  ["Agency", [c.value.agencyName, c.value.agencyPhone].filter(Boolean).join(" · ")],
  ["Insurer branch", [c.value.insuranceName, c.value.branchName].filter(Boolean).join(" · ")],
  ["Cover", c.value.beginDate ? `${formatDate(c.value.beginDate)} – ${formatDate(c.value.endDate)}` : ""],
  ["Event date", c.value.incidentDate ? formatDate(c.value.incidentDate) : ""],
  ["Claimed on", c.value.claimDate ? formatDate(c.value.claimDate) : ""],
]);
const payment = computed(() => [
  ["Authorized amount", c.value.totalAuthorizeamount != null ? formatAmount(c.value.totalAuthorizeamount) : ""],
  ["Payment order", [c.value.paymentOrderNumber, c.value.paymentOrderDate && formatDate(c.value.paymentOrderDate)].filter(Boolean).join(" · ")],
  ["Payment voucher", [c.value.paymentVoucherNumber, c.value.paymentVoucherDate && formatDate(c.value.paymentVoucherDate)].filter(Boolean).join(" · ")],
].filter(([, v]) => v));

function decide(action) {
  openModal("LifeClaimDecision", { action, claim: c.value }, (done) => {
    if (!done) return;
    // The claim has moved to the next queue; go back to the list it came from
    router.push({ path: back, query: { queue: queue.value } });
  });
}
function submitClaim() {
  if (!documents.data.value.length) {
    confirmAction({ title: "Submit without documents?", message: "The insurer will need the supporting documents (e.g. death certificate) to review the claim.", confirmText: "Continue" }, () => decide("submit"));
  } else decide("submit");
}
function remove() {
  confirmAction({ title: "Delete this draft claim?", message: "The claim and its documents are removed. This can't be undone.", confirmText: "Delete", tone: "danger" }, async () => {
    const res = await deleteClaim(uuid);
    if (res?.success) { toasted(true, "Draft claim deleted"); router.push({ path: back, query: { queue: "saved" } }); }
  });
}

const attach = (attachment) => openModal("LifeClaimDocument", { claimUuid: uuid, attachment }, (saved) => saved && documents.load());
function removeDocument(a) {
  confirmAction({ title: `Remove ${a.fileName}?`, message: "The document is taken off the claim.", confirmText: "Remove", tone: "danger" }, async () => {
    const res = await deleteClaimAttachment(a.claimAttachmentUuid);
    if (res?.success) { toasted(true, "Document removed"); documents.load(); }
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
      <PageHeader :title="claimTitle" :subtitle="personName(c)" :back="{ path: back, query: { queue } }">
        <template #badge>
          <span v-if="stageLabel" class="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-surface-raised text-ink-muted">{{ stageLabel }}</span>
          <StatusBadge v-if="c.status && c.status.toLowerCase() !== stageLabel?.toLowerCase()" :status="c.status" />
        </template>
        <template #actions>
          <Button v-if="can.remove" variant="ghost" class="!text-error" @click="remove">Delete draft</Button>
          <Button v-if="can.reject" variant="outline" class="!text-error" @click="decide('reject')">Reject</Button>
          <Button v-if="can.submit" @click="submitClaim">Submit to insurer</Button>
          <Button v-if="can.review" @click="decide('review')">Mark reviewed</Button>
          <Button v-if="can.approve" @click="decide('approve')">Approve</Button>
        </template>
      </PageHeader>

      <p v-if="side === 'insurance' && ['approved', 'for-authorization', 'authorized'].includes(queue)" class="px-4 py-2.5 mb-5 text-xs rounded-xl bg-warning-soft text-warning-strong">
        Authorizing and paying claims aren't available in the system yet (backend gap G3). This claim can be viewed only.
      </p>

      <div class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div class="grid gap-5 min-w-0">
          <!-- Claim facts -->
          <section class="p-5 rounded-2xl border bg-surface border-line shadow-card">
            <h2 class="text-sm font-semibold text-ink">Claim</h2>
            <dl class="grid gap-x-6 gap-y-3 mt-3 sm:grid-cols-2 lg:grid-cols-3">
              <div v-for="[label, value] in facts" :key="label">
                <dt class="text-xs text-ink-subtle">{{ label }}</dt>
                <dd class="text-sm text-ink">{{ claim.loading.value && !c.claimUuid ? "…" : value || "—" }}</dd>
              </div>
            </dl>
            <template v-if="payment.length">
              <h2 class="mt-6 text-sm font-semibold text-ink">Payment</h2>
              <dl class="grid gap-x-6 gap-y-3 mt-3 sm:grid-cols-3">
                <div v-for="[label, value] in payment" :key="label">
                  <dt class="text-xs text-ink-subtle">{{ label }}</dt>
                  <dd class="text-sm tabular-nums text-ink">{{ value }}</dd>
                </div>
              </dl>
            </template>
          </section>

          <!-- Comments -->
          <section v-if="comments.length" class="p-5 rounded-2xl border bg-surface border-line shadow-card">
            <h2 class="text-sm font-semibold text-ink">Comments</h2>
            <ul class="grid gap-3 mt-3">
              <li v-for="[who, text] in comments" :key="who" class="px-4 py-3 rounded-xl bg-surface-muted">
                <p class="text-xs font-semibold text-ink-subtle">{{ who }}</p>
                <p class="mt-0.5 text-sm whitespace-pre-line text-ink">{{ text }}</p>
              </li>
            </ul>
          </section>

          <!-- Documents -->
          <section class="p-5 rounded-2xl border bg-surface border-line shadow-card">
            <div class="flex flex-wrap gap-3 justify-between items-center">
              <div>
                <h2 class="text-sm font-semibold text-ink">Documents</h2>
                <p v-if="can.documents" class="text-xs text-ink-muted">Attach the claim form, ID, and the death certificate or medical report.</p>
              </div>
              <Button v-if="can.documents" size="sm" @click="attach()">Attach document</Button>
            </div>
            <div v-if="documents.error.value && !documents.loading.value" class="flex gap-3 items-center mt-4 text-sm text-ink-muted">
              {{ documents.error.value }} <Button variant="outline" size="sm" @click="documents.load()">Try again</Button>
            </div>
            <ul v-else class="mt-4 rounded-xl border divide-y border-line divide-line">
              <li v-if="documents.loading.value" class="px-4 py-3"><div class="w-1/3 h-4 rounded animate-pulse bg-surface-raised"></div></li>
              <li v-else-if="!documents.data.value.length" class="px-4 py-3 text-sm text-ink-subtle">No documents attached.</li>
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
          <!-- Sign-offs -->
          <section class="p-5 rounded-2xl border bg-surface border-line shadow-card">
            <h2 class="text-sm font-semibold text-ink">Sign-offs</h2>
            <ol class="grid gap-3 mt-3">
              <li v-for="s in trail" :key="s.label" class="flex gap-3 items-start">
                <span :class="['mt-1.5 w-2 h-2 rounded-full shrink-0', s.date ? 'bg-primary' : 'bg-line']"></span>
                <span class="text-sm">
                  <span :class="s.date ? 'text-ink' : 'text-ink-subtle'">{{ s.label }}</span>
                  <span class="block text-xs text-ink-subtle">{{ s.date ? [formatDate(s.date), s.by].filter(Boolean).join(" · ") : "Not yet" }}</span>
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
              <li v-else-if="!logs.rows.value.length" class="text-sm text-ink-subtle">No history yet.</li>
              <li v-for="(l, i) in logs.rows.value" v-else :key="i" class="text-sm">
                <span class="flex gap-2 justify-between">
                  <span class="font-medium text-ink">{{ l.status || "Update" }}</span>
                  <span class="text-xs text-ink-subtle">{{ formatDate(l.actionDate ?? l.audit?.createdAt) }}</span>
                </span>
                <span class="block text-xs text-ink-subtle">{{ personName(l) }}</span>
                <span v-if="l.comment" class="block mt-0.5 text-xs whitespace-pre-line text-ink-muted">{{ l.comment }}</span>
              </li>
            </ol>
            <PageNav v-model:page="logs.page.value" :total-pages="logs.totalPages.value" :disabled="logs.loading.value" />
          </section>
        </aside>
      </div>
    </template>
  </div>
</template>
