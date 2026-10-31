import { RouterView } from "vue-router";
const Privileges = () => import("@/features/shared/admin/privilege/pages/Privileges.vue");
const AddPrivilege = () => import("@/features/shared/admin/privilege/pages/AddPrivilege.vue");
const EditPrivilege = () => import("@/features/shared/admin/privilege/pages/EditPrivilege.vue");
const Role = () => import("@/features/shared/admin/role/pages/Role.vue");
const AddRole = () => import("@/features/shared/admin/role/pages/AddRole.vue");
const EditRole = () => import("@/features/shared/admin/role/pages/EditRole.vue");
const RoleDetail = () => import("@/features/shared/admin/role/pages/RoleDetail.vue");
const Users = () => import("@/features/shared/admin/user/pages/Users.vue");
const AddUser = () => import("@/features/shared/admin/user/pages/AddUser.mdl.vue");
const EditUser = () => import("@/features/shared/admin/user/pages/EditUser.vue");
const UserDetail = () => import("@/features/shared/admin/user/pages/UserDetail.vue");
const Branches = () => import("@/features/shared/admin/branch/pages/Branches.vue");
const PrivilegeDetail = () => import("@/features/shared/admin/privilege/pages/PrivilegeDetail.vue");

export default [
  // Privileges routes
  {
    path: '/privileges',
    name: 'Privileges',
    component: Privileges,
    meta: { requiresAuth: true, permissions: ["read_user"] },
    // meta: {
    //   privileges: ['Manage_Privileges'],
    //   requiresAuth: true
    // }
  },
  {
    path: '/add_privilege',
    name: 'Add Privilege',
    component: AddPrivilege,
    meta: { requiresAuth: true, permissions: ["read_user"] },
    // meta: {
    //   privileges: ['Manage_Privileges'],
    //   requiresAuth: true
    // }
  },
  {
    path: '/edit_privilege/:privilegeUuid',
    name: 'Edit Privilege',
    component: EditPrivilege,
    meta: { requiresAuth: true, permissions: ["read_user"] },
    // meta: {
    //   privileges: ['Manage_Privileges'],
    //   requiresAuth: true
    // }
  },
  
  // Roles routes
  {
    path: '/roles',
    name: 'Roles',
    component: Role,
    meta: { requiresAuth: true, permissions: ["read_user"] },
  },
  {
    path: '/create-role',
    name: 'Create Role',
    component: AddRole,
    meta: { requiresAuth: true, permissions: ["read_user"] },
  },
  {
    path: '/edit_role/:roleUuid',
    name: 'Edit Role',
    component: EditRole,
    meta: { requiresAuth: true, permissions: ["read_user"] },
  },
  {
    path: '/role_detail/:roleUuid',
    name: 'Role Detail',
    component: RoleDetail,
    meta: { requiresAuth: true, permissions: ["read_user"] },
  },
  
  // Branches: directory of the insurer's branches. Writes need branch.manage on the backend;
  // the router guard lets Super Admin / All Privileges through and otherwise requires ROLE_branch.manage.
  {
    path: '/branches',
    name: 'Branches',
    component: Branches,
    meta: { requiresAuth: true, permissions: ["branch.manage"] },
  },

  // Users routes
  {
    path: '/users',
    name: 'Users',
    component: Users,
    meta: { requiresAuth: true, permissions: ["read_user"] },
    // meta: {
    //   privileges: ['Manage_Users'],
    //   requiresAuth: true
    // }
  },
  {
    path: '/add_user',
    name: 'Add User',
    component: AddUser,
    meta: { requiresAuth: true, permissions: ["read_user"] },
    // meta: {
    //   privileges: ['Manage_Users'],
    //   requiresAuth: true
    // }
  },
  {
    path: '/edit_user/:userUuid',
    name: 'Edit User',
    component: EditUser,
    meta: { requiresAuth: true, permissions: ["read_user"] },
    // meta: {
    //   privileges: ['Manage_Users'],
    //   requiresAuth: true
    // }
  },
  {
    path: '/user_detail/:userUuid',
    name: 'User Detail',
    component: () => import('@/features/shared/admin/user/pages/UserDetail.vue'),
    meta: { requiresAuth: true, permissions: ["read_user"] },
  },
  
  // Privilege routes
  {
    path: '/privilege_detail/:privilegeUuid',
    name: 'Privilege Detail',
    component: PrivilegeDetail,
    meta: { requiresAuth: true, permissions: ["read_user"] },
  },
  {
    path: '/admin/user-roles',
    name: 'Standard User & Privilege Control',
    component: () => import('@/features/shared/admin/pages/UserRoleManagement.vue'),
    // User & privilege control: signed-in admins only (Super Admin / All Privileges pass the guard)
    meta: { requiresAuth: true, permissions: ["read_user"] }
  }
];
