import { lifePermissions } from "./privileges";
// meta.permissions mirror the route privileges in router/life/life.routes.js (any one grants access).
const lifeNavs = [
  {
    path: '/life/dashboard',
    name: 'Dashboard',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 14 14"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="3.25" cy="3.25" r="2.75"/><circle cx="10.75" cy="3.25" r="2.75"/><circle cx="3.25" cy="10.75" r="2.75"/><circle cx="10.75" cy="10.75" r="2.75"/></g></svg>`,
  },
  {
    path: '/life/quotations',
    name: 'Group Quotations',
    meta: { permissions: lifePermissions(["Life_Quotation_Create", "Life_Quotation_Issue", "Life_Payment_Record", "Life_Policy_Issue"]) },
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>`,
  },
  {
    path: '/life/policies',
    name: 'Group Policies',
    meta: { permissions: lifePermissions(["Life_Policy_Issue", "Life_Policy_Service", "Life_Reinsurance_Manage", "Life_Report_View"]) },
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v5c0 4.5-3 8.2-7 9.5-4-1.3-7-5-7-9.5V6z"/><path d="M9 12h6M9 15h4M9 9h6"/></svg>`,
  },
  {
    path: '/life/individual',
    name: 'Individual Policies',
    meta: { permissions: lifePermissions(["Life_Quotation_Create", "Life_Policy_Issue", "Life_Policy_Service"]) },
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3.5"/><path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5"/></svg>`,
  },
  {
    name: 'Claims',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 14 14"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="M5 8.5h4m-2-2v4m5.5-7h-11a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1m-2.5 0v-2a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v2"/></svg>`,
    navs: [
      { path: '/life/claims/new', name: 'New Claim', meta: { permissions: lifePermissions(["Life_Claim_Prepare"]) } },
      { path: '/life/claims/agency', name: 'Agency Claims', meta: { permissions: lifePermissions(["Life_Claim_Prepare"]) } },
      { path: '/life/claims/insurance', name: 'Claims Desk', meta: { permissions: lifePermissions(["Life_Claim_Review", "Life_Claim_Approve", "Life_Claim_Authorize", "Life_Claim_Pay"]) } },
    ],
  },
  {
    name: 'Products & Rates',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" fill="none" stroke="currentColor" stroke-width="1.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>`,
    navs: [
      { path: '/life/products/group-term-rates', name: 'Group Term Rates', meta: { permissions: lifePermissions(["Life_Rate_Manage", "Life_Product_Manage"]) } },
      { path: '/life/products/individual-term-rates', name: 'Individual Term Rates', meta: { permissions: lifePermissions(["Life_Rate_Manage", "Life_Product_Manage"]) } },
      { path: '/life/products/riders', name: 'Riders', meta: { permissions: lifePermissions(["Life_Product_Manage", "Life_Rate_Manage"]) } },
    ],
  },
  {
    path: '/form-builder/life',
    name: 'Proposal Form Builder',
    meta: { permissions: lifePermissions(["Life_Product_Manage"]) },
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>`,
  },
  {
    name: 'Reinsurance',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 3v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-3z"/><path d="M8.5 12.5l2.5 2.5 4.5-5"/></svg>`,
    navs: [
      { path: '/life/reinsurance/treaties', name: 'Treaties', meta: { permissions: lifePermissions(["Life_Reinsurance_Manage"]) } },
      { path: '/life/reinsurance/reinsurers', name: 'Reinsurers', meta: { permissions: lifePermissions(["Life_Reinsurance_Manage"]) } },
      { path: '/life/reinsurance/medical-tests', name: 'Medical Tests', meta: { permissions: lifePermissions(["Life_Reinsurance_Manage"]) } },
    ],
  },
  {
    name: 'Underwriting',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4h6a1 1 0 0 1 1 1v1H8V5a1 1 0 0 1 1-1z"/><path d="M8 5H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-2"/><path d="M9 11h6M9 15h4"/></svg>`,
    navs: [
      { path: '/life/underwriting/questions', name: 'Questionnaire', meta: { permissions: lifePermissions(["Life_Underwriting_Decide"]) } },
      { path: '/life/underwriting/answers', name: 'Answer Library', meta: { permissions: lifePermissions(["Life_Underwriting_Decide"]) } },
    ],
  },
];
export default lifeNavs;
