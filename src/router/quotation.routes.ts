import AcceptedQuotations from "@/features/quotation/pages/AcceptedQuotations.vue";
import CreateNewQuotaions from "@/features/quotation/pages/CreateNewQuotaions.vue";
import IssuedQuotaions from "@/features/quotation/pages/IssuedQuotaions.vue";
import NewQuotation from "@/features/quotation/pages/NewQuotation.vue";
import QuotationIndex from "@/features/quotation/pages/QuotationIndex.vue";
import SavedQuotations from "@/features/quotation/pages/SavedQuotations.vue";
import EditQuotation from "@/features/quotation/pages/EditQuotation.vue";
import ViewIssuedQuotation from "@/features/quotation/pages/ViewIssuedQuotation.vue";
import ViewAcceptedQuotation from "@/features/quotation/pages/ViewAcceptedQuotation.vue";
import ViewSavedQuotation from "@/features/quotation/pages/ViewSavedQuotation.vue";

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
		path: '/saved_quotation/view/:quotationUuid',
		name: 'ViewSavedQuotation',
		component: ViewSavedQuotation,
	},
	{
		path: '/quotations/edit/:quotationUuid',
		name: 'Edit quotation',
		component: EditQuotation
	},
	{
		path: '/issued_quotation',
		name: 'Issued quotation',
		component: IssuedQuotaions
	},
	{
		path: '/quotations/view/:quotationUuid',
		name: 'ViewIssuedQuotation',
		component: ViewIssuedQuotation,
	},
	{
		path: '/accepted_quotation',
		name: 'Accepted quotation',
		component: AcceptedQuotations
	},
	{
		path: '/accepted_quotation/view/:quotationUuid',
		name: 'ViewAcceptedQuotation',
		component: ViewAcceptedQuotation,
	}
]