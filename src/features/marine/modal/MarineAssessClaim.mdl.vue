<script setup>
// Assess a claim (plan 8.3): covered with a reserve, or not covered with a reason.
// data: { claim }. Closes with the updated claim.
import { ref } from "vue";
import { closeModal } from "@customizer/modal-x";
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import Button from "@/components/Button.vue";
import { toasted } from "@/utils/utils";
import MoneyInput from "../components/MoneyInput.vue";
import { inputClass, inputBorder } from "../components/styles";
import { assessClaim } from "../api/marineApi";
import { notifyError } from "../api/marineClient";

const props = defineProps({ data: { type: Object, required: true } });
const c = props.data.claim;
const covered = ref(null);
const reserve = ref(c.reserve ?? c.estimatedAmount ?? "");
const reason = ref(c.clauseCheck.result === "NOT_COVERED" ? c.clauseCheck.message : "");
const errors = ref({});
const pending = ref(false);

async function submit() {
  const e = {};
  if (covered.value === null) e.covered = "Say whether the loss is covered";
  if (covered.value === true && !(Number(reserve.value) > 0)) e.reserve = "Reserve must be greater than 0";
  if (covered.value === false && reason.value.trim().length < 10) e.reason = "Give a reason of at least 10 characters";
  errors.value = e;
  if (Object.keys(e).length) return;
  pending.value = true;
  const res = await assessClaim(c.id, covered.value ? { covered: true, reserve: reserve.value } : { covered: false, reason: reason.value.trim() });
  pending.value = false;
  if (res.ok) {
    toasted(true, covered.value ? `${c.claimNo} approved` : `${c.claimNo} declined`);
    closeModal(res.data);
  } else if (res.error.status === 422) errors.value = res.error.fieldMap();
  else notifyError(res.error);
}
</script>

<template>
  <ModalParent>
    <NewFormParent size="md" :title="`Assess ${c.claimNo}`">
      <p :class="['p-3 text-sm rounded-xl', c.clauseCheck.result === 'COVERED' ? 'bg-success-soft text-success-strong' : c.clauseCheck.result === 'NOT_COVERED' ? 'bg-error-soft text-error-strong' : 'bg-warning-soft text-warning-strong']">{{ c.clauseCheck.message }}</p>
      <fieldset>
        <legend class="mb-1.5 text-sm font-medium text-ink">Covered? <span class="text-error">*</span></legend>
        <div class="grid gap-2 sm:grid-cols-2">
          <label :class="['flex gap-2 items-center p-3 rounded-xl border cursor-pointer', covered === true ? 'border-success bg-success-soft' : 'border-line']"><input v-model="covered" type="radio" :value="true" class="accent-[rgb(var(--primary))]" /> Yes</label>
          <label :class="['flex gap-2 items-center p-3 rounded-xl border cursor-pointer', covered === false ? 'border-error bg-error-soft' : 'border-line']"><input v-model="covered" type="radio" :value="false" class="accent-[rgb(var(--primary))]" /> No</label>
        </div>
        <p v-if="errors.covered" class="mt-1 text-xs text-error">{{ errors.covered }}</p>
      </fieldset>
      <label v-if="covered === true" class="flex flex-col gap-1 text-sm font-medium text-ink">
        Reserve
        <MoneyInput v-model:amount="reserve" :currency="c.currency" lock-currency :invalid="!!errors.reserve" />
        <span v-if="errors.reserve" class="text-xs text-error">{{ errors.reserve }}</span>
      </label>
      <label v-if="covered === false" class="flex flex-col gap-1 text-sm font-medium text-ink">
        Reason
        <textarea v-model="reason" rows="3" :class="[inputClass, inputBorder(errors.reason), 'h-auto py-2']" />
        <span v-if="errors.reason" class="text-xs text-error">{{ errors.reason }}</span>
      </label>
      <template #bottom>
        <div class="flex gap-2 justify-end p-4 w-full border-t border-line">
          <Button variant="outline" @click="closeModal()">Cancel</Button>
          <Button :variant="covered === false ? 'destructive' : 'primary'" :pending="pending" @click="submit">Confirm</Button>
        </div>
      </template>
    </NewFormParent>
  </ModalParent>
</template>
