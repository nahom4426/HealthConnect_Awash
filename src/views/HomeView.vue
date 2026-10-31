<script setup lang="ts">
import { getActiveProviders } from "@/features/health/providers/api/providerApi";
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const now = new Date();
const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';

// No dashboard figures are made up: provider numbers load from the provider API, and
// premium/policy/claim figures live on /analytics (server-defined reports) until this
// page gets its own summary endpoint.
const kpis = ref([
  {
    title: "Total Premium Revenue",
    value: "—",
    sub: "see Analytics",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
    gradient: "from-blue-600 to-blue-500",
    bg: "bg-blue-50",
    iconColor: "text-blue-600",
    border: "border-blue-100",
  },
  {
    title: "Active Policies",
    value: "—",
    sub: "see Analytics",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>`,
    gradient: "from-emerald-600 to-emerald-500",
    bg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    border: "border-emerald-100",
  },
  {
    title: "Claims This Month",
    value: "—",
    sub: "see Analytics",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>`,
    gradient: "from-amber-600 to-amber-500",
    bg: "bg-amber-50",
    iconColor: "text-amber-600",
    border: "border-amber-100",
  },
  {
    title: "Provider Network",
    value: "—",
    sub: "active providers on the network",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>`,
    gradient: "from-violet-600 to-violet-500",
    bg: "bg-violet-50",
    iconColor: "text-violet-600",
    border: "border-violet-100",
  },
]);

type ProviderRow = { name: string; category: string; contact: string; status: string };
const activeProviders = ref<ProviderRow[]>([]);
const providerTotal = ref<number | null>(null);

// The provider list answers in a few shapes (see usePagination); read the page out of any of them
function readPage(response: any) {
  let data = response?.data ?? response;
  if (data?.data && (Array.isArray(data.data) || data.data.content)) data = data.data;
  const rows = Array.isArray(data) ? data : Array.isArray(data?.content) ? data.content : [];
  const total = typeof data?.totalElements === "number" ? data.totalElements : rows.length;
  return { rows, total };
}

async function loadProviders() {
  try {
    const response: any = await getActiveProviders({ page: 1, limit: 5, status: "ACTIVE" });
    // ApiService resolves failures as { success: false, error } instead of throwing; keep "—"
    if (response?.success === false) throw new Error(response.error || `HTTP ${response.status}`);
    const { rows, total } = readPage(response);
    providerTotal.value = total;
    kpis.value[3].value = total.toLocaleString();
    activeProviders.value = rows.slice(0, 5).map((p: any) => ({
      name: p.providerName || "—",
      category: p.categoryName || p.category || "—",
      contact: p.telephone || p.email || "—",
      status: p.status || "ACTIVE",
    }));
  } catch (e) {
    console.warn("Could not load providers for the dashboard:", e);
  }
}

const rateProducts = [
  { id: "motor",       name: "Motor",    color: "#2563eb", icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>`, updated: "2d ago" },
  { id: "health",      name: "Health",   color: "#059669", icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`, updated: "3d ago" },
  { id: "life",        name: "Life",     color: "#7c3aed", icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>`, updated: "1d ago" },
  { id: "fire",        name: "Fire",     color: "#ea580c", icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M12 2c0 0-5 4-5 9a5 5 0 0010 0c0-5-5-9-5-9z"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 12c0 0-2 1.5-2 3a2 2 0 004 0c0-1.5-2-3-2-3z"/></svg>`, updated: "1w ago" },
  { id: "marine",      name: "Marine",   color: "#0284c7", icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M2 20l4-12h12l4 12H2z"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 8V4"/></svg>`, updated: "5d ago" },
  { id: "engineering", name: "Engineering", color: "#d97706", icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>`, updated: "2w ago" },
];

const quickActions = [
  { label: "New Quotation",   sub: "Create quote",      to: "/new_quotation",          color: "#2563eb", icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>` },
  { label: "Add Policy",      sub: "Issue policy",      to: "/institution_policy", color: "#059669", icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>` },
  { label: "Process Claim",   sub: "Handle request",    to: "/create_cash_claims",        color: "#7c3aed", icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>` },
  { label: "Add Provider",    sub: "Expand network",    to: "/add_provider",           color: "#ea580c", icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>` },
];


onMounted(() => { loadProviders(); });
</script>

<template>
  <div class="db-root">

    <!-- ══ TOP BAR ══ -->
    <div class="db-topbar">
      <div class="db-topbar-left">
        <div class="db-greeting-dot"></div>
        <div>
          <h1 class="db-title">{{ greeting }}, Admin</h1>
          <p class="db-subtitle">Here's what's happening with your insurance platform today.</p>
        </div>
      </div>
      <div class="db-topbar-right">
        <div class="db-date-chip">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="db-date-icon">
            <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
          </svg>
          {{ now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) }}
        </div>

      </div>
    </div>

    <!-- ══ KPI CARDS ══ -->
    <div class="db-kpi-grid">
      <div v-for="(k, i) in kpis" :key="i" class="db-kpi-card" :style="`animation-delay:${i * 60}ms`">
        <div class="db-kpi-top">
          <div class="db-kpi-icon-wrap" :class="k.bg + ' ' + k.border">
            <span :class="k.iconColor" v-html="k.icon" style="width:22px;height:22px;display:flex"></span>
          </div>
        </div>
        <div class="db-kpi-value">{{ k.value }}</div>
        <div class="db-kpi-title">{{ k.title }}</div>
        <div class="db-kpi-sub">{{ k.sub }}</div>
      </div>
    </div>

    <!-- ══ CHARTS + CLAIM FIGURES: served by the reports service on /analytics ══ -->
    <div class="db-card">
      <div class="db-card-header">
        <div>
          <h3 class="db-card-title">Premiums, claims and loss ratio</h3>
          <p class="db-card-sub">Live figures come from the server-defined reports on the Analytics page.</p>
        </div>
      </div>
      <RouterLink to="/analytics" class="db-view-link">Open Analytics</RouterLink>
    </div>

    <!-- ══ BOTTOM ROW: Providers + Quick Actions ══ -->
    <div class="db-bottom-row">

      <!-- Providers Table -->
      <div class="db-card db-providers-card">
        <div class="db-card-header">
          <div>
            <h3 class="db-card-title">Top Active Providers</h3>
            <p class="db-card-sub">Most recent on the network</p>
          </div>
          <span v-if="providerTotal !== null" class="db-chip db-chip-slate">{{ providerTotal.toLocaleString() }} Network</span>
        </div>
        <div class="db-providers-table">
          <div class="db-tbl-head">
            <span>Provider</span>
            <span>Category</span>
            <span>Contact</span>
            <span class="db-tbl-right">Status</span>
          </div>
          <div v-if="activeProviders.length === 0" class="db-tbl-row"><span class="db-tbl-type">No active providers loaded.</span></div>
          <div v-for="(p, i) in activeProviders" :key="i" class="db-tbl-row" :style="`animation-delay:${i*40}ms`">
            <div class="db-tbl-name">
              <div class="db-tbl-avatar" :style="`background:${['#eff6ff','#ecfdf5','#fefce8','#f5f3ff','#fff7ed'][i]};color:${['#2563eb','#059669','#d97706','#7c3aed','#ea580c'][i]}`">
                {{ p.name.charAt(0) }}
              </div>
              {{ p.name }}
            </div>
            <span class="db-tbl-type">{{ p.category }}</span>
            <span class="db-tbl-loc">{{ p.contact }}</span>
            <span class="db-tbl-claims">{{ p.status }}</span>
          </div>
        </div>
        <RouterLink to="/active_providers" class="db-view-link">
          View all providers
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:14px;height:14px"><path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
        </RouterLink>
      </div>

      <!-- Quick Actions -->
      <div class="db-qa-col">
        <div class="db-qa-header">
          <h3 class="db-card-title">Quick Actions</h3>
          <p class="db-card-sub">Common tasks</p>
        </div>
        <div class="db-qa-grid">
          <RouterLink
            v-for="(qa, i) in quickActions" :key="i"
            :to="qa.to"
            class="db-qa-btn"
            :style="`--qa:${qa.color};animation-delay:${i*55}ms`"
          >
            <div class="db-qa-icon" v-html="qa.icon"></div>
            <div>
              <div class="db-qa-label">{{ qa.label }}</div>
              <div class="db-qa-sub">{{ qa.sub }}</div>
            </div>
            <div class="db-qa-arrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:14px;height:14px"><path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
            </div>
          </RouterLink>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
/* ═══════════════════════════════════
   ROOT
═══════════════════════════════════ */
.db-root {
  min-height: 100%;
  background: #f8fafc;
  padding: 1.5rem 1.75rem 3rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* ═══════════════════════════════════
   TOP BAR
═══════════════════════════════════ */
.db-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.25rem 1.5rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}
.db-topbar-left { display: flex; align-items: center; gap: 0.875rem; }
.db-greeting-dot {
  width: 10px; height: 10px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 0 3px rgba(16,185,129,0.2);
  flex-shrink: 0;
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0%,100% { box-shadow: 0 0 0 3px rgba(16,185,129,0.2); }
  50%      { box-shadow: 0 0 0 6px rgba(16,185,129,0.08); }
}
.db-title { font-size: 1.25rem; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; }
.db-subtitle { font-size: 0.8125rem; color: #64748b; margin-top: 0.1rem; }
.db-topbar-right { display: flex; align-items: center; gap: 0.75rem; }
.db-date-chip {
  display: flex; align-items: center; gap: 0.5rem;
  font-size: 0.8125rem; font-weight: 500; color: #475569;
  background: #f8fafc; border: 1px solid #e2e8f0;
  border-radius: 8px; padding: 0.5rem 0.875rem;
}
.db-date-icon { width: 14px; height: 14px; color: #94a3b8; }
.db-rc-btn {
  display: flex; align-items: center; gap: 0.5rem;
  font-size: 0.875rem; font-weight: 700; color: #fff;
  background: linear-gradient(135deg, #1e40af, #3b82f6);
  border-radius: 10px; padding: 0.5rem 1rem;
  text-decoration: none;
  transition: transform 0.15s, box-shadow 0.15s;
  box-shadow: 0 3px 10px rgba(37,99,235,0.28);
}
.db-rc-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(37,99,235,0.36); }

/* ═══════════════════════════════════
   KPI CARDS
═══════════════════════════════════ */
.db-kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}
.db-kpi-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.375rem 1.375rem 1.125rem;
  display: flex; flex-direction: column; gap: 0.375rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  transition: transform 0.2s, box-shadow 0.2s;
  animation: cardIn 0.5s cubic-bezier(0.22,1,0.36,1) both;
}
@keyframes cardIn {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
}
.db-kpi-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.09); }
.db-kpi-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem; }
.db-kpi-icon-wrap {
  width: 40px; height: 40px; border-radius: 10px; border: 1.5px solid;
  display: flex; align-items: center; justify-content: center;
}
.db-kpi-trend {
  display: flex; align-items: center; gap: 3px;
  font-size: 0.75rem; font-weight: 700; border-radius: 6px; padding: 0.2rem 0.5rem;
}
.db-trend-up { background: #ecfdf5; color: #059669; }
.db-trend-down { background: #fff1f2; color: #e11d48; }
.db-kpi-value { font-size: 1.625rem; font-weight: 900; color: #0f172a; letter-spacing: -0.03em; line-height: 1; }
.db-kpi-title { font-size: 0.825rem; font-weight: 600; color: #334155; }
.db-kpi-sub { font-size: 0.75rem; color: #94a3b8; }
.db-kpi-bar-track { margin-top: 0.625rem; height: 3px; background: #f1f5f9; border-radius: 9999px; overflow: hidden; }
.db-kpi-bar-fill { height: 100%; border-radius: 9999px; transition: width 1s ease; }

/* ═══════════════════════════════════
   CARD BASE
═══════════════════════════════════ */
.db-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.375rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}
.db-card-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  margin-bottom: 1.25rem; gap: 0.75rem;
}
.db-card-title { font-size: 0.9375rem; font-weight: 800; color: #0f172a; }
.db-card-sub { font-size: 0.75rem; color: #94a3b8; margin-top: 0.15rem; }

/* chips */
.db-chip {
  display: inline-flex; align-items: center; gap: 0.3rem;
  font-size: 0.725rem; font-weight: 700; border-radius: 6px;
  padding: 0.25rem 0.625rem; white-space: nowrap; flex-shrink: 0;
}
.db-chip-blue    { background: #eff6ff; color: #2563eb; }
.db-chip-emerald { background: #ecfdf5; color: #059669; }
.db-chip-slate   { background: #f8fafc; color: #64748b; }

/* view link */
.db-view-link {
  display: inline-flex; align-items: center; gap: 0.375rem;
  font-size: 0.8125rem; font-weight: 700; color: #2563eb;
  text-decoration: none; margin-top: 1rem;
  transition: gap 0.15s;
}
.db-view-link:hover { gap: 0.6rem; }

/* ═══════════════════════════════════
   CHARTS ROW
═══════════════════════════════════ */
.db-charts-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

/* ═══════════════════════════════════
   MIDDLE ROW
═══════════════════════════════════ */
.db-mid-row {
  display: grid;
  grid-template-columns: 1.6fr 0.8fr 1.4fr;
  gap: 1rem;
  align-items: start;
}

/* Pipeline */
.db-pipeline-list { display: flex; flex-direction: column; gap: 0.875rem; }
.db-pipeline-row { display: flex; align-items: center; gap: 0.75rem; }
.db-pipeline-label {
  display: flex; align-items: center; gap: 0.5rem;
  width: 100px; flex-shrink: 0;
  font-size: 0.8125rem; font-weight: 600; color: #334155;
}
.db-pipeline-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.db-pipeline-bar-wrap { flex: 1; display: flex; align-items: center; gap: 0.5rem; }
.db-pipeline-bar-track { flex: 1; height: 6px; background: #f1f5f9; border-radius: 9999px; overflow: hidden; }
.db-pipeline-bar-fill { height: 100%; border-radius: 9999px; transition: width 1s ease; }
.db-pipeline-pct { font-size: 0.7rem; font-weight: 700; color: #64748b; width: 32px; text-align: right; }
.db-pipeline-count {
  font-size: 0.75rem; font-weight: 800; color: #0f172a;
  background: #f8fafc; border: 1px solid #e2e8f0;
  border-radius: 6px; padding: 0.15rem 0.5rem;
  width: 40px; text-align: center; flex-shrink: 0;
}

/* Insights */
.db-insights-col { display: flex; flex-direction: column; gap: 0.75rem; }
.db-insight-item {
  border-radius: 12px; padding: 0.875rem 1rem;
  border: 1px solid transparent;
}
.db-insight-blue    { background: #eff6ff; border-color: #dbeafe; }
.db-insight-emerald { background: #ecfdf5; border-color: #d1fae5; }
.db-insight-violet  { background: #f5f3ff; border-color: #ede9fe; }
.db-insight-amber   { background: #fffbeb; border-color: #fef3c7; }
.db-insight-label { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: #64748b; }
.db-insight-val { font-size: 1.375rem; font-weight: 900; color: #0f172a; letter-spacing: -0.025em; margin: 0.25rem 0 0.2rem; }
.db-insight-trend { font-size: 0.72rem; font-weight: 600; }
.db-insight-trend.up { color: #059669; }
.db-insight-trend.down { color: #e11d48; }

/* Activity */
.db-live-dot-wrap { display: flex; align-items: center; gap: 0.4rem; }
.db-live-dot {
  width: 7px; height: 7px; border-radius: 50%; background: #10b981;
  animation: pulse 2s infinite;
}
.db-live-txt { font-size: 0.725rem; font-weight: 700; color: #059669; }
.db-activity-list { display: flex; flex-direction: column; gap: 0.75rem; }
.db-activity-row {
  display: flex; align-items: center; gap: 0.875rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #f1f5f9;
}
.db-activity-row:last-child { border-bottom: none; padding-bottom: 0; }
.db-activity-icon {
  width: 34px; height: 34px; border-radius: 9px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.db-activity-icon :deep(svg) { width: 16px; height: 16px; }
.db-activity-body { flex: 1; min-width: 0; }
.db-activity-action { font-size: 0.8125rem; font-weight: 600; color: #0f172a; }
.db-activity-inst { font-size: 0.725rem; color: #94a3b8; margin-top: 0.1rem; }
.db-activity-time { font-size: 0.7rem; font-weight: 500; color: #94a3b8; white-space: nowrap; flex-shrink: 0; }

/* ═══════════════════════════════════
   RATE CONFIG SECTION
═══════════════════════════════════ */
.db-rc-header-left { display: flex; align-items: center; gap: 0.875rem; }
.db-rc-header-icon {
  width: 40px; height: 40px; border-radius: 10px;
  background: linear-gradient(135deg, #1e40af, #3b82f6);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 12px rgba(37,99,235,0.25); flex-shrink: 0;
}
.db-rc-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 0.875rem;
}
@media (max-width: 1280px) {
  .db-rc-grid { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 640px) {
  .db-rc-grid { grid-template-columns: repeat(1, 1fr); }
}

.db-rc-card {
  border-radius: 16px;
  border: 1.5px solid var(--rc-border, #e2e8f0);
  background: #ffffff;
  padding: 1.1rem 1rem;
  cursor: pointer;
  display: flex; flex-direction: column; justify-content: space-between; gap: 0.875rem;
  transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
  animation: cardIn 0.45s cubic-bezier(0.22,1,0.36,1) both;
  position: relative; overflow: hidden;
  box-sizing: border-box;
}

.db-rc-card:hover {
  transform: translateY(-4px);
  background: #ffffff;
  box-shadow: 0 12px 28px -4px var(--rc-glow, rgba(0,0,0,0.08));
  border-color: var(--rc);
}

.db-rc-card-top {
  display: flex; align-items: center; justify-content: space-between; width: 100%;
}

.db-rc-card-icon-badge {
  width: 38px; height: 38px; border-radius: 10px;
  background: var(--rc-icon-bg, #f1f5f9);
  color: var(--rc);
  border: 1px solid var(--rc-border, #e2e8f0);
  display: flex; align-items: center; justify-content: center;
  transition: transform 0.22s ease, background-color 0.22s ease;
  flex-shrink: 0;
}
.db-rc-card-icon-badge :deep(svg) { width: 20px; height: 20px; }

.db-rc-card:hover .db-rc-card-icon-badge {
  transform: scale(1.06);
}

.db-rc-card-content {
  display: flex; flex-direction: column; gap: 0.2rem;
}

.db-rc-card-name {
  font-size: 0.875rem; font-weight: 700; color: #0f172a; letter-spacing: -0.01em;
}

.db-rc-card-meta {
  font-size: 0.72rem; font-weight: 500; color: #64748b;
}

.db-rc-card-arrow {
  width: 26px; height: 26px; border-radius: 50%;
  background: var(--rc-icon-bg, #f1f5f9);
  color: var(--rc);
  opacity: 0.6;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.22s ease;
}

.db-rc-card:hover .db-rc-card-arrow {
  opacity: 1;
  background: var(--rc);
  color: #ffffff;
  transform: translateX(2px);
}

/* ═══════════════════════════════════
   BOTTOM ROW
═══════════════════════════════════ */
.db-bottom-row {
  display: grid;
  grid-template-columns: 1fr 0.85fr;
  gap: 1rem;
  align-items: start;
}

/* Providers table */
.db-providers-table { border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; }
.db-tbl-head {
  display: grid; grid-template-columns: 1.8fr 0.9fr 1fr 0.7fr;
  padding: 0.625rem 1rem;
  background: #f8fafc;
  font-size: 0.7rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.07em; color: #64748b;
  border-bottom: 1px solid #e2e8f0;
}
.db-tbl-right { text-align: right; }
.db-tbl-row {
  display: grid; grid-template-columns: 1.8fr 0.9fr 1fr 0.7fr;
  padding: 0.625rem 1rem;
  align-items: center;
  border-bottom: 1px solid #f1f5f9;
  font-size: 0.8125rem;
  animation: cardIn 0.4s cubic-bezier(0.22,1,0.36,1) both;
  transition: background 0.1s;
}
.db-tbl-row:last-child { border-bottom: none; }
.db-tbl-row:hover { background: #f8fafc; }
.db-tbl-name {
  display: flex; align-items: center; gap: 0.625rem;
  font-weight: 600; color: #0f172a;
}
.db-tbl-avatar {
  width: 28px; height: 28px; border-radius: 7px;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.75rem; font-weight: 800; flex-shrink: 0;
}
.db-tbl-type { color: #64748b; font-weight: 500; }
.db-tbl-loc { color: #64748b; font-weight: 500; }
.db-tbl-claims {
  text-align: right; font-weight: 700; color: #0f172a;
  background: #f1f5f9; border-radius: 5px;
  padding: 0.15rem 0.5rem; font-size: 0.75rem;
  justify-self: end;
}

/* Quick Actions */
.db-qa-col {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.375rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}
.db-qa-header { margin-bottom: 1rem; }
.db-qa-grid { display: flex; flex-direction: column; gap: 0.625rem; }
.db-qa-btn {
  display: flex; align-items: center; justify-content: space-between; gap: 0.875rem;
  padding: 0.875rem 1rem;
  border-radius: 12px;
  border: 1.5px solid #e2e8f0;
  background: #fff;
  text-decoration: none;
  cursor: pointer;
  outline: none;
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s, border-color 0.2s, background 0.2s;
  animation: cardIn 0.45s cubic-bezier(0.22,1,0.36,1) both;
}
.db-qa-btn:hover {
  transform: translateX(4px);
  border-color: var(--qa);
  background: color-mix(in srgb, var(--qa) 6%, white);
  box-shadow: 0 4px 16px rgba(0,0,0,0.06);
}
.db-qa-btn:focus,
.db-qa-btn:focus-visible,
.db-qa-btn:active {
  outline: none;
  border-color: var(--qa);
  box-shadow: 0 4px 14px rgba(0,0,0,0.06);
}
.db-qa-icon {
  width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: color-mix(in srgb, var(--qa) 12%, white);
  color: var(--qa);
  transition: transform 0.25s ease;
}
.db-qa-btn:hover .db-qa-icon { transform: scale(1.06); }
.db-qa-icon :deep(svg) { width: 18px; height: 18px; }
.db-qa-label {
  font-size: 0.85rem; font-weight: 700; color: #0f172a;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.db-qa-sub {
  font-size: 0.72rem; color: #64748b; margin-top: 0.1rem;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.db-qa-arrow {
  margin-left: auto; color: var(--qa); flex-shrink: 0;
  width: 26px; height: 26px; border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  background: color-mix(in srgb, var(--qa) 10%, transparent);
  transition: all 0.2s ease;
}
.db-qa-btn:hover .db-qa-arrow {
  background: var(--qa);
  color: #fff;
  transform: translateX(3px);
}

/* ═══════════════════════════════════
   RESPONSIVE
═══════════════════════════════════ */
@media (max-width: 1280px) {
  .db-rc-grid { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 1100px) {
  .db-kpi-grid { grid-template-columns: repeat(2, 1fr); }
  .db-mid-row { grid-template-columns: 1fr 1fr; }
  .db-insights-col { grid-column: span 2; display: grid; grid-template-columns: repeat(4,1fr); }
  .db-charts-row { grid-template-columns: 1fr; }
  .db-bottom-row { grid-template-columns: 1fr; }
}
@media (max-width: 768px) {
  .db-root { padding: 1rem 1rem 2rem; }
  .db-kpi-grid { grid-template-columns: 1fr 1fr; }
  .db-mid-row { grid-template-columns: 1fr; }
  .db-insights-col { grid-column: 1; display: grid; grid-template-columns: repeat(2,1fr); }
  .db-rc-grid { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 480px) {
  .db-kpi-grid { grid-template-columns: 1fr; }
  .db-rc-grid { grid-template-columns: repeat(2,1fr); }
  .db-insights-col { grid-template-columns: 1fr 1fr; }
}
</style>
