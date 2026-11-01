<script setup>
import { ref, reactive, computed, watch } from 'vue';
import { useModuleStore, MODULES } from '@/stores/moduleStore';
import { useRoute, useRouter } from 'vue-router';
import { useDarkModeStore } from '@/stores/darkMode';
import { submitClaim, validatePolicyCoverage } from '@/features/motor/claims/api/digitalChannelApi';
import MotorNotificationFields from '@/features/motor/claims/components/MotorNotificationFields.vue';
import ClaimStepper from '@/features/motor/claims/components/ClaimStepper.vue';
import {
  emptyNotificationForm, validateNotificationForm, notificationWarnings, toClaimPayload, saveNotificationFormLocally, formatFormDate,
} from '@/features/motor/claims/notificationForm';
import { LANGS, notificationLabel } from '@/features/motor/claims/notificationLabels';

// OWN_DAMAGE → "Own Damage"
const titleCase = (v) => String(v || '').toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

const route = useRoute();
const router = useRouter();
const moduleStore = useModuleStore();
const darkStore = useDarkModeStore();
const isDark = computed(() => darkStore.isDark);

const mod = computed(() => {
  if (moduleStore.activeModule) return moduleStore.activeModule;
  const seg = route.path.split('/')[1];
  const found = MODULES.find(m => m.id === seg);
  if (found) { moduleStore.selectModule(found.id); return found; }
  return null;
});

const policyNumber = ref('');
const coverageType = ref('');
const causeOfLoss = ref('');
const incidentLocation = ref('');
const description = ref('');
const estimatedAmount = ref('');
const licenseNumber = ref('');
const thirdPartyDetails = ref('');
const submitting = ref(false);
const policyValidation = ref(null);
const message = ref('');

// Motor claims are entered from Standard's "Notification of Motor Accident" form.
const isMotor = computed(() => (mod.value?.id || 'motor') === 'motor');
const motorForm = reactive(emptyNotificationForm());
const motorErrors = ref({});
const motorWarnings = computed(() => notificationWarnings(motorForm));
// The claim the backend returned after a motor submit; shows the print panel.
const submittedClaim = ref(null);

watch(() => motorForm.vehicle.policyNo, () => { policyValidation.value = null; });

// Form labels in English or the paper form's Amharic; remembered per browser.
const LANG_KEY = 'motor.claimForm.lang';
const formLang = ref((() => { try { return localStorage.getItem(LANG_KEY) === 'am' ? 'am' : 'en'; } catch { return 'en'; } })());

function loadEthiopicFont() {
  if (document.getElementById('noto-sans-ethiopic')) return;
  const link = document.createElement('link');
  link.id = 'noto-sans-ethiopic';
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+Ethiopic:wght@400;600;700&display=swap';
  document.head.appendChild(link);
}

watch(formLang, (lang) => {
  try { localStorage.setItem(LANG_KEY, lang); } catch { /* not saved; fine */ }
  if (lang === 'am') loadEthiopicFont();
}, { immediate: true });

const coverageOptions = {
  motor: ['OWN_DAMAGE', 'THIRD_PARTY', 'COMPREHENSIVE'],
  health: ['INPATIENT', 'OUTPATIENT', 'DENTAL_OPTICAL', 'MATERNITY'],
  fire: ['FIRE_AND_LIGHTNING', 'SPECIAL_PERILS', 'CONSEQUENTIAL_LOSS'],
  marine: ['CARGO_ALL_RISKS', 'INLAND_TRANSIT', 'HULL_AND_MACHINERY'],
  life: ['TERM_LIFE', 'WHOLE_LIFE', 'ENDOWMENT'],
  engineering: ['CONTRACTORS_ALL_RISK', 'ERECTION_ALL_RISK', 'CPM'],
  liability: ['PUBLIC_LIABILITY', 'EMPLOYERS_LIABILITY', 'PRODUCTS_LIABILITY'],
  burglary: ['COMMERCIAL_BURGLARY', 'RESIDENTIAL_THEFT', 'CASH_IN_TRANSIT']
};

const causesByModule = {
  motor: ['COLLISION', 'OVERTURNING', 'THIRD_PARTY_PROPERTY', 'THIRD_PARTY_BODILY_INJURY', 'THEFT', 'FIRE'],
  health: ['INPATIENT_HOSPITALIZATION', 'SURGERY', 'CHRONIC_CARE', 'EMERGENCY'],
  fire: ['FIRE_BREAKOUT', 'LIGHTNING_STRIKE', 'EXPLOSION', 'WATER_DAMAGE'],
  marine: ['VESSEL_COLLISION', 'CARGO_DAMAGE_TRANSIT', 'WATER_INGRESS'],
  life: ['DEATH_NATURAL', 'DEATH_ACCIDENTAL', 'PERMANENT_DISABILITY'],
  engineering: ['MACHINERY_BREAKDOWN', 'SITE_COLLAPSE', 'CIVIL_COMMOTION'],
  liability: ['THIRD_PARTY_INJURY', 'PROPERTY_DAMAGE_CLAIM', 'WORKPLACE_ACCIDENT'],
  burglary: ['BREAK_IN_THEFT', 'ARMED_ROBBERY', 'CASH_SNATCHING']
};

const currentCoverages = computed(() => coverageOptions[mod.value?.id] || coverageOptions.motor);
const currentCauses = computed(() => causesByModule[mod.value?.id] || causesByModule.motor);

watch([mod, currentCoverages, currentCauses], () => {
  if (currentCoverages.value.length && (!coverageType.value || !currentCoverages.value.includes(coverageType.value))) {
    coverageType.value = currentCoverages.value[0];
  }
  if (currentCauses.value.length && (!causeOfLoss.value || !currentCauses.value.includes(causeOfLoss.value))) {
    causeOfLoss.value = currentCauses.value[0];
  }
}, { immediate: true });

const isPolicyValid = computed(() => {
  if (!policyValidation.value) return false;
  return policyValidation.value.valid === true || policyValidation.value.isValid === true;
});

async function checkPolicy() {
  const number = isMotor.value ? motorForm.vehicle.policyNo.trim() : policyNumber.value;
  if (!number) return;
  policyValidation.value = await validatePolicyCoverage(number, mod.value?.id, causeOfLoss.value);
}

// The paper form's six sections, grouped into four wizard steps.
const MOTOR_STEPS = [
  { n: 1, label: 'Policy & vehicle', hint: 'Sections 1–2', prefixes: ['policyHolder.', 'vehicle.', 'estimatedAmount'] },
  { n: 2, label: 'Driver', hint: 'Section 3', prefixes: ['driver.'] },
  { n: 3, label: 'Accident', hint: 'Section 4', prefixes: ['accident.'] },
  { n: 4, label: 'Damage & review', hint: 'Sections 5–6', prefixes: ['damage.', 'injuries'] },
];
const step = ref(1);
const maxReached = ref(1);
const stepTop = ref(null);

function allMotorErrors() {
  const errors = validateNotificationForm(motorForm);
  if (!estimatedAmount.value || Number(estimatedAmount.value) < 100) {
    errors.estimatedAmount = 'Enter the estimated loss (at least ETB 100)';
  }
  return errors;
}

function errorsForSteps(errors, upTo) {
  const prefixes = MOTOR_STEPS.filter(s => s.n <= upTo).flatMap(s => s.prefixes);
  return Object.fromEntries(Object.entries(errors).filter(([k]) => prefixes.some(p => k.startsWith(p))));
}

function stepErrorCount(n) {
  const prefixes = MOTOR_STEPS[n - 1].prefixes;
  return Object.keys(motorErrors.value).filter(k => prefixes.some(p => k.startsWith(p))).length;
}

const wizardSteps = computed(() => MOTOR_STEPS.map(s => {
  const errors = stepErrorCount(s.n);
  let state = 'todo';
  if (step.value === s.n) state = errors ? 'error current' : 'current';
  else if (errors) state = 'error';
  else if (s.n < maxReached.value) state = 'done';
  return { ...s, state, hint: errors ? `${errors} to fix` : s.hint };
}));

function showStep(n) {
  step.value = n;
  maxReached.value = Math.max(maxReached.value, n);
  stepTop.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/** Moves to step n; going forward checks every step in between and stops at the first one with gaps. */
function goToStep(n) {
  message.value = '';
  if (n <= step.value) return showStep(n);
  const errors = errorsForSteps(allMotorErrors(), n - 1);
  motorErrors.value = errors;
  const blocked = MOTOR_STEPS.find(s => s.n < n && stepErrorCount(s.n));
  if (blocked) {
    message.value = `Complete the highlighted fields in "${blocked.label}" first.`;
    return showStep(blocked.n);
  }
  showStep(n);
}

async function handleMotorSubmit() {
  message.value = '';
  if (step.value < MOTOR_STEPS.length) return goToStep(step.value + 1);
  motorErrors.value = allMotorErrors();
  if (Object.keys(motorErrors.value).length) {
    const first = MOTOR_STEPS.find(s => stepErrorCount(s.n));
    message.value = 'Please complete the highlighted fields.';
    if (first) showStep(first.n);
    return;
  }
  submitting.value = true;
  try {
    const form = JSON.parse(JSON.stringify(motorForm));
    const res = await submitClaim(toClaimPayload(form, {
      coverageType: coverageType.value,
      causeOfLoss: causeOfLoss.value,
      estimatedAmount: estimatedAmount.value,
    }));
    saveNotificationFormLocally(res, form);
    submittedClaim.value = res || {};
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (e) {
    message.value = 'Failed to submit claim: ' + e.message;
  } finally {
    submitting.value = false;
  }
}

function printNotificationForm(claimUuid) {
  const target = router.resolve({ name: 'motor-claim-notification-print', params: { claimUuid: claimUuid || undefined } });
  window.open(target.href, '_blank', 'noopener');
}

function startAnotherClaim() {
  Object.assign(motorForm, emptyNotificationForm());
  estimatedAmount.value = '';
  policyValidation.value = null;
  motorErrors.value = {};
  submittedClaim.value = null;
  message.value = '';
  step.value = 1;
  maxReached.value = 1;
}

const reasonText = { OWNERSHIP: 'Ownership', EMPLOYED: 'Employed', RENT: 'Rent', OTHER: 'Other' };
const show = (v) => (v === null || v === undefined || String(v).trim() === '' ? '—' : v);

async function handleSubmit() {
  if (isMotor.value) return handleMotorSubmit();
  submitting.value = true;
  message.value = '';
  try {
    const payload = {
      policyNumber: policyNumber.value,
      productModule: mod.value?.id || 'motor',
      coverageType: coverageType.value,
      causeOfLoss: causeOfLoss.value,
      incidentLocation: incidentLocation.value,
      description: description.value || `Claim reported for ${mod.value?.name || 'Insurance'}`,
      estimatedAmount: Number(estimatedAmount.value),
      licenseNumber: mod.value?.id === 'motor' ? licenseNumber.value : undefined,
      thirdPartyDetails: thirdPartyDetails.value || undefined
    };

    const res = await submitClaim(payload);
    message.value = `Claim submitted successfully! Claim Number: ${res.claimNumber}`;
    setTimeout(() => {
      router.push(`/${mod.value?.id}/claims/process`);
    }, 1500);
  } catch (e) {
    message.value = 'Failed to submit claim: ' + e.message;
  } finally {
    submitting.value = false;
  }
}

function goBack() {
  router.push(`/${mod.value?.id}/dashboard`);
}
</script>

<template>
  <div class="cn-root" :class="{ dark: isDark }">
    <div class="cn-header">
      <button class="cn-back" aria-label="Back" @click="goBack">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:18px;height:18px"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
      </button>
      <div>
        <h1 class="cn-title">New {{ mod?.name }} claim</h1>
        <p class="cn-sub" v-if="isMotor">Copy the customer's Notification of Motor Accident form, one step at a time</p>
        <p class="cn-sub" v-else>Submit digital claim notification for {{ mod?.name }}</p>
      </div>
      <div v-if="isMotor" class="cn-header-tools">
        <div class="cn-lang" role="group" aria-label="Form language">
          <button
            v-for="l in LANGS"
            :key="l.code"
            type="button"
            :class="{ active: formLang === l.code }"
            :aria-pressed="formLang === l.code"
            @click="formLang = l.code"
          >{{ l.label }}</button>
        </div>
        <button type="button" class="cn-blank-btn" @click="printNotificationForm()">Print blank form</button>
      </div>
    </div>

    <div v-if="isMotor && submittedClaim" class="cn-card cn-done" role="status">
      <div class="cn-done-icon">✓</div>
      <h2 class="cn-done-title">Claim submitted</h2>
      <p class="cn-done-text">
        Claim number <strong class="font-mono">{{ submittedClaim.claimNumber || '—' }}</strong>.
        Print the notification form for the insured and the driver to sign.
      </p>
      <div class="cn-actions cn-done-actions">
        <button type="button" class="cn-cancel" @click="startAnotherClaim">New claim</button>
        <button v-if="submittedClaim.claimUuid" type="button" class="cn-cancel" @click="router.push(`/motor/claims/detail/${submittedClaim.claimUuid}`)">Open claim</button>
        <button type="button" class="cn-submit" :style="`background:linear-gradient(135deg,${mod?.color?.from},${mod?.color?.to})`" @click="printNotificationForm(submittedClaim.claimUuid)">
          Print notification form
        </button>
      </div>
    </div>

    <form v-else class="cn-card" novalidate @submit.prevent="handleSubmit">
      <div v-if="message" class="cn-alert" :class="message.includes('success') ? 'success' : 'error'">
        {{ message }}
      </div>

      <template v-if="isMotor">
        <div ref="stepTop" class="cn-stepper-wrap">
          <ClaimStepper :steps="wizardSteps" label="Claim steps" @select="s => goToStep(s.n)" />
        </div>

        <div v-if="step === 1" class="cn-notice" :lang="formLang">{{ notificationLabel('notice', formLang) }}</div>

        <div :key="step" class="cn-step-body">
        <div v-if="step === 1" class="cn-grid cn-office">
          <div class="cn-field">
            <label for="cn-cover">Coverage type <b class="cn-req" aria-hidden="true">*</b></label>
            <select id="cn-cover" v-model="coverageType" required>
              <option v-for="opt in currentCoverages" :key="opt" :value="opt">{{ titleCase(opt) }}</option>
            </select>
          </div>
          <div class="cn-field">
            <label for="cn-cause">Cause of loss <b class="cn-req" aria-hidden="true">*</b></label>
            <select id="cn-cause" v-model="causeOfLoss" required>
              <option v-for="c in currentCauses" :key="c" :value="c">{{ titleCase(c) }}</option>
            </select>
          </div>
          <div class="cn-field" :class="{ err: motorErrors.estimatedAmount }">
            <label for="cn-estimate">Estimated loss (ETB) <b class="cn-req" aria-hidden="true">*</b></label>
            <input id="cn-estimate" v-model="estimatedAmount" type="number" min="100" placeholder="Best guess of the repair cost" />
            <small v-if="motorErrors.estimatedAmount" class="cn-err">{{ motorErrors.estimatedAmount }}</small>
          </div>
        </div>

        <MotorNotificationFields :form="motorForm" :errors="motorErrors" :step="step" :lang="formLang">
          <template #policy-number="{ label }">
            <div class="cn-field span-2" :class="{ err: motorErrors['vehicle.policyNo'] }">
              <label for="cn-policy">{{ label }} <b class="cn-req" aria-hidden="true">*</b></label>
              <div class="cn-input-group">
                <input id="cn-policy" v-model="motorForm.vehicle.policyNo" type="text" />
                <button type="button" class="cn-verify-btn" @click="checkPolicy">Verify</button>
              </div>
              <small v-if="motorErrors['vehicle.policyNo']" class="cn-err">{{ motorErrors['vehicle.policyNo'] }}</small>
              <div v-if="policyValidation" class="cn-val-tag" :class="isPolicyValid ? 'valid' : 'invalid'">
                <span class="cn-val-icon">{{ isPolicyValid ? '✓' : '✕' }}</span>
                <span>{{ policyValidation.validationMessage }}</span>
              </div>
            </div>
          </template>
        </MotorNotificationFields>

        <section v-if="step === 4" class="cn-review" aria-label="Review before submitting">
          <h2 class="cn-review-title">Check the details before you submit</h2>
          <div class="cn-review-grid">
            <div class="cn-review-card">
              <div class="cn-review-head"><span>Policy &amp; vehicle</span><button type="button" @click="goToStep(1)">Edit</button></div>
              <dl>
                <dt>Policy holder</dt><dd>{{ show(motorForm.policyHolder.fullName) }}</dd>
                <dt>Phone</dt><dd>{{ show(motorForm.policyHolder.phone) }}</dd>
                <dt>VAT registered</dt><dd>{{ motorForm.policyHolder.vatRegistered === true ? `Yes · ${show(motorForm.policyHolder.vatNumber)}` : motorForm.policyHolder.vatRegistered === false ? 'No' : '—' }}</dd>
                <dt>Policy No</dt><dd class="font-mono">{{ show(motorForm.vehicle.policyNo) }}</dd>
                <dt>Plate No</dt><dd class="font-mono">{{ show(motorForm.vehicle.plateNo) }}</dd>
                <dt>Vehicle</dt><dd>{{ show([motorForm.vehicle.typeAndMake, motorForm.vehicle.yearOfMake].filter(Boolean).join(', ')) }}</dd>
                <dt>Cover / cause</dt><dd>{{ titleCase(coverageType) }} · {{ titleCase(causeOfLoss) }}</dd>
                <dt>Estimated loss</dt><dd>{{ estimatedAmount ? `ETB ${Number(estimatedAmount).toLocaleString()}` : '—' }}</dd>
              </dl>
            </div>
            <div class="cn-review-card">
              <div class="cn-review-head"><span>Driver</span><button type="button" @click="goToStep(2)">Edit</button></div>
              <dl>
                <dt>Name</dt><dd>{{ show(motorForm.driver.fullName) }}</dd>
                <dt>Driving as</dt><dd>{{ show(motorForm.driver.reasonForDriving === 'OTHER' ? motorForm.driver.reasonOther : reasonText[motorForm.driver.reasonForDriving]) }}</dd>
                <dt>Licence</dt><dd class="font-mono">{{ show(motorForm.driver.licenceNo) }} {{ motorForm.driver.grade ? `· ${motorForm.driver.grade}` : '' }}</dd>
                <dt>Licence expiry</dt><dd>{{ show(formatFormDate(motorForm.driver.licenceExpiryDate)) }}</dd>
              </dl>
            </div>
            <div class="cn-review-card">
              <div class="cn-review-head"><span>Accident</span><button type="button" @click="goToStep(3)">Edit</button></div>
              <dl>
                <dt>When</dt><dd>{{ show([formatFormDate(motorForm.accident.date), motorForm.accident.time].filter(Boolean).join(' ')) }}</dd>
                <dt>Where</dt><dd>{{ show(motorForm.accident.place) }}</dd>
                <dt>Other party</dt><dd>{{ show([motorForm.accident.otherParty.ownerName, motorForm.accident.otherParty.plateNo].filter(Boolean).join(' · ')) }}</dd>
                <dt>Police</dt><dd>{{ show(motorForm.accident.police) }}</dd>
              </dl>
              <p class="cn-review-desc">{{ show(motorForm.accident.description) }}</p>
            </div>
          </div>
        </section>

        <ul v-if="motorWarnings.length && step >= 2" class="cn-warnings">
          <li v-for="w in motorWarnings" :key="w">{{ w }}</li>
        </ul>
        </div>
      </template>

      <div v-else class="cn-grid">
        <div class="cn-field">
          <label>Policy Number *</label>
          <div class="cn-input-group">
            <input v-model="policyNumber" type="text" required placeholder="e.g. NYA-POL-2026-001" />
            <button type="button" class="cn-verify-btn" @click="checkPolicy">Verify</button>
          </div>
          <div v-if="policyValidation" class="cn-val-tag" :class="isPolicyValid ? 'valid' : 'invalid'">
            <span class="cn-val-icon">{{ isPolicyValid ? '✓' : '✕' }}</span>
            <span>{{ policyValidation.validationMessage }}</span>
          </div>
        </div>

        <div class="cn-field">
          <label>Coverage Type *</label>
          <select v-model="coverageType" required>
            <option v-for="opt in currentCoverages" :key="opt" :value="opt">{{ opt.replace(/_/g, ' ') }}</option>
          </select>
        </div>

        <div class="cn-field">
          <label>Cause of Loss *</label>
          <select v-model="causeOfLoss" required>
            <option v-for="c in currentCauses" :key="c" :value="c">{{ c.replace(/_/g, ' ') }}</option>
          </select>
        </div>

        <div class="cn-field">
          <label>Estimated Loss Amount (ETB) *</label>
          <input v-model="estimatedAmount" type="number" required min="100" />
        </div>

        <div class="cn-field span-2">
          <label>Incident Location *</label>
          <input v-model="incidentLocation" type="text" required placeholder="Sub-city, Woreda, Landmark" />
        </div>

        <div class="cn-field span-2" v-if="coverageType.includes('THIRD_PARTY')">
          <label>Third Party Involved Details</label>
          <input v-model="thirdPartyDetails" type="text" placeholder="Name, Phone, Vehicle/Property Details, Third Party Insurer" />
        </div>

        <div class="cn-field span-2">
          <label>Description of Incident</label>
          <textarea v-model="description" rows="3" placeholder="Describe how the loss occurred..."></textarea>
        </div>
      </div>

      <div v-if="isMotor" class="cn-actions">
        <button v-if="step === 1" type="button" class="cn-cancel" @click="goBack">Cancel</button>
        <button v-else type="button" class="cn-cancel" @click="goToStep(step - 1)">← Back</button>
        <span class="cn-step-count">Step {{ step }} of {{ MOTOR_STEPS.length }}</span>
        <button type="submit" class="cn-submit" :disabled="submitting" :style="`background:linear-gradient(135deg,${mod?.color?.from},${mod?.color?.to})`">
          <template v-if="step < MOTOR_STEPS.length">Next: {{ MOTOR_STEPS[step].label }} →</template>
          <template v-else>{{ submitting ? 'Submitting…' : 'Submit claim ✓' }}</template>
        </button>
      </div>
      <div v-else class="cn-actions">
        <button type="button" class="cn-cancel" @click="goBack">Cancel</button>
        <button type="submit" class="cn-submit" :disabled="submitting" :style="`background:linear-gradient(135deg,${mod?.color?.from},${mod?.color?.to})`">
          {{ submitting ? 'Submitting Claim...' : 'Submit Digital Claim' }}
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped src="../claimUi.css"></style>
