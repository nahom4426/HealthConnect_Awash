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
import PaidQuotations from "@/features/quotation/pages/PaidQuotations.vue";
import InclusionCreate from "@/features/quotation/pages/InclusionCreate.vue";
import Inclusion from "@/features/quotation/pages/Inclusion.vue";

export default [
	{
		path: '/new_quotation',
		name: 'Quotation',
		component: QuotationIndex,
		//  meta: { requiresAuth: true, permissions: ["Manages_Quotation"] },
		children: [
			{
				path: '',
				name: 'new quotation',
				component: NewQuotation,
				//  meta: { requiresAuth: true, permissions: ["Manages_Quotation"] },
			},
			{
				path: 'generate/:institutionUuid',
				name: 'Generate Quotaion',
				component: CreateNewQuotaions,
				//  meta: { requiresAuth: true, permissions: ["Manages_Quotation"] },
			}
		]
	},
	{
		path: '/saved_quotation',
		name: 'saved quotation',
		component: SavedQuotations,
		//  meta: { requiresAuth: true, permissions: ["Manages_Quotation"] },
	},
	{
		path: '/saved_quotation/view/:quotationUuid/:institutionId',
		name: 'ViewSavedQuotation',
		component: ViewSavedQuotation,
		//  meta: { requiresAuth: true, permissions: ["Manages_Quotation"] },
	},
	{
		path: '/quotations/edit/:quotationUuid',
		name: 'Edit quotation',
		component: EditQuotation,
		//  meta: { requiresAuth: true, permissions: ["Manages_Quotation"] },
	},
	{
		path: '/issued_quotation',
		name: 'Issued quotation',
		component: IssuedQuotaions,
		//  meta: { requiresAuth: true, permissions: ["Manages_Quotation"] },
	},
	{
		path: '/quotations/view/:quotationUuid',
		name: 'ViewIssuedQuotation',
		component: ViewIssuedQuotation,
		//  meta: { requiresAuth: true, permissions: ["Manages_Quotation"] },
	},
	{
		path: '/accepted_quotation',
		name: 'Accepted quotation',
		component: AcceptedQuotations,
		//  meta: { requiresAuth: true, permissions: ["Manages_Quotation"] },
	},
	{
		path: '/accepted_quotation/view/:quotationUuid',
		name: 'ViewAcceptedQuotation',
		component: ViewAcceptedQuotation,
		//  meta: { requiresAuth: true, permissions: ["Manages_Quotation"] },
	},
	{
		path: '/paid_quotation',
		name: 'Paid quotation',
		component: PaidQuotations,
		//  meta: { requiresAuth: true, permissions: ["Manages_Quotation"] },
	},
	{
		path: '/inclusion',
		name: 'Inclusion',
		component: Inclusion,
		//  meta: { requiresAuth: true, permissions: ["Manages_Quotation"] },
	},
	{
		path: '/inclusion/create/:quotationUuid/:payerInstitutionContractUuid',
		name: 'InclusionCreate',
		component: InclusionCreate,
		//  meta: { requiresAuth: true, permissions: ["Manages_Quotation"] },
	}
]