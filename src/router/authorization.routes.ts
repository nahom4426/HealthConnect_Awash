const Authorization = () => import("@/features/authorization/pages/Authorization.vue");

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