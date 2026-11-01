<script setup>
// Endorse an issued policy (EndorsementRequest). Group: add or remove members, or change their sums
// assured; individual: change the sum assured. The backend returns the pro-rata premium adjustment and
// adds it to the premium schedule. data: { kind: 'policy'|'benefit', uuid }
import { computed, reactive, ref, watch } from "vue";
import { closeModal } from "@customizer/modal-x";
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import Button from "@/components/Button.vue";
import TextField from "@/components/fields/TextField.vue";
import SelectField from "@/components/fields/SelectField.vue";
import TextareaField from "@/components/fields/TextareaField.vue";
import { toasted } from "@/utils/utils";
import { useLifeResource } from "../composables/useLifeResource";
import { formatAmount } from "../constants/labels";
import { insuredName } from "../quotations/quotationRules";
import { endorsementTypes, newEndorsementMember, toEndorsementRequest, validateEndorsement } from "../servicing/servicingRules";
import { getInsuredPersons } from "../api/quotationApi";
import { createEndorsement } from "../api/servicingApi";

const props = defineProps({ data: { type: Object, default: () => ({}) } });
const { kind, uuid } = props.data || {};
const group = kind === "policy";
const types = endorsementTypes(kind);
const today = new Date().toISOString().slice(0, 10);

const form = reactive({ type: types.length === 1 ? types[0].value : "", effectiveDate: today, note: "", insured: [newEndorsementMember()] });
const errors = ref({});
const pending = ref(false);
watch(() => form.type, () => { form.insured = [newEndorsementMember()]; errors.value = {}; });

// The policy's members, to pick for removal or a new sum assured
const members = useLifeResource(() => getInsuredPersons(uuid, { page: 1, limit: 500 }), { initial: [], map: (d) => (Array.isArray(d) ? d : d?.content || []) });
if (group) members.load();
const memberOptions = computed(() => members.data.value.map((m) => ({ value: m.insuredUuid, label: `${insuredName(m)} · ${formatAmount(m.sumAssured)}` })));

const add = () => form.insured.push(newEndorsementMember());
const remove = (i) => form.insured.splice(i, 1);

async function submit() {
  errors.value = validateEndorsement(form, kind);
  if (Object.keys(errors.value).length) return;
  pending.value = true;
  const res = await createEndorsement(kind, uuid, toEndorsementRequest(form));
  pending.value = false;
  if (res?.success) {
    toasted(true, res.data?.premiumAdjustment != null ? `Endorsed: premium adjustment ${formatAmount(res.data.premiumAdjustment)}` : "Endorsed");
    closeModal(true);
  }
}
</script>

<template>
  <ModalParent>
    <NewFormParent size="lg" title="New endorsement" subtitle="The system works out the pro-rata premium and adds it to the schedule.">
      <form id="life-endorsement" class="grid gap-4 p-5" novalidate @submit.prevent="submit">
        <div class="grid gap-4 sm:grid-cols-2">
          <SelectField v-model="form.type" label="Change" :options="types" :disabled="types.length === 1" :error="errors.type" />
          <TextField v-model="form.effectiveDate" label="Effective date" type="date" :error="errors.effectiveDate" />
        </div>

        <template v-if="form.type">
          <fieldset v-for="(m, i) in form.insured" :key="i" class="grid gap-3 p-4 rounded-xl border sm:grid-cols-2 lg:grid-cols-4 border-line">
            <legend class="px-1 text-sm font-semibold text-ink">{{ group ? `Member ${i + 1}` : "New cover" }}</legend>
            <template v-if="form.type === 'ADD_MEMBER'">
              <TextField v-model="m.firstName" label="First name" maxlength="60" :error="errors.rows?.[i]?.firstName" />
              <TextField v-model="m.fatherName" label="Father's name" maxlength="60" :error="errors.rows?.[i]?.fatherName" />
              <TextField v-model="m.grandFatherName" label="Grandfather's name (optional)" maxlength="60" />
              <SelectField v-model="m.gender" label="Gender" :options="['Male', 'Female']" :error="errors.rows?.[i]?.gender" />
              <TextField v-model="m.birthDate" label="Date of birth" type="date" :max="today" :error="errors.rows?.[i]?.birthDate" />
              <TextField v-model="m.phone" label="Phone (optional)" type="tel" maxlength="14" />
              <TextField v-model="m.idNumber" label="ID number (optional)" maxlength="40" />
            </template>
            <SelectField
              v-else-if="group"
              v-model="m.insuredUuid"
              class="sm:col-span-2"
              label="Member"
              :options="memberOptions"
              :placeholder="members.loading.value ? 'Loading…' : 'Select…'"
              :error="errors.rows?.[i]?.insuredUuid"
            />
            <TextField v-if="form.type !== 'REMOVE_MEMBER'" v-model="m.sumAssured" :label="form.type === 'ADD_MEMBER' ? 'Sum assured' : 'New sum assured'" type="number" numeric min="0" step="any" :error="errors.rows?.[i]?.sumAssured" />
            <div v-if="group && form.insured.length > 1" class="flex items-end"><Button variant="ghost" size="sm" class="!text-error" @click="remove(i)">Remove</Button></div>
          </fieldset>
          <p v-if="errors.insured" class="text-sm text-error">{{ errors.insured }}</p>
          <div v-if="group"><Button variant="outline" size="sm" @click="add">Add another member</Button></div>
        </template>

        <TextareaField v-model="form.note" label="Note (optional)" rows="2" maxlength="500" counter :error="errors.note" />
      </form>
      <template #bottom>
        <div class="flex gap-2 justify-end p-4 w-full border-t border-line">
          <Button variant="outline" @click="closeModal()">Cancel</Button>
          <Button html-type="submit" form="life-endorsement" :pending="pending">Endorse</Button>
        </div>
      </template>
    </NewFormParent>
  </ModalParent>
</template>
