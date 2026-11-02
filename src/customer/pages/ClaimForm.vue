<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { listMyPolicies, verifyPolicy, createClaim, uploadClaimDocument, describeError } from '@/customer/api';
import { currentUser, fullName } from '@/customer/session';
import { validateEthiopianPhone } from '@/customer/validators';
import FormField from '@/customer/components/FormField.vue';
import DocumentSlot from '@/customer/components/DocumentSlot.vue';

// The customer's version of Standard Insurance's paper "Notification of Motor Accident" form: the same
// six sections, shorter, filled in from the policy and the customer's profile. Same steps, same
// questions and the same request as the mobile app.
const STEPS = ['About you', 'The driver', 'The accident', 'Other party', 'Injuries', 'Documents'];
const LAST = STEPS.length - 1;

const CLAIM_TYPES = [
  { value: 'OWN_DAMAGE', label: 'Damage to my vehicle' },
  { value: 'TP_PROPERTY', label: 'Damage to someone else’s property' },
  { value: 'TP_BODILY_INJURY', label: 'Injury to another person' },
  { value: 'TP_DEATH', label: 'Death of another person' },
  { value: 'TOTAL_LOSS', label: 'Total loss of my vehicle' },
];
const REASONS = [
  { value: 'OWNERSHIP', label: 'I own the vehicle' },
  { value: 'EMPLOYED', label: 'Employed to drive it' },
  { value: 'RENT', label: 'Rented' },
  { value: 'OTHER', label: 'Other' },
];
const GRADES = ['', '1ST', '2ND', '3RD', '4TH', '5TH'].map((g) => ({ value: g, label: g || 'Choose' }));
const USES = ['Private', 'Commercial', 'Taxi or hire', 'Other'].map((u) => ({ value: u, label: u }));
const RESPONSIBLE = ['Not sure yet', 'Me', 'The other party', 'Both'].map((r) => ({ value: r, label: r }));
/** The document slots to the codes the claims service accepts (same table as the mobile app) */
const DOC_CODES = {
  PHOTOGRAPH: 'ACCIDENT_PHOTO', POLICE_REPORT: 'POLICE_REPORT', DRIVING_LICENSE: 'DRIVING_LICENCE', GARAGE_BID: 'PROFORMA_INVOICE',
  POWER_OF_ATTORNEY: 'POWER_OF_ATTORNEY', TITLE_DEED: 'VEHICLE_TITLE_DEED', TP_TITLE_DEED: 'OTHER', MEDICAL_CERT: 'OTHER', CUSTOMS_LETTER: 'OTHER',
};
const DOC_LABELS = {
  PHOTOGRAPH: 'Photos of the damage', POLICE_REPORT: 'Police report', DRIVING_LICENSE: 'Driving licence',
  GARAGE_BID: 'Proforma invoice (repair estimate)', POWER_OF_ATTORNEY: 'Power of attorney', TITLE_DEED: 'Vehicle title deed (Libre)',
  TP_TITLE_DEED: 'Third party title deed', MEDICAL_CERT: 'Medical certificate', CUSTOMS_LETTER: 'Customs letter',
};

const route = useRoute();
const policyNumber = computed(() => String(route.params.policyNumber || ''));
const user = currentUser();

const loading = ref(true);
const loadError = ref('');
const car = ref({});
const page = ref(0);
const submitting = ref(false);
const submitError = ref('');
const errors = reactive({});
const created = ref(null);
const failedDocs = ref([]);
const gpsBusy = ref(false);
const gpsMessage = ref('');

const today = new Date();
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const hhmm = (d) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

const f = reactive({
  ph: { fullName: fullName(user), phone: user?.mobilePhone || '', profession: '', address: '', subCity: '', kebele: '', houseNo: '' },
  v: { policyNo: policyNumber.value, plateNo: '', typeAndMake: '', yearOfMake: '', use: 'Private' },
  iAmDriver: true,
  d: { fullName: '', phone: '', age: '', address: '', subCity: '', kebele: '', houseNo: '', profession: '', reason: 'OWNERSHIP', reasonOther: '', licenceNo: '', grade: '', issue: '', expiry: '' },
  a: { date: iso(today), time: hhmm(today), place: '', description: '', speed: '', distance: '', goods: '', responsible: 'Not sure yet', drivable: true, towing: false, otherPolicies: '', police: '', passengers: '', witnesses: '' },
  claimType: 'OWN_DAMAGE',
  otherInvolved: false,
  o: { ownerName: '', ownerPhone: '', plateNo: '', driverName: '' },
  dm: { vehicle: '', other: '', estimate: '' },
  anyInjured: false,
  injured: [{ name: '', contact: '' }],
  filedByRepresentative: false,
  declaration: false,
  gps: null,
  documents: { PHOTOGRAPH: [], POLICE_REPORT: [], DRIVING_LICENSE: [], GARAGE_BID: [], TP_TITLE_DEED: [], MEDICAL_CERT: [], TITLE_DEED: [], CUSTOMS_LETTER: [], POWER_OF_ATTORNEY: [] },
});

const isTp = computed(() => f.claimType.startsWith('TP_'));
const showOther = computed(() => f.otherInvolved || isTp.value);
const docSlots = computed(() => {
  const t = f.claimType;
  return [
    { key: 'PHOTOGRAPH', required: true },
    { key: 'POLICE_REPORT', required: true },
    { key: 'DRIVING_LICENSE', required: true },
    ...(t === 'OWN_DAMAGE' || t === 'TP_PROPERTY' || t === 'TOTAL_LOSS' ? [{ key: 'GARAGE_BID', required: false }] : []),
    ...(t === 'TP_PROPERTY' ? [{ key: 'TP_TITLE_DEED', required: true }] : []),
    ...(t === 'TP_BODILY_INJURY' || t === 'TP_DEATH' ? [{ key: 'MEDICAL_CERT', required: false }] : []),
    ...(t === 'TOTAL_LOSS' ? [{ key: 'TITLE_DEED', required: false }, { key: 'CUSTOMS_LETTER', required: false }] : []),
    ...(f.filedByRepresentative ? [{ key: 'POWER_OF_ATTORNEY', required: true }] : []),
  ];
});

const num = (v) => Number(String(v).replace(/,/g, ''));

/** What the claims service needs, checked page by page so a missing answer is caught where it is entered. */
function validate(p) {
  const e = {};
  const need = (key, value, msg) => { if (!String(value ?? '').trim()) e[key] = msg; };
  const phone = (key, value, required = false) => {
    if (!String(value ?? '').trim()) { if (required) e[key] = 'Please enter a phone number'; return; }
    const problem = validateEthiopianPhone(value);
    if (problem) e[key] = problem;
  };
  if (p === 0) {
    need('ph.fullName', f.ph.fullName, 'Please enter your name');
    phone('ph.phone', f.ph.phone, true);
    need('v.policyNo', f.v.policyNo, 'The policy number is missing');
    need('v.plateNo', f.v.plateNo, 'Please enter the plate number');
  } else if (p === 1) {
    if (!f.iAmDriver) { need('d.fullName', f.d.fullName, 'Please enter the driver’s name'); phone('d.phone', f.d.phone); }
    need('d.licenceNo', f.d.licenceNo, 'Please enter the driver’s licence number');
    if (!f.iAmDriver && f.d.reason === 'OTHER') need('d.reasonOther', f.d.reasonOther, 'Please say why the driver was driving');
    if (f.d.issue && f.d.expiry && f.d.expiry < f.d.issue) e['d.expiry'] = 'The expiry date is before the issue date';
  } else if (p === 2) {
    need('a.date', f.a.date, 'Please choose the date of the accident');
    need('a.place', f.a.place, 'Please enter where the accident happened');
    need('a.description', f.a.description, 'Please describe what happened');
    if (f.a.date) {
      const when = new Date(`${f.a.date}T${f.a.time || '00:00'}`);
      if (when.getTime() > Date.now() + 5 * 60 * 1000) e['a.date'] = 'The accident date cannot be in the future';
    }
  } else if (p === 3) {
    if (isTp.value) {
      need('o.ownerName', f.o.ownerName, 'Please enter the other party’s name');
      phone('o.ownerPhone', f.o.ownerPhone, true);
      need('o.plateNo', f.o.plateNo, 'Please enter the other party’s plate number');
    } else if (f.otherInvolved) {
      phone('o.ownerPhone', f.o.ownerPhone);
    }
    const est = num(f.dm.estimate);
    if (!(est > 0)) e['dm.estimate'] = 'Please give your best estimate of the cost (ETB)';
  } else if (p === 5) {
    const have = (k) => f.documents[k].length > 0;
    if (!have('PHOTOGRAPH') || !have('POLICE_REPORT') || !have('DRIVING_LICENSE')) e.documents = 'Please add the photos, the police report and the driving licence';
    else if (f.filedByRepresentative && !have('POWER_OF_ATTORNEY')) e.documents = 'Please add the power of attorney';
    else if (!f.declaration) e.documents = 'Please confirm the declaration before submitting';
  }
  return e;
}

function setErrors(e) {
  Object.keys(errors).forEach((k) => delete errors[k]);
  Object.assign(errors, e);
}

function go(p) {
  page.value = p;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function next() {
  const e = validate(page.value);
  setErrors(e);
  if (Object.keys(e).length) {
    requestAnimationFrame(() => document.querySelector('[aria-invalid="true"]')?.focus());
    return;
  }
  if (page.value === LAST) submit();
  else go(page.value + 1);
}

const back = () => go(page.value - 1);
const err = (k) => errors[k] || '';

function captureGps() {
  if (!navigator.geolocation) { gpsMessage.value = 'This browser cannot share your location.'; return; }
  gpsBusy.value = true;
  gpsMessage.value = '';
  navigator.geolocation.getCurrentPosition(
    (p) => { f.gps = `${p.coords.latitude.toFixed(6)}, ${p.coords.longitude.toFixed(6)}`; gpsBusy.value = false; },
    () => { gpsMessage.value = 'Could not get your location. Allow location access and try again.'; gpsBusy.value = false; },
    { enableHighAccuracy: true, timeout: 10000 },
  );
}

/** The answers in the shape of the paper form, the same notificationForm the staff app prints. */
function buildForm() {
  const me = f.iAmDriver;
  const s = (v) => String(v ?? '').trim();
  return {
    policyHolder: { fullName: s(f.ph.fullName), profession: s(f.ph.profession), address: s(f.ph.address), subCity: s(f.ph.subCity), kebele: s(f.ph.kebele), houseNo: s(f.ph.houseNo), phone: s(f.ph.phone), vatRegistered: null, vatNumber: '' },
    vehicle: { policyNo: s(f.v.policyNo), plateNo: s(f.v.plateNo), typeAndMake: s(f.v.typeAndMake), use: f.v.use, yearOfMake: s(f.v.yearOfMake) },
    driver: {
      fullName: me ? s(f.ph.fullName) : s(f.d.fullName),
      address: me ? s(f.ph.address) : s(f.d.address),
      subCity: me ? s(f.ph.subCity) : s(f.d.subCity),
      kebele: me ? s(f.ph.kebele) : s(f.d.kebele),
      houseNo: me ? s(f.ph.houseNo) : s(f.d.houseNo),
      phone: me ? s(f.ph.phone) : s(f.d.phone),
      reasonForDriving: me ? 'OWNERSHIP' : f.d.reason,
      reasonOther: !me && f.d.reason === 'OTHER' ? s(f.d.reasonOther) : '',
      profession: me ? s(f.ph.profession) : s(f.d.profession),
      age: s(f.d.age), licenceNo: s(f.d.licenceNo), grade: f.d.grade, licenceIssueDate: f.d.issue, licenceExpiryDate: f.d.expiry,
    },
    accident: {
      date: f.a.date, time: f.a.time, place: s(f.a.place), speed: s(f.a.speed), distanceFromRoadSide: s(f.a.distance),
      vehicleCondition: f.a.drivable ? 'Can be driven' : (f.a.towing ? 'Cannot be driven, towing needed' : 'Cannot be driven'),
      goodsCarried: s(f.a.goods), description: s(f.a.description),
      otherParty: {
        ownerName: showOther.value ? s(f.o.ownerName) : '', ownerSubCity: '', ownerWoreda: '', ownerKebele: '',
        ownerPhone: showOther.value ? s(f.o.ownerPhone) : '', plateNo: showOther.value ? s(f.o.plateNo) : '',
        driverName: showOther.value ? s(f.o.driverName) : '', driverSubCity: '', driverWoreda: '', driverKebele: '', driverHouseNo: '',
      },
      responsible: f.a.responsible, otherPolicies: s(f.a.otherPolicies), police: s(f.a.police), passengers: s(f.a.passengers), witnesses: s(f.a.witnesses),
    },
    damage: { insuredVehicle: s(f.dm.vehicle), otherProperty: s(f.dm.other) },
    injuries: f.anyInjured ? f.injured.filter((i) => s(i.name)).map((i) => ({ name: s(i.name), address: s(i.contact), identity: '' })) : [],
  };
}

function buildPayload(form) {
  const driver = form.driver;
  const other = form.accident.otherParty;
  const speed = String(f.a.speed).match(/\d+/);
  return {
    policyNumber: policyNumber.value,
    productModule: 'motor',
    coverageType: car.value.coverageType || 'COMPREHENSIVE',
    insuredUuid: user?.userUuid || '',
    carUuid: car.value.carUuid || undefined,
    plateNumber: f.v.plateNo.trim(),
    submittedVia: 'WEB',
    causeOfLoss: f.claimType,
    claimType: f.claimType,
    incidentDate: `${f.a.date}T${f.a.time || '00:00'}:00`,
    incidentTime: f.a.time || undefined,
    incidentLocation: f.a.place.trim(),
    gpsCoordinates: f.gps || undefined,
    description: f.a.description.trim(),
    estimatedAmount: num(f.dm.estimate),
    driverName: driver.fullName,
    licenseNumber: driver.licenceNo,
    driverLicenseNumber: driver.licenceNo,
    driverLicenseType: driver.grade || undefined,
    driverRelationship: driver.reasonForDriving === 'OTHER' ? driver.reasonOther : driver.reasonForDriving,
    vehicleSpeed: speed ? parseInt(speed[0], 10) : undefined,
    damagedParts: f.dm.vehicle.trim(),
    isVehicleDrivable: f.a.drivable,
    towingRequired: f.a.towing,
    thirdPartyName: other.ownerName || undefined,
    thirdPartyPhone: other.ownerPhone || undefined,
    thirdPartyPlate: other.plateNo || undefined,
    thirdPartyDetails: [other.ownerName, other.plateNo ? `Plate ${other.plateNo}` : '', other.ownerPhone].filter(Boolean).join(', ') || undefined,
    filedByRepresentative: f.filedByRepresentative,
    notificationForm: form,
  };
}

/** Where each field the claims service can reject lives in this form: [field key, page] */
const SERVER_FIELDS = {
  policyNumber: ['v.policyNo', 0], plateNumber: ['v.plateNo', 0],
  driverName: ['d.fullName', 1], licenseNumber: ['d.licenceNo', 1], driverLicenseNumber: ['d.licenceNo', 1], driverLicenseType: ['d.licenceNo', 1],
  incidentDate: ['a.date', 2], incidentTime: ['a.date', 2], incidentLocation: ['a.place', 2], description: ['a.description', 2],
  estimatedAmount: ['dm.estimate', 3], thirdPartyName: ['o.ownerName', 3], thirdPartyPhone: ['o.ownerPhone', 3], thirdPartyPlate: ['o.plateNo', 3],
  'notificationForm.policyHolder.fullName': ['ph.fullName', 0], 'notificationForm.policyHolder.phone': ['ph.phone', 0],
};

/** The claims service names the fields it rejected: show each under its field and go to the first one's page. */
function showServerFieldErrors(e) {
  const list = e?.response?.data?.fieldErrors;
  if (!Array.isArray(list)) return false;
  const found = {};
  let first = LAST;
  for (const fe of list) {
    const target = SERVER_FIELDS[fe?.field];
    if (!target) continue;
    found[target[0]] = fe.message || 'Please check this field';
    first = Math.min(first, target[1]);
  }
  if (!Object.keys(found).length) return false;
  setErrors(found);
  go(first);
  return true;
}

async function submit() {
  if (submitting.value) return;
  submitting.value = true;
  submitError.value = '';
  try {
    const form = buildForm();
    const claim = await createClaim(buildPayload(form));
    // The claim exists from here on, so a failed upload never loses it
    const failed = new Set();
    for (const [slot, files] of Object.entries(f.documents)) {
      for (const file of files) {
        try { await uploadClaimDocument(claim.claimUuid, DOC_CODES[slot] || 'OTHER', file); } catch (e) { failed.add(DOC_LABELS[slot] || slot); }
      }
    }
    failedDocs.value = [...failed];
    created.value = claim;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (e) {
    if (!showServerFieldErrors(e)) submitError.value = describeError(e, 'We could not submit your claim. Please check the details and try again.');
  } finally {
    submitting.value = false;
  }
}

onMounted(async () => {
  try {
    // The same source as the mobile app's list of vehicles; the policy lookup covers a policy found by number
    const cars = await listMyPolicies(user?.userUuid).catch(() => []);
    let c = cars.find((x) => x.policyNumber === policyNumber.value);
    if (!c) {
      const p = await verifyPolicy(policyNumber.value);
      if (p?.valid !== true) throw Object.assign(new Error('invalid'), { message: p?.validationMessage || 'This policy cannot be used to file a claim.' });
      c = { plateNumber: p.plateNumber, carName: p.vehicleTypeAndMake, coverageType: p.coverageType, makeYear: p.yearOfMake };
    }
    car.value = c;
    f.v.plateNo = c.plateNumber || '';
    f.v.typeAndMake = [c.carName, c.carModel].filter(Boolean).join(' ');
    f.v.yearOfMake = c.makeYear ? String(c.makeYear) : '';
  } catch (e) {
    loadError.value = e?.response?.status === 403
      ? 'This policy is not registered to your account.'
      : (e?.response ? describeError(e, 'We could not load that policy.') : (e?.message || 'We could not load that policy.'));
  } finally {
    loading.value = false;
  }
});

const progress = computed(() => STEPS.map((_, i) => i <= page.value));
</script>

<template>
  <div class="mx-auto max-w-2xl">
    <div v-if="loading" class="rounded-2xl border border-line bg-surface p-8 text-center text-ink-muted">Loading your policy…</div>

    <div v-else-if="loadError" class="rounded-2xl border border-error bg-surface p-6" role="alert">
      <p class="font-semibold text-error-strong">We can’t file a claim on this policy</p>
      <p class="mt-1 text-sm text-ink-muted">{{ loadError }}</p>
      <router-link to="/policies" class="mt-4 inline-block rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white">Choose another policy</router-link>
    </div>

    <!-- Submitted -->
    <div v-else-if="created" class="space-y-5 text-center">
      <section class="rounded-2xl border border-success bg-surface p-6 shadow-card">
        <p class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success-soft text-2xl text-success-strong">✓</p>
        <h1 class="mt-3 text-xl font-semibold">Your claim was submitted</h1>
        <p class="mt-1 text-sm text-ink-muted">Thank you. Standard Insurance has received your claim and will contact you about the next steps.</p>
        <p v-if="failedDocs.length" role="alert" class="mt-4 rounded-lg bg-warning-soft px-3 py-2 text-left text-sm text-warning-strong">
          Your claim is saved, but we could not upload: {{ failedDocs.join(', ') }}. Please add them again from the claim tracker.
        </p>
        <div class="mt-5 rounded-xl border border-primary/30 bg-primary/5 p-4">
          <p class="text-xs uppercase tracking-wide text-ink-subtle">Claim number</p>
          <p class="text-xl font-semibold text-primary">{{ created.claimNumber }}</p>
        </div>
        <ul v-if="created.warnings?.length" class="mt-3 list-disc pl-5 text-left text-sm text-warning-strong">
          <li v-for="w in created.warnings" :key="w">{{ w }}</li>
        </ul>
      </section>
      <div class="flex flex-col gap-3">
        <router-link :to="`/claims/${created.claimUuid}/form`" class="rounded-xl border border-line px-5 py-3 text-sm font-semibold hover:bg-surface-muted">Download my claim form (PDF)</router-link>
        <router-link :to="`/claims/${created.claimUuid}`" class="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-hover">Track my claim</router-link>
        <router-link to="/policies" class="text-sm text-primary underline">Back to my vehicles</router-link>
      </div>
    </div>

    <!-- The form -->
    <form v-else novalidate @submit.prevent="next">
      <p class="text-xs font-semibold uppercase tracking-wide text-ink-subtle">Step {{ page + 1 }} of {{ STEPS.length }}: {{ STEPS[page] }}</p>
      <div class="mt-2 flex gap-1.5" role="progressbar" :aria-valuenow="page + 1" :aria-valuemax="STEPS.length" aria-label="Claim progress">
        <span v-for="(on, i) in progress" :key="i" class="h-1 flex-1 rounded-full" :class="on ? 'bg-primary' : 'bg-line'" />
      </div>

      <div class="mt-5 rounded-2xl border border-line bg-surface p-5 shadow-card sm:p-6">
        <!-- 0: About you -->
        <template v-if="page === 0">
          <h1 class="text-xl font-semibold">About you and your vehicle</h1>
          <p class="text-sm text-ink-muted">Sections 1 and 2 of the form. We filled in what we know.</p>
          <h2 class="mt-5 text-sm font-semibold text-primary">Policy holder</h2>
          <div class="mt-2 grid gap-4 sm:grid-cols-2">
            <FormField v-model="f.ph.fullName" label="Full name *" :error="err('ph.fullName')" autocomplete="name" />
            <FormField v-model="f.ph.phone" label="Phone *" type="tel" :error="err('ph.phone')" autocomplete="tel" />
            <FormField v-model="f.ph.profession" label="Profession (optional)" />
            <FormField v-model="f.ph.address" label="Address (optional)" hint="Area or street" />
            <FormField v-model="f.ph.subCity" label="Sub-city" />
            <div class="grid grid-cols-2 gap-4">
              <FormField v-model="f.ph.kebele" label="Kebele" />
              <FormField v-model="f.ph.houseNo" label="House no." />
            </div>
          </div>
          <h2 class="mt-6 text-sm font-semibold text-primary">Vehicle and policy</h2>
          <div class="mt-2 grid gap-4 sm:grid-cols-2">
            <FormField v-model="f.v.policyNo" label="Policy number *" :error="err('v.policyNo')" />
            <FormField v-model="f.v.plateNo" label="Plate number *" :error="err('v.plateNo')" />
            <FormField v-model="f.v.typeAndMake" label="Type and make" />
            <div class="grid grid-cols-2 gap-4">
              <FormField v-model="f.v.use" label="Use" :options="USES" />
              <FormField v-model="f.v.yearOfMake" label="Year of make" inputmode="numeric" />
            </div>
          </div>
        </template>

        <!-- 1: The driver -->
        <template v-else-if="page === 1">
          <h1 class="text-xl font-semibold">The driver</h1>
          <p class="text-sm text-ink-muted">Section 3. Who was driving when the accident happened?</p>
          <label class="mt-4 flex items-start gap-3 text-sm">
            <input v-model="f.iAmDriver" type="checkbox" class="mt-0.5 h-4 w-4" />
            <span><span class="font-medium">I was driving</span><br /><span class="text-xs text-ink-subtle">{{ f.iAmDriver ? 'We use your details from the first step' : 'Please give the driver’s details' }}</span></span>
          </label>
          <div class="mt-4 grid gap-4 sm:grid-cols-2">
            <template v-if="!f.iAmDriver">
              <FormField v-model="f.d.fullName" label="Driver’s full name *" :error="err('d.fullName')" />
              <FormField v-model="f.d.phone" label="Phone" type="tel" :error="err('d.phone')" />
              <FormField v-model="f.d.age" label="Age" inputmode="numeric" />
              <FormField v-model="f.d.address" label="Address (optional)" />
              <FormField v-model="f.d.subCity" label="Sub-city" />
              <div class="grid grid-cols-2 gap-4">
                <FormField v-model="f.d.kebele" label="Kebele" />
                <FormField v-model="f.d.houseNo" label="House no." />
              </div>
              <FormField v-model="f.d.profession" label="Profession (optional)" />
              <FormField v-model="f.d.reason" label="Why was the driver driving?" :options="REASONS" />
              <FormField v-if="f.d.reason === 'OTHER'" v-model="f.d.reasonOther" label="Please explain *" :error="err('d.reasonOther')" />
            </template>
            <FormField v-else v-model="f.d.age" label="Your age (optional)" inputmode="numeric" />
          </div>
          <h2 class="mt-6 text-sm font-semibold text-primary">Driving licence</h2>
          <div class="mt-2 grid gap-4 sm:grid-cols-2">
            <FormField v-model="f.d.licenceNo" label="Licence number *" :error="err('d.licenceNo')" />
            <FormField v-model="f.d.grade" label="Grade" :options="GRADES" />
            <FormField v-model="f.d.issue" label="Issued" type="date" :max="iso(today)" />
            <FormField v-model="f.d.expiry" label="Expires" type="date" :error="err('d.expiry')" />
          </div>
        </template>

        <!-- 2: The accident -->
        <template v-else-if="page === 2">
          <h1 class="text-xl font-semibold">The accident</h1>
          <p class="text-sm text-ink-muted">Section 4. Tell us what happened.</p>
          <div class="mt-4 grid gap-4 sm:grid-cols-2">
            <FormField v-model="f.a.date" label="Date *" type="date" :max="iso(today)" :error="err('a.date')" />
            <FormField v-model="f.a.time" label="Time" type="time" />
            <div class="sm:col-span-2"><FormField v-model="f.a.place" label="Where did it happen? *" hint="Road, area or landmark" :error="err('a.place')" /></div>
          </div>
          <div class="mt-3 flex flex-wrap items-center gap-3 text-sm">
            <span :class="f.gps ? 'text-success-strong' : 'text-ink-subtle'">{{ f.gps ? `Location captured (${f.gps})` : 'Location not captured' }}</span>
            <button type="button" class="rounded-lg border border-line px-3 py-1.5 text-xs font-medium hover:bg-surface-muted" :disabled="gpsBusy" @click="captureGps">{{ gpsBusy ? 'Locating…' : 'Use my location' }}</button>
            <span v-if="gpsMessage" class="text-xs text-error-strong">{{ gpsMessage }}</span>
          </div>
          <div class="mt-4 grid gap-4 sm:grid-cols-2">
            <div class="sm:col-span-2"><FormField v-model="f.a.description" label="What happened? *" :rows="4" hint="Describe the accident in your own words" :error="err('a.description')" /></div>
            <FormField v-model="f.a.speed" label="Speed (km/h)" inputmode="numeric" />
            <FormField v-model="f.a.responsible" label="Who was responsible?" :options="RESPONSIBLE" />
            <FormField v-model="f.a.distance" label="How far from the roadside? (optional)" hint="For example 2 m" />
            <FormField v-model="f.a.goods" label="Goods carried (optional)" />
          </div>
          <div class="mt-4 space-y-2 text-sm">
            <label class="flex items-center gap-2"><input v-model="f.a.drivable" type="checkbox" class="h-4 w-4" /> The vehicle can still be driven</label>
            <label v-if="!f.a.drivable" class="flex items-center gap-2"><input v-model="f.a.towing" type="checkbox" class="h-4 w-4" /> It needs towing</label>
          </div>
          <h2 class="mt-6 text-sm font-semibold text-primary">Police, passengers and witnesses (optional)</h2>
          <div class="mt-2 grid gap-4">
            <FormField v-model="f.a.otherPolicies" label="Other insurance policy on this vehicle" />
            <FormField v-model="f.a.police" label="Police station and report number" />
            <FormField v-model="f.a.passengers" label="Passengers in the vehicle" />
            <FormField v-model="f.a.witnesses" label="Witnesses" />
          </div>
        </template>

        <!-- 3: Other party and damage -->
        <template v-else-if="page === 3">
          <h1 class="text-xl font-semibold">Other party and damage</h1>
          <p class="text-sm text-ink-muted">Section 5. Who else was involved, and what was damaged?</p>
          <div class="mt-4"><FormField v-model="f.claimType" label="What is this claim for?" :options="CLAIM_TYPES" /></div>
          <label class="mt-4 flex items-start gap-3 text-sm">
            <input :checked="showOther" :disabled="isTp" type="checkbox" class="mt-0.5 h-4 w-4" @change="f.otherInvolved = $event.target.checked" />
            <span><span class="font-medium">Another vehicle or person was involved</span><span v-if="isTp" class="block text-xs text-ink-subtle">Required for this kind of claim</span></span>
          </label>
          <div v-if="showOther" class="mt-4 grid gap-4 sm:grid-cols-2">
            <FormField v-model="f.o.ownerName" label="Other party’s name *" :error="err('o.ownerName')" />
            <FormField v-model="f.o.ownerPhone" :label="isTp ? 'Phone *' : 'Phone'" type="tel" :error="err('o.ownerPhone')" />
            <FormField v-model="f.o.plateNo" :label="isTp ? 'Plate number *' : 'Plate number'" :error="err('o.plateNo')" />
            <FormField v-model="f.o.driverName" label="Their driver’s name (if different)" />
          </div>
          <h2 class="mt-6 text-sm font-semibold text-primary">Damage</h2>
          <div class="mt-2 grid gap-4">
            <FormField v-model="f.dm.vehicle" label="Damage to your vehicle" :rows="3" hint="Which parts are damaged?" />
            <FormField v-model="f.dm.other" label="Damage to other property (optional)" :rows="2" />
            <FormField v-model="f.dm.estimate" label="Estimated repair cost, ETB *" inputmode="decimal" hint="Your best estimate. We confirm it after inspection" :error="err('dm.estimate')" />
          </div>
        </template>

        <!-- 4: Injuries -->
        <template v-else-if="page === 4">
          <h1 class="text-xl font-semibold">Injured persons</h1>
          <p class="text-sm text-ink-muted">Section 6. Was anyone hurt?</p>
          <label class="mt-4 flex items-center gap-3 text-sm font-medium"><input v-model="f.anyInjured" type="checkbox" class="h-4 w-4" /> Someone was injured</label>
          <template v-if="f.anyInjured">
            <div v-for="(p, i) in f.injured" :key="i" class="mt-4 rounded-xl border border-line p-4">
              <div class="flex items-center justify-between">
                <p class="text-sm font-medium">Person {{ i + 1 }}</p>
                <button v-if="f.injured.length > 1" type="button" class="text-xs text-error-strong underline" @click="f.injured.splice(i, 1)">Remove</button>
              </div>
              <div class="mt-3 grid gap-4 sm:grid-cols-2">
                <FormField v-model="p.name" label="Name" />
                <FormField v-model="p.contact" label="Address or phone" />
              </div>
            </div>
            <button type="button" class="mt-3 text-sm font-medium text-primary" @click="f.injured.push({ name: '', contact: '' })">+ Add another person</button>
          </template>
          <p v-else class="mt-4 text-sm text-ink-muted">Leave this off if nobody was injured.</p>
        </template>

        <!-- 5: Documents and declaration -->
        <template v-else>
          <h1 class="text-xl font-semibold">Documents and declaration</h1>
          <p class="text-sm text-ink-muted">Add the documents. Anything missing can be added later from the claim tracker.</p>
          <p v-if="errors.documents" role="alert" class="mt-4 rounded-lg border border-error bg-error-soft px-3 py-2 text-sm font-medium text-error-strong">{{ errors.documents }}</p>
          <div class="mt-4 space-y-3">
            <DocumentSlot
              v-for="s in docSlots" :key="s.key" v-model:files="f.documents[s.key]"
              :label="DOC_LABELS[s.key]" :required="s.required"
            />
          </div>
          <label class="mt-5 flex items-start gap-3 text-sm">
            <input v-model="f.filedByRepresentative" type="checkbox" class="mt-0.5 h-4 w-4" />
            <span><span class="font-medium">I am reporting on behalf of the owner</span><span class="block text-xs text-ink-subtle">A power of attorney is needed</span></span>
          </label>
          <label class="mt-4 flex items-start gap-3 text-sm">
            <input v-model="f.declaration" type="checkbox" class="mt-0.5 h-4 w-4" :aria-invalid="!!errors.documents && !f.declaration" />
            <span>I declare that the information above is true and complete to the best of my knowledge.</span>
          </label>
          <p v-if="submitError" role="alert" class="mt-4 rounded-lg bg-error-soft px-3 py-2 text-sm text-error-strong">{{ submitError }}</p>
        </template>
      </div>

      <div class="mt-5 flex items-center justify-between gap-3">
        <router-link v-if="page === 0" to="/policies" class="rounded-xl border border-line px-5 py-3 text-sm font-semibold hover:bg-surface-muted">Cancel</router-link>
        <button v-else type="button" class="rounded-xl border border-line px-5 py-3 text-sm font-semibold hover:bg-surface-muted" :disabled="submitting" @click="back">Back</button>
        <button type="submit" class="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60" :disabled="submitting">
          {{ submitting ? 'Submitting…' : (page === LAST ? 'Submit claim' : 'Continue') }}
        </button>
      </div>
    </form>
  </div>
</template>
