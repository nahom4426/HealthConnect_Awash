<script setup>
// Review one Potential sanctions match (plan 6.3, MAR-33, MAR-34). data: { screening }.
// Closes with the updated screening.
import { ref } from "vue";
import { closeModal } from "@customizer/modal-x";
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import Button from "@/components/Button.vue";
import { toasted } from "@/utils/utils";
import { inputClass, inputBorder } from "../components/styles";
import { reviewScreening } from "../api/marineApi";
import { notifyError } from "../api/marineClient";
import { formatDateTime } from "../utils/format";

const props = defineProps({ data: { type: Object, required: true } });
const s = props.data.screening;
const decision = ref("");
const note = ref("");
const errors = ref({});
const pending = ref(false);

async function submit() {
  const e = {};
  if (!decision.value) e.decision = "Pick Clear or Confirm match";
  if (note.value.trim().length < 10) e.note = "Write at least 10 characters";
  errors.value = e;
  if (Object.keys(e).length) return;
  pending.value = true;
  const res = await reviewScreening(s.id, { decision: decision.value, note: note.value.trim() });
  pending.value = false;
  if (res.ok) {
    toasted(true, decision.value === "CLEAR" ? `${s.name} cleared` : `Sanctions match confirmed for ${s.name}`);
    closeModal(res.data);
  } else if (res.error.status === 422) errors.value = res.error.fieldMap();
  else notifyError(res.error);
}
</script>

<template>
  <ModalParent>
    <NewFormParent size="md" title="Sanctions review">
      <dl class="grid grid-cols-3 gap-2 p-3 text-sm rounded-xl bg-surface-muted">
        <div><dt class="text-xs text-ink-subtle">Subject</dt><dd class="text-ink">{{ s.type }}</dd></div>
        <div><dt class="text-xs text-ink-subtle">Name</dt><dd class="font-medium text-ink">{{ s.name }}</dd></div>
        <div><dt class="text-xs text-ink-subtle">Identifier</dt><dd class="text-ink">{{ s.identifier || "—" }}</dd></div>
      </dl>
      <table class="w-full text-sm">
        <caption class="mb-1 text-xs font-semibold tracking-wide text-left uppercase text-ink-subtle">Matches, screened {{ formatDateTime(s.screenedAt) }}</caption>
        <thead><tr class="text-xs text-left text-ink-subtle"><th class="py-1">List</th><th class="py-1">Matched name</th><th class="py-1 text-right">Score</th><th class="py-1">Reference</th></tr></thead>
        <tbody>
          <tr v-for="m in s.matches" :key="m.ref" class="border-t border-line">
            <td class="py-1.5">{{ m.list }}</td><td class="py-1.5 font-medium">{{ m.matchedName }}</td><td class="py-1.5 text-right tabular-nums">{{ m.score }}%</td><td class="py-1.5 text-ink-muted">{{ m.ref }}</td>
          </tr>
        </tbody>
      </table>
      <fieldset>
        <legend class="mb-1.5 text-sm font-medium text-ink">Decision <span class="text-error">*</span></legend>
        <div class="grid gap-2 sm:grid-cols-2">
          <label :class="['flex gap-2 items-center p-3 rounded-xl border cursor-pointer', decision === 'CLEAR' ? 'border-success bg-success-soft' : 'border-line']">
            <input v-model="decision" type="radio" value="CLEAR" class="accent-[rgb(var(--primary))]" /> <span class="text-sm text-ink">Clear (false positive)</span>
          </label>
          <label :class="['flex gap-2 items-center p-3 rounded-xl border cursor-pointer', decision === 'CONFIRM' ? 'border-error bg-error-soft' : 'border-line']">
            <input v-model="decision" type="radio" value="CONFIRM" class="accent-[rgb(var(--primary))]" /> <span class="text-sm text-ink">Confirm match</span>
          </label>
        </div>
        <p v-if="errors.decision" class="mt-1 text-xs text-error">{{ errors.decision }}</p>
        <p v-if="decision === 'CONFIRM'" class="mt-2 text-xs text-error-strong">The quote can't be bound once a match is confirmed.</p>
      </fieldset>
      <label class="flex flex-col gap-1 text-sm font-medium text-ink">
        Note <span class="sr-only">(required)</span>
        <textarea v-model="note" rows="3" :class="[inputClass, inputBorder(errors.note), 'h-auto py-2']" placeholder="Why this is or isn't the listed party" />
        <span v-if="errors.note" class="text-xs text-error">{{ errors.note }}</span>
      </label>
      <template #bottom>
        <div class="flex gap-2 justify-end p-4 w-full border-t border-line">
          <Button variant="outline" @click="closeModal()">Cancel</Button>
          <Button :variant="decision === 'CONFIRM' ? 'destructive' : 'primary'" :pending="pending" @click="submit">Save review</Button>
        </div>
      </template>
    </NewFormParent>
  </ModalParent>
</template>
