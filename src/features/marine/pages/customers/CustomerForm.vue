<script setup>
// Register or edit a customer: company (trade licence, TIN, VAT) or individual (three-part name, ID),
// with contact and Ethiopian address. Saving a new customer opens it on the Documents tab, since the
// licence and TIN certificate (or ID copy) are needed before approval.
import { computed, onMounted, ref } from "vue";
import { onBeforeRouteLeave, useRoute, useRouter } from "vue-router";
import { openModal } from "@customizer/modal-x";
import Button from "@/components/Button.vue";
import { toasted } from "@/utils/utils";
import MarinePageHeader from "../../components/MarinePageHeader.vue";
import PageState from "../../components/PageState.vue";
import FormField from "../../components/FormField.vue";
import FormErrorBanner from "../../components/FormErrorBanner.vue";
import PartyPicker from "../../components/PartyPicker.vue";
import DateField from "../../components/DateField.vue";
import { cardClass, inputClass, inputBorder } from "../../components/styles";
import { required, emailRule, useForm } from "../../composables/useForm";
import { useCan, useMarineRoles } from "../../composables/useCan";
import { createCustomer, getCustomer, updateCustomer } from "../../api/marineApi";
import { notifyError } from "../../api/marineClient";
import { BUSINESS_TYPES, CUSTOMER_KINDS, ETH_REGIONS, ID_TYPES } from "../../constants";
import { todayIso } from "../../utils/format";

const route = useRoute();
const router = useRouter();
const roles = useMarineRoles();
const { can } = useCan();
const brokerOnly = computed(() => roles.value.length > 0 && roles.value.every((r) => r === "BROKER"));
const editId = route.params.id ?? null;
const loading = ref(!!editId);
const loadError = ref(null);
const existing = ref(null);
let saved = false;

const company = (f) => f.kind === "COMPANY";
const person = (f) => f.kind === "INDIVIDUAL";
const when = (test, rule) => (v, f) => (test(f) ? rule(v, f) : "");
const tinRule = (v) => (v && !/^\d{10}$/.test(v) ? "TIN is 10 digits" : "");

const { form, errors, pending, check, validate, applyServerError, bannerItems, submitted } = useForm(
  {
    kind: "COMPANY",
    name: "",
    tin: "",
    tradeLicenceNo: "",
    tradeLicenceExpiry: "",
    vatRegNo: "",
    businessType: "",
    contactPerson: "",
    firstName: "",
    fatherName: "",
    grandfatherName: "",
    idType: "",
    idNumber: "",
    dateOfBirth: "",
    phone: "",
    email: "",
    region: "",
    city: "",
    subCity: "",
    woreda: "",
    houseNo: "",
    broker: null,
  },
  {
    name: when(company, required("Company name")),
    tin: (v, f) => (company(f) && !v ? "TIN is required" : tinRule(v)),
    tradeLicenceNo: when(company, required("Trade licence number")),
    tradeLicenceExpiry: when(company, (v) => (!v ? "Licence expiry is required" : v < todayIso() ? "The trade licence has expired" : "")),
    businessType: when(company, required("Business type")),
    contactPerson: when(company, required("Contact person")),
    firstName: when(person, required("First name")),
    fatherName: when(person, required("Father's name")),
    grandfatherName: when(person, required("Grandfather's name")),
    idType: when(person, required("ID type")),
    idNumber: when(person, required("ID number")),
    dateOfBirth: (v) => (v && v > todayIso() ? "Date of birth can't be in the future" : ""),
    phone: (v) => (String(v).replace(/\D/g, "").length < 9 ? "Enter a phone number with at least 9 digits" : ""),
    email: emailRule,
    region: required("Region"),
    city: required("City"),
  },
  {
    name: "Company name", tin: "TIN", tradeLicenceNo: "Trade licence number", tradeLicenceExpiry: "Licence expiry", businessType: "Business type",
    contactPerson: "Contact person", firstName: "First name", fatherName: "Father's name", grandfatherName: "Grandfather's name", idType: "ID type",
    idNumber: "ID number", dateOfBirth: "Date of birth", phone: "Phone", email: "Email", region: "Region", city: "City",
  }
);
const initial = ref("");
const dirty = computed(() => !saved && JSON.stringify(form) !== initial.value);
const approved = computed(() => existing.value?.status === "APPROVED");

onMounted(async () => {
  if (editId) {
    const res = await getCustomer(editId);
    loading.value = false;
    if (!res.ok) return (loadError.value = res.error);
    existing.value = res.data;
    const d = res.data;
    Object.assign(form, {
      ...Object.fromEntries(Object.keys(form).filter((k) => k in d && typeof d[k] !== "object").map((k) => [k, d[k] ?? ""])),
      ...(d.addressParts ?? {}),
      broker: d.broker,
    });
  }
  initial.value = JSON.stringify(form);
});

async function submit() {
  if (!validate()) return;
  pending.value = true;
  const f = form;
  const body = {
    kind: f.kind,
    ...(company(f)
      ? { name: f.name, tin: f.tin, tradeLicenceNo: f.tradeLicenceNo, tradeLicenceExpiry: f.tradeLicenceExpiry, vatRegNo: f.vatRegNo, businessType: f.businessType, contactPerson: f.contactPerson }
      : { firstName: f.firstName, fatherName: f.fatherName, grandfatherName: f.grandfatherName, idType: f.idType, idNumber: f.idNumber, dateOfBirth: f.dateOfBirth, tin: f.tin }),
    phone: f.phone,
    email: f.email,
    addressParts: { region: f.region, city: f.city, subCity: f.subCity, woreda: f.woreda, houseNo: f.houseNo },
    brokerId: f.broker?.id ?? null,
  };
  const res = editId ? await updateCustomer(editId, body) : await createCustomer(body);
  pending.value = false;
  if (!res.ok) {
    // The server names address fields addressParts.region; the form calls them region
    if (res.error.fields?.length) res.error.fields = res.error.fields.map((x) => ({ ...x, field: x.field.replace("addressParts.", "") }));
    if (!applyServerError(res.error)) notifyError(res.error);
    return;
  }
  saved = true;
  if (editId) {
    toasted(true, res.data.status === "PENDING_APPROVAL" && approved.value ? `${res.data.name} saved and sent back for approval` : `${res.data.name} saved`);
    router.push(`/marine/customers/${res.data.id}`);
  } else {
    toasted(true, `${res.data.customerNo} registered. Upload the documents, then it goes for approval.`);
    router.push(`/marine/customers/${res.data.id}?tab=documents`);
  }
}

onBeforeRouteLeave(
  () =>
    !dirty.value ||
    new Promise((resolve) =>
      openModal("MarineConfirm", { title: "Leave without saving?", message: "This customer's details will be lost.", confirmLabel: "Leave", danger: true }, (r) => resolve(!!r?.confirmed))
    )
);
</script>

<template>
  <div class="marine-page">
    <MarinePageHeader
      :title="existing ? `Edit ${existing.name}` : 'Register customer'"
      :subtitle="existing ? existing.customerNo : 'A new customer is reviewed by underwriting before it can be insured.'"
      :crumbs="[{ label: 'Marine' }, { label: 'Customers', to: '/marine/customers' }, { label: existing?.customerNo ?? 'New' }]"
    />
    <PageState v-if="loading" kind="loading" />
    <PageState v-else-if="loadError" :kind="loadError.status === 404 ? 'notFound' : 'error'" :message="loadError.message" />
    <PageState v-else-if="!can('customer.register')" kind="forbidden" message="Your role can't register customers." />
    <form v-else novalidate class="grid gap-4 max-w-5xl" @submit.prevent="submit">
      <FormErrorBanner :items="submitted ? bannerItems() : []" />
      <p v-if="approved" role="status" class="p-3 text-sm rounded-xl bg-warning-soft text-warning-strong">
        This customer is approved. Changing the name, TIN, trade licence or ID sends it back for approval.
      </p>

      <section :class="[cardClass, 'p-5 grid gap-4']">
        <h2 class="text-sm font-semibold text-ink">Customer type</h2>
        <div class="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Customer type">
          <label
            v-for="k in CUSTOMER_KINDS"
            :key="k.value"
            :class="['flex gap-3 items-start p-3.5 rounded-xl border cursor-pointer', form.kind === k.value ? 'border-primary bg-primary/5' : 'border-line', existing ? 'cursor-not-allowed opacity-70' : '']"
          >
            <input v-model="form.kind" type="radio" :value="k.value" :disabled="!!existing" class="mt-1 accent-[rgb(var(--primary))]" />
            <span>
              <span class="block text-sm font-semibold text-ink">{{ k.label }}</span>
              <span class="block text-xs text-ink-muted">{{ k.value === "COMPANY" ? "PLC, share company or sole trader with a trade licence" : "A person insuring their own goods" }}</span>
            </span>
          </label>
        </div>
      </section>

      <section v-if="form.kind === 'COMPANY'" :class="[cardClass, 'p-5 grid gap-5 sm:grid-cols-2']">
        <h2 class="text-sm font-semibold sm:col-span-2 text-ink">Company</h2>
        <FormField v-slot="{ id, invalid }" label="Company name" name="name" required :error="errors.name" class="sm:col-span-2" hint="As on the trade licence">
          <input :id="id" v-model="form.name" :class="[inputClass, inputBorder(invalid)]" @blur="check('name')" />
        </FormField>
        <FormField v-slot="{ id, invalid }" label="TIN" name="tin" required :error="errors.tin" hint="10 digits">
          <input :id="id" v-model.trim="form.tin" inputmode="numeric" maxlength="10" :class="[inputClass, inputBorder(invalid), 'tabular-nums']" @blur="check('tin')" />
        </FormField>
        <FormField v-slot="{ id }" label="VAT registration no" name="vatRegNo">
          <input :id="id" v-model.trim="form.vatRegNo" :class="[inputClass, 'border-line']" />
        </FormField>
        <FormField v-slot="{ id, invalid }" label="Trade licence number" name="tradeLicenceNo" required :error="errors.tradeLicenceNo">
          <input :id="id" v-model.trim="form.tradeLicenceNo" :class="[inputClass, inputBorder(invalid)]" @blur="check('tradeLicenceNo')" />
        </FormField>
        <FormField v-slot="{ id, invalid }" label="Licence valid until" name="tradeLicenceExpiry" required :error="errors.tradeLicenceExpiry">
          <DateField :id="id" v-model="form.tradeLicenceExpiry" :min="todayIso()" :invalid="invalid" @blur="check('tradeLicenceExpiry')" />
        </FormField>
        <FormField v-slot="{ id, invalid }" label="Business type" name="businessType" required :error="errors.businessType">
          <select :id="id" v-model="form.businessType" :class="[inputClass, inputBorder(invalid)]" @change="check('businessType')">
            <option value="" disabled>Choose</option>
            <option v-for="b in BUSINESS_TYPES" :key="b.value" :value="b.value">{{ b.label }}</option>
          </select>
        </FormField>
        <FormField v-slot="{ id, invalid }" label="Contact person" name="contactPerson" required :error="errors.contactPerson">
          <input :id="id" v-model="form.contactPerson" :class="[inputClass, inputBorder(invalid)]" @blur="check('contactPerson')" />
        </FormField>
      </section>

      <section v-else :class="[cardClass, 'p-5 grid gap-5 sm:grid-cols-3']">
        <h2 class="text-sm font-semibold sm:col-span-3 text-ink">Person</h2>
        <FormField v-slot="{ id, invalid }" label="First name" name="firstName" required :error="errors.firstName">
          <input :id="id" v-model="form.firstName" :class="[inputClass, inputBorder(invalid)]" @blur="check('firstName')" />
        </FormField>
        <FormField v-slot="{ id, invalid }" label="Father's name" name="fatherName" required :error="errors.fatherName">
          <input :id="id" v-model="form.fatherName" :class="[inputClass, inputBorder(invalid)]" @blur="check('fatherName')" />
        </FormField>
        <FormField v-slot="{ id, invalid }" label="Grandfather's name" name="grandfatherName" required :error="errors.grandfatherName">
          <input :id="id" v-model="form.grandfatherName" :class="[inputClass, inputBorder(invalid)]" @blur="check('grandfatherName')" />
        </FormField>
        <FormField v-slot="{ id, invalid }" label="ID type" name="idType" required :error="errors.idType">
          <select :id="id" v-model="form.idType" :class="[inputClass, inputBorder(invalid)]" @change="check('idType')">
            <option value="" disabled>Choose</option>
            <option v-for="t in ID_TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
          </select>
        </FormField>
        <FormField v-slot="{ id, invalid }" label="ID number" name="idNumber" required :error="errors.idNumber">
          <input :id="id" v-model.trim="form.idNumber" :class="[inputClass, inputBorder(invalid)]" @blur="check('idNumber')" />
        </FormField>
        <FormField v-slot="{ id, invalid }" label="Date of birth" name="dateOfBirth" :error="errors.dateOfBirth" hint="Optional">
          <DateField :id="id" v-model="form.dateOfBirth" :max="todayIso()" :invalid="invalid" @blur="check('dateOfBirth')" />
        </FormField>
        <FormField v-slot="{ id, invalid }" label="TIN" name="tin" :error="errors.tin" hint="Optional, 10 digits">
          <input :id="id" v-model.trim="form.tin" inputmode="numeric" maxlength="10" :class="[inputClass, inputBorder(invalid), 'tabular-nums']" @blur="check('tin')" />
        </FormField>
      </section>

      <section :class="[cardClass, 'p-5 grid gap-5 sm:grid-cols-2']">
        <h2 class="text-sm font-semibold sm:col-span-2 text-ink">Contact and address</h2>
        <FormField v-slot="{ id, invalid }" label="Phone" name="phone" required :error="errors.phone" hint="e.g. +251 91 123 4567">
          <input :id="id" v-model="form.phone" type="tel" :class="[inputClass, inputBorder(invalid)]" @blur="check('phone')" />
        </FormField>
        <FormField v-slot="{ id, invalid }" label="Email" name="email" :error="errors.email" hint="Certificates and debit notes are sent here">
          <input :id="id" v-model.trim="form.email" type="email" :class="[inputClass, inputBorder(invalid)]" @blur="check('email')" />
        </FormField>
        <FormField v-slot="{ id, invalid }" label="Region" name="region" required :error="errors.region">
          <select :id="id" v-model="form.region" :class="[inputClass, inputBorder(invalid)]" @change="check('region')">
            <option value="" disabled>Choose</option>
            <option v-for="r in ETH_REGIONS" :key="r" :value="r">{{ r }}</option>
          </select>
        </FormField>
        <FormField v-slot="{ id, invalid }" label="City or town" name="city" required :error="errors.city">
          <input :id="id" v-model="form.city" :class="[inputClass, inputBorder(invalid)]" @blur="check('city')" />
        </FormField>
        <FormField v-slot="{ id }" label="Sub-city" name="subCity">
          <input :id="id" v-model="form.subCity" :class="[inputClass, 'border-line']" />
        </FormField>
        <div class="grid grid-cols-2 gap-3">
          <FormField v-slot="{ id }" label="Woreda" name="woreda"><input :id="id" v-model="form.woreda" :class="[inputClass, 'border-line']" /></FormField>
          <FormField v-slot="{ id }" label="House no" name="houseNo"><input :id="id" v-model="form.houseNo" :class="[inputClass, 'border-line']" /></FormField>
        </div>
        <FormField v-if="!brokerOnly" v-slot="{ id }" label="Broker" name="broker" hint="The broker who introduced this customer, if any" class="sm:col-span-2">
          <PartyPicker :id="id" v-model="form.broker" type="BROKER" :can-create="false" />
        </FormField>
      </section>

      <div class="flex gap-2 justify-end">
        <Button variant="outline" @click="router.back()">Cancel</Button>
        <Button html-type="submit" :pending="pending">{{ existing ? "Save changes" : "Register customer" }}</Button>
      </div>
    </form>
  </div>
</template>
