const AcceptedQuotations = () => import("@/features/quotation/pages/AcceptedQuotations.vue");
const CreateNewQuotaions = () => import("@/features/quotation/pages/CreateNewQuotaions.vue");
const IssuedQuotaions = () => import("@/features/quotation/pages/IssuedQuotaions.vue");
const NewQuotation = () => import("@/features/quotation/pages/NewQuotation.vue");
const QuotationIndex = () => import("@/features/quotation/pages/QuotationIndex.vue");
const SavedQuotations = () => import("@/features/quotation/pages/SavedQuotations.vue");
const EditQuotation = () => import("@/features/quotation/pages/EditQuotation.vue");
const ViewIssuedQuotation = () => import("@/features/quotation/pages/ViewIssuedQuotation.vue");
const ViewAcceptedQuotation = () => import("@/features/quotation/pages/ViewAcceptedQuotation.vue");
const ViewSavedQuotation = () => import("@/features/quotation/pages/ViewSavedQuotation.vue");
const PaidQuotations = () => import("@/features/quotation/pages/PaidQuotations.vue");
const InclusionCreate = () => import("@/features/quotation/pages/InclusionCreate.vue");
const Inclusion = () => import("@/features/quotation/pages/Inclusion.vue");

const CreateIndividualQuotation = () => import("@/features/quotation/pages/CreateIndividualQuotation.vue");

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
			},
			{
				path: 'individual/:insuredUuid',
				name: 'Generate Individual Quotation',
				component: CreateIndividualQuotation,
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