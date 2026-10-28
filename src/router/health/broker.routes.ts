// Broker management (ported from the Nyala HealthConnect app). Gated behind the
// Manages_Brokers privilege; Super Admin / All Privileges bypass as elsewhere.
// Route names double as page titles in the header.
const meta = { requiresAuth: true, permissions: ["Manages_Brokers"] };

export default [
  {
    path: "/broker/dashboard",
    name: "Broker Dashboard",
    component: () => import("@/features/health/broker_management/pages/BrokerDashboard.vue"),
    meta,
  },
  {
    path: "/brokers",
    name: "Brokers",
    component: () => import("@/features/health/broker_management/pages/BrokerList.vue"),
    meta,
  },
  {
    path: "/brokers/create",
    name: "Create Broker",
    component: () => import("@/features/health/broker_management/pages/BrokerCreate.vue"),
    meta,
  },
  {
    path: "/brokers/:id",
    name: "Broker Details",
    component: () => import("@/features/health/broker_management/pages/BrokerDetail.vue"),
    meta,
  },
  {
    path: "/brokers/:id/edit",
    name: "Edit Broker",
    component: () => import("@/features/health/broker_management/pages/BrokerEdit.vue"),
    meta,
  },
  {
    path: "/commission-rules",
    name: "Commission Rules",
    component: () => import("@/features/health/broker_management/pages/CommissionRulesList.vue"),
    meta,
  },
  {
    path: "/commissions",
    name: "Commissions",
    component: () => import("@/features/health/broker_management/pages/CommissionList.vue"),
    meta,
  },
  {
    path: "/payments",
    name: "Payments",
    component: () => import("@/features/health/broker_management/pages/PaymentProcessing.vue"),
    meta,
  },
  {
    path: "/broker/reports",
    name: "Broker Reports",
    component: () => import("@/features/health/broker_management/pages/Reports.vue"),
    meta,
  },
];
