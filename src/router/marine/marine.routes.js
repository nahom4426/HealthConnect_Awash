// Marine & Cargo routes (plan section 2). meta.marineRoles limits a page to those Marine roles;
// anyone else lands on the 403 page naming the role needed.
import { useMarineRoles, hasAnyRole } from "@/features/marine/composables/useCan";

// Pages load on demand; the glob keeps each one a separate chunk
const pages = import.meta.glob("/src/features/marine/pages/**/*.vue");
const p = (path) => pages[`/src/features/marine/pages/${path}.vue`];

const QUOTERS = ["BROKER", "UNDERWRITER", "SENIOR_UNDERWRITER"];
const UNDERWRITERS = ["UNDERWRITER", "SENIOR_UNDERWRITER"];

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
  route("/marine/dashboard", "marine-dashboard", p("Dashboard"), { title: "Dashboard" }),
  route("/marine/quotes", "marine-quotes", p("quotes/QuoteList"), { title: "Quotes" }),
  route("/marine/quotes/new", "marine-quote-new", p("quotes/QuoteWizard"), { title: "New quote", marineRoles: QUOTERS }),
  route("/marine/quotes/:id", "marine-quote", p("quotes/QuoteDetail"), { title: "Quote" }),
  route("/marine/quotes/:id/edit", "marine-quote-edit", p("quotes/QuoteWizard"), { title: "Edit quote", marineRoles: QUOTERS }),
  route("/marine/policies", "marine-policies", p("policies/PolicyList"), { title: "Policies" }),
  route("/marine/policies/:id", "marine-policy", p("policies/PolicyDetail"), { title: "Policy" }),
  route("/marine/certificates", "marine-certificates", p("certificates/CertificateList"), { title: "Certificates" }),
  route("/marine/certificates/:id", "marine-certificate", p("certificates/CertificateDetail"), { title: "Certificate" }),
  route("/marine/certificates/:id/amend", "marine-certificate-amend", p("certificates/AmendCertificate"), { title: "Amend certificate", marineRoles: UNDERWRITERS }),
  route("/marine/open-covers", "marine-open-covers", p("openCovers/OpenCoverList"), { title: "Open covers" }),
  route("/marine/open-covers/new", "marine-open-cover-new", p("openCovers/OpenCoverForm"), { title: "New open cover", marineRoles: UNDERWRITERS }),
  route("/marine/open-covers/:id", "marine-open-cover", p("openCovers/OpenCoverDetail"), { title: "Open cover" }),
  route("/marine/open-covers/:id/edit", "marine-open-cover-edit", p("openCovers/OpenCoverForm"), { title: "Edit open cover", marineRoles: UNDERWRITERS }),
  route("/marine/open-covers/:coverId/declare", "marine-declare", p("quotes/QuoteWizard"), { title: "Declare shipment", marineRoles: QUOTERS }),
  route("/marine/underwriting", "marine-underwriting", p("underwriting/ReferralQueue"), { title: "Underwriting", marineRoles: UNDERWRITERS }),
  route("/marine/underwriting/:id", "marine-referral", p("underwriting/ReferralReview"), { title: "Referral", marineRoles: UNDERWRITERS }),
  route("/marine/admin/masters", "marine-masters", p("admin/Masters"), { title: "Masters", marineRoles: ["ADMIN"] }),
  route("/marine/admin/fx-rates", "marine-fx-rates", p("admin/FxRates"), { title: "FX rates" }),
  route("/marine/admin/rate-tables", "marine-rate-tables", p("admin/RateTables"), { title: "Rate tables", marineRoles: ["ADMIN", "SENIOR_UNDERWRITER"] }),
  route("/marine/admin/rate-tables/:id", "marine-rate-table", p("admin/RateTableEditor"), { title: "Rate table", marineRoles: ["ADMIN", "SENIOR_UNDERWRITER"] }),
  route("/marine/admin/users", "marine-users", p("admin/Users"), { title: "Users", marineRoles: ["ADMIN"] }),
  route("/marine/admin/rules", "marine-rules", p("admin/Rules"), { title: "Rules", marineRoles: ["ADMIN"] }),
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
