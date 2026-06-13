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
import StageExclusion from '@/features/quotation/pages/StageExclusion.vue';

export default [
  {
    path: '/add_new_policy',
    name: 'QuotationUnderwritingMain',
    component: UnderwritingIndex,
    children: [
      {
        path: '',
        name: 'QuotationUnderwritingInstitutions',
        component: AddNewPolicy
      },
      {
        path: 'detail/:institutionUuid',
        name: 'QuotationUnderwritingDetail',
        component: InstitutionContractIndex,
        children: [
          {
            path: '',
            name: 'QuotationUnderwritingContractDetail',
            component: InstitutionContractDetail
          },
          {
            path: 'institution_coverage/:payerInstitutionContractUuid',
            name: 'QuotationUnderwritingInstitutionCoverage',
            component: InstitutionCoverage
          },
          {
            path: 'insured_persons/:payerInstitutionContractUuid',
            name: 'QuotationUnderwritingPolicyHolders',
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
      permissions: ['Read-Institutions','Create-Institutions','Update-Institutions','Delete_institutions'],
    },
  },
  {
		path: '/institutions/add',
		name: 'Add Institution',
		component: AddInstitution,
	},
  {
    path: '/institution_contracts/:id/:institutionName',
    name: 'Add Institutions',
    component: InstitutionContracts,
  },
  {
    path: '/insured_persons/:id/:institutionUuid/:quotationUuid/:institutionName',
    name: 'Insured Persons',
    component: QuotationInsured,
    meta: {
      showActionButtons: true
    }
  },
  {
    path: '/addInstitution/:id/:institutionUuid',
    name: 'addInstitution',
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
    path: '/stage_exclusion/:payerInstitutionContractUuid?',
    name: 'Stage Exclusion',
    component: StageExclusion,
  }
]