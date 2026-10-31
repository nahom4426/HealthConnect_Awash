<script setup>
// Add or edit a general average or salvage record (plan 8.3, MAR-43).
// data: { claim, kind: "GA" | "SALVAGE", record? }. Closes with the updated claim.
import { reactive, ref } from "vue";
import { closeModal } from "@customizer/modal-x";
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import Button from "@/components/Button.vue";
import { toasted } from "@/utils/utils";
import FormField from "../components/FormField.vue";
import DateField from "../components/DateField.vue";
import MoneyInput from "../components/MoneyInput.vue";
import PartyPicker from "../components/PartyPicker.vue";
import { inputClass, inputBorder } from "../components/styles";
import { saveClaimTask } from "../api/marineApi";
import { notifyError } from "../api/marineClient";
import { todayIso } from "../utils/format";

const props = defineProps({ data: { type: Object, required: true } });
const { claim, kind, record } = props.data;
const ga = kind === "GA";
const form = reactive(
  ga
    ? { declarationDate: record?.declarationDate ?? todayIso(), adjuster: record?.adjuster ?? null, securityType: record?.securityType ?? "GA_BOND", securityAmount: record?.securityAmount ?? "", contributionAmount: record?.contributionAmount ?? "" }
    : { salvor: record?.salvor ?? null, amount: record?.amount ?? "", security: record?.security ?? "", notes: record?.notes ?? "" }
);
const errors = ref({});
const pending = ref(false);

async function save() {
  const e = {};
  if (ga) {
    if (!form.adjuster) e.adjuster = "Adjuster is required";
    if (form.contributionAmount === "") e.contributionAmount = "Contribution is required (0 if none)";
  } else {
    if (!form.salvor) e.salvor = "Salvor is required";
    if (!(Number(form.amount) > 0)) e.amount = "Award or charges must be greater than 0";
  }
  errors.value = e;
  if (Object.keys(e).length) return;
  pending.value = true;
  const body = ga
    ? { kind, id: record?.id, declarationDate: form.declarationDate, adjusterId: form.adjuster.id, securityType: form.securityType, securityAmount: form.securityAmount, contributionAmount: form.contributionAmount }
    : { kind, id: record?.id, salvorId: form.salvor.id, amount: form.amount, security: form.security, notes: form.notes };
  const res = await saveClaimTask(claim.id, body);
  pending.value = false;
  if (res.ok) {
    toasted(true, ga ? "General average saved" : "Salvage saved");
    closeModal(res.data);
  } else if (res.error.status === 422) errors.value = res.error.fieldMap();
  else notifyError(res.error);
}
</script>

<template>
  <ModalParent>
    <NewFormParent size="md" :title="`${record ? 'Edit' : 'Add'} ${ga ? 'general average' : 'salvage'}`">
      <div v-if="ga" class="grid gap-4 sm:grid-cols-2">
        <FormField v-slot="{ id }" label="Declaration date" name="declarationDate"><DateField :id="id" v-model="form.declarationDate" /></FormField>
        <FormField v-slot="{ id, invalid }" label="Adjuster" name="adjuster" required :error="errors.adjuster"><PartyPicker :id="id" v-model="form.adjuster" type="SURVEYOR" :invalid="invalid" /></FormField>
        <FormField v-slot="{ id }" label="Security type" name="securityType">
          <select :id="id" v-model="form.securityType" :class="[inputClass, 'border-line']"><option value="GA_BOND">GA bond</option><option value="GUARANTEE">Guarantee</option></select>
        </FormField>
        <FormField v-slot="{ id }" label="Security amount" name="securityAmount"><MoneyInput :id="id" v-model:amount="form.securityAmount" :currency="claim.currency" lock-currency /></FormField>
        <FormField v-slot="{ id, invalid }" label="Contribution" name="contributionAmount" required :error="errors.contributionAmount"><MoneyInput :id="id" v-model:amount="form.contributionAmount" :currency="claim.currency" lock-currency :invalid="invalid" /></FormField>
        <p class="text-xs sm:col-span-2 text-ink-subtle">Attach the adjuster's statement on the Documents tab.</p>
      </div>
      <div v-else class="grid gap-4 sm:grid-cols-2">
        <FormField v-slot="{ id, invalid }" label="Salvor" name="salvor" required :error="errors.salvor"><PartyPicker :id="id" v-model="form.salvor" type="SURVEYOR" :invalid="invalid" /></FormField>
        <FormField v-slot="{ id, invalid }" label="Award or charges" name="amount" required :error="errors.amount"><MoneyInput :id="id" v-model:amount="form.amount" :currency="claim.currency" lock-currency :invalid="invalid" /></FormField>
        <FormField v-slot="{ id }" label="Security" name="security"><input :id="id" v-model="form.security" :class="[inputClass, 'border-line']" /></FormField>
        <FormField v-slot="{ id }" label="Notes" name="notes" class="sm:col-span-2"><textarea :id="id" v-model="form.notes" rows="2" :class="[inputClass, inputBorder(false), 'h-auto py-2']" /></FormField>
      </div>
      <template #bottom>
        <div class="flex gap-2 justify-end p-4 w-full border-t border-line">
          <Button variant="outline" @click="closeModal()">Cancel</Button>
          <Button :pending="pending" @click="save">Save</Button>
        </div>
      </template>
    </NewFormParent>
  </ModalParent>
</template>
