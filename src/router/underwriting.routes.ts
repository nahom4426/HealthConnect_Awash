import Institution from "@/features/underwriting/pages/Institution.vue";
import AddNewPolicy from "@/features/underwriting/pages/AddNewPolicy.vue";
import AmendPolicy from "@/features/underwriting/pages/AmendPolicy.vue";
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

export default [
	{
		path: '/add_new_policy',
		name: 'Underwriting',
		component: UnderwritingIndex,
		children: [
			{
				path: '',
				name: 'Institutions',
				component: AddNewPolicy
			},
			{
				path: 'detail/:institutionUuid',
				name: 'Detail',
				component: InstitutionContractIndex,
				children: [
					{
						path: '',
						name: 'Contract Detail',
						component: InstitutionContractDetail
					},
					{
						path: 'institution_coveraage/:payerInstitutionContractUuid',
						name: 'Institution Coveraage',
						component: InstitutionCoverage
					},
					{
						path: '/insured_persons/:payerInstitutionContractUuid',
						name: 'Policy Holders',
						component: InstitutionsInsuredPersons
					}
				]
			}
		]
	},
	{
		path: '/institution_policy',
		name: 'Institutions',
		component: Institution,
	},
	{
		path: 'institution_contracts/:id',
		name: 'Add Institutions',
		component: InstitutionContracts,
	},
	{
		path: 'insured_persons/:id/:institutionUuid',
		name: 'insured persons',
		component: Insured,
	},
	{
		path: 'addInstitution/:id/:institutionUuid',
		name: 'addInstitution',
		component: AddProviderForInstitution,
	},
	
	{
		path: 'packages/:id',
		name: 'packages',
		component: Coverages,
	},	
	  {
            path: '/insured_list/detail/:insuredPersonUuid',
            name: 'Insured Person Details',
            component: InsuredDetails,
            props: true,
            // meta: {
            //   requiresAuth: true,
            //   privileges: ['create_user','View_card'],
            // }
          },
	{
		path: '/issued_policy',
		name: 'issued policy',
		component: InstitutionContractswithIssued
	},
		{
		path: '/issued_policys',
		name: 'issued policys',
		component: IssuedPolicy
	},
	{
		path: '/amend_policy',
		name: 'amend policy',
		component: AmendPolicy
	}
]