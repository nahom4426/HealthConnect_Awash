const ProviderReport = () => import('@/features/health/reports/pages/ProviderReport.vue');
const DynamicReport = () => import('@/features/health/reports/pages/DynamicReport.vue');

const reportsRoutes = [
  {
    path: '/reports/provider-report',
    name: 'ProviderReport',
    component: ProviderReport,
    meta: {
      requiresAuth: true,
      permissions: ['Analytics'],
      title: 'Provider Credit Report',
    },
  },
  {
    path: '/reports/dynamic-report',
    name: 'DynamicReport',
    component: DynamicReport,
    meta: {
      requiresAuth: true,
      permissions: ['Analytics'],
      title: 'Dynamic Reports',
    },
  },
];

export default reportsRoutes;
