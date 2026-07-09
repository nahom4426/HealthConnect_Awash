export default [
  {
    path: '/broker/dashboard',
    name: 'Broker Dashboard',
    component: () => import('@/features/broker_management/pages/BrokerDashboard.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/brokers',
    name: 'BrokerList',
    component: () => import('@/features/broker_management/pages/BrokerList.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/brokers/create',
    name: 'BrokerCreate',
    component: () => import('@/features/broker_management/pages/BrokerCreate.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/brokers/:id',
    name: 'BrokerDetail',
    component: () => import('@/features/broker_management/pages/BrokerDetail.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/brokers/:id/edit',
    name: 'BrokerEdit',
    component: () => import('@/features/broker_management/pages/BrokerEdit.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/commission-rules',
    name: 'CommissionRules',
    component: () => import('@/features/broker_management/pages/CommissionRulesList.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/commissions',
    name: 'CommissionList',
    component: () => import('@/features/broker_management/pages/CommissionList.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/payments',
    name: 'PaymentProcessing',
    component: () => import('@/features/broker_management/pages/PaymentProcessing.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/broker/reports',
    name: 'BrokerReports',
    component: () => import('@/features/broker_management/pages/Reports.vue'),
    meta: { requiresAuth: true },
  }
];