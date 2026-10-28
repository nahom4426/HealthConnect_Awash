import MotorVehicleCategories from "@/features/motor/pages/MotorVehicleCategories.vue";
import MotorRateConfig from "@/features/motor/pages/MotorRateConfig.vue";
import MotorCarConfig from "@/features/motor/pages/MotorCarConfig.vue";
import MotorQuotation from "@/features/motor/pages/MotorQuotation.vue";
import MotorQuotationDetail from "@/features/motor/pages/MotorQuotationDetail.vue";
import MotorNewQuotation from "@/features/motor/pages/MotorNewQuotation.vue";
import MotorProposals from "@/features/motor/pages/MotorProposals.vue";
import MotorProposalDetail from "@/features/motor/pages/MotorProposalDetail.vue";
import ClaimsProcess from "@/features/motor/claims/pages/ClaimsProcess.vue";
import ClaimNew from "@/features/motor/claims/pages/ClaimNew.vue";
import ClaimDetail from "@/features/motor/claims/pages/ClaimDetail.vue";
import ClaimManagerDashboard from "@/features/motor/claims/pages/ClaimManagerDashboard.vue";
import GarageDashboard from "@/features/motor/claims/pages/GarageDashboard.vue";

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
