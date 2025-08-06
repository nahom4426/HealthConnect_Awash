import Institution from "@/features/pages/Institution.vue";
import AddNewPolicy from "@/features/underwriting/pages/AddNewPolicy.vue";
import AmendPolicy from "@/features/underwriting/pages/AmendPolicy.vue";
import ImportPolicy from "@/features/underwriting/pages/importPolicy.vue";
import InstitutionContractDetail from "@/features/underwriting/pages/InstitutionContractDetail.vue";
import InstitutionContractIndex from "@/features/underwriting/pages/InstitutionContractIndex.vue";
import InstitutionCoverage from "@/features/underwriting/pages/InstitutionCoverage.vue";
import InstitutionsInsuredPersons from "@/features/underwriting/pages/InstitutionsInsuredPersons.vue";
import IssuedPolicy from "@/features/underwriting/pages/IssuedPolicy.vue";
import UnderwritingIndex from "@/features/underwriting/pages/UnderwritingIndex.vue";

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
						path: 'insured_persons/:payerInstitutionContractUuid',
						name: 'Policy Holders',
						component: InstitutionsInsuredPersons
					}
				]
			}
		]
	},
	{
		path: '/import_policy',
		name: 'Add Policy Holders',
		component: Institution,
	},
	{
		path: '/issued_policy',
		name: 'issued policy',
		component: IssuedPolicy
	},
	{
		path: '/amend_policy',
		name: 'amend policy',
		component: AmendPolicy
	}
]