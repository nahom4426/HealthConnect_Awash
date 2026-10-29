<script setup>
// Create or edit a commodity. data: { commodity?: Commodity } — with a description it edits.
// Class comes from the classes in the active rate table; Restricted makes quotes refer (MAR-19).
import { onMounted, ref } from "vue";
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
import { createCommodity, listCommodityClasses, updateCommodity } from "../api/marineApi";
import { notifyError } from "../api/marineClient";

const props = defineProps({ data: { type: Object, default: () => ({}) } });
const c = props.data?.commodity ?? {};
const editing = !!c.description;
const classes = ref([]);
const showAudit = ref(false);
onMounted(async () => {
  const res = await listCommodityClasses();
  if (res.ok) classes.value = res.data;
});

const { form, errors, pending, check, validate, applyServerError, bannerItems, submitted } = useForm(
  { hsCode: c.hsCode ?? "", description: c.description ?? "", commodityClass: c.commodityClass ?? "", restricted: !!c.restricted },
  {
    hsCode: (v) => (!/^\d{6,10}$/.test(String(v)) ? "HS code is 6 to 10 digits" : ""),
    description: required("Description"),
    commodityClass: required("Class"),
  },
  { hsCode: "HS code", description: "Description", commodityClass: "Class" }
);

async function submit() {
  if (!validate()) return;
  pending.value = true;
  const res = editing ? await updateCommodity(c.hsCode, form) : await createCommodity(form);
  pending.value = false;
  if (res.ok) {
    toasted(true, editing ? "Commodity updated" : `${res.data.hsCode} added`);
    closeModal(res.data);
  } else if (!applyServerError(res.error)) notifyError(res.error);
}
</script>

<template>
  <ModalParent>
    <NewFormParent size="md" :title="editing ? `Edit HS ${c.hsCode}` : 'New commodity'">
      <FormErrorBanner :items="submitted ? bannerItems() : []" />
      <form id="marine-commodity-form" class="grid gap-4 sm:grid-cols-2" novalidate @submit.prevent="submit">
        <FormField v-slot="{ id, invalid }" label="HS code" name="hsCode" required :error="errors.hsCode" hint="6 to 10 digits">
          <input :id="id" v-model="form.hsCode" v-focus="!editing" inputmode="numeric" maxlength="10" :readonly="editing" :class="[inputClass, inputBorder(invalid), 'tabular-nums', editing ? 'bg-surface-muted' : '']" @blur="check('hsCode')" />
        </FormField>
        <FormField v-slot="{ id, invalid }" label="Class" name="commodityClass" required :error="errors.commodityClass">
          <select :id="id" v-model="form.commodityClass" :class="[inputClass, inputBorder(invalid)]" @blur="check('commodityClass')">
            <option value="" disabled>Choose a class</option>
            <option v-for="k in classes" :key="k" :value="k">{{ k.charAt(0) + k.slice(1).toLowerCase() }}</option>
          </select>
        </FormField>
        <FormField v-slot="{ id, invalid }" label="Description" name="description" required :error="errors.description" class="sm:col-span-2">
          <input :id="id" v-model="form.description" :class="[inputClass, inputBorder(invalid)]" @blur="check('description')" />
        </FormField>
        <label class="flex gap-3 items-start p-3 rounded-xl border cursor-pointer sm:col-span-2 border-line">
          <input v-model="form.restricted" type="checkbox" class="mt-0.5 accent-[rgb(var(--primary))]" />
          <span>
            <span class="block text-sm font-medium text-ink">Restricted</span>
            <span class="block text-xs text-ink-muted">Quotes for this commodity go to an underwriter before they can be bound.</span>
          </span>
        </label>
      </form>
      <div v-if="editing" class="pt-3 border-t border-line">
        <button type="button" class="text-sm font-medium text-primary hover:underline" :aria-expanded="showAudit" @click="showAudit = !showAudit">{{ showAudit ? "Hide" : "Show" }} change history</button>
        <div v-if="showAudit" class="mt-3"><AuditTimeline entity="commodity" :entity-id="c.hsCode" /></div>
      </div>
      <template #bottom>
        <div class="flex gap-2 justify-end p-4 w-full border-t border-line">
          <Button variant="outline" @click="closeModal()">Cancel</Button>
          <Button html-type="submit" form="marine-commodity-form" :pending="pending">{{ editing ? "Save changes" : "Add commodity" }}</Button>
        </div>
      </template>
    </NewFormParent>
  </ModalParent>
</template>
