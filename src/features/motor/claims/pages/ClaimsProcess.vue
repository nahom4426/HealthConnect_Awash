<script setup>
// Motor claims list, grouped by the seven claim stages (claimProcess.js). Each row says what the
// claim is waiting on and how long it has been open; work happens on the claim page.
import { ref, computed, onMounted, watch } from 'vue';
import { useModuleStore, MODULES } from '@/stores/moduleStore';
import { useRoute, useRouter } from 'vue-router';
import { useDarkModeStore } from '@/stores/darkMode';
import { fetchClaimsByModule } from '@/features/motor/claims/api/digitalChannelApi';
import { STAGES, CLOSED_OUTCOMES, processFor, currentStage, closedOutcome, waitingOn, daysOpen } from '@/features/motor/claims/claimProcess';
import { loadNotificationForm } from '@/features/motor/claims/notificationForm';

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

const claims = ref([]);
const loading = ref(true);
const filter = ref('ACTIVE');
const search = ref('');

const pageMode = computed(() => {
  if (route.path.includes('/completed')) return 'completed';
  if (route.path.includes('/approved')) return 'approved';
  return 'process';
});

/** Each claim with its stage, what it waits on and its age. */
const rows = computed(() => claims.value.map(c => {
  const proc = processFor(c);
  const outcome = closedOutcome(c, proc);
  const stage = currentStage(c, proc);
  const form = loadNotificationForm(c).form;
  return {
    claim: c,
    stage,
    outcome,
    holder: form.policyHolder.fullName || c.driverName || '',
    plate: c.plateNumber || form.vehicle.plateNo || '',
    waiting: waitingOn(c, proc, c.documents),
    age: daysOpen(c),
  };
}));

// Approved = repair agreed and under way; completed = handed over.
const scopedRows = computed(() => {
  if (pageMode.value === 'approved') return rows.value.filter(r => !r.outcome && (r.stage === 5 || r.stage === 6));
  if (pageMode.value === 'completed') return rows.value.filter(r => r.stage === 8);
  return rows.value;
});

// Top tabs: which group of claims. Open claims also get a stage strip underneath.
const tabs = computed(() => {
  const list = scopedRows.value;
  const count = fn => list.filter(fn).length;
  const out = [{ key: 'ACTIVE', label: 'Open', count: count(r => !r.outcome && r.stage <= 7) }];
  if (pageMode.value !== 'approved') {
    out.push({ key: 'DONE', label: 'Completed', count: count(r => r.stage === 8) });
    out.push({ key: 'CLOSED', label: 'Rejected / withdrawn', count: count(r => !!r.outcome) });
  }
  out.push({ key: 'ALL', label: 'Everything', count: list.length });
  return out;
});

const stageCells = computed(() => {
  const list = scopedRows.value;
  const stages = pageMode.value === 'approved' ? STAGES.filter(s => s.n === 5 || s.n === 6) : STAGES;
  return stages.map(s => ({ ...s, count: list.filter(r => !r.outcome && r.stage === s.n).length }));
});

const activeTab = computed(() => (filter.value.startsWith('S') ? 'ACTIVE' : filter.value));
const showStages = computed(() => activeTab.value === 'ACTIVE');
const pickStage = (n) => { filter.value = filter.value === `S${n}` ? 'ACTIVE' : `S${n}`; };

const filteredRows = computed(() => {
  let list = scopedRows.value;
  const f = filter.value;
  if (f === 'ACTIVE') list = list.filter(r => !r.outcome && r.stage <= 7);
  else if (f === 'DONE') list = list.filter(r => r.stage === 8);
  else if (f === 'CLOSED') list = list.filter(r => !!r.outcome);
  else if (f.startsWith('S')) list = list.filter(r => !r.outcome && r.stage === Number(f.slice(1)));
  const q = search.value.trim().toLowerCase();
  if (q) {
    list = list.filter(r => [r.claim.claimNumber, r.claim.policyNumber, r.plate, r.holder]
      .some(v => String(v || '').toLowerCase().includes(q)));
  }
  // Oldest open claims first, so what's been waiting longest is on top.
  return [...list].sort((a, b) => (b.age ?? -1) - (a.age ?? -1));
});

const PAGE_SIZE = 10;
const currentPage = ref(1);
const totalPages = computed(() => Math.max(1, Math.ceil(filteredRows.value.length / PAGE_SIZE)));
const pageRows = computed(() => filteredRows.value.slice((currentPage.value - 1) * PAGE_SIZE, currentPage.value * PAGE_SIZE));
function goToPage(p) { if (p >= 1 && p <= totalPages.value) currentPage.value = p; }

async function loadClaims() {
  loading.value = true;
  if (mod.value?.id) claims.value = await fetchClaimsByModule(mod.value.id);
  loading.value = false;
  currentPage.value = 1;
}

function openDetail(claim) {
  router.push(`/${mod.value?.id || 'motor'}/claims/detail/${claim.claimUuid || claim.claimNumber}`);
}

const stageLabel = (r) => (r.outcome ? CLOSED_OUTCOMES[r.outcome] || r.outcome : r.stage === 8 ? 'Completed' : STAGES[r.stage - 1].label);
const stageTone = (r) => (r.outcome ? 'closed' : r.stage === 8 ? 'done' : r.stage <= 2 ? 'early' : r.stage <= 5 ? 'mid' : 'late');
const ageTone = (days) => (days === null ? '' : days > 14 ? 'old' : days > 7 ? 'aging' : '');

const pageTitle = computed(() => {
  if (pageMode.value === 'completed') return 'Completed Motor Claims';
  if (pageMode.value === 'approved') return 'Approved Motor Claims';
  return 'Motor Claims';
});

watch([filter, search], () => { currentPage.value = 1; });
watch(() => route.path, () => { filter.value = pageMode.value === 'completed' ? 'ALL' : 'ACTIVE'; applyQuery(); loadClaims(); });

// A claim page that just finished a claim sends ?done=<claim number>: open the Completed tab and say so.
// ?tab= opens a tab directly (Back to claims from a finished claim).
const justDone = ref('');
function applyQuery() {
  const { done, tab } = route.query;
  justDone.value = done ? String(done) : '';
  if (done) filter.value = 'DONE';
  else if (tab && ['ACTIVE', 'DONE', 'CLOSED', 'ALL'].includes(String(tab))) filter.value = String(tab);
}

onMounted(() => {
  filter.value = pageMode.value === 'completed' ? 'ALL' : 'ACTIVE';
  applyQuery();
  loadClaims();
});
</script>

<template>
  <div class="cn-root" :class="{ dark: isDark }">
    <div class="cn-header">
      <button class="cn-back" aria-label="Back" @click="router.push(`/${mod?.id}/dashboard`)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:18px;height:18px"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
      </button>
      <div>
        <h1 class="cn-title">{{ pageTitle }}</h1>
        <p class="cn-sub">{{ filteredRows.length }} claim{{ filteredRows.length === 1 ? '' : 's' }} · longest waiting first · click a row to open it</p>
      </div>
      <div class="cn-header-tools">
        <div class="cl-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path stroke-linecap="round" d="M20 20l-3.5-3.5"/></svg>
          <input v-model="search" type="search" placeholder="Search claim, policy, plate or name" aria-label="Search claims" />
        </div>
        <RouterLink :to="`/${mod?.id || 'motor'}/claims/new`" class="cn-submit cl-new" :style="`background:linear-gradient(135deg,${mod?.color?.from || '#6366f1'},${mod?.color?.to || '#4f46e5'})`">+ New claim</RouterLink>
      </div>
    </div>

    <div v-if="justDone" class="cn-alert success cl-done" role="status">
      <span>✓ Claim {{ justDone }} completed: the vehicle is handed over. It is listed under Completed.</span>
      <button type="button" class="cl-clear" aria-label="Dismiss" @click="justDone = ''; router.replace({ query: {} })">✕</button>
    </div>

    <div class="cn-card cl-filters">
      <div class="cl-tabs" role="tablist" aria-label="Which claims">
        <button
          v-for="t in tabs"
          :key="t.key"
          type="button"
          role="tab"
          class="cl-tab"
          :class="{ active: activeTab === t.key }"
          :aria-selected="activeTab === t.key"
          @click="filter = t.key"
        >
          {{ t.label }}<span class="cl-tab-count">{{ t.count }}</span>
        </button>
      </div>
      <div v-if="showStages" class="cl-stages" :style="{ '--cols': stageCells.length }" role="group" aria-label="Filter open claims by stage">
        <button
          v-for="s in stageCells"
          :key="s.n"
          type="button"
          class="cl-stage-cell"
          :class="{ active: filter === `S${s.n}`, empty: !s.count }"
          :aria-pressed="filter === `S${s.n}`"
          :title="`${s.label} · ${s.hint}`"
          @click="pickStage(s.n)"
        >
          <span class="cl-cell-top"><span class="cl-cell-no">{{ s.n }}</span><strong class="cl-cell-count">{{ s.count }}</strong></span>
          <span class="cl-cell-label">{{ s.label }}</span>
        </button>
      </div>
      <p v-if="filter.startsWith('S')" class="cl-filter-note">
        Showing stage {{ filter.slice(1) }} only · <button type="button" class="cl-clear" @click="filter = 'ACTIVE'">Show all open claims</button>
      </p>
    </div>

    <div v-if="loading" class="cn-card cl-state"><div class="cl-spinner"></div>Loading claims…</div>

    <div v-else-if="!filteredRows.length" class="cn-card cl-state">
      <p>No claims at this stage.</p>
      <RouterLink :to="`/${mod?.id || 'motor'}/claims/new`" class="cl-link">File a new claim →</RouterLink>
    </div>

    <div v-else class="cn-card cl-table-card">
      <table class="cl-table">
        <thead>
          <tr>
            <th>Claim</th>
            <th>Policy / plate</th>
            <th>Stage</th>
            <th>Waiting on</th>
            <th class="num">Days open</th>
            <th class="num">Estimate</th>
            <th class="sr-only">Open claim</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in pageRows" :key="r.claim.claimUuid || r.claim.claimNumber" :class="{ 'cl-just-done': justDone && (r.claim.claimNumber === justDone || r.claim.claimUuid === justDone) }" tabindex="0" @click="openDetail(r.claim)" @keyup.enter="openDetail(r.claim)">
            <td>
              <div class="cl-claimno">{{ r.claim.claimNumber || '—' }}</div>
              <div class="cl-sub">{{ r.holder || '—' }}</div>
            </td>
            <td>
              <div class="cl-mono">{{ r.claim.policyNumber || '—' }}</div>
              <div class="cl-sub">{{ r.plate || '—' }}</div>
            </td>
            <td>
              <span class="cl-stage" :class="stageTone(r)">{{ stageLabel(r) }}</span>
              <div class="cl-dots" :aria-label="`Stage ${Math.min(r.stage, 7)} of 7`">
                <span v-for="s in STAGES" :key="s.n" :class="{ on: s.n < r.stage || r.stage === 8, cur: s.n === r.stage && !r.outcome, x: s.n === r.stage && r.outcome }"></span>
              </div>
            </td>
            <td class="cl-waiting">{{ r.waiting || (r.stage === 8 ? 'Done' : '—') }}</td>
            <td class="num"><span class="cl-age" :class="ageTone(r.age)">{{ r.age === null ? '—' : r.age === 0 ? 'Today' : `${r.age} day${r.age === 1 ? '' : 's'}` }}</span></td>
            <td class="num cl-amount">{{ r.claim.estimatedAmount ? `ETB ${Number(r.claim.estimatedAmount).toLocaleString()}` : '—' }}</td>
            <td class="num"><span class="cl-go" aria-hidden="true">→</span></td>
          </tr>
        </tbody>
      </table>

      <div v-if="totalPages > 1" class="cl-pager">
        <span>{{ (currentPage - 1) * PAGE_SIZE + 1 }}–{{ Math.min(currentPage * PAGE_SIZE, filteredRows.length) }} of {{ filteredRows.length }}</span>
        <div>
          <button type="button" :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">← Prev</button>
          <button v-for="p in totalPages" :key="p" type="button" :class="{ active: p === currentPage }" @click="goToPage(p)">{{ p }}</button>
          <button type="button" :disabled="currentPage === totalPages" @click="goToPage(currentPage + 1)">Next →</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped src="../claimUi.css"></style>

<style scoped>
.cl-search { display: flex; align-items: center; gap: .45rem; padding: 0 .75rem; border: 1px solid var(--cn-border); border-radius: 10px; background: var(--cn-card); }
.cl-search svg { width: 16px; height: 16px; color: var(--cn-sub); flex-shrink: 0; }
.cl-search input { border: 0; outline: none; background: transparent; padding: .55rem 0; font-size: .82rem; color: var(--cn-title); width: 220px; max-width: 50vw; font-family: inherit; }
.cl-search:focus-within { border-color: var(--cn-accent); box-shadow: 0 0 0 3px rgba(99,102,241,.1); }
.cl-new { text-decoration: none; display: inline-flex; align-items: center; }

.cl-filters { padding: 0; margin-bottom: 1rem; overflow: hidden; }
.cl-tabs { display: flex; gap: .25rem; padding: 0 1rem; border-bottom: 1px solid var(--cn-border); overflow-x: auto; overflow-y: hidden; scrollbar-width: none; }
.cl-tab { position: relative; display: inline-flex; align-items: center; gap: .45rem; padding: .85rem .75rem; border: 0; background: none; color: var(--cn-sub); font-size: .82rem; font-weight: 700; font-family: inherit; cursor: pointer; white-space: nowrap; transition: color .15s; }
.cl-tab:hover { color: var(--cn-title); }
.cl-tab::after { content: ''; position: absolute; left: .5rem; right: .5rem; bottom: -1px; height: 3px; border-radius: 3px 3px 0 0; background: transparent; transition: background .15s; }
.cl-tab.active { color: var(--cn-accent); }
.cl-tab.active::after { background: var(--cn-accent); }
.cl-tab:focus-visible { outline: none; box-shadow: inset 0 0 0 2px rgba(99,102,241,.35); border-radius: 8px; }
.cl-tab-count { min-width: 1.4rem; padding: .05rem .4rem; border-radius: 999px; background: #f1f5f9; color: var(--cn-sub); font-size: .7rem; font-weight: 800; text-align: center; }
.cn-root.dark .cl-tab-count { background: rgba(255,255,255,.06); }
.cl-tab.active .cl-tab-count { background: #eef2ff; color: var(--cn-accent); }

.cl-stages { display: grid; grid-template-columns: repeat(var(--cols), minmax(0, 1fr)); gap: .5rem; padding: .85rem 1rem; }
@media (max-width: 900px) { .cl-stages { grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); } }
.cl-stage-cell { display: flex; flex-direction: column; gap: .3rem; padding: .6rem .7rem; border-radius: 10px; border: 1px solid var(--cn-border); background: var(--cn-bg); text-align: left; font-family: inherit; cursor: pointer; min-width: 0; transition: border-color .15s, background .15s, transform .15s, box-shadow .15s; }
.cl-stage-cell:hover { border-color: #c7d2fe; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(15,23,42,.05); }
.cl-stage-cell:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(99,102,241,.25); }
.cl-stage-cell.active { border-color: var(--cn-accent); background: #eef2ff; box-shadow: 0 0 0 1px var(--cn-accent) inset; }
.cn-root.dark .cl-stage-cell.active { background: rgba(99,102,241,.12); }
.cl-stage-cell.empty { opacity: .6; }
.cl-stage-cell.empty.active, .cl-stage-cell.empty:hover { opacity: 1; }
.cl-cell-top { display: flex; align-items: center; justify-content: space-between; gap: .4rem; }
.cl-cell-no { width: 1.3rem; height: 1.3rem; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; font-size: .65rem; font-weight: 800; color: var(--cn-accent); border: 1.5px solid currentColor; flex-shrink: 0; }
.cl-stage-cell.active .cl-cell-no { background: var(--cn-accent); color: #fff; border-color: var(--cn-accent); }
.cl-cell-count { font-size: 1.25rem; font-weight: 800; color: var(--cn-title); line-height: 1; }
.cl-cell-label { font-size: .74rem; font-weight: 700; color: var(--cn-sub); line-height: 1.2; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cl-stage-cell.active .cl-cell-label { color: var(--cn-title); }
.cl-filter-note { margin: 0; padding: 0 1rem .8rem; font-size: .75rem; color: var(--cn-sub); }
.cl-clear { border: 0; background: none; padding: 0; color: var(--cn-accent); font-weight: 700; font-size: .75rem; cursor: pointer; font-family: inherit; }
.cl-clear:hover { text-decoration: underline; }
.cl-table tbody tr.cl-just-done { background: #ecfdf5; box-shadow: inset 3px 0 0 #10b981; }
.cn-root.dark .cl-table tbody tr.cl-just-done { background: rgba(16,185,129,.1); }
.cl-done { display: flex; justify-content: space-between; align-items: center; gap: 1rem; }

.cl-state { display: flex; flex-direction: column; align-items: center; gap: .6rem; padding: 3rem; color: var(--cn-sub); font-size: .85rem; }
.cl-spinner { width: 28px; height: 28px; border: 3px solid var(--cn-border); border-top-color: var(--cn-accent); border-radius: 50%; animation: cl-spin .8s linear infinite; }
@keyframes cl-spin { to { transform: rotate(360deg); } }
.cl-link { color: var(--cn-accent); font-weight: 700; text-decoration: none; }

.cl-table-card { padding: 0; overflow-x: auto; }
.cl-table { width: 100%; border-collapse: collapse; font-size: .82rem; }
.cl-table th { text-align: left; padding: .8rem 1rem; font-size: .7rem; font-weight: 800; text-transform: uppercase; letter-spacing: .05em; color: var(--cn-sub); border-bottom: 1px solid var(--cn-border); white-space: nowrap; }
.cl-table td { padding: .75rem 1rem; border-bottom: 1px solid var(--cn-border); color: var(--cn-title); vertical-align: middle; }
.cl-table tbody tr { cursor: pointer; transition: background .15s; }
.cl-table tbody tr:hover, .cl-table tbody tr:focus-visible { background: #f5f7ff; outline: none; }
.cn-root.dark .cl-table tbody tr:hover { background: rgba(99,102,241,.08); }
.cl-table tbody tr:last-child td { border-bottom: 0; }
.cl-table .num { text-align: right; white-space: nowrap; }
.cl-claimno { font-weight: 800; white-space: nowrap; }
.cl-sub { font-size: .72rem; color: var(--cn-sub); margin-top: .1rem; }
.cl-mono { font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: .76rem; }
.cl-stage { display: inline-block; font-size: .7rem; font-weight: 800; padding: .2rem .55rem; border-radius: 999px; white-space: nowrap; }
.cl-stage.early { background: #eff6ff; color: #1d4ed8; }
.cl-stage.mid { background: #f5f3ff; color: #6d28d9; }
.cl-stage.late { background: #ecfeff; color: #0e7490; }
.cl-stage.done { background: #ecfdf5; color: #047857; }
.cl-stage.closed { background: #fef2f2; color: #b91c1c; }
.cl-dots { display: flex; gap: 3px; margin-top: .35rem; }
.cl-dots span { width: 12px; height: 4px; border-radius: 4px; background: var(--cn-border); }
.cl-dots span.on { background: #10b981; }
.cl-dots span.cur { background: var(--cn-accent); }
.cl-dots span.x { background: #dc2626; }
.cl-waiting { font-size: .78rem; font-weight: 600; color: var(--cn-title); max-width: 260px; }
.cl-age { font-weight: 700; font-size: .76rem; padding: .15rem .45rem; border-radius: 6px; }
.cl-age.aging { background: #fffbeb; color: #b45309; }
.cl-age.old { background: #fef2f2; color: #b91c1c; }
.cl-amount { font-weight: 700; }
.cl-go { color: var(--cn-sub); font-weight: 800; transition: transform .15s, color .15s; display: inline-block; }
.cl-table tbody tr:hover .cl-go { transform: translateX(3px); color: var(--cn-accent); }

.cl-pager { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: .5rem; padding: .75rem 1rem; border-top: 1px solid var(--cn-border); font-size: .75rem; color: var(--cn-sub); }
.cl-pager div { display: flex; gap: .3rem; }
.cl-pager button { padding: .3rem .6rem; border-radius: 7px; border: 1px solid var(--cn-border); background: var(--cn-card); color: var(--cn-sub); font-weight: 700; font-size: .72rem; cursor: pointer; }
.cl-pager button.active { background: var(--cn-accent); color: #fff; border-color: var(--cn-accent); }
.cl-pager button:disabled { opacity: .4; cursor: not-allowed; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); border: 0; }
</style>
