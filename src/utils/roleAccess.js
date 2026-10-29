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
