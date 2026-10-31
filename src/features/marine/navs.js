const icon = {
  dashboard: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 14 14"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="3.25" cy="3.25" r="2.75"/><circle cx="10.75" cy="3.25" r="2.75"/><circle cx="3.25" cy="10.75" r="2.75"/><circle cx="10.75" cy="10.75" r="2.75"/></g></svg>`,
  document: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>`,
  quote: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 7h6M9 11h6M9 15h4M5 5h14a1 1 0 011 1v14l-4-2-4 2-4-2-4 2V6a1 1 0 011-1z"/></svg>`,
  policy: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M7 4h7l5 5v11a1 1 0 01-1 1H7a1 1 0 01-1-1V5a1 1 0 011-1z"/><path stroke-linecap="round" stroke-linejoin="round" d="M14 4v5h5"/></svg>`,
  settings: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" fill="none" stroke="currentColor" stroke-width="1.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>`,
  claims: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 14 14"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="M5 8.5h4m-2-2v4m5.5-7h-11a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1m-2.5 0v-2a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v2"/></svg>`,
};

const marineNavs = [
  { path: "/marine/dashboard", name: "Dashboard", icon: icon.dashboard },
  { path: "/marine/proposals", name: "Proposals", icon: icon.document },
  { path: "/marine/quotes", name: "Quotations", icon: icon.quote },
  { path: "/marine/open-covers", name: "Open covers", icon: icon.policy },
  { path: "/marine/declarations", name: "Declarations", icon: icon.document },
  { path: "/marine/policies", name: "Policies", icon: icon.policy },
  {
    name: "Certificates",
    icon: icon.document,
    navs: [
      { path: "/marine/certificates", name: "Shipment certificates" },
      { path: "/marine/declaration-certificates", name: "Declaration certificates" },
    ],
  },
  {
    name: "Claims",
    icon: icon.claims,
    navs: [
      { path: "/marine/claims/new", name: "New Claim", marineRoles: ["CLAIMS_HANDLER"] },
      { path: "/marine/claims/process", name: "Process Claims", marineRoles: ["CLAIMS_HANDLER", "CLAIMS_MANAGER"] },
      { path: "/marine/claims/approved", name: "Approved Claims", marineRoles: ["CLAIMS_HANDLER", "CLAIMS_MANAGER"] },
      { path: "/marine/claims/completed", name: "Completed Claims", marineRoles: ["CLAIMS_HANDLER", "CLAIMS_MANAGER"] },
    ],
  },
  {
    name: "Marine Settings",
    icon: icon.settings,
    navs: [
      { path: "/marine/admin/fx-rates", name: "FX rates", marineRoles: ["FINANCE"] },
      { path: "/marine/admin/rate-tables", name: "Tariff and rate tables", marineRoles: ["ADMIN", "SENIOR_UNDERWRITER"] },
      { path: "/marine/admin/rules", name: "Underwriting rules", marineRoles: ["ADMIN"] },
      { path: "/marine/admin/users", name: "Marine users and roles", marineRoles: ["ADMIN"] },
      { path: "/marine/deadlines", name: "Deadlines and alerts", marineRoles: ["CLAIMS_HANDLER", "CLAIMS_MANAGER"] },
      { path: "/marine/admin/masters", name: "Marine master data", marineRoles: ["ADMIN"] },
      { path: "/marine/product", name: "Marine cargo rates and perils" },
      { path: "/form-builder/marine", name: "Proposal form builder" },
      { path: "/marine/admin/sanctions", name: "Sanctions list", marineRoles: ["ADMIN"] },
    ],
  },
];

export default marineNavs;
