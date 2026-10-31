<script setup>
// Create or edit a port. data: { port?: Port } — with a name it edits. Closes with the saved port.
import { ref } from "vue";
import { closeModal } from "@customizer/modal-x";
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import Button from "@/components/Button.vue";
import { toasted } from "@/utils/utils";
import FormField from "../components/FormField.vue";
import FormErrorBanner from "../components/FormErrorBanner.vue";
import AuditTimeline from "../components/AuditTimeline.vue";
import { inputClass, inputBorder } from "../components/styles";
import { required, useForm } from "../composables/useForm";
import { createPort, updatePort } from "../api/marineApi";
import { notifyError } from "../api/marineClient";

const props = defineProps({ data: { type: Object, default: () => ({}) } });
const p = props.data?.port ?? {};
const editing = !!p.name;
const showAudit = ref(false);

const { form, errors, pending, check, validate, applyServerError, bannerItems, submitted } = useForm(
  { code: p.code ?? "", name: p.name ?? "", country: p.country ?? "" },
  {
    code: (v) => (!/^[A-Z]{2}[A-Z0-9]{3}$/.test(String(v).toUpperCase()) ? "UN/LOCODE is a 2-letter country code and 3 characters, e.g. DJJIB" : ""),
    name: required("Name"),
    country: required("Country"),
  },
  { code: "UN/LOCODE", name: "Name", country: "Country" }
);

async function submit() {
  form.code = form.code.toUpperCase().trim();
  if (!validate()) return;
  pending.value = true;
  const res = editing ? await updatePort(p.code, form) : await createPort(form);
  pending.value = false;
  if (res.ok) {
    toasted(true, editing ? "Port updated" : `${res.data.code} added`);
    closeModal(res.data);
  } else if (!applyServerError(res.error)) notifyError(res.error);
}
</script>

<template>
  <ModalParent>
    <NewFormParent size="md" :title="editing ? `Edit ${p.code}` : 'New port'">
      <FormErrorBanner :items="submitted ? bannerItems() : []" />
      <form id="marine-port-form" class="grid gap-4 sm:grid-cols-2" novalidate @submit.prevent="submit">
        <FormField v-slot="{ id, invalid }" label="UN/LOCODE" name="code" required :error="errors.code">
          <input :id="id" v-model="form.code" v-focus="!editing" maxlength="5" :readonly="editing" :class="[inputClass, inputBorder(invalid), 'uppercase', editing ? 'bg-surface-muted' : '']" @blur="check('code')" />
        </FormField>
        <FormField v-slot="{ id, invalid }" label="Country" name="country" required :error="errors.country">
          <input :id="id" v-model="form.country" :class="[inputClass, inputBorder(invalid)]" @blur="check('country')" />
        </FormField>
        <FormField v-slot="{ id, invalid }" label="Name" name="name" required :error="errors.name" class="sm:col-span-2">
          <input :id="id" v-model="form.name" :class="[inputClass, inputBorder(invalid)]" @blur="check('name')" />
        </FormField>
      </form>
      <div v-if="editing" class="pt-3 border-t border-line">
        <button type="button" class="text-sm font-medium text-primary hover:underline" :aria-expanded="showAudit" @click="showAudit = !showAudit">{{ showAudit ? "Hide" : "Show" }} change history</button>
        <div v-if="showAudit" class="mt-3"><AuditTimeline entity="port" :entity-id="p.code" /></div>
      </div>
      <template #bottom>
        <div class="flex gap-2 justify-end p-4 w-full border-t border-line">
          <Button variant="outline" @click="closeModal()">Cancel</Button>
          <Button html-type="submit" form="marine-port-form" :pending="pending">{{ editing ? "Save changes" : "Add port" }}</Button>
        </div>
      </template>
    </NewFormParent>
  </ModalParent>
</template>
