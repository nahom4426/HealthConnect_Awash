<script setup>
// Link a policyholder (customer) to an individual policy, or edit the linked one.
// Link: find an existing customer, or register a new one (prefilled from the insured person, duplicate
// check first), then PUT /benefit/{uuid} with the policy's fields plus customerUuid.
// data: { benefit: BenefitResponse, customer?: CustomerResponse } (customer = edit it)
import { reactive, ref, watch } from "vue";
import { closeModal } from "@customizer/modal-x";
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import Button from "@/components/Button.vue";
import StatusBadge from "@/components/StatusBadge.vue";
import TextField from "@/components/fields/TextField.vue";
import SelectField from "@/components/fields/SelectField.vue";
import { toasted } from "@/utils/utils";
import { GENDERS, ID_TYPES, customerFromBenefit, customerName, duplicateParams, fromCustomer, idTypeLabel, toCustomerRequest, validateCustomer } from "../individual/customerRules";
import { benefitName, linkCustomerRequest } from "../individual/individualRules";
import { checkCustomerDuplicates, createCustomer, getCustomers, updateCustomer } from "../api/customerApi";
import { updateBenefit } from "../api/policyApi";

const props = defineProps({ data: { type: Object, default: () => ({}) } });
const benefit = props.data?.benefit || {};
const current = props.data?.customer;
const editing = !!current?.customerUuid;

// find | register | duplicates
const step = ref(editing ? "register" : "find");
const form = reactive(editing ? fromCustomer(current) : customerFromBenefit(benefit));
const errors = ref({});
const pending = ref(false);
const maxBirth = new Date().toISOString().slice(0, 10);
let createdUuid = ""; // registered but not linked yet (the link failed): retry links, doesn't register again

const GROUPS = [
  { title: "Identity", fields: [["title", "Title (optional)", 20], ["firstName", "First name", 60], ["fatherName", "Father's name", 60], ["grandFatherName", "Grandfather's name (optional)", 60], ["idNumber", "ID number", 40]] },
  { title: "Contact", fields: [["phone", "Phone", 14, "+2519…"], ["email", "Email (optional)", 120]] },
  { title: "Due diligence (needed to verify KYC)", fields: [["nationality", "Nationality", 60], ["occupation", "Occupation", 100], ["sourceOfIncome", "Source of income", 150], ["region", "Region", 60], ["employer", "Employer (optional)", 150], ["tin", "TIN (optional)", 20]] },
  { title: "Address (optional)", fields: [["zone", "Zone / sub-city", 60], ["woreda", "Woreda", 60], ["kebele", "Kebele", 60], ["houseNumber", "House number", 30]] },
];

// ── find an existing customer ──
const search = ref(benefitName(benefit));
const results = ref([]);
const searching = ref(false);
const searchError = ref("");
let timer, seq = 0;
watch(search, () => {
  clearTimeout(timer);
  timer = setTimeout(async () => {
    const mine = ++seq;
    searching.value = true;
    const res = await getCustomers({ type: "INDIVIDUAL", search: search.value.trim(), page: 1, limit: 10 });
    if (mine !== seq) return;
    searching.value = false;
    results.value = res?.success ? (Array.isArray(res.data) ? res.data : res.data?.content || []) : [];
    searchError.value = res?.success ? "" : res?.error || "Couldn't search customers";
  }, 300);
}, { immediate: !editing });

// ── link, register, edit ──
async function link(customer) {
  pending.value = true;
  const res = await updateBenefit(benefit.benefitUuid, linkCustomerRequest(benefit, customer.customerUuid));
  pending.value = false;
  if (res?.success) {
    toasted(true, `${customerName(customer)} linked as policyholder`);
    closeModal(true);
  }
}

const duplicates = ref([]);
async function submit() {
  errors.value = validateCustomer(form);
  if (Object.keys(errors.value).length) return;
  if (editing) return save(() => updateCustomer(current.customerUuid, toCustomerRequest(form)), "Policyholder updated");
  if (createdUuid) return link({ ...toCustomerRequest(form), customerUuid: createdUuid });
  pending.value = true;
  const res = await checkCustomerDuplicates(duplicateParams(form));
  pending.value = false;
  duplicates.value = res?.success && Array.isArray(res.data) ? res.data : [];
  if (duplicates.value.length) step.value = "duplicates";
  else register();
}

async function register() {
  pending.value = true;
  const res = await createCustomer(toCustomerRequest(form));
  pending.value = false;
  if (!res?.success) return;
  createdUuid = res.data?.customerUuid;
  step.value = "register";
  await link(res.data);
}

async function save(call, message) {
  pending.value = true;
  const res = await call();
  pending.value = false;
  if (res?.success) {
    toasted(true, message);
    closeModal(true);
  }
}

const MATCH_LABELS = { idNumber: "ID number", phone: "phone", dateOfBirth: "date of birth" };
const matchText = (m = []) => m.map((k) => MATCH_LABELS[k] || k).join(", ");
</script>

<template>
  <ModalParent>
    <NewFormParent size="lg" :title="editing ? 'Edit policyholder' : 'Link policyholder'" :subtitle="`${benefitName(benefit)} · individual policy`">
      <div v-if="!editing && step !== 'duplicates'" class="flex gap-1 p-1 mx-5 mt-5 rounded-xl bg-surface-muted" role="group" aria-label="How to add the policyholder">
        <button
          v-for="[key, label] in [['find', 'Find existing customer'], ['register', 'Register new customer']]"
          :key="key"
          type="button"
          :aria-pressed="step === key"
          :class="['flex-1 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors', step === key ? 'bg-surface text-ink shadow-xs' : 'text-ink-muted hover:text-ink']"
          @click="step = key"
        >
          {{ label }}
        </button>
      </div>

      <!-- find -->
      <div v-if="step === 'find'" class="grid gap-3 p-5">
        <TextField v-model="search" label="Search by name, ID number or phone" type="search" focus />
        <p v-if="searching" class="text-sm text-ink-muted">Searching…</p>
        <p v-else-if="searchError" class="text-sm text-error">{{ searchError }}</p>
        <p v-else-if="!results.length" class="text-sm text-ink-muted">No customer found. Register a new one instead.</p>
        <ul v-else class="divide-y rounded-xl border divide-line border-line">
          <li v-for="c in results" :key="c.customerUuid" class="flex flex-wrap gap-3 justify-between items-center px-4 py-3">
            <div class="min-w-0">
              <p class="text-sm font-medium text-ink">{{ customerName(c) }}</p>
              <p class="text-xs text-ink-muted">{{ [idTypeLabel(c.idType), c.idNumber].filter(Boolean).join(" ") }} · {{ c.phone || "—" }}<template v-if="c.dateOfBirth"> · born {{ c.dateOfBirth }}</template></p>
            </div>
            <div class="flex gap-2 items-center">
              <StatusBadge v-if="c.kycStatus" :status="c.kycStatus" />
              <Button size="sm" :pending="pending" @click="link(c)">Link</Button>
            </div>
          </li>
        </ul>
      </div>

      <!-- possible duplicates before registering -->
      <div v-else-if="step === 'duplicates'" class="grid gap-3 p-5">
        <p class="text-sm text-ink">These customers look like the same person. Link one of them, or register a new customer anyway.</p>
        <ul class="divide-y rounded-xl border divide-line border-line">
          <li v-for="d in duplicates" :key="d.customer?.customerUuid" class="flex flex-wrap gap-3 justify-between items-center px-4 py-3">
            <div class="min-w-0">
              <p class="text-sm font-medium text-ink">{{ customerName(d.customer) }}</p>
              <p class="text-xs text-ink-muted">{{ [idTypeLabel(d.customer?.idType), d.customer?.idNumber].filter(Boolean).join(" ") }} · {{ d.customer?.phone || "—" }} · same {{ matchText(d.matchedOn) }}</p>
            </div>
            <div class="flex gap-2 items-center">
              <StatusBadge v-if="d.customer?.kycStatus" :status="d.customer.kycStatus" />
              <Button size="sm" :pending="pending" @click="link(d.customer)">Link this one</Button>
            </div>
          </li>
        </ul>
      </div>

      <!-- register / edit -->
      <form v-else id="life-policyholder-form" class="grid gap-5 p-5" novalidate @submit.prevent="submit">
        <fieldset class="grid gap-4 sm:grid-cols-3">
          <legend class="mb-2 text-xs font-semibold tracking-wide uppercase text-ink-subtle">Person</legend>
          <SelectField v-model="form.gender" label="Gender" :options="GENDERS" :error="errors.gender" />
          <TextField v-model="form.dateOfBirth" label="Date of birth" type="date" :max="maxBirth" :error="errors.dateOfBirth" />
          <SelectField v-model="form.idType" label="ID type" :options="ID_TYPES" :error="errors.idType" />
        </fieldset>
        <fieldset v-for="g in GROUPS" :key="g.title" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <legend class="mb-2 text-xs font-semibold tracking-wide uppercase text-ink-subtle">{{ g.title }}</legend>
          <TextField v-for="[key, label, max, placeholder] in g.fields" :key="key" v-model="form[key]" :label="label" :maxlength="max" :placeholder="placeholder" :type="key === 'email' ? 'email' : key === 'phone' ? 'tel' : 'text'" :error="errors[key]" />
        </fieldset>
        <p v-if="editing && current.kycStatus === 'VERIFIED'" class="px-3 py-2 text-xs rounded-lg bg-warning-soft text-warning-strong">KYC is verified. Changing the ID or date of birth sends it back to incomplete, and it has to be verified again.</p>
      </form>

      <template #bottom>
        <div class="flex gap-2 justify-end p-4 w-full border-t border-line">
          <Button variant="outline" @click="step === 'duplicates' ? (step = 'register') : closeModal()">{{ step === "duplicates" ? "Back" : "Cancel" }}</Button>
          <Button v-if="step === 'duplicates'" variant="outline" :pending="pending" @click="register">Register anyway</Button>
          <Button v-else-if="step === 'register'" html-type="submit" form="life-policyholder-form" :pending="pending">{{ editing ? "Save changes" : "Register and link" }}</Button>
        </div>
      </template>
    </NewFormParent>
  </ModalParent>
</template>
