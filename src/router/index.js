import MainLayout from "@/layouts/MainLayout.vue";
import HomeView from "@/views/HomeView.vue";
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
import Settings from "@/features/settings/pages/Settings.vue";

function hasManagesQuotationPrivilege() {
  try {
    const storedUser = localStorage.getItem("userDetail");
    if (!storedUser) return false;
    const parsedUser = JSON.parse(storedUser);
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

const selectedUnderwritingRoutes = underwritingRoutes;
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

  if (appliedUnderwritingVariant) {
    const prevNames = flattenRouteNames(prevRoutes);
    prevNames.forEach((name) => {
      if (router.hasRoute(name)) router.removeRoute(name);
    });
  }

  nextRoutes.forEach((r) => router.addRoute("app", r));
  appliedUnderwritingVariant = variant;
  console.info(
    "[router] underwriting route set:",
    variant === "quotation" ? "quotationunderwriting.routes" : "underwriting.routes"
  );
}

function addMetaToRoutes(routes) {
  return routes.map(route => {
    if (route.meta?.permissions && !route.meta.requiresAuth) {
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
      path: '/dashboard',
      name: 'dashboard',
      component: MainLayout,
      children: [
        {
          path: '',
          name: 'Dashboard',
          component: HomeView,
          meta: { requiresAuth: true }
        }
      ],
      meta: { requiresAuth: true }
    },
    {
      path: "/app",
      name: "app",
      component: MainLayout,
      meta: { requiresAuth: true },
      children: [
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
          path: '/profile',
          name: 'profile',
          component: Profile,
        },
        {
          path: '/settings',
          name: 'settings',
          component: Settings,
          meta: { requiresAuth: true },
        },
        {
          path: ':pathMatch(.*)*',
          redirect: '/dashboard',
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/login',
    },
  ]),
});

// Helper function to check if user has a specific privilege
function hasPrivilege(user, privilegeName) {
  if (!user) return false;
  const privileges = Array.isArray(user?.privileges) ? user.privileges : [];
  if (user?.roleName === 'Super Admin') return true;
  if (privileges.includes('All Privileges') || privileges.includes('ROLE_All Privileges')) return true;
  return privileges.includes(`ROLE_${privilegeName}`) || privileges.includes(privilegeName);
}

// Helper to check if user has ALL required privileges (AND logic)
function hasAllPrivileges(user, requiredPrivileges) {
  if (!requiredPrivileges || requiredPrivileges.length === 0) return true;
  if (!user) return false;
  const privileges = Array.isArray(user?.privileges) ? user.privileges : [];
  if (user?.roleName === 'Super Admin') return true;
  if (privileges.includes('All Privileges') || privileges.includes('ROLE_All Privileges')) return true;
  return requiredPrivileges.every(priv => hasPrivilege(user, priv));
}

// Helper to check if user has ANY required privileges (OR logic)
function hasAnyPrivilege(user, requiredPrivileges) {
  if (!requiredPrivileges || requiredPrivileges.length === 0) return true;
  if (!user) return false;
  const privileges = Array.isArray(user?.privileges) ? user.privileges : [];
  if (user?.roleName === 'Super Admin') return true;
  if (privileges.includes('All Privileges') || privileges.includes('ROLE_All Privileges')) return true;
  return requiredPrivileges.some(priv => hasPrivilege(user, priv));
}

// Consolidated beforeEach with proper authentication check
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  const breadcrumbStore = useBreadcrumb();
  
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
  
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const user = authStore.auth?.user ?? authStore.auth;
  const hasValidToken = !!user?.token;

  // Dynamically swap underwriting route set after auth is available
  if (hasValidToken) {
    const hasManagesQuotation = hasPrivilege(user, "Manages_Quotation");
    const desiredVariant = hasManagesQuotation ? "quotation" : "underwriting";
    if (appliedUnderwritingVariant !== desiredVariant) {
      applyUnderwritingVariant(router, desiredVariant);
      next({ ...to, replace: true });
      return;
    }
  }

  if (requiresAuth && !hasValidToken) {
    next('/login');
    return;
  }
  
  if (to.path === '/login' && hasValidToken) {
    next('/dashboard');
    return;
  }

  // Check route permissions for authenticated users
  if (hasValidToken && requiresAuth) {
    // Collect all permissions from route and its children
    const requiredPerms = to.matched.reduce((acc, record) => {
      if (record.meta?.permissions && Array.isArray(record.meta.permissions)) {
        acc.push(...record.meta.permissions);
      }
      return acc;
    }, []);

    // If route requires permissions, check them
    if (requiredPerms.length > 0) {
      const privileges = Array.isArray(user.privileges) ? user.privileges : [];
      
      // Super Admin or All Privileges bypass
      if (user.roleName === 'Super Admin' || privileges.includes('All Privileges')) {
        next();
        return;
      }

      // Check if user has ALL required permissions for the route
      const hasAccess = hasAllPrivileges(user, requiredPerms);
      
      if (!hasAccess) {
        // Check if route is under "Quotation Underwriting" or "Underwriting" section
        // and apply appropriate logic
        const isQuotationUnderwriting = to.matched.some(record => 
          record.name?.toString().startsWith('QuotationUnderwriting')
        );
        const isUnderwriting = to.matched.some(record => 
          record.name?.toString().startsWith('Underwriting') || 
          record.name?.toString() === 'UnderwritingMain'
        );

        // For Quotation Underwriting routes, user needs Manages_Quotation
        if (isQuotationUnderwriting && !hasPrivilege(user, "Manages_Quotation")) {
          next('/dashboard');
          return;
        }

        // For Underwriting routes, check if user has ANY of the required permissions
        if (isUnderwriting) {
          const hasAnyAccess = hasAnyPrivilege(user, requiredPerms);
          if (!hasAnyAccess) {
            next('/dashboard');
            return;
          }
        } else {
          // For other routes, use strict AND logic
          next('/dashboard');
          return;
        }
      }
    }
  }
  
  next();
});

export default router;