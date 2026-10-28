import { computed, ref } from "vue";
import { useAuthStore } from "@/stores/auth";
import { PERMISSIONS, ROLES } from "../constants";
import { marineMockEnabled } from "../api/mockMode";

// While the mock backend is on, a "Viewing as" switch on marine pages picks the roles to try,
// so every permission path can be checked without separate accounts. Off = the real session.
const DEV_KEY = "marine.devRoles";
const devRoles = ref(readDevRoles());

function readDevRoles() {
  try {
    const v = localStorage.getItem(DEV_KEY);
    return v ? v.split(",").filter((r) => ROLES.includes(r)) : null;
  } catch {
    return null;
  }
}

export function setDevRoles(roles) {
  devRoles.value = roles?.length ? roles : null;
  try {
    if (devRoles.value) localStorage.setItem(DEV_KEY, devRoles.value.join(","));
    else localStorage.removeItem(DEV_KEY);
  } catch {
    /* per-viewer convenience only */
  }
}

/**
 * The signed-in user's Marine roles. AuthService has no Marine roles yet (backend addition), so they
 * are read from privileges named after the role ("UNDERWRITER" or "ROLE_MARINE_UNDERWRITER");
 * Super Admin and "All Privileges" get every role.
 */
export function sessionMarineRoles(user) {
  if (!user) return [];
  const privileges = [...(user.privileges ?? []), ...(user.role?.privilegeList ?? [])].map(String);
  if (user.roleName === "Super Admin" || privileges.some((p) => p.replace(/^ROLE_/, "") === "All Privileges")) return [...ROLES];
  const names = new Set(privileges.map((p) => p.replace(/^ROLE_/, "").replace(/^MARINE_/, "")));
  if (Array.isArray(user.marineRoles)) user.marineRoles.forEach((r) => names.add(r));
  return ROLES.filter((r) => names.has(r));
}

export function useMarineRoles() {
  const auth = useAuthStore();
  return computed(() => {
    if (marineMockEnabled && devRoles.value) return devRoles.value;
    const roles = sessionMarineRoles(auth.auth?.user ?? auth.auth);
    // With the mock backend and no Marine roles on the session, act as every role
    return marineMockEnabled && !roles.length ? [...ROLES] : roles;
  });
}

export function hasAnyRole(roles, needed) {
  return !needed?.length || needed.some((r) => roles.includes(r));
}

/** can('quote.create') → true when the user holds one of the roles the plan lists for it. */
export function useCan() {
  const roles = useMarineRoles();
  const can = (action) => hasAnyRole(roles.value, PERMISSIONS[action] ?? []);
  return { roles, can, devRoles };
}

/**
 * Mock backend only: who the current user is in the mock's data. A broker-only role acts as the
 * seeded broker party "Nile Insurance Brokers" (id 8), so the broker portal scoping can be tried.
 */
export function mockIdentity(roles) {
  const auth = useAuthStore();
  const u = auth.auth?.user ?? auth.auth ?? {};
  const name = [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email || "You";
  const brokerOnly = roles.length > 0 && roles.every((r) => r === "BROKER");
  return { name: brokerOnly ? "Dawit Bekele (Nile Insurance Brokers)" : name, brokerPartyId: brokerOnly ? "8" : null };
}

/** The broker party a broker-only user acts for: the session's party, or the mock's seeded broker. */
export function brokerPartyId(roles) {
  const brokerOnly = roles.length > 0 && roles.every((r) => r === "BROKER");
  if (!brokerOnly) return null;
  if (marineMockEnabled) return mockIdentity(roles).brokerPartyId;
  const auth = useAuthStore();
  const u = auth.auth?.user ?? auth.auth ?? {};
  return u.brokerPartyId ?? u.partyId ?? null;
}
