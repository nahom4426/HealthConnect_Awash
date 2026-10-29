<script setup>
// One individual term policy with its riders. Amounts and premiums are the backend's. Issuing a
// draft (policy number, ACTIVE) needs PUT /benefit/{uuid}/issue (gap G11), so drafts stay drafts here.
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { openModal } from "@customizer/modal-x";
import Button from "@/components/Button.vue";
import { toasted } from "@/utils/utils";
import LifePageHeader from "../../components/LifePageHeader.vue";
import LifeStatusBadge from "../../components/LifeStatusBadge.vue";
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
const can = computed(() => benefitActions(b.value));
benefit.load(uuid);

// GET /individual-rider-benefit/active/benefits isn't filtered by policy (README R2): filter here
const riderBenefits = useLifeResource(getIndividualRiderBenefits, { initial: [], map: (d) => (Array.isArray(d) ? d : []).filter((r) => r.benefitUuid === uuid) });
const riders = useLifeResource(getRiders, { initial: [] });
riderBenefits.load();
riders.load();
const riderName = (id) => riders.data.value.find((r) => r.riderUuid === id)?.riderName || "Rider";

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
      <LifePageHeader :title="benefitName(b) || (benefit.loading.value ? 'Loading…' : 'Individual policy')" :subtitle="b.policyNumber ? `Policy ${b.policyNumber} · Individual term life` : 'Individual term life'" back="/life/individual">
        <template v-if="b.status" #badge><LifeStatusBadge :status="b.status" /></template>
        <template #actions>
          <Button v-if="can.remove" variant="ghost" class="!text-error" @click="remove">Delete draft</Button>
          <Button v-if="can.edit" variant="outline" @click="router.push(`/life/individual/${uuid}/edit`)">Edit</Button>
        </template>
      </LifePageHeader>

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
          <div v-if="riderBenefits.error.value && !riderBenefits.loading.value" class="flex gap-3 items-center mt-4 text-sm text-ink-muted">
            {{ riderBenefits.error.value }} <Button variant="outline" size="sm" @click="riderBenefits.load()">Try again</Button>
          </div>
          <table v-else class="mt-4 w-full text-sm">
            <thead>
              <tr class="text-xs font-semibold tracking-wide text-left uppercase text-ink-subtle">
                <th class="py-2 pr-3">Rider</th>
                <th class="py-2 pr-3 text-right">Benefit</th>
                <th class="py-2 pr-3 text-right">Premium</th>
                <th class="py-2 pr-3">Paid</th>
                <th class="py-2 pr-3">Status</th>
                <th v-if="can.riders" class="py-2"><span class="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="riderBenefits.loading.value"><td :colspan="can.riders ? 6 : 5" class="py-3"><div class="h-4 rounded animate-pulse bg-surface-raised"></div></td></tr>
              <tr v-else-if="!riderBenefits.data.value.length"><td :colspan="can.riders ? 6 : 5" class="py-4 text-sm text-ink-subtle">No riders on this policy.</td></tr>
              <tr v-for="r in riderBenefits.data.value" v-else :key="r.individualRiderBenefitUuid" class="border-t border-line">
                <td class="py-2.5 pr-3 text-ink">{{ riderName(r.riderUuid) }}</td>
                <td class="py-2.5 pr-3 text-right tabular-nums text-ink">{{ formatAmount(r.benefits) }}</td>
                <td class="py-2.5 pr-3 text-right tabular-nums text-ink">{{ formatAmount(r.premium) }}</td>
                <td class="py-2.5 pr-3 text-ink-muted">{{ r.paid ? "Yes" : "No" }}</td>
                <td class="py-2.5 pr-3"><LifeStatusBadge v-if="r.status" :status="r.status" /></td>
                <td v-if="can.riders" class="py-2.5">
                  <div class="flex gap-1 justify-end">
                    <Button variant="ghost" size="sm" @click="editRider(r)">Change</Button>
                    <Button variant="ghost" size="sm" class="!text-error" @click="removeRider(r)">Remove</Button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>
      <p class="mt-5 text-xs text-ink-subtle">Beneficiaries, the health questionnaire and the policyholder's KYC need new backend endpoints (gaps G1, G4 and G2).</p>
    </template>
  </div>
</template>
