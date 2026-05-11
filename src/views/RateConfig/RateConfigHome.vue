<script setup>
import { useRouter } from "vue-router";
import { ref, computed } from "vue";

const router = useRouter();
const search = ref("");
const activeFilter = ref("all");
const filters = ["all", "Most Used", "Updated", "New"];

const insuranceTypes = [
  {
    id: "motor",
    name: "Motor Insurance",
    description: "Configure premium rates for private cars, commercial vehicles, motorcycles and fleet.",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17H3a2 2 0 01-2-2v-4l2.5-5h13l2.5 5v4a2 2 0 01-2 2h-2"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="16.5" cy="17.5" r="2.5"/><path d="M7.5 15h9"/></svg>`,
    color: { from: "#1e3a8a", to: "#2563eb", accent: "#60a5fa", glow: "rgba(37,99,235,0.35)" },
    fields: 8,
    lastUpdated: "2 days ago",
    badge: "Most Used",
  },
  {
    id: "fire",
    name: "Fire Insurance",
    description: "Set rates for residential, commercial and industrial property against fire and allied perils.",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2c0 0-5 4-5 9a5 5 0 0010 0c0-5-5-9-5-9z"/><path d="M12 12c0 0-2 1.5-2 3a2 2 0 004 0c0-1.5-2-3-2-3z"/></svg>`,
    color: { from: "#7c2d12", to: "#ea580c", accent: "#fb923c", glow: "rgba(234,88,12,0.35)" },
    fields: 7,
    lastUpdated: "1 week ago",
    badge: null,
  },
  {
    id: "health",
    name: "Health Insurance",
    description: "Define premium tables for individual, family and group medical cover.",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`,
    color: { from: "#064e3b", to: "#059669", accent: "#34d399", glow: "rgba(5,150,105,0.35)" },
    fields: 10,
    lastUpdated: "3 days ago",
    badge: "Updated",
  },
  {
    id: "marine",
    name: "Marine & Cargo",
    description: "Rate configuration for ocean freight, inland transit and hull insurance.",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20l4-12h12l4 12H2z"/><path d="M12 8V4"/><path d="M8 20c0-2 1.5-4 4-4s4 2 4 4"/></svg>`,
    color: { from: "#0c4a6e", to: "#0284c7", accent: "#38bdf8", glow: "rgba(2,132,199,0.35)" },
    fields: 6,
    lastUpdated: "5 days ago",
    badge: null,
  },
  {
    id: "life",
    name: "Life Insurance",
    description: "Configure term life, whole life and endowment premium rate tables by age band.",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>`,
    color: { from: "#4c1d95", to: "#7c3aed", accent: "#a78bfa", glow: "rgba(124,58,237,0.35)" },
    fields: 9,
    lastUpdated: "1 day ago",
    badge: "New",
  },
  {
    id: "engineering",
    name: "Engineering",
    description: "Rates for contractors all risk, erection all risk and machinery breakdown.",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>`,
    color: { from: "#78350f", to: "#d97706", accent: "#fbbf24", glow: "rgba(217,119,6,0.35)" },
    fields: 8,
    lastUpdated: "2 weeks ago",
    badge: null,
  },
  {
    id: "liability",
    name: "Liability",
    description: "Public liability, employers liability and professional indemnity rate setup.",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
    color: { from: "#881337", to: "#e11d48", accent: "#fb7185", glow: "rgba(225,29,72,0.35)" },
    fields: 5,
    lastUpdated: "4 days ago",
    badge: null,
  },
  {
    id: "burglary",
    name: "Burglary & Theft",
    description: "Configure rates based on security grading, location risk and sum insured.",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>`,
    color: { from: "#134e4a", to: "#0d9488", accent: "#2dd4bf", glow: "rgba(13,148,136,0.35)" },
    fields: 6,
    lastUpdated: "1 week ago",
    badge: null,
  },
];

const filteredTypes = computed(() => {
  let list = insuranceTypes;
  if (activeFilter.value !== 'all') {
    list = list.filter(t => t.badge === activeFilter.value);
  }
  if (search.value.trim()) {
    const q = search.value.toLowerCase();
    list = list.filter(t => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
  }
  return list;
});

function openType(type) {
  router.push(`/rate-config/${type.id}`);
}
</script>

<template>
  <div class="rc-root">
    <!-- Header -->
    <div class="rc-header">
      <div class="rc-header-left">
        <div class="rc-header-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </div>
        <div>
          <h1 class="rc-title">Rate Configuration</h1>
          <p class="rc-subtitle">Select an insurance type to configure premium rates and risk factors</p>
        </div>
      </div>
      <div class="rc-header-stats">
        <div class="rc-stat">
          <span class="rc-stat-value">{{ insuranceTypes.length }}</span>
          <span class="rc-stat-label">Products</span>
        </div>
        <div class="rc-stat-divider"></div>
        <div class="rc-stat">
          <span class="rc-stat-value rc-stat-green">Active</span>
          <span class="rc-stat-label">All rates live</span>
        </div>
      </div>
    </div>

    <!-- Search & Filter bar -->
    <div class="rc-toolbar">
      <div class="rc-search-wrap">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="rc-search-icon">
          <circle cx="11" cy="11" r="8"/><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35"/>
        </svg>
        <input v-model="search" type="text" placeholder="Search insurance products…" class="rc-search-input" />
      </div>
      <div class="rc-filters">
        <button
          v-for="f in filters" :key="f"
          class="rc-filter-btn"
          :class="{ active: activeFilter === f }"
          @click="activeFilter = f"
        >
          {{ f === 'all' ? 'All Products' : f }}
        </button>
      </div>
    </div>

    <!-- Grid -->
    <div class="rc-grid" v-if="filteredTypes.length">
      <div
        v-for="(type, idx) in filteredTypes"
        :key="type.id"
        class="rc-card"
        :style="`--from:${type.color.from};--to:${type.color.to};--accent:${type.color.accent};--glow:${type.color.glow};animation-delay:${idx * 45}ms`"
        @click="openType(type)"
      >
        <!-- Shine -->
        <div class="rc-card-shine"></div>

        <!-- Badge -->
        <div v-if="type.badge" class="rc-badge">{{ type.badge }}</div>

        <!-- Icon area -->
        <div class="rc-card-top">
          <div class="rc-icon-wrap" v-html="type.icon"></div>
          <div class="rc-card-meta">
            <span class="rc-fields-count">{{ type.fields }} factors</span>
          </div>
        </div>

        <!-- Content -->
        <div class="rc-card-body">
          <h3 class="rc-card-title">{{ type.name }}</h3>
          <p class="rc-card-desc">{{ type.description }}</p>
        </div>

        <!-- Footer -->
        <div class="rc-card-footer">
          <span class="rc-updated">Updated {{ type.lastUpdated }}</span>
          <div class="rc-open-btn">
            Configure
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="rc-arrow"><path d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="!filteredTypes.length" class="rc-empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:48px;height:48px;color:#cbd5e1">
        <circle cx="11" cy="11" r="8"/><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35"/>
      </svg>
      <p>No products match your search.</p>
      <button @click="search='';activeFilter='all'" class="rc-empty-reset">Clear filters</button>
    </div>
  </div>
</template>

<style scoped>
.rc-root {
  min-height: 100%;
  background: #f8fafc;
  padding: 1.5rem 1.75rem 3rem;
}

/* ── Header ── */
.rc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1.5rem 1.75rem;
  background: #ffffff;
  border-radius: 1rem;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.rc-header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.rc-header-icon {
  width: 3rem; height: 3rem;
  border-radius: 0.75rem;
  background: linear-gradient(135deg, #1e3a8a, #2563eb);
  display: flex; align-items: center; justify-content: center;
  color: #fff;
  box-shadow: 0 4px 14px rgba(37,99,235,0.3);
  flex-shrink: 0;
}
.rc-title {
  font-size: 1.25rem; font-weight: 800;
  color: #0f172a; line-height: 1.2;
  letter-spacing: -0.02em;
}
.rc-subtitle {
  font-size: 0.8125rem; color: #64748b;
  margin-top: 0.2rem;
}
.rc-header-stats {
  display: flex; align-items: center; gap: 1rem;
}
.rc-stat { text-align: center; }
.rc-stat-value {
  display: block; font-size: 1.375rem; font-weight: 800;
  color: #0f172a; line-height: 1;
}
.rc-stat-green { color: #059669 !important; font-size: 0.875rem !important; }
.rc-stat-label {
  display: block; font-size: 0.6875rem; color: #94a3b8;
  text-transform: uppercase; letter-spacing: 0.08em; margin-top: 0.2rem;
}
.rc-stat-divider {
  width: 1px; height: 2rem; background: #e2e8f0;
}

/* ── Grid ── */
.rc-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1.125rem;
}

/* ── Card ── */
.rc-card {
  position: relative;
  border-radius: 1.125rem;
  overflow: hidden;
  background: linear-gradient(145deg, var(--from), var(--to));
  cursor: pointer;
  display: flex;
  flex-direction: column;
  transition: transform 0.22s cubic-bezier(0.34,1.4,0.64,1),
              box-shadow 0.22s ease;
  animation: cardIn 0.5s cubic-bezier(0.34,1.2,0.64,1) both;
  box-shadow: 0 2px 12px rgba(0,0,0,0.12);
}
@keyframes cardIn {
  from { opacity: 0; transform: translateY(20px) scale(0.96); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
.rc-card:hover {
  transform: translateY(-6px) scale(1.02);
  box-shadow: 0 20px 50px var(--glow), 0 4px 16px rgba(0,0,0,0.15);
}

.rc-card-shine {
  position: absolute; inset: 0;
  background: radial-gradient(ellipse at 20% 10%, rgba(255,255,255,0.2) 0%, transparent 55%);
  pointer-events: none;
}

/* badge */
.rc-badge {
  position: absolute; top: 0.75rem; right: 0.75rem;
  font-size: 0.6rem; font-weight: 800;
  text-transform: uppercase; letter-spacing: 0.1em;
  padding: 0.2rem 0.55rem;
  border-radius: 9999px;
  background: rgba(255,255,255,0.2);
  border: 1px solid rgba(255,255,255,0.3);
  color: #fff;
  backdrop-filter: blur(4px);
}

/* card top */
.rc-card-top {
  display: flex; align-items: flex-start;
  justify-content: space-between;
  padding: 1.25rem 1.25rem 0;
}
.rc-icon-wrap {
  width: 3rem; height: 3rem;
  border-radius: 0.875rem;
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.2);
  display: flex; align-items: center; justify-content: center;
  color: #fff;
  backdrop-filter: blur(4px);
  flex-shrink: 0;
}
.rc-icon-wrap :deep(svg) { width: 1.5rem; height: 1.5rem; }
.rc-fields-count {
  font-size: 0.65rem; font-weight: 700;
  color: rgba(255,255,255,0.6);
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 9999px;
  padding: 0.2rem 0.6rem;
}

/* card body */
.rc-card-body {
  padding: 0.875rem 1.25rem 0.75rem;
  flex: 1;
}
.rc-card-title {
  font-size: 1.0625rem; font-weight: 800;
  color: #fff; margin-bottom: 0.4rem;
  line-height: 1.25; letter-spacing: -0.01em;
}
.rc-card-desc {
  font-size: 0.775rem; color: rgba(255,255,255,0.65);
  line-height: 1.55;
}

/* card footer */
.rc-card-footer {
  display: flex; align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.25rem;
  border-top: 1px solid rgba(255,255,255,0.1);
  background: rgba(0,0,0,0.1);
  transition: background 0.15s;
}
.rc-card:hover .rc-card-footer { background: rgba(0,0,0,0.2); }
.rc-updated {
  font-size: 0.6875rem; color: rgba(255,255,255,0.45);
}
.rc-open-btn {
  display: flex; align-items: center; gap: 0.3rem;
  font-size: 0.75rem; font-weight: 700;
  color: #fff;
  transition: gap 0.15s;
}
.rc-card:hover .rc-open-btn { gap: 0.5rem; }
.rc-arrow {
  width: 0.875rem; height: 0.875rem;
  transition: transform 0.15s;
}
.rc-card:hover .rc-arrow { transform: translateX(3px); }

/* ── Toolbar ── */
.rc-toolbar {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1.25rem;
}
.rc-search-wrap {
  display: flex; align-items: center; gap: 0.5rem;
  background: #fff; border: 1px solid #e2e8f0;
  border-radius: 10px; padding: 0 0.875rem;
  height: 2.5rem; flex: 1; min-width: 200px;
  max-width: 380px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  transition: border-color 0.15s, box-shadow 0.15s;
}
.rc-search-wrap:focus-within {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37,99,235,0.08);
}
.rc-search-icon { width: 15px; height: 15px; color: #94a3b8; flex-shrink: 0; }
.rc-search-input {
  flex: 1; border: none; outline: none; background: transparent;
  font-size: 0.875rem; color: #0f172a;
}
.rc-search-input::placeholder { color: #94a3b8; }
.rc-filters { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
.rc-filter-btn {
  padding: 0.375rem 0.875rem;
  border-radius: 8px; border: 1.5px solid #e2e8f0;
  background: #fff; font-size: 0.775rem; font-weight: 600;
  color: #64748b; cursor: pointer;
  transition: all 0.15s;
  text-transform: capitalize;
}
.rc-filter-btn:hover { border-color: #2563eb; color: #2563eb; background: #eff6ff; }
.rc-filter-btn.active { background: #2563eb; border-color: #2563eb; color: #fff; }

/* ── Empty state ── */
.rc-empty {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 0.75rem;
  padding: 4rem 2rem; text-align: center;
}
.rc-empty p { font-size: 0.9rem; color: #94a3b8; font-weight: 500; }
.rc-empty-reset {
  padding: 0.5rem 1.25rem; border-radius: 8px;
  background: #eff6ff; color: #2563eb;
  border: none; font-size: 0.825rem; font-weight: 700;
  cursor: pointer; transition: background 0.15s;
}
.rc-empty-reset:hover { background: #dbeafe; }

@media (max-width: 640px) {
  .rc-root { padding: 1rem 1rem 2rem; }
  .rc-grid { grid-template-columns: 1fr 1fr; gap: 0.75rem; }
  .rc-header { flex-direction: column; align-items: flex-start; }
  .rc-toolbar { flex-direction: column; align-items: stretch; }
  .rc-search-wrap { max-width: 100%; }
}
@media (max-width: 420px) {
  .rc-grid { grid-template-columns: 1fr; }
}
</style>
