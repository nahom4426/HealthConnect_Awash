// Pages load on first visit (shared by Fire and Burglary), not with the app shell.
const FireProductConfig = () => import('@/features/fire/pages/FireProductConfig.vue');
const FireProposals = () => import('@/features/fire/pages/FireProposals.vue');
const FireProposalNew = () => import('@/features/fire/pages/FireProposalNew.vue');
const FireProposalDetail = () => import('@/features/fire/pages/FireProposalDetail.vue');
const FireQuotations = () => import('@/features/fire/pages/FireQuotations.vue');
const FireQuotationNew = () => import('@/features/fire/pages/FireQuotationNew.vue');
const FireQuotationDetail = () => import('@/features/fire/pages/FireQuotationDetail.vue');
const FirePolicies = () => import('@/features/fire/pages/FirePolicies.vue');
const FirePolicyDetail = () => import('@/features/fire/pages/FirePolicyDetail.vue');
const FireClaimNew = () => import('@/features/fire/pages/FireClaimNew.vue');
const FireClaims = () => import('@/features/fire/pages/FireClaims.vue');
const FireClaimDetail = () => import('@/features/fire/pages/FireClaimDetail.vue');

export function pcRoutes(module) {
  const base = `/${module}`;
  const meta = { requiresAuth: true, pcModule: module };
  return [
    { path: `${base}/product`, name: `${module}-product`, component: FireProductConfig, meta },
    { path: `${base}/proposals`, name: `${module}-proposals`, component: FireProposals, meta },
    { path: `${base}/proposals/new`, name: `${module}-proposal-new`, component: FireProposalNew, meta },
    { path: `${base}/proposals/:proposalUuid/edit`, name: `${module}-proposal-edit`, component: FireProposalNew, meta },
    { path: `${base}/proposals/:proposalUuid`, name: `${module}-proposal-detail`, component: FireProposalDetail, meta },
    { path: `${base}/quotations`, name: `${module}-quotations`, component: FireQuotations, meta },
    { path: `${base}/quotations/new/:proposalUuid`, name: `${module}-quotation-new`, component: FireQuotationNew, meta },
    { path: `${base}/quotations/:quotationUuid`, name: `${module}-quotation-detail`, component: FireQuotationDetail, meta },
    { path: `${base}/policies`, name: `${module}-policies`, component: FirePolicies, meta },
    { path: `${base}/policies/:policyUuid`, name: `${module}-policy-detail`, component: FirePolicyDetail, meta },
    { path: `${base}/claims/new`, name: `${module}-claim-new`, component: FireClaimNew, meta },
    { path: `${base}/claims/process`, name: `${module}-claims-process`, component: FireClaims, meta: { ...meta, claimStatus: 'SUBMITTED', claimTitle: 'Process claims' } },
    { path: `${base}/claims/approved`, name: `${module}-claims-approved`, component: FireClaims, meta: { ...meta, claimStatus: 'APPROVED', claimTitle: 'Approved claims' } },
    { path: `${base}/claims/completed`, name: `${module}-claims-completed`, component: FireClaims, meta: { ...meta, claimStatus: 'PAID', claimTitle: 'Completed claims' } },
    { path: `${base}/claims/:claimUuid`, name: `${module}-claim-detail`, component: FireClaimDetail, meta },
  ];
}

export const fireRoutes = pcRoutes('fire');
export const burglaryRoutes = pcRoutes('burglary');

export default fireRoutes;
