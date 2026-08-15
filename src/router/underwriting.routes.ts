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
import PendingRenewalContracts from '@/features/Nyalaunderwriting/pages/PendingRenewalContracts.vue';
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