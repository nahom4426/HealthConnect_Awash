<script setup>
// The policyholder of an individual policy: the linked customer and their KYC. Issuing needs a linked
// customer whose kycStatus is VERIFIED. Emits "changed" after a link, edit or KYC decision.
import { computed, watch } from "vue";
import { openModal } from "@customizer/modal-x";
import Button from "@/components/Button.vue";
import StatusBadge from "@/components/StatusBadge.vue";
import { lifeCan } from "@/features/life/privileges";
import { useLifeResource } from "../composables/useLifeResource";
import { formatDate } from "../constants/labels";
import { KycStatus } from "../constants/statuses";
import { customerName, idTypeLabel, kycMissing } from "../individual/customerRules";
import { getCustomer } from "../api/customerApi";

const props = defineProps({
  benefit: { type: Object, required: true },
  draft: { type: Boolean, default: false },
});
const emit = defineEmits(["changed"]);

const customer = useLifeResource(getCustomer);
const c = computed(() => (props.benefit.customerUuid ? customer.data.value || {} : {}));
watch(() => props.benefit.customerUuid, (uuid) => uuid && customer.load(uuid), { immediate: true });

const can = computed(() => ({
  link: props.draft && lifeCan("Life_Quotation_Create"),
  edit: lifeCan("Life_Quotation_Create"),
  decide: c.value.kycStatus !== KycStatus.VERIFIED && lifeCan("Life_Underwriting_Decide"),
}));
const missing = computed(() => kycMissing(c.value));
const facts = computed(() => [
  ["ID", [idTypeLabel(c.value.idType), c.value.idNumber].filter(Boolean).join(" ")],
  ["Phone", c.value.phone],
  ["Date of birth", c.value.dateOfBirth && formatDate(c.value.dateOfBirth)],
  ["Occupation", c.value.occupation],
  ["Region", c.value.region],
]);

function done(changed) {
  if (!changed) return;
  if (props.benefit.customerUuid) customer.load(props.benefit.customerUuid);
  emit("changed");
}
const link = () => openModal("LifePolicyholderForm", { benefit: props.benefit }, done);
const edit = () => openModal("LifePolicyholderForm", { benefit: props.benefit, customer: c.value }, done);
const decide = (decision) => openModal("LifeKycDecision", { customer: c.value, decision }, done);
</script>

<template>
  <section class="p-5 rounded-2xl border bg-surface border-line shadow-card">
    <div class="flex flex-wrap gap-3 justify-between items-start">
      <div>
        <h2 class="text-sm font-semibold text-ink">Policyholder</h2>
        <p class="text-xs text-ink-muted">The customer who owns the policy. Their KYC must be verified before it's issued.</p>
      </div>
      <Button v-if="can.link" size="sm" :variant="benefit.customerUuid ? 'outline' : 'primary'" @click="link">{{ benefit.customerUuid ? "Change" : "Link policyholder" }}</Button>
    </div>

    <p v-if="!benefit.customerUuid" class="mt-4 text-sm text-ink-muted">No policyholder linked yet.</p>
    <p v-else-if="customer.loading.value && !customer.data.value" class="mt-4 text-sm text-ink-muted">Loading…</p>
    <div v-else-if="customer.error.value && !customer.data.value" class="flex gap-3 items-center mt-4 text-sm">
      <span class="text-error">{{ customer.error.value }}</span>
      <Button variant="ghost" size="sm" @click="customer.load(benefit.customerUuid)">Try again</Button>
    </div>
    <template v-else>
      <div class="flex flex-wrap gap-2 items-center mt-4">
        <p class="mr-auto text-sm font-medium text-ink">{{ customerName(c) }}</p>
        <span class="text-xs text-ink-subtle">KYC</span>
        <StatusBadge v-if="c.kycStatus" :status="c.kycStatus" />
      </div>
      <dl class="grid gap-x-6 gap-y-2 mt-3 sm:grid-cols-2">
        <div v-for="[label, value] in facts" :key="label" class="flex gap-3 justify-between text-sm">
          <dt class="text-ink-subtle">{{ label }}</dt>
          <dd class="text-right text-ink">{{ value || "—" }}</dd>
        </div>
      </dl>
      <p v-if="c.kycNote" class="mt-3 text-xs text-ink-muted">KYC note: {{ c.kycNote }}</p>
      <p v-if="c.kycStatus !== 'VERIFIED' && missing.length" class="px-3 py-2 mt-3 text-xs rounded-lg bg-warning-soft text-warning-strong">Needed before KYC can be verified: {{ missing.join(", ") }}.</p>
      <div v-if="can.edit || can.decide" class="flex flex-wrap gap-2 mt-4">
        <Button v-if="can.edit" variant="outline" size="sm" @click="edit">Edit details</Button>
        <template v-if="can.decide">
          <Button size="sm" @click="decide('VERIFIED')">Verify KYC</Button>
          <Button v-if="c.kycStatus !== 'REJECTED'" variant="ghost" size="sm" class="!text-error" @click="decide('REJECTED')">Reject KYC</Button>
        </template>
      </div>
    </template>
  </section>
</template>
