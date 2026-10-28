const lifeNavs = [
  {
    path: '/life/dashboard',
    name: 'Dashboard',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 14 14"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="3.25" cy="3.25" r="2.75"/><circle cx="10.75" cy="3.25" r="2.75"/><circle cx="3.25" cy="10.75" r="2.75"/><circle cx="10.75" cy="10.75" r="2.75"/></g></svg>`,
  },
  {
    name: 'Claims',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 14 14"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="M5 8.5h4m-2-2v4m5.5-7h-11a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1m-2.5 0v-2a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v2"/></svg>`,
    navs: [
      { path: '/life/claims/new', name: 'New Claim' },
      { path: '/life/claims/process', name: 'Process Claims' },
      { path: '/life/claims/approved', name: 'Approved Claims' },
      { path: '/life/claims/completed', name: 'Completed Claims' },
    ],
  },
  {
    name: 'Products & Rates',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" fill="none" stroke="currentColor" stroke-width="1.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>`,
    navs: [
      { path: '/life/products/group-term-rates', name: 'Group Term Rates' },
      { path: '/life/products/individual-term-rates', name: 'Individual Term Rates' },
      { path: '/life/products/riders', name: 'Riders' },
    ],
  },
  {
    name: 'Reinsurance',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 3v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-3z"/><path d="M8.5 12.5l2.5 2.5 4.5-5"/></svg>`,
    navs: [
      { path: '/life/reinsurance/treaties', name: 'Treaties' },
      { path: '/life/reinsurance/reinsurers', name: 'Reinsurers' },
      { path: '/life/reinsurance/medical-tests', name: 'Medical Tests' },
    ],
  },
];
export default lifeNavs;
