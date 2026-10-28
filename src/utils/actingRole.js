/**
 * The role the UI and the motor digital-channel API act with.
 *
 * - Production: always the signed-in user's own role, from the login response.
 * - Dev builds, or builds with VITE_ENABLE_ROLE_SWITCHER=true (demo/staging): the
 *   "Acting as" switcher (components/RoleSwitcher.vue) may override it for demos.
 *
 * The backend must still enforce roles itself; this only stops a production
 * browser from choosing a role it wasn't given.
 */
const DEMO_ROLE_KEY = "standard_active_testing_role";
// Keys older builds wrote; cleared on sign-in so they can't override anything
const LEGACY_KEYS = ["awash_active_testing_role", "user_role"];

export const roleSwitcherEnabled =
  import.meta.env.DEV || import.meta.env.VITE_ENABLE_ROLE_SWITCHER === "true";

function storedUser() {
  try {
    const raw = JSON.parse(localStorage.getItem("userDetail") || localStorage.getItem("auth_data") || "null");
    return raw?.user ?? raw?.data ?? raw;
  } catch {
    return null;
  }
}

/** Role code from the signed-in user's own session, e.g. "ROLE_UNDERWRITER". */
export function getSignedInRole() {
  const user = storedUser();
  if (!user) return "";
  if (typeof user.roleCode === "string" && user.roleCode) return user.roleCode;
  if (typeof user.role === "string") return user.role;
  return user.role?.roleCode || "";
}

export function getActingRole() {
  if (roleSwitcherEnabled) {
    const demo = localStorage.getItem(DEMO_ROLE_KEY);
    if (demo) return demo;
  }
  return getSignedInRole();
}

export function setActingRole(roleCode) {
  if (!roleSwitcherEnabled) return;
  localStorage.setItem(DEMO_ROLE_KEY, roleCode);
}

/** Drop any demo role chosen by a previous user of this browser. */
export function clearActingRole() {
  localStorage.removeItem(DEMO_ROLE_KEY);
  LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));
}
