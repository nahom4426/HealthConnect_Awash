// The motor claim process after registration, built around Standard Insurance's published
// motor claim requirements (standardinsurancesc.com/claims-service, Motor-Claims-documents.pdf):
// prompt report, notification form, driving licence, title deed, power of attorney, police report,
// proforma invoice, excess / contribution, and salvage returned.
// Seven stages group the backend's claim statuses; each stage has a gate listing what must be
// true before the claim can move on. Things the backend has no field for yet (document marks,
// decision, excess, salvage, activity) are kept per claim in this browser — see
// docs/motor-claims/backend-prompt.md M9–M12.

const STORAGE_KEY = 'motor.claimProcess.v1';

export const STAGES = [
  { n: 1, key: 'REPORTED', label: 'Reported', hint: 'Form received' },
  { n: 2, key: 'DOCUMENTS', label: 'Documents', hint: 'Papers to collect' },
  { n: 3, key: 'ASSESSMENT', label: 'Survey & decision', hint: 'Adjustor' },
  { n: 4, key: 'QUOTES', label: 'Repair quotes', hint: 'Garage bids' },
  { n: 5, key: 'EXCESS', label: 'Excess', hint: "Insured's share" },
  { n: 6, key: 'REPAIR', label: 'Repair', hint: 'At the garage' },
  { n: 7, key: 'HANDOVER', label: 'Salvage & handover', hint: 'Parts back, car out' },
];

/** Backend status → the stage that is current while the claim has that status. 8 = all done. */
const STAGE_OF_STATUS = {
  SUBMITTED: 2,
  IN_PROCESS: 3,
  BID_ASSIGNED: 4,
  BID_COMPLETED: 5,
  ASSIGN_TO_GARAGE: 6,
  IN_MAINTENANCE: 6,
  MAINTENANCE_COMPLETED: 7,
  HANDOVER_COMPLETED: 8,
};

export const CLOSED_OUTCOMES = {
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
};

/** Standard's motor document list. */
export const MOTOR_DOCUMENTS = [
  { type: 'NOTIFICATION_FORM_SIGNED', label: 'Claim notification form, signed' },
  { type: 'DRIVING_LICENCE', label: 'Driving licence — original seen, copy kept', original: true },
  { type: 'VEHICLE_TITLE_DEED', label: 'Vehicle title deed (libre) — original seen, copy kept', original: true },
  { type: 'POWER_OF_ATTORNEY', label: 'Power of attorney', onlyIfRepresentative: true },
  { type: 'POLICE_REPORT', label: 'Official police report' },
  { type: 'PROFORMA_INVOICE', label: 'Proforma invoice — labour and spare parts' },
];

export const REPORT_CHANNELS = ['WALK_IN', 'PHONE', 'EMAIL', 'LETTER', 'TELEGRAM', 'FAX'];

export const ADJUSTORS = [
  { id: 'ADJ-100', name: 'Solomon Tadesse', role: 'Vehicle Adjustor' },
  { id: 'ADJ-101', name: 'Dawit Tesfaye', role: 'Senior Adjustor' },
  { id: 'ADJ-102', name: 'Almaz Wolde', role: 'Field Adjustor' },
];

export const GARAGES = [
  { code: 'GAR-200', name: 'AutoTrust Premium Garage' },
  { code: 'GAR-201', name: 'Ethio Motors Repair Center' },
  { code: 'GAR-202', name: 'Addis Auto Body Works' },
];

export function emptyProcess() {
  return {
    reportedChannel: '',
    representative: false, // filed by someone other than the insured → power of attorney needed
    documents: {}, // type → { status: 'RECEIVED' | 'NA', reason, originalSeen }
    surveyRecorded: false, // set after POST spot-survey succeeds, until the claim returns spotSurvey
    decision: null, // { outcome: 'APPROVED' | 'REJECTED', reason, at, by }
    closed: null, // { outcome: 'REJECTED' | 'WITHDRAWN', reason, at, by, atStage }
    excess: null, // { none: true } | { amount, receiptNo }
    salvage: null, // { status: 'RETURNED' | 'NOT_REQUIRED', note }
    recovery: null, // { atFaultPartyName, atFaultInsurerName, recoveryAmount, at }
    activity: [], // [{ at, by, text }] newest first
  };
}

function readStore() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {};
  } catch {
    return {};
  }
}

export function loadProcess(claimUuid) {
  const saved = readStore()[claimUuid];
  return { ...emptyProcess(), ...(saved || {}), documents: { ...(saved?.documents || {}) }, activity: [...(saved?.activity || [])] };
}

export function saveProcess(claimUuid, proc) {
  if (!claimUuid) return;
  try {
    const store = readStore();
    store[claimUuid] = proc;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Storage blocked: the page keeps working for this visit.
  }
}

export function logActivity(proc, text, by) {
  proc.activity.unshift({ at: new Date().toISOString(), by: by || '', text });
  if (proc.activity.length > 200) proc.activity.length = 200;
}

/** Uploaded documents of a claim grouped by documentType. */
function uploadsByType(uploads) {
  const map = {};
  for (const d of uploads || []) {
    const t = d.documentType || 'OTHER';
    (map[t] ||= []).push(d);
  }
  return map;
}

/**
 * Each motor document with its state:
 * 'received' (copy uploaded or marked received, and original seen when required), 'original' (copy
 * in, original not yet seen), 'na' (not applicable), or 'pending'.
 */
export function documentChecklist(proc, uploads) {
  const byType = uploadsByType(uploads);
  return MOTOR_DOCUMENTS.map(doc => {
    const mark = proc.documents[doc.type] || {};
    const files = byType[doc.type] || [];
    let state = 'pending';
    let naReason = '';
    if (doc.onlyIfRepresentative && !proc.representative) {
      state = 'na';
      naReason = 'Filed by the insured';
    } else if (mark.status === 'NA') {
      state = 'na';
      naReason = mark.reason || '';
    } else if (files.length || mark.status === 'RECEIVED') {
      state = doc.original && !mark.originalSeen ? 'original' : 'received';
    }
    return { ...doc, state, naReason, files, originalSeen: !!mark.originalSeen };
  });
}

export function missingDocuments(proc, uploads) {
  return documentChecklist(proc, uploads).filter(d => d.state === 'pending' || d.state === 'original');
}

/** Stage that is current for the claim (1–7), or 8 when handed over. */
export function currentStage(claim, proc) {
  if (proc?.closed?.atStage) return proc.closed.atStage;
  return STAGE_OF_STATUS[claim?.status] || 2;
}

export function closedOutcome(claim, proc) {
  if (proc?.closed) return proc.closed.outcome;
  if (claim?.status === 'REJECTED' || claim?.status === 'WITHDRAWN') return claim.status;
  return null;
}

/**
 * What must still happen before the claim leaves `stage`: [{ text, done }]. The claim may move on
 * when every item is done.
 */
export function stageGate(stage, { claim, proc, uploads, bids }) {
  const items = [];
  const add = (text, done) => items.push({ text, done: !!done });
  switch (stage) {
    case 1:
      add('Accident reported by the insured or their representative', true);
      add('Claim notification form entered', true);
      break;
    case 2:
      for (const d of documentChecklist(proc, uploads)) {
        if (d.state === 'na') continue;
        add(d.state === 'original' ? `${d.label}: original not yet seen` : d.label, d.state === 'received');
      }
      break;
    case 3:
      add('Adjustor assigned', claim?.adjustorUuid);
      add('Spot survey recorded', claim?.spotSurvey || proc.surveyRecorded);
      add('Claim approved', proc.decision?.outcome === 'APPROVED');
      break;
    case 4:
      add('At least one repair quote (garage bid)', (bids || []).length > 0);
      add('A quote selected', selectedBid(bids));
      break;
    case 5:
      add('Excess / contribution settled, or none applies', proc.excess);
      add('Repair garage assigned', claim?.garageUuid);
      break;
    case 6:
      add('Vehicle at the garage', ['IN_MAINTENANCE', 'MAINTENANCE_COMPLETED', 'HANDOVER_COMPLETED'].includes(claim?.status));
      add('Repair finished', ['MAINTENANCE_COMPLETED', 'HANDOVER_COMPLETED'].includes(claim?.status));
      break;
    case 7:
      add('Salvage returned, or not required', proc.salvage);
      add('Vehicle handed over to the insured', claim?.status === 'HANDOVER_COMPLETED');
      break;
    default:
      break;
  }
  return items;
}

export function selectedBid(bids) {
  return (bids || []).find(b => ['SELECTED', 'WON', 'ACCEPTED', 'AWARDED'].includes(String(b.status || '').toUpperCase())) || null;
}

/** Short "waiting on" text for the claims list; '' when nothing blocks the current stage. */
export function waitingOn(claim, proc, uploads) {
  if (closedOutcome(claim, proc)) return '';
  const stage = currentStage(claim, proc);
  if (stage === 2) {
    const missing = missingDocuments(proc, uploads);
    if (!missing.length) return 'Ready for assessment';
    const first = missing[0].label.split(' — ')[0].split(',')[0];
    return missing.length === 1 ? first : `${first} +${missing.length - 1} more`;
  }
  const open = stageGate(stage, { claim, proc, uploads, bids: claim?.garageBids }).find(i => !i.done);
  return open ? open.text : '';
}

/** Whole days between the accident being reported (claim created) and now. */
export function daysOpen(claim, now = new Date()) {
  const start = new Date(claim?.reportedAt || claim?.createdAt || claim?.incidentDate || NaN);
  if (Number.isNaN(start.getTime())) return null;
  return Math.max(0, Math.floor((now - start) / 86400000));
}

/** Stepper entries for a claim: done before the current stage, closed for a rejected/withdrawn claim. */
export function stageSteps(claim, proc, viewing) {
  const current = currentStage(claim, proc);
  const outcome = closedOutcome(claim, proc);
  return STAGES.map(s => {
    const states = [];
    if (s.n < current) states.push('done');
    else if (s.n === current && outcome) states.push('closed');
    else if (s.n === current && current <= 7) states.push('current');
    else if (current === 8) states.push('done');
    else states.push('todo');
    if (viewing === s.n && !states.includes('current')) states.push('viewing');
    return { ...s, state: states.join(' ') };
  });
}

/** Net amount Standard pays: selected quote minus excess. */
export function netSettlement(bid, proc) {
  if (!bid) return null;
  const excess = proc?.excess && !proc.excess.none ? Number(proc.excess.amount) || 0 : 0;
  return Math.max(0, Number(bid.bidAmount || 0) - excess);
}
