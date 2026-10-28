import type { RouteLocationNormalized } from 'vue-router';
import Institution from "@/features/health/underwriting/pages/Institution.vue";
import AddNewPolicy from "@/features/health/underwriting/pages/AddNewPolicy.vue";
import AmendPolicy from "@/features/health/underwriting/pages/AmendPolicy.vue";
import Utilization from "@/features/health/underwriting/pages/Utilization.vue";
import ExpiredContracts from "@/features/health/underwriting/pages/ExpiredContracts.vue";
import ImportPolicy from "@/features/health/underwriting/pages/importPolicy.vue";
import InstitutionContractDetail from "@/features/health/underwriting/pages/InstitutionContractDetail.vue";
import InstitutionContractIndex from "@/features/health/underwriting/pages/InstitutionContractIndex.vue";
import InstitutionCoverage from "@/features/health/underwriting/pages/InstitutionCoverage.vue";
import InstitutionsInsuredPersons from "@/features/health/underwriting/pages/InstitutionsInsuredPersons.vue";
import IssuedPolicy from "@/features/health/underwriting/pages/IssuedPolicy.vue";
import UnderwritingIndex from "@/features/health/underwriting/pages/UnderwritingIndex.vue";
import InstitutionContracts from "@/features/health/underwriting/pages/InstitutionContracts.vue";
import Insured from "@/features/health/insured_persons/pages/Insured.vue";
import InsuredDetails from "@/features/health/insured_persons/pages/insuredDetails.vue";
import Coverages from "@/features/health/product_settings/pages/Coverages.vue";
import InstitutionContractswithIssued from "@/features/health/underwriting/pages/InstitutionContractswithIssued.vue";
import AddProviderForInstitution from "@/features/health/providers/pages/AddProviderForInstitution.vue";
import RemoveCatgorieServices from '@/features/health/providers/pages/removeCatgorieServices.vue';
import AddInstitution from "@/features/health/institutions/pages/AddInstitution.vue";

export default [
  {
    path: '/add_new_policy',
    name: 'UnderwritingMain',
    component: UnderwritingIndex,
    meta: {
      permissions: ['Institutions', 'Issued Policy', 'Amend Policy'], // Parent needs ALL of these
    },
    children: [
      {
        path: '',
        name: 'UnderwritingInstitutions',
        component: AddNewPolicy,
        meta: {
          permissions: ['Institutions'],
        },
      },
      {
        path: 'detail/:institutionUuid',
        name: 'UnderwritingDetail',
        component: InstitutionContractIndex,
        meta: {
          permissions: ['Institutions'],
        },
        children: [
          {
            path: '',
            name: 'UnderwritingContractDetail',
            component: InstitutionContractDetail,
            meta: {
              permissions: ['Institutions'],
            },
          },
          {
            path: 'institution_coverage/:payerInstitutionContractUuid',
            name: 'UnderwritingInstitutionCoverage',
            component: InstitutionCoverage,
            meta: {
              permissions: ['Institutions'],
            },
          },
          {
            path: 'insured_persons/:payerInstitutionContractUuid',
            name: 'UnderwritingPolicyHolders',
            component: InstitutionsInsuredPersons,
            meta: {
              permissions: ['Institutions'],
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
      permissions: ['Institutions'],
    },
  },
  {
    path: '/institutions/add',
    name: 'Add Institution',
    component: AddInstitution,
    meta: {
      permissions: ['Create_institution'],
    },
  },
  {
    path: '/institution_contracts/:id/:institutionName',
    name: 'Add Institutions',
    component: InstitutionContracts,
    meta: {
      permissions: ['Institutions'],
    },
  },
  {
    path: '/insured_persons/:id/:institutionUuid/:institutionName',
    name: 'Insured Persons',
    component: Insured,
    meta: {
      permissions: ['Institutions'],
      showActionButtons: true
    }
  },
  {
    path: '/addInstitution/:id/:institutionUuid',
    name: 'Add Providers To Institutions',
    component: AddProviderForInstitution,
    meta: {
      permissions: ['Create_institution'],
    },
  },
  {
    path: '/packages/:id',
    name: 'Packages',
    component: Coverages,
    meta: {
      permissions: ['Institutions'],
    },
  },
  {
    path: '/removeServiceCatagories/:id/:institutionUuid/:contractUuid',
    name: 'Remove Services',
    component: RemoveCatgorieServices,
    meta: {
      permissions: ['Update_institution'],
    },
  },
  {
    path: '/insured_list/detail/:insuredPersonUuid',
    name: 'Insured Person Details',
    component: InsuredDetails,
    props: true,
    meta: {
      permissions: ['Institutions'],
    },
  },
  {
    path: '/issued_policy',
    name: 'Issued Policy',
    component: InstitutionContractswithIssued,
    meta: {
      permissions: ['Issued Policy'],
    },
  },
  {
    path: '/issued_policys',
    name: 'Issued Policys',
    component: IssuedPolicy,
    meta: {
      permissions: ['Issued Policy'],
    },
  },
  {
    path: '/amend_policy',
    name: 'Amend Policy',
    component: AmendPolicy,
    meta: {
      permissions: ['Amend Policy'],
    },
  },
  {
    path: '/utilization',
    name: 'Utilization',
    component: Utilization,
    meta: {
      permissions: ['Amend Policy'],
    },
  },
  {
    path: '/expired_contracts',
    name: 'Expired Contracts',
    component: ExpiredContracts,
    meta: {
      permissions: ['Amend Policy'],
    },
  }
]