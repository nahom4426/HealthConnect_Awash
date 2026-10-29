// Marine & Cargo sidebar (plan section 2). `roles` hides an item from users without one of them
// (applied by filterMarineNavs in MainLayout).
const STAFF = ["ADMIN", "UNDERWRITER", "SENIOR_UNDERWRITER", "CLAIMS_HANDLER", "CLAIMS_MANAGER", "FINANCE"];

const marineNavs = [
  {
    path: '/marine/dashboard',
    name: 'Dashboard',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 14 14"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="3.25" cy="3.25" r="2.75"/><circle cx="10.75" cy="3.25" r="2.75"/><circle cx="3.25" cy="10.75" r="2.75"/><circle cx="10.75" cy="10.75" r="2.75"/></g></svg>`,
  },
  {
    path: '/marine/customers',
    name: 'Customers',
    roles: ['ADMIN', 'BROKER', 'UNDERWRITER', 'SENIOR_UNDERWRITER', 'CLAIMS_HANDLER', 'CLAIMS_MANAGER', 'FINANCE'],
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5"/></g></svg>`,
  },
  {
    path: '/marine/quotes',
    name: 'Quotes',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></g></svg>`,
  },
  {
    path: '/marine/policies',
    name: 'Policies',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 21s7-3.5 7-9.5V5l-7-2.5L5 5v6.5C5 17.5 12 21 12 21Z"/></svg>`,
  },
  {
    path: '/marine/open-covers',
    name: 'Open covers',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M8 15h3"/></g></svg>`,
  },
  {
    path: '/marine/certificates',
    name: 'Certificates',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M7 9h10M7 12h6M15 17l1.5 4 1.5-1.5 1.5 1.5L21 17"/></g></svg>`,
  },
  {
    path: '/marine/underwriting',
    name: 'Underwriting',
    roles: ['UNDERWRITER', 'SENIOR_UNDERWRITER'],
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="M9 11l2 2 4-4"/><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/></g></svg>`,
  },
  {
    path: '/marine/claims',
    name: 'Claims',
    roles: ['CLAIMS_HANDLER', 'CLAIMS_MANAGER'],
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 14 14"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="M5 8.5h4m-2-2v4m5.5-7h-11a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1m-2.5 0v-2a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v2"/></svg>`,
  },
  {
    name: 'Finance',
    roles: ['FINANCE', 'ADMIN'],
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><rect x="2.5" y="6" width="19" height="13" rx="2"/><path d="M2.5 10h19M6.5 15h3"/><path d="M6 6V4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V6"/></g></svg>`,
    navs: [
      { path: '/marine/finance/receivables', name: 'Receivables' },
      { path: '/marine/finance/refunds', name: 'Refunds' },
      { path: '/marine/finance/claim-payments', name: 'Claim payments' },
      { path: '/marine/finance/commission', name: 'Commission' },
    ],
  },
  {
    name: 'Admin',
    roles: STAFF,
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" fill="none" stroke="currentColor" stroke-width="1.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>`,
    navs: [
      { path: '/marine/admin/masters', name: 'Masters', roles: ['ADMIN'] },
      { path: '/marine/admin/fx-rates', name: 'FX rates', roles: STAFF },
      { path: '/marine/admin/rate-tables', name: 'Rate tables', roles: ['ADMIN', 'SENIOR_UNDERWRITER'] },
      { path: '/marine/admin/rules', name: 'Rules', roles: ['ADMIN'] },
      { path: '/marine/admin/users', name: 'Users', roles: ['ADMIN'] },
    ],
  },
];

/** Drops items (and emptied groups) the user's Marine roles can't open. */
export function filterMarineNavs(navs, roles) {
  const allowed = (item) => !item.roles || item.roles.some((r) => roles.includes(r));
  return navs
    .filter(allowed)
    .map((item) => (item.navs ? { ...item, navs: item.navs.filter(allowed) } : item))
    .filter((item) => !item.navs || item.navs.length);
}

export default marineNavs;
