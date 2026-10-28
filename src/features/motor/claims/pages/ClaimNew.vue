<script setup>
import { ref, computed, watch } from 'vue';
import { useModuleStore, MODULES } from '@/stores/moduleStore';
import { useRoute, useRouter } from 'vue-router';
import { useDarkModeStore } from '@/stores/darkMode';
import { submitClaim, validatePolicyCoverage } from '@/features/digitalChannel/api/digitalChannelApi';

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

const policyNumber = ref('NYA-POL-2026-001');
const coverageType = ref('');
const causeOfLoss = ref('');
const incidentLocation = ref('Addis Ababa, Bole Road');
const description = ref('');
const estimatedAmount = ref(45000);
const licenseNumber = ref('ET-DL-98412');
const thirdPartyDetails = ref('');
const submitting = ref(false);
const policyValidation = ref(null);
const message = ref('');

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
  if (!policyNumber.value) return;
  policyValidation.value = await validatePolicyCoverage(policyNumber.value, mod.value?.id, causeOfLoss.value);
}

async function handleSubmit() {
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
      <button class="cn-back" @click="goBack">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:18px;height:18px"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
      </button>
      <div>
        <h1 class="cn-title">File New {{ mod?.name }} Claim</h1>
        <p class="cn-sub">Submit digital claim notification for {{ mod?.name }}</p>
      </div>
    </div>

    <form class="cn-card" @submit.prevent="handleSubmit">
      <div v-if="message" class="cn-alert" :class="message.includes('success') ? 'success' : 'error'">
        {{ message }}
      </div>

      <div class="cn-grid">
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

        <div class="cn-field" :class="{ 'span-2': mod?.id !== 'motor' }">
          <label>Incident Location *</label>
          <input v-model="incidentLocation" type="text" required placeholder="Sub-city, Woreda, Landmark" />
        </div>

        <div class="cn-field" v-if="mod?.id === 'motor'">
          <label>Driving License Number</label>
          <input v-model="licenseNumber" type="text" placeholder="e.g. ET-DL-98412" />
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

      <div class="cn-actions">
        <button type="button" class="cn-cancel" @click="goBack">Cancel</button>
        <button type="submit" class="cn-submit" :disabled="submitting" :style="`background:linear-gradient(135deg,${mod?.color?.from},${mod?.color?.to})`">
          {{ submitting ? 'Submitting Claim...' : 'Submit Digital Claim' }}
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>

.cn-root {
  font-family: 'Inter', system-ui, sans-serif;
  --cn-bg: #f8fafc; --cn-card: #fff; --cn-border: #e2e8f0;
  --cn-title: #0f172a; --cn-sub: #64748b; --cn-input-bg: #fff;
  --cn-accent: #6366f1;
  min-height: 100%; background: var(--cn-bg); padding: 1.5rem 2rem 3rem;
}
.cn-root.dark {
  --cn-bg: #090d16; --cn-card: rgba(30,41,59,0.65); --cn-border: rgba(255,255,255,0.06);
  --cn-title: #f1f5f9; --cn-sub: #94a3b8; --cn-input-bg: rgba(15,23,42,0.6);
}

.cn-header { display: flex; align-items: center; gap: .75rem; margin-bottom: 1.5rem; }
.cn-back { background: var(--cn-card); border: 1px solid var(--cn-border); border-radius: 10px; padding: .5rem; cursor: pointer; color: var(--cn-sub); display: flex; transition: all .2s; }
.cn-back:hover { border-color: var(--cn-accent); color: var(--cn-accent); }
.cn-title { font-size: 1.15rem; font-weight: 800; color: var(--cn-title); }
.cn-sub { font-size: .78rem; color: var(--cn-sub); margin-top: .1rem; }

.cn-card { background: var(--cn-card); border: 1px solid var(--cn-border); border-radius: 16px; padding: 2rem; width: 100%; max-width: 1000px; box-shadow: 0 1px 4px rgba(0,0,0,0.03); }

.cn-grid { display: grid; grid-template-columns: 1fr; gap: 1.1rem 1.5rem; }
@media(min-width: 680px) { .cn-grid { grid-template-columns: repeat(2, 1fr); } }
.span-2 { grid-column: span 1; }
@media(min-width: 680px) { .span-2 { grid-column: span 2; } }

.cn-field { display: flex; flex-direction: column; gap: .35rem; min-width: 0; }
.cn-field label { font-size: .75rem; font-weight: 700; color: var(--cn-title); letter-spacing: .02em; }
.cn-field input, .cn-field select, .cn-field textarea {
  background: var(--cn-input-bg); border: 1px solid var(--cn-border); border-radius: 9px;
  padding: .65rem .9rem; font-size: .84rem; color: var(--cn-title); outline: none;
  transition: border-color .2s, box-shadow .2s; width: 100%; box-sizing: border-box;
  font-family: inherit;
}
.cn-field select { text-overflow: ellipsis; white-space: nowrap; overflow: hidden; }
.cn-field textarea { resize: vertical; min-height: 80px; }
.cn-field input:focus, .cn-field select:focus, .cn-field textarea:focus { border-color: var(--cn-accent); box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }

.cn-input-group { display: flex; gap: .5rem; width: 100%; }
.cn-input-group input { flex: 1; min-width: 0; }
.cn-verify-btn { padding: 0 1rem; font-size: .75rem; font-weight: 700; background: var(--cn-accent); color: #fff; border: none; border-radius: 9px; cursor: pointer; flex-shrink: 0; transition: all .2s; }
.cn-verify-btn:hover { background: #4f46e5; }

.cn-val-tag { font-size: .72rem; font-weight: 700; margin-top: .35rem; padding: .3rem .6rem; border-radius: 6px; display: inline-flex; align-items: center; gap: .3rem; width: fit-content; }
.cn-val-tag.valid { color: #047857; background: #ecfdf5; border: 1px solid rgba(16,185,129,0.2); }
.cn-val-tag.invalid { color: #b91c1c; background: #fef2f2; border: 1px solid rgba(239,68,68,0.2); }
.cn-val-icon { font-weight: 900; }

.cn-alert { padding: .7rem 1rem; border-radius: 10px; font-size: .82rem; font-weight: 700; margin-bottom: 1.25rem; }
.cn-alert.success { background: #ecfdf5; color: #059669; border: 1px solid rgba(16,185,129,0.2); }
.cn-alert.error { background: #fef2f2; color: #dc2626; border: 1px solid rgba(220,38,38,0.2); }

.cn-actions { display: flex; justify-content: flex-end; gap: .75rem; margin-top: 1.75rem; padding-top: 1.25rem; border-top: 1px solid var(--cn-border); }
.cn-cancel { padding: .55rem 1.2rem; border-radius: 9px; border: 1px solid var(--cn-border); background: transparent; color: var(--cn-sub); font-weight: 700; font-size: .84rem; cursor: pointer; transition: all .2s; }
.cn-cancel:hover { border-color: var(--cn-title); color: var(--cn-title); }
.cn-submit { padding: .6rem 1.5rem; border-radius: 9px; border: none; color: #fff; font-weight: 700; font-size: .84rem; cursor: pointer; box-shadow: 0 4px 14px rgba(99,102,241,0.2); transition: all .2s; }
.cn-submit:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(99,102,241,0.3); }
.cn-submit:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
</style>
