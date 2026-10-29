<script setup>
// One group quotation: members, riders, reinsurance treaty and the status actions
// (issue → accept → pay → issue policy). Drafts show a checklist of what is left to do.
import { computed, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { openModal } from "@customizer/modal-x";
import Button from "@/components/Button.vue";
import TabGroup from "@/components/TabGroup.vue";
import { toasted } from "@/utils/utils";
import { hasPrivilege } from "@/utils/privileges";
import PageHeader from "@/components/PageHeader.vue";
import StatusBadge from "@/components/StatusBadge.vue";
import InsuredMembersPanel from "../../components/InsuredMembersPanel.vue";
import QuotedRidersPanel from "../../components/QuotedRidersPanel.vue";
import TreatyLinksPanel from "../../components/TreatyLinksPanel.vue";
import QuotationSummaryPanel from "../../components/QuotationSummaryPanel.vue";
import { useLifeResource } from "../../composables/useLifeResource";
import { confirmAction } from "../../composables/confirmAction";
import { quotationStatusLabel } from "../../constants/labels";
import { quotationActions } from "../../quotations/quotationRules";
import { acceptQuotation, deleteQuotation, getQuotation, issueQuotation, reviseQuotation } from "../../api/quotationApi";

const route = useRoute();
const router = useRouter();
const uuid = computed(() => route.params.quotationUuid);

const quotation = useLifeResource(getQuotation);
const q = computed(() => quotation.data.value || {});
// Status says what is possible next; the user's Life privileges say who may do it
const can = computed(() => {
  const a = quotationActions(q.value);
  const create = hasPrivilege("Life_Quotation_Create");
  return {
    ...a,
    edit: a.edit && create,
    remove: a.remove && create,
    issue: a.issue && hasPrivilege("Life_Quotation_Issue"),
    accept: a.accept && hasPrivilege("Life_Quotation_Issue"),
    pay: a.pay && hasPrivilege("Life_Payment_Record"),
    issuePolicy: a.issuePolicy && hasPrivilege("Life_Policy_Issue"),
    revise: a.revise && hasPrivilege("Life_Policy_Service"),
  };
});
const draft = computed(() => can.value.edit);
const isDraft = computed(() => quotationActions(q.value).edit);

const TABS = ["Members", "Riders", "Reinsurance", "Details"];
const tab = ref("Members");
// Panels load their own data; a new key remounts them after a status change or on a revision
const version = ref(0);
const counts = reactive({ members: 0, riders: 0, treaties: 0 });

function reloadAll() {
  quotation.load(uuid.value);
  version.value++;
}
reloadAll();
watch(uuid, (v, old) => {
  if (!v || v === old) return;
  Object.assign(counts, { members: 0, riders: 0, treaties: 0 });
  tab.value = "Members";
  reloadAll();
});

const steps = computed(() => [
  { label: "Details", done: !!q.value.institutionUuid && !!q.value.term },
  { label: "Members", done: counts.members > 0 },
  { label: "Riders", done: counts.riders > 0, optional: true },
  { label: "Reinsurance", done: counts.treaties > 0, optional: true },
]);

const editDetails = () => openModal("LifeQuotationForm", { quotation: q.value }, (saved) => saved && quotation.load(uuid.value));

function statusStep(fn, { title, message, confirmText, done }) {
  confirmAction({ title, message, confirmText }, async () => {
    const res = await fn(uuid.value);
    if (res?.success) { toasted(true, done); reloadAll(); }
  });
}
const issue = () => {
  if (!counts.members) { toasted(false, "Add at least one member before issuing"); tab.value = "Members"; return; }
  statusStep(issueQuotation, { title: "Issue this quotation?", message: "Premiums are fixed and it is sent to the client. Members and riders can no longer be changed.", confirmText: "Issue", done: "Quotation issued" });
};
const accept = () => statusStep(acceptQuotation, { title: "Mark as accepted?", message: `Confirm that ${q.value.institutionName || "the client"} accepted the quotation. Finance can then record the payment.`, confirmText: "Mark accepted", done: "Quotation accepted" });
const pay = () => openModal("LifeQuotationPayment", { quotation: q.value }, (saved) => saved && reloadAll());
const issuePolicyNow = () => openModal("LifeIssuePolicy", { quotation: q.value }, (saved) => saved && reloadAll());
function revise() {
  confirmAction({ title: "Revise this quotation?", message: "A new draft version is created from it for the renewal or change. This one stays as it is.", confirmText: "Create revision" }, async () => {
    const res = await reviseQuotation(uuid.value);
    if (res?.success) {
      toasted(true, "Revision created");
      if (res.data?.quotationUuid && res.data.quotationUuid !== uuid.value) router.push(`/life/quotations/${res.data.quotationUuid}`);
      else reloadAll();
    }
  });
}
function remove() {
  confirmAction({ title: "Delete this draft?", message: "The quotation, its members and riders are removed. This can't be undone.", confirmText: "Delete", tone: "danger" }, async () => {
    const res = await deleteQuotation(uuid.value);
    if (res?.success) { toasted(true, "Draft deleted"); router.push("/life/quotations"); }
  });
}
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
      <PageHeader
        :title="q.quotationNumber || (quotation.loading.value && !q.quotationUuid ? 'Loading…' : 'Draft quotation')"
        :subtitle="[q.institutionName, q.term ? `${q.term}-year group term life` : ''].filter(Boolean).join(' · ')"
        back="/life/quotations"
      >
        <template v-if="q.quotationStatus" #badge>
          <StatusBadge :status="q.quotationStatus" />
          <StatusBadge v-if="q.policyStatus && q.policyIssuedDate" :status="q.policyStatus" />
        </template>
        <template #actions>
          <Button v-if="can.remove" variant="ghost" class="!text-error" @click="remove">Delete draft</Button>
          <Button v-if="can.edit" variant="outline" @click="editDetails">Edit details</Button>
          <Button v-if="can.issue" @click="issue">Issue quotation</Button>
          <Button v-if="can.accept" @click="accept">Mark accepted</Button>
          <Button v-if="can.pay" @click="pay">Record payment</Button>
          <Button v-if="can.issuePolicy" @click="issuePolicyNow">Issue policy</Button>
          <Button v-if="q.policyIssuedDate" variant="outline" @click="router.push(`/life/policies/${uuid}`)">View policy</Button>
          <Button v-if="can.revise" variant="outline" @click="revise">Revise</Button>
        </template>
      </PageHeader>

      <!-- Draft checklist -->
      <ol v-if="isDraft" class="flex flex-wrap gap-2 mb-5" aria-label="Before issuing">
        <li v-for="(s, i) in steps" :key="s.label">
          <button
            type="button"
            :class="['inline-flex gap-2 items-center py-1.5 pr-3 pl-1.5 text-xs font-medium rounded-full border', s.done ? 'border-success/40 bg-success-soft text-success-strong' : 'border-line bg-surface text-ink-muted hover:border-primary/50']"
            @click="s.label !== 'Details' ? (tab = s.label) : can.edit && editDetails()"
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

      <template v-if="q.quotationUuid === uuid">
        <InsuredMembersPanel v-show="tab === 'Members'" :key="`m${version}`" :quotation="q" :editable="draft" @count="counts.members = $event" />
        <QuotedRidersPanel v-show="tab === 'Riders'" :key="`r${version}`" :quotation-uuid="uuid" :editable="draft" @count="counts.riders = $event" />
        <TreatyLinksPanel v-show="tab === 'Reinsurance'" :key="`t${version}`" :quotation-uuid="uuid" :editable="draft" @count="counts.treaties = $event" />
        <QuotationSummaryPanel v-show="tab === 'Details'" :quotation="q" />
      </template>
    </template>
  </div>
</template>
