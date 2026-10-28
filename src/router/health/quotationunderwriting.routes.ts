import type { RouteLocationNormalized } from 'vue-router';
const Institution = () => import("@/features/health/quotation_underwriting/pages/Institution.vue");
const AddNewPolicy = () => import("@/features/health/quotation_underwriting/pages/AddNewPolicy.vue");
const AmendPolicy = () => import("@/features/health/quotation_underwriting/pages/AmendPolicy.vue");
const ImportPolicy = () => import("@/features/health/underwriting/pages/importPolicy.vue");
const InstitutionContractDetail = () => import("@/features/health/quotation_underwriting/pages/InstitutionContractDetail.vue");
const InstitutionContractIndex = () => import("@/features/health/underwriting/pages/InstitutionContractIndex.vue");
const InstitutionCoverage = () => import("@/features/health/underwriting/pages/InstitutionCoverage.vue");
const InstitutionsInsuredPersons = () => import("@/features/health/underwriting/pages/InstitutionsInsuredPersons.vue");
const IssuedPolicy = () => import("@/features/health/quotation_underwriting/pages/IssuedPolicy.vue");
const UnderwritingIndex = () => import("@/features/health/underwriting/pages/UnderwritingIndex.vue");
const InstitutionContracts = () => import("@/features/health/quotation_underwriting/pages/InstitutionContracts.vue");
const Insured = () => import("@/features/health/insured_persons/pages/Insured.vue");
const InsuredDetails = () => import("@/features/health/insured_persons/pages/insuredDetails.vue");
const Coverages = () => import("@/features/health/product_settings/pages/Coverages.vue");
const InstitutionContractswithIssued = () => import("@/features/health/quotation_underwriting/pages/InstitutionContractswithIssued.vue");
const AddProviderForInstitution = () => import("@/features/health/providers/pages/AddProviderForInstitution.vue");
const RemoveCatgorieServices = () => import('@/features/health/providers/pages/removeCatgorieServices.vue');
const AddInstitution = () => import("@/features/health/institutions/pages/AddInstitution.vue");
const QuotationInsured = () => import('@/features/health/insured_persons/pages/quotationInsured.vue');
const ImportInsuredsPage = () => import('@/features/health/insured_persons/pages/ImportInsuredsPage.vue');
const StageExclusion = () => import('@/features/health/quotation/pages/StageExclusion.vue');
const ExpiredContracts = () => import('@/features/health/quotation_underwriting/pages/ExpiredContracts.vue');
const PendingRenewalContracts = () => import('@/features/health/quotation_underwriting/pages/PendingRenewalContracts.vue');
const Utilization = () => import('@/features/health/underwriting/pages/Utilization.vue');
const EditPendingRenewalQuotation = () => import('@/features/health/quotation_underwriting/pages/EditPendingRenewalQuotation.vue');


export default [
  {
    path: '/utilization',
    name: 'Utilization',
    component: Utilization,
  },
  {
    path: '/add_new_policy',
    name: 'QuotationUnderwritingMain',
    component: UnderwritingIndex,
    meta: {
      permissions: ['Manages_Quotation'],
    },
    children: [
      {
        path: '',
        name: 'QuotationUnderwritingInstitutions',
        component: AddNewPolicy,
        meta: {
          permissions: ['View_Institutions'],
        },
      },
      {
        path: 'detail/:institutionUuid',
        name: 'QuotationUnderwritingDetail',
        component: InstitutionContractIndex,
        meta: {
          permissions: ['View_Institutions'],
        },
        children: [
          {
            path: '',
            name: 'QuotationUnderwritingContractDetail',
            component: InstitutionContractDetail,
            meta: {
              permissions: ['View_Institutions'],
            },
          },
          {
            path: 'institution_coverage/:payerInstitutionContractUuid',
            name: 'QuotationUnderwritingInstitutionCoverage',
            component: InstitutionCoverage,
            meta: {
              permissions: ['View_Institutions'],
            },
          },
          {
            path: 'insured_persons/:payerInstitutionContractUuid',
            name: 'QuotationUnderwritingPolicyHolders',
            component: InstitutionsInsuredPersons,
            meta: {
              permissions: ['View_Institutions'],
            },
          }
        ]
      }
    ]
  },
  {
    path: '/institution_policy',
    name: 'Institutions',
    component: Institution,
    meta: {
      permissions: ['View_Institutions'],
    },
  },
  {
    path: '/institutions/add',
    name: 'Add Institution',
    component: AddInstitution,
    meta: {
      permissions: ['Create_Institutions'],
    },
  },
  {
    path: '/institution_contracts/:id/:institutionName',
    name: 'Add Institutions',
    component: InstitutionContracts,
    meta: {
      permissions: ['View_Institutions'],
    },
  },
  {
    path: '/insured_persons/:payerInstitutionContractUuid/:institutionUuid/:quotationUuid?/:institutionName?',
    name: 'Insured Persons',
    component: QuotationInsured,
    meta: {
      permissions: ['View_Issued_Policy'],
      showActionButtons: true
    }
  },
  {
    path: '/import-insureds/:payerInstitutionContractUuid',
    name: 'Import Insureds',
    component: ImportInsuredsPage,
    meta: {
      permissions: ['View_Issued_Policy'],
    },
  },
  {
    path: '/addInstitution/:id/:institutionUuid',
    name: 'addInstitution',
    component: AddProviderForInstitution,
    meta: {
      permissions: ['View_Issued_Policy'],
    },
  },
  {
    path: '/packages/:id',
    name: 'Packages',
    component: Coverages,
    meta: {
      permissions: ['View_Institutions'],
    },
  },
  {
    path: '/removeServiceCatagories/:id/:institutionUuid/:contractUuid',
    name: 'Remove Services',
    component: RemoveCatgorieServices,
    meta: {
      permissions: ['Update_Institutions'],
    },
  },
  {
    path: '/insured_list/detail/:insuredPersonUuid',
    name: 'Insured Person Details',
    component: InsuredDetails,
    props: true,
    meta: {
      permissions: ['View_Institutions'],
    },
  },
  {
    path: '/issued_policy',
    name: 'Issued Policy',
    component: InstitutionContractswithIssued,
    meta: {
      permissions: ['View_Issued_Policy'],
    },
  },
  {
    path: '/issued_policys',
    name: 'Issued Policys',
    component: IssuedPolicy,
    meta: {
      permissions: ['View_Issued_Policy'],
    },
  },
  {
    path: '/amend_policy',
    name: 'Amend Policy',
    component: AmendPolicy,
    meta: {
      permissions: ['Amend_Policy'],
    },
  },
  {
    path: '/stage_exclusion/:payerInstitutionContractUuid?',
    name: 'Stage Exclusion',
    component: StageExclusion,
    meta: {
      permissions: ['Manage_Exclusion'],
    },
  },
  {
    path: '/expired_contracts',
    name: 'Expired Contracts',
    component: ExpiredContracts,
    meta: {
      permissions: ['Amend Policy'],
    },
  },
   {
    path: '/pending_renewal_contracts',
    name: 'Pending Renewal Contracts',
    component: PendingRenewalContracts,
    meta: {
      permissions: ['Amend Policy'],
    },
  },
  {
    path: '/pending_renewal_contracts/edit/:contractUuid',
    name: 'EditPendingRenewalQuotation',
    component: EditPendingRenewalQuotation,
    meta: {
      permissions: ['Amend Policy'],
    },
  },
]