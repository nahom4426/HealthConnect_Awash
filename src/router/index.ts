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
import { useBreadcrumb } from "@/stores/breadCrumbsStore";
import { useAuthStore } from "@/stores/auth";
import adminRoutes from "./admin.routes";

function addMetaToRoutes(routes) {
  return routes.map(route => {
    if (route.meta?.privilege && !route.meta.requiresAuth) {
      route.meta.requiresAuth = true;
    }

    if (route.children) {
      route.children = addMetaToRoutes(route.children);
    }

    return route;
  });
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: addMetaToRoutes([
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
  ]),
});

router.beforeEach((to, from, next) => {
  const routes = to.matched.reduce((routes, route) => {
    if (routes.find(el => el.name === route.name)) return routes;

    const routesSplit = route.path.split('/');
    const path = routesSplit.reduce((state, el) => {
      if (el.startsWith(":")) {
        const name = el.match(/:([a-zA-Z]+)/)?.[1];
        state.push(encodeURIComponent(to.params[name] || ""));
      } else {
        state.push(el);
      }
      return state;
    }, []);

    if (route.name) {
      routes.push({
        name: route.name,
        path: path.join('/'),
      });
    }

    return routes;
  }, []);

  const breadcrumb = useBreadcrumb();
  breadcrumb.breadcrumbs = routes;
  next();
});

router.beforeEach(() => {
  const auth = useAuthStore();
  const storedUser = localStorage.getItem("userDetail");
  auth.setAuth(storedUser ? JSON.parse(storedUser) : {});
});

// Enforce route permissions
router.beforeEach((to) => {
  // Collect all required permissions from matched routes
  const requiredPerms: string[] = to.matched.reduce((acc: string[], r) => {
    if (r.meta && Array.isArray((r as any).meta.permissions)) {
      acc.push(...((r as any).meta.permissions as string[]));
    }
    return acc;
  }, []);

  if (!requiredPerms.length) return true;

  const auth = useAuthStore();
  let user = auth.auth?.user as any;
  if (!user) {
    const storedUser = localStorage.getItem("userDetail");
    user = storedUser ? JSON.parse(storedUser) : {};
  }

  const privileges: string[] = Array.isArray(user?.privileges) ? user.privileges : [];

  // Super Admin or All Privileges bypass
  if (user?.roleName === 'Super Admin' || privileges.includes('All Privileges')) {
    return true;
  }

  // Check at least one required permission exists in user's ROLE_ list
  const hasAccess = requiredPerms.some((p) => privileges.includes(`ROLE_${p}`));
  if (hasAccess) return true;

  // Block access and redirect to home
  return { path: '/' };
});

export default router;
