import MainLayout from "@/layouts/MainLayout.vue";
import HomeView from "@/views/HomeView.vue";
import RateConfigHome from "@/views/RateConfig/RateConfigHome.vue";
import RateConfigForm from "@/views/RateConfig/RateConfigForm.vue";
import ModuleLauncher from "@/views/ModuleLauncher.vue";
import ModuleDashboard from "@/views/ModuleDashboard.vue";
import { createRouter, createWebHistory, RouterView } from "vue-router";
// Health (ClaimConnect)
import quotationRoutes from "./health/quotation.routes";
import underwritingRoutes from "./health/underwriting.routes";
import quotationUnderwritingRoutes from "./health/quotationunderwriting.routes";
import claimRoutes from "./health/claim.routes";
import financeRoutes from "./health/finance.routes";
import provider_contractsRoutes from "./health/provider_contracts.routes";
import providersRoutes from "./health/providers.routes";
import product_settingsRoutes from "./health/product_settings.routes";
import authorizationRoutes from "./health/authorization.routes";
import reportsRoutes from "./health/reports.routes";
import brokerRoutes from "./health/broker.routes";
// Motor
import motorRoutes from "./motor/motor.routes";
import { installRouteLoading } from "./loading";
// Shared across products
import adminRoutes from "./shared/admin.routes";
import analyticsRoutes from "./shared/analytics.routes";
import { formBuilderRoutes } from "./shared/form_builder.routes";
import Login from "@/views/Login.vue";
import { useBreadcrumb } from "@/stores/breadCrumbsStore";
import { useAuthStore } from "@/stores/auth";
import Profile from "@/features/shared/profile/pages/profile.vue";

function hasManagesQuotationPrivilege() {
  try {
    const storedUser = localStorage.getItem("userDetail");
    if (!storedUser) return false;
    const parsedUser = JSON.parse(storedUser);
    // userDetail can be stored as { user: {...} } or as a flat user object.
    const user = parsedUser?.user ?? parsedUser;

    const normalizePrivilege = (priv) => {
      if (typeof priv !== "string" || !priv) return null;
      return priv.startsWith("ROLE_") ? priv : `ROLE_${priv}`;
    };

    const privilegesFromUser = Array.isArray(user?.privileges) ? user.privileges : [];
    const privilegesFromRole = Array.isArray(user?.role?.privilegeList)
      ? user.role.privilegeList
      : [];

    const privileges = [...privilegesFromUser, ...privilegesFromRole]
      .map(normalizePrivilege)
      .filter(Boolean);

    if (user?.roleName === "Super Admin") return true;
    if (privileges.includes("ROLE_All Privileges") || privileges.includes("All Privileges")) return true;

    return privileges.includes("ROLE_Manages_Quotation");
  } catch (e) {
    return false;
  }
}

// NOTE: We intentionally start with underwritingRoutes and then (after auth is loaded)
// swap routes dynamically in beforeEach. This prevents a wrong route set being chosen
// during cold start before login/privilege refresh completes.
const selectedUnderwritingRoutes = underwritingRoutes;

// Since we mount underwritingRoutes initially, treat that as the applied variant.
// This ensures switching to quotation removes the existing underwriting routes first.
let appliedUnderwritingVariant = "underwriting";

function flattenRouteNames(routes) {
  const names = [];
  const walk = (arr) => {
    (arr || []).forEach((r) => {
      if (r?.name) names.push(r.name);
      if (Array.isArray(r?.children)) walk(r.children);
    });
  };
  walk(routes);
  return names;
}

function applyUnderwritingVariant(router, variant) {
  const nextRoutes = variant === "quotation" ? quotationUnderwritingRoutes : underwritingRoutes;
  const prevRoutes = appliedUnderwritingVariant === "quotation" ? quotationUnderwritingRoutes : underwritingRoutes;

  // Remove previously-applied variant routes first (by name)
  if (appliedUnderwritingVariant) {
    const prevNames = flattenRouteNames(prevRoutes);
    prevNames.forEach((name) => {
      if (router.hasRoute(name)) router.removeRoute(name);
    });
  }

  // Add new variant routes under MainLayout (/app)
  nextRoutes.forEach((r) => router.addRoute("app", r));

  appliedUnderwritingVariant = variant;
  console.info(
    "[router] underwriting route set:",
    variant === "quotation" ? "quotationunderwriting.routes" : "underwriting.routes"
  );
}

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
      path: '/',
      redirect: '/login'
    },
    {
      path: '/login',
      name: 'login',
      component: Login,
      meta: { requiresAuth: false }
    },
    {
      path: "/app",
      name: "app",
      component: MainLayout,
      meta: { requiresAuth: true },
      children: [
        // Module launcher — first screen after login
        {
          path: '/module-select',
          name: 'module-select',
          component: ModuleLauncher,
          meta: { requiresAuth: true },
        },
        // Legacy home (HomeScreen via MainLayout)
        {
          path: '/home',
          name: 'home',
          component: { template: '<div></div>' },
          meta: { requiresAuth: true },
        },
        // Health insurance dashboard
        {
          path: '/dashboard',
          name: 'dashboard',
          component: HomeView,
          meta: { requiresAuth: true },
        },
        // Per-module dashboards (Motor, Fire, Marine, Life, Engineering, Liability, Burglary)
        {
          path: '/motor/dashboard',
          name: 'motor-dashboard',
          component: ModuleDashboard,
          meta: { requiresAuth: true },
        },
        {
          path: '/fire/dashboard',
          name: 'fire-dashboard',
          component: ModuleDashboard,
          meta: { requiresAuth: true },
        },
        {
          path: '/marine/dashboard',
          name: 'marine-dashboard',
          component: ModuleDashboard,
          meta: { requiresAuth: true },
        },
        {
          path: '/life/dashboard',
          name: 'life-dashboard',
          component: ModuleDashboard,
          meta: { requiresAuth: true },
        },
        {
          path: '/engineering/dashboard',
          name: 'engineering-dashboard',
          component: ModuleDashboard,
          meta: { requiresAuth: true },
        },
        {
          path: '/liability/dashboard',
          name: 'liability-dashboard',
          component: ModuleDashboard,
          meta: { requiresAuth: true },
        },
        {
          path: '/burglary/dashboard',
          name: 'burglary-dashboard',
          component: ModuleDashboard,
          meta: { requiresAuth: true },
        },
        ...motorRoutes,
        ...adminRoutes,
        ...analyticsRoutes,
        ...reportsRoutes,
        ...brokerRoutes,
        ...formBuilderRoutes,
        ...quotationRoutes,
        ...selectedUnderwritingRoutes,
        ...claimRoutes,
        ...financeRoutes,
        ...provider_contractsRoutes,
        ...providersRoutes,
        ...product_settingsRoutes,
        ...authorizationRoutes,
        {
          path: '/rate-config',
          name: 'rate-config',
          component: RateConfigHome,
          meta: { requiresAuth: true },
        },
        {
          path: '/rate-config/:typeId',
          name: 'rate-config-form',
          component: RateConfigForm,
          meta: { requiresAuth: true },
        },
        {
          path: '/profile',
          name: 'profile',
          component: Profile,
        },
        {
          path: 'catch-all',
          redirect: '/module-select',
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/login',
    },
  ]),
});

// Navigation loading indicator (registered first so it starts before the auth guard)
installRouteLoading(router);

// Consolidated beforeEach with proper authentication check
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  const breadcrumbStore = useBreadcrumb();
  
  // Initialize auth from localStorage if not already loaded
  if (!authStore.auth) {
    const storedUser = localStorage.getItem("userDetail");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        authStore.setAuth(parsedUser);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem("userDetail");
      }
    }
  }
  
  // Handle breadcrumbs
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

  breadcrumbStore.breadcrumbs = routes;
  
  // Check if route requires authentication
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  
  // Get user data from store or localStorage fallback
  let rawUser = authStore.auth?.user ?? authStore.auth;
  if (!rawUser) {
    try {
      rawUser = JSON.parse(localStorage.getItem('auth_data') || localStorage.getItem('userDetail') || 'null');
    } catch (e) {}
  }
  if (rawUser && rawUser.data) {
    rawUser = rawUser.data;
  }
  if (rawUser) {
    authStore.auth = rawUser;
  }
  const user = rawUser;
  const hasValidToken = !!(user?.token || user?.roleCode || user?.email);
  console.log('Router Auth User state:', user, 'hasValidToken:', hasValidToken);
  const hasRolePrivilege = (privilegeName) => {
    if (!user) return false;
    const privileges = Array.isArray(user?.privileges) ? user.privileges : [];
    if (user?.roleName === 'Super Admin') return true;
    if (privileges.includes('All Privileges') || privileges.includes('ROLE_All Privileges')) return true;
    return privileges.includes(`ROLE_${privilegeName}`) || privileges.includes(privilegeName);
  };

  // Dynamically swap underwriting route set after auth is available
  if (hasValidToken) {
    const privileges = Array.isArray(user?.privileges) ? user.privileges : [];
    const shouldUseQuotation =
      user?.roleName === "Super Admin" ||
      privileges.includes("All Privileges") ||
      privileges.includes("ROLE_All Privileges") ||
      privileges.includes("ROLE_Manages_Quotation");

    const desiredVariant = shouldUseQuotation ? "quotation" : "underwriting";
    if (appliedUnderwritingVariant !== desiredVariant) {
      applyUnderwritingVariant(router, desiredVariant);
      next({ ...to, replace: true });
      return;
    }
  }

  if (requiresAuth && !hasValidToken) {
    // Redirect to login if authentication is required but no token
    next('/login');
  } else if (to.path === '/login' && hasValidToken) {
    // Redirect to module selector if user is already logged in and tries to access login
    next('/module-select');
  } else {
    // Check route permissions for authenticated users
    if (hasValidToken && requiresAuth) {
      if (to?.query?.pageContext === 'amend' && !hasRolePrivilege('Update_policy')) {
        const { pageContext, ...restQuery } = to.query || {};
        next({ name: to.name, params: to.params, query: restQuery, replace: true });
        return;
      }

      const requiredPerms = to.matched.reduce((acc, r) => {
        if (r.meta && Array.isArray(r.meta.permissions)) {
          acc.push(...r.meta.permissions);
        }
        return acc;
      }, []);

      if (requiredPerms.length > 0) {
        const privileges = Array.isArray(user.privileges) ? user.privileges : [];
        
        // Super Admin or All Privileges bypass
        if (user.roleName === 'Super Admin' || privileges.includes('All Privileges')) {
          next();
          return;
        }

        // Check at least one required permission exists in user's ROLE_ list
        const hasAccess = requiredPerms.some((p) => privileges.includes(`ROLE_${p}`));
        if (!hasAccess) {
          next('/dashboard');
          return;
        }
      }
    }
    
    next();
  }
});

export default router;