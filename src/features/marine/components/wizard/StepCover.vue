<script setup>
// Wizard step 3: cover and letter of credit (plan 5.2, MAR-09 to MAR-12, MAR-20).
import FormField from "../FormField.vue";
import MoneyInput from "../MoneyInput.vue";
import DateField from "../DateField.vue";
import PartyPicker from "../PartyPicker.vue";
import { inputClass, inputBorder } from "../styles";
import { CLAUSES } from "../../constants";
import { addDays } from "../../utils/format";

defineProps({
  draft: { type: Object, required: true },
  errors: { type: Object, required: true },
  /** Clause, war and strikes fixed by an open cover */
  locked: { type: Boolean, default: false },
});
const emit = defineEmits(["check"]);
</script>

<template>
  <div class="grid gap-5">
    <p v-if="locked" class="p-3 text-sm rounded-xl bg-surface-muted text-ink-muted">Clause, war and strikes follow the open cover's terms.</p>
    <FormField label="Clause" name="clause" required :error="errors.clause">
      <div class="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Clause">
        <label
          v-for="c in CLAUSES"
          :key="c.value"
          :class="['flex flex-col gap-1 p-4 rounded-xl border-2 cursor-pointer', draft.clause === c.value ? 'border-primary bg-primary/5' : 'border-line hover:border-line-strong']"
        >
          <span class="flex gap-2 items-center">
            <input v-model="draft.clause" type="radio" name="clause" :value="c.value" :disabled="locked" class="accent-[rgb(var(--primary))]" @change="emit('check', 'clause')" />
            <span class="text-sm font-semibold text-ink">{{ c.label }}{{ c.value === "ICC_A" ? " (all risks)" : "" }}</span>
          </span>
          <span class="text-xs text-ink-muted">{{ c.summary }}</span>
        </label>
      </div>
    </FormField>

    <div class="grid gap-3 sm:grid-cols-2">
      <label class="flex gap-3 items-start p-3 rounded-xl border cursor-pointer border-line">
        <input v-model="draft.warCover" type="checkbox" :disabled="locked" class="mt-0.5 accent-[rgb(var(--primary))]" />
        <span>
          <span class="block text-sm font-medium text-ink">War cover</span>
          <span class="block text-xs text-ink-muted">Covers goods only while waterborne.</span>
        </span>
      </label>
      <label class="flex gap-3 items-start p-3 rounded-xl border cursor-pointer border-line">
        <input v-model="draft.strikesCover" type="checkbox" :disabled="locked" class="mt-0.5 accent-[rgb(var(--primary))]" />
        <span>
          <span class="block text-sm font-medium text-ink">Strikes cover</span>
          <span class="block text-xs text-ink-muted">Strikes, riots and civil commotion.</span>
        </span>
      </label>
    </div>

    <div class="grid gap-5 sm:grid-cols-2">
      <FormField v-slot="{ id, invalid, describedby }" label="Deductible" name="deductible" :error="errors.deductible" hint="Optional">
        <MoneyInput :id="id" v-model:amount="draft.deductible" :currency="draft.currency" lock-currency :invalid="invalid" :describedby="describedby" @blur="emit('check', 'deductible')" />
      </FormField>
      <div class="hidden sm:block" />
      <FormField v-slot="{ id, invalid }" label="Special conditions" name="specialConditions" :error="errors.specialConditions" :hint="`Printed on the certificate · ${draft.specialConditions.length}/2000`" class="sm:col-span-2">
        <textarea :id="id" v-model="draft.specialConditions" rows="3" maxlength="2000" :class="[inputClass, inputBorder(invalid), 'h-auto py-2']" />
      </FormField>
    </div>

    <section class="p-4 rounded-xl border border-line">
      <label class="flex gap-3 items-center cursor-pointer">
        <input v-model="draft.lc.enabled" type="checkbox" role="switch" class="accent-[rgb(var(--primary))]" />
        <span class="text-sm font-semibold text-ink">Letter of credit</span>
        <span class="text-xs text-ink-muted">The issuing bank becomes loss payee.</span>
      </label>
      <div v-if="draft.lc.enabled" class="grid gap-5 mt-4 sm:grid-cols-2">
        <FormField v-slot="{ id, invalid }" label="LC number" name="lc.number" required :error="errors['lc.number']">
          <input :id="id" v-model="draft.lc.number" :class="[inputClass, inputBorder(invalid)]" @blur="emit('check', 'lc.number')" />
        </FormField>
        <FormField v-slot="{ id, invalid, describedby }" label="Issuing bank" name="lc.bank" required :error="errors['lc.bank']">
          <PartyPicker :id="id" v-model="draft.lc.bank" type="BANK" :invalid="invalid" :describedby="describedby" @blur="emit('check', 'lc.bank')" />
        </FormField>
        <FormField v-slot="{ id, invalid, describedby }" label="LC amount" name="lc.amount" required :error="errors['lc.amount']">
          <MoneyInput :id="id" v-model:amount="draft.lc.amount" :currency="draft.currency" lock-currency :invalid="invalid" :describedby="describedby" @blur="emit('check', 'lc.amount')" />
        </FormField>
        <FormField v-slot="{ id, invalid, describedby }" label="LC expiry" name="lc.expiry" required :error="errors['lc.expiry']" hint="After the sailing date">
          <DateField :id="id" v-model="draft.lc.expiry" :min="draft.sailingDate ? addDays(draft.sailingDate, 1) : undefined" :invalid="invalid" :describedby="describedby" @blur="emit('check', 'lc.expiry')" />
        </FormField>
      </div>
    </section>
  </div>
</template>
