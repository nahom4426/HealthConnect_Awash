import MainLayout from "@/layouts/MainLayout.vue";
import HomeView from "@/views/HomeView.vue";
import { createRouter, createWebHistory, RouterView } from "vue-router";
import quotationRoutes from "./quotation.routes";
import underwritingRoutes from "./underwriting.routes";
import claimRoutes from "./claim.routes";
import financeRoutes from "./finance.routes";
import provider_contractsRoutes from "./provider_contracts.routes";
import providersRoutes from "./providers.routes";
import product_settingsRoutes from "./product_settings.routes";
import Login from "@/views/Login.vue";
import { useBreadcrumb, type BreadcrumbRoutes } from "@/stores/breadCrumbsStore";
import { useAuthStore } from "@/stores/auth";
import type { LoginResponse } from "@/features/auth/authApi";
import adminRoutes from "./admin.routes";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: Login
    },
    {
      path: "",
      component: MainLayout,
      children: [
        {
          path: "",
          name: "Root",
          component: RouterView,
          children: [
            {
              path: "",
              name: "dashboard",
              component: HomeView,
            },
          ],
        },
        ...adminRoutes,
        ...quotationRoutes,
        ...underwritingRoutes,
        ...claimRoutes,
        ...financeRoutes,
        ...provider_contractsRoutes,
        ...providersRoutes,
        ...product_settingsRoutes,
      ],
    },
  ],
});

router.beforeEach((to, from, next) => {
  const routes = to.matched.reduce((routes: BreadcrumbRoutes[], route) => {
    if(routes.find(el => el.name == route.name)) return routes
    const routesSplit = route.path.split('/')
    const path = routesSplit.reduce((state: string[], el, idx) => {
      const res = el.startsWith(":")
      if(res) {
        const name = el.match(/:([a-zA-Z]+)/)?.[1]
        state.push(encodeURIComponent(to.params[name as string] as string) as string)
      } else {
        state.push(el)
      }
      return state
    }, [])
    if(route.name) {
      routes.push({
        name: route.name as string,
        path: path.join('/'),
      })
    }
    return routes
  }, [])

  const breadcrumb = useBreadcrumb()

  breadcrumb.breadcrumbs = routes
  next()
})

router.beforeEach(() => {
  const auth = useAuthStore()
  let storedUser = localStorage.getItem("userDetail");

  auth.setAuth((storedUser ? JSON.parse(storedUser) : {}) as LoginResponse)
})

export default router;
