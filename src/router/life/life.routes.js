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
];

export default lifeRoutes;
