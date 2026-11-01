<script setup>
// Entry screen for the "Notification of Motor Accident" form. Sections and item numbers
// match the paper form so staff can copy a filled paper form top to bottom. Labels switch
// between English and the form's own Amharic (notificationLabels.js).
import { DRIVING_REASONS, emptyInjured } from '@/features/motor/claims/notificationForm';
import { notificationLabel } from '@/features/motor/claims/notificationLabels';

const props = defineProps({
  form: { type: Object, required: true },
  errors: { type: Object, default: () => ({}) },
  // Wizard step to show (1 policy & vehicle, 2 driver, 3 accident, 4 damage); 0 shows every section.
  step: { type: Number, default: 0 },
  lang: { type: String, default: 'en' },
});

const showStep = (n) => !props.step || props.step === n;
const t = (key) => notificationLabel(key, props.lang);
// Section headings also show the other language, small, so either reader can find their place.
const other = (key) => notificationLabel(key, props.lang === 'am' ? 'en' : 'am');

function addInjured() {
  props.form.injuries.push(emptyInjured());
}

function removeInjured(idx) {
  props.form.injuries.splice(idx, 1);
  if (!props.form.injuries.length) props.form.injuries.push(emptyInjured());
}
</script>

<template>
  <div class="mn-root" :lang="lang">
    <!-- 1) Policy holder -->
    <section v-if="showStep(1)" class="mn-section">
      <h2 class="mn-title"><span class="mn-no">1</span> {{ t('sec.1') }} <span class="mn-alt">{{ other('sec.1') }}</span></h2>
      <div class="mn-grid">
        <label class="mn-field span-2" :class="{ err: errors['policyHolder.fullName'] }">
          <span>1.1 {{ t('fullName') }} <b class="mn-req" aria-hidden="true">*</b></span>
          <input v-model="form.policyHolder.fullName" type="text" />
          <small v-if="errors['policyHolder.fullName']">{{ errors['policyHolder.fullName'] }}</small>
        </label>
        <label class="mn-field">
          <span>{{ t('profession') }}</span>
          <input v-model="form.policyHolder.profession" type="text" />
        </label>
        <label class="mn-field">
          <span>1.2 {{ t('address') }}</span>
          <input v-model="form.policyHolder.address" type="text" placeholder="Town" />
        </label>
        <label class="mn-field">
          <span>{{ t('subCity') }}</span>
          <input v-model="form.policyHolder.subCity" type="text" />
        </label>
        <label class="mn-field">
          <span>{{ t('kebele') }}</span>
          <input v-model="form.policyHolder.kebele" type="text" />
        </label>
        <label class="mn-field">
          <span>{{ t('houseNo') }}</span>
          <input v-model="form.policyHolder.houseNo" type="text" />
        </label>
        <label class="mn-field" :class="{ err: errors['policyHolder.phone'] }">
          <span>{{ t('phone') }} <b class="mn-req" aria-hidden="true">*</b></span>
          <input v-model="form.policyHolder.phone" type="tel" />
          <small v-if="errors['policyHolder.phone']">{{ errors['policyHolder.phone'] }}</small>
        </label>
        <fieldset class="mn-field">
          <legend>1.3 {{ t('vatRegistered') }}</legend>
          <div class="mn-radios" role="radiogroup">
            <label><input v-model="form.policyHolder.vatRegistered" type="radio" :value="true" /> {{ t('yes') }}</label>
            <label><input v-model="form.policyHolder.vatRegistered" type="radio" :value="false" /> {{ t('no') }}</label>
          </div>
        </fieldset>
        <label v-if="form.policyHolder.vatRegistered === true" class="mn-field span-2" :class="{ err: errors['policyHolder.vatNumber'] }">
          <span>{{ t('vatNumber') }} <b class="mn-req" aria-hidden="true">*</b> <em>{{ t('vatAttach') }}</em></span>
          <input v-model="form.policyHolder.vatNumber" type="text" />
          <small v-if="errors['policyHolder.vatNumber']">{{ errors['policyHolder.vatNumber'] }}</small>
        </label>
      </div>
    </section>

    <!-- 2) Policy and vehicle -->
    <section v-if="showStep(1)" class="mn-section">
      <h2 class="mn-title"><span class="mn-no">2</span> {{ t('sec.2') }} <span class="mn-alt">{{ other('sec.2') }}</span></h2>
      <div class="mn-grid">
        <slot name="policy-number" :label="`2.1 ${t('policyNo')}`">
          <label class="mn-field" :class="{ err: errors['vehicle.policyNo'] }">
            <span>2.1 {{ t('policyNo') }} <b class="mn-req" aria-hidden="true">*</b></span>
            <input v-model="form.vehicle.policyNo" type="text" />
            <small v-if="errors['vehicle.policyNo']">{{ errors['vehicle.policyNo'] }}</small>
          </label>
        </slot>
        <label class="mn-field" :class="{ err: errors['vehicle.plateNo'] }">
          <span>2.2 {{ t('plateNo') }} <b class="mn-req" aria-hidden="true">*</b></span>
          <input v-model="form.vehicle.plateNo" type="text" />
          <small v-if="errors['vehicle.plateNo']">{{ errors['vehicle.plateNo'] }}</small>
        </label>
        <label class="mn-field">
          <span>2.3 {{ t('typeAndMake') }}</span>
          <input v-model="form.vehicle.typeAndMake" type="text" />
        </label>
        <label class="mn-field">
          <span>{{ t('vehicleUse') }}</span>
          <input v-model="form.vehicle.use" type="text" placeholder="e.g. Private, Commercial" />
        </label>
        <label class="mn-field">
          <span>{{ t('yearOfMake') }}</span>
          <input v-model="form.vehicle.yearOfMake" type="text" inputmode="numeric" maxlength="4" />
        </label>
      </div>
    </section>

    <!-- 3) Driver -->
    <section v-if="showStep(2)" class="mn-section">
      <h2 class="mn-title"><span class="mn-no">3</span> {{ t('sec.3') }} <span class="mn-alt">{{ other('sec.3') }}</span></h2>
      <div class="mn-grid">
        <label class="mn-field span-2" :class="{ err: errors['driver.fullName'] }">
          <span>3.1 {{ t('driverName') }} <b class="mn-req" aria-hidden="true">*</b></span>
          <input v-model="form.driver.fullName" type="text" />
          <small v-if="errors['driver.fullName']">{{ errors['driver.fullName'] }}</small>
        </label>
        <label class="mn-field">
          <span>3.2 {{ t('address') }}</span>
          <input v-model="form.driver.address" type="text" placeholder="Town" />
        </label>
        <label class="mn-field">
          <span>{{ t('subCity') }}</span>
          <input v-model="form.driver.subCity" type="text" />
        </label>
        <label class="mn-field">
          <span>{{ t('kebele') }}</span>
          <input v-model="form.driver.kebele" type="text" />
        </label>
        <label class="mn-field">
          <span>{{ t('houseNo') }}</span>
          <input v-model="form.driver.houseNo" type="text" />
        </label>
        <label class="mn-field">
          <span>{{ t('phone') }}</span>
          <input v-model="form.driver.phone" type="tel" />
        </label>
        <label class="mn-field" :class="{ err: errors['driver.reasonOther'] }">
          <span>3.3 {{ t('reasonForDriving') }}</span>
          <select v-model="form.driver.reasonForDriving">
            <option value="">{{ lang === 'am' ? 'ይምረጡ…' : 'Choose…' }}</option>
            <option v-for="r in DRIVING_REASONS" :key="r" :value="r">{{ t(`reason.${r}`) }}</option>
          </select>
          <input v-if="form.driver.reasonForDriving === 'OTHER'" v-model="form.driver.reasonOther" type="text" :placeholder="t('reasonOther')" />
          <small v-if="errors['driver.reasonOther']">{{ errors['driver.reasonOther'] }}</small>
        </label>
        <label class="mn-field">
          <span>3.4 {{ t('driverProfession') }}</span>
          <input v-model="form.driver.profession" type="text" />
        </label>
        <label class="mn-field">
          <span>{{ t('age') }}</span>
          <input v-model="form.driver.age" type="number" min="14" max="100" />
        </label>
        <label class="mn-field" :class="{ err: errors['driver.licenceNo'] }">
          <span>3.5 {{ t('licenceNo') }} <b class="mn-req" aria-hidden="true">*</b></span>
          <input v-model="form.driver.licenceNo" type="text" />
          <small v-if="errors['driver.licenceNo']">{{ errors['driver.licenceNo'] }}</small>
        </label>
        <label class="mn-field">
          <span>{{ t('grade') }}</span>
          <input v-model="form.driver.grade" type="text" />
        </label>
        <label class="mn-field">
          <span>{{ t('issueDate') }}</span>
          <input v-model="form.driver.licenceIssueDate" type="date" />
        </label>
        <label class="mn-field">
          <span>{{ t('expiryDate') }}</span>
          <input v-model="form.driver.licenceExpiryDate" type="date" />
        </label>
      </div>
    </section>

    <!-- 4) Accident -->
    <section v-if="showStep(3)" class="mn-section">
      <h2 class="mn-title"><span class="mn-no">4</span> {{ t('sec.4') }} <span class="mn-alt">{{ other('sec.4') }}</span></h2>
      <div class="mn-grid">
        <label class="mn-field" :class="{ err: errors['accident.date'] }">
          <span>4.1 {{ t('accidentDate') }} <b class="mn-req" aria-hidden="true">*</b></span>
          <input v-model="form.accident.date" type="date" />
          <small v-if="errors['accident.date']">{{ errors['accident.date'] }}</small>
        </label>
        <label class="mn-field">
          <span>{{ t('time') }}</span>
          <input v-model="form.accident.time" type="time" />
        </label>
        <label class="mn-field span-2" :class="{ err: errors['accident.place'] }">
          <span>{{ t('place') }} <b class="mn-req" aria-hidden="true">*</b></span>
          <input v-model="form.accident.place" type="text" placeholder="Sub-city, woreda, landmark" />
          <small v-if="errors['accident.place']">{{ errors['accident.place'] }}</small>
        </label>
        <label class="mn-field">
          <span>4.2 {{ t('speed') }}</span>
          <input v-model="form.accident.speed" type="text" placeholder="e.g. 40 km/h" />
        </label>
        <label class="mn-field">
          <span>{{ t('distance') }}</span>
          <input v-model="form.accident.distanceFromRoadSide" type="text" placeholder="e.g. 1 m" />
        </label>
        <label class="mn-field span-2">
          <span>4.3 {{ t('vehicleCondition') }}</span>
          <input v-model="form.accident.vehicleCondition" type="text" />
        </label>
        <label class="mn-field span-2">
          <span>4.4 {{ t('goodsCarried') }}</span>
          <input v-model="form.accident.goodsCarried" type="text" />
        </label>
        <label class="mn-field span-4" :class="{ err: errors['accident.description'] }">
          <span>4.5 {{ t('description') }} <b class="mn-req" aria-hidden="true">*</b></span>
          <textarea v-model="form.accident.description" rows="4"></textarea>
          <small v-if="errors['accident.description']">{{ errors['accident.description'] }}</small>
        </label>
      </div>

      <h3 class="mn-sub">4.6 {{ t('otherParty') }}</h3>
      <div class="mn-grid">
        <label class="mn-field span-2">
          <span>{{ t('owner') }}</span>
          <input v-model="form.accident.otherParty.ownerName" type="text" />
        </label>
        <label class="mn-field">
          <span>{{ t('subCity') }}</span>
          <input v-model="form.accident.otherParty.ownerSubCity" type="text" />
        </label>
        <label class="mn-field">
          <span>{{ t('woreda') }}</span>
          <input v-model="form.accident.otherParty.ownerWoreda" type="text" />
        </label>
        <label class="mn-field">
          <span>{{ t('kebele') }}</span>
          <input v-model="form.accident.otherParty.ownerKebele" type="text" />
        </label>
        <label class="mn-field">
          <span>{{ t('phone') }}</span>
          <input v-model="form.accident.otherParty.ownerPhone" type="tel" />
        </label>
        <label class="mn-field span-2">
          <span>{{ t('otherPlate') }}</span>
          <input v-model="form.accident.otherParty.plateNo" type="text" />
        </label>
        <label class="mn-field span-2">
          <span>{{ t('otherDriver') }}</span>
          <input v-model="form.accident.otherParty.driverName" type="text" />
        </label>
        <label class="mn-field">
          <span>{{ t('subCity') }}</span>
          <input v-model="form.accident.otherParty.driverSubCity" type="text" />
        </label>
        <label class="mn-field">
          <span>{{ t('woreda') }}</span>
          <input v-model="form.accident.otherParty.driverWoreda" type="text" />
        </label>
        <label class="mn-field">
          <span>{{ t('kebele') }}</span>
          <input v-model="form.accident.otherParty.driverKebele" type="text" />
        </label>
        <label class="mn-field">
          <span>{{ t('houseNo') }}</span>
          <input v-model="form.accident.otherParty.driverHouseNo" type="text" />
        </label>
      </div>

      <div class="mn-grid mt">
        <label class="mn-field span-2">
          <span>4.7 {{ t('responsible') }}</span>
          <input v-model="form.accident.responsible" type="text" />
        </label>
        <label class="mn-field span-2">
          <span>4.8 {{ t('otherPolicies') }}</span>
          <input v-model="form.accident.otherPolicies" type="text" placeholder="Leave empty if none" />
        </label>
        <label class="mn-field span-4">
          <span>4.9 {{ t('police') }}</span>
          <textarea v-model="form.accident.police" rows="2"></textarea>
        </label>
        <label class="mn-field span-2">
          <span>4.10 {{ t('passengers') }}</span>
          <textarea v-model="form.accident.passengers" rows="2"></textarea>
        </label>
        <label class="mn-field span-2">
          <span>4.11 {{ t('witnesses') }}</span>
          <textarea v-model="form.accident.witnesses" rows="2"></textarea>
        </label>
      </div>
    </section>

    <!-- 5) Damage -->
    <section v-if="showStep(4)" class="mn-section">
      <h2 class="mn-title"><span class="mn-no">5</span> {{ t('sec.5') }} <span class="mn-alt">{{ other('sec.5') }}</span></h2>
      <div class="mn-grid">
        <label class="mn-field span-2">
          <span>5.1 {{ t('damageInsured') }}</span>
          <textarea v-model="form.damage.insuredVehicle" rows="3"></textarea>
        </label>
        <label class="mn-field span-2">
          <span>5.2 {{ t('damageOther') }}</span>
          <textarea v-model="form.damage.otherProperty" rows="3"></textarea>
        </label>
      </div>
    </section>

    <!-- 6) Injured persons -->
    <section v-if="showStep(4)" class="mn-section">
      <h2 class="mn-title"><span class="mn-no">6</span> {{ t('sec.6') }} <span class="mn-alt">{{ other('sec.6') }}</span></h2>
      <div v-for="(p, idx) in form.injuries" :key="idx" class="mn-injured">
        <label class="mn-field">
          <span>{{ t('injuredName') }}</span>
          <input v-model="p.name" type="text" />
        </label>
        <label class="mn-field">
          <span>{{ t('injuredAddress') }}</span>
          <input v-model="p.address" type="text" />
        </label>
        <label class="mn-field">
          <span>{{ t('injuredIdentity') }}</span>
          <input v-model="p.identity" type="text" placeholder="e.g. Pedestrian, passenger" />
        </label>
        <button type="button" class="mn-remove" :aria-label="`Remove injured person ${idx + 1}`" @click="removeInjured(idx)">✕</button>
      </div>
      <button type="button" class="mn-add" @click="addInjured">+ Add injured person</button>
    </section>
  </div>
</template>

<style scoped>
.mn-root { display: flex; flex-direction: column; gap: 1.25rem; }
.mn-root[lang="am"] { font-family: Ebrima, 'Noto Sans Ethiopic', 'Inter', system-ui, sans-serif; }
.mn-section { border: 1px solid var(--cn-border); border-radius: 12px; padding: 1.1rem 1.25rem 1.25rem; }
.mn-title { display: flex; align-items: center; flex-wrap: wrap; gap: .5rem; font-size: .9rem; font-weight: 800; color: var(--cn-title); margin-bottom: .9rem; font-family: inherit; }
.mn-no { display: inline-flex; align-items: center; justify-content: center; width: 1.5rem; height: 1.5rem; border-radius: 999px; background: var(--cn-accent); color: #fff; font-size: .75rem; }
.mn-alt { font-weight: 600; font-size: .78rem; color: var(--cn-sub); }
.mn-sub { font-size: .78rem; font-weight: 700; color: var(--cn-title); margin: 1rem 0 .6rem; font-family: inherit; }

.mn-grid { display: grid; grid-template-columns: 1fr; gap: .9rem 1rem; }
.mn-grid.mt { margin-top: .9rem; }
@media (min-width: 680px) { .mn-grid { grid-template-columns: repeat(2, 1fr); } .span-2, .span-4 { grid-column: span 2; } }
@media (min-width: 1024px) { .mn-grid { grid-template-columns: repeat(4, 1fr); } .span-4 { grid-column: span 4; } }

.mn-field { display: flex; flex-direction: column; gap: .3rem; min-width: 0; border: 0; padding: 0; margin: 0; }
.mn-field > span, .mn-field legend { font-size: .72rem; font-weight: 700; color: var(--cn-title); }
.mn-root[lang="am"] .mn-field > span, .mn-root[lang="am"] .mn-field legend { font-size: .78rem; font-weight: 600; }
.mn-field em { font-weight: 500; font-style: normal; color: var(--cn-sub); }
.mn-field input:not([type=radio]), .mn-field select, .mn-field textarea {
  background: var(--cn-input-bg); border: 1px solid var(--cn-border); border-radius: 9px;
  padding: .55rem .8rem; font-size: .84rem; color: var(--cn-title); outline: none; width: 100%;
  box-sizing: border-box; font-family: inherit; transition: border-color .2s, box-shadow .2s;
}
.mn-field textarea { resize: vertical; }
.mn-field input:focus, .mn-field select:focus, .mn-field textarea:focus { border-color: var(--cn-accent); box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
.mn-field.err input, .mn-field.err textarea, .mn-field.err select { border-color: #dc2626; }
.mn-field small { color: #dc2626; font-size: .7rem; font-weight: 600; }
.mn-radios { display: inline-flex; padding: 3px; gap: 3px; border: 1px solid var(--cn-border); border-radius: 10px; background: var(--cn-input-bg); width: fit-content; }
.mn-radios label { position: relative; display: inline-flex; align-items: center; padding: .4rem 1.1rem; border-radius: 7px; font-size: .82rem; font-weight: 700; color: var(--cn-sub); cursor: pointer; transition: background .15s, color .15s; }
.mn-radios label:hover { color: var(--cn-title); }
.mn-radios label:has(input:checked) { background: var(--cn-accent); color: #fff; }
.mn-radios label:has(input:focus-visible) { box-shadow: 0 0 0 3px rgba(99,102,241,.25); }
.mn-radios input { position: absolute; opacity: 0; pointer-events: none; }
.mn-req { color: #dc2626; font-weight: 800; }

.mn-injured { display: grid; grid-template-columns: 1fr; gap: .6rem; align-items: end; margin-bottom: .7rem; }
@media (min-width: 680px) { .mn-injured { grid-template-columns: 1fr 1fr 1fr auto; } }
.mn-remove { height: 2.3rem; width: 2.3rem; border-radius: 9px; border: 1px solid var(--cn-border); background: transparent; color: var(--cn-sub); cursor: pointer; }
.mn-remove:hover { border-color: #dc2626; color: #dc2626; }
.mn-add { font-size: .78rem; font-weight: 700; color: var(--cn-accent); background: none; border: 1px dashed var(--cn-accent); border-radius: 9px; padding: .45rem .9rem; cursor: pointer; transition: background .15s; }
.mn-add:hover { background: #eef2ff; }
.mn-section { transition: border-color .2s, box-shadow .2s; }
.mn-section:focus-within { border-color: #c7d2fe; box-shadow: 0 4px 16px rgba(99,102,241,.06); }
</style>
