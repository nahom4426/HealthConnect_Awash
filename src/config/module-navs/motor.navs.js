const motorNavs = [
  {
    path: '/motor/dashboard',
    name: 'Dashboard',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 14 14"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="3.25" cy="3.25" r="2.75"/><circle cx="10.75" cy="3.25" r="2.75"/><circle cx="3.25" cy="10.75" r="2.75"/><circle cx="10.75" cy="10.75" r="2.75"/></g></svg>`,
  },
  {
    name: 'Claims',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 14 14"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="M5 8.5h4m-2-2v4m5.5-7h-11a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1m-2.5 0v-2a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v2"/></svg>`,
    navs: [
      { path: '/motor/claims/new', name: 'New Claim', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 14 14"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="M13.5 6.5a1 1 0 0 0-1-1h-4v-4a1 1 0 0 0-1-1h-1a1 1 0 0 0-1 1v4h-4a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h4v4a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-4h4a1 1 0 0 0 1-1Z"/></svg>` },
      { path: '/motor/claims/process', name: 'Process Claims', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 14 14"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="M5 8.5h4m-2-2v4m5.5-7h-11a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1m-2.5 0v-2a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v2"/></svg>` },
      { path: '/motor/claims/approved', name: 'Approved Claims', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="M15.418 5.643a1.25 1.25 0 0 0-1.34-.555l-1.798.413a1.25 1.25 0 0 1-.56 0l-1.798-.413a1.25 1.25 0 0 0-1.34.555l-.98 1.564c-.1.16-.235.295-.395.396l-1.564.98a1.25 1.25 0 0 0-.555 1.338l.413 1.8a1.25 1.25 0 0 1 0 .559l-.413 1.799a1.25 1.25 0 0 0 .555 1.339l1.564.98c.16.1.295.235.396.395l.98 1.564c.282.451.82.674 1.339.555l1.798-.413a1.25 1.25 0 0 1 .56 0l1.799.413a1.25 1.25 0 0 0 1.339-.555l.98-1.564c.1-.16.235-.295.395-.395l1.565-.98a1.25 1.25 0 0 0 .554-1.34L18.5 12.28a1.25 1.25 0 0 1 0-.56l.413-1.799a1.25 1.25 0 0 0-.554-1.339l-1.565-.98a1.25 1.25 0 0 1-.395-.395zm-.503 4.127a.5.5 0 0 0-.86-.509l-2.615 4.426l-1.579-1.512a.5.5 0 1 0-.691.722l2.034 1.949a.5.5 0 0 0 .776-.107z" clip-rule="evenodd"/></svg>` },
      { path: '/motor/claims/completed', name: 'Completed Claims', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"><path fill="currentColor" d="M18 22H6v-6l4-4l-4-4V2h12v6l-4 4l4 4M8 7.5l4 4l4-4V4H8m4 8.5l-4 4V20h8v-3.5M14 18h-4v-.8l2-2l2 2Z"/></svg>` },
    ],
  },
  {
    path: '/motor/quotation',
    name: 'Quotation',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>`,
  },
  {
    name: 'Product Config',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" fill="none" stroke="currentColor" stroke-width="1.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>`,
    navs: [
      {
        path: '/motor/rate-config/categories',
        name: 'Vehicle Categories',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>`,
      },
      {
        path: '/motor/rate-config/rates',
        name: 'Premium Rates',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" fill="none" stroke="currentColor" stroke-width="1.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>`,
      },
      {
        path: '/motor/car-config',
        name: 'Car Configuration',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0zM4 17H3v-4l3-5h10l3 5v4h-1M9 17h6"/></svg>`,
      },
    ],
  },
];

export default motorNavs;
