const Settings = () => import("@/features/health/settings/pages/Settings.vue");

export default [
	{
		path: '/health/settings',
		name: 'health settings',
		component: Settings,
		meta: { requiresAuth: true },
	},
];
