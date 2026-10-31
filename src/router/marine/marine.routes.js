// Marine & Cargo routes (plan section 2). meta.marineRoles limits a page to those Marine roles;
// anyone else lands on the 403 page naming the role needed.
import { marineMockEnabled } from "@/features/marine/api/mockMode";
import { loadMarineMe, useMarineRoles, hasAnyRole } from "@/features/marine/composables/useCan";

// Pages load on demand; the glob keeps each one a separate chunk
const pages = import.meta.glob("/src/features/marine/pages/**/*.vue");
const p = (path) => pages[`/src/features/marine/pages/${path}.vue`];

const QUOTERS = ["BROKER", "UNDERWRITER", "SENIOR_UNDERWRITER"];
const UNDERWRITERS = ["UNDERWRITER", "SENIOR_UNDERWRITER"];
const CLAIMS = ["CLAIMS_HANDLER", "CLAIMS_MANAGER"];

async function roleGuard(to) {
  const needed = to.meta.marineRoles;
  if (!needed?.length) return true;
  // Roles come from GET /users/me. Wait for that answer before deciding, or a direct
  // link is refused while the request is still in flight.
  if (!marineMockEnabled) await loadMarineMe();
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
  route("/marine/quotes", "marine-quotes", p("quotes/QuoteList"), { title: "Quotations", declaration: false }),
  route("/marine/declarations/new", "marine-declaration-new", p("openCovers/DeclarationForm"), { title: "New declaration", marineRoles: QUOTERS }),
  route("/marine/declarations", "marine-declarations", p("quotes/QuoteList"), { title: "Declarations", declaration: true }),
  route("/marine/quotes/new", "marine-quote-new", p("quotes/QuoteWizard"), { title: "New quote", marineRoles: QUOTERS }),
  route("/marine/quotes/:quoteId/bind-open-cover", "marine-quote-bind-open-cover", p("openCovers/OpenCoverForm"), { title: "Finalise Open Cover terms", marineRoles: UNDERWRITERS }),
  route("/marine/quotes/:id/edit", "marine-quote-edit", p("quotes/QuoteWizard"), { title: "Edit quote", marineRoles: QUOTERS }),
  route("/marine/quotes/:id", "marine-quote", p("quotes/QuoteDetail"), { title: "Quote" }),
  route("/marine/policies", "marine-policies", p("policies/PolicyList"), { title: "Policies" }),
  route("/marine/policies/:id", "marine-policy", p("policies/PolicyDetail"), { title: "Policy" }),
  route("/marine/certificates", "marine-certificates", p("certificates/CertificateList"), { title: "Certificates", declaration: false }),
  route("/marine/declaration-certificates", "marine-declaration-certificates", p("certificates/CertificateList"), { title: "Declaration certificates", declaration: true }),
  route("/marine/certificates/:id/amend", "marine-certificate-amend", p("certificates/AmendCertificate"), { title: "Amend certificate", marineRoles: UNDERWRITERS }),
  route("/marine/certificates/:id", "marine-certificate", p("certificates/CertificateDetail"), { title: "Certificate" }),
  route("/marine/open-cover-applications", "marine-open-cover-applications", p("openCovers/OpenCoverApplicationList"), { title: "Open cover applications" }),
  route("/marine/open-cover-applications/new", "marine-open-cover-application-new", p("openCovers/OpenCoverApplicationForm"), { title: "New open cover application" }),
  route("/marine/open-cover-applications/:applicationId/establish", "marine-open-cover-establish", p("openCovers/OpenCoverForm"), { title: "Establish open cover", marineRoles: UNDERWRITERS }),
  route("/marine/open-cover-applications/:id/edit", "marine-open-cover-application-edit", p("openCovers/OpenCoverApplicationForm"), { title: "Edit open cover application" }),
  route("/marine/open-cover-applications/:id", "marine-open-cover-application", p("openCovers/OpenCoverApplicationDetail"), { title: "Open cover application" }),
  route("/marine/open-covers", "marine-open-covers", p("openCovers/OpenCoverList"), { title: "Open cover agreements" }),
  route("/marine/open-covers/new", "marine-open-cover-new", p("openCovers/OpenCoverForm"), { title: "New open cover", marineRoles: UNDERWRITERS }),
  route("/marine/open-covers/:coverId/declare", "marine-declare", p("openCovers/DeclarationForm"), { title: "Declare shipment", marineRoles: QUOTERS }),
  route("/marine/open-covers/:id/edit", "marine-open-cover-edit", p("openCovers/OpenCoverForm"), { title: "Edit open cover", marineRoles: UNDERWRITERS }),
  route("/marine/open-covers/:id", "marine-open-cover", p("openCovers/OpenCoverDetail"), { title: "Open cover" }),
  { path: "/marine/underwriting", redirect: { path: "/marine/quotes", query: { status: "REFERRED" } } },
  route("/marine/underwriting/:id", "marine-referral", p("underwriting/ReferralReview"), { title: "Quotation underwriting", marineRoles: UNDERWRITERS }),
  route("/marine/deadlines", "marine-deadlines", p("claims/Deadlines"), { title: "Deadlines and alerts", marineRoles: CLAIMS }),
  { path: "/marine/claims", redirect: "/marine/claims/process" },
  route("/marine/claims/new", "marine-claim-new", p("claims/RegisterClaim"), { title: "New claim", marineRoles: ["CLAIMS_HANDLER"] }),
  route("/marine/claims/process", "marine-claims-process", p("claims/ClaimList"), {
    title: "Process claims",
    claimTitle: "Process Claims",
    claimStatuses: ["REGISTERED", "SURVEYED", "RECOVERY"],
    marineRoles: CLAIMS,
  }),
  route("/marine/claims/approved", "marine-claims-approved", p("claims/ClaimList"), {
    title: "Approved claims",
    claimTitle: "Approved Claims",
    claimStatuses: ["APPROVED"],
    marineRoles: CLAIMS,
  }),
  route("/marine/claims/completed", "marine-claims-completed", p("claims/ClaimList"), {
    title: "Completed claims",
    claimTitle: "Completed Claims",
    claimStatuses: ["PAID", "CLOSED", "DECLINED"],
    marineRoles: CLAIMS,
  }),
  route("/marine/claims/:id", "marine-claim", p("claims/ClaimWorkspace"), { title: "Claim", marineRoles: CLAIMS }),
  route("/marine/admin/masters", "marine-masters", p("admin/Masters"), { title: "Masters", marineRoles: ["ADMIN"] }),
  route("/marine/admin/fx-rates", "marine-fx-rates", p("admin/FxRates"), { title: "FX rates", marineRoles: ["FINANCE"] }),
  route("/marine/admin/rate-tables", "marine-rate-tables", p("admin/RateTables"), { title: "Rate tables", marineRoles: ["ADMIN", "SENIOR_UNDERWRITER"] }),
  route("/marine/admin/rate-tables/:id", "marine-rate-table", p("admin/RateTableEditor"), { title: "Rate table", marineRoles: ["ADMIN", "SENIOR_UNDERWRITER"] }),
  route("/marine/admin/users", "marine-users", p("admin/Users"), { title: "Users", marineRoles: ["ADMIN"] }),
  route("/marine/admin/rules", "marine-rules", p("admin/Rules"), { title: "Rules", marineRoles: ["ADMIN"] }),
  route("/marine/admin/sanctions", "marine-sanctions", p("admin/Sanctions"), { title: "Sanctions list", marineRoles: ["ADMIN"] }),
  route("/marine/forbidden", "marine-forbidden", p("Forbidden"), { title: "No access" }),
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
