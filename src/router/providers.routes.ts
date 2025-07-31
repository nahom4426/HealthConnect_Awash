import ActiveProviders from "@/features/providers/pages/ActiveProviders.vue";
import AddProvider from "@/features/providers/pages/AddProvider.vue";
import InactiveProviders from "@/features/providers/pages/InactiveProviders.vue";

export default [
	{
		path: '/add_provider',
		name: 'add providers',
		component: AddProvider
	},
	{
		path: '/active_providers',
		name: 'active providers',
		component: ActiveProviders
	},
	{
		path: '/inactive_providers',
		name: 'inactive providers',
		component: InactiveProviders
	},
]