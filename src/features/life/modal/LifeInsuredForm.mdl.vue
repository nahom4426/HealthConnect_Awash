<script setup>
// Add or edit one member on a group quotation (InsuredRequest). The backend prices the member.
// data: { quotation: QuotationResponse, insured?: InsuredResponse }
import { reactive, ref } from "vue";
import { closeModal } from "@customizer/modal-x";
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import Button from "@/components/Button.vue";
import { toasted } from "@/utils/utils";
import { createInsuredPerson, updateInsuredPerson } from "../api/quotationApi";
import { GENDERS, fromInsured, toInsuredRequest, validateInsured } from "../quotations/quotationRules";

const props = defineProps({ data: { type: Object, default: () => ({}) } });
const quotation = props.data?.quotation || {};
const current = props.data?.insured;
const editing = !!current?.insuredUuid;

const form = reactive(fromInsured(current || { country: "Ethiopia" }));
const errors = ref({});
const pending = ref(false);
const maxBirth = new Date().toISOString().slice(0, 10);

const GROUPS = [
  { title: "Member", fields: [["title", "Title", 25, "Mr, Mrs, Dr…"], ["firstName", "First name", 25], ["fatherName", "Father's name", 25], ["grandFatherName", "Grandfather's name", 25]] },
  { title: "Contact", fields: [["phone", "Phone", 13, "+2519…"], ["email", "Email (optional)", 50], ["idNumber", "ID number (optional)", 50]] },
  { title: "Employment", fields: [["position", "Position (optional)", 50], ["branchOffice", "Branch office (optional)", 50]] },
  { title: "Address", fields: [["address1", "Sub-city / zone", 50], ["address2", "Woreda", 50], ["address3", "House number", 50], ["state", "Region / city", 50], ["country", "Country", 50]] },
];

async function submit() {
  errors.value = validateInsured(form);
  if (Object.keys(errors.value).length) return;
  pending.value = true;
  const body = toInsuredRequest(form, { institutionUuid: quotation.institutionUuid, quotationUuid: quotation.quotationUuid, status: current?.status });
  const res = editing ? await updateInsuredPerson(current.insuredUuid, body) : await createInsuredPerson(body);
  pending.value = false;
  if (res?.success) {
    toasted(true, editing ? "Member updated" : "Member added");
    closeModal(true);
  }
}

const field = "w-full px-3 h-10 text-sm rounded-lg border outline-none bg-surface text-ink focus:border-primary focus:ring-2 focus:ring-primary/15";
</script>

<template>
  <ModalParent>
    <NewFormParent size="lg" :title="editing ? 'Edit member' : 'Add member'" :subtitle="quotation.institutionName">
      <form id="life-insured-form" class="grid gap-5 p-5" novalidate @submit.prevent="submit">
        <fieldset class="grid gap-4 sm:grid-cols-3">
          <legend class="mb-2 text-xs font-semibold tracking-wide uppercase text-ink-subtle">Cover</legend>
          <label class="flex flex-col gap-1 text-sm font-medium text-ink">
            Sum assured
            <input v-model="form.sumAssured" v-focus="true" type="number" min="0" step="any" inputmode="decimal" :class="[field, 'text-right tabular-nums', errors.sumAssured ? 'border-error' : 'border-line']" />
            <span v-if="errors.sumAssured" class="text-xs text-error">{{ errors.sumAssured }}</span>
          </label>
          <label class="flex flex-col gap-1 text-sm font-medium text-ink">
            Date of birth
            <input v-model="form.birthDate" type="date" :max="maxBirth" :class="[field, errors.birthDate ? 'border-error' : 'border-line']" />
            <span v-if="errors.birthDate" class="text-xs text-error">{{ errors.birthDate }}</span>
          </label>
          <label class="flex flex-col gap-1 text-sm font-medium text-ink">
            Gender
            <select v-model="form.gender" :class="[field, errors.gender ? 'border-error' : 'border-line']">
              <option value="" disabled>Select…</option>
              <option v-for="g in GENDERS" :key="g" :value="g">{{ g }}</option>
            </select>
            <span v-if="errors.gender" class="text-xs text-error">{{ errors.gender }}</span>
          </label>
          <p class="text-xs sm:col-span-3 text-ink-subtle">The premium is calculated by the system from the group term rate for the member's age and gender.</p>
        </fieldset>

        <fieldset v-for="g in GROUPS" :key="g.title" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <legend class="mb-2 text-xs font-semibold tracking-wide uppercase text-ink-subtle">{{ g.title }}</legend>
          <label v-for="[key, label, max, placeholder] in g.fields" :key="key" class="flex flex-col gap-1 text-sm font-medium text-ink">
            {{ label }}
            <input v-model="form[key]" :maxlength="max" :placeholder="placeholder" :type="key === 'email' ? 'email' : key === 'phone' ? 'tel' : 'text'" :class="[field, errors[key] ? 'border-error' : 'border-line']" />
            <span v-if="errors[key]" class="text-xs text-error">{{ errors[key] }}</span>
          </label>
        </fieldset>
      </form>
      <template #bottom>
        <div class="flex gap-2 justify-end p-4 w-full border-t border-line">
          <Button variant="outline" @click="closeModal()">Cancel</Button>
          <Button html-type="submit" form="life-insured-form" :pending="pending">{{ editing ? "Save changes" : "Add member" }}</Button>
        </div>
      </template>
    </NewFormParent>
  </ModalParent>
</template>
