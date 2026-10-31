<template>
  <div class="form-builder-home w-full rounded-2xl border border-line/80 bg-white text-ink p-6 lg:p-8 shadow-sm box-border">
    <!-- Header -->
    <div class="w-full mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div class="flex items-center space-x-3 mb-1">
          <div class="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 shadow-sm">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div>
            <h1 class="text-xl font-bold tracking-tight text-ink">Proposal Form Builder</h1>
            <p class="text-xs text-ink-subtle">Visually configure mobile proposal questionnaires for all insurance products</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Product Grid -->
    <div class="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 box-border">
      <div
        v-for="prod in products"
        :key="prod.id"
        @click="openEditor(prod)"
        class="product-card group relative p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer flex flex-col justify-between"
        :class="prod.cardStyle"
      >
        <div>
          <div class="flex items-center justify-between mb-4">
            <div
              class="w-12 h-12 rounded-xl border flex items-center justify-center transition-all duration-300 shadow-xs group-hover:scale-105"
              :class="prod.iconBg"
              v-html="prod.iconSvg"
            >
            </div>
            <span
              class="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border shadow-2xs"
              :class="getStatusBadgeClass(prod.status)"
            >
              {{ prod.status || 'Active' }}
            </span>
          </div>

          <h3 class="text-base font-bold text-ink transition-colors" :class="prod.titleHover">{{ prod.name }}</h3>
          <p class="text-xs text-ink-muted mt-2 line-clamp-2 leading-relaxed">{{ prod.description }}</p>
        </div>

        <div class="mt-6 pt-4 border-t border-line/60 flex items-center justify-between text-xs text-ink-subtle">
          <span class="text-[11px] text-ink-subtle font-mono font-medium">Form v{{ prod.version || '1.0' }}</span>
          <div class="flex items-center space-x-1.5 font-bold transition-transform group-hover:translate-x-1" :class="prod.textAccent">
            <span>Configure</span>
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const products = [
  {
    id: 'motor',
    name: 'Motor Insurance',
    description: 'Comprehensive & Third-Party vehicle cover proposal forms',
    iconSvg: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>`,
    status: 'Published',
    version: '1.2',
    cardStyle: 'bg-blue-50/60 border-blue-200/80 hover:bg-blue-50 hover:border-blue-400 hover:shadow-blue-500/10',
    iconBg: 'bg-white border-blue-200 text-blue-600 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600',
    textAccent: 'text-blue-600',
    titleHover: 'group-hover:text-blue-700',
  },
  {
    id: 'fire',
    name: 'Fire & Allied Perils',
    description: 'Property & Industrial fire protection proposals',
    iconSvg: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`,
    status: 'Published',
    version: '1.0',
    cardStyle: 'bg-amber-50/60 border-amber-200/80 hover:bg-amber-50 hover:border-amber-400 hover:shadow-amber-500/10',
    iconBg: 'bg-white border-amber-200 text-amber-600 group-hover:bg-amber-500 group-hover:text-white group-hover:border-amber-500',
    textAccent: 'text-amber-600',
    titleHover: 'group-hover:text-amber-700',
  },
  {
    id: 'health',
    name: 'Health & Medical',
    description: 'Individual & Family health policy proposal questionnaires',
    iconSvg: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6v12M6 12h12"/></svg>`,
    status: 'Draft',
    version: '2.1',
    cardStyle: 'bg-emerald-50/60 border-emerald-200/80 hover:bg-emerald-50 hover:border-emerald-400 hover:shadow-emerald-500/10',
    iconBg: 'bg-white border-emerald-200 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600',
    textAccent: 'text-emerald-600',
    titleHover: 'group-hover:text-emerald-700',
  },
  {
    id: 'marine',
    name: 'Marine & Cargo',
    description: 'Single-shipment cargo proposal: goods, voyage, and sums insured',
    iconSvg: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="3"/><line x1="12" y1="22" x2="12" y2="8"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/></svg>`,
    status: 'Published',
    version: '1.0',
    cardStyle: 'bg-cyan-50/60 border-cyan-200/80 hover:bg-cyan-50 hover:border-cyan-400 hover:shadow-cyan-500/10',
    iconBg: 'bg-white border-cyan-200 text-cyan-600 group-hover:bg-cyan-600 group-hover:text-white group-hover:border-cyan-600',
    textAccent: 'text-cyan-600',
    titleHover: 'group-hover:text-cyan-700',
  },
  {
    id: 'life',
    name: 'Life Insurance',
    description: 'Term life & endowment policy proposal forms',
    iconSvg: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
    status: 'Active',
    version: '1.0',
    cardStyle: 'bg-rose-50/60 border-rose-200/80 hover:bg-rose-50 hover:border-rose-400 hover:shadow-rose-500/10',
    iconBg: 'bg-white border-rose-200 text-rose-600 group-hover:bg-rose-500 group-hover:text-white group-hover:border-rose-500',
    textAccent: 'text-rose-600',
    titleHover: 'group-hover:text-rose-700',
  },
  {
    id: 'engineering',
    name: 'Engineering',
    description: 'Contractors All Risk & Machinery Breakdown forms',
    iconSvg: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 22h20M8 22V11l4-5 4 5v11M12 6V2"/></svg>`,
    status: 'Active',
    version: '1.0',
    cardStyle: 'bg-violet-50/60 border-violet-200/80 hover:bg-violet-50 hover:border-violet-400 hover:shadow-violet-500/10',
    iconBg: 'bg-white border-violet-200 text-violet-600 group-hover:bg-violet-600 group-hover:text-white group-hover:border-violet-600',
    textAccent: 'text-violet-600',
    titleHover: 'group-hover:text-violet-700',
  },
  {
    id: 'liability',
    name: 'Liability',
    description: 'Public, product, employers and professional indemnity proposal forms',
    iconSvg: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h18"/></svg>`,
    status: 'Published',
    version: '1.0',
    cardStyle: 'bg-teal-50/60 border-teal-200/80 hover:bg-teal-50 hover:border-teal-400 hover:shadow-teal-500/10',
    iconBg: 'bg-white border-teal-200 text-teal-700 group-hover:bg-teal-600 group-hover:text-white group-hover:border-teal-600',
    textAccent: 'text-teal-700',
    titleHover: 'group-hover:text-teal-800',
  },
  {
    id: 'burglary',
    name: 'Burglary & Theft',
    description: 'Commercial & residential theft protection forms',
    iconSvg: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
    status: 'Published',
    version: '1.1',
    cardStyle: 'bg-purple-50/60 border-purple-200/80 hover:bg-purple-50 hover:border-purple-400 hover:shadow-purple-500/10',
    iconBg: 'bg-white border-purple-200 text-purple-600 group-hover:bg-purple-600 group-hover:text-white group-hover:border-purple-600',
    textAccent: 'text-purple-600',
    titleHover: 'group-hover:text-purple-700',
  },
];

function openEditor(prod) {
  router.push(`/form-builder/${prod.id}`);
}

function getStatusBadgeClass(status) {
  switch (status) {
    case 'Published': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Draft': return 'bg-amber-50 text-amber-700 border-amber-200';
    default: return 'bg-slate-100 text-slate-600 border-slate-200';
  }
}
</script>


