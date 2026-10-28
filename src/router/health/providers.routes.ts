import ActiveProviders from "@/features/providers/pages/ActiveProviders.vue";
import AddProvider from "@/features/providers/pages/AddProvider.vue";
import InactiveProviders from "@/features/providers/pages/InactiveProviders.vue";
import ViewIssuedPolicyQuotation from "@/features/quotation/pages/ViewIssuedPolicyQuotation.vue";
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