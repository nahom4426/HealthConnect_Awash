<script setup>
// Reinsurance treaties linked to a group quotation or policy (policy-treaty mapping).
// Editable on a draft: link an active treaty, unlink.
import { computed, ref } from "vue";
import Button from "@/components/Button.vue";
import { toasted } from "@/utils/utils";
import LifeStatusBadge from "./LifeStatusBadge.vue";
import { useLifeResource } from "../composables/useLifeResource";
import { confirmAction } from "../composables/confirmAction";
import { TreatyStatus } from "../constants/statuses";
import { createPolicyTreatyMapping, deletePolicyTreatyMapping, getPolicyTreatyMappingList, getReinsuranceTreatys } from "../api/reinsuranceApi";

const props = defineProps({
  quotationUuid: { type: String, required: true },
  editable: { type: Boolean, default: false },
});
const emit = defineEmits(["count"]);

// Documented as one object, likely an array (09 §G9 item 4): accept both
const mappings = useLifeResource(() => getPolicyTreatyMappingList(props.quotationUuid), { initial: [], map: (d) => (Array.isArray(d) ? d : d ? [d] : []) });
const treaties = useLifeResource(() => getReinsuranceTreatys({ status: TreatyStatus.ACTIVE, page: 1, limit: 100 }), { initial: [] });
const treatyToAdd = ref("");
const linking = ref(false);
const available = computed(() => (treaties.data.value || []).filter((t) => !mappings.data.value.some((m) => m.reinsuranceTreatyUuid === t.reinsuranceTreatyUuid)));

async function load() {
  await mappings.load();
  emit("count", mappings.data.value.length);
}
load();
if (props.editable) treaties.load();

async function link() {
  if (!treatyToAdd.value) return;
  linking.value = true;
  const res = await createPolicyTreatyMapping({ quotationUuid: props.quotationUuid, reinsuranceTreatyUuid: treatyToAdd.value, status: TreatyStatus.ACTIVE });
  linking.value = false;
  if (res?.success) { toasted(true, "Treaty linked"); treatyToAdd.value = ""; load(); }
}
function unlink(m) {
  confirmAction({ title: `Unlink ${m.treatyCode || "treaty"}?`, message: "Cession for this quotation will no longer use this treaty.", confirmText: "Unlink", tone: "danger" }, async () => {
    const res = await deletePolicyTreatyMapping(m.policyTreatyMappingUuid);
    if (res?.success) { toasted(true, "Treaty unlinked"); load(); }
  });
}
</script>

<template>
  <section class="p-5 rounded-2xl border bg-surface border-line shadow-card">
    <div class="flex flex-wrap gap-3 justify-between items-start">
      <div>
        <h2 class="text-sm font-semibold text-ink">Reinsurance treaty</h2>
        <p class="mt-1 max-w-2xl text-xs text-ink-muted">Members above the treaty's retention are ceded under it. Use “Above retention only” on the Members tab to see who needs the treaty's medical evidence.</p>
      </div>
      <slot name="actions" />
    </div>
    <div v-if="mappings.error.value && !mappings.loading.value" class="flex flex-col gap-3 items-start mt-4">
      <p class="text-sm text-ink-muted">{{ mappings.error.value }}</p>
      <Button variant="outline" size="sm" @click="load">Try again</Button>
    </div>
    <ul v-else class="mt-4 rounded-xl border divide-y border-line divide-line">
      <li v-if="mappings.loading.value" class="px-4 py-3"><div class="w-1/3 h-4 rounded animate-pulse bg-surface-raised"></div></li>
      <li v-else-if="!mappings.data.value.length" class="px-4 py-3 text-sm text-ink-subtle">No treaty linked{{ editable ? " yet" : "" }}.</li>
      <li v-for="m in mappings.data.value" v-else :key="m.policyTreatyMappingUuid" class="flex gap-3 justify-between items-center px-4 py-3">
        <span class="text-sm text-ink">
          <span class="px-2 py-0.5 mr-2 font-mono text-xs font-semibold rounded-md bg-surface-raised">{{ m.treatyCode || "—" }}</span>{{ m.treatyDescription }}
        </span>
        <span class="flex gap-2 items-center">
          <LifeStatusBadge :status="m.status" />
          <Button v-if="editable" variant="ghost" size="sm" class="!text-error" @click="unlink(m)">Unlink</Button>
        </span>
      </li>
    </ul>
    <div v-if="editable" class="flex flex-wrap gap-2 items-center mt-4">
      <select v-model="treatyToAdd" aria-label="Treaty to link" :disabled="treaties.loading.value" class="px-3 min-w-[18rem] h-9 text-sm rounded-lg border outline-none bg-surface border-line text-ink focus:border-primary">
        <option value="">{{ treaties.loading.value ? "Loading treaties…" : available.length ? "Choose an active treaty" : "No other active treaties" }}</option>
        <option v-for="t in available" :key="t.reinsuranceTreatyUuid" :value="t.reinsuranceTreatyUuid">{{ t.treatyCode }} — {{ t.treatyDescription }}</option>
      </select>
      <Button size="sm" :disabled="!treatyToAdd" :pending="linking" @click="link">Link treaty</Button>
    </div>
  </section>
</template>
