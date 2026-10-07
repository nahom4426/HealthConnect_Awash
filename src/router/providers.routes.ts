const ActiveProviders = () => import("@/features/providers/pages/ActiveProviders.vue");
const AddProvider = () => import("@/features/providers/pages/AddProvider.vue");
const InactiveProviders = () => import("@/features/providers/pages/InactiveProviders.vue");
const ViewIssuedPolicyQuotation = () => import("@/features/quotation/pages/ViewIssuedPolicyQuotation.vue");
export default [
	{
		path: '/add_provider',
		name: 'Add Providers',
		component: AddProvider,
		meta: { requiresAuth: true, permissions: ["Read_providers"] },
	},
	{
		path: '/active_providers',
		name: 'Active Providers',
		component: ActiveProviders,
		meta: { requiresAuth: true, permissions: ["Read_providers"] },
	},
	{
		path: '/inactive_providers',
		name: 'Inactive Providers',
		component: InactiveProviders,
		meta: { requiresAuth: true, permissions: ["Read_providers"] },
	},
	{
    path: '/providers/:payerInstitutionContractUuid/:institutionUuid',
    name: 'policy quotations',
    component: ViewIssuedPolicyQuotation
  },
]