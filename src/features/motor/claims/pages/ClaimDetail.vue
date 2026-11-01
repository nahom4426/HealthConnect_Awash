<script setup>
// Motor claim workspace: the claim moves through seven stages (claimProcess.js). Each stage shows
// what is needed to move on and the actions that do it; the stepper and styling match the
// new-claim wizard.
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getActingRole, roleSwitcherEnabled } from '@/utils/actingRole';
import {
  fetchClaimByUuid, updateClaimStatus, assignClaimAdjustor, assignClaimGarage, fetchClaimImage, fetchClaimDocuments,
  fetchClaimDocumentUrl, uploadClaimDocument, markClaimDocument, clearClaimDocumentMark, setClaimRepresentative, fetchAdjustors, requestClaimDocuments, recordSpotSurvey, fetchGarageBids, submitGarageBid,
  selectWinningGarageBid, initiateSubrogation, saveClaimExcess, saveClaimSalvage, closeClaim, reopenClaim, fetchClaimActivity,
  updateClaimReportedChannel,
} from '@/features/motor/claims/api/digitalChannelApi';
import {
  STAGES, ADJUSTORS, GARAGES, REPORT_CHANNELS, CLOSED_OUTCOMES, loadProcess, processFor, saveProcess, logActivity, documentChecklist,
  missingDocuments, currentStage, closedOutcome, stageGate, stageSteps, selectedBid, netSettlement, daysOpen,
} from '@/features/motor/claims/claimProcess';
import { loadNotificationForm, formatFormDate } from '@/features/motor/claims/notificationForm';
import ClaimStepper from '@/features/motor/claims/components/ClaimStepper.vue';
import MotorNotificationFields from '@/features/motor/claims/components/MotorNotificationFields.vue';
import { LANGS } from '@/features/motor/claims/notificationLabels';
import RoleSwitcher from '@/components/RoleSwitcher.vue';
import { revokeObjectUrls } from '@/utils/imageBlob';
import { useAuthStore } from '@/stores/auth';
import { useDarkModeStore } from '@/stores/darkMode';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const darkStore = useDarkModeStore();
const isDark = computed(() => darkStore.isDark);
const claimUuid = computed(() => route.params.claimUuid);

const claim = ref(null);
const uploads = ref([]);
const bids = ref([]);
const proc = ref(loadProcess(''));
const notice = ref(null); // { type: 'success' | 'error', text }
const loading = ref(true);
const busy = ref(false);
const viewStage = ref(2);

const claimPhotos = ref([]);
const selectedPhoto = ref(null);

const myRole = computed(() =>
  getActingRole() || authStore.auth?.user?.roleCode || (roleSwitcherEnabled ? 'ROLE_CLAIM_MANAGER' : ''));
const myName = computed(() => authStore.auth?.user?.fullName || authStore.auth?.user?.name || 'Staff');
// Customers follow their claim here; garages only act on the repair stage.
const canManage = computed(() => !['ROLE_CUSTOMER', 'ROLE_GARAGE'].includes(myRole.value));

const form = computed(() => loadNotificationForm(claim.value).form);

// The full form panel follows the language chosen on the new-claim screen.
const LANG_KEY = 'motor.claimForm.lang';
const formOpen = ref(false);
const formLang = ref((() => { try { return localStorage.getItem(LANG_KEY) || 'en'; } catch { return 'en'; } })());
function setFormLang(code) {
  formLang.value = code;
  try { localStorage.setItem(LANG_KEY, code); } catch { /* storage blocked */ }
}
const stage = computed(() => (claim.value ? currentStage(claim.value, proc.value) : 2));
const outcome = computed(() => closedOutcome(claim.value, proc.value));
const steps = computed(() => stageSteps(claim.value, proc.value, viewStage.value));
const viewing = computed(() => STAGES.find(s => s.n === viewStage.value) || STAGES[1]);
const editable = computed(() => viewStage.value === stage.value && !outcome.value && stage.value <= 7);
const checklist = computed(() => documentChecklist(proc.value, uploads.value));
const missing = computed(() => missingDocuments(proc.value, uploads.value));
const winner = computed(() => selectedBid(bids.value));
const gate = computed(() => stageGate(viewStage.value, { claim: claim.value, proc: proc.value, uploads: uploads.value, bids: bids.value }));
const gateDone = computed(() => gate.value.filter(i => i.done).length);
const gateOpen = computed(() => gate.value.every(i => i.done));
const age = computed(() => daysOpen(claim.value));
const net = computed(() => netSettlement(winner.value, proc.value));

// Real adjustors from the backend; the built-in list only when the lookup is unavailable.
const adjustors = ref(ADJUSTORS);
const adjustorName = (id) => adjustors.value.find(a => a.id === id)?.name || id;
const garageName = (code) => GARAGES.find(g => g.code === code)?.name || code;
const money = (n) => (n === null || n === undefined || n === '' ? '—' : `ETB ${Number(n).toLocaleString()}`);
const words = (t) => (t ? String(t).toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : '—');
const when = (iso) => (iso ? new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '');

// ── Forms of the stage panels ───────────────────────────────────────────────
const adjustorPick = ref(ADJUSTORS[0].id);
const survey = reactive({ surveyorName: '', surveyDate: '', location: '', isDrivable: true, towingRequired: false, towingCost: '', assessmentNotes: '' });
const bidForm = reactive({ garageCode: GARAGES[0].code, bidAmount: '', estimatedDays: '', repairScope: '' });
const excessForm = reactive({ none: false, amount: '', receiptNo: '' });
const salvageForm = reactive({ status: '', note: '' });
const recoveryForm = reactive({ atFaultPartyName: '', atFaultInsurerName: '', atFaultPolicyNumber: '', recoveryAmount: '', notes: '' });
const closing = ref(null); // 'REJECTED' | 'WITHDRAWN' while the reason box is open
const closeReason = ref('');
const naFor = ref(null); // document type while its "not applicable" reason box is open
const naReason = ref('');

function fillForms() {
  const f = form.value;
  const adj = claim.value?.adjustorUuid;
  if (adj) adjustorPick.value = adj;
  else if (!adjustors.value.some(a => a.id === adjustorPick.value)) adjustorPick.value = adjustors.value[0]?.id || '';
  survey.surveyorName ||= adjustorName(adj) || '';
  survey.surveyDate ||= new Date().toISOString().slice(0, 10);
  survey.location ||= claim.value?.incidentLocation || f.accident.place || '';
  Object.assign(excessForm, proc.value.excess?.none ? { none: true, amount: '', receiptNo: '' } : { none: false, ...(proc.value.excess || {}) });
  Object.assign(salvageForm, proc.value.salvage || { status: '', note: '' });
  recoveryForm.atFaultPartyName ||= f.accident.otherParty.ownerName || claim.value?.thirdPartyName || '';
  recoveryForm.recoveryAmount ||= winner.value?.bidAmount || '';
}

// ── Loading ─────────────────────────────────────────────────────────────────
async function loadAll({ keepView = false } = {}) {
  const uuid = claimUuid.value;
  claim.value = await fetchClaimByUuid(uuid);
  if (!claim.value) { loading.value = false; return; }
  proc.value = processFor(claim.value);
  const [docs, bidList, activity] = await Promise.all([
    fetchClaimDocuments(claim.value.claimUuid),
    fetchGarageBids(claim.value.claimUuid),
    fetchClaimActivity(claim.value.claimUuid),
  ]);
  serverActivity.value = activity;
  const listed = mergeDocuments(claim.value.documents, docs);
  const key = d => `${d.documentType}:${d.originalFileName}`;
  pendingUploads.value = pendingUploads.value.filter(p => !listed.some(d => (p.documentUuid && d.documentUuid === p.documentUuid) || key(d) === key(p)));
  uploads.value = mergeDocuments(listed, pendingUploads.value);
  bids.value = bidList.length ? bidList : (claim.value.garageBids || []);
  if (!keepView) viewStage.value = Math.min(stage.value, 7);
  fillForms();
  loading.value = false;
  loadPhotos();
}

async function loadPhotos() {
  revokeObjectUrls(claimPhotos.value.map(p => p.src));
  const images = uploads.value.filter(d => d.isImage || (d.contentType || '').startsWith('image/'));
  const loaded = await Promise.all(images.map(async d => ({ ...d, src: await fetchClaimDocumentUrl(claim.value.claimUuid, d.documentUuid) })));
  claimPhotos.value = loaded.filter(d => d.src);
  if (!claimPhotos.value.length) {
    const legacy = await fetchClaimImage(claim.value.claimUuid);
    if (legacy) claimPhotos.value = [{ documentUuid: 'legacy', documentType: 'ACCIDENT_PHOTO', originalFileName: 'Accident photo', src: legacy }];
  }
}

function persist(text) {
  if (text) logActivity(proc.value, text, myName.value);
  saveProcess(claim.value.claimUuid, proc.value);
  proc.value = { ...proc.value };
}

/** Runs a backend action; reports success or the server's message. */
async function run(fn, successText, { reload = true } = {}) {
  busy.value = true;
  notice.value = null;
  try {
    await fn();
    if (successText) notice.value = { type: 'success', text: successText };
    if (reload) await loadAll({ keepView: true });
    return true;
  } catch (e) {
    notice.value = { type: 'error', text: `Could not save: ${errorText(e)}` };
    return false;
  } finally {
    busy.value = false;
  }
}

/** The server's reason in plain words; a 422 lists the documents it still counts as missing. */
function errorText(e) {
  const data = e?.response?.data || {};
  const missing = data.properties?.missing || data.missing;
  if (Array.isArray(missing) && missing.length) {
    const names = missing.map(t => docName(checklist.value.find(d => d.type === t) || { label: words(t) }));
    return `the server still counts ${names.length === 1 ? 'this document' : 'these documents'} as missing: ${names.join(', ')}. Upload ${names.length === 1 ? 'it' : 'them'} or mark ${names.length === 1 ? 'it' : 'them'} received, then try again.`;
  }
  return data.detail || data.message || e?.message || 'Request failed';
}

function moveTo(n) {
  viewStage.value = n;
}

// ── Stage 1: reported ───────────────────────────────────────────────────────
// The server writes its own activity log; the browser's log is only shown when the server has none.
const serverActivity = ref([]);
// The server's log names documents, garages and adjustors by code ("PROFORMA_INVOICE marked received",
// "garage GAR-201"); show the names staff know, and amounts with thousands separators.
function readableActivity(text) {
  let t = String(text || '');
  for (const d of checklist.value) t = t.split(d.type).join(docName(d));
  for (const g of GARAGES) t = t.split(g.code).join(g.name).replace(`garage ${g.name}`, g.name);
  for (const a of adjustors.value) t = t.split(a.id).join(a.name);
  return t.replace(/ETB (\d{4,})/g, (_, n) => `ETB ${Number(n).toLocaleString()}`);
}
const activityList = computed(() => (serverActivity.value.length
  ? serverActivity.value.map(a => ({ ...a, text: readableActivity(a.text) }))
  : proc.value.activity));

/** Saves on the server; if it refuses, the change stays on this computer and the page says so. */
async function saveOnServer(fn, what) {
  try {
    await fn();
    return true;
  } catch (e) {
    notice.value = { type: 'error', text: `${what} is saved on this computer only; the server did not accept it (${errorText(e)}).` };
    return false;
  }
}

async function setChannel(channel) {
  proc.value.reportedChannel = channel;
  persist(`Reported by ${words(channel)}`);
  if (!channel) return;
  if (await saveOnServer(() => updateClaimReportedChannel(claim.value, channel), 'How it was reported')) {
    notice.value = { type: 'success', text: `Saved: reported by ${words(channel).toLowerCase()}` };
  }
}

function printForm() {
  const target = router.resolve({ name: 'motor-claim-notification-print', params: { claimUuid: claim.value.claimUuid } });
  window.open(target.href, '_blank', 'noopener');
}

// ── Stage 2: documents ──────────────────────────────────────────────────────
function setRepresentative(value) {
  proc.value.representative = value;
  persist(value ? 'Filed by a representative: power of attorney required' : 'Filed by the insured');
  setClaimRepresentative(claim.value.claimUuid, value)
    .catch(e => console.warn('Representative flag not saved on the server; kept on this computer:', e?.message));
}

/** Sends this browser's document ticks and the representative flag to the server, so its
 *  document check agrees with what the page shows (ticks made before marks were saved
 *  on the server only exist here). */
async function syncDocumentsToServer() {
  const uuid = claim.value.claimUuid;
  const warn = e => console.warn('Could not copy a document tick to the server:', e?.message);
  await setClaimRepresentative(uuid, !!proc.value.representative).catch(warn);
  for (const [type, mark] of Object.entries(proc.value.documents || {})) {
    if (!mark || (!mark.status && !mark.originalSeen)) continue;
    await markClaimDocument(uuid, type, { status: mark.status || '', originalSeen: !!mark.originalSeen, reason: mark.reason || '' }).catch(warn);
  }
}

// "Driving licence — original seen, copy kept" → name "Driving licence", detail "Original seen, copy kept".
const docName = (doc) => doc.label.split(' — ')[0];
const docDetail = (doc) => {
  const rest = doc.label.split(' — ')[1];
  return rest ? rest[0].toUpperCase() + rest.slice(1) : '';
};
const DOC_STATE = { pending: 'Waiting', original: 'Original not seen yet', received: 'Received', na: 'Not needed' };

// Uploaded files can be listed on the claim and on /documents; take both, plus any upload this
// page made that the server has not listed yet, so a fresh upload always shows.
const pendingUploads = ref([]);
function mergeDocuments(...lists) {
  const seen = new Map();
  for (const d of lists.flat().filter(Boolean)) seen.set(d.documentUuid || `${d.documentType}:${d.originalFileName}`, d);
  return [...seen.values()];
}

const docNote = reactive({}); // per document type: { kind: 'busy' | 'ok' | 'error', text }

function markDoc(doc, patch, text) {
  const mark = { ...(proc.value.documents[doc.type] || {}), ...patch };
  proc.value.documents[doc.type] = mark;
  if (docNote[doc.type]?.kind === 'ok') delete docNote[doc.type];
  persist(text);
  const body = { status: mark.status || '', originalSeen: !!mark.originalSeen, reason: mark.reason || '' };
  const empty = !body.status && !body.originalSeen;
  (empty ? clearClaimDocumentMark(claim.value.claimUuid, doc.type) : markClaimDocument(claim.value.claimUuid, doc.type, body))
    .catch(e => console.warn('Document mark not saved on the server; kept on this computer:', e?.message));
}

async function uploadDoc(doc, event) {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (!file) return;
  docNote[doc.type] = { kind: 'busy', text: `Uploading ${file.name}…` };
  try {
    const saved = await uploadClaimDocument(claim.value.claimUuid, file, doc.type);
    const entry = saved?.documentUuid ? saved : { documentType: doc.type, originalFileName: file.name, contentType: file.type };
    pendingUploads.value = [...pendingUploads.value, { ...entry, documentType: entry.documentType || doc.type }];
    uploads.value = mergeDocuments(uploads.value, pendingUploads.value);
    persist(`Uploaded ${file.name} as ${docName(doc)}`);
    const needsOriginal = doc.original && !proc.value.documents[doc.type]?.originalSeen;
    docNote[doc.type] = { kind: 'ok', text: needsOriginal ? `${file.name} uploaded. Tick "Original seen" once you have seen the original.` : `${file.name} uploaded.` };
    await loadAll({ keepView: true });
  } catch (e) {
    const detail = e?.response?.data?.detail || e?.response?.data?.message || e?.message || 'Upload failed';
    docNote[doc.type] = { kind: 'error', text: `Upload failed: ${detail}` };
  }
}

function confirmNa() {
  const doc = checklist.value.find(d => d.type === naFor.value);
  if (!doc || !naReason.value.trim()) return;
  markDoc(doc, { status: 'NA', reason: naReason.value.trim() }, `${docName(doc)} not applicable: ${naReason.value.trim()}`);
  naFor.value = null;
  naReason.value = '';
}

async function requestMissing() {
  const types = missing.value.map(d => d.type);
  const ok = await run(() => requestClaimDocuments(claim.value.claimUuid, types, 'Please bring or send the missing claim documents.'),
    `Asked the customer for ${types.length} document${types.length === 1 ? '' : 's'}`, { reload: false });
  if (ok) persist(`Requested missing documents: ${missing.value.map(docName).join(', ')}`);
}

async function startAssessment() {
  const ok = await run(async () => {
    await syncDocumentsToServer();
    await assignClaimAdjustor(claim.value.claimUuid, adjustorPick.value);
    await updateClaimStatus(claim.value.claimUuid, 'IN_PROCESS');
  }, `Assessment started with ${adjustorName(adjustorPick.value)}`);
  if (ok) { persist(`Documents complete; assigned adjustor ${adjustorName(adjustorPick.value)}`); viewStage.value = 3; }
}

// ── Stage 3: survey & decision ──────────────────────────────────────────────
async function saveSurvey() {
  const ok = await run(() => recordSpotSurvey({
    claimUuid: claim.value.claimUuid,
    ...survey,
    // SpotSurveyRequest.surveyDate is a date-time; the form only picks a day.
    surveyDate: survey.surveyDate ? `${survey.surveyDate}T00:00:00` : null,
    towingCost: survey.towingCost === '' ? null : Number(survey.towingCost),
  }), 'Spot survey saved');
  if (ok) { proc.value.surveyRecorded = true; persist(`Spot survey by ${survey.surveyorName || 'adjustor'}`); }
}

async function approve() {
  const ok = await run(() => updateClaimStatus(claim.value.claimUuid, 'BID_ASSIGNED'), 'Claim approved; collect repair quotes next', { reload: false });
  if (ok) {
    proc.value.decision = { outcome: 'APPROVED', at: new Date().toISOString(), by: myName.value };
    persist('Claim approved for repair');
    await loadAll({ keepView: true });
    viewStage.value = 4;
  }
}

function openClose(kind) {
  closing.value = kind;
  closeReason.value = '';
}

async function confirmClose() {
  const kind = closing.value;
  const reason = closeReason.value.trim();
  if (!kind || !reason) return;
  // Kept on this computer as well, in case the server refuses.
  let savedOnServer = true;
  let serverError = '';
  try { await closeClaim(claim.value.claimUuid, kind, reason); } catch (e) { savedOnServer = false; serverError = errorText(e); }
  proc.value.closed = { outcome: kind, reason, at: new Date().toISOString(), by: myName.value, atStage: stage.value };
  if (kind === 'REJECTED') proc.value.decision = { outcome: 'REJECTED', reason, at: new Date().toISOString(), by: myName.value };
  persist(`${CLOSED_OUTCOMES[kind]}: ${reason}`);
  closing.value = null;
  notice.value = savedOnServer
    ? { type: 'success', text: `Claim ${CLOSED_OUTCOMES[kind].toLowerCase()}` }
    : { type: 'error', text: `Claim marked ${CLOSED_OUTCOMES[kind].toLowerCase()} on this computer only; the server did not accept it (${serverError}).` };
  await loadAll({ keepView: true });
}

async function reopen() {
  const onServer = !!claim.value.closed?.outcome || !!CLOSED_OUTCOMES[claim.value.status];
  if (onServer) {
    const ok = await run(() => reopenClaim(claim.value.claimUuid, 'Reopened'), 'Claim reopened', { reload: false });
    if (!ok) return;
  }
  proc.value.closed = null;
  if (proc.value.decision?.outcome === 'REJECTED') proc.value.decision = null;
  persist('Claim reopened');
  if (onServer) await loadAll({ keepView: true });
}

// ── Stage 4: repair quotes ──────────────────────────────────────────────────
async function addBid() {
  if (!bidForm.bidAmount) return;
  const garage = GARAGES.find(g => g.code === bidForm.garageCode);
  const ok = await run(() => submitGarageBid({
    claimUuid: claim.value.claimUuid,
    garageCode: garage.code,
    garageName: garage.name,
    bidAmount: Number(bidForm.bidAmount),
    estimatedDays: bidForm.estimatedDays ? Number(bidForm.estimatedDays) : null,
    repairScope: bidForm.repairScope,
  }), `Quote from ${garage.name} added`);
  if (ok) {
    persist(`Quote from ${garage.name}: ${money(bidForm.bidAmount)}`);
    Object.assign(bidForm, { bidAmount: '', estimatedDays: '', repairScope: '' });
  }
}

async function chooseBid(bid) {
  const ok = await run(async () => {
    await selectWinningGarageBid(bid.bidUuid);
    await updateClaimStatus(claim.value.claimUuid, 'BID_COMPLETED', bid.bidAmount);
  }, `${bid.garageName} selected`);
  if (ok) { persist(`Selected ${bid.garageName} at ${money(bid.bidAmount)}`); viewStage.value = 5; }
}

const cheapest = computed(() => bids.value.reduce((min, b) => (min === null || Number(b.bidAmount) < Number(min.bidAmount) ? b : min), null));

// ── Stage 5: excess ─────────────────────────────────────────────────────────
async function saveExcess() {
  if (!excessForm.none && (!excessForm.amount || !excessForm.receiptNo)) return;
  const excess = excessForm.none ? { none: true } : { none: false, amount: Number(excessForm.amount), receiptNo: excessForm.receiptNo.trim() };
  proc.value.excess = excess.none ? { none: true } : { amount: excess.amount, receiptNo: excess.receiptNo };
  persist(excessForm.none ? 'No excess applies' : `Excess ${money(excessForm.amount)} paid, receipt ${excessForm.receiptNo}`);
  if (await saveOnServer(() => saveClaimExcess(claim.value.claimUuid, excess), 'The excess')) {
    notice.value = { type: 'success', text: 'Excess saved' };
  }
}

async function sendToGarage() {
  const code = winner.value?.garageCode || winner.value?.garageUuid || GARAGES[0].code;
  const ok = await run(async () => {
    await assignClaimGarage(claim.value.claimUuid, code);
    await updateClaimStatus(claim.value.claimUuid, 'ASSIGN_TO_GARAGE', net.value);
  }, `Vehicle sent to ${winner.value?.garageName || garageName(code)}`);
  if (ok) { persist(`Repair order to ${winner.value?.garageName || garageName(code)}; Standard pays ${money(net.value)}`); viewStage.value = 6; }
}

// ── Stage 6: repair ─────────────────────────────────────────────────────────
async function setRepairStatus(status, text) {
  const ok = await run(() => updateClaimStatus(claim.value.claimUuid, status), text);
  if (ok) { persist(text); if (status === 'MAINTENANCE_COMPLETED') viewStage.value = 7; }
}

// ── Stage 7: salvage & handover ─────────────────────────────────────────────
async function saveSalvage() {
  if (!salvageForm.status) return;
  const salvage = { status: salvageForm.status, note: salvageForm.note.trim() };
  proc.value.salvage = salvage;
  persist(salvageForm.status === 'RETURNED' ? `Salvage returned${salvageForm.note ? `: ${salvageForm.note}` : ''}` : 'Salvage not required');
  if (await saveOnServer(() => saveClaimSalvage(claim.value.claimUuid, salvage), 'Salvage')) {
    notice.value = { type: 'success', text: 'Salvage saved' };
  }
}

async function handover() {
  const ok = await run(() => updateClaimStatus(claim.value.claimUuid, 'HANDOVER_COMPLETED'), 'Vehicle handed over; claim completed', { reload: false });
  if (!ok) return;
  persist('Vehicle handed over to the insured');
  // Nothing is left to do on this claim: go back to the table, on its Completed tab.
  backToClaims({ done: claim.value.claimNumber || claim.value.claimUuid });
}

function backToClaims(query = {}) {
  router.push({ path: `/${claim.value?.productModule || 'motor'}/claims/process`, query });
}

const otherPartyAtFault = computed(() => {
  const f = form.value;
  return !!(f.accident.otherParty.ownerName || f.accident.otherParty.plateNo || claim.value?.thirdPartyName);
});

async function startRecovery() {
  const ok = await run(() => initiateSubrogation({
    claimUuid: claim.value.claimUuid,
    ...recoveryForm,
    recoveryAmount: recoveryForm.recoveryAmount ? Number(recoveryForm.recoveryAmount) : null,
    recoveryStatus: 'INITIATED',
  }), 'Recovery from the other party started', { reload: false });
  if (ok) {
    proc.value.recovery = { ...recoveryForm, at: new Date().toISOString() };
    persist(`Recovery started against ${recoveryForm.atFaultPartyName || 'the other party'}`);
    await loadAll({ keepView: true });
  }
}

// ── Page ────────────────────────────────────────────────────────────────────
function handleKeyDown(e) {
  if (e.key === 'Escape') { selectedPhoto.value = null; closing.value = null; naFor.value = null; }
}

watch(claimUuid, () => {
  loading.value = true;
  pendingUploads.value = [];
  serverActivity.value = [];
  for (const k of Object.keys(docNote)) delete docNote[k];
  loadAll();
});

onMounted(async () => {
  document.addEventListener('keydown', handleKeyDown);
  const list = await fetchAdjustors();
  if (list.length) adjustors.value = list;
  loadAll();
});

onBeforeUnmount(() => {
  revokeObjectUrls(claimPhotos.value.map(p => p.src));
  document.removeEventListener('keydown', handleKeyDown);
});
</script>

<template>
  <div class="cn-root" :class="{ dark: isDark }">
    <div class="cn-header">
      <button class="cn-back" aria-label="Back" @click="router.back()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:18px;height:18px"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
      </button>
      <div class="cw-head-text">
        <h1 class="cn-title">Claim {{ claim?.claimNumber || '' }}</h1>
        <p v-if="claim" class="cn-sub">
<template v-if="form.policyHolder.fullName || claim.driverName">{{ form.policyHolder.fullName || claim.driverName }} · </template>Policy {{ claim.policyNumber || '—' }}
          <template v-if="claim.plateNumber || form.vehicle.plateNo"> · Plate {{ claim.plateNumber || form.vehicle.plateNo }}</template>
          <template v-if="age !== null"> · reported {{ age === 0 ? 'today' : `${age} day${age === 1 ? '' : 's'} ago` }}</template>
        </p>
      </div>
      <div v-if="claim" class="cn-header-tools">
        <RoleSwitcher />
        <button type="button" class="cn-blank-btn" @click="printForm">Print notification form</button>
      </div>
    </div>

    <div v-if="loading" class="cw-loading"><div class="cw-spinner"></div><p>Loading claim…</p></div>
    <div v-else-if="!claim" class="cn-card cw-empty">We could not find this claim. It may have been removed, or the link is wrong.</div>

    <template v-else>
      <div class="cn-card cw-stepper">
        <ClaimStepper :steps="steps" label="Claim stages" @select="s => moveTo(s.n)" />
      </div>

      <div v-if="outcome" class="cw-banner closed" role="status">
        <strong>{{ CLOSED_OUTCOMES[outcome] || words(outcome) }}</strong>
        <span v-if="proc.closed">· {{ proc.closed.reason }} · {{ proc.closed.by }} · {{ when(proc.closed.at) }}</span>
        <button v-if="canManage && proc.closed" type="button" class="cw-link" @click="reopen">Reopen</button>
        <button type="button" class="cw-link" @click="backToClaims({ tab: 'CLOSED' })">Back to claims →</button>
      </div>
      <div v-else-if="stage === 8" class="cw-banner done" role="status">
        <strong>Claim completed</strong> · vehicle handed over<template v-if="claim.approvedAmount"> · Standard paid {{ money(claim.approvedAmount) }}</template>
        <button type="button" class="cw-link" @click="backToClaims({ tab: 'DONE' })">Back to claims →</button>
      </div>

      <div v-if="notice" class="cn-alert" :class="notice.type" role="alert">{{ notice.text }}</div>

      <div class="cw-layout">
        <!-- ── Stage panel ─────────────────────────────────────────────── -->
        <section :key="viewStage" class="cn-card cw-stage cn-step-body" :aria-label="viewing.label">
          <div class="cw-stage-head">
            <div>
              <span class="cw-eyebrow">Stage {{ viewing.n }} of 7</span>
              <h2 class="cw-stage-title">{{ viewing.label }}</h2>
            </div>
            <span class="cw-chip" :class="viewStage < stage || stage === 8 ? 'done' : viewStage === stage && !outcome ? 'current' : outcome && viewStage === stage ? 'closed' : 'todo'">
              {{ viewStage < stage || stage === 8 ? 'Done' : viewStage === stage ? (outcome ? CLOSED_OUTCOMES[outcome] : 'Current stage') : 'Not started' }}
            </span>
          </div>

          <div class="cw-gate">
            <div class="cw-gate-head">
              <span>To finish this stage</span>
              <span class="cw-gate-count" :class="{ done: gateOpen }">{{ gateDone }} of {{ gate.length }} done</span>
            </div>
            <div class="cw-gate-bar"><span :style="{ width: `${gate.length ? (gateDone / gate.length) * 100 : 100}%` }"></span></div>
            <ul>
              <li v-for="item in gate" :key="item.text" :class="{ done: item.done }">
                <span class="cw-tick" aria-hidden="true">{{ item.done ? '✓' : '' }}</span>{{ item.text }}
              </li>
            </ul>
          </div>

          <!-- 1 Reported -->
          <div v-if="viewStage === 1" class="cw-body">
            <div class="cn-grid">
              <div class="cn-field">
                <label for="cw-channel">How the accident was reported</label>
                <!-- The server takes the channel when the claim is filed and refuses changes after that. -->
                <div v-if="claim.reportedChannel" class="cw-static" title="Set when the claim was filed">{{ words(claim.reportedChannel) }}</div>
                <select v-else id="cw-channel" :value="proc.reportedChannel" :disabled="!canManage" @change="setChannel($event.target.value)">
                  <option value="">Choose…</option>
                  <option v-for="c in REPORT_CHANNELS" :key="c" :value="c">{{ words(c) }}</option>
                </select>
              </div>
              <div class="cn-field">
                <label>Registered on</label>
                <div class="cw-static">{{ when(claim.createdAt) || '—' }}</div>
              </div>
            </div>
            <dl class="cw-facts">
              <dt>Policy holder</dt><dd>{{ form.policyHolder.fullName || '—' }} <span v-if="form.policyHolder.phone" class="cw-muted">· {{ form.policyHolder.phone }}</span></dd>
              <dt>Driver</dt><dd>{{ form.driver.fullName || claim.driverName || '—' }} <span v-if="form.driver.licenceNo || claim.driverLicenseNumber" class="cw-muted">· licence {{ form.driver.licenceNo || claim.driverLicenseNumber }}</span></dd>
              <dt>Accident</dt><dd>{{ formatFormDate(form.accident.date) || '—' }} {{ form.accident.time }} · {{ form.accident.place || claim.incidentLocation || '—' }}</dd>
              <dt>Cover</dt><dd>{{ words(claim.coverageType) }} · {{ words(claim.causeOfLoss) }}</dd>
              <dt>Responsible</dt><dd>{{ form.accident.responsible || '—' }}</dd>
            </dl>
            <p class="cw-desc">{{ form.accident.description || claim.description || 'No description.' }}</p>

            <details class="cw-form" :open="formOpen" @toggle="formOpen = $event.target.open">
              <summary>
                <span>Full notification form, as filed</span>
                <span class="cw-form-sub">Every item of the paper form, sections 1 to 6 and the declaration</span>
              </summary>
              <div class="cw-form-tools">
                <div class="cn-lang" role="group" aria-label="Form language">
                  <button v-for="l in LANGS" :key="l.code" type="button" :class="{ active: formLang === l.code }" :aria-pressed="formLang === l.code" @click="setFormLang(l.code)">{{ l.label }}</button>
                </div>
                <button type="button" class="cn-blank-btn" @click="printForm">Print it</button>
              </div>
              <!-- Read-only: the server keeps a submitted claim's form as filed. -->
              <fieldset class="cw-form-body" disabled>
                <MotorNotificationFields :form="form" :lang="formLang" />
              </fieldset>
            </details>
          </div>

          <!-- 2 Documents -->
          <div v-if="viewStage === 2" class="cw-body">
            <label class="cn-option">
              <input type="checkbox" :checked="proc.representative" :disabled="!editable || !canManage" @change="setRepresentative($event.target.checked)" />
              <span class="cn-option-text">
                <span class="cn-option-title">Filed by someone other than the insured</span>
                <span class="cn-option-hint">Tick this when an agent or relative brings the claim. A power of attorney is then needed.</span>
              </span>
            </label>
            <ul class="cw-docs">
              <li v-for="doc in checklist" :key="doc.type" :class="doc.state">
                <span class="cw-doc-icon" aria-hidden="true">{{ doc.state === 'received' ? '✓' : doc.state === 'na' ? '–' : doc.state === 'original' ? '!' : '' }}</span>
                <div class="cw-doc-main">
                  <div class="cw-doc-label">
                    {{ docName(doc) }}
                    <span class="cw-pill" :class="doc.state">{{ doc.state === 'pending' && doc.originalSeen ? 'Copy still needed' : DOC_STATE[doc.state] }}</span>
                  </div>
                  <div v-if="docDetail(doc)" class="cw-doc-detail">{{ docDetail(doc) }}</div>
                  <div class="cw-doc-meta">
                    <template v-if="doc.state === 'na'">{{ doc.naReason || 'Not needed for this claim' }}</template>
                    <template v-else-if="doc.files.length">📎 {{ doc.files.map(f => f.originalFileName || 'file').join(', ') }}</template>
                    <template v-else-if="proc.documents[doc.type]?.status === 'RECEIVED'">Paper copy kept on file</template>
                  </div>
                  <div v-if="docNote[doc.type]" class="cw-doc-note" :class="docNote[doc.type].kind" :role="docNote[doc.type].kind === 'error' ? 'alert' : 'status'">
                    <span v-if="docNote[doc.type].kind === 'busy'" class="cw-mini-spin" aria-hidden="true"></span>{{ docNote[doc.type].text }}
                  </div>
                  <div v-if="naFor === doc.type" class="cw-inline-form">
                    <input v-model="naReason" type="text" placeholder="Why isn't it needed?" aria-label="Reason it isn't needed" @keyup.enter="confirmNa" />
                    <button type="button" class="cn-verify-btn" :disabled="!naReason.trim()" @click="confirmNa">Save</button>
                    <button type="button" class="cw-link" @click="naFor = null">Cancel</button>
                  </div>
                </div>
                <div v-if="editable && canManage && !(doc.onlyIfRepresentative && !proc.representative)" class="cw-doc-actions">
                  <label v-if="doc.original && doc.state !== 'na'" class="cw-check-pill">
                    <input type="checkbox" :checked="doc.originalSeen" @change="markDoc(doc, { originalSeen: $event.target.checked }, `${docName(doc)}: original ${$event.target.checked ? 'seen' : 'not seen'}`)" />
                    Original seen
                  </label>
                  <label v-if="doc.state !== 'na'" class="cw-mini-btn" :class="{ busy: docNote[doc.type]?.kind === 'busy' }">
                    {{ docNote[doc.type]?.kind === 'busy' ? 'Uploading…' : doc.files.length ? '⤒ Upload another' : '⤒ Upload' }}<input type="file" class="sr-only" accept="image/*,application/pdf" :disabled="docNote[doc.type]?.kind === 'busy'" @change="uploadDoc(doc, $event)" />
                  </label>
                  <button v-if="doc.state === 'pending'" type="button" class="cw-mini-btn" @click="markDoc(doc, { status: 'RECEIVED' }, `${docName(doc)}: paper copy received`)">✓ Paper copy received</button>
                  <button v-if="doc.state !== 'na'" type="button" class="cw-mini-btn ghost" @click="naFor = doc.type; naReason = ''">Not needed</button>
                  <button v-else type="button" class="cw-mini-btn ghost" @click="markDoc(doc, { status: '' }, `${docName(doc)}: needed again`)">Needed after all</button>
                </div>
              </li>
            </ul>
            <div v-if="editable && canManage" class="cw-next">
              <div class="cn-field cw-grow">
                <label for="cw-adjustor">Adjustor who will survey the vehicle</label>
                <select id="cw-adjustor" v-model="adjustorPick">
                  <option v-for="a in adjustors" :key="a.id" :value="a.id">{{ a.name }} ({{ a.role }})</option>
                </select>
              </div>
              <button type="button" class="cn-cancel" :disabled="busy || !missing.length" @click="requestMissing">
                {{ missing.length ? `Ask the customer for ${missing.length} missing document${missing.length === 1 ? '' : 's'}` : 'No documents missing' }}
              </button>
            </div>
          </div>

          <!-- 3 Survey & decision -->
          <div v-if="viewStage === 3" class="cw-body">
            <p class="cw-muted">Adjustor on this claim: <strong>{{ claim.adjustorUuid ? adjustorName(claim.adjustorUuid) : 'not assigned' }}</strong></p>
            <div v-if="claim.spotSurvey" class="cw-note">
              <strong>Survey done</strong> by {{ claim.spotSurvey.surveyorName }} on {{ formatFormDate(String(claim.spotSurvey.surveyDate).slice(0, 10)) }} · {{ claim.spotSurvey.isDrivable ? 'can be driven' : 'cannot be driven' }}
              <template v-if="claim.spotSurvey.towingRequired"> · towed, {{ money(claim.spotSurvey.towingCost) }}</template>
              <p v-if="claim.spotSurvey.assessmentNotes">{{ claim.spotSurvey.assessmentNotes }}</p>
            </div>
            <fieldset class="cw-fieldset" :disabled="!editable || !canManage || busy">
              <legend>Spot survey</legend>
              <div class="cn-grid cw-grid-3">
                <div class="cn-field"><label for="sv-name">Surveyed by</label><input id="sv-name" v-model="survey.surveyorName" type="text" /></div>
                <div class="cn-field"><label for="sv-date">Survey date</label><input id="sv-date" v-model="survey.surveyDate" type="date" /></div>
                <div class="cn-field"><label for="sv-loc">Location</label><input id="sv-loc" v-model="survey.location" type="text" /></div>
                <label class="cn-option"><input v-model="survey.isDrivable" type="checkbox" /><span class="cn-option-text"><span class="cn-option-title">Vehicle can be driven</span><span class="cn-option-hint">Leave unticked if it must stay where it is</span></span></label>
                <label class="cn-option"><input v-model="survey.towingRequired" type="checkbox" /><span class="cn-option-text"><span class="cn-option-title">Needs towing</span><span class="cn-option-hint">Add the towing cost</span></span></label>
                <div v-if="survey.towingRequired" class="cn-field"><label for="sv-tow">Towing cost (ETB)</label><input id="sv-tow" v-model="survey.towingCost" type="number" min="0" /></div>
                <div class="cn-field span-2"><label for="sv-notes">Assessment notes</label><textarea id="sv-notes" v-model="survey.assessmentNotes" rows="3" placeholder="What damage you saw, whether it matches the report, and whether the cover applies"></textarea></div>
              </div>
              <div class="cw-row end"><button type="button" class="cn-verify-btn cw-pad" @click="saveSurvey">Save survey</button></div>
            </fieldset>
          </div>

          <!-- 4 Repair quotes -->
          <div v-if="viewStage === 4" class="cw-body">
            <p class="cw-muted">Each garage sends a proforma invoice for labour and spare parts. Add each one as a quote, then choose the one Standard will pay.</p>
            <div v-if="bids.length" class="cw-bids">
              <div v-for="b in bids" :key="b.bidUuid" class="cw-bid" :class="{ won: winner && winner.bidUuid === b.bidUuid, cheapest: cheapest && cheapest.bidUuid === b.bidUuid && bids.length > 1 }">
                <div class="cw-bid-top">
                  <span class="cw-bid-name">{{ b.garageName || garageName(b.garageCode) }}</span>
                  <span v-if="winner && winner.bidUuid === b.bidUuid" class="cw-chip done">Selected</span>
                  <span v-else-if="cheapest && cheapest.bidUuid === b.bidUuid && bids.length > 1" class="cw-chip current">Lowest</span>
                </div>
                <div class="cw-bid-amount">{{ money(b.bidAmount) }}</div>
                <div class="cw-muted">{{ b.estimatedDays ? `${b.estimatedDays} days` : '—' }}<template v-if="b.repairScope"> · {{ b.repairScope }}</template></div>
                <button v-if="editable && canManage && !winner" type="button" class="cw-mini-btn" :disabled="busy" @click="chooseBid(b)">Choose this quote</button>
              </div>
            </div>
            <p v-else class="cw-empty-inline">No quotes yet. Add the first one below.</p>
            <fieldset v-if="editable && canManage && !winner" class="cw-fieldset" :disabled="busy">
              <legend>Add a quote</legend>
              <div class="cn-grid cw-grid-3">
                <div class="cn-field"><label for="bd-garage">Garage</label><select id="bd-garage" v-model="bidForm.garageCode"><option v-for="g in GARAGES" :key="g.code" :value="g.code">{{ g.name }}</option></select></div>
                <div class="cn-field"><label for="bd-amount">Amount (ETB) <b class="cn-req" aria-hidden="true">*</b></label><input id="bd-amount" v-model="bidForm.bidAmount" type="number" min="1" /></div>
                <div class="cn-field"><label for="bd-days">Days to repair</label><input id="bd-days" v-model="bidForm.estimatedDays" type="number" min="1" /></div>
                <div class="cn-field span-2"><label for="bd-scope">Repair scope</label><input id="bd-scope" v-model="bidForm.repairScope" type="text" placeholder="e.g. Front bumper, bonnet and headlamp, with labour" /></div>
              </div>
              <div class="cw-row end"><button type="button" class="cn-verify-btn cw-pad" :disabled="!bidForm.bidAmount" @click="addBid">Add quote</button></div>
            </fieldset>
          </div>

          <!-- 5 Excess -->
          <div v-if="viewStage === 5" class="cw-body">
            <div class="cw-tiles">
              <div class="cw-tile"><span>Selected quote</span><strong>{{ money(winner?.bidAmount ?? claim.approvedAmount) }}</strong><em>{{ winner?.garageName || '' }}</em></div>
              <div class="cw-tile"><span>Insured pays</span><strong>{{ proc.excess ? (proc.excess.none ? 'None' : money(proc.excess.amount)) : '—' }}</strong><em>{{ proc.excess?.receiptNo ? `Receipt ${proc.excess.receiptNo}` : '' }}</em></div>
              <div class="cw-tile accent"><span>Standard pays</span><strong>{{ money(net ?? claim.approvedAmount) }}</strong><em>to the garage</em></div>
            </div>
            <fieldset class="cw-fieldset" :disabled="!editable || !canManage || busy">
              <legend>Excess and contribution</legend>
              <label class="cn-option"><input v-model="excessForm.none" type="checkbox" /><span class="cn-option-text"><span class="cn-option-title">The insured pays nothing</span><span class="cn-option-hint">No excess or contribution applies to this claim</span></span></label>
              <div v-if="!excessForm.none" class="cn-grid">
                <div class="cn-field"><label for="ex-amount">Amount paid by the insured (ETB)</label><input id="ex-amount" v-model="excessForm.amount" type="number" min="0" /></div>
                <div class="cn-field"><label for="ex-receipt">Receipt number</label><input id="ex-receipt" v-model="excessForm.receiptNo" type="text" /></div>
              </div>
              <div class="cw-row end"><button type="button" class="cn-verify-btn cw-pad" :disabled="!excessForm.none && (!excessForm.amount || !excessForm.receiptNo)" @click="saveExcess">Save</button></div>
            </fieldset>
          </div>

          <!-- 6 Repair -->
          <div v-if="viewStage === 6" class="cw-body">
            <div class="cw-tiles">
              <div class="cw-tile"><span>Garage</span><strong>{{ garageName(claim.garageUuid) || '—' }}</strong></div>
              <div class="cw-tile"><span>Repair status</span><strong>{{ { ASSIGN_TO_GARAGE: 'Waiting for vehicle', IN_MAINTENANCE: 'In repair', MAINTENANCE_COMPLETED: 'Repaired', HANDOVER_COMPLETED: 'Handed over' }[claim.status] || '—' }}</strong></div>
              <div class="cw-tile"><span>Estimated days</span><strong>{{ winner?.estimatedDays || '—' }}</strong></div>
            </div>
          </div>

          <!-- 7 Salvage & handover -->
          <div v-if="viewStage === 7" class="cw-body">
            <fieldset class="cw-fieldset" :disabled="!editable || !canManage || busy">
              <legend>Salvage</legend>
              <div class="cw-radios">
                <label class="cn-option"><input v-model="salvageForm.status" type="radio" value="RETURNED" /><span class="cn-option-text"><span class="cn-option-title">Old parts returned</span><span class="cn-option-hint">The garage handed the replaced parts to Standard</span></span></label>
                <label class="cn-option"><input v-model="salvageForm.status" type="radio" value="NOT_REQUIRED" /><span class="cn-option-text"><span class="cn-option-title">Not needed</span><span class="cn-option-hint">No parts to take back on this claim</span></span></label>
              </div>
              <div class="cn-field"><label for="sl-note">Note (optional)</label><input id="sl-note" v-model="salvageForm.note" type="text" placeholder="e.g. rear bumper, left tail lamp received at store" /></div>
              <div class="cw-row end"><button type="button" class="cn-verify-btn cw-pad" :disabled="!salvageForm.status" @click="saveSalvage">Save</button></div>
            </fieldset>
            <fieldset v-if="otherPartyAtFault" class="cw-fieldset" :disabled="!canManage || busy || !!proc.recovery">
              <legend>Recover from the other party</legend>
              <p v-if="proc.recovery" class="cw-note">Recovery started {{ when(proc.recovery.at) }} against {{ proc.recovery.atFaultPartyName }} for {{ money(proc.recovery.recoveryAmount) }}.</p>
              <template v-else>
                <p class="cw-muted">The notification form names another party<template v-if="form.accident.responsible"> (responsible: <strong>{{ form.accident.responsible }}</strong>)</template>. Standard can claim the repair cost back from them.</p>
                <div class="cn-grid cw-grid-3">
                  <div class="cn-field"><label for="rc-party">Party at fault</label><input id="rc-party" v-model="recoveryForm.atFaultPartyName" type="text" /></div>
                  <div class="cn-field"><label for="rc-insurer">Their insurer</label><input id="rc-insurer" v-model="recoveryForm.atFaultInsurerName" type="text" /></div>
                  <div class="cn-field"><label for="rc-policy">Their policy number</label><input id="rc-policy" v-model="recoveryForm.atFaultPolicyNumber" type="text" /></div>
                  <div class="cn-field"><label for="rc-amount">Amount to recover (ETB)</label><input id="rc-amount" v-model="recoveryForm.recoveryAmount" type="number" min="0" /></div>
                  <div class="cn-field span-2"><label for="rc-notes">Notes</label><input id="rc-notes" v-model="recoveryForm.notes" type="text" /></div>
                </div>
                <div class="cw-row end"><button type="button" class="cn-cancel" :disabled="!recoveryForm.atFaultPartyName" @click="startRecovery">Start recovery</button></div>
              </template>
            </fieldset>
          </div>

          <!-- Reason box for reject / withdraw -->
          <div v-if="closing" class="cw-close-box">
            <label for="cw-close-reason">{{ closing === 'REJECTED' ? 'Why is the claim rejected?' : 'Why is the claim withdrawn?' }} <b class="cn-req" aria-hidden="true">*</b></label>
            <textarea id="cw-close-reason" v-model="closeReason" rows="2" :placeholder="closing === 'REJECTED' ? 'e.g. Driver had no valid licence; cause not covered' : 'e.g. Insured settled privately'"></textarea>
            <div class="cw-row end">
              <button type="button" class="cn-cancel" @click="closing = null">Cancel</button>
              <button type="button" class="cw-danger" :disabled="!closeReason.trim() || busy" @click="confirmClose">{{ closing === 'REJECTED' ? 'Reject claim' : 'Withdraw claim' }}</button>
            </div>
          </div>

          <!-- Stage actions, like the wizard's footer -->
          <div class="cn-actions cw-actions">
            <button v-if="viewStage > 1" type="button" class="cn-cancel" @click="moveTo(viewStage - 1)">← {{ STAGES[viewStage - 2].label }}</button>
            <template v-if="editable && canManage && !closing && stage >= 2 && stage <= 5">
              <button v-if="stage <= 4" type="button" class="cw-link danger" @click="openClose('REJECTED')">Reject</button>
              <button type="button" class="cw-link" @click="openClose('WITHDRAWN')">Withdraw</button>
            </template>
            <span class="cn-step-count">{{ editable ? (gateOpen ? '✓ Ready to move on' : `${gate.length - gateDone} item${gate.length - gateDone === 1 ? '' : 's'} left`) : '' }}</span>

            <template v-if="editable">
              <button v-if="viewStage === 2 && canManage" type="button" class="cn-submit" :disabled="busy || !gateOpen" @click="startAssessment">Start assessment →</button>
              <button v-else-if="viewStage === 3 && canManage" type="button" class="cn-submit" :disabled="busy || !claim.adjustorUuid || !(claim.spotSurvey || proc.surveyRecorded)" @click="approve">Approve claim →</button>
              <button v-else-if="viewStage === 5 && canManage" type="button" class="cn-submit" :disabled="busy || !proc.excess" @click="sendToGarage">Send to garage →</button>
              <button v-else-if="viewStage === 6 && claim.status === 'ASSIGN_TO_GARAGE'" type="button" class="cn-submit" :disabled="busy" @click="setRepairStatus('IN_MAINTENANCE', 'Vehicle received at the garage')">Vehicle at garage →</button>
              <button v-else-if="viewStage === 6 && claim.status === 'IN_MAINTENANCE'" type="button" class="cn-submit" :disabled="busy" @click="setRepairStatus('MAINTENANCE_COMPLETED', 'Repair finished')">Repair finished →</button>
              <button v-else-if="viewStage === 7 && canManage" type="button" class="cn-submit" :disabled="busy || !proc.salvage" @click="handover">Hand over vehicle ✓</button>
            </template>
            <button v-else-if="viewStage < stage && viewStage < 7" type="button" class="cn-cancel" @click="moveTo(viewStage + 1)">{{ STAGES[viewStage].label }} →</button>
          </div>
        </section>

        <!-- ── Side column ─────────────────────────────────────────────── -->
        <aside class="cw-side">
          <div class="cn-card cw-side-card">
            <h3 class="cw-side-title">Money</h3>
            <div class="cw-money">
              <div><span>Estimated loss</span><strong>{{ money(claim.estimatedAmount) }}</strong></div>
              <div><span>Selected quote</span><strong>{{ money(winner?.bidAmount) }}</strong></div>
              <div><span>Insured pays</span><strong>{{ proc.excess ? (proc.excess.none ? 'None' : money(proc.excess.amount)) : '—' }}</strong></div>
              <div class="accent"><span>Standard pays</span><strong>{{ money(claim.approvedAmount ?? net) }}</strong></div>
            </div>
          </div>

          <div class="cn-card cw-side-card">
            <h3 class="cw-side-title">People</h3>
            <dl class="cw-facts tight">
              <dt>Adjustor</dt><dd>{{ claim.adjustorUuid ? adjustorName(claim.adjustorUuid) : '—' }}</dd>
              <dt>Garage</dt><dd>{{ claim.garageUuid ? garageName(claim.garageUuid) : '—' }}</dd>
              <dt>Reported by</dt><dd>{{ proc.reportedChannel ? words(proc.reportedChannel) : '—' }}</dd>
            </dl>
          </div>

          <div class="cn-card cw-side-card">
            <h3 class="cw-side-title">Activity</h3>
            <ol v-if="activityList.length" class="cw-activity">
              <li v-for="(a, i) in activityList.slice(0, 20)" :key="i">
                <span class="cw-dot" aria-hidden="true"></span>
                <div><p>{{ a.text }}</p><small>{{ [a.by, when(a.at)].filter(Boolean).join(' · ') }}</small></div>
              </li>
            </ol>
            <p v-else class="cw-empty-inline">Nothing done on this claim yet.</p>
            <p v-if="!serverActivity.length && activityList.length" class="cw-foot">The server has no log for this claim yet, so this is what was done on this computer.</p>
          </div>

          <div v-if="claimPhotos.length" class="cn-card cw-side-card">
            <h3 class="cw-side-title">Accident photos <span class="cw-muted">({{ claimPhotos.length }})</span></h3>
            <div class="cw-photos">
              <button v-for="p in claimPhotos" :key="p.documentUuid" type="button" :title="p.originalFileName" @click="selectedPhoto = p">
                <img :src="p.src" :alt="p.documentType || 'Accident photo'" />
              </button>
            </div>
          </div>

          <div v-if="claim.gpsCoordinates" class="cn-card cw-side-card">
            <h3 class="cw-side-title">Location</h3>
            <iframe class="cw-map" loading="lazy" :src="`https://maps.google.com/maps?q=${claim.gpsCoordinates}&z=15&output=embed`" title="Accident location"></iframe>
          </div>
        </aside>
      </div>
    </template>

    <div v-if="selectedPhoto" class="cw-lightbox" @click="selectedPhoto = null">
      <img :src="selectedPhoto.src" :alt="selectedPhoto.documentType || 'Accident photo'" @click.stop />
      <p>{{ selectedPhoto.originalFileName || '' }} · click outside the photo or press Esc to close</p>
    </div>
  </div>
</template>

<style scoped src="../claimUi.css"></style>

<style scoped>
.cw-head-text { min-width: 0; }
.cw-loading { display: flex; flex-direction: column; align-items: center; gap: .75rem; padding: 4rem 0; color: var(--cn-sub); }
.cw-spinner { width: 32px; height: 32px; border: 3px solid var(--cn-border); border-top-color: var(--cn-accent); border-radius: 50%; animation: cw-spin .8s linear infinite; }
@keyframes cw-spin { to { transform: rotate(360deg); } }
.cw-empty { text-align: center; color: var(--cn-sub); }

.cw-stepper { padding: 1.1rem 1.25rem; margin-bottom: 1rem; }
.cw-banner { display: flex; flex-wrap: wrap; align-items: center; gap: .5rem; padding: .75rem 1rem; border-radius: 12px; font-size: .84rem; margin-bottom: 1rem; }
.cw-banner.closed { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
.cw-banner.done { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }

.cw-layout { display: grid; grid-template-columns: 1fr; gap: 1rem; align-items: start; }
@media (min-width: 1200px) { .cw-layout { grid-template-columns: minmax(0, 1fr) 320px; } }

.cw-stage { padding: 1.5rem; }
.cw-stage-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; margin-bottom: 1rem; }
.cw-eyebrow { font-size: .7rem; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: var(--cn-sub); }
.cw-stage-title { font-size: 1.15rem; font-weight: 800; color: var(--cn-title); font-family: inherit; }
.cw-chip { font-size: .7rem; font-weight: 800; padding: .25rem .6rem; border-radius: 999px; white-space: nowrap; }
.cw-chip.current { background: #eef2ff; color: #4338ca; }
.cw-chip.done { background: #ecfdf5; color: #047857; }
.cw-chip.todo { background: #f1f5f9; color: #64748b; }
.cw-chip.closed { background: #fef2f2; color: #b91c1c; }

.cw-gate { background: var(--cn-bg); border: 1px solid var(--cn-border); border-radius: 12px; padding: .85rem 1rem; margin-bottom: 1.25rem; }
.cw-gate-head { display: flex; justify-content: space-between; font-size: .78rem; font-weight: 800; color: var(--cn-title); }
.cw-gate-count { color: var(--cn-sub); font-weight: 800; padding: .05rem .5rem; border-radius: 999px; background: var(--cn-card); border: 1px solid var(--cn-border); }
.cw-gate-count.done { color: #047857; border-color: #a7f3d0; background: #ecfdf5; }
.cw-gate-bar { height: 4px; border-radius: 4px; background: var(--cn-border); margin: .5rem 0 .6rem; overflow: hidden; }
.cw-gate-bar span { display: block; height: 100%; background: #10b981; transition: width .35s ease; }
.cw-gate ul { list-style: none; margin: 0; padding: 0; display: grid; gap: .35rem; }
.cw-gate li { display: flex; align-items: center; gap: .55rem; font-size: .8rem; font-weight: 600; color: var(--cn-title); }
.cw-gate li.done { color: var(--cn-sub); font-weight: 500; text-decoration: line-through; text-decoration-color: rgba(100,116,139,.5); }
.cw-tick { width: 1.1rem; height: 1.1rem; flex-shrink: 0; border-radius: 999px; border: 1.5px solid #cbd5e1; display: inline-flex; align-items: center; justify-content: center; font-size: .65rem; font-weight: 900; }
.cw-gate li.done .cw-tick { background: #10b981; border-color: #10b981; color: #fff; }

.cw-body { display: flex; flex-direction: column; gap: 1rem; }
.cw-static { padding: .65rem .9rem; font-size: .84rem; color: var(--cn-title); border: 1px dashed var(--cn-border); border-radius: 9px; }
.cw-facts { display: grid; grid-template-columns: auto 1fr; gap: .4rem 1rem; font-size: .82rem; margin: 0; }
.cw-facts dt { color: var(--cn-sub); font-weight: 600; }
.cw-facts dd { color: var(--cn-title); font-weight: 600; margin: 0; overflow-wrap: anywhere; }
.cw-facts.tight { font-size: .78rem; }
.cw-form { border: 1px solid var(--cn-border); border-radius: 12px; background: var(--cn-card); }
.cw-form summary { cursor: pointer; padding: .8rem 1rem; display: flex; flex-direction: column; gap: .1rem; list-style: none; }
.cw-form summary::-webkit-details-marker { display: none; }
.cw-form summary > span:first-child { font-size: .85rem; font-weight: 800; color: var(--cn-title); }
.cw-form summary > span:first-child::before { content: '▸'; display: inline-block; margin-right: .45rem; color: var(--cn-accent); transition: transform .15s; }
.cw-form[open] summary > span:first-child::before { transform: rotate(90deg); }
.cw-form summary:hover > span:first-child { color: var(--cn-accent); }
.cw-form-sub { font-size: .72rem; color: var(--cn-sub); padding-left: 1.1rem; }
.cw-form-tools { display: flex; justify-content: flex-end; gap: .5rem; padding: 0 1rem .6rem; }
.cw-form-body { border: 0; margin: 0; padding: 0 1rem 1rem; min-width: 0; }
/* Filled values read as text, not as greyed-out inputs */
.cw-form-body :deep(input), .cw-form-body :deep(select), .cw-form-body :deep(textarea) { background: var(--cn-bg); color: var(--cn-title); opacity: 1; -webkit-text-fill-color: var(--cn-title); cursor: default; resize: none; }
.cw-form-body :deep(.mn-add), .cw-form-body :deep(.mn-remove), .cw-form-body :deep(.mn-hint) { display: none; }
.cw-desc { font-size: .82rem; color: var(--cn-title); white-space: pre-wrap; background: var(--cn-bg); border-radius: 10px; padding: .75rem .9rem; }
.cw-muted { color: var(--cn-sub); font-size: .8rem; }
.cw-note { font-size: .8rem; color: var(--cn-title); background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 10px; padding: .6rem .8rem; }
.cn-root.dark .cw-note { background: rgba(14,165,233,.08); border-color: rgba(14,165,233,.25); }
.cw-empty-inline { font-size: .8rem; color: var(--cn-sub); }

.cw-check-pill { display: inline-flex; align-items: center; gap: .4rem; padding: .3rem .6rem; border-radius: 8px; border: 1px solid var(--cn-border); font-size: .72rem; font-weight: 700; color: var(--cn-title); cursor: pointer; transition: border-color .15s, background .15s; }
.cw-check-pill:hover { border-color: #c7d2fe; }
.cw-check-pill:has(input:checked) { border-color: #10b981; background: #ecfdf5; color: #047857; }
.cw-check-pill input { width: 1rem; height: 1rem; }
.cw-pill { display: inline-block; margin-left: .4rem; padding: .1rem .5rem; border-radius: 999px; font-size: .66rem; font-weight: 800; vertical-align: middle; white-space: nowrap; }
.cw-pill.pending { background: #f1f5f9; color: #475569; }
.cw-pill.original { background: #fef3c7; color: #92400e; }
.cw-pill.received { background: #d1fae5; color: #047857; }
.cw-pill.na { background: #f1f5f9; color: #64748b; }
.cw-doc-note { display: flex; align-items: center; gap: .4rem; margin-top: .4rem; font-size: .74rem; font-weight: 700; padding: .3rem .55rem; border-radius: 7px; width: fit-content; }
.cw-doc-note.busy { color: #4338ca; background: #eef2ff; }
.cw-doc-note.ok { color: #047857; background: #ecfdf5; }
.cw-doc-note.error { color: #b91c1c; background: #fef2f2; }
.cw-mini-spin { width: .8rem; height: .8rem; border: 2px solid #c7d2fe; border-top-color: #4338ca; border-radius: 50%; animation: cw-spin .8s linear infinite; }
.cw-mini-btn.busy { opacity: .7; pointer-events: none; }
.cw-doc-detail { font-size: .74rem; font-weight: 600; color: var(--cn-sub); margin-top: .1rem; }
.cw-next { display: flex; flex-wrap: wrap; align-items: flex-end; gap: .75rem; padding: .9rem 1rem; border: 1px dashed #c7d2fe; border-radius: 12px; background: #f8faff; }
.cn-root.dark .cw-next { background: rgba(99,102,241,.06); }
.cw-docs { list-style: none; margin: 0; padding: 0; display: grid; gap: .5rem; }
.cw-docs li { display: flex; align-items: flex-start; gap: .75rem; padding: .7rem .85rem; border: 1px solid var(--cn-border); border-radius: 12px; transition: border-color .2s, background .2s; }
.cw-docs li:hover { border-color: #c7d2fe; }
.cw-docs li.received { background: #f0fdf4; border-color: #bbf7d0; }
.cw-docs li.original { background: #fffbeb; border-color: #fde68a; }
.cw-docs li.na { opacity: .7; }
.cn-root.dark .cw-docs li.received { background: rgba(16,185,129,.08); }
.cn-root.dark .cw-docs li.original { background: rgba(245,158,11,.08); }
.cw-doc-icon { width: 1.6rem; height: 1.6rem; flex-shrink: 0; border-radius: 999px; border: 2px solid #cbd5e1; display: inline-flex; align-items: center; justify-content: center; font-weight: 900; font-size: .75rem; color: #fff; }
.cw-docs li.received .cw-doc-icon { background: #10b981; border-color: #10b981; }
.cw-docs li.original .cw-doc-icon { background: #f59e0b; border-color: #f59e0b; }
.cw-docs li.na .cw-doc-icon { color: #64748b; }
.cw-doc-main { flex: 1; min-width: 0; }
.cw-doc-label { font-size: .84rem; font-weight: 800; color: var(--cn-title); }
.cw-doc-meta { font-size: .74rem; color: var(--cn-sub); margin-top: .15rem; overflow-wrap: anywhere; }
.cw-doc-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; align-items: center; gap: .4rem; }
.cw-inline-form { display: flex; gap: .4rem; margin-top: .5rem; }
.cw-inline-form input { flex: 1; min-width: 0; padding: .4rem .6rem; border: 1px solid var(--cn-border); border-radius: 8px; font-size: .8rem; background: var(--cn-input-bg); color: var(--cn-title); }

.cw-mini-btn { position: relative; display: inline-flex; align-items: center; gap: .3rem; white-space: nowrap; padding: .32rem .7rem; border-radius: 8px; border: 1px solid #c7d2fe; background: #eef2ff; color: #4338ca; font-size: .72rem; font-weight: 700; cursor: pointer; transition: all .15s; }
.cw-mini-btn:hover:not(:disabled) { background: var(--cn-accent); color: #fff; border-color: var(--cn-accent); }
.cw-mini-btn.ghost { background: transparent; border-color: var(--cn-border); color: var(--cn-sub); }
.cw-mini-btn:disabled { opacity: .5; cursor: not-allowed; }
.cw-link { background: none; border: 0; color: var(--cn-accent); font-weight: 700; font-size: .8rem; cursor: pointer; padding: .3rem .4rem; }
.cw-link.danger { color: #dc2626; }
.cw-danger { padding: .55rem 1.2rem; border-radius: 9px; border: 0; background: #dc2626; color: #fff; font-weight: 700; font-size: .84rem; cursor: pointer; }
.cw-danger:disabled { opacity: .5; cursor: not-allowed; }

.cw-row { display: flex; flex-wrap: wrap; align-items: flex-end; gap: .75rem; }
.cw-row.end { justify-content: flex-end; }
.cw-grow { flex: 1; min-width: 220px; }
.cw-pad { padding: .55rem 1.1rem; }
.cw-fieldset { border: 1px solid var(--cn-border); border-radius: 12px; padding: 1rem 1.1rem; margin: 0; display: flex; flex-direction: column; gap: .8rem; min-width: 0; }
.cw-fieldset legend { font-size: .82rem; font-weight: 800; color: var(--cn-title); padding: 0 .35rem; }
.cw-fieldset:disabled { opacity: .75; }
@media (min-width: 1024px) { .cw-grid-3 { grid-template-columns: repeat(3, 1fr); } }
.cw-radios { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: .6rem; }

.cw-bids { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: .75rem; }
.cw-bid { border: 1px solid var(--cn-border); border-radius: 12px; padding: .85rem; display: flex; flex-direction: column; gap: .35rem; transition: transform .15s, box-shadow .15s; }
.cw-bid:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(15,23,42,.06); }
.cw-bid.cheapest { border-color: #c7d2fe; }
.cw-bid.won { border-color: #10b981; background: #f0fdf4; }
.cn-root.dark .cw-bid.won { background: rgba(16,185,129,.08); }
.cw-bid-top { display: flex; justify-content: space-between; align-items: center; gap: .5rem; }
.cw-bid-name { font-size: .82rem; font-weight: 800; color: var(--cn-title); }
.cw-bid-amount { font-size: 1.15rem; font-weight: 800; color: var(--cn-title); }
.cw-bid .cw-mini-btn { align-self: flex-start; margin-top: .25rem; }

.cw-tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: .75rem; }
.cw-tile { border: 1px solid var(--cn-border); border-radius: 12px; padding: .8rem .9rem; display: flex; flex-direction: column; gap: .15rem; }
.cw-tile span { font-size: .72rem; font-weight: 700; color: var(--cn-sub); }
.cw-tile strong { font-size: 1.05rem; font-weight: 800; color: var(--cn-title); }
.cw-tile em { font-style: normal; font-size: .72rem; color: var(--cn-sub); }
.cw-tile.accent { background: linear-gradient(135deg, #eef2ff, #f5f3ff); border-color: #c7d2fe; }
.cn-root.dark .cw-tile.accent { background: rgba(99,102,241,.1); }

.cw-close-box { margin-top: 1rem; border: 1px solid #fecaca; background: #fef2f2; border-radius: 12px; padding: .9rem 1rem; display: flex; flex-direction: column; gap: .5rem; }
.cn-root.dark .cw-close-box { background: rgba(220,38,38,.08); }
.cw-close-box label { font-size: .78rem; font-weight: 800; color: #991b1b; }
.cw-close-box textarea { border: 1px solid #fecaca; border-radius: 9px; padding: .55rem .8rem; font-size: .84rem; font-family: inherit; background: #fff; color: #0f172a; }
.cw-actions { align-items: center; flex-wrap: wrap; }

.cw-side { display: flex; flex-direction: column; gap: 1rem; min-width: 0; }
.cw-side-card { padding: 1.1rem 1.2rem; }
.cw-side-title { font-size: .82rem; font-weight: 800; color: var(--cn-title); margin-bottom: .7rem; font-family: inherit; }
.cw-money { display: grid; grid-template-columns: 1fr 1fr; gap: .6rem; }
.cw-money div { background: var(--cn-bg); border-radius: 10px; padding: .55rem .7rem; display: flex; flex-direction: column; }
.cw-money span { font-size: .68rem; font-weight: 700; color: var(--cn-sub); }
.cw-money strong { font-size: .9rem; font-weight: 800; color: var(--cn-title); }
.cw-money .accent { background: #ecfdf5; }
.cw-money .accent strong { color: #047857; }
.cn-root.dark .cw-money .accent { background: rgba(16,185,129,.1); }
.cw-activity { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: .7rem; max-height: 340px; overflow-y: auto; }
.cw-activity li { display: flex; gap: .6rem; }
.cw-dot { width: .55rem; height: .55rem; margin-top: .35rem; border-radius: 999px; background: var(--cn-accent); flex-shrink: 0; box-shadow: 0 0 0 3px rgba(99,102,241,.15); }
.cw-activity p { font-size: .78rem; color: var(--cn-title); margin: 0; }
.cw-activity small { font-size: .68rem; color: var(--cn-sub); }
.cw-foot { font-size: .68rem; color: var(--cn-sub); margin-top: .7rem; }
.cw-photos { display: grid; grid-template-columns: repeat(3, 1fr); gap: .4rem; }
.cw-photos button { border: 0; padding: 0; border-radius: 8px; overflow: hidden; aspect-ratio: 4 / 3; cursor: pointer; background: var(--cn-bg); }
.cw-photos img { width: 100%; height: 100%; object-fit: cover; transition: transform .2s; }
.cw-photos button:hover img { transform: scale(1.05); }
.cw-map { width: 100%; height: 200px; border: 0; border-radius: 10px; }
.cw-lightbox { position: fixed; inset: 0; z-index: 99999; background: rgba(2,6,23,.9); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 1rem; }
.cw-lightbox img { max-width: 100%; max-height: 85vh; border-radius: 10px; }
.cw-lightbox p { color: rgba(255,255,255,.6); font-size: .75rem; margin-top: .75rem; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); border: 0; }
</style>
