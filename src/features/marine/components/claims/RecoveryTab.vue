<script setup>
// Carrier recovery tab (plan 8.3, MAR-44): the notice date closes the carrier notice deadline.
import { reactive, ref, watch } from "vue";
import Button from "@/components/Button.vue";
import { toasted } from "@/utils/utils";
import FormField from "../FormField.vue";
import DateField from "../DateField.vue";
import MoneyInput from "../MoneyInput.vue";
import PartyPicker from "../PartyPicker.vue";
import FileUploader from "../FileUploader.vue";
import StatusBadge from "../StatusBadge.vue";
import { cardClass, inputClass } from "../styles";
import { saveClaimTask, uploadClaimDocument } from "../../api/marineApi";
import { notifyError } from "../../api/marineClient";
import { compare } from "../../utils/money";
import { formatSize } from "../../utils/files";

const props = defineProps({ claim: { type: Object, required: true }, canWork: { type: Boolean, default: false } });
const emit = defineEmits(["updated"]);
const form = reactive({});
const errors = ref({});
const pending = ref(false);
const STATUSES = [
  { value: "OPEN", label: "Open" },
  { value: "RECOVERED", label: "Recovered" },
  { value: "PARTLY_RECOVERED", label: "Partly recovered" },
  { value: "WRITTEN_OFF", label: "Written off" },
];

watch(
  () => props.claim.recovery,
  (r) =>
    Object.assign(form, {
      carrier: r?.carrier ?? null,
      noticeSentDate: r?.noticeSentDate ?? "",
      amountClaimed: r?.amountClaimed ?? "",
      amountRecovered: r?.amountRecovered ?? "",
      status: r?.status ?? "OPEN",
      notes: r?.notes ?? "",
    }),
  { immediate: true }
);

async function save() {
  const e = {};
  if (!form.carrier) e.carrier = "Carrier is required";
  if (form.amountRecovered && form.amountClaimed && compare(form.amountRecovered, form.amountClaimed) > 0) e.amountRecovered = "Recovered can't be more than claimed";
  errors.value = e;
  if (Object.keys(e).length) return;
  pending.value = true;
  const { carrier, ...rest } = form;
  const res = await saveClaimTask(props.claim.id, { kind: "RECOVERY", ...rest, carrierId: carrier.id });
  pending.value = false;
  if (res.ok) {
    toasted(true, "Recovery saved");
    emit("updated", res.data);
  } else if (res.error.status === 422) errors.value = res.error.fieldMap();
  else notifyError(res.error);
}
const upload = (kind) => (file, _k, onProgress) => {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("kind", kind);
  return uploadClaimDocument(props.claim.id, fd, onProgress);
};
</script>

<template>
  <section :class="[cardClass, 'p-4']">
    <div class="flex justify-between items-center mb-3">
      <h3 class="text-sm font-semibold text-ink">Carrier recovery</h3>
      <StatusBadge v-if="claim.recovery" entity="recovery" :status="claim.recovery.status" />
    </div>
    <fieldset :disabled="!canWork" class="grid gap-4 sm:grid-cols-2">
      <FormField v-slot="{ id, invalid }" label="Carrier" name="carrier" required :error="errors.carrier"><PartyPicker :id="id" v-model="form.carrier" type="CARRIER" :invalid="invalid" /></FormField>
      <FormField v-slot="{ id }" label="Notice sent" name="noticeSentDate" hint="Marks the carrier notice deadline met"><DateField :id="id" v-model="form.noticeSentDate" /></FormField>
      <FormField v-slot="{ id }" label="Amount claimed" name="amountClaimed"><MoneyInput :id="id" v-model:amount="form.amountClaimed" :currency="claim.currency" lock-currency /></FormField>
      <FormField v-slot="{ id, invalid }" label="Amount recovered" name="amountRecovered" :error="errors.amountRecovered"><MoneyInput :id="id" v-model:amount="form.amountRecovered" :currency="claim.currency" lock-currency :invalid="invalid" /></FormField>
      <FormField v-slot="{ id }" label="Status" name="status"><select :id="id" v-model="form.status" :class="[inputClass, 'border-line']"><option v-for="s in STATUSES" :key="s.value" :value="s.value">{{ s.label }}</option></select></FormField>
      <FormField v-slot="{ id }" label="Notes" name="notes" class="sm:col-span-2"><textarea :id="id" v-model="form.notes" rows="2" :class="[inputClass, 'border-line h-auto py-2']" /></FormField>
      <div v-if="canWork" class="flex justify-end sm:col-span-2"><Button :pending="pending" @click="save">Save recovery</Button></div>
    </fieldset>
    <div v-if="claim.recovery" class="grid gap-4 pt-4 mt-4 border-t sm:grid-cols-2 border-line">
      <div>
        <h4 class="mb-1 text-sm font-semibold text-ink">Notice letter</h4>
        <ul class="mb-2 text-sm"><li v-for="f in claim.documents.filter((d) => d.kind === 'CARRIER_NOTICE')" :key="f.id">{{ f.name }} <span class="text-xs text-ink-subtle">{{ formatSize(f.size) }}</span></li></ul>
        <FileUploader v-if="canWork" :upload="upload('CARRIER_NOTICE')" kind="CARRIER_NOTICE" :multiple="false" label="Upload the notice or protest letter" @uploaded="emit('updated', $event)" />
      </div>
      <div>
        <h4 class="mb-1 text-sm font-semibold text-ink">Evidence</h4>
        <ul class="mb-2 text-sm"><li v-for="f in claim.documents.filter((d) => d.kind === 'RECOVERY_EVIDENCE')" :key="f.id">{{ f.name }}</li></ul>
        <FileUploader v-if="canWork" :upload="upload('RECOVERY_EVIDENCE')" kind="RECOVERY_EVIDENCE" label="Add evidence" @uploaded="emit('updated', $event)" />
      </div>
    </div>
  </section>
</template>
