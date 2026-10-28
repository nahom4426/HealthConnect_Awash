<script setup>
// Issue the group policy from a paid quotation (PUT /policy/issue/{quotationUuid}, PolicyRequest).
// data: { quotation: QuotationResponse }
import { reactive, ref } from "vue";
import { closeModal } from "@customizer/modal-x";
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import Button from "@/components/Button.vue";
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

const field = "w-full px-3 h-10 text-sm rounded-lg border outline-none bg-surface text-ink focus:border-primary focus:ring-2 focus:ring-primary/15";
</script>

<template>
  <ModalParent>
    <NewFormParent size="md" title="Issue policy" :subtitle="`${q.institutionName || ''} · ${q.term || '?'}-year term`">
      <form id="life-issue-policy" class="grid gap-4 p-5" novalidate @submit.prevent="submit">
        <label class="flex flex-col gap-1 text-sm font-medium text-ink">
          Cover starts
          <input v-model="form.beginDate" v-focus="true" type="date" :class="[field, errors.beginDate ? 'border-error' : 'border-line']" />
          <span v-if="errors.beginDate" class="text-xs text-error">{{ errors.beginDate }}</span>
        </label>
        <label class="flex flex-col gap-1 text-sm font-medium text-ink">
          Cover ends
          <input v-model="form.endDate" type="date" :min="form.beginDate" :class="[field, errors.endDate ? 'border-error' : 'border-line']" />
          <span v-if="errors.endDate" class="text-xs text-error">{{ errors.endDate }}</span>
        </label>
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
