import { useModuleStore } from '@/stores/moduleStore';

const ICONS = {
  proposals: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>`,
  newProposal: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>`,
  quotations: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 7h6M9 11h6M9 15h4M5 5h14a1 1 0 011 1v14l-4-2-4 2-4-2-4 2V6a1 1 0 011-1z"/></svg>`,
  setup: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" fill="none" stroke="currentColor" stroke-width="1.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>`,
  catalogue: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><path stroke-linecap="round" d="M17.5 14v7M14 17.5h7"/></svg>`,
  registry: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h10"/></svg>`,
};

/**
 * Sidebar of one no-code product. `area: false` opts out of the motor-style role areas;
 * `visible` hides what the user's privileges in this product's module don't allow.
 */
export function productNavs(productClass) {
  const base = `/products/${productClass}`;
  const store = useModuleStore();
  const module = () => store.privilegeModuleFor(productClass);
  const retired = () => store.definitionFor(productClass)?.status === 'RETIRED';
  const canAny = (...actions) => () => actions.some((action) => store.can(module(), action));
  return [
    { path: `${base}/proposals/new`, name: 'New Proposal', icon: ICONS.newProposal, area: false, visible: () => !retired() && store.can(module(), 'proposal.create') },
    { path: `${base}/proposals`, name: 'Proposals', icon: ICONS.proposals, area: false },
    { path: `${base}/quotations`, name: 'Quotations', icon: ICONS.quotations, area: false, visible: canAny('quotation.read', 'quotation.calculate', 'quotation.issue', 'quotation.accept', 'quotation.decline') },
    { path: `${base}/versions`, name: 'Product setup', icon: ICONS.setup, area: false, visible: canAny('product.read', 'product.create', 'product.update', 'product.publish') },
  ];
}

/** Product catalogue and module registry, shown in the Administration sidebar. */
export const productAdminNavs = [
  {
    path: '/product-catalogue',
    name: 'Product catalogue',
    icon: ICONS.catalogue,
    area: false,
    visible: () => {
      const store = useModuleStore();
      return store.isSuperAdmin() || store.canAnywhere('.product.read');
    },
  },
  {
    path: '/admin/modules',
    name: 'Module registry',
    icon: ICONS.registry,
    area: false,
    visible: () => useModuleStore().isSuperAdmin(),
  },
];
