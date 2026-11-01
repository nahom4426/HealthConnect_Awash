<script setup>
// Premiums, servicing, documents and history of an issued policy, as tabs (contract 2026-10 G5, G6,
// G7, G13). kind: 'policy' (group, by quotationUuid) or 'benefit' (individual, by benefitUuid).
import { computed, ref } from "vue";
import TabGroup from "@/components/TabGroup.vue";
import { lifeCan } from "@/features/life/privileges";
import PremiumSchedulePanel from "./PremiumSchedulePanel.vue";
import ServicingPanel from "./ServicingPanel.vue";
import DocumentsPanel from "./DocumentsPanel.vue";
import HistoryPanel from "./HistoryPanel.vue";
import { getBenefitHistory, getPolicyHistory } from "../api/policyApi";
import { getPolicySchedulePdf } from "../api/servicingApi";

const props = defineProps({
  kind: { type: String, required: true },
  uuid: { type: String, required: true },
  status: { type: String, default: "" },
  /** issued: the schedule, servicing and the printed schedule exist only once the policy is issued */
  issued: { type: Boolean, default: false },
});
const emit = defineEmits(["changed"]);

const TABS = computed(() => (props.issued ? ["Premiums", "Servicing", "Documents", "History"] : ["Documents", "History"]));
const tab = ref(TABS.value[0]);
const subject = computed(() => (props.kind === "benefit" ? { benefitUuid: props.uuid } : { quotationUuid: props.uuid }));
const history = () => (props.kind === "benefit" ? getBenefitHistory(props.uuid) : getPolicyHistory(props.uuid));
const version = ref(0);
function changed() {
  version.value++;
  emit("changed");
}
const can = {
  pay: lifeCan("Life_Payment_Record"),
  service: lifeCan("Life_Policy_Service"),
  upload: lifeCan(["Life_Quotation_Create", "Life_Policy_Issue", "Life_Policy_Service", "life.document.create"]),
};
</script>

<template>
  <div>
    <TabGroup v-model="tab" :tabs="TABS" class="mb-4" />
    <PremiumSchedulePanel v-if="tab === 'Premiums'" :key="`p${version}`" :subject="subject" :can-pay="can.pay" />
    <ServicingPanel v-if="tab === 'Servicing'" :key="`s${version}`" :kind="kind" :uuid="uuid" :status="status" :can-service="can.service" @changed="changed" />
    <DocumentsPanel v-if="tab === 'Documents'" owner-type="POLICY" :owner-uuid="uuid" :can-upload="can.upload" :schedule="issued ? () => getPolicySchedulePdf(uuid) : null" />
    <HistoryPanel v-if="tab === 'History'" :key="`h${version}`" :fetcher="history" />
  </div>
</template>
