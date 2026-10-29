<script setup>
// Dashboard (plan 6.1) in the same layout as the other modules' dashboards (src/views/ModuleDashboard.vue,
// styles shared through module-dashboard.css), filled from GET /dashboard: KPI cards, quote pipeline,
// insights and recent activity, then the role's work widgets and quick actions.
import { computed, onMounted, watchEffect } from "vue";
import { useRouter } from "vue-router";
import { useModuleStore, MODULES } from "@/stores/moduleStore";
import { useDarkModeStore } from "@/stores/darkMode";
import { useLanguageStore } from "@/stores/languageStore";
import PageState from "../components/PageState.vue";
import DeadlineChip from "../components/DeadlineChip.vue";
import StatusBadge from "../components/StatusBadge.vue";
import DevRoleSwitch from "../components/DevRoleSwitch.vue";
import AlertsBell from "../components/AlertsBell.vue";
import { marineMockEnabled } from "../api/mockMode";
import { useDashboard } from "../composables/useDashboard";
import { hasAnyRole, useMarineRoles } from "../composables/useCan";
import { DEADLINE_KINDS, reasonLabel } from "../constants";
import { statusLabel } from "../i18n";
import { formatAge, formatDate, formatDateTime } from "../utils/format";
import { formatAmount, formatMoney } from "../utils/money";

const router = useRouter();
const moduleStore = useModuleStore();
const isDark = computed(() => useDarkModeStore().isDark);
const langStore = useLanguageStore();
const roles = useMarineRoles();
const mod = MODULES.find((m) => m.id === "marine");

const { data, refresh } = useDashboard();
onMounted(refresh);
watchEffect(() => {
  document.title = "Dashboard · Marine & Cargo";
});

const formattedDate = new Date().toLocaleDateString(langStore.currentLanguage === "am" ? "am-ET" : "en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
});

function switchModule() {
  moduleStore.clearModule();
  router.push("/module-select");
}

const compactEtb = (v) => `ETB ${new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(Number(v ?? 0))}`;
const share = (part, whole) => (whole ? Math.round((part / whole) * 100) : 0);
const pct = (v) => (v === null || v === undefined ? "—" : `${v}%`);

const ICONS = {
  money: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
  policy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>`,
  claim: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 002-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>`,
  certificate: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg>`,
  plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:20px;height:20px"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>`,
  queue: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:20px;height:20px"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>`,
  folder: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:20px;height:20px"><path stroke-linecap="round" stroke-linejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/></svg>`,
};

// Same four colours as the Marine entry in ModuleDashboard's kpiConfigs
const kpis = computed(() => {
  const k = data.value?.summary?.kpis;
  if (!k) return [];
  return [
    { key: "premium", label: "Premium written", value: compactEtb(k.premium.value), sub: `${k.premium.boundCount} quotes bound`, trend: k.premium.trendPct, bar: data.value.summary.insights.conversionPct ?? 0, color: "#0284c7", icon: ICONS.money, to: "/marine/policies" },
    { key: "activePolicies", label: "Active policies", value: k.activePolicies.value.toLocaleString("en-US"), sub: `of ${k.activePolicies.of} policies`, bar: share(k.activePolicies.value, k.activePolicies.of), color: "#059669", icon: ICONS.policy, to: "/marine/policies" },
    { key: "openClaims", label: "Open claims", value: k.openClaims.value.toLocaleString("en-US"), sub: `of ${k.openClaims.of} claims`, bar: share(k.openClaims.value, k.openClaims.of), color: "#f59e0b", icon: ICONS.claim, to: "/marine/claims" },
    { key: "validCertificates", label: "Valid certificates", value: k.validCertificates.value.toLocaleString("en-US"), sub: `of ${k.validCertificates.of} certificates`, bar: share(k.validCertificates.value, k.validCertificates.of), color: "#7c3aed", icon: ICONS.certificate, to: "/marine/certificates" },
  ];
});

const PIPELINE_COLORS = { DRAFT: "#94a3b8", QUOTED: "#3b82f6", REFERRED: "#f59e0b", APPROVED: "#10b981", BOUND: "#0d9488", DECLINED: "#e11d48", EXPIRED: "#64748b" };
const pipeline = computed(() => {
  const rows = data.value?.summary?.pipeline ?? [];
  const total = rows.reduce((s, r) => s + r.count, 0);
  return rows.map((r) => ({ ...r, pct: share(r.count, total), color: PIPELINE_COLORS[r.status] }));
});

const insights = computed(() => {
  const i = data.value?.summary?.insights;
  if (!i) return [];
  return [
    { tone: "blue", label: "Quote to bind", value: pct(i.conversionPct), note: "of rated quotes were bound" },
    { tone: "emerald", label: "Average premium", value: i.averagePremium ? compactEtb(i.averagePremium) : "—", note: i.averagePremium ? formatMoney(i.averagePremium) : "No bound quotes yet" },
    { tone: "violet", label: "Referral rate", value: pct(i.referralPct), note: "of rated quotes went to an underwriter" },
    { tone: "amber", label: "Loss ratio", value: pct(i.lossRatioPct), note: "claims paid ÷ premium written" },
  ];
});

const ENTITY = {
  quote: { label: "Quote", color: "#3b82f6", to: (id) => `/marine/quotes/${id}` },
  policy: { label: "Policy", color: "#059669", to: (id) => `/marine/policies/${id}` },
  certificate: { label: "Certificate", color: "#7c3aed", to: (id) => `/marine/certificates/${id}` },
  openCover: { label: "Open cover", color: "#0284c7", to: (id) => `/marine/open-covers/${id}` },
  claim: { label: "Claim", color: "#f59e0b", to: (id) => `/marine/claims/${id}` },
};
const OTHER = { label: "Settings", color: "#64748b", to: null };
const activity = computed(() =>
  (data.value?.summary?.activity ?? []).map((a) => {
    const e = ENTITY[a.entity] ?? { ...OTHER, label: a.entity.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()) };
    return { ...a, label: [e.label, a.number].filter(Boolean).join(" "), color: e.color, to: e.to && a.number ? e.to(a.entityId) : null };
  })
);

const WIDGETS = [
  { key: "myReferrals", title: "My open referrals", all: "/marine/underwriting?assignee=me" },
  { key: "unassignedReferrals", title: "Unassigned referrals", all: "/marine/underwriting?assignee=none" },
  { key: "expiringQuotes", title: "Quotes expiring in 5 days", all: "/marine/quotes?expiring=5" },
  { key: "missingFx", title: "Missing FX rates today", all: "/marine/admin/fx-rates" },
  { key: "lateDeclarations", title: "Late declarations", all: "/marine/open-covers" },
  { key: "deadlines", title: "Deadlines due or overdue", all: "/marine/claims?overdue=true" },
  { key: "recentCertificates", title: "Recent certificates", all: "/marine/certificates" },
  { key: "customersToApprove", title: "Customers to approve", all: "/marine/customers?status=PENDING_APPROVAL" },
  { key: "unpaidPremiums", title: "Premiums to collect", all: "/marine/finance/receivables" },
  { key: "claimPayments", title: "Claim payments to make", all: "/marine/finance/claim-payments" },
  { key: "refundsToPay", title: "Refunds to pay", all: "/marine/finance/refunds?status=UNPAID" },
];
const shown = computed(() => WIDGETS.filter((w) => data.value?.widgets?.[w.key]));

// The first three actions the role may use (same role lists as the routes), then Switch module
const ACTIONS = [
  { label: "Record receipts", sub: "Premium waiting for payment", to: "/marine/finance/receivables", roles: ["FINANCE"], icon: ICONS.money.replace('stroke-width="1.75"', 'stroke-width="2" style="width:20px;height:20px"') },
  { label: "Claim payments", sub: "Pay approved settlements", to: "/marine/finance/claim-payments", roles: ["FINANCE"], icon: ICONS.queue },
  { label: "New quote", sub: "Price a shipment", to: "/marine/quotes/new", roles: ["BROKER", "UNDERWRITER", "SENIOR_UNDERWRITER"], icon: ICONS.plus },
  { label: "Underwriting queue", sub: "Decide referred quotes", to: "/marine/underwriting", roles: ["UNDERWRITER", "SENIOR_UNDERWRITER"], icon: ICONS.queue },
  { label: "Register customer", sub: "Company or individual", to: "/marine/customers/new", roles: ["BROKER", "ADMIN"], icon: ICONS.plus },
  { label: "Register claim", sub: "Report a cargo loss", to: "/marine/claims/new", roles: ["CLAIMS_HANDLER"], icon: ICONS.plus },
  { label: "Claims", sub: "Work open claims", to: "/marine/claims", roles: ["CLAIMS_HANDLER", "CLAIMS_MANAGER"], icon: ICONS.queue },
  { label: "FX rates", sub: "Enter today's rates", to: "/marine/admin/fx-rates", roles: ["FINANCE"], icon: ICONS.money.replace('stroke-width="1.75"', 'stroke-width="2" style="width:20px;height:20px"') },
  { label: "Certificates", sub: "Find and share certificates", to: "/marine/certificates", roles: [], icon: ICONS.folder },
  { label: "Policies", sub: "Browse bound business", to: "/marine/policies", roles: [], icon: ICONS.folder },
];
const actions = computed(() => ACTIONS.filter((a) => hasAnyRole(roles.value, a.roles)).slice(0, 3));
</script>

<template>
  <div class="mdb-root" :class="{ dark: isDark }">
    <!-- ══ TOP BAR ══ -->
    <div class="mdb-topbar marine-topbar">
      <svg class="marine-topbar-waves" viewBox="0 0 520 140" preserveAspectRatio="none" fill="none" aria-hidden="true">
        <path d="M0 96c43 0 65-22 108-22s65 22 108 22 65-22 108-22 65 22 108 22 65-22 88-22v68H0V96Z" fill="currentColor" opacity=".06" />
        <path d="M0 114c43 0 65-18 108-18s65 18 108 18 65-18 108-18 65 18 108 18 65-18 88-18v44H0v-26Z" fill="currentColor" opacity=".08" />
        <path d="M0 78c43 0 65-20 108-20s65 20 108 20 65-20 108-20 65 20 108 20 65-20 88-20" stroke="currentColor" stroke-opacity=".18" stroke-width="1.5" />
      </svg>
      <div class="mdb-topbar-left">
        <div class="mdb-standalone-icon" :style="`color:${mod.color.to}`">
          <span class="mdb-badge-icon" v-html="mod.icon"></span>
        </div>
        <div class="flex flex-col justify-center items-start p-0 m-0 text-left">
          <h1 class="p-0 m-0 text-left mdb-title">{{ langStore.t("modules.marine") }} Dashboard</h1>
          <p class="p-0 text-left mdb-subtitle">{{ langStore.t("realTimeAnalytics", { module: langStore.t("modules.marine") }) }}</p>
        </div>
      </div>
      <div class="mdb-topbar-right" data-print-hide>
        <DevRoleSwitch v-if="marineMockEnabled" />
        <AlertsBell />
        <div class="mdb-date-chip">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px;flex-shrink:0">
            <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
          {{ formattedDate }}
        </div>
        <button class="mdb-lang-btn" :title="langStore.isAmharic ? 'English' : 'አማርኛ'" @click="langStore.toggleLanguage()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px">
            <circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20" />
          </svg>
          {{ langStore.isAmharic ? "English" : "አማርኛ" }}
        </button>
        <button class="mdb-switch-btn" @click="switchModule">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h7" />
          </svg>
          {{ langStore.t("switchModule") }}
        </button>
      </div>
    </div>

    <PageState v-if="!data" kind="loading" />
    <template v-else>
      <!-- ══ KPI CARDS ══ -->
      <div v-if="kpis.length" class="mdb-kpi-grid">
        <RouterLink v-for="(k, i) in kpis" :key="k.key" :to="k.to" class="mdb-kpi-card mdb-kpi-link" :style="`animation-delay:${i * 60}ms`">
          <div class="mdb-kpi-top">
            <div class="mdb-kpi-icon" :style="`background:${k.color}15;color:${k.color};border-color:${k.color}30`" v-html="k.icon"></div>
            <span v-if="k.trend !== null && k.trend !== undefined" class="mdb-kpi-trend" :class="k.trend >= 0 ? 'up' : 'down'" :title="'This month vs last month'">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:11px;height:11px">
                <path stroke-linecap="round" stroke-linejoin="round" :d="k.trend >= 0 ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'" />
              </svg>
              {{ Math.abs(k.trend) }}%
            </span>
          </div>
          <div class="mdb-kpi-val">{{ k.value }}</div>
          <div class="mdb-kpi-label">{{ k.label }}</div>
          <div class="mdb-kpi-sub">{{ k.sub }}</div>
          <div class="mdb-kpi-bar">
            <div class="mdb-kpi-bar-fill" :style="`background:${k.color};width:${k.bar}%`"></div>
          </div>
        </RouterLink>
      </div>

      <!-- ══ MIDDLE ROW ══ -->
      <div v-if="data.summary" class="mdb-mid-row">
        <!-- Quote pipeline -->
        <div class="mdb-card mdb-pipeline">
          <div class="mdb-card-hdr">
            <div>
              <h2 class="mdb-card-title">Quote pipeline</h2>
              <div class="mdb-card-sub">Quotes by status</div>
            </div>
            <span class="mdb-chip mdb-chip-blue">{{ pipeline.reduce((s, p) => s + p.count, 0) }} quotes</span>
          </div>
          <div class="mdb-pipeline-list">
            <div v-for="p in pipeline" :key="p.status" class="mdb-pipeline-row">
              <div class="mdb-pipeline-lbl">
                <div class="mdb-pipeline-dot" :style="`background:${p.color}`"></div>
                <span>{{ statusLabel(p.status) }}</span>
              </div>
              <div class="mdb-pipeline-bar-wrap">
                <div class="mdb-pipeline-track">
                  <div class="mdb-pipeline-fill" :style="`width:${p.pct}%;background:${p.color}`"></div>
                </div>
                <span class="mdb-pipeline-pct">{{ p.count }}</span>
              </div>
            </div>
          </div>
          <RouterLink to="/marine/quotes" class="mdb-view-link">
            View all quotes
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:13px;height:13px"><path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          </RouterLink>
        </div>

        <!-- Insights -->
        <div class="mdb-insights-col">
          <div v-for="i in insights" :key="i.label" class="mdb-insight" :class="`mdb-ins-${i.tone}`">
            <div class="mdb-ins-label">{{ i.label }}</div>
            <div class="mdb-ins-val">{{ i.value }}</div>
            <div class="mdb-ins-note">{{ i.note }}</div>
          </div>
        </div>

        <!-- Activity feed -->
        <div class="mdb-card mdb-activity">
          <div class="mdb-card-hdr">
            <div>
              <h2 class="mdb-card-title">{{ langStore.t("recentActivity") }}</h2>
              <div class="mdb-card-sub">{{ langStore.t("latestEvents") }}</div>
            </div>
            <span class="mdb-live-wrap">
              <span class="mdb-live-dot"></span>
              <span class="mdb-live-txt">{{ langStore.t("live") }}</span>
            </span>
          </div>
          <p v-if="!activity.length" class="mdb-card-sub">No activity yet</p>
          <div class="mdb-activity-list">
            <div v-for="a in activity" :key="a.id" class="mdb-activity-row">
              <div class="mdb-activity-dot" :style="`background:${a.color}20;color:${a.color}`">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div class="mdb-act-body">
                <div class="mdb-act-action">{{ a.action }}</div>
                <div class="mdb-act-entity">
                  <RouterLink v-if="a.to" :to="a.to" class="hover:underline">{{ a.label }}</RouterLink>
                  <span v-else>{{ a.label }}</span>
                  · {{ a.by }}
                </div>
              </div>
              <span class="mdb-act-time" :title="formatDateTime(a.at)">{{ formatAge(a.at) }} ago</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ══ NEEDS YOUR ATTENTION (role widgets) ══ -->
      <div v-if="shown.length" class="mdb-work-grid">
        <section v-for="w in shown" :key="w.key" class="flex flex-col mdb-card" :aria-labelledby="`w-${w.key}`">
          <div class="mdb-card-hdr">
            <div>
              <h2 :id="`w-${w.key}`" class="mdb-card-title">{{ w.title }}</h2>
              <div class="mdb-card-sub">Needs your attention</div>
            </div>
            <span class="mdb-chip mdb-chip-blue tabular-nums">{{ data.widgets[w.key].count }}</span>
          </div>
          <ul class="flex-1 text-sm mdb-work-list">
            <li v-if="!data.widgets[w.key].rows.length" class="mdb-card-sub">None</li>
            <li v-for="(r, i) in data.widgets[w.key].rows" :key="r.id ?? r.currency ?? i" class="mdb-work-row">
              <template v-if="w.key === 'myReferrals' || w.key === 'unassignedReferrals'">
                <RouterLink :to="`/marine/underwriting/${r.id}`" class="mdb-work-link">{{ r.quoteNo }}</RouterLink>
                <span class="mdb-act-entity"> · {{ r.insured?.name }}</span>
                <p class="mdb-act-entity">{{ r.reasonCodes.map(reasonLabel).join(", ") }} · waiting {{ r.waitingHours }} h</p>
              </template>
              <template v-else-if="w.key === 'expiringQuotes'">
                <RouterLink :to="`/marine/quotes/${r.id}`" class="mdb-work-link">{{ r.quoteNo }}</RouterLink>
                <span class="mdb-act-entity"> · {{ r.insured?.name }} · until {{ formatDate(r.validUntil) }}</span>
              </template>
              <template v-else-if="w.key === 'missingFx'">
                <RouterLink :to="w.all" class="mdb-work-link">{{ r.currency }}</RouterLink> <span class="mdb-act-entity">has no rate for today</span>
              </template>
              <template v-else-if="w.key === 'lateDeclarations'">
                <RouterLink :to="`/marine/open-covers/${r.coverId}`" class="mdb-work-link">{{ r.coverNo }}</RouterLink>
                <span class="mdb-act-entity"> · {{ r.insured?.name }} · sailed {{ formatDate(r.sailingDate) }}</span>
              </template>
              <template v-else-if="w.key === 'deadlines'">
                <div class="flex gap-2 justify-between items-center">
                  <span><RouterLink :to="`/marine/claims/${r.claimId}?tab=deadlines`" class="mdb-work-link">{{ r.claimNo }}</RouterLink> <span class="mdb-act-entity">· {{ DEADLINE_KINDS[r.kind] }}</span></span>
                  <DeadlineChip :due-date="r.dueDate" :status="r.status" />
                </div>
              </template>
              <template v-else-if="w.key === 'customersToApprove'">
                <RouterLink :to="`/marine/customers/${r.id}`" class="mdb-work-link">{{ r.name }}</RouterLink>
                <p class="mdb-act-entity">{{ r.customerNo }} · by {{ r.registeredBy }} · {{ formatAge(r.registeredAt) }} ago</p>
              </template>
              <template v-else-if="w.key === 'unpaidPremiums' || w.key === 'refundsToPay'">
                <div class="flex gap-2 justify-between items-center">
                  <span><RouterLink :to="`/marine/finance/notes/${r.id}`" class="mdb-work-link">{{ r.noteNo }}</RouterLink> <span class="mdb-act-entity">· {{ r.customer?.name }}</span></span>
                  <span class="text-sm font-semibold tabular-nums">ETB {{ formatAmount(r.amount) }}</span>
                </div>
              </template>
              <template v-else-if="w.key === 'claimPayments'">
                <div class="flex gap-2 justify-between items-center">
                  <span><span class="mdb-work-link">{{ r.voucherNo }}</span> <span class="mdb-act-entity">· {{ r.claimNo }} · {{ r.payee?.name }}</span></span>
                  <span class="text-sm font-semibold tabular-nums">{{ formatMoney(r.amount, r.currency) }}</span>
                </div>
              </template>
              <template v-else-if="w.key === 'recentCertificates'">
                <div class="flex gap-2 justify-between items-center">
                  <RouterLink :to="`/marine/certificates/${r.id}`" class="mdb-work-link">{{ r.certNo }} v{{ r.version }}</RouterLink>
                  <StatusBadge entity="certificate" :status="r.status" />
                </div>
                <p class="mdb-act-entity">{{ r.issuedAt ? formatDateTime(r.issuedAt) : "Being generated" }}</p>
              </template>
            </li>
          </ul>
          <RouterLink :to="w.all" class="mdb-view-link">
            View all
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:13px;height:13px"><path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          </RouterLink>
        </section>
      </div>

      <!-- ══ QUICK ACTIONS ══ -->
      <div class="mdb-card mdb-qa-section">
        <div class="mdb-card-hdr">
          <div>
            <h2 class="mdb-card-title">{{ langStore.t("quickActions") }}</h2>
            <div class="mdb-card-sub">{{ langStore.t("commonTasks", { module: langStore.t("modules.marine") }) }}</div>
          </div>
          <span class="mdb-chip mdb-chip-blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px;height:12px">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {{ langStore.isAmharic ? "ቀጣይ እርምጃዎች" : "Shortcuts" }}
          </span>
        </div>
        <div class="mdb-qa-grid">
          <RouterLink v-for="a in actions" :key="a.to" :to="a.to" class="mdb-qa-btn" :style="`--qc:${mod.color.to}`">
            <div class="mdb-qa-icon" :style="`background:${mod.color.to}15;color:${mod.color.to};border-color:${mod.color.to}30`" v-html="a.icon"></div>
            <div class="mdb-qa-text">
              <div class="mdb-qa-label">{{ a.label }}</div>
              <div class="mdb-qa-sub">{{ a.sub }}</div>
            </div>
            <div class="mdb-qa-arrow-wrap" :style="`color:${mod.color.to}`">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="mdb-qa-arrow"><path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </div>
          </RouterLink>
          <button class="mdb-qa-btn mdb-qa-switch" @click="switchModule">
            <div class="mdb-qa-icon mdb-qa-icon-switch">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:20px;height:20px"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h7" /></svg>
            </div>
            <div class="mdb-qa-text">
              <div class="mdb-qa-label">{{ langStore.t("actions.switchModuleLabel") }}</div>
              <div class="mdb-qa-sub">{{ langStore.t("actions.goBackSelect") }}</div>
            </div>
            <div class="mdb-qa-arrow-wrap mdb-qa-arrow-switch">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="mdb-qa-arrow"><path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </div>
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped src="@/views/module-dashboard.css"></style>

<style scoped>
.mdb-root {
  font-family: "Rubik", "Inter", system-ui, sans-serif; /* as the other marine pages (theme.css) */
  --theme-color-primary: v-bind("mod.color.to");
  --theme-color-glow: v-bind("mod.color.glow");
  --theme-color-accent: v-bind("mod.color.accent");
  --theme-color-from: v-bind("mod.color.from");
}
/* Top card: the same gradient line and waves as the marine page headers (theme.css .marine-hero) */
.marine-topbar { position: relative; overflow: hidden; }
.marine-topbar > :not(.marine-topbar-waves) { position: relative; }
.marine-topbar::before {
  content: "";
  position: absolute;
  inset: 0 0 auto 0;
  height: 3px;
  background: linear-gradient(90deg, var(--theme-color-from), var(--theme-color-primary) 45%, var(--theme-color-accent));
}
.marine-topbar-waves {
  position: absolute;
  inset: auto 0 0 auto;
  width: 62%;
  height: 72%;
  color: var(--theme-color-primary);
  pointer-events: none;
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 45%);
  mask-image: linear-gradient(90deg, transparent, #000 45%);
}
.mdb-kpi-link { text-decoration: none; }
.mdb-ins-note { font-size: 0.72rem; font-weight: 600; color: var(--mdb-subtitle); }
.mdb-work-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.125rem; align-items: stretch; }
.mdb-work-list { display: flex; flex-direction: column; }
.mdb-work-row { padding: 0.55rem 0; border-bottom: 1px solid var(--mdb-activity-border); }
.mdb-work-row:last-child { border-bottom: none; }
.mdb-work-link { font-weight: 700; color: var(--mdb-act-action); text-decoration: none; }
.mdb-work-link:hover { color: var(--theme-color-primary); }
@media (max-width: 1100px) {
  .mdb-work-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 768px) {
  .mdb-work-grid { grid-template-columns: 1fr; }
}
</style>
