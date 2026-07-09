import type { RouteLocationNormalized } from 'vue-router';
import Institution from "@/features/Nyalaunderwriting/pages/Institution.vue";
import AddNewPolicy from "@/features/Nyalaunderwriting/pages/AddNewPolicy.vue";
import AmendPolicy from "@/features/Nyalaunderwriting/pages/AmendPolicy.vue";
import ImportPolicy from "@/features/Nyalaunderwriting/pages/importPolicy.vue";
import InstitutionContractDetail from "@/features/Nyalaunderwriting/pages/InstitutionContractDetail.vue";
import InstitutionContractIndex from "@/features/Nyalaunderwriting/pages/InstitutionContractIndex.vue";
import InstitutionCoverage from "@/features/Nyalaunderwriting/pages/InstitutionCoverage.vue";
import InstitutionsInsuredPersons from "@/features/Nyalaunderwriting/pages/InstitutionsInsuredPersons.vue";
import IssuedPolicy from "@/features/Nyalaunderwriting/pages/IssuedPolicy.vue";
import UnderwritingIndex from "@/features/Nyalaunderwriting/pages/UnderwritingIndex.vue";
import InstitutionContracts from "@/features/Nyalaunderwriting/pages/InstitutionContracts.vue";
import Insured from "@/features/insured_persons/pages/Insured.vue";
import InsuredDetails from "@/features/insured_persons/pages/insuredDetails.vue";
import Coverages from "@/features/product_settings/pages/Coverages.vue";
import InstitutionContractswithIssued from "@/features/Nyalaunderwriting/pages/InstitutionContractswithIssued.vue";
import AddProviderForInstitution from "@/features/providers/pages/AddProviderForInstitution.vue";
import RemoveCatgorieServices from '@/features/providers/pages/removeCatgorieServices.vue';
import AddInstitution from "@/features/institutions/pages/AddInstitution.vue";
import QuotationInsured from '@/features/insured_persons/pages/quotationInsured.vue';
import ImportInsuredsPage from '@/features/insured_persons/pages/ImportInsuredsPage.vue';
import StageExclusion from '@/features/quotation/pages/StageExclusion.vue';
import ExpiredContracts from '@/features/Nyalaunderwriting/pages/ExpiredContracts.vue';
import PendingRenewalContracts from '@/features/Nyalaunderwriting/pages/PendingRenewalContracts.vue';
import EditPendingRenewalQuotation from '@/features/Nyalaunderwriting/pages/EditPendingRenewalQuotation.vue';


export default [
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