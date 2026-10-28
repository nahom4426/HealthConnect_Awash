import ActiveProviders from "@/features/health/providers/pages/ActiveProviders.vue";
import AddProvider from "@/features/health/providers/pages/AddProvider.vue";
import InactiveProviders from "@/features/health/providers/pages/InactiveProviders.vue";
import ViewIssuedPolicyQuotation from "@/features/health/quotation/pages/ViewIssuedPolicyQuotation.vue";
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