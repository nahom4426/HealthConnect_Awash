// Life Insurance routes. Life privileges don't exist in AuthService yet (backend gap G10),
// so pages only require sign-in for now; add meta.permissions once they are seeded.
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
const QuestionsList = () => import("@/features/life/pages/underwriting/QuestionsList.vue");
const QuestionEditor = () => import("@/features/life/pages/underwriting/QuestionEditor.vue");
const AnswerLibrary = () => import("@/features/life/pages/underwriting/AnswerLibrary.vue");

const lifeRoutes = [
  {
    path: "/life/products/riders",
    name: "life-riders",
    component: RidersList,
    meta: { requiresAuth: true, title: "Riders" },
  },
  {
    path: "/life/products/riders/:riderUuid",
    name: "life-rider-detail",
    component: RiderDetail,
    meta: { requiresAuth: true, title: "Rider" },
  },
  {
    path: "/life/products/group-term-rates",
    name: "life-group-term-rates",
    component: GroupTermRates,
    meta: { requiresAuth: true, title: "Group term rates" },
  },
  {
    path: "/life/products/individual-term-rates",
    name: "life-individual-term-rates",
    component: IndividualTermRates,
    meta: { requiresAuth: true, title: "Individual term rates" },
  },
  {
    path: "/life/reinsurance/treaties",
    name: "life-treaties",
    component: TreatiesList,
    meta: { requiresAuth: true, title: "Reinsurance treaties" },
  },
  {
    path: "/life/reinsurance/treaties/new",
    name: "life-treaty-new",
    component: TreatyWizard,
    meta: { requiresAuth: true, title: "New treaty" },
  },
  {
    path: "/life/reinsurance/treaties/:treatyUuid",
    name: "life-treaty-detail",
    component: TreatyDetail,
    meta: { requiresAuth: true, title: "Treaty" },
  },
  {
    path: "/life/reinsurance/reinsurers",
    name: "life-reinsurers",
    component: ReinsurersList,
    meta: { requiresAuth: true, title: "Reinsurers" },
  },
  {
    path: "/life/reinsurance/medical-tests",
    name: "life-medical-tests",
    component: MedicalTests,
    meta: { requiresAuth: true, title: "Medical tests" },
  },
  {
    path: "/life/quotations",
    name: "life-quotations",
    component: QuotationsList,
    meta: { requiresAuth: true, title: "Group quotations" },
  },
  {
    path: "/life/quotations/:quotationUuid",
    name: "life-quotation-detail",
    component: QuotationDetail,
    meta: { requiresAuth: true, title: "Quotation" },
  },
  {
    path: "/life/policies",
    name: "life-policies",
    component: PoliciesList,
    meta: { requiresAuth: true, title: "Group policies" },
  },
  {
    path: "/life/policies/:quotationUuid",
    name: "life-policy-detail",
    component: PolicyDetail,
    meta: { requiresAuth: true, title: "Policy" },
  },
  {
    path: "/life/underwriting/questions",
    name: "life-questions",
    component: QuestionsList,
    meta: { requiresAuth: true, title: "Underwriting questionnaire" },
  },
  {
    path: "/life/underwriting/questions/new",
    name: "life-question-new",
    component: QuestionEditor,
    meta: { requiresAuth: true, title: "New question" },
  },
  {
    path: "/life/underwriting/questions/:questionUuid",
    name: "life-question-edit",
    component: QuestionEditor,
    meta: { requiresAuth: true, title: "Edit question" },
  },
  {
    path: "/life/underwriting/answers",
    name: "life-answer-library",
    component: AnswerLibrary,
    meta: { requiresAuth: true, title: "Answer library" },
  },
];

export default lifeRoutes;
