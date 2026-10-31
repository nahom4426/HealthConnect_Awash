<script setup>
// Edit a treaty's terms (PUT /reinsurance/treaty/{uuid}). data: { treaty: ReinsuranceTreatyResponse }
import { reactive, ref } from "vue";
import { closeModal } from "@customizer/modal-x";
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import Button from "@/components/Button.vue";
import { toasted } from "@/utils/utils";
import TreatyTermsFields from "../components/TreatyTermsFields.vue";
import { toDateInput, toDateTime } from "../constants/labels";
import { validateTreaty } from "../reinsurance/treatyRules";
import { updateReinsuranceTreaty } from "../api/reinsuranceApi";

const props = defineProps({ data: { type: Object, required: true } });
const t = props.data.treaty;
const form = reactive({
  treatyCode: t.treatyCode ?? "", treatyType: t.treatyType ?? "", reinsuranceCoverage: t.reinsuranceCoverage ?? "",
  retationLimit: t.retationLimit ?? "", riderRetentionLimit: t.riderRetentionLimit ?? "", policyCession: t.policyCession ?? "",
  beginDate: toDateInput(t.beginDate), endDate: toDateInput(t.endDate), treatyDescription: t.treatyDescription ?? "",
});
const errors = ref({});
const pending = ref(false);

async function submit() {
  errors.value = validateTreaty(form);
  if (Object.keys(errors.value).length) return;
  pending.value = true;
  const res = await updateReinsuranceTreaty(t.reinsuranceTreatyUuid, {
    ...form,
    treatyCode: form.treatyCode.trim(),
    retationLimit: Number(form.retationLimit), riderRetentionLimit: Number(form.riderRetentionLimit), policyCession: Number(form.policyCession),
    beginDate: toDateTime(form.beginDate), endDate: toDateTime(form.endDate),
    status: t.status,
  });
  pending.value = false;
  if (res?.success) { toasted(true, "Treaty updated"); closeModal(res.data || true); }
}
</script>

<template>
  <ModalParent>
    <NewFormParent size="lg" title="Edit treaty terms" :subtitle="t.treatyCode">
      <form id="life-treaty-form" class="p-5" novalidate @submit.prevent="submit">
        <TreatyTermsFields :form="form" :errors="errors" />
      </form>
      <template #bottom>
        <div class="flex gap-2 justify-end p-4 w-full border-t border-line">
          <Button variant="outline" @click="closeModal()">Cancel</Button>
          <Button html-type="submit" form="life-treaty-form" :pending="pending">Save changes</Button>
        </div>
      </template>
    </NewFormParent>
  </ModalParent>
</template>
