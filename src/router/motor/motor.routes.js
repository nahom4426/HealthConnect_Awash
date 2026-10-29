const MotorVehicleCategories = () => import("@/features/motor/pages/MotorVehicleCategories.vue");
const MotorRateConfig = () => import("@/features/motor/pages/MotorRateConfig.vue");
const MotorCarConfig = () => import("@/features/motor/pages/MotorCarConfig.vue");
const MotorQuotation = () => import("@/features/motor/pages/MotorQuotation.vue");
const MotorQuotationDetail = () => import("@/features/motor/pages/MotorQuotationDetail.vue");
const MotorNewQuotation = () => import("@/features/motor/pages/MotorNewQuotation.vue");
const MotorProposals = () => import("@/features/motor/pages/MotorProposals.vue");
const MotorProposalDetail = () => import("@/features/motor/pages/MotorProposalDetail.vue");
const ClaimsProcess = () => import("@/features/motor/claims/pages/ClaimsProcess.vue");
const ClaimNew = () => import("@/features/motor/claims/pages/ClaimNew.vue");
const ClaimDetail = () => import("@/features/motor/claims/pages/ClaimDetail.vue");
const ClaimManagerDashboard = () => import("@/features/motor/claims/pages/ClaimManagerDashboard.vue");
const GarageDashboard = () => import("@/features/motor/claims/pages/GarageDashboard.vue");

const claimsRoutes = [
  {
    path: '/motor/claims/process',
    name: 'module-claims-process',
    component: ClaimsProcess,
    meta: { requiresAuth: true, roleAccess: 'claims' },
  },
  {
    path: '/motor/claims/manager',
    name: 'module-claims-manager',
    component: ClaimManagerDashboard,
    meta: { requiresAuth: true, roleAccess: 'claims' },
  },
  {
    path: '/motor/claims/garage',
    name: 'module-claims-garage',
    component: GarageDashboard,
    meta: { requiresAuth: true, roleAccess: 'claims' },
  },
  {
    path: '/motor/claims/approved',
    name: 'module-claims-approved',
    component: ClaimsProcess,
    meta: { requiresAuth: true, roleAccess: 'claims' },
  },
  {
    path: '/motor/claims/completed',
    name: 'module-claims-completed',
    component: ClaimsProcess,
    meta: { requiresAuth: true, roleAccess: 'claims' },
  },
  {
    path: '/motor/claims/new',
    name: 'module-claims-new',
    component: ClaimNew,
    meta: { requiresAuth: true, roleAccess: 'claims' },
  },
  {
    path: '/motor/claims/detail/:claimUuid',
    name: 'module-claims-detail',
    component: ClaimDetail,
    meta: { requiresAuth: true, roleAccess: 'claims' },
  },
];

const motorRoutes = [
  ...claimsRoutes,
  {
    path: '/motor/rate-config/categories',
    name: 'motor-vehicle-categories',
    component: MotorVehicleCategories,
    meta: { requiresAuth: true, roleAccess: 'productConfig' },
  },
  {
    path: '/motor/rate-config/rates',
    name: 'motor-rate-config',
    component: MotorRateConfig,
    meta: { requiresAuth: true, roleAccess: 'productConfig' },
  },
  {
    path: '/motor/car-config',
    name: 'motor-car-config',
    component: MotorCarConfig,
    meta: { requiresAuth: true, roleAccess: 'productConfig' },
  },
  {
    path: '/motor/quotation',
    name: 'motor-quotation',
    component: MotorQuotation,
    meta: { requiresAuth: true, roleAccess: 'quotation' },
  },
  {
    path: '/motor/quotation/new',
    name: 'motor-quotation-new',
    component: MotorNewQuotation,
    meta: { requiresAuth: true, roleAccess: 'quotation' },
  },
  {
    path: '/motor/quotation/:quotationUuid',
    name: 'motor-quotation-detail',
    component: MotorQuotationDetail,
    meta: { requiresAuth: true, roleAccess: 'quotation' },
  },
  {
    path: '/motor/proposals',
    name: 'motor-proposals',
    component: MotorProposals,
    meta: { requiresAuth: true, roleAccess: 'proposals' },
  },
  {
    path: '/motor/proposals/:proposalUuid',
    name: 'motor-proposal-detail',
    component: MotorProposalDetail,
    meta: { requiresAuth: true, roleAccess: 'proposals' },
  },
];

export default motorRoutes;
