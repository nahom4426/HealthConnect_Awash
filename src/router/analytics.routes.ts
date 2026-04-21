import Analytics from '@/features/analytics/pages/Analytics.vue';

const analyticsRoutes = [
  {
    path: '/analytics',
    name: 'Analytics',
    component: Analytics,
    meta: {
      requiresAuth: true,
      permissions: ['Read_claims', 'Read_policies'],
      title: 'Analytics Dashboard',
    },
  },
];

export default analyticsRoutes;
