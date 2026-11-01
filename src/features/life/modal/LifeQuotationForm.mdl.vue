<script setup>
// Edit (or create) a group quotation's details in a modal. New quotations normally start on the
// New quotation page (/life/quotations/new); the form logic is shared in useQuotationForm.
// data: { quotation?: QuotationResponse, productType?, planType? }
import { closeModal } from "@customizer/modal-x";
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import Button from "@/components/Button.vue";
import TextField from "@/components/fields/TextField.vue";
import SelectField from "@/components/fields/SelectField.vue";
import { LIFE_QUOTE_PRODUCTS } from "@/config/productCategories";
import { useQuotationForm } from "../quotations/useQuotationForm";

const props = defineProps({ data: { type: Object, default: () => ({}) } });
const current = props.data?.quotation;
const { editing, form, errors, pending, plans, pickPlan, query, results, searching, pickInstitution: pick, clearInstitution, submit: save } =
  useQuotationForm({ quotation: current, productType: props.data?.productType, planType: props.data?.planType });

async function submit() {
  const saved = await save();
  if (saved) closeModal(saved);
}
</script>

<template>
  <ModalParent>
    <NewFormParent size="md" :title="editing ? 'Edit quotation' : 'New group quotation'" :subtitle="editing ? current.quotationNumber : 'Choose the product, then the institution. Members and riders are added next.'">
      <form id="life-quotation-form" class="grid gap-4 p-5" novalidate @submit.prevent="submit">
        <SelectField
          v-model="form.productType"
          label="Product"
          :required="!editing"
          :options="LIFE_QUOTE_PRODUCTS"
          placeholder="Choose a life product"
          :error="errors.productType"
        />
        <div v-if="plans.length" class="grid gap-1.5">
          <span id="life-quotation-plan" class="text-sm font-medium text-ink">Plan <span class="text-error">*</span></span>
          <div role="radiogroup" aria-labelledby="life-quotation-plan" class="flex flex-wrap gap-2">
            <button
              v-for="plan in plans"
              :key="plan"
              type="button"
              role="radio"
              :aria-checked="form.planType === plan"
              :class="[
                'rounded-lg border px-3.5 py-2 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                form.planType === plan ? 'border-primary bg-primary/10 text-primary' : 'border-line text-ink-muted hover:border-primary/40',
              ]"
              @click="pickPlan(plan)"
            >{{ plan }}</button>
          </div>
          <span v-if="errors.planType" class="text-xs text-error">{{ errors.planType }}</span>
        </div>

        <div v-if="form.institutionUuid" class="flex flex-col gap-1 text-sm font-medium text-ink">
          Institution
          <div class="flex gap-3 justify-between items-center px-3 h-10 rounded-lg border border-primary bg-primary/5">
            <span class="truncate">{{ form.institutionName }}</span>
            <button v-if="!editing" type="button" class="text-xs font-semibold text-primary hover:underline" @click="clearInstitution">Change</button>
          </div>
          <span v-if="errors.institutionUuid" class="text-xs text-error">{{ errors.institutionUuid }}</span>
        </div>
        <div v-else class="grid gap-1">
          <TextField v-model="query" label="Institution" focus type="search" placeholder="Search institutions" aria-label="Search institutions" :error="errors.institutionUuid" />
            <ul role="listbox" aria-label="Institutions" class="overflow-auto max-h-48 rounded-lg border divide-y border-line divide-line">
              <li v-if="searching" class="px-3 py-2.5 text-xs text-ink-subtle">Searching…</li>
              <li v-else-if="!results.length" class="px-3 py-2.5 text-xs text-ink-subtle">No active institutions found{{ query ? ` for “${query}”` : "" }}.</li>
              <li v-for="i in results" v-else :key="i.institutionUuid" role="option" :aria-selected="false">
                <button type="button" class="px-3 py-2 w-full text-sm text-left hover:bg-surface-muted focus:bg-surface-muted focus:outline-none" @click="pick(i)">
                  {{ i.institutionName }}
                  <span v-if="i.address1 || i.state" class="block text-xs text-ink-subtle">{{ [i.address1, i.state].filter(Boolean).join(", ") }}</span>
                </button>
              </li>
            </ul>
        </div>

        <div class="w-32"><TextField v-model="form.term" label="Term (years)" type="number" min="1" step="1" inputmode="numeric" :error="errors.term" /></div>

        <div class="grid gap-4 sm:grid-cols-2">
          <TextField v-model="form.contactPersonFullName" label="Contact person" maxlength="60" autocomplete="off" :error="errors.contactPersonFullName" />
          <TextField v-model="form.contactPhone" label="Contact phone" maxlength="13" type="tel" inputmode="tel" placeholder="+2519…" :error="errors.contactPhone" />
        </div>
      </form>
      <template #bottom>
        <div class="flex gap-2 justify-end p-4 w-full border-t border-line">
          <Button variant="outline" @click="closeModal()">Cancel</Button>
          <Button html-type="submit" form="life-quotation-form" :pending="pending">{{ editing ? "Save changes" : "Create draft" }}</Button>
        </div>
      </template>
    </NewFormParent>
  </ModalParent>
</template>
