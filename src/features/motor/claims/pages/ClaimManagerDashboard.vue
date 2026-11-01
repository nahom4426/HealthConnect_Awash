<script setup>
// Claims dashboard: where open claims stand across the seven stages (claimProcess.js), what each
// is waiting on, and which have waited longest. Same look as the claims list and claim page.
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { fetchAllClaims, fetchAdjustors } from '@/features/motor/claims/api/digitalChannelApi';
import { STAGES, ADJUSTORS, CLOSED_OUTCOMES, processFor, currentStage, closedOutcome, waitingOn, daysOpen } from '@/features/motor/claims/claimProcess';
import { loadNotificationForm } from '@/features/motor/claims/notificationForm';
import RoleSwitcher from '@/components/RoleSwitcher.vue';
import { useDarkModeStore } from '@/stores/darkMode';

const router = useRouter();
const darkStore = useDarkModeStore();
const isDark = computed(() => darkStore.isDark);

const claims = ref([]);
const loading = ref(true);
const view = ref('OPEN'); // OPEN | OLD | S<n> | DONE | CLOSED

async function loadClaims() {
  loading.value = true;
  claims.value = await fetchAllClaims();
  loading.value = false;
}

const rows = computed(() => claims.value.map(c => {
  const proc = processFor(c);
  const form = loadNotificationForm(c).form;
  return {
    claim: c,
    stage: currentStage(c, proc),
    outcome: closedOutcome(c, proc),
    holder: form.policyHolder.fullName || c.driverName || '',
    plate: c.plateNumber || form.vehicle.plateNo || '',
    waiting: waitingOn(c, proc, c.documents),
    age: daysOpen(c),
  };
}));

const open = computed(() => rows.value.filter(r => !r.outcome && r.stage <= 7));
const old = computed(() => open.value.filter(r => (r.age ?? 0) > 14));
const done = computed(() => rows.value.filter(r => r.stage === 8));
const closed = computed(() => rows.value.filter(r => !!r.outcome));
const openValue = computed(() => open.value.reduce((sum, r) => sum + (Number(r.claim.estimatedAmount) || 0), 0));
const newThisWeek = computed(() => rows.value.filter(r => r.age !== null && r.age <= 7).length);

const tiles = computed(() => [
  { key: 'OPEN', label: 'Open claims', value: open.value.length, hint: `${newThisWeek.value} reported this week`, tone: 'accent' },
  { key: 'S2', label: 'Waiting for documents', value: open.value.filter(r => r.stage === 2).length, hint: 'Papers still to collect', tone: 'blue' },
  { key: 'OLD', label: 'Open over 14 days', value: old.value.length, hint: 'Follow these up first', tone: 'red' },
  { key: 'DONE', label: 'Completed', value: done.value.length, hint: 'Vehicle handed over', tone: 'green' },
  { key: 'CLOSED', label: 'Rejected / withdrawn', value: closed.value.length, hint: 'Closed without repair', tone: 'grey' },
  { key: 'OPEN', label: 'Open claims value', value: `ETB ${openValue.value.toLocaleString()}`, hint: 'Estimated loss', tone: 'amber', money: true },
]);

const pipeline = computed(() => {
  const max = Math.max(1, ...STAGES.map(s => open.value.filter(r => r.stage === s.n).length));
  return STAGES.map(s => {
    const count = open.value.filter(r => r.stage === s.n).length;
    return { ...s, count, width: `${(count / max) * 100}%` };
  });
});

const listed = computed(() => {
  const v = view.value;
  let list = open.value;
  if (v === 'OLD') list = old.value;
  else if (v === 'DONE') list = done.value;
  else if (v === 'CLOSED') list = closed.value;
  else if (v.startsWith('S')) list = open.value.filter(r => r.stage === Number(v.slice(1)));
  // Longest waiting first.
  return [...list].sort((a, b) => (b.age ?? -1) - (a.age ?? -1)).slice(0, 12);
});

const listTitle = computed(() => {
  const v = view.value;
  if (v === 'OLD') return 'Open over 14 days';
  if (v === 'DONE') return 'Completed claims';
  if (v === 'CLOSED') return 'Rejected or withdrawn';
  if (v.startsWith('S')) return `At stage ${v.slice(1)}: ${STAGES[Number(v.slice(1)) - 1].label}`;
  return 'Open claims, longest waiting first';
});

const adjustors = ref(ADJUSTORS);
const adjustorName = (id) => adjustors.value.find(a => a.id === id)?.name || id;
const stageLabel = (r) => (r.outcome ? CLOSED_OUTCOMES[r.outcome] || r.outcome : r.stage === 8 ? 'Completed' : STAGES[r.stage - 1].label);
const stageTone = (r) => (r.outcome ? 'closed' : r.stage === 8 ? 'done' : r.stage <= 2 ? 'early' : r.stage <= 5 ? 'mid' : 'late');
const ageTone = (days) => (days === null ? '' : days > 14 ? 'old' : days > 7 ? 'aging' : '');
const ageText = (days) => (days === null ? '—' : days === 0 ? 'Today' : `${days} day${days === 1 ? '' : 's'}`);

function openDetail(claim) {
  router.push(`/${claim.productModule || 'motor'}/claims/detail/${claim.claimUuid}`);
}

onMounted(async () => {
  loadClaims();
  const list = await fetchAdjustors();
  if (list.length) adjustors.value = list;
});
</script>

<template>
  <div class="cn-root" :class="{ dark: isDark }">
    <div class="cn-header">
      <div>
        <h1 class="cn-title">Claims dashboard</h1>
        <p class="cn-sub">Where every motor claim stands and what it is waiting on</p>
      </div>
      <div class="cn-header-tools">
        <RoleSwitcher />
        <button type="button" class="cn-blank-btn cd-refresh" :disabled="loading" @click="loadClaims">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true" :class="{ spin: loading }"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
          Refresh
        </button>
        <RouterLink to="/motor/claims/new" class="cn-submit cd-new">+ New claim</RouterLink>
      </div>
    </div>

    <div v-if="loading" class="cn-card cd-state"><div class="cd-spinner"></div>Loading claims…</div>

    <template v-else>
      <div class="cd-tiles">
        <button
          v-for="t in tiles"
          :key="t.label"
          type="button"
          class="cd-tile"
          :class="[t.tone, { active: view === t.key && !t.money }]"
          @click="view = t.key"
        >
          <span class="cd-tile-label">{{ t.label }}</span>
          <strong class="cd-tile-value" :class="{ money: t.money }">{{ t.value }}</strong>
          <span class="cd-tile-hint">{{ t.hint }}</span>
        </button>
      </div>

      <div class="cd-layout">
        <section class="cn-card cd-card" aria-label="Open claims by stage">
          <div class="cd-card-head">
            <h2>Open claims by stage</h2>
            <span class="cd-muted">Click a stage to list its claims</span>
          </div>
          <ul class="cd-pipeline">
            <li v-for="s in pipeline" :key="s.n">
              <button type="button" :class="{ active: view === `S${s.n}` }" @click="view = `S${s.n}`">
                <span class="cd-pipe-no">{{ s.n }}</span>
                <span class="cd-pipe-text"><strong>{{ s.label }}</strong><small>{{ s.hint }}</small></span>
                <span class="cd-pipe-bar"><span :style="{ width: s.width }"></span></span>
                <span class="cd-pipe-count">{{ s.count }}</span>
              </button>
            </li>
          </ul>
        </section>

        <section class="cn-card cd-card cd-list" :aria-label="listTitle">
          <div class="cd-card-head">
            <h2>{{ listTitle }}</h2>
            <RouterLink to="/motor/claims/process" class="cd-link">See all claims →</RouterLink>
          </div>
          <p v-if="!listed.length" class="cd-empty">No claims here.</p>
          <table v-else class="cd-table">
            <thead>
              <tr>
                <th>Claim</th>
                <th>Stage</th>
                <th>Waiting on</th>
                <th>Adjustor</th>
                <th class="num">Days open</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in listed" :key="r.claim.claimUuid" tabindex="0" @click="openDetail(r.claim)" @keyup.enter="openDetail(r.claim)">
                <td>
                  <div class="cd-claimno">{{ r.claim.claimNumber || '—' }}</div>
                  <div class="cd-sub">{{ [r.holder, r.plate].filter(Boolean).join(' · ') || '—' }}</div>
                </td>
                <td><span class="cd-stage" :class="stageTone(r)">{{ stageLabel(r) }}</span></td>
                <td class="cd-waiting">{{ r.waiting || (r.stage === 8 ? 'Done' : '—') }}</td>
                <td>
                  <span v-if="r.claim.adjustorUuid" class="cd-person">{{ adjustorName(r.claim.adjustorUuid) }}</span>
                  <span v-else class="cd-unassigned">Not assigned</span>
                </td>
                <td class="num"><span class="cd-age" :class="ageTone(r.age)">{{ ageText(r.age) }}</span></td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>
    </template>
  </div>
</template>

<style scoped src="../claimUi.css"></style>

<style scoped>
.cd-refresh { display: inline-flex; align-items: center; gap: .4rem; }
.cd-refresh svg { width: 14px; height: 14px; }
.cd-refresh .spin { animation: cd-spin .8s linear infinite; }
.cd-new { text-decoration: none; display: inline-flex; align-items: center; }

.cd-state { display: flex; flex-direction: column; align-items: center; gap: .6rem; padding: 3rem; color: var(--cn-sub); font-size: .85rem; }
.cd-spinner { width: 28px; height: 28px; border: 3px solid var(--cn-border); border-top-color: var(--cn-accent); border-radius: 50%; animation: cd-spin .8s linear infinite; }
@keyframes cd-spin { to { transform: rotate(360deg); } }

/* Number tiles */
.cd-tiles { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .75rem; margin-bottom: 1rem; }
@media (min-width: 760px) { .cd-tiles { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
@media (min-width: 1280px) { .cd-tiles { grid-template-columns: repeat(6, minmax(0, 1fr)); } }
.cd-tile {
  --t: #6366f1; position: relative; overflow: hidden; display: flex; flex-direction: column; gap: .2rem; text-align: left;
  padding: .95rem 1rem .9rem 1.15rem; border-radius: 14px; border: 1px solid var(--cn-border); background: var(--cn-card);
  cursor: pointer; font-family: inherit; transition: transform .15s, box-shadow .15s, border-color .15s;
}
.cd-tile::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: var(--t); }
.cd-tile:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(15,23,42,.07); border-color: color-mix(in srgb, var(--t) 35%, transparent); }
.cd-tile:focus-visible { outline: none; box-shadow: 0 0 0 3px color-mix(in srgb, var(--t) 30%, transparent); }
.cd-tile.active { border-color: var(--t); box-shadow: 0 0 0 1px var(--t) inset; background: color-mix(in srgb, var(--t) 6%, var(--cn-card)); }
.cd-tile.accent { --t: #6366f1; }
.cd-tile.blue { --t: #2563eb; }
.cd-tile.red { --t: #dc2626; }
.cd-tile.green { --t: #059669; }
.cd-tile.grey { --t: #64748b; }
.cd-tile.amber { --t: #d97706; }
.cd-tile-label { font-size: .74rem; font-weight: 700; color: var(--cn-sub); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cd-tile-value { font-size: 1.6rem; font-weight: 800; color: var(--cn-title); line-height: 1.15; }
.cd-tile-value.money { font-size: 1.15rem; padding: .2rem 0 .15rem; }
.cd-tile-hint { font-size: .7rem; font-weight: 600; color: color-mix(in srgb, var(--t) 80%, var(--cn-sub)); }

.cd-layout { display: grid; grid-template-columns: 1fr; gap: 1rem; align-items: start; }
@media (min-width: 1200px) { .cd-layout { grid-template-columns: 320px minmax(0, 1fr); } }
.cd-card { padding: 1.25rem; }
.cd-card-head { display: flex; justify-content: space-between; align-items: baseline; gap: .75rem; flex-wrap: wrap; margin-bottom: .9rem; }
.cd-card-head h2 { font-size: .95rem; font-weight: 800; color: var(--cn-title); font-family: inherit; }
.cd-muted { font-size: .72rem; color: var(--cn-sub); }
.cd-link { font-size: .78rem; font-weight: 700; color: var(--cn-accent); text-decoration: none; }
.cd-link:hover { text-decoration: underline; }

/* Stage pipeline */
.cd-pipeline { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: .35rem; }
.cd-pipeline button {
  width: 100%; display: grid; grid-template-columns: auto minmax(0, 1fr) 56px 1.6rem; align-items: center; gap: .65rem;
  padding: .45rem .6rem; border-radius: 10px; border: 1px solid transparent; background: transparent; cursor: pointer;
  font-family: inherit; text-align: left; transition: background .15s, border-color .15s;
}
.cd-pipeline button:hover { background: var(--cn-bg); border-color: var(--cn-border); }
.cd-pipeline button.active { background: #eef2ff; border-color: #c7d2fe; }
.cn-root.dark .cd-pipeline button.active { background: rgba(99,102,241,.12); }
.cd-pipe-no { width: 1.6rem; height: 1.6rem; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; font-size: .72rem; font-weight: 800; color: var(--cn-accent); border: 1.5px solid currentColor; }
.cd-pipeline button.active .cd-pipe-no { background: var(--cn-accent); color: #fff; border-color: var(--cn-accent); }
.cd-pipe-text { display: flex; flex-direction: column; min-width: 0; }
.cd-pipe-text strong { font-size: .8rem; font-weight: 800; color: var(--cn-title); line-height: 1.25; }
.cd-pipe-text small { font-size: .68rem; color: var(--cn-sub); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cd-pipe-bar { height: 6px; border-radius: 6px; background: var(--cn-border); overflow: hidden; }
.cd-pipe-bar span { display: block; height: 100%; border-radius: 6px; background: var(--cn-accent); transition: width .4s ease; }
.cd-pipe-count { font-size: .9rem; font-weight: 800; color: var(--cn-title); text-align: right; }

/* Claims table */
.cd-list { padding: 1.25rem 0 .5rem; }
.cd-list .cd-card-head { padding: 0 1.25rem; }
.cd-empty { padding: 2rem 1.25rem; text-align: center; font-size: .82rem; color: var(--cn-sub); }
.cd-table { width: 100%; border-collapse: collapse; font-size: .82rem; }
.cd-table th { text-align: left; padding: .6rem 1.25rem; font-size: .68rem; font-weight: 800; text-transform: uppercase; letter-spacing: .05em; color: var(--cn-sub); border-top: 1px solid var(--cn-border); border-bottom: 1px solid var(--cn-border); white-space: nowrap; }
.cd-table td { padding: .7rem 1.25rem; border-bottom: 1px solid var(--cn-border); color: var(--cn-title); vertical-align: middle; }
.cd-table tbody tr { cursor: pointer; transition: background .15s; }
.cd-table tbody tr:hover, .cd-table tbody tr:focus-visible { background: #f5f7ff; outline: none; }
.cn-root.dark .cd-table tbody tr:hover { background: rgba(99,102,241,.08); }
.cd-table tbody tr:last-child td { border-bottom: 0; }
.cd-table .num { text-align: right; white-space: nowrap; }
.cd-claimno { font-weight: 800; white-space: nowrap; }
.cd-sub { font-size: .72rem; color: var(--cn-sub); margin-top: .1rem; }
.cd-stage { display: inline-block; font-size: .7rem; font-weight: 800; padding: .2rem .55rem; border-radius: 999px; white-space: nowrap; }
.cd-stage.early { background: #eff6ff; color: #1d4ed8; }
.cd-stage.mid { background: #f5f3ff; color: #6d28d9; }
.cd-stage.late { background: #ecfeff; color: #0e7490; }
.cd-stage.done { background: #ecfdf5; color: #047857; }
.cd-stage.closed { background: #fef2f2; color: #b91c1c; }
.cd-waiting { font-size: .78rem; font-weight: 600; min-width: 180px; }
.cd-person { font-size: .78rem; font-weight: 700; white-space: nowrap; }
.cd-unassigned { font-size: .72rem; font-weight: 700; color: #b45309; background: #fffbeb; padding: .15rem .45rem; border-radius: 6px; white-space: nowrap; }
.cd-age { font-weight: 700; font-size: .76rem; padding: .15rem .45rem; border-radius: 6px; }
.cd-age.aging { background: #fffbeb; color: #b45309; }
.cd-age.old { background: #fef2f2; color: #b91c1c; }
@media (prefers-reduced-motion: reduce) { .cd-tile, .cd-pipe-bar span { transition: none; } }
</style>
