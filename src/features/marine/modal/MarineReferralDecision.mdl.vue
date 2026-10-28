<script setup>
// Approve or decline a referral (plan 6.3). data: { referral, escalate } — with escalate the
// approval goes to a senior underwriter instead. Closes with the decided referral.
import { computed, ref } from "vue";
import { closeModal } from "@customizer/modal-x";
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import Button from "@/components/Button.vue";
import { toasted } from "@/utils/utils";
import { inputClass, inputBorder } from "../components/styles";
import { decideReferral } from "../api/marineApi";
import { notifyError } from "../api/marineClient";

const props = defineProps({ data: { type: Object, required: true } });
const r = props.data.referral;
const authority = r.authority ?? {};
const breached = computed(() => (r.quote.checks?.warranties ?? []).filter((w) => w.result === "BREACH"));
const decision = ref(props.data.initial ?? "");
const note = ref("");
const rateOverridePct = ref("");
const waive = ref([]);
const errors = ref({});
const pending = ref(false);

const approveLabel = computed(() => (props.data.escalate ? "Send to senior underwriter" : "Approve"));

async function submit() {
  const e = {};
  if (!decision.value) e.decision = "Pick Approve or Decline";
  if (decision.value === "DECLINE" && note.value.trim().length < 10) e.note = "A note of at least 10 characters is required to decline";
  if (rateOverridePct.value && !(Number(rateOverridePct.value) > 0)) e.rateOverridePct = "Rate must be greater than 0";
  errors.value = e;
  if (Object.keys(e).length) return;
  pending.value = true;
  const body =
    decision.value === "APPROVE" && props.data.escalate
      ? { decision: "ESCALATE", note: note.value.trim() }
      : { decision: decision.value, note: note.value.trim(), rateOverridePct: rateOverridePct.value || null, waiveWarrantyIds: waive.value };
  const res = await decideReferral(r.id, body);
  pending.value = false;
  if (res.ok) {
    toasted(true, body.decision === "ESCALATE" ? `${r.quoteNo} sent to a senior underwriter` : `${r.quoteNo} ${decision.value === "APPROVE" ? "approved" : "declined"}`);
    closeModal(res.data);
  } else if (res.error.status === 403) {
    errors.value = { form: res.error.message };
  } else if (res.error.status === 422) errors.value = res.error.fieldMap();
  else notifyError(res.error);
}
</script>

<template>
  <ModalParent>
    <NewFormParent size="md" :title="`Decide referral for ${r.quoteNo}`">
      <p v-if="errors.form" role="alert" class="p-3 text-sm rounded-xl bg-error-soft text-error-strong">{{ errors.form }}</p>
      <fieldset>
        <legend class="mb-1.5 text-sm font-medium text-ink">Decision <span class="text-error">*</span></legend>
        <div class="grid gap-2 sm:grid-cols-2">
          <label :class="['flex gap-2 items-center p-3 rounded-xl border cursor-pointer', decision === 'APPROVE' ? 'border-success bg-success-soft' : 'border-line']">
            <input v-model="decision" type="radio" value="APPROVE" class="accent-[rgb(var(--primary))]" /> <span class="text-sm text-ink">{{ approveLabel }}</span>
          </label>
          <label :class="['flex gap-2 items-center p-3 rounded-xl border cursor-pointer', decision === 'DECLINE' ? 'border-error bg-error-soft' : 'border-line']">
            <input v-model="decision" type="radio" value="DECLINE" class="accent-[rgb(var(--primary))]" /> <span class="text-sm text-ink">Decline</span>
          </label>
        </div>
        <p v-if="errors.decision" class="mt-1 text-xs text-error">{{ errors.decision }}</p>
      </fieldset>
      <label class="flex flex-col gap-1 text-sm font-medium text-ink">
        Note {{ decision === "DECLINE" ? "(required)" : "(optional)" }}
        <textarea v-model="note" rows="3" :class="[inputClass, inputBorder(errors.note), 'h-auto py-2']" placeholder="Shown to the quote owner on the quote" />
        <span v-if="errors.note" class="text-xs text-error">{{ errors.note }}</span>
      </label>
      <template v-if="decision === 'APPROVE' && !data.escalate">
        <label v-if="authority.canOverrideRate" class="flex flex-col gap-1 text-sm font-medium text-ink">
          Rate override % (optional)
          <input v-model="rateOverridePct" inputmode="decimal" placeholder="e.g. 0.3000" :class="[inputClass, inputBorder(errors.rateOverridePct), '!w-40 tabular-nums']" />
          <span class="text-xs text-ink-subtle">Premium is recalculated on approval.</span>
          <span v-if="errors.rateOverridePct" class="text-xs text-error">{{ errors.rateOverridePct }}</span>
        </label>
        <fieldset v-if="authority.canWaiveWarranty && breached.length">
          <legend class="mb-1 text-sm font-medium text-ink">Waive warranty</legend>
          <label v-for="w in breached" :key="w.id" class="flex gap-2 items-center text-sm text-ink">
            <input v-model="waive" type="checkbox" :value="w.id" class="accent-[rgb(var(--primary))]" /> {{ w.name }} <span class="text-xs text-ink-subtle">({{ w.detail }})</span>
          </label>
        </fieldset>
      </template>
      <template #bottom>
        <div class="flex gap-2 justify-end p-4 w-full border-t border-line">
          <Button variant="outline" @click="closeModal()">Cancel</Button>
          <Button :variant="decision === 'DECLINE' ? 'destructive' : 'primary'" :pending="pending" @click="submit">Confirm</Button>
        </div>
      </template>
    </NewFormParent>
  </ModalParent>
</template>
