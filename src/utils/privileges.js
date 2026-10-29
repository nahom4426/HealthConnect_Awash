import { useAuthStore } from "@/stores/auth";

/**
 * True when the signed-in user holds any of the given privileges. Same rule as the v-privilage
 * directive and the router: privileges arrive as "ROLE_<name>", and Super Admin / "All Privileges"
 * hold everything. Use it in script (computed flags, disabling actions); use v-privilage in templates
 * when an element only needs hiding.
 * @param {string | string[]} names
 */
export function hasPrivilege(names) {
  const list = Array.isArray(names) ? names : [names];
  if (!list.length) return true;
  const auth = useAuthStore();
  let user = auth.auth?.user ?? auth.auth;
  if (!user) {
    try { user = JSON.parse(localStorage.getItem("userDetail") || "null"); } catch { user = null; }
    user = user?.user ?? user;
  }
  const privileges = Array.isArray(user?.privileges) ? user.privileges : [];
  if (user?.roleName === "Super Admin" || privileges.includes("All Privileges") || privileges.includes("ROLE_All Privileges")) return true;
  return list.some((p) => privileges.includes(`ROLE_${p}`) || privileges.includes(p));
}
