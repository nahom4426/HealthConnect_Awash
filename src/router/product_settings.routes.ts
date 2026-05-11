import Coverages from "@/features/product_settings/pages/Coverages.vue";
import ShowRates from "@/features/product_settings/pages/ShowRates.vue";

export default [
	{
		path: '/benefits',
		name: 'Benefits',
		component: Coverages,
		meta: { requiresAuth: true, permissions:["Benefits"] },
	},
	{
		path: '/show-rates/:packageUuid',
		name: 'show-rates',
		component: ShowRates
	}
]