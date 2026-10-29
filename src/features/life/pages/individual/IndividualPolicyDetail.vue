<script setup>
// One individual term policy with its riders. Amounts and premiums are the backend's. Issuing a
// draft (policy number, ACTIVE) needs PUT /benefit/{uuid}/issue (gap G11), so drafts stay drafts here.
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { openModal } from "@customizer/modal-x";
import Button from "@/components/Button.vue";
import { toasted } from "@/utils/utils";
import { hasPrivilege } from "@/utils/privileges";
import PageHeader from "@/components/PageHeader.vue";
import StatusBadge from "@/components/StatusBadge.vue";
import ListTable from "@/components/ListTable.vue";
import { useLifeResource } from "../../composables/useLifeResource";
import { confirmAction } from "../../composables/confirmAction";
import { daysUntil, formatAmount, formatDate, remainingLabel } from "../../constants/labels";
import { ageOn, benefitActions, benefitName } from "../../individual/individualRules";
import { deleteBenefit, deleteIndividualRiderBenefit, getBenefit, getIndividualRiderBenefits } from "../../api/policyApi";
import { getRiders } from "../../api/productApi";

const route = useRoute();
const router = useRouter();
const uuid = route.params.benefitUuid;

const benefit = useLifeResource(getBenefit);
const b = computed(() => benefit.data.value || {});
const can = computed(() => {
  const a = benefitActions(b.value);
  const may = hasPrivilege(["Life_Quotation_Create", "Life_Policy_Issue"]);
  return { edit: a.edit && may, remove: a.remove && may, riders: a.riders && may, isDraft: a.edit };
});
benefit.load(uuid);

// GET /individual-rider-benefit/active/benefits isn't filtered by policy (README R2): filter here
const riderBenefits = useLifeResource(getIndividualRiderBenefits, { initial: [], map: (d) => (Array.isArray(d) ? d : []).filter((r) => r.benefitUuid === uuid) });
const riders = useLifeResource(getRiders, { initial: [] });
riderBenefits.load();
riders.load();
const riderName = (id) => riders.data.value.find((r) => r.riderUuid === id)?.riderName || "Rider";

const riderColumns = computed(() => [
  { key: "rider", label: "Rider" },
  { key: "benefits", label: "Benefit", align: "right" },
  { key: "premium", label: "Premium", align: "right" },
  { key: "paid", label: "Paid" },
  { key: "status", label: "Status" },
  ...(can.value.riders ? [{ key: "actions", label: "Actions", align: "right", srOnly: true }] : []),
]);

const cards = computed(() => [
  ["Sum assured", formatAmount(b.value.termBenefit)],
  ["Term premium", formatAmount(b.value.termPremium)],
  ["Total premium", formatAmount(b.value.totalPremium)],
  ["Total benefit", formatAmount(b.value.totalBenefit)],
]);
const facts = computed(() => [
  ["Gender", b.value.gender],
  ["Date of birth", b.value.dateOfBirth && formatDate(b.value.dateOfBirth)],
  ["Age at start", ageOn(b.value.dateOfBirth, b.value.beginDate)],
  ["Phone", b.value.personPhone],
  ["Policy number", b.value.policyNumber || "Not issued yet"],
  ["Term", b.value.insuranceTerm ? `${b.value.insuranceTerm} years` : ""],
  ["Cover", b.value.beginDate ? `${formatDate(b.value.beginDate)} – ${formatDate(b.value.endDate)}` : ""],
  ["Remaining", b.value.endDate ? remainingLabel(daysUntil(b.value.endDate)) : ""],
  ["Created", formatDate(b.value.createdAt ?? b.value.audit?.createdAt)],
]);

const editRider = (riderBenefit) => openModal(
  "LifeRiderBenefitForm",
  { benefit: b.value, riderBenefit, riders: riders.data.value, taken: riderBenefits.data.value.map((r) => r.riderUuid) },
  (saved) => saved && (riderBenefits.load(), benefit.load(uuid)),
);
function removeRider(r) {
  confirmAction({ title: `Remove ${riderName(r.riderUuid)}?`, message: "The rider is taken off this policy.", confirmText: "Remove", tone: "danger" }, async () => {
    const res = await deleteIndividualRiderBenefit(r.individualRiderBenefitUuid);
    if (res?.success) { toasted(true, "Rider removed"); riderBenefits.load(); benefit.load(uuid); }
  });
}
function remove() {
  confirmAction({ title: "Delete this draft policy?", message: "The policy and its riders are removed. This can't be undone.", confirmText: "Delete", tone: "danger" }, async () => {
    const res = await deleteBenefit(uuid);
    if (res?.success) { toasted(true, "Draft policy deleted"); router.push("/life/individual"); }
  });
}
</script>

<template>
  <div class="p-4 md:p-6">
    <div v-if="benefit.error.value && !benefit.loading.value && !benefit.data.value" class="flex flex-col gap-3 items-center px-6 py-16 text-center">
      <p class="text-sm font-semibold text-ink">Couldn't load this policy</p>
      <p class="max-w-md text-sm text-ink-muted">{{ benefit.error.value }}</p>
      <div class="flex gap-2">
        <Button variant="outline" size="sm" @click="router.push('/life/individual')">Back to policies</Button>
        <Button size="sm" @click="benefit.load(uuid)">Try again</Button>
      </div>
    </div>

    <template v-else>
      <PageHeader :title="benefitName(b) || (benefit.loading.value ? 'Loading…' : 'Individual policy')" :subtitle="b.policyNumber ? `Policy ${b.policyNumber} · Individual term life` : 'Individual term life'" back="/life/individual">
        <template v-if="b.status" #badge><StatusBadge :status="b.status" /></template>
        <template #actions>
          <Button v-if="can.remove" variant="ghost" class="!text-error" @click="remove">Delete draft</Button>
          <Button v-if="can.edit" variant="outline" @click="router.push(`/life/individual/${uuid}/edit`)">Edit</Button>
        </template>
      </PageHeader>

      <p v-if="can.edit && b.status" class="px-4 py-2.5 mb-5 text-xs rounded-xl bg-surface-muted text-ink-muted">
        Draft. Issuing the policy (policy number, active cover) isn't available in the system yet (backend gap G11).
      </p>

      <dl class="grid gap-3 mb-5 sm:grid-cols-2 xl:grid-cols-4">
        <div v-for="[label, value] in cards" :key="label" class="px-4 py-3 rounded-2xl border bg-surface border-line shadow-card">
          <dt class="text-xs text-ink-subtle">{{ label }}</dt>
          <dd class="mt-0.5 text-sm font-semibold tabular-nums text-ink">{{ benefit.loading.value && !b.benefitUuid ? "…" : value }}</dd>
        </div>
      </dl>

      <div class="grid gap-5 lg:grid-cols-3">
        <section class="p-5 rounded-2xl border bg-surface border-line shadow-card">
          <h2 class="text-sm font-semibold text-ink">Policy</h2>
          <dl class="grid gap-3 mt-3">
            <div v-for="[label, value] in facts" :key="label" class="flex gap-3 justify-between text-sm">
              <dt class="text-ink-subtle">{{ label }}</dt>
              <dd class="text-right text-ink">{{ value ?? "—" }}</dd>
            </div>
          </dl>
        </section>

        <section class="p-5 rounded-2xl border lg:col-span-2 bg-surface border-line shadow-card">
          <div class="flex flex-wrap gap-3 justify-between items-center">
            <div>
              <h2 class="text-sm font-semibold text-ink">Riders</h2>
              <p class="text-xs text-ink-muted">Premiums are calculated by the system.</p>
            </div>
            <Button v-if="can.riders" size="sm" :disabled="riders.loading.value" @click="editRider()">Add rider</Button>
          </div>
          <ListTable
            bare
            class="mt-4"
            :columns="riderColumns"
            :rows="riderBenefits.data.value"
            row-key="individualRiderBenefitUuid"
            :loading="riderBenefits.loading.value"
            :error="riderBenefits.error.value"
            error-title="Couldn't load riders"
            empty-title="No riders on this policy."
            :skeleton-rows="1"
            @retry="riderBenefits.load()"
          >
            <template #cell-rider="{ row }"><span class="text-ink">{{ riderName(row.riderUuid) }}</span></template>
            <template #cell-benefits="{ row }"><span class="tabular-nums text-ink">{{ formatAmount(row.benefits) }}</span></template>
            <template #cell-premium="{ row }"><span class="tabular-nums text-ink">{{ formatAmount(row.premium) }}</span></template>
            <template #cell-paid="{ row }"><span class="text-ink-muted">{{ row.paid ? "Yes" : "No" }}</span></template>
            <template #cell-status="{ row }"><StatusBadge v-if="row.status" :status="row.status" /></template>
            <template #cell-actions="{ row }">
              <div class="flex gap-1 justify-end">
                <Button variant="ghost" size="sm" @click="editRider(row)">Change</Button>
                <Button variant="ghost" size="sm" class="!text-error" @click="removeRider(row)">Remove</Button>
              </div>
            </template>
          </ListTable>
        </section>
      </div>
      <p class="mt-5 text-xs text-ink-subtle">Beneficiaries, the health questionnaire and the policyholder's KYC need new backend endpoints (gaps G1, G4 and G2).</p>
    </template>
  </div>
</template>
