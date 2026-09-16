import ProviderReport from '@/features/reports/pages/ProviderReport.vue';
import DynamicReport from '@/features/reports/pages/DynamicReport.vue';

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
