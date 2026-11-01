<script setup>
// The beneficiary designation of a group member or an individual policy (PUT /beneficiary/designation
// replaces it as a whole and keeps the old one as a superseded version).
// data: { subject: { insuredUuid } | { benefitUuid }, name: string, editable: boolean }
import { computed, reactive, ref } from "vue";
import { closeModal } from "@customizer/modal-x";
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import Button from "@/components/Button.vue";
import TextField from "@/components/fields/TextField.vue";
import SelectField from "@/components/fields/SelectField.vue";
import CheckboxField from "@/components/fields/CheckboxField.vue";
import { toasted } from "@/utils/utils";
import { useLifeResource } from "../composables/useLifeResource";
import { formatDate } from "../constants/labels";
import { ID_TYPES, GENDERS } from "../individual/customerRules";
import { BENEFICIARY_TYPES, RELATIONSHIPS, beneficiaryName, fromDesignation, isMinor, newBeneficiary, relationshipLabel, toDesignationRequest, validateDesignation } from "../underwriting/beneficiaryRules";
import { getBeneficiaryDesignation, saveBeneficiaryDesignation } from "../api/beneficiaryApi";

const props = defineProps({ data: { type: Object, default: () => ({}) } });
const subject = props.data?.subject || {};
const editable = !!props.data?.editable;

const current = useLifeResource(() => getBeneficiaryDesignation(subject));
const form = reactive({ statutoryDefault: false, note: "", beneficiaries: [] });
const editing = ref(false);
const errors = ref({});
const pending = ref(false);
const today = new Date().toISOString().slice(0, 10);
current.load().then(() => Object.assign(form, fromDesignation(current.data.value || {})));

const d = computed(() => current.data.value || {});
const active = computed(() => (d.value.beneficiaries || []).filter((b) => b.status !== "SUPERSEDED"));

function startEditing() {
  Object.assign(form, fromDesignation(d.value));
  if (!form.statutoryDefault && !form.beneficiaries.length) form.beneficiaries.push(newBeneficiary());
  errors.value = {};
  editing.value = true;
}
const add = (type) => form.beneficiaries.push(newBeneficiary(type));
const remove = (i) => form.beneficiaries.splice(i, 1);

async function save() {
  errors.value = validateDesignation(form);
  if (Object.keys(errors.value).length) return;
  pending.value = true;
  const res = await saveBeneficiaryDesignation(toDesignationRequest(form, subject));
  pending.value = false;
  if (res?.success) {
    toasted(true, "Beneficiaries saved");
    closeModal(true);
  }
}
</script>

<template>
  <ModalParent>
    <NewFormParent size="lg" :title="editing ? 'Change beneficiaries' : 'Beneficiaries'" :subtitle="data?.name">
      <div class="grid gap-4 p-5">
        <p v-if="current.loading.value && !current.data.value" class="text-sm text-ink-muted">Loading…</p>
        <p v-else-if="current.error.value" class="text-sm text-error">{{ current.error.value }}</p>

        <!-- current designation -->
        <template v-else-if="!editing">
          <p class="text-xs text-ink-subtle">
            {{ d.version ? `Version ${d.version}` : "Never designated" }}<template v-if="d.audit?.updatedAt"> · updated {{ formatDate(d.audit.updatedAt) }}</template>
          </p>
          <p v-if="!active.length" class="px-4 py-3 text-sm rounded-xl bg-surface-muted text-ink">
            {{ d.statutoryDefault ? "No beneficiaries named: the benefit goes to the statutory heirs." : "No beneficiaries named." }}
          </p>
          <ul v-else class="divide-y rounded-xl border divide-line border-line">
            <li v-for="b in active" :key="b.beneficiaryUuid" class="flex flex-wrap gap-3 justify-between items-start px-4 py-3">
              <span class="text-sm">
                <span class="font-medium text-ink">{{ beneficiaryName(b) }}</span>
                <span class="block text-xs text-ink-subtle">{{ [relationshipLabel(b.relationship), b.dateOfBirth && `born ${formatDate(b.dateOfBirth)}`, b.phone].filter(Boolean).join(" · ") }}</span>
                <span v-if="b.minor || b.guardianName" class="block text-xs text-ink-subtle">Minor · guardian {{ [b.guardianName, b.guardianPhone].filter(Boolean).join(", ") }}</span>
              </span>
              <span class="text-sm text-right">
                <span class="tabular-nums text-ink">{{ b.sharePercent }}%</span>
                <span class="block text-xs text-ink-subtle">{{ b.type === "PRIMARY" ? "Primary" : "Contingent" }}</span>
              </span>
            </li>
          </ul>
          <p v-if="d.note" class="text-xs text-ink-muted">Note: {{ d.note }}</p>
        </template>

        <!-- edit -->
        <form v-else id="life-beneficiaries" class="grid gap-4" novalidate @submit.prevent="save">
          <CheckboxField v-model="form.statutoryDefault" label="Pay the statutory heirs (no named beneficiaries)" hint="The benefit is paid to the legal heirs; name payees on the claim." />
          <template v-if="!form.statutoryDefault">
            <p class="text-xs text-ink-muted">Primary beneficiaries are paid first; contingent ones only if no primary survives. Shares of each type must add up to 100%.</p>
            <fieldset v-for="(b, i) in form.beneficiaries" :key="i" class="grid gap-3 p-4 rounded-xl border sm:grid-cols-2 lg:grid-cols-4 border-line">
              <legend class="px-1 text-sm font-semibold text-ink">Beneficiary {{ i + 1 }}</legend>
              <SelectField v-model="b.type" label="Type" :options="BENEFICIARY_TYPES" :error="errors.rows?.[i]?.type" />
              <TextField v-model="b.firstName" label="First name" maxlength="60" :error="errors.rows?.[i]?.firstName" />
              <TextField v-model="b.fatherName" label="Father's name" maxlength="60" :error="errors.rows?.[i]?.fatherName" />
              <TextField v-model="b.grandFatherName" label="Grandfather's name (optional)" maxlength="60" />
              <SelectField v-model="b.relationship" label="Relationship" :options="RELATIONSHIPS" :error="errors.rows?.[i]?.relationship" />
              <TextField v-model="b.dateOfBirth" label="Date of birth" type="date" :max="today" :error="errors.rows?.[i]?.dateOfBirth" />
              <SelectField v-model="b.gender" label="Gender (optional)" :options="GENDERS" />
              <TextField v-model="b.sharePercent" label="Share %" type="number" numeric min="0" max="100" step="any" :error="errors.rows?.[i]?.sharePercent" />
              <SelectField v-model="b.idType" label="ID type (optional)" :options="ID_TYPES" />
              <TextField v-model="b.idNumber" label="ID number (optional)" maxlength="40" />
              <TextField v-model="b.phone" label="Phone (optional)" type="tel" maxlength="14" :error="errors.rows?.[i]?.phone" />
              <TextField v-model="b.address" label="Address (optional)" maxlength="300" />
              <template v-if="isMinor(b.dateOfBirth)">
                <TextField v-model="b.guardianName" label="Guardian's name" maxlength="120" :error="errors.rows?.[i]?.guardianName" />
                <TextField v-model="b.guardianPhone" label="Guardian's phone" type="tel" maxlength="14" :error="errors.rows?.[i]?.guardianPhone" />
              </template>
              <div class="flex items-end lg:col-start-4"><Button variant="ghost" size="sm" class="!text-error" @click="remove(i)">Remove</Button></div>
            </fieldset>
            <p v-if="errors.primary" class="text-sm text-error">{{ errors.primary }}</p>
            <p v-if="errors.shares" class="text-sm text-error">{{ errors.shares }}</p>
            <div class="flex gap-2">
              <Button variant="outline" size="sm" @click="add('PRIMARY')">Add primary</Button>
              <Button variant="outline" size="sm" @click="add('CONTINGENT')">Add contingent</Button>
            </div>
          </template>
          <TextField v-model="form.note" label="Note (optional)" maxlength="500" placeholder="e.g. Designation form signed on …" :error="errors.note" />
        </form>
      </div>
      <template #bottom>
        <div class="flex gap-2 justify-end p-4 w-full border-t border-line">
          <template v-if="editing">
            <Button variant="outline" @click="editing = false">Back</Button>
            <Button html-type="submit" form="life-beneficiaries" :pending="pending">Save beneficiaries</Button>
          </template>
          <template v-else>
            <Button variant="outline" @click="closeModal()">Close</Button>
            <Button v-if="editable && current.data.value" @click="startEditing">Change beneficiaries</Button>
          </template>
        </div>
      </template>
    </NewFormParent>
  </ModalParent>
</template>
