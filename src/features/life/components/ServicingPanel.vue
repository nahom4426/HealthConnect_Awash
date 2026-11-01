<script setup>
// Servicing an issued policy (contract 2026-10, G5): cancel, lapse, reinstate, renew, and endorsements
// with the pro-rata premium the backend works out. kind: 'policy' (group, by quotationUuid) or
// 'benefit' (individual, by benefitUuid).
import { computed } from "vue";
import { useRouter } from "vue-router";
import { openModal } from "@customizer/modal-x";
import Button from "@/components/Button.vue";
import ListTable from "@/components/ListTable.vue";
import { useLifeResource } from "../composables/useLifeResource";
import { formatAmount, formatDate } from "../constants/labels";
import { SERVICING, endorsementLabel, servicingActions } from "../servicing/servicingRules";
import { getEndorsements } from "../api/servicingApi";

const props = defineProps({
  kind: { type: String, required: true },
  uuid: { type: String, required: true },
  status: { type: String, default: "" },
  canService: { type: Boolean, default: false },
});
const emit = defineEmits(["changed"]);
const router = useRouter();

const endorsements = useLifeResource(() => getEndorsements(props.kind, props.uuid), { initial: [], map: (d) => (Array.isArray(d) ? d : []) });
endorsements.load();

const allowed = computed(() => servicingActions(props.status));
const actions = computed(() => Object.keys(SERVICING).filter((a) => props.canService && allowed.value[a]));
const canEndorse = computed(() => props.canService && props.status === "ACTIVE");

function act(action) {
  openModal("LifeServicingAction", { kind: props.kind, uuid: props.uuid, action }, (res) => {
    if (!res) return;
    emit("changed");
    if (action === "renew" && res.renewalUuid) router.push(props.kind === "benefit" ? `/life/individual/${res.renewalUuid}` : `/life/quotations/${res.renewalUuid}`);
  });
}
const endorse = () => openModal("LifeEndorsement", { kind: props.kind, uuid: props.uuid }, (done) => done && (endorsements.load(), emit("changed")));

const columns = [
  { key: "type", label: "Endorsement" },
  { key: "effectiveDate", label: "Effective" },
  { key: "adjustment", label: "Premium adjustment", align: "right" },
  { key: "detail", label: "Detail" },
];
defineExpose({ reload: () => endorsements.load() });
</script>

<template>
  <section class="p-5 rounded-2xl border bg-surface border-line shadow-card">
    <div class="flex flex-wrap gap-3 justify-between items-start">
      <div>
        <h2 class="text-sm font-semibold text-ink">Servicing</h2>
        <p class="text-xs text-ink-muted">Changes to an issued policy. Refunds and premium adjustments are calculated by the system.</p>
      </div>
      <div v-if="actions.length || canEndorse" class="flex flex-wrap gap-2">
        <Button v-if="canEndorse" size="sm" variant="outline" @click="endorse">New endorsement</Button>
        <Button v-for="a in actions" :key="a" size="sm" :variant="SERVICING[a].tone === 'danger' ? 'ghost' : 'outline'" :class="SERVICING[a].tone === 'danger' && '!text-error'" @click="act(a)">{{ SERVICING[a].title }}</Button>
      </div>
    </div>
    <p v-if="!canService" class="mt-2 text-xs text-ink-subtle">Only a policy administrator can service policies.</p>
    <ListTable bare class="mt-3" :columns="columns" :rows="endorsements.data.value" row-key="endorsementUuid" :loading="endorsements.loading.value" :error="endorsements.error.value" error-title="Couldn't load endorsements" empty-title="No endorsements." :skeleton-rows="1" @retry="endorsements.load()">
      <template #cell-type="{ row }"><span class="text-ink">{{ endorsementLabel(row.type) }}</span></template>
      <template #cell-effectiveDate="{ row }"><span class="whitespace-nowrap text-ink-muted">{{ formatDate(row.effectiveDate) }}</span></template>
      <template #cell-adjustment="{ row }"><span class="tabular-nums text-ink">{{ row.premiumAdjustment != null ? formatAmount(row.premiumAdjustment) : "—" }}</span></template>
      <template #cell-detail="{ row }"><span class="text-ink-muted">{{ [row.detail, row.note].filter(Boolean).join(" · ") || "—" }}</span></template>
    </ListTable>
  </section>
</template>
