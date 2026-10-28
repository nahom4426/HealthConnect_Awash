<script setup>
// Create or edit a party (insured, consignee, bank, broker, carrier, surveyor).
// data: { party?: Party } — with an id it edits. Closes with the saved party.
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
import { emailRule, required, useForm } from "../composables/useForm";
import { createParty, updateParty } from "../api/marineApi";
import { notifyError } from "../api/marineClient";
import { PARTY_TYPES, partyTypeLabel } from "../constants";

const props = defineProps({ data: { type: Object, default: () => ({}) } });
const p = props.data?.party ?? {};
const editing = !!p.id;
const showAudit = ref(false);

const { form, errors, pending, check, validate, applyServerError, bannerItems, submitted } = useForm(
  { name: p.name ?? "", types: p.types ?? [], tin: p.tin ?? "", phone: p.phone ?? "", email: p.email ?? "", address: p.address ?? "", contactPerson: p.contactPerson ?? "" },
  {
    name: required("Name"),
    types: (v) => (v.length ? "" : "Pick at least one type"),
    tin: (v) => (v && !/^\d{10}$/.test(v) ? "TIN is 10 digits" : ""),
    email: emailRule,
  },
  { name: "Name", types: "Type", tin: "TIN", email: "Email" }
);

function toggleType(t) {
  form.types = form.types.includes(t) ? form.types.filter((x) => x !== t) : [...form.types, t];
  if (submitted.value) check("types");
}

async function submit() {
  if (!validate()) return;
  pending.value = true;
  const body = { ...form, name: form.name.trim() };
  const res = editing ? await updateParty(p.id, body) : await createParty(body);
  pending.value = false;
  if (res.ok) {
    toasted(true, editing ? "Party updated" : `${res.data.name} added`);
    closeModal(res.data);
  } else if (!applyServerError(res.error)) notifyError(res.error);
}
</script>

<template>
  <ModalParent>
    <NewFormParent size="md" :title="editing ? `Edit ${p.name}` : 'New party'">
      <FormErrorBanner :items="submitted ? bannerItems() : []" />
      <form id="marine-party-form" class="grid gap-4 sm:grid-cols-2" novalidate @submit.prevent="submit">
        <FormField v-slot="{ id, invalid }" label="Name" name="name" required :error="errors.name" class="sm:col-span-2">
          <input :id="id" v-model="form.name" v-focus="true" maxlength="200" :aria-invalid="invalid || undefined" :class="[inputClass, inputBorder(invalid)]" @blur="check('name')" />
        </FormField>
        <FormField label="Type" name="types" required :error="errors.types" class="sm:col-span-2">
          <div class="flex flex-wrap gap-2" role="group" aria-label="Party type">
            <label v-for="t in PARTY_TYPES" :key="t" :class="['inline-flex gap-1.5 items-center px-3 h-9 text-sm rounded-lg border cursor-pointer', form.types.includes(t) ? 'border-primary bg-primary/5 text-primary' : 'border-line text-ink']">
              <input type="checkbox" class="accent-[rgb(var(--primary))]" :checked="form.types.includes(t)" @change="toggleType(t)" />
              {{ partyTypeLabel(t) }}
            </label>
          </div>
        </FormField>
        <FormField v-slot="{ id, invalid }" label="TIN" name="tin" :error="errors.tin" hint="10 digits">
          <input :id="id" v-model="form.tin" inputmode="numeric" maxlength="10" :class="[inputClass, inputBorder(invalid), 'tabular-nums']" @blur="check('tin')" />
        </FormField>
        <FormField v-slot="{ id }" label="Phone" name="phone">
          <input :id="id" v-model="form.phone" type="tel" :class="[inputClass, 'border-line']" />
        </FormField>
        <FormField v-slot="{ id, invalid }" label="Email" name="email" :error="errors.email">
          <input :id="id" v-model="form.email" type="email" :class="[inputClass, inputBorder(invalid)]" @blur="check('email')" />
        </FormField>
        <FormField v-slot="{ id }" label="Contact person" name="contactPerson">
          <input :id="id" v-model="form.contactPerson" :class="[inputClass, 'border-line']" />
        </FormField>
        <FormField v-slot="{ id }" label="Address" name="address" class="sm:col-span-2">
          <input :id="id" v-model="form.address" :class="[inputClass, 'border-line']" />
        </FormField>
      </form>
      <div v-if="editing" class="pt-3 border-t border-line">
        <button type="button" class="text-sm font-medium text-primary hover:underline" :aria-expanded="showAudit" @click="showAudit = !showAudit">{{ showAudit ? "Hide" : "Show" }} change history</button>
        <div v-if="showAudit" class="mt-3"><AuditTimeline entity="party" :entity-id="p.id" /></div>
      </div>
      <template #bottom>
        <div class="flex gap-2 justify-end p-4 w-full border-t border-line">
          <Button variant="outline" @click="closeModal()">Cancel</Button>
          <Button html-type="submit" form="marine-party-form" :pending="pending">{{ editing ? "Save changes" : "Add party" }}</Button>
        </div>
      </template>
    </NewFormParent>
  </ModalParent>
</template>
