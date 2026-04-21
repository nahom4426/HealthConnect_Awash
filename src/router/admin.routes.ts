import { RouterView } from "vue-router";
import Privileges from "@/features/admin/privilege/pages/Privileges.vue";
import AddPrivilege from "@/features/admin/privilege/pages/AddPrivilege.vue";
import EditPrivilege from "@/features/admin/privilege/pages/EditPrivilege.vue";
import Role from "@/features/admin/role/pages/Role.vue";
import AddRole from "@/features/admin/role/pages/AddRole.vue";
import EditRole from "@/features/admin/role/pages/EditRole.vue";
import RoleDetail from "@/features/admin/role/pages/RoleDetail.vue";
import Users from "@/features/admin/user/pages/Users.vue";
import AddUser from "@/features/admin/user/pages/AddUser.mdl.vue";
import EditUser from "@/features/admin/user/pages/EditUser.vue";
import UserDetail from "@/features/admin/user/pages/UserDetail.vue";
import PrivilegeDetail from "@/features/admin/privilege/pages/PrivilegeDetail.vue";

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
    component: () => import('@/features/admin/user/pages/UserDetail.vue'),
    meta: { requiresAuth: true, permissions: ["read_user"] },
  },
  
  // Privilege routes
  {
    path: '/privilege_detail/:privilegeUuid',
    name: 'Privilege Detail',
    component: PrivilegeDetail,
    meta: { requiresAuth: true, permissions: ["read_user"] },
  }
];
