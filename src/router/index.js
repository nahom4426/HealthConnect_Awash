import MainLayout from "@/layouts/MainLayout.vue";
import HomeView from "@/views/HomeView.vue";
import RateConfigHome from "@/views/RateConfig/RateConfigHome.vue";
import RateConfigForm from "@/views/RateConfig/RateConfigForm.vue";
import ModuleLauncher from "@/views/ModuleLauncher.vue";
import ModuleDashboard from "@/views/ModuleDashboard.vue";
import MotorVehicleCategories from "@/features/motor/pages/MotorVehicleCategories.vue";
import MotorRateConfig from "@/features/motor/pages/MotorRateConfig.vue";
import MotorCarConfig from "@/features/motor/pages/MotorCarConfig.vue";
import MotorQuotation from "@/features/motor/pages/MotorQuotation.vue";
import MotorQuotationDetail from "@/features/motor/pages/MotorQuotationDetail.vue";
import MotorNewQuotation from "@/features/motor/pages/MotorNewQuotation.vue";
import { createRouter, createWebHistory, RouterView } from "vue-router";
import quotationRoutes from "./quotation.routes";
import underwritingRoutes from "./underwriting.routes";
import quotationUnderwritingRoutes from "./quotationunderwriting.routes";
import claimRoutes from "./claim.routes";
import financeRoutes from "./finance.routes";
import provider_contractsRoutes from "./provider_contracts.routes";
import providersRoutes from "./providers.routes";
import product_settingsRoutes from "./product_settings.routes";
import authorizationRoutes from "./authorization.routes";
import Login from "@/views/Login.vue";
import { useBreadcrumb } from "@/stores/breadCrumbsStore";
import { useAuthStore } from "@/stores/auth";
import adminRoutes from "./admin.routes";
import analyticsRoutes from "./analytics.routes";
import Profile from "@/features/profile/pages/profile.vue";

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
        // Motor module pages
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
        ...adminRoutes,
        ...analyticsRoutes,
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
  
  // Get user data from store (after initialization)
  const user = authStore.auth?.user ?? authStore.auth;
  const hasValidToken = !!user?.token; // Token is stored in user.token
console.log('User data:', user);
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