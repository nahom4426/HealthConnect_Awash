<script setup>
// Create or edit a reinsurer (ReinsurerRequest). data: { reinsurer?: ReinsurerResponse }
import { reactive, ref } from "vue";
import { closeModal } from "@customizer/modal-x";
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import Button from "@/components/Button.vue";
import { toasted } from "@/utils/utils";
import { createReinsurer, updateReinsurer } from "../api/reinsuranceApi";

const props = defineProps({ data: { type: Object, default: () => ({}) } });
const current = props.data?.reinsurer;
const editing = !!current?.reinsurerUuid;

const FIELDS = [
  { key: "name", label: "Company name", max: 100, required: true, wide: true, placeholder: "e.g. Ethiopian Reinsurance S.C." },
  { key: "email", label: "Email", max: 50, type: "email" },
  { key: "phone", label: "Phone", max: 13, type: "tel", placeholder: "+251…" },
  { key: "address1", label: "Address line 1", max: 50, wide: true },
  { key: "address2", label: "Address line 2", max: 50 },
  { key: "address3", label: "Address line 3", max: 50 },
  { key: "state", label: "City / region", max: 50 },
  { key: "country", label: "Country", max: 50 },
];
const form = reactive(Object.fromEntries(FIELDS.map((f) => [f.key, current?.[f.key] ?? ""])));
const errors = ref({});
const pending = ref(false);

function validate() {
  const e = {};
  for (const f of FIELDS) {
    const v = String(form[f.key] || "").trim();
    if (f.required && !v) e[f.key] = `${f.label} is required`;
    else if (v.length > f.max) e[f.key] = `At most ${f.max} characters`;
  }
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = "Enter a valid email";
  if (form.phone && !/^\+?[\d\s-]{7,13}$/.test(form.phone.trim())) e.phone = "Enter a valid phone number";
  errors.value = e;
  return !Object.keys(e).length;
}

async function submit() {
  if (!validate()) return;
  const body = Object.fromEntries(FIELDS.map((f) => [f.key, String(form[f.key] || "").trim()]));
  if (editing) body.status = current.status;
  pending.value = true;
  const res = editing ? await updateReinsurer(current.reinsurerUuid, body) : await createReinsurer(body);
  pending.value = false;
  if (res?.success) {
    toasted(true, editing ? "Reinsurer updated" : "Reinsurer added");
    closeModal(res.data || true);
  }
}

const field = "w-full px-3 h-10 text-sm rounded-lg border outline-none bg-surface text-ink focus:border-primary focus:ring-2 focus:ring-primary/15";
</script>

<template>
  <ModalParent>
    <NewFormParent size="md" :title="editing ? 'Edit reinsurer' : 'Add reinsurer'" subtitle="Reinsurance company that takes a share of ceded life risk.">
      <form id="life-reinsurer-form" class="grid gap-4 p-5 sm:grid-cols-2" novalidate @submit.prevent="submit">
        <label v-for="(f, i) in FIELDS" :key="f.key" :class="['flex flex-col gap-1 text-sm font-medium text-ink', f.wide ? 'sm:col-span-2' : '']">
          {{ f.label }}
          <input
            v-model="form[f.key]"
            v-focus="i === 0"
            :type="f.type || 'text'"
            :maxlength="f.max"
            :placeholder="f.placeholder"
            :class="[field, errors[f.key] ? 'border-error' : 'border-line']"
          />
          <span v-if="errors[f.key]" class="text-xs text-error">{{ errors[f.key] }}</span>
        </label>
      </form>
      <template #bottom>
        <div class="flex gap-2 justify-end p-4 w-full border-t border-line">
          <Button variant="outline" @click="closeModal()">Cancel</Button>
          <Button html-type="submit" form="life-reinsurer-form" :pending="pending">{{ editing ? "Save changes" : "Add reinsurer" }}</Button>
        </div>
      </template>
    </NewFormParent>
  </ModalParent>
</template>
