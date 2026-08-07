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
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>`,
    cardStyle: 'bg-blue-50/60 border-blue-200/80 hover:bg-blue-50 hover:border-blue-400 hover:shadow-blue-500/10',
    iconBg: 'bg-white border-blue-200 text-blue-600 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600',
    textAccent: 'text-blue-600',
    titleHover: 'group-hover:text-blue-700',
    fields: 8,
    lastUpdated: "2 days ago",
    badge: "Most Used",
  },
  {
    id: "fire",
    name: "Fire Insurance",
    description: "Set rates for residential, commercial and industrial property against fire and allied perils.",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`,
    cardStyle: 'bg-amber-50/60 border-amber-200/80 hover:bg-amber-50 hover:border-amber-400 hover:shadow-amber-500/10',
    iconBg: 'bg-white border-amber-200 text-amber-600 group-hover:bg-amber-500 group-hover:text-white group-hover:border-amber-500',
    textAccent: 'text-amber-600',
    titleHover: 'group-hover:text-amber-700',
    fields: 7,
    lastUpdated: "1 week ago",
    badge: null,
  },
  {
    id: "health",
    name: "Health Insurance",
    description: "Define premium tables for individual, family and group medical cover.",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`,
    cardStyle: 'bg-emerald-50/60 border-emerald-200/80 hover:bg-emerald-50 hover:border-emerald-400 hover:shadow-emerald-500/10',
    iconBg: 'bg-white border-emerald-200 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600',
    textAccent: 'text-emerald-600',
    titleHover: 'group-hover:text-emerald-700',
    fields: 10,
    lastUpdated: "3 days ago",
    badge: "Updated",
  },
  {
    id: "marine",
    name: "Marine & Cargo",
    description: "Rate configuration for ocean freight, inland transit and hull insurance.",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="3"/><line x1="12" y1="22" x2="12" y2="8"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/></svg>`,
    cardStyle: 'bg-cyan-50/60 border-cyan-200/80 hover:bg-cyan-50 hover:border-cyan-400 hover:shadow-cyan-500/10',
    iconBg: 'bg-white border-cyan-200 text-cyan-600 group-hover:bg-cyan-600 group-hover:text-white group-hover:border-cyan-600',
    textAccent: 'text-cyan-600',
    titleHover: 'group-hover:text-cyan-700',
    fields: 6,
    lastUpdated: "5 days ago",
    badge: null,
  },
  {
    id: "life",
    name: "Life Insurance",
    description: "Configure term life, whole life and endowment premium rate tables by age band.",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>`,
    cardStyle: 'bg-rose-50/60 border-rose-200/80 hover:bg-rose-50 hover:border-rose-400 hover:shadow-rose-500/10',
    iconBg: 'bg-white border-rose-200 text-rose-600 group-hover:bg-rose-500 group-hover:text-white group-hover:border-rose-500',
    textAccent: 'text-rose-600',
    titleHover: 'group-hover:text-rose-700',
    fields: 9,
    lastUpdated: "1 day ago",
    badge: "New",
  },
  {
    id: "engineering",
    name: "Engineering",
    description: "Rates for contractors all risk, erection all risk and machinery breakdown.",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>`,
    cardStyle: 'bg-violet-50/60 border-violet-200/80 hover:bg-violet-50 hover:border-violet-400 hover:shadow-violet-500/10',
    iconBg: 'bg-white border-violet-200 text-violet-600 group-hover:bg-violet-600 group-hover:text-white group-hover:border-violet-600',
    textAccent: 'text-violet-600',
    titleHover: 'group-hover:text-violet-700',
    fields: 8,
    lastUpdated: "2 weeks ago",
    badge: null,
  },
  {
    id: "liability",
    name: "Liability",
    description: "Public liability, employers liability and professional indemnity rate setup.",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h18"/></svg>`,
    cardStyle: 'bg-teal-50/60 border-teal-200/80 hover:bg-teal-50 hover:border-teal-400 hover:shadow-teal-500/10',
    iconBg: 'bg-white border-teal-200 text-teal-700 group-hover:bg-teal-600 group-hover:text-white group-hover:border-teal-600',
    textAccent: 'text-teal-700',
    titleHover: 'group-hover:text-teal-800',
    fields: 5,
    lastUpdated: "4 days ago",
    badge: null,
  },
  {
    id: "burglary",
    name: "Burglary & Theft",
    description: "Configure rates based on security grading, location risk and sum insured.",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>`,
    cardStyle: 'bg-purple-50/60 border-purple-200/80 hover:bg-purple-50 hover:border-purple-400 hover:shadow-purple-500/10',
    iconBg: 'bg-white border-purple-200 text-purple-600 group-hover:bg-purple-600 group-hover:text-white group-hover:border-purple-600',
    textAccent: 'text-purple-600',
    titleHover: 'group-hover:text-purple-700',
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

function getBadgeClass(badge) {
  switch (badge) {
    case 'Most Used': return 'bg-blue-100/90 text-blue-700 border-blue-200';
    case 'Updated': return 'bg-emerald-100/90 text-emerald-700 border-emerald-200';
    case 'New': return 'bg-purple-100/90 text-purple-700 border-purple-200';
    default: return 'bg-slate-100 text-slate-600 border-slate-200';
  }
}
</script>

<template>
  <div class="form-builder-home w-full rounded-2xl border border-slate-200/80 bg-white text-slate-800 p-6 lg:p-8 shadow-sm box-border min-h-full">
    <!-- Header -->
    <div class="w-full mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div class="flex items-center space-x-3 mb-1">
          <div class="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 shadow-sm">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
          <div>
            <h1 class="text-xl font-bold tracking-tight text-slate-900">Rate Configuration</h1>
            <p class="text-xs text-slate-500">Select an insurance type to configure premium rates and risk factors</p>
          </div>
        </div>
      </div>

      <div class="flex items-center space-x-4 bg-slate-50 border border-slate-200/80 px-4 py-2 rounded-xl">
        <div class="text-center">
          <span class="block text-base font-bold text-slate-900 leading-none">{{ insuranceTypes.length }}</span>
          <span class="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Products</span>
        </div>
        <div class="w-px h-6 bg-slate-200"></div>
        <div class="text-center">
          <span class="block text-xs font-bold text-emerald-600 leading-none">Active</span>
          <span class="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">All Rates Live</span>
        </div>
      </div>
    </div>

    <!-- Search & Filter bar -->
    <div class="w-full flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
      <div class="relative flex-1 max-w-md">
        <svg class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          v-model="search"
          type="text"
          placeholder="Search insurance products…"
          class="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all bg-slate-50/50"
        />
      </div>

      <div class="flex items-center gap-1.5 flex-wrap">
        <button
          v-for="f in filters"
          :key="f"
          @click="activeFilter = f"
          class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border capitalize"
          :class="activeFilter === f ? 'bg-blue-600 text-white border-blue-600 shadow-xs' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'"
        >
          {{ f === 'all' ? 'All Products' : f }}
        </button>
      </div>
    </div>

    <!-- Product Grid -->
    <div class="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 box-border" v-if="filteredTypes.length">
      <div
        v-for="type in filteredTypes"
        :key="type.id"
        @click="openType(type)"
        class="product-card group relative p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer flex flex-col justify-between"
        :class="type.cardStyle"
      >
        <div>
          <div class="flex items-center justify-between mb-4">
            <div
              class="w-12 h-12 rounded-xl border flex items-center justify-center transition-all duration-300 shadow-xs group-hover:scale-105"
              :class="type.iconBg"
              v-html="type.icon"
            ></div>
            <div class="flex items-center space-x-1.5">
              <span
                v-if="type.badge"
                class="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border shadow-2xs"
                :class="getBadgeClass(type.badge)"
              >
                {{ type.badge }}
              </span>
              <span
                class="text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full border border-slate-200/80 bg-white/80 text-slate-500 shadow-2xs"
              >
                {{ type.fields }} factors
              </span>
            </div>
          </div>

          <h3 class="text-base font-bold text-slate-900 transition-colors" :class="type.titleHover">{{ type.name }}</h3>
          <p class="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">{{ type.description }}</p>
        </div>

        <div class="mt-6 pt-4 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
          <span class="text-[11px] text-slate-400 font-mono font-medium">Updated {{ type.lastUpdated }}</span>
          <div class="flex items-center space-x-1.5 font-bold transition-transform group-hover:translate-x-1" :class="type.textAccent">
            <span>Configure</span>
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="!filteredTypes.length" class="py-16 text-center flex flex-col items-center justify-center">
      <svg class="w-12 h-12 text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <p class="text-sm font-medium text-slate-500 mb-3">No products match your search.</p>
      <button @click="search='';activeFilter='all'" class="px-4 py-2 rounded-xl bg-blue-50 text-blue-600 text-xs font-bold hover:bg-blue-100 transition-colors cursor-pointer border border-blue-200">
        Clear filters
      </button>
    </div>
  </div>
</template>
