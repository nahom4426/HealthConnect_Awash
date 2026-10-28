// Life Insurance routes. Life privileges don't exist in AuthService yet (backend gap G10),
// so pages only require sign-in for now; add meta.permissions once they are seeded.
const RidersList = () => import("@/features/life/pages/products/RidersList.vue");
const RiderDetail = () => import("@/features/life/pages/products/RiderDetail.vue");
const GroupTermRates = () => import("@/features/life/pages/products/GroupTermRates.vue");
const IndividualTermRates = () => import("@/features/life/pages/products/IndividualTermRates.vue");

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
];

export default lifeRoutes;
