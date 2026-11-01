// The answers of Standard Insurance's paper "Notification of Motor Accident" form
// (Motor-Claims-Notification-Form.pdf). Field names follow the form's numbered items
// so the entry screen and the print page stay in step with the paper.

const STORAGE_KEY = 'motor.claimNotificationForms.v1';

export const DRIVING_REASONS = ['OWNERSHIP', 'EMPLOYED', 'RENT', 'OTHER'];

export function emptyInjured() {
  return { name: '', address: '', identity: '' };
}

export function emptyNotificationForm() {
  return {
    // 1) Particulars of policy holder
    policyHolder: {
      fullName: '', profession: '',
      address: '', subCity: '', kebele: '', houseNo: '', phone: '',
      vatRegistered: null, // true | false | null (not answered)
      vatNumber: '',
    },
    // 2) Particulars of policy and vehicle
    vehicle: { policyNo: '', plateNo: '', typeAndMake: '', use: '', yearOfMake: '' },
    // 3) Particulars of driver
    driver: {
      fullName: '',
      address: '', subCity: '', kebele: '', houseNo: '', phone: '',
      reasonForDriving: '', reasonOther: '',
      profession: '', age: '',
      licenceNo: '', grade: '', licenceIssueDate: '', licenceExpiryDate: '',
    },
    // 4) Details of accident
    accident: {
      date: '', time: '', place: '',
      speed: '', distanceFromRoadSide: '',
      vehicleCondition: '', goodsCarried: '',
      description: '',
      otherParty: {
        ownerName: '', ownerSubCity: '', ownerWoreda: '', ownerKebele: '', ownerPhone: '',
        plateNo: '',
        driverName: '', driverSubCity: '', driverWoreda: '', driverKebele: '', driverHouseNo: '',
      },
      responsible: '',
      otherPolicies: '',
      police: '',
      passengers: '',
      witnesses: '',
    },
    // 5) Details of damage
    damage: { insuredVehicle: '', otherProperty: '' },
    // 6) Injured persons
    injuries: [emptyInjured()],
  };
}

/** Deep-fills a partial or older saved form with today's empty shape. */
export function normalizeNotificationForm(saved) {
  const base = emptyNotificationForm();
  if (!saved || typeof saved !== 'object') return base;
  const merge = (target, source) => {
    for (const key of Object.keys(target)) {
      const value = source?.[key];
      if (value === undefined || value === null) continue;
      if (Array.isArray(target[key])) continue;
      if (typeof target[key] === 'object' && target[key] !== null) merge(target[key], value);
      else target[key] = value;
    }
    return target;
  };
  merge(base, saved);
  if (typeof saved.policyHolder?.vatRegistered === 'boolean') base.policyHolder.vatRegistered = saved.policyHolder.vatRegistered;
  if (Array.isArray(saved.injuries) && saved.injuries.length) {
    base.injuries = saved.injuries.map(p => ({ ...emptyInjured(), ...p }));
  }
  return base;
}

/** "Must fill" checks before the claim can be submitted: { path: message }. */
export function validateNotificationForm(form) {
  const errors = {};
  const need = (path, value, message) => { if (!String(value ?? '').trim()) errors[path] = message; };
  need('policyHolder.fullName', form.policyHolder.fullName, 'Policy holder name is required');
  need('policyHolder.phone', form.policyHolder.phone, 'Policy holder phone is required');
  need('vehicle.policyNo', form.vehicle.policyNo, 'Policy number is required');
  need('vehicle.plateNo', form.vehicle.plateNo, 'Plate number is required');
  need('driver.fullName', form.driver.fullName, 'Driver name is required');
  need('driver.licenceNo', form.driver.licenceNo, 'Driving licence number is required');
  need('accident.date', form.accident.date, 'Accident date is required');
  need('accident.place', form.accident.place, 'Accident place is required');
  need('accident.description', form.accident.description, 'Description of the accident is required');
  if (form.policyHolder.vatRegistered === true) need('policyHolder.vatNumber', form.policyHolder.vatNumber, 'VAT registration number is required when VAT registered');
  if (form.driver.reasonForDriving === 'OTHER') need('driver.reasonOther', form.driver.reasonOther, 'Say why the driver was driving');
  if (form.accident.date && form.accident.date > todayIso()) errors['accident.date'] = 'Accident date cannot be in the future';
  return errors;
}

/** Things staff should notice but that don't stop the claim (e.g. expired licence). */
export function notificationWarnings(form) {
  const warnings = [];
  const { licenceExpiryDate } = form.driver;
  if (licenceExpiryDate && form.accident.date && licenceExpiryDate < form.accident.date) {
    warnings.push('The driving licence had expired before the accident date.');
  }
  return warnings;
}

const orUndefined = (v) => (String(v ?? '').trim() ? String(v).trim() : undefined);

/** First whole number in free text ("40 km/h" → 40); undefined when there is none. */
function firstInteger(text) {
  const m = String(text ?? '').match(/\d+/);
  return m ? Number(m[0]) : undefined;
}

/**
 * The motor API's ClaimCreateRequest (/api/payer/motor/v3/api-docs) filled from the form, plus the
 * whole form under notificationForm, which the backend doesn't store yet (see
 * docs/motor-claims/backend-prompt.md).
 */
export function toClaimPayload(form, { coverageType, causeOfLoss, estimatedAmount }) {
  const { accident, vehicle, driver, damage } = form;
  const other = accident.otherParty;
  const thirdParty = [other.ownerName, other.plateNo && `Plate ${other.plateNo}`, other.ownerPhone].filter(Boolean).join(', ');
  return {
    policyNumber: vehicle.policyNo.trim(),
    productModule: 'motor',
    coverageType,
    causeOfLoss,
    incidentDate: accident.date ? `${accident.date}T${accident.time || '00:00'}:00` : undefined,
    incidentTime: orUndefined(accident.time),
    incidentLocation: accident.place,
    description: accident.description,
    estimatedAmount: Number(estimatedAmount),
    plateNumber: orUndefined(vehicle.plateNo),
    licenseNumber: orUndefined(driver.licenceNo),
    driverName: orUndefined(driver.fullName),
    driverLicenseNumber: orUndefined(driver.licenceNo),
    driverLicenseType: orUndefined(driver.grade),
    driverRelationship: orUndefined(driver.reasonForDriving === 'OTHER' ? driver.reasonOther : driver.reasonForDriving),
    vehicleSpeed: firstInteger(accident.speed),
    damagedParts: orUndefined(damage.insuredVehicle),
    thirdPartyName: orUndefined(other.ownerName),
    thirdPartyPhone: orUndefined(other.ownerPhone),
    thirdPartyPlate: orUndefined(other.plateNo),
    thirdPartyDetails: thirdParty || undefined,
    notificationForm: form,
  };
}

function readStore() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {};
  } catch {
    return {};
  }
}

/** Keeps a copy in this browser in case the backend doesn't store notificationForm yet. */
export function saveNotificationFormLocally(claim, form) {
  const keys = [claim?.claimUuid, claim?.claimNumber].filter(Boolean);
  if (!keys.length) return;
  try {
    const store = readStore();
    const entry = { form, savedAt: new Date().toISOString() };
    keys.forEach(k => { store[k] = entry; });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Storage full or blocked: the printout falls back to the claim's own fields.
  }
}

/**
 * The form to print for a claim, and where it came from:
 * 'claim' (backend kept it), 'local' (this browser's copy), 'partial' (rebuilt from the
 * claim's basic fields) or 'blank' (no claim).
 */
export function loadNotificationForm(claim) {
  if (!claim) return { form: emptyNotificationForm(), source: 'blank' };
  let fromClaim = claim.notificationForm;
  if (typeof fromClaim === 'string') {
    try { fromClaim = JSON.parse(fromClaim); } catch { fromClaim = null; }
  }
  if (fromClaim && typeof fromClaim === 'object') return { form: normalizeNotificationForm(fromClaim), source: 'claim' };

  const store = readStore();
  const local = store[claim.claimUuid] || store[claim.claimNumber];
  if (local?.form) return { form: normalizeNotificationForm(local.form), source: 'local' };

  const form = emptyNotificationForm();
  form.vehicle.policyNo = claim.policyNumber || '';
  form.driver.licenceNo = claim.licenseNumber || '';
  form.accident.place = claim.incidentLocation || '';
  form.accident.description = claim.description || '';
  if (claim.incidentDate) {
    const d = new Date(claim.incidentDate);
    if (!Number.isNaN(d.getTime())) {
      form.accident.date = localDateIso(d);
      form.accident.time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }
  }
  return { form, source: 'partial' };
}

function localDateIso(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function todayIso() {
  return localDateIso(new Date());
}

/** dd/mm/yyyy as written on Standard's paper forms; '' when empty. */
export function formatFormDate(iso) {
  if (!iso) return '';
  const [y, m, d] = String(iso).slice(0, 10).split('-');
  return y && m && d ? `${d}/${m}/${y}` : String(iso);
}

export function drivingReasonLabel(form) {
  const { reasonForDriving, reasonOther } = form.driver;
  if (reasonForDriving === 'OTHER') return reasonOther ? `Other: ${reasonOther}` : 'Other';
  return { OWNERSHIP: 'Ownership', EMPLOYED: 'Employed', RENT: 'Rent' }[reasonForDriving] || '';
}
