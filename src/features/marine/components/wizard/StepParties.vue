<script setup>
// Wizard step 1: product and parties (plan 5.2).
import { computed } from "vue";
import FormField from "../FormField.vue";
import PartyPicker from "../PartyPicker.vue";
import { inputClass, inputBorder } from "../styles";
import { INCOTERMS, PRODUCTS, incotermWarning } from "../../constants";

const props = defineProps({
  draft: { type: Object, required: true },
  errors: { type: Object, required: true },
  flags: { type: Object, default: () => ({}) },
});
const emit = defineEmits(["check"]);

// Inland transit arrives in phase 3; hull only behind its feature flag
const products = computed(() => PRODUCTS.filter((p) => (p.flag ? props.flags[p.flag] : true)));
const available = (p) => p.phase === 1;
const warning = computed(() => incotermWarning(props.draft.incoterm, props.draft.insuredRole));
</script>

<template>
  <div class="grid gap-5">
    <FormField label="Product" name="product" required :error="errors.product">
      <div class="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Product">
        <label
          v-for="p in products"
          :key="p.value"
          :class="[
            'flex flex-col gap-1 p-4 rounded-xl border-2',
            !available(p) ? 'opacity-50 cursor-not-allowed border-line' : draft.product === p.value ? 'border-primary bg-primary/5 cursor-pointer' : 'border-line hover:border-line-strong cursor-pointer',
          ]"
        >
          <span class="flex gap-2 items-center">
            <input v-model="draft.product" type="radio" name="product" :value="p.value" :disabled="!available(p)" class="accent-[rgb(var(--primary))]" />
            <span class="text-sm font-semibold text-ink">{{ p.label }}</span>
          </span>
          <span class="text-xs text-ink-muted">{{ available(p) ? p.summary : "Coming in phase 3" }}</span>
        </label>
      </div>
    </FormField>

    <div class="grid gap-5 sm:grid-cols-2">
      <FormField v-slot="{ id, invalid, describedby }" label="Insured" name="insured" required :error="errors.insured">
        <PartyPicker :id="id" v-model="draft.insured" type="INSURED" :invalid="invalid" :describedby="describedby" @blur="emit('check', 'insured')" />
      </FormField>
      <FormField label="Insured is the" name="insuredRole" required :error="errors.insuredRole" hint="Used for the Incoterm check">
        <div class="flex gap-2" role="radiogroup" aria-label="Insured is the">
          <label v-for="r in [{ v: 'BUYER', l: 'Buyer' }, { v: 'SELLER', l: 'Seller' }]" :key="r.v" :class="['flex-1 inline-flex gap-2 items-center px-3 h-10 text-sm rounded-lg border cursor-pointer', draft.insuredRole === r.v ? 'border-primary bg-primary/5 text-primary' : 'border-line text-ink']">
            <input v-model="draft.insuredRole" type="radio" name="insuredRole" :value="r.v" class="accent-[rgb(var(--primary))]" @change="emit('check', 'insuredRole')" />
            {{ r.l }}
          </label>
        </div>
      </FormField>
      <FormField v-slot="{ id, describedby }" label="Consignee" name="consignee" hint="Screened for sanctions from phase 2">
        <PartyPicker :id="id" v-model="draft.consignee" type="CONSIGNEE" :describedby="describedby" />
      </FormField>
      <FormField v-slot="{ id, describedby }" label="Broker" name="broker">
        <PartyPicker :id="id" v-model="draft.broker" type="BROKER" :describedby="describedby" />
      </FormField>
      <FormField v-slot="{ id, invalid, describedby }" label="Incoterm" name="incoterm" required :error="errors.incoterm">
        <select :id="id" v-model="draft.incoterm" :aria-describedby="describedby" :class="[inputClass, inputBorder(invalid)]" @change="emit('check', 'incoterm')">
          <option value="" disabled>Choose an Incoterm</option>
          <option v-for="t in INCOTERMS" :key="t" :value="t">{{ t }}</option>
        </select>
      </FormField>
    </div>
    <p v-if="warning" role="status" class="flex gap-2 items-start p-3 text-sm rounded-xl bg-warning-soft text-warning-strong">
      <svg class="mt-0.5 w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M10 6.5v4.5M10 14h.01" /><circle cx="10" cy="10" r="7.5" /></svg>
      <span>{{ warning }} You can still continue.</span>
    </p>
  </div>
</template>
