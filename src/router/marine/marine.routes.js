// Marine & Cargo routes (plan section 2). meta.marineRoles limits a page to those Marine roles;
// anyone else lands on the 403 page naming the role needed. Phase 2 adds the dashboard, so until
// then the module's dashboard opens the quote list.
import { useMarineRoles, hasAnyRole } from "@/features/marine/composables/useCan";

// Pages load on demand; the glob keeps each one a separate chunk
const pages = import.meta.glob("/src/features/marine/pages/**/*.vue");
const p = (path) => pages[`/src/features/marine/pages/${path}.vue`];

const QUOTERS = ["BROKER", "UNDERWRITER", "SENIOR_UNDERWRITER"];

function roleGuard(to) {
  const needed = to.meta.marineRoles;
  if (!needed?.length) return true;
  const roles = useMarineRoles();
  if (hasAnyRole(roles.value, needed)) return true;
  return { name: "marine-forbidden", query: { roles: needed.join(","), from: to.fullPath } };
}

const route = (path, name, component, meta = {}) => ({
  path,
  name,
  component,
  meta: { requiresAuth: true, ...meta },
  beforeEnter: roleGuard,
});

export const marineRoutes = [
  { path: "/marine/dashboard", name: "marine-dashboard", redirect: "/marine/quotes" },
  route("/marine/quotes", "marine-quotes", p("quotes/QuoteList"), { title: "Quotes" }),
  route("/marine/quotes/new", "marine-quote-new", p("quotes/QuoteWizard"), { title: "New quote", marineRoles: QUOTERS }),
  route("/marine/quotes/:id", "marine-quote", p("quotes/QuoteDetail"), { title: "Quote" }),
  route("/marine/quotes/:id/edit", "marine-quote-edit", p("quotes/QuoteWizard"), { title: "Edit quote", marineRoles: QUOTERS }),
  route("/marine/policies", "marine-policies", p("policies/PolicyList"), { title: "Policies" }),
  route("/marine/policies/:id", "marine-policy", p("policies/PolicyDetail"), { title: "Policy" }),
  route("/marine/certificates", "marine-certificates", p("certificates/CertificateList"), { title: "Certificates" }),
  route("/marine/certificates/:id", "marine-certificate", p("certificates/CertificateDetail"), { title: "Certificate" }),
  route("/marine/admin/masters", "marine-masters", p("admin/Masters"), { title: "Masters", marineRoles: ["ADMIN"] }),
  route("/marine/admin/fx-rates", "marine-fx-rates", p("admin/FxRates"), { title: "FX rates" }),
  route("/marine/admin/rate-tables", "marine-rate-tables", p("admin/RateTables"), { title: "Rate tables", marineRoles: ["ADMIN", "SENIOR_UNDERWRITER"] }),
  route("/marine/admin/rate-tables/:id", "marine-rate-table", p("admin/RateTableEditor"), { title: "Rate table", marineRoles: ["ADMIN", "SENIOR_UNDERWRITER"] }),
  route("/marine/admin/users", "marine-users", p("admin/Users"), { title: "Users", marineRoles: ["ADMIN"] }),
  route("/marine/forbidden", "marine-forbidden", p("Forbidden"), { title: "No access" }),
  route("/marine/:pathMatch(.*)*", "marine-not-found", p("NotFound"), { title: "Not found" }),
];

/** Public certificate check, opened by scanning the QR code: no sign-in, no app shell (plan 5.7). */
export const marinePublicRoutes = [
  {
    path: "/verify/:token",
    name: "marine-verify",
    component: p("verify/VerifyCertificate"),
    meta: { requiresAuth: false, public: true, title: "Verify certificate" },
  },
];
