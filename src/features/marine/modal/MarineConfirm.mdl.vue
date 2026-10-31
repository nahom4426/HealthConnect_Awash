<script setup>
// Confirm a risky action. data: { title, message, confirmLabel?, danger?, requireReason?, reasonLabel?, details?: [{ label, value }] }
// Closes with { confirmed: true, reason } or nothing when cancelled.
import { ref } from "vue";
import { closeModal } from "@customizer/modal-x";
import ModalParent from "@/components/ModalParent.vue";
import Button from "@/components/Button.vue";
import { inputClass, inputBorder } from "../components/styles";

const props = defineProps({ data: { type: Object, default: () => ({}) } });
const reason = ref("");
const error = ref("");

function confirm() {
  if (props.data.requireReason && !reason.value.trim()) {
    error.value = `${props.data.reasonLabel || "A reason"} is required`;
    return;
  }
  closeModal({ confirmed: true, reason: reason.value.trim() });
}
</script>

<template>
  <ModalParent>
    <div role="alertdialog" aria-labelledby="mc-title" aria-describedby="mc-msg" class="w-[30rem] max-w-full bg-surface">
      <div class="p-5">
        <h2 id="mc-title" class="text-base font-semibold text-ink">{{ data.title }}</h2>
        <p id="mc-msg" class="mt-1 text-sm leading-relaxed text-ink-muted">{{ data.message }}</p>
        <dl v-if="data.details?.length" class="grid grid-cols-2 gap-y-1.5 p-3 mt-3 text-sm rounded-xl bg-surface-muted">
          <template v-for="d in data.details" :key="d.label">
            <dt class="text-ink-muted">{{ d.label }}</dt>
            <dd class="font-semibold text-right tabular-nums text-ink">{{ d.value }}</dd>
          </template>
        </dl>
        <label v-if="data.requireReason" class="flex flex-col gap-1 mt-3 text-sm font-medium text-ink">
          {{ data.reasonLabel || "Reason" }}
          <textarea v-model="reason" rows="3" :class="[inputClass, inputBorder(error), 'h-auto py-2']" />
          <span v-if="error" class="text-xs text-error">{{ error }}</span>
        </label>
      </div>
      <div class="flex gap-2 justify-end px-5 py-3 border-t bg-surface-muted border-line">
        <Button variant="outline" @click="closeModal()">Cancel</Button>
        <Button v-focus="true" :variant="data.danger ? 'destructive' : 'primary'" @click="confirm">{{ data.confirmLabel || "Confirm" }}</Button>
      </div>
    </div>
  </ModalParent>
</template>
