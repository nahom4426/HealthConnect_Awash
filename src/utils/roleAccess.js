import { getActingRole } from "@/utils/actingRole";

/**
 * Which roles may use each area of the motor-style product modules.
 *
 * The sidebar (layouts/MainLayout.vue) hides menu items with these rules and the router
 * (router/index.js, `meta.roleAccess`) refuses the same pages, so a page hidden from
 * the menu can't be opened by typing its URL. Health pages use privileges instead
 * (`meta.permissions`).
 */
export const ROLE_ACCESS = {
  productConfig: {
    roleCodes: ["ROLE_PRODUCT_MANAGER"],
    // Life's builder route itself is guarded by Life_Product_Manage (router/life/life.routes.js)
    roleNames: ["Product Manager", "Life Product Manager"],
  },
  claims: {
    roleCodes: ["ROLE_ADJUSTOR", "ROLE_CLAIM_MANAGER", "ROLE_CUSTOMER", "ROLE_SUPER_ADMIN", "ROLE_PRODUCT_MANAGER", "ROLE_GARAGE"],
    roleNames: ["Adjustor", "Claim Manager", "Customer", "Product Manager", "Garage Partner"],
  },
  quotation: {
    roleCodes: ["ROLE_UNDERWRITER", "ROLE_PRODUCT_MANAGER", "ROLE_CUSTOMER", "ROLE_SUPER_ADMIN"],
    roleNames: ["Underwriter", "Product Manager", "Customer"],
  },
  proposals: {
    roleCodes: ["ROLE_UNDERWRITER", "ROLE_ADJUSTOR", "ROLE_PRODUCT_MANAGER", "ROLE_CUSTOMER", "ROLE_SUPER_ADMIN"],
    roleNames: ["Underwriter", "Adjustor", "Product Manager", "Customer"],
  },
};

const MANAGE_SUFFIXES = [".user.view", ".user.create", ".role.manage"];

/** The account whose legacy role is exactly Super Admin. Role name "admin" is a module admin, not this. */
export function isExactSuperAdmin(user = {}) {
  if (user?.superAdmin === true) return true;
  const roleName = String(user?.roleName || "").trim();
  const roleCode = String(user?.roleCode || user?.role || "").trim();
  return roleName === "Super Admin" || roleCode === "ROLE_SUPER_ADMIN";
}

/**
 * Modules this person may administer.
 * null means every module (Super Admin). An empty list means none.
 */
export function administeredModules(user = {}) {
  if (isExactSuperAdmin(user)) return null;
  const modules = new Set();
  const memberships = Array.isArray(user?.memberships) ? user.memberships : [];
  for (const membership of memberships) {
    const moduleType = String(membership?.moduleType || "").trim().toLowerCase();
    const roleName = String(membership?.roleName || "").trim().toLowerCase();
    if (moduleType && roleName === "admin") modules.add(moduleType);
  }
  const privileges = Array.isArray(user?.privileges) ? user.privileges : [];
  for (const raw of privileges) {
    const name = String(raw || "").replace(/^ROLE_/, "");
    if (name === "read_user" || name === "create_user") {
      modules.add("health");
      continue;
    }
    for (const suffix of MANAGE_SUFFIXES) {
      if (name.endsWith(suffix)) {
        const moduleType = name.slice(0, -suffix.length);
        if (moduleType) modules.add(moduleType);
      }
    }
  }
  return [...modules];
}

/** Launcher card and sidebar for Users, Roles, and Privileges. */
export function canOpenUserManagement(user = {}) {
  if (isExactSuperAdmin(user)) return true;
  return administeredModules(user).length > 0;
}

/** AuthService "admin" role (and Super Admin) can use every area. */
export function hasFullSystemAccess(user = {}) {
  const roleName = String(user?.roleName || "").trim().toLowerCase();
  const roleCode = String(user?.roleCode || user?.role || "").trim().toUpperCase();
  return (
    roleName === "super admin" ||
    roleName === "admin" ||
    roleCode === "ROLE_SUPER_ADMIN" ||
    roleCode === "ROLE_ADMIN" ||
    roleCode === "ADMIN"
  );
}

/** The user's role code, falling back to the acting role (demo role switcher). */
export function userRoleCode(user = {}) {
  return user?.roleCode || (typeof user?.role === "string" ? user.role : "") || getActingRole();
}

/** True when the user may use the given area (a key of ROLE_ACCESS). Unknown areas are allowed. */
export function hasRoleAccess(user, area) {
  const rule = ROLE_ACCESS[area];
  if (!rule) return true;
  const roleName = user?.roleName || "";
  const roleCode = userRoleCode(user);
  if (hasFullSystemAccess(user) || hasFullSystemAccess({ roleName, roleCode })) return true;
  return rule.roleCodes.includes(roleCode) || rule.roleNames.includes(roleName);
}

/** The area a sidebar item belongs to, from its label; null when it is open to everyone. */
export function navItemArea(name = "") {
  if (["Product Config", "Proposal Form Builder", "Rate Config"].some((k) => name.includes(k))) return "productConfig";
  if (name.includes("Claim")) return "claims";
  if (name.includes("Quotation")) return "quotation";
  if (name.includes("Proposal") && !name.includes("Builder")) return "proposals";
  return null;
}
