import FireProductConfig from '@/features/fire/pages/FireProductConfig.vue';
import FireProposals from '@/features/fire/pages/FireProposals.vue';
import FireProposalNew from '@/features/fire/pages/FireProposalNew.vue';
import FireProposalDetail from '@/features/fire/pages/FireProposalDetail.vue';
import FireQuotations from '@/features/fire/pages/FireQuotations.vue';
import FireQuotationNew from '@/features/fire/pages/FireQuotationNew.vue';
import FireQuotationDetail from '@/features/fire/pages/FireQuotationDetail.vue';
import FirePolicies from '@/features/fire/pages/FirePolicies.vue';
import FirePolicyDetail from '@/features/fire/pages/FirePolicyDetail.vue';
import FireClaimNew from '@/features/fire/pages/FireClaimNew.vue';
import FireClaims from '@/features/fire/pages/FireClaims.vue';
import FireClaimDetail from '@/features/fire/pages/FireClaimDetail.vue';

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
export const liabilityCatalogRoutes = pcRoutes('liability');
export const marineCatalogRoutes = pcRoutes('marine').filter((route) =>
  !route.path.startsWith('/marine/policies') && !route.path.startsWith('/marine/claims')
);

export default fireRoutes;
