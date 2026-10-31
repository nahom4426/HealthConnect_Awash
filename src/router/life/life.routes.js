// Life Insurance routes. Life privileges don't exist in AuthService yet (backend gap G10),
// so pages only require sign-in for now; add meta.permissions once they are seeded.
import { lifePermissions } from "@/features/life/privileges";
const RidersList = () => import("@/features/life/pages/products/RidersList.vue");
const RiderDetail = () => import("@/features/life/pages/products/RiderDetail.vue");
const GroupTermRates = () => import("@/features/life/pages/products/GroupTermRates.vue");
const IndividualTermRates = () => import("@/features/life/pages/products/IndividualTermRates.vue");
const TreatiesList = () => import("@/features/life/pages/reinsurance/TreatiesList.vue");
const TreatyWizard = () => import("@/features/life/pages/reinsurance/TreatyWizard.vue");
const TreatyDetail = () => import("@/features/life/pages/reinsurance/TreatyDetail.vue");
const ReinsurersList = () => import("@/features/life/pages/reinsurance/ReinsurersList.vue");
const MedicalTests = () => import("@/features/life/pages/reinsurance/MedicalTests.vue");
const QuotationsList = () => import("@/features/life/pages/quotations/QuotationsList.vue");
const QuotationDetail = () => import("@/features/life/pages/quotations/QuotationDetail.vue");
const PoliciesList = () => import("@/features/life/pages/policies/PoliciesList.vue");
const PolicyDetail = () => import("@/features/life/pages/policies/PolicyDetail.vue");
const ClaimsQueue = () => import("@/features/life/pages/claims/ClaimsQueue.vue");
const NewClaim = () => import("@/features/life/pages/claims/NewClaim.vue");
const ClaimDetail = () => import("@/features/life/pages/claims/ClaimDetail.vue");
const IndividualPoliciesList = () => import("@/features/life/pages/individual/IndividualPoliciesList.vue");
const IndividualPolicyForm = () => import("@/features/life/pages/individual/IndividualPolicyForm.vue");
const IndividualPolicyDetail = () => import("@/features/life/pages/individual/IndividualPolicyDetail.vue");
// The shared proposal form builder, opened for Life with Life privileges instead of the Motor-style
// productConfig role rule that guards /form-builder/:productId for the other products
const FormBuilderEditor = () => import("@/features/shared/form_builder/pages/FormBuilderEditor.vue");
const QuestionsList = () => import("@/features/life/pages/underwriting/QuestionsList.vue");
const QuestionEditor = () => import("@/features/life/pages/underwriting/QuestionEditor.vue");
const AnswerLibrary = () => import("@/features/life/pages/underwriting/AnswerLibrary.vue");

// Life privileges: our Life_* names plus the backend life.* codes each stands for (features/life/privileges.js).
// The router lets a user in when they hold any one of a route's privileges. Super Admin and
// "All Privileges" pass everywhere (router/index.js).
const P = {
  PRODUCTS: lifePermissions(["Life_Product_Manage", "Life_Rate_Manage"]),
  REINSURANCE: lifePermissions(["Life_Reinsurance_Manage"]),
  QUOTATIONS: lifePermissions(["Life_Quotation_Create", "Life_Quotation_Issue", "Life_Payment_Record", "Life_Policy_Issue"]),
  POLICIES: lifePermissions(["Life_Policy_Issue", "Life_Policy_Service", "Life_Reinsurance_Manage", "Life_Report_View"]),
  INDIVIDUAL: lifePermissions(["Life_Quotation_Create", "Life_Policy_Issue", "Life_Policy_Service"]),
  UNDERWRITING: lifePermissions(["Life_Underwriting_Decide"]),
  CLAIM_AGENCY: lifePermissions(["Life_Claim_Prepare"]),
  CLAIM_DESK: lifePermissions(["Life_Claim_Review", "Life_Claim_Approve", "Life_Claim_Authorize", "Life_Claim_Pay"]),
  CLAIM_ANY: lifePermissions(["Life_Claim_Prepare", "Life_Claim_Review", "Life_Claim_Approve", "Life_Claim_Authorize", "Life_Claim_Pay"]),
};

const lifeRoutes = [
  {
    path: "/form-builder/:productId(life)",
    name: "life-form-builder",
    component: FormBuilderEditor,
    meta: { requiresAuth: true, permissions: P.PRODUCTS, title: "Life proposal form builder" },
  },
  {
    path: "/life/products/riders",
    name: "life-riders",
    component: RidersList,
    meta: { requiresAuth: true, permissions: P.PRODUCTS, title: "Riders" },
  },
  {
    path: "/life/products/riders/:riderUuid",
    name: "life-rider-detail",
    component: RiderDetail,
    meta: { requiresAuth: true, permissions: P.PRODUCTS, title: "Rider" },
  },
  {
    path: "/life/products/group-term-rates",
    name: "life-group-term-rates",
    component: GroupTermRates,
    meta: { requiresAuth: true, permissions: P.PRODUCTS, title: "Group term rates" },
  },
  {
    path: "/life/products/individual-term-rates",
    name: "life-individual-term-rates",
    component: IndividualTermRates,
    meta: { requiresAuth: true, permissions: P.PRODUCTS, title: "Individual term rates" },
  },
  {
    path: "/life/reinsurance/treaties",
    name: "life-treaties",
    component: TreatiesList,
    meta: { requiresAuth: true, permissions: P.REINSURANCE, title: "Reinsurance treaties" },
  },
  {
    path: "/life/reinsurance/treaties/new",
    name: "life-treaty-new",
    component: TreatyWizard,
    meta: { requiresAuth: true, permissions: P.REINSURANCE, title: "New treaty" },
  },
  {
    path: "/life/reinsurance/treaties/:treatyUuid",
    name: "life-treaty-detail",
    component: TreatyDetail,
    meta: { requiresAuth: true, permissions: P.REINSURANCE, title: "Treaty" },
  },
  {
    path: "/life/reinsurance/reinsurers",
    name: "life-reinsurers",
    component: ReinsurersList,
    meta: { requiresAuth: true, permissions: P.REINSURANCE, title: "Reinsurers" },
  },
  {
    path: "/life/reinsurance/medical-tests",
    name: "life-medical-tests",
    component: MedicalTests,
    meta: { requiresAuth: true, permissions: P.REINSURANCE, title: "Medical tests" },
  },
  {
    path: "/life/quotations",
    name: "life-quotations",
    component: QuotationsList,
    meta: { requiresAuth: true, permissions: P.QUOTATIONS, title: "Group quotations" },
  },
  {
    path: "/life/quotations/:quotationUuid",
    name: "life-quotation-detail",
    component: QuotationDetail,
    meta: { requiresAuth: true, permissions: P.QUOTATIONS, title: "Quotation" },
  },
  {
    path: "/life/policies",
    name: "life-policies",
    component: PoliciesList,
    meta: { requiresAuth: true, permissions: P.POLICIES, title: "Group policies" },
  },
  {
    path: "/life/policies/:quotationUuid",
    name: "life-policy-detail",
    component: PolicyDetail,
    meta: { requiresAuth: true, permissions: P.POLICIES, title: "Policy" },
  },
  {
    path: "/life/claims/new",
    name: "life-claim-new",
    component: NewClaim,
    meta: { requiresAuth: true, permissions: P.CLAIM_AGENCY, title: "New claim" },
  },
  {
    path: "/life/claims/agency",
    name: "life-claims-agency",
    component: ClaimsQueue,
    meta: { requiresAuth: true, permissions: P.CLAIM_AGENCY, title: "Agency claims", side: "agency" },
  },
  {
    path: "/life/claims/insurance",
    name: "life-claims-insurance",
    component: ClaimsQueue,
    meta: { requiresAuth: true, permissions: P.CLAIM_DESK, title: "Claims desk", side: "insurance" },
  },
  {
    path: "/life/claims/:claimUuid",
    name: "life-claim-detail",
    component: ClaimDetail,
    meta: { requiresAuth: true, permissions: P.CLAIM_ANY, title: "Claim" },
  },
  {
    path: "/life/individual",
    name: "life-individual",
    component: IndividualPoliciesList,
    meta: { requiresAuth: true, permissions: P.INDIVIDUAL, title: "Individual policies" },
  },
  {
    path: "/life/individual/new",
    name: "life-individual-new",
    component: IndividualPolicyForm,
    meta: { requiresAuth: true, permissions: P.INDIVIDUAL, title: "New individual policy" },
  },
  {
    path: "/life/individual/:benefitUuid",
    name: "life-individual-detail",
    component: IndividualPolicyDetail,
    meta: { requiresAuth: true, permissions: P.INDIVIDUAL, title: "Individual policy" },
  },
  {
    path: "/life/individual/:benefitUuid/edit",
    name: "life-individual-edit",
    component: IndividualPolicyForm,
    meta: { requiresAuth: true, permissions: P.INDIVIDUAL, title: "Edit individual policy" },
  },
  {
    path: "/life/underwriting/questions",
    name: "life-questions",
    component: QuestionsList,
    meta: { requiresAuth: true, permissions: P.UNDERWRITING, title: "Underwriting questionnaire" },
  },
  {
    path: "/life/underwriting/questions/new",
    name: "life-question-new",
    component: QuestionEditor,
    meta: { requiresAuth: true, permissions: P.UNDERWRITING, title: "New question" },
  },
  {
    path: "/life/underwriting/questions/:questionUuid",
    name: "life-question-edit",
    component: QuestionEditor,
    meta: { requiresAuth: true, permissions: P.UNDERWRITING, title: "Edit question" },
  },
  {
    path: "/life/underwriting/answers",
    name: "life-answer-library",
    component: AnswerLibrary,
    meta: { requiresAuth: true, permissions: P.UNDERWRITING, title: "Answer library" },
  },
];

export default lifeRoutes;
