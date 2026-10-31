<script setup>
// Survey tab (plan 8.3, MAR-42): appoint the surveyor with a due date (that sets the survey
// deadline), then record findings and fee and upload the report, which closes the deadline.
import { reactive, ref, watch } from "vue";
import Button from "@/components/Button.vue";
import { toasted } from "@/utils/utils";
import FormField from "../FormField.vue";
import DateField from "../DateField.vue";
import MoneyInput from "../MoneyInput.vue";
import PartyPicker from "../PartyPicker.vue";
import FileUploader from "../FileUploader.vue";
import { cardClass, inputClass, inputBorder } from "../styles";
import { saveClaimTask, uploadClaimDocument } from "../../api/marineApi";
import { notifyError } from "../../api/marineClient";
import { addDays, formatDateTime, todayIso } from "../../utils/format";
import { formatSize } from "../../utils/files";

const props = defineProps({ claim: { type: Object, required: true }, canWork: { type: Boolean, default: false } });
const emit = defineEmits(["updated"]);
const form = reactive({});
const errors = ref({});
const pending = ref(false);

function reset() {
  const s = props.claim.survey;
  Object.assign(form, {
    surveyor: s?.surveyor ?? null,
    appointedDate: s?.appointedDate ?? todayIso(),
    dueDate: s?.dueDate ?? addDays(todayIso(), 7),
    surveyDate: s?.surveyDate ?? "",
    findings: s?.findings ?? "",
    fee: s?.fee ?? "",
  });
}
watch(() => props.claim.survey, reset, { immediate: true });

async function save() {
  const e = {};
  if (!form.surveyor) e.surveyor = "Surveyor is required";
  if (form.dueDate <= form.appointedDate) e.dueDate = "Due date must be after the appointed date";
  errors.value = e;
  if (Object.keys(e).length) return;
  pending.value = true;
  const { surveyor, ...rest } = form;
  const res = await saveClaimTask(props.claim.id, { kind: "SURVEY", ...rest, surveyorId: surveyor.id });
  pending.value = false;
  if (res.ok) {
    toasted(true, props.claim.survey ? "Survey saved" : "Surveyor appointed");
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
const files = (kind) => props.claim.documents.filter((d) => d.kind === kind);
</script>

<template>
  <div class="grid gap-4">
    <section :class="[cardClass, 'p-4']">
      <h3 class="mb-3 text-sm font-semibold text-ink">{{ claim.survey ? "Survey" : "Appoint a surveyor" }}</h3>
      <fieldset :disabled="!canWork" class="grid gap-4 sm:grid-cols-2">
        <FormField v-slot="{ id, invalid }" label="Surveyor" name="surveyor" required :error="errors.surveyor"><PartyPicker :id="id" v-model="form.surveyor" type="SURVEYOR" :invalid="invalid" /></FormField>
        <FormField v-slot="{ id }" label="Appointed" name="appointedDate"><DateField :id="id" v-model="form.appointedDate" /></FormField>
        <FormField v-slot="{ id, invalid }" label="Report due" name="dueDate" required :error="errors.dueDate" hint="Sets the survey deadline"><DateField :id="id" v-model="form.dueDate" :min="addDays(form.appointedDate, 1)" :invalid="invalid" /></FormField>
        <FormField v-slot="{ id }" label="Survey date" name="surveyDate"><DateField :id="id" v-model="form.surveyDate" /></FormField>
        <FormField v-slot="{ id, invalid }" label="Fee" name="fee" :error="errors.fee"><MoneyInput :id="id" v-model:amount="form.fee" :currency="claim.currency" lock-currency :invalid="invalid" /></FormField>
        <FormField v-slot="{ id }" label="Findings" name="findings" class="sm:col-span-2"><textarea :id="id" v-model="form.findings" rows="3" :class="[inputClass, 'border-line h-auto py-2']" /></FormField>
        <div v-if="canWork" class="flex justify-end sm:col-span-2"><Button :pending="pending" @click="save">{{ claim.survey ? "Save survey" : "Appoint surveyor" }}</Button></div>
      </fieldset>
    </section>

    <section v-if="claim.survey" :class="[cardClass, 'p-4 grid gap-4 sm:grid-cols-2']">
      <div>
        <h3 class="mb-1 text-sm font-semibold text-ink">Survey report</h3>
        <p v-if="claim.survey.reportReceivedAt" class="mb-2 text-sm text-success-strong">Received {{ formatDateTime(claim.survey.reportReceivedAt) }}</p>
        <ul class="mb-2 text-sm"><li v-for="f in files('SURVEY_REPORT')" :key="f.id">{{ f.name }} <span class="text-xs text-ink-subtle">{{ formatSize(f.size) }}</span></li></ul>
        <FileUploader v-if="canWork" :upload="upload('SURVEY_REPORT')" kind="SURVEY_REPORT" :multiple="false" accept=".pdf,application/pdf" label="Upload the report (PDF)" @uploaded="emit('updated', $event)" />
      </div>
      <div>
        <h3 class="mb-1 text-sm font-semibold text-ink">Photos</h3>
        <ul class="mb-2 text-sm"><li v-for="f in files('PHOTO')" :key="f.id">{{ f.name }} <span class="text-xs text-ink-subtle">{{ formatSize(f.size) }}</span></li></ul>
        <FileUploader v-if="canWork" :upload="upload('PHOTO')" kind="PHOTO" accept=".jpg,.jpeg,.png,image/jpeg,image/png" label="Add photos (JPG or PNG)" @uploaded="emit('updated', $event)" />
      </div>
    </section>
  </div>
</template>
