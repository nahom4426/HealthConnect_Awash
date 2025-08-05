import { RouterView } from "vue-router";
import Privileges from "@/features/admin/privilege/pages/Privileges.vue";
import AddPrivilege from "@/features/admin/privilege/pages/AddPrivilege.vue";
import EditPrivilege from "@/features/admin/privilege/pages/EditPrivilege.vue";
import Role from "@/features/admin/role/pages/Role.vue";
import AddRole from "@/features/admin/role/pages/AddRole.vue";
import EditRole from "@/features/admin/role/pages/EditRole.vue";
import Users from "@/features/admin/user/pages/Users.vue";
import AddUser from "@/features/admin/user/pages/AddUser.mdl.vue";
import EditUser from "@/features/admin/user/pages/EditUser.vue";

export default [
  // Privileges routes
  {
    path: '/privileges',
    name: 'Privileges',
    component: Privileges,
    // meta: {
    //   privileges: ['Manage_Privileges'],
    //   requiresAuth: true
    // }
  },
  {
    path: '/add_privilege',
    name: 'Add Privilege',
    component: AddPrivilege,
    // meta: {
    //   privileges: ['Manage_Privileges'],
    //   requiresAuth: true
    // }
  },
  {
    path: '/edit_privilege/:privilegeUuid',
    name: 'Edit Privilege',
    component: EditPrivilege,
    // meta: {
    //   privileges: ['Manage_Privileges'],
    //   requiresAuth: true
    // }
  },
  
  // Roles routes
  {
    path: '/roles',
    name: 'Roles',
    component: Role,  // Make sure this component exists
    // meta: {
    //   privileges: ['Manage_Roles'],
    //   requiresAuth: true
    // }
  },
  {
    path: '/create-role',
    name: 'Create Role',
    component: AddRole,
    // meta: {
    //   privileges: ['Manage_Roles'],
    //   requiresAuth: true
    // }
  },
  {
    path: '/edit_role/:roleUuid',
    name: 'Edit Role',
    component: EditRole,
    // meta: {
    //   privileges: ['Manage_Roles'],
    //   requiresAuth: true
    // }
  },
  
  // Users routes
  {
    path: '/users',
    name: 'Users',
    component: Users,
    // meta: {
    //   privileges: ['Manage_Users'],
    //   requiresAuth: true
    // }
  },
  {
    path: '/add_user',
    name: 'Add User',
    component: AddUser,
    // meta: {
    //   privileges: ['Manage_Users'],
    //   requiresAuth: true
    // }
  },
  {
    path: '/edit_user/:userUuid',
    name: 'Edit User',
    component: EditUser,
    // meta: {
    //   privileges: ['Manage_Users'],
    //   requiresAuth: true
    // }
  }
];