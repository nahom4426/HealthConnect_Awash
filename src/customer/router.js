import { createRouter, createWebHistory } from 'vue-router';
import { isSignedIn } from '@/customer/session';
import CustomerLayout from '@/customer/CustomerLayout.vue';

const LoginPage = () => import('@/customer/pages/LoginPage.vue');
const PoliciesPage = () => import('@/customer/pages/PoliciesPage.vue');
const ClaimForm = () => import('@/customer/pages/ClaimForm.vue');
const ClaimsPage = () => import('@/customer/pages/ClaimsPage.vue');
const ClaimDetail = () => import('@/customer/pages/ClaimDetail.vue');
const ClaimFormPrint = () => import('@/customer/pages/ClaimFormPrint.vue');

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: LoginPage, meta: { public: true } },
    {
      path: '/',
      component: CustomerLayout,
      children: [
        { path: '', redirect: '/policies' },
        { path: 'policies', name: 'policies', component: PoliciesPage },
        { path: 'policies/:policyNumber/claim', name: 'claim-new', component: ClaimForm },
        { path: 'claims', name: 'claims', component: ClaimsPage },
        { path: 'claims/:claimUuid', name: 'claim-detail', component: ClaimDetail },
        { path: 'claims/:claimUuid/form', name: 'claim-form-print', component: ClaimFormPrint },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/policies' },
  ],
  scrollBehavior: () => ({ top: 0 }),
});

router.beforeEach((to) => {
  const signedIn = isSignedIn();
  if (!to.meta.public && !signedIn) return { name: 'login', query: to.fullPath !== '/policies' ? { redirect: to.fullPath } : undefined };
  if (to.name === 'login' && signedIn) return { name: 'policies' };
  return true;
});

export default router;
