const Authorization = () => import("@/features/health/authorization/pages/Authorization.vue");

export default [
  {
    path: "/authorization",
    name: "Authorization",
    component: Authorization,
    meta: {
      requiresAuth: true,
      permissions: ["Authorization"],
    },
  },
];