const fireNavs = [
  {
    path: '/fire/dashboard',
    name: 'Dashboard',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 14 14"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="3.25" cy="3.25" r="2.75"/><circle cx="10.75" cy="3.25" r="2.75"/><circle cx="3.25" cy="10.75" r="2.75"/><circle cx="10.75" cy="10.75" r="2.75"/></g></svg>`,
  },
  {
    path: '/fire/proposals/new',
    name: 'New Proposal',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>`,
  },
  {
    path: '/fire/proposals',
    name: 'Proposals',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>`,
  },
  {
    path: '/fire/quotations',
    name: 'Quotations',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 7h6M9 11h6M9 15h4M5 5h14a1 1 0 011 1v14l-4-2-4 2-4-2-4 2V6a1 1 0 011-1z"/></svg>`,
  },
  {
    path: '/fire/policies',
    name: 'Policies',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M7 4h7l5 5v11a1 1 0 01-1 1H7a1 1 0 01-1-1V5a1 1 0 011-1z"/><path stroke-linecap="round" stroke-linejoin="round" d="M14 4v5h5"/></svg>`,
  },
  {
    name: 'Product Config',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" fill="none" stroke="currentColor" stroke-width="1.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>`,
    navs: [
      { path: '/fire/product', name: 'Fire rates & perils' },
    ],
  },
  {
    name: 'Claims',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 14 14"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="M5 8.5h4m-2-2v4m5.5-7h-11a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1m-2.5 0v-2a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v2"/></svg>`,
    navs: [
      { path: '/fire/claims/new', name: 'New Claim' },
      { path: '/fire/claims/process', name: 'Process Claims' },
      { path: '/fire/claims/approved', name: 'Approved Claims' },
      { path: '/fire/claims/completed', name: 'Completed Claims' },
    ],
  },
  {
    path: '/form-builder/fire',
    name: 'Proposal Form Builder',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>`,
  },
];
export default fireNavs;
