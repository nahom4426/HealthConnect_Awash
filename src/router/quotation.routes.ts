import AcceptedQuotations from "@/features/quotation/pages/AcceptedQuotations.vue";
import CreateNewQuotaions from "@/features/quotation/pages/CreateNewQuotaions.vue";
import IssuedQuotaions from "@/features/quotation/pages/IssuedQuotaions.vue";
import NewQuotation from "@/features/quotation/pages/NewQuotation.vue";
import QuotationIndex from "@/features/quotation/pages/QuotationIndex.vue";
import SavedQuotations from "@/features/quotation/pages/SavedQuotations.vue";

export default [
	{
		path: '/new_quotation',
		name: 'Quotation',
		component: QuotationIndex,
		children: [
			{
				path: '',
				name: 'new quotation',
				component: NewQuotation
			},
			{
				path: 'generate/:institutionUuid',
				name: 'Generate Quotaion',
				component: CreateNewQuotaions
			}
		]
	},
	{
		path: '/saved_quotation',
		name: 'saved quotation',
		component: SavedQuotations
	},
	{
		path: '/issued_quotation',
		name: 'Issued quotation',
		component: IssuedQuotaions
	},
	{
		path: '/accepted_quotation',
		name: 'Accepted quotation',
		component: AcceptedQuotations
	}
]