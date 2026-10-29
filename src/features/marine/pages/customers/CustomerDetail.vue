<script setup>
// One customer: identity, documents checklist, account (debit and credit notes, receipts, balance)
// and history. Underwriters approve or reject a pending customer; approval needs the mandatory
// documents, and a 422 lists the missing ones.
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { openModal } from "@customizer/modal-x";
import Button from "@/components/Button.vue";
import { toasted } from "@/utils/utils";
import MarinePageHeader from "../../components/MarinePageHeader.vue";
import PageState from "../../components/PageState.vue";
import DetailTabs from "../../components/DetailTabs.vue";
import KeyValueGrid from "../../components/KeyValueGrid.vue";
import StatusBadge from "../../components/StatusBadge.vue";
import FileUploader from "../../components/FileUploader.vue";
import AuditTimeline from "../../components/AuditTimeline.vue";
import { cardClass } from "../../components/styles";
import { useResource } from "../../composables/useResource";
import { useCan } from "../../composables/useCan";
import { approveCustomer, getCustomer, getCustomerAccount, rejectCustomer, uploadCustomerDocument } from "../../api/marineApi";
import { notifyError } from "../../api/marineClient";
import { BUSINESS_TYPES, CUSTOMER_KINDS, ID_TYPES, NOTE_SOURCES, label } from "../../constants";
import { formatDate, formatDateTime } from "../../utils/format";
import { formatAmount } from "../../utils/money";
import { formatSize } from "../../utils/files";

const route = useRoute();
const router = useRouter();
const { can } = useCan();
const { data: c, loading, error, notFound, load, reload } = useResource(getCustomer);
const account = useResource(getCustomerAccount);
onMounted(() => load(route.params.id));
watch(() => route.params.id, (id) => id && load(id));
watch(
  () => route.query.tab,
  (tab) => tab === "account" && c.value && account.load(c.value.id),
  { immediate: true }
);
watch(c, (v) => v && route.query.tab === "account" && account.load(v.id));

const missingOnApprove = ref([]);
const pendingApproval = computed(() => c.value?.status === "PENDING_APPROVAL");

async function approve() {
  missingOnApprove.value = [];
  const res = await approveCustomer(c.value.id, {});
  if (res.ok) {
    c.value = res.data;
    return toasted(true, `${res.data.name} approved. It can now be insured.`);
  }
  if (res.error.code === "MISSING_DOCUMENTS") {
    missingOnApprove.value = res.error.fields.map((f) => f.message);
    router.replace({ query: { tab: "documents" } });
  } else notifyError(res.error);
}

function reject() {
  openModal(
    "MarineConfirm",
    { title: `Reject ${c.value.name}?`, message: "The customer can't be insured. Whoever registered it can correct the details and send it back.", confirmLabel: "Reject", danger: true, requireReason: true, reasonLabel: "Reason (at least 10 characters)" },
    async (r) => {
      if (!r?.confirmed) return;
      const res = await rejectCustomer(c.value.id, { reason: r.reason });
      if (!res.ok) return notifyError(res.error);
      c.value = res.data;
      toasted(true, `${res.data.name} rejected`);
    }
  );
}

const upload = (file, kind, onProgress) => {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("kind", kind);
  return uploadCustomerDocument(c.value.id, fd, onProgress);
};
function uploaded(data) {
  c.value = data;
  missingOnApprove.value = [];
}
const openUpload = ref("");

const identity = computed(() => {
  const x = c.value;
  if (!x) return [];
  const common = [
    { label: "Customer no", value: x.customerNo },
    { label: "Type", value: label(CUSTOMER_KINDS, x.kind) },
  ];
  const specific =
    x.kind === "INDIVIDUAL"
      ? [
          { label: "Full name", value: x.name },
          { label: "ID", value: x.idNumber ? `${label(ID_TYPES, x.idType)} ${x.idNumber}` : "" },
          { label: "Date of birth", value: x.dateOfBirth ? formatDate(x.dateOfBirth) : "" },
          { label: "TIN", value: x.tin },
        ]
      : [
          { label: "TIN", value: x.tin },
          { label: "VAT registration no", value: x.vatRegNo },
          { label: "Trade licence", value: x.tradeLicenceNo },
          { label: "Licence valid until", value: x.tradeLicenceExpiry ? formatDate(x.tradeLicenceExpiry) : "" },
          { label: "Business type", value: label(BUSINESS_TYPES, x.businessType) },
          { label: "Contact person", value: x.contactPerson },
        ];
  return [...common, ...specific];
});
const contact = computed(() => {
  const x = c.value;
  if (!x) return [];
  return [
    { label: "Phone", value: x.phone },
    { label: "Email", value: x.email },
    { label: "Broker", value: x.broker?.name },
    { label: "Address", value: x.address, wide: true },
  ];
});
const registration = computed(() => {
  const x = c.value;
  if (!x) return [];
  return [
    { label: "Registered by", value: x.registeredBy ? `${x.registeredBy}, ${formatDateTime(x.registeredAt)}` : "" },
    { label: "Approved by", value: x.approvedBy ? `${x.approvedBy}, ${formatDateTime(x.approvedAt)}` : "" },
    ...(x.status === "REJECTED" ? [{ label: "Rejected", value: `${x.rejectReason} (${x.rejectedBy}, ${formatDateTime(x.rejectedAt)})`, wide: true }] : []),
  ];
});
</script>

<template>
  <div class="marine-page">
    <PageState v-if="loading && !c" kind="loading" />
    <template v-else-if="notFound">
      <MarinePageHeader title="Customer not found" :crumbs="[{ label: 'Marine' }, { label: 'Customers', to: '/marine/customers' }]" />
      <PageState kind="notFound"><RouterLink to="/marine/customers"><Button variant="outline" size="sm">Back to customers</Button></RouterLink></PageState>
    </template>
    <PageState v-else-if="error" kind="error" :message="error.message" @retry="load(route.params.id)" />
    <template v-else-if="c">
      <MarinePageHeader
        :title="c.name"
        :status="c.status"
        entity="customer"
        :subtitle="`${c.customerNo ?? ''} · ${label(CUSTOMER_KINDS, c.kind)}${c.address ? ` · ${c.address}` : ''}`"
        :crumbs="[{ label: 'Marine' }, { label: 'Customers', to: '/marine/customers' }, { label: c.customerNo ?? c.name }]"
      >
        <template #actions>
          <RouterLink v-if="can('customer.register')" :to="`/marine/customers/${c.id}/edit`"><Button variant="outline">Edit</Button></RouterLink>
          <template v-if="pendingApproval && can('customer.approve')">
            <Button variant="outline" @click="reject">Reject</Button>
            <Button variant="success" @click="approve">Approve</Button>
          </template>
        </template>
      </MarinePageHeader>

      <p v-if="pendingApproval" role="status" class="p-3 mb-4 text-sm rounded-xl bg-warning-soft text-warning-strong">
        Waiting for approval{{ c.missingDocuments.length ? `. Still missing: ${c.missingDocuments.join(", ")}.` : ". All mandatory documents are on file." }}
      </p>
      <p v-else-if="c.status === 'REJECTED'" role="status" class="p-3 mb-4 text-sm rounded-xl bg-error-soft text-error-strong">
        Rejected: {{ c.rejectReason }}. Edit the details to send it back for approval.
      </p>

      <section class="grid grid-cols-2 gap-3 mb-5 sm:grid-cols-4" aria-label="Summary">
        <div :class="[cardClass, 'p-3.5 border-l-4 !border-l-sky-300 dark:!border-l-sky-700']">
          <p class="text-[11px] font-semibold tracking-wider uppercase text-ink-muted">Active policies</p>
          <p class="mt-1 text-base font-bold tabular-nums text-ink">{{ c.activePolicyCount }} <span class="text-sm font-normal text-ink-muted">of {{ c.policyCount }}</span></p>
        </div>
        <div :class="[cardClass, 'p-3.5 border-l-4', Number(c.outstanding) > 0 ? '!border-l-amber-500' : '!border-l-sky-300 dark:!border-l-sky-700']">
          <p class="text-[11px] font-semibold tracking-wider uppercase text-ink-muted">Balance</p>
          <p class="mt-1 text-base font-bold tabular-nums text-ink">ETB {{ formatAmount(c.outstanding) }}</p>
        </div>
        <div :class="[cardClass, 'p-3.5 border-l-4 !border-l-sky-300 dark:!border-l-sky-700']">
          <p class="text-[11px] font-semibold tracking-wider uppercase text-ink-muted">Documents</p>
          <p class="mt-1 text-base font-bold text-ink">{{ c.missingDocuments.length ? `${c.missingDocuments.length} missing` : "Complete" }}</p>
        </div>
        <div :class="[cardClass, 'p-3.5 border-l-4 !border-l-sky-300 dark:!border-l-sky-700']">
          <p class="text-[11px] font-semibold tracking-wider uppercase text-ink-muted">Status</p>
          <p class="mt-1"><StatusBadge entity="customer" :status="c.status" /></p>
        </div>
      </section>

      <DetailTabs
        :tabs="[
          { key: 'details', label: 'Details' },
          { key: 'documents', label: 'Documents', count: c.missingDocuments.length || undefined },
          { key: 'account', label: 'Account' },
          { key: 'audit', label: 'History' },
        ]"
      >
        <template #details>
          <div class="grid gap-4">
            <section :class="[cardClass, 'p-4']"><h2 class="mb-3 text-sm font-semibold text-ink">Identity</h2><KeyValueGrid :items="identity" /></section>
            <section :class="[cardClass, 'p-4']"><h2 class="mb-3 text-sm font-semibold text-ink">Contact</h2><KeyValueGrid :items="contact" /></section>
            <section :class="[cardClass, 'p-4']"><h2 class="mb-3 text-sm font-semibold text-ink">Registration</h2><KeyValueGrid :items="registration" :cols="2" /></section>
          </div>
        </template>

        <template #documents>
          <div v-if="missingOnApprove.length" role="alert" class="p-3 mb-4 rounded-xl bg-error-soft">
            <p class="text-sm font-semibold text-error-strong">Upload these before approving</p>
            <ul class="mt-1 text-sm list-disc list-inside text-error-strong"><li v-for="m in missingOnApprove" :key="m">{{ m }}</li></ul>
          </div>
          <section :class="[cardClass, 'overflow-hidden']">
            <h2 class="px-4 pt-4 pb-2 text-sm font-semibold text-ink">Documents <span class="font-normal text-ink-subtle">· * needed for approval</span></h2>
            <ul class="divide-y divide-line">
              <li v-for="d in c.documentsChecklist" :key="d.kind" class="px-4 py-3">
                <div class="flex flex-wrap gap-2 justify-between items-center">
                  <span class="text-sm text-ink">{{ d.label }}<span v-if="d.mandatory" class="text-error" aria-label="required"> *</span></span>
                  <span class="flex gap-3 items-center">
                    <span :class="['px-2 py-0.5 text-xs font-semibold rounded-full', d.status === 'RECEIVED' ? 'bg-success-soft text-success-strong' : 'bg-surface-raised text-ink-muted']">{{ d.status === "RECEIVED" ? "Received" : "Missing" }}</span>
                    <button v-if="can('customer.register')" type="button" class="text-sm font-medium text-primary hover:underline" :aria-expanded="openUpload === d.kind" @click="openUpload = openUpload === d.kind ? '' : d.kind">Upload</button>
                  </span>
                </div>
                <ul v-if="d.files.length" class="mt-1 text-xs text-ink-muted">
                  <li v-for="f in d.files" :key="f.id">{{ f.name }} · {{ formatSize(f.size) }} · {{ f.uploadedBy }}, {{ formatDateTime(f.uploadedAt) }}</li>
                </ul>
                <div v-if="openUpload === d.kind" class="mt-2"><FileUploader :upload="upload" :kind="d.kind" @uploaded="uploaded" /></div>
              </li>
            </ul>
          </section>
        </template>

        <template #account>
          <PageState v-if="account.loading.value && !account.data.value" kind="loading" />
          <PageState v-else-if="account.error.value" kind="error" :message="account.error.value.message" @retry="account.load(c.id)" />
          <div v-else-if="account.data.value" class="grid gap-4">
            <section class="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div v-for="[l, v] in [['Owed by customer', account.data.value.owed], ['Refunds due', account.data.value.refundsDue], ['Net balance', account.data.value.balance], ['Paid to date', account.data.value.paidToDate]]" :key="l" :class="[cardClass, 'p-3.5']">
                <p class="text-[11px] font-semibold tracking-wider uppercase text-ink-muted">{{ l }}</p>
                <p class="mt-1 text-base font-bold tabular-nums text-ink">ETB {{ formatAmount(v) }}</p>
              </div>
            </section>
            <section :class="[cardClass, 'overflow-hidden']">
              <h2 class="px-4 pt-4 pb-2 text-sm font-semibold text-ink">Debit and credit notes</h2>
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead class="bg-surface-muted"><tr class="text-[11px] font-bold tracking-wider text-left uppercase"><th class="px-4 py-2.5">Note</th><th class="px-4 py-2.5">For</th><th class="px-4 py-2.5">Issued</th><th class="px-4 py-2.5 text-right">Amount</th><th class="px-4 py-2.5 text-right">Outstanding</th><th class="px-4 py-2.5">Status</th></tr></thead>
                  <tbody>
                    <tr v-if="!account.data.value.notes.length"><td colspan="6" class="px-4 py-6 text-center text-ink-subtle">No notes yet. A debit note is raised when a quote for this customer is bound.</td></tr>
                    <tr v-for="n in account.data.value.notes" :key="n.id" class="border-t border-line">
                      <td class="px-4 py-2.5 font-semibold whitespace-nowrap text-ink">
                        <RouterLink v-if="can('finance.post') || can('users.edit')" :to="`/marine/finance/notes/${n.id}`" class="hover:text-primary">{{ n.noteNo }}</RouterLink><span v-else>{{ n.noteNo }}</span>
                      </td>
                      <td class="px-4 py-2.5">{{ NOTE_SOURCES[n.source] }}<span class="text-ink-muted"> · {{ n.policy?.policyNo ?? n.openCover?.coverNo ?? "" }}</span></td>
                      <td class="px-4 py-2.5 whitespace-nowrap text-ink-muted">{{ formatDate(n.issuedAt) }}</td>
                      <td class="px-4 py-2.5 text-right tabular-nums">{{ n.kind === "CREDIT" ? "−" : "" }}{{ formatAmount(n.total) }}</td>
                      <td class="px-4 py-2.5 text-right tabular-nums">{{ n.status === "CANCELLED" ? "—" : formatAmount(n.outstanding) }}</td>
                      <td class="px-4 py-2.5"><StatusBadge entity="note" :status="n.status" /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
            <section :class="[cardClass, 'p-4']">
              <h2 class="mb-3 text-sm font-semibold text-ink">Receipts</h2>
              <ul class="text-sm divide-y divide-line">
                <li v-if="!account.data.value.receipts.length" class="py-2 text-ink-subtle">None yet</li>
                <li v-for="r in account.data.value.receipts" :key="r.id" class="flex flex-wrap gap-2 justify-between py-2">
                  <span><span class="font-semibold text-ink">{{ r.receiptNo }}</span> <span class="text-ink-muted">· {{ r.noteNo }} · {{ r.method.replace("_", " ").toLowerCase() }}{{ r.reference ? ` ${r.reference}` : "" }}</span></span>
                  <span class="tabular-nums">ETB {{ formatAmount(r.amount) }} <span class="text-ink-muted">· {{ formatDate(r.date) }}</span></span>
                </li>
              </ul>
            </section>
          </div>
        </template>

        <template #audit>
          <section :class="[cardClass, 'p-4']"><AuditTimeline entity="customer" :entity-id="c.id" /></section>
        </template>
      </DetailTabs>
    </template>
  </div>
</template>
