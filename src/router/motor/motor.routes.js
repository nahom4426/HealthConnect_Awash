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

// The digital-channel claims flow is keyed by :module so the same pages serve
// every product's /<product>/claims/* nav entries; today only motor's service backs it.
const claimsRoutes = [
  {
    path: '/:module/claims/process',
    name: 'module-claims-process',
    component: ClaimsProcess,
    meta: { requiresAuth: true },
  },
  {
    path: '/:module/claims/manager',
    name: 'module-claims-manager',
    component: ClaimManagerDashboard,
    meta: { requiresAuth: true },
  },
  {
    path: '/:module/claims/garage',
    name: 'module-claims-garage',
    component: GarageDashboard,
    meta: { requiresAuth: true },
  },
  {
    path: '/:module/claims/approved',
    name: 'module-claims-approved',
    component: ClaimsProcess,
    meta: { requiresAuth: true },
  },
  {
    path: '/:module/claims/completed',
    name: 'module-claims-completed',
    component: ClaimsProcess,
    meta: { requiresAuth: true },
  },
  {
    path: '/:module/claims/new',
    name: 'module-claims-new',
    component: ClaimNew,
    meta: { requiresAuth: true },
  },
  {
    path: '/:module/claims/detail/:claimUuid',
    name: 'module-claims-detail',
    component: ClaimDetail,
    meta: { requiresAuth: true },
  },
];

const motorRoutes = [
  ...claimsRoutes,
  {
    path: '/motor/rate-config/categories',
    name: 'motor-vehicle-categories',
    component: MotorVehicleCategories,
    meta: { requiresAuth: true },
  },
  {
    path: '/motor/rate-config/rates',
    name: 'motor-rate-config',
    component: MotorRateConfig,
    meta: { requiresAuth: true },
  },
  {
    path: '/motor/car-config',
    name: 'motor-car-config',
    component: MotorCarConfig,
    meta: { requiresAuth: true },
  },
  {
    path: '/motor/quotation',
    name: 'motor-quotation',
    component: MotorQuotation,
    meta: { requiresAuth: true },
  },
  {
    path: '/motor/quotation/new',
    name: 'motor-quotation-new',
    component: MotorNewQuotation,
    meta: { requiresAuth: true },
  },
  {
    path: '/motor/quotation/:quotationUuid',
    name: 'motor-quotation-detail',
    component: MotorQuotationDetail,
    meta: { requiresAuth: true },
  },
  {
    path: '/motor/proposals',
    name: 'motor-proposals',
    component: MotorProposals,
    meta: { requiresAuth: true },
  },
  {
    path: '/motor/proposals/:proposalUuid',
    name: 'motor-proposal-detail',
    component: MotorProposalDetail,
    meta: { requiresAuth: true },
  },
];

export default motorRoutes;
