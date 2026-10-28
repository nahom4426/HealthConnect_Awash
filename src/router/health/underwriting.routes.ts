import type { RouteLocationNormalized } from 'vue-router';
const Institution = () => import("@/features/health/underwriting/pages/Institution.vue");
const AddNewPolicy = () => import("@/features/health/underwriting/pages/AddNewPolicy.vue");
const AmendPolicy = () => import("@/features/health/underwriting/pages/AmendPolicy.vue");
const Utilization = () => import("@/features/health/underwriting/pages/Utilization.vue");
const ExpiredContracts = () => import("@/features/health/underwriting/pages/ExpiredContracts.vue");
const ImportPolicy = () => import("@/features/health/underwriting/pages/importPolicy.vue");
const InstitutionContractDetail = () => import("@/features/health/underwriting/pages/InstitutionContractDetail.vue");
const InstitutionContractIndex = () => import("@/features/health/underwriting/pages/InstitutionContractIndex.vue");
const InstitutionCoverage = () => import("@/features/health/underwriting/pages/InstitutionCoverage.vue");
const InstitutionsInsuredPersons = () => import("@/features/health/underwriting/pages/InstitutionsInsuredPersons.vue");
const IssuedPolicy = () => import("@/features/health/underwriting/pages/IssuedPolicy.vue");
const UnderwritingIndex = () => import("@/features/health/underwriting/pages/UnderwritingIndex.vue");
const InstitutionContracts = () => import("@/features/health/underwriting/pages/InstitutionContracts.vue");
const Insured = () => import("@/features/health/insured_persons/pages/Insured.vue");
const InsuredDetails = () => import("@/features/health/insured_persons/pages/insuredDetails.vue");
const Coverages = () => import("@/features/health/product_settings/pages/Coverages.vue");
const InstitutionContractswithIssued = () => import("@/features/health/underwriting/pages/InstitutionContractswithIssued.vue");
const AddProviderForInstitution = () => import("@/features/health/providers/pages/AddProviderForInstitution.vue");
const RemoveCatgorieServices = () => import('@/features/health/providers/pages/removeCatgorieServices.vue');
const AddInstitution = () => import("@/features/health/institutions/pages/AddInstitution.vue");
const PendingRenewalContracts = () => import('@/features/health/quotation_underwriting/pages/PendingRenewalContracts.vue');
export default [
  {
    path: '/add_new_policy',
    name: 'UnderwritingMain',
    component: UnderwritingIndex,
    children: [
      {
        path: '',
        name: 'UnderwritingInstitutions',
        component: AddNewPolicy
      },
      {
        path: 'detail/:institutionUuid',
        name: 'UnderwritingDetail',
        component: InstitutionContractIndex,
        children: [
          {
            path: '',
            name: 'UnderwritingContractDetail',
            component: InstitutionContractDetail
          },
          {
            path: 'institution_coverage/:payerInstitutionContractUuid',
            name: 'UnderwritingInstitutionCoverage',
            component: InstitutionCoverage
          },
          {
            path: 'insured_persons/:payerInstitutionContractUuid',
            name: 'UnderwritingPolicyHolders',
            component: InstitutionsInsuredPersons // Added missing component
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
      requiresAuth: true,
      permissions: ["Read_institutions", "Create_institution", "Update_institution", "Read_institution"],
    },
  },
  {
    path: '/institutions/add',
    name: 'Add Institution',
    component: AddInstitution,
    meta: {
      requiresAuth: true,
      permissions: ['Create_institution'],
    },
  },
  {
    path: '/institution_contracts/:id/:institutionName?',
    name: 'Add Institutions',
    component: InstitutionContracts,
  },
  {
    path: '/insured_persons/:id/:institutionUuid/:institutionName?',
    name: 'Insured Persons',
    component: Insured,
    meta: {
      showActionButtons: true
    }
  },
  {
    path: '/addInstitution/:id/:institutionUuid',
    name: 'Add Providers To Institutions',
    component: AddProviderForInstitution,
  },
  {
    path: '/packages/:id',
    name: 'Packages',
    component: Coverages,
  },
  {
    path: '/removeServiceCatagories/:id/:institutionUuid/:contractUuid',
    name: 'Remove Services',
    component: RemoveCatgorieServices,
  },
  {
    path: '/insured_list/detail/:insuredPersonUuid',
    name: 'Insured Person Details',
    component: InsuredDetails,
    props: true,
  },
  {
    path: '/issued_policy',
    name: 'Issued Policy',
    component: InstitutionContractswithIssued
  },
  {
    path: '/issued_policys',
    name: 'Issued Policys',
    component: IssuedPolicy
  },
  {
    path: '/amend_policy',
    name: 'Amend Policy',
    component: AmendPolicy
  },
  {
    path: '/utilization',
    name: 'Utilization',
    component: Utilization
  },
  {
    path: '/expired_contracts',
    name: 'Expired Contracts',
    component: ExpiredContracts
  },
  {
    path: '/pending_renewal_contracts',
    name: 'Renewal Contracts',
    component: PendingRenewalContracts,
    meta: {
      permissions: ['Amend Policy'],
    },
  },
]