<script setup>
// Settle a claim (plan 8.3, MAR-46): amount (warning above the reserve), payee locked to the loss
// payee unless changed with a note, payment reference. A 422 lists missing mandatory documents as
// links to the Documents tab; a 403 above authority says a higher limit is needed.
// data: { claim }. Closes with the updated claim.
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { closeModal } from "@customizer/modal-x";
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import Button from "@/components/Button.vue";
import { toasted } from "@/utils/utils";
import MoneyInput from "../components/MoneyInput.vue";
import PartyPicker from "../components/PartyPicker.vue";
import { inputClass, inputBorder } from "../components/styles";
import { settleClaim } from "../api/marineApi";
import { notifyError } from "../api/marineClient";
import { compare } from "../utils/money";

const props = defineProps({ data: { type: Object, required: true } });
const router = useRouter();
const c = props.data.claim;
const amount = ref(c.reserve ?? "");
const payee = ref(c.lossPayee ?? c.payee);
const changingPayee = ref(false);
const payeeNote = ref("");
const paymentRef = ref("");
const errors = ref({});
const missing = ref([]);
const pending = ref(false);
const overReserve = computed(() => c.reserve && amount.value && compare(amount.value, c.reserve) > 0);

async function submit() {
  const e = {};
  if (!(Number(amount.value) > 0)) e.amount = "Amount must be greater than 0";
  if (!payee.value) e.payee = "Payee is required";
  if (c.lossPayee && payee.value?.id !== c.lossPayee.id && !payeeNote.value.trim()) e.payeeNote = "Say why payment doesn't go to the loss payee";
  if (!paymentRef.value.trim()) e.paymentRef = "Payment reference is required";
  errors.value = e;
  missing.value = [];
  if (Object.keys(e).length) return;
  pending.value = true;
  const res = await settleClaim(c.id, { amount: amount.value, payeeId: payee.value.id, payeeNote: payeeNote.value.trim(), paymentRef: paymentRef.value.trim() });
  pending.value = false;
  if (res.ok) {
    toasted(true, `${c.claimNo} paid`);
    return closeModal(res.data);
  }
  if (res.error.code === "MISSING_DOCUMENTS") missing.value = res.error.fields.map((f) => ({ kind: f.field.replace("documents.", ""), message: f.message }));
  else if (res.error.status === 403) errors.value = { form: res.error.message };
  else if (res.error.status === 422) errors.value = res.error.fieldMap();
  else notifyError(res.error);
}
function goToDocuments(kind) {
  closeModal();
  router.replace({ query: { tab: "documents" }, hash: `#doc-${kind}` });
}
</script>

<template>
  <ModalParent>
    <NewFormParent size="md" :title="`Settle ${c.claimNo}`">
      <p v-if="errors.form" role="alert" class="p-3 text-sm font-semibold rounded-xl bg-error-soft text-error-strong">{{ errors.form }}</p>
      <div v-if="missing.length" role="alert" class="p-3 rounded-xl bg-error-soft">
        <p class="text-sm font-semibold text-error-strong">Mandatory documents are missing</p>
        <ul class="mt-1 text-sm"><li v-for="m in missing" :key="m.kind"><a href="#" class="text-error-strong underline" @click.prevent="goToDocuments(m.kind)">{{ m.message }}</a></li></ul>
      </div>
      <label class="flex flex-col gap-1 text-sm font-medium text-ink">
        Amount
        <MoneyInput v-model:amount="amount" :currency="c.currency" lock-currency :invalid="!!errors.amount" />
        <span v-if="errors.amount" class="text-xs text-error">{{ errors.amount }}</span>
        <span v-else-if="overReserve" class="text-xs text-warning-strong">Above the reserve of {{ c.currency }} {{ c.reserve }}.</span>
      </label>
      <div class="flex flex-col gap-1 text-sm font-medium text-ink">
        <span>Payee</span>
        <template v-if="!changingPayee && c.lossPayee">
          <p class="flex justify-between items-center p-2.5 rounded-lg border border-line bg-surface-muted">{{ payee?.name }} <span class="text-xs text-ink-subtle">loss payee</span></p>
          <button type="button" class="self-start text-xs font-medium text-primary hover:underline" @click="changingPayee = true">Pay someone else</button>
        </template>
        <PartyPicker v-else v-model="payee" type="INSURED" :invalid="!!errors.payee" />
        <span v-if="errors.payee" class="text-xs text-error">{{ errors.payee }}</span>
      </div>
      <label v-if="changingPayee && c.lossPayee" class="flex flex-col gap-1 text-sm font-medium text-ink">
        Why not the loss payee
        <input v-model="payeeNote" :class="[inputClass, inputBorder(errors.payeeNote)]" />
        <span v-if="errors.payeeNote" class="text-xs text-error">{{ errors.payeeNote }}</span>
      </label>
      <label class="flex flex-col gap-1 text-sm font-medium text-ink">
        Payment reference
        <input v-model="paymentRef" placeholder="e.g. bank transfer reference" :class="[inputClass, inputBorder(errors.paymentRef)]" />
        <span v-if="errors.paymentRef" class="text-xs text-error">{{ errors.paymentRef }}</span>
      </label>
      <template #bottom>
        <div class="flex gap-2 justify-end p-4 w-full border-t border-line">
          <Button variant="outline" @click="closeModal()">Cancel</Button>
          <Button variant="success" :pending="pending" @click="submit">Settle</Button>
        </div>
      </template>
    </NewFormParent>
  </ModalParent>
</template>
