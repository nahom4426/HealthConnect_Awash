import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { isExactSuperAdmin } from '@/utils/roleAccess';

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

/** Sidebar id for a no-code product's screens, e.g. "product:PET_CARE". */
export const PRODUCT_MODULE_PREFIX = 'product:';

export const PRODUCT_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M21 8l-9-5-9 5 9 5 9-5z"/><path stroke-linecap="round" stroke-linejoin="round" d="M3 8v8l9 5 9-5V8"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 13v8"/></svg>`;

export const CATALOGUE_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><path stroke-linecap="round" d="M17.5 14v7M14 17.5h7"/></svg>`;

const PRODUCT_SERVICE = 'property-casualty';

function strip(privilege) {
  return String(privilege ?? '').replace(/^ROLE_/, '');
}

/**
 * Registry entries come from AuthService (GET /modules/me). The launcher, sidebar, and
 * per-module button gating read them here; the static MODULES list above only supplies the
 * icon, colours, and dashboard of modules that have coded screens.
 */
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

  // ── Module registry (GET /modules/me) ──
  const registry = ref([]);
  // idle | loading | ready | error | unavailable (server has no registry endpoint yet)
  const registryStatus = ref('idle');
  const registryError = ref('');
  let registryRequest = null;

  // Product definitions, to map a module key to its product key (privilegeModule may differ)
  const definitions = ref([]);
  let definitionsRequest = null;

  const registryByKey = computed(() => {
    const map = {};
    for (const entry of registry.value) map[entry.key] = entry;
    return map;
  });

  async function loadRegistry({ force = false } = {}) {
    if (registryRequest) return registryRequest;
    if (!force && registryStatus.value === 'ready') return registry.value;
    registryStatus.value = 'loading';
    registryError.value = '';
    registryRequest = (async () => {
      try {
        const { fetchMyModules } = await import('@/features/products/api/modulesApi');
        const list = await fetchMyModules();
        registry.value = (Array.isArray(list) ? list : [])
          .slice()
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        registryStatus.value = 'ready';
      } catch (e) {
        registryError.value = e?.message || 'Could not load your modules';
        registryStatus.value = e?.status === 404 ? 'unavailable' : 'error';
      } finally {
        registryRequest = null;
      }
      return registry.value;
    })();
    return registryRequest;
  }

  async function loadDefinitions({ force = false } = {}) {
    if (definitionsRequest) return definitionsRequest;
    if (!force && definitions.value.length) return definitions.value;
    definitionsRequest = (async () => {
      try {
        const { listDefinitions } = await import('@/features/products/api/productsApi');
        const list = await listDefinitions({ includeRetired: true });
        definitions.value = Array.isArray(list) ? list : list?.content || [];
      } catch {
        // Needs product.read; without it the key fallback below is used
      } finally {
        definitionsRequest = null;
      }
      return definitions.value;
    })();
    return definitionsRequest;
  }

  function resetRegistry() {
    registry.value = [];
    definitions.value = [];
    registryStatus.value = 'idle';
  }

  /** Product key (PET_CARE) for a module key (pet_care). */
  function productClassFor(moduleKey) {
    const match = definitions.value.find((d) => d.privilegeModule === moduleKey);
    return match?.key || String(moduleKey || '').toUpperCase();
  }

  /** Privilege module (pet_care) for a product key (PET_CARE). */
  function privilegeModuleFor(productClass) {
    const match = definitions.value.find((d) => d.key === productClass);
    return match?.privilegeModule || String(productClass || '').toLowerCase();
  }

  function definitionFor(productClass) {
    return definitions.value.find((d) => d.key === productClass) || null;
  }

  function currentUser() {
    try {
      const stored = JSON.parse(localStorage.getItem('userDetail') || 'null');
      return stored?.user ?? stored ?? {};
    } catch {
      return {};
    }
  }

  function isSuperAdmin() {
    return isExactSuperAdmin(currentUser());
  }

  /**
   * True when the user holds `{moduleKey}.{action}` (e.g. "pet_care", "proposal.create").
   * Without a registry on the server, controls stay visible and the backend's 403 decides.
   */
  function can(moduleKey, action) {
    if (isSuperAdmin()) return true;
    if (registryStatus.value === 'unavailable') return true;
    const entry = registryByKey.value[moduleKey];
    if (!entry) return false;
    const wanted = `${moduleKey}.${action}`;
    return (entry.privileges || []).some((p) => strip(p) === wanted);
  }

  /** True when the user holds this privilege suffix (".product.read") in any module. */
  function canAnywhere(suffix) {
    if (isSuperAdmin()) return true;
    return registry.value.some((entry) => (entry.privileges || []).some((p) => strip(p).endsWith(suffix)));
  }

  function isModuleAdmin(moduleKey) {
    if (isSuperAdmin()) return true;
    return registryByKey.value[moduleKey]?.admin === true;
  }

  const adminModuleKeys = computed(() => registry.value.filter((e) => e.admin === true).map((e) => e.key));

  /** Launcher tile for one registry entry: coded screens, generic product screens, or a placeholder. */
  function present(entry) {
    const coded = MODULES.find((m) => m.id === entry.key && m.id !== ADMIN_MODULE_ID);
    const base = {
      id: entry.key,
      name: entry.name || entry.key,
      description: entry.description || '',
      roleName: entry.roleName || '',
      admin: entry.admin === true,
      serviceId: entry.serviceId,
    };
    if (coded) {
      return { ...coded, ...base, description: base.description || coded.description, kind: 'coded' };
    }
    if (entry.serviceId === PRODUCT_SERVICE) {
      const productClass = productClassFor(entry.key);
      return {
        ...base,
        kind: 'product',
        productClass,
        icon: PRODUCT_ICON,
        badge: null,
        dashboardPath: `/products/${productClass}/proposals`,
        sidebarId: `${PRODUCT_MODULE_PREFIX}${productClass}`,
      };
    }
    return { ...base, kind: 'unavailable', icon: PRODUCT_ICON, badge: 'Soon', dashboardPath: `/coming-soon/${entry.key}` };
  }

  const launcherModules = computed(() => registry.value.map(present));

  return {
    activeModuleId,
    activeModule,
    selectModule,
    clearModule,
    registry,
    registryStatus,
    registryError,
    registryByKey,
    loadRegistry,
    resetRegistry,
    definitions,
    loadDefinitions,
    productClassFor,
    privilegeModuleFor,
    definitionFor,
    can,
    canAnywhere,
    isModuleAdmin,
    isSuperAdmin,
    adminModuleKeys,
    launcherModules,
  };
});
