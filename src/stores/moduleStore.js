import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const MODULES = [
  {
    id: 'motor',
    name: 'Motor Insurance',
    description: 'Configure premium rates for private cars, commercial vehicles, motorcycles and fleet.',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M5 17H3a2 2 0 01-2-2v-4l2.5-5h13l2.5 5v4a2 2 0 01-2 2h-2"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="16.5" cy="17.5" r="2.5"/><path stroke-linecap="round" stroke-linejoin="round" d="M7.5 15h9"/></svg>`,
    color: { from: '#1e3a8a', to: '#2563eb', accent: '#60a5fa', glow: 'rgba(37,99,235,0.4)' },
    badge: 'Most Used',
    dashboardPath: '/motor/dashboard',
  },
  {
    id: 'health',
    name: 'Health Insurance',
    description: 'Define premium tables for individual, family and group medical cover.',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`,
    color: { from: '#064e3b', to: '#059669', accent: '#34d399', glow: 'rgba(5,150,105,0.4)' },
    badge: 'Active',
    dashboardPath: '/dashboard',
  },
  {
    id: 'fire',
    name: 'Fire Insurance',
    description: 'Set rates for residential, commercial and industrial property against fire and allied perils.',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M12 2c0 0-5 4-5 9a5 5 0 0010 0c0-5-5-9-5-9z"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 12c0 0-2 1.5-2 3a2 2 0 004 0c0-1.5-2-3-2-3z"/></svg>`,
    color: { from: '#7c2d12', to: '#ea580c', accent: '#fb923c', glow: 'rgba(234,88,12,0.4)' },
    badge: null,
    dashboardPath: '/fire/dashboard',
  },
  {
    id: 'marine',
    name: 'Marine & Cargo',
    description: 'Cargo proposals, commodity × conveyance rates, and Institute Cargo Clauses.',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M2 20l4-12h12l4 12H2z"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 8V4"/><path stroke-linecap="round" stroke-linejoin="round" d="M8 20c0-2 1.5-4 4-4s4 2 4 4"/></svg>`,
    color: { from: '#0c4a6e', to: '#0284c7', accent: '#38bdf8', glow: 'rgba(2,132,199,0.4)' },
    badge: null,
    dashboardPath: '/marine/dashboard',
  },
  {
    id: 'life',
    name: 'Life Insurance',
    description: 'Configure term life, whole life and endowment premium rate tables by age band.',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>`,
    color: { from: '#4c1d95', to: '#7c3aed', accent: '#a78bfa', glow: 'rgba(124,58,237,0.4)' },
    badge: 'New',
    dashboardPath: '/life/dashboard',
  },
  {
    id: 'engineering',
    name: 'Engineering',
    description: 'Rates for contractors all risk, erection all risk and machinery breakdown.',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>`,
    color: { from: '#78350f', to: '#d97706', accent: '#fbbf24', glow: 'rgba(217,119,6,0.4)' },
    badge: null,
    dashboardPath: '/engineering/dashboard',
  },
  {
    id: 'liability',
    name: 'Liability',
    description: 'Public liability, employers liability and professional indemnity rate setup.',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
    color: { from: '#881337', to: '#e11d48', accent: '#fb7185', glow: 'rgba(225,29,72,0.4)' },
    badge: null,
    dashboardPath: '/liability/dashboard',
  },
  {
    id: 'burglary',
    name: 'Burglary & Theft',
    description: 'Configure rates based on security grading, location risk and sum insured.',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><rect x="3" y="11" width="18" height="11" rx="2"/><path stroke-linecap="round" stroke-linejoin="round" d="M7 11V7a5 5 0 0110 0v4"/></svg>`,
    color: { from: '#134e4a', to: '#0d9488', accent: '#2dd4bf', glow: 'rgba(13,148,136,0.4)' },
    badge: null,
    dashboardPath: '/burglary/dashboard',
  },
  {
    id: 'administration',
    name: 'User Management',
    description: 'Manage users, roles and privileges for the modules you administer.',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="3"/><path stroke-linecap="round" stroke-linejoin="round" d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>`,
    color: { from: '#1e293b', to: '#475569', accent: '#94a3b8', glow: 'rgba(71,85,105,0.4)' },
    badge: 'Admin',
    dashboardPath: '/users',
    superAdminOnly: true,
  },
];

export const ADMIN_MODULE_ID = 'administration';

export const useModuleStore = defineStore('module', () => {
  const activeModuleId = ref(localStorage.getItem('activeModule') || null);

  const activeModule = computed(() =>
    MODULES.find(m => m.id === activeModuleId.value) || null
  );

  function selectModule(id) {
    activeModuleId.value = id;
    localStorage.setItem('activeModule', id);
  }

  function clearModule() {
    activeModuleId.value = null;
    localStorage.removeItem('activeModule');
  }

  return { activeModuleId, activeModule, selectModule, clearModule };
});
