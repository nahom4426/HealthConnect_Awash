import axios from "axios";
import { useAuthStore } from "@/stores/auth";
import { isExactSuperAdmin } from "@/utils/roleAccess";
import { lifeApiBase } from "@/features/life/api/lifeClient";

// Every service exposes the same audit endpoints under its own base path:
//   GET {base}/audit-events          paged search (page starts at 1, limit <= 200)
//   GET {base}/audit-events/verify   hash-chain check
// Both need audit.read (ROLE_audit.read) or Super Admin; anyone else gets 403.
// Plain axios (not ApiService) so a 403 does not raise a global toast: the callers decide what to show.
const host = import.meta.env.VITE_BACKEND_HOST || "";

export const AUDIT_MODULES = [
  { id: "auth", label: "Users & access (auth)", base: import.meta.env.v_API_AUTH_URI || `${host}/api/payer/auth` },
  { id: "motor", label: "Motor", base: `${host}/api/payer/motor` },
  // Same base as features/fire/api/fireApi.js (dev proxy may point it at its own host)
  { id: "property-casualty", label: "Property & casualty", base: "/api/payer/property-casualty" },
  { id: "surety", label: "Surety", base: `${host}/api/payer/surety` },
  { id: "travel", label: "Travel", base: `${host}/api/payer/travel` },
  { id: "life", label: "Life", base: lifeApiBase },
  { id: "health", label: "Health (payer)", base: `${import.meta.env.v_API_URI || `${host}/api/payer`}/claimconnect` },
];

function moduleBase(module) {
  const m = AUDIT_MODULES.find((x) => x.id === module);
  if (!m) throw new Error(`Unknown audit module: ${module}`);
  return m.base;
}

function currentUser() {
  const auth = useAuthStore();
  return auth.auth?.user ?? auth.auth ?? {};
}

function client(module) {
  const user = currentUser();
  const token = user?.token || useAuthStore().auth?.token;
  return axios.create({
    baseURL: moduleBase(module),
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

/** Same rule as the router guard: Super Admin / All Privileges, or ROLE_audit.read. */
export function canReadAudit(user = currentUser()) {
  const privileges = Array.isArray(user?.privileges) ? user.privileges : [];
  return (
    isExactSuperAdmin(user) ||
    user?.superAdmin === true ||
    privileges.includes("All Privileges") ||
    privileges.includes("ROLE_All Privileges") ||
    privileges.includes("ROLE_audit.read")
  );
}

function toResult(promise) {
  return promise
    .then((res) => ({ success: true, status: res.status, data: res.data, error: "" }))
    .catch((e) => {
      const status = e?.response?.status ?? null;
      const data = e?.response?.data;
      const msg =
        status === 403
          ? "You do not have permission to read the audit trail (requires audit.read)."
          : (data && typeof data === "object" && (data.detail || data.message || data.title)) ||
            e?.message ||
            "Request failed";
      return { success: false, status, data: null, error: msg };
    });
}

function clean(params) {
  return Object.fromEntries(
    Object.entries(params || {}).filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== "")
  );
}

/**
 * Search a service's audit events.
 * filters: { entityUuid, entityType, actorUuid, action, branchUuid, from, to, page, limit }
 * Resolves to { success, status, data: PagedResponse, error }.
 */
export function searchAuditEvents(module, filters = {}) {
  return toResult(client(module).get("/audit-events", { params: clean(filters) }));
}

/** Verify the hash chain. Resolves to { success, status, data: { valid, checked, firstBrokenSeq, problem }, error }. */
export function verifyAuditChain(module, { fromSeq, toSeq } = {}) {
  return toResult(client(module).get("/audit-events/verify", { params: clean({ fromSeq, toSeq }) }));
}

/** detail is stored as a JSON string; pretty-print it, falling back to the raw text. */
export function prettyDetail(detail) {
  if (detail == null || detail === "") return "";
  if (typeof detail !== "string") return JSON.stringify(detail, null, 2);
  try {
    return JSON.stringify(JSON.parse(detail), null, 2);
  } catch {
    return detail;
  }
}

export function formatAuditTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function formatAuditAmount(value) {
  if (value == null || value === "") return "—";
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return n.toLocaleString("en-ET", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function humanizeAction(action) {
  return String(action || "—")
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^./, (c) => c.toUpperCase());
}
