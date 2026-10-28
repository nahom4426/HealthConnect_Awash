const ActiveProviders = () => import("@/features/health/providers/pages/ActiveProviders.vue");
const AddProvider = () => import("@/features/health/providers/pages/AddProvider.vue");
const InactiveProviders = () => import("@/features/health/providers/pages/InactiveProviders.vue");
const ViewIssuedPolicyQuotation = () => import("@/features/health/quotation/pages/ViewIssuedPolicyQuotation.vue");
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