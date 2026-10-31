<script setup>
// Issue the group policy from a paid quotation (PUT /policy/issue/{quotationUuid}, PolicyRequest).
// data: { quotation: QuotationResponse }
import { reactive, ref } from "vue";
import { closeModal } from "@customizer/modal-x";
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import Button from "@/components/Button.vue";
import TextField from "@/components/fields/TextField.vue";
import { toasted } from "@/utils/utils";
import { issuePolicy } from "../api/policyApi";
import { toDateInput } from "../constants/labels";
import { toPolicyRequest, validatePolicyDates } from "../quotations/quotationRules";

const props = defineProps({ data: { type: Object, default: () => ({}) } });
const q = props.data?.quotation || {};

const form = reactive({ beginDate: toDateInput(q.beginDate), endDate: toDateInput(q.endDate) });
const errors = ref({});
const pending = ref(false);

async function submit() {
  errors.value = validatePolicyDates(form);
  if (Object.keys(errors.value).length) return;
  pending.value = true;
  const res = await issuePolicy(q.quotationUuid, toPolicyRequest(form));
  pending.value = false;
  if (res?.success) {
    toasted(true, "Policy issued");
    closeModal(res.data || true);
  }
}
</script>

<template>
  <ModalParent>
    <NewFormParent size="md" title="Issue policy" :subtitle="`${q.institutionName || ''} · ${q.term || '?'}-year term`">
      <form id="life-issue-policy" class="grid gap-4 p-5" novalidate @submit.prevent="submit">
        <TextField v-model="form.beginDate" label="Cover starts" focus type="date" :error="errors.beginDate" />
        <TextField v-model="form.endDate" label="Cover ends" type="date" :min="form.beginDate" :error="errors.endDate" />
        <p class="text-xs text-ink-subtle">Members and riders on the quotation are covered from the start date. This can't be undone.</p>
      </form>
      <template #bottom>
        <div class="flex gap-2 justify-end p-4 w-full border-t border-line">
          <Button variant="outline" @click="closeModal()">Cancel</Button>
          <Button html-type="submit" form="life-issue-policy" :pending="pending">Issue policy</Button>
        </div>
      </template>
    </NewFormParent>
  </ModalParent>
</template>
