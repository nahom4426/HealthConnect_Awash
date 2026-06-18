import type { RouteLocationNormalized } from 'vue-router';
import Institution from "@/features/underwriting/pages/Institution.vue";
import AddNewPolicy from "@/features/underwriting/pages/AddNewPolicy.vue";
import AmendPolicy from "@/features/underwriting/pages/AmendPolicy.vue";
import Utilization from "@/features/underwriting/pages/Utilization.vue";
import ExpiredContracts from "@/features/underwriting/pages/ExpiredContracts.vue";
import ImportPolicy from "@/features/underwriting/pages/importPolicy.vue";
import InstitutionContractDetail from "@/features/underwriting/pages/InstitutionContractDetail.vue";
import InstitutionContractIndex from "@/features/underwriting/pages/InstitutionContractIndex.vue";
import InstitutionCoverage from "@/features/underwriting/pages/InstitutionCoverage.vue";
import InstitutionsInsuredPersons from "@/features/underwriting/pages/InstitutionsInsuredPersons.vue";
import IssuedPolicy from "@/features/underwriting/pages/IssuedPolicy.vue";
import UnderwritingIndex from "@/features/underwriting/pages/UnderwritingIndex.vue";
import InstitutionContracts from "@/features/underwriting/pages/InstitutionContracts.vue";
import Insured from "@/features/insured_persons/pages/Insured.vue";
import InsuredDetails from "@/features/insured_persons/pages/insuredDetails.vue";
import Coverages from "@/features/product_settings/pages/Coverages.vue";
import InstitutionContractswithIssued from "@/features/underwriting/pages/InstitutionContractswithIssued.vue";
import AddProviderForInstitution from "@/features/providers/pages/AddProviderForInstitution.vue";
import RemoveCatgorieServices from '@/features/providers/pages/removeCatgorieServices.vue';
import AddInstitution from "@/features/institutions/pages/AddInstitution.vue";

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