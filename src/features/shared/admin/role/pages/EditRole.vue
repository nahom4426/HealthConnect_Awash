<script setup>
import { useRoute, useRouter } from 'vue-router';
import { useApiRequest } from '@/composables/useApiRequest';
import { getRoleById, updateRolebyId } from '../Api/RoleApi';
import { useRoles } from '../store/roleStore';
import { computed, ref } from 'vue';
import NewFormParent from '../components/NewFormParent.vue';
import PrivilegesDataProvider from '../../privilege/components/RolePrivilegesDataProvider.vue';
import Button from '@/components/Button.vue';
import RoleForm from '../form/RoleForm.vue';
import { useForm } from '@/components/new_form_builder/useForm';

import { toasted } from '@/utils/utils';
import { useAuthStore } from "@/stores/auth";
import { refreshPrivileges } from "@/scripts/privilegeRefresh";

const roleStore = useRoles();
const route = useRoute()
const roleUuid = route.params.roleUuid
const role = ref(roleStore.roles.find((el) => el.roleUuid == roleUuid) || {});
const req = useApiRequest()
const updateReq = useApiRequest()
const { submit } = useForm('roleForm')
const router = useRouter();
const authStore = useAuthStore();

const extractPrivilegeUuid = (p) => {
    if (!p) return null;
    if (typeof p === 'string') return p;
    if (typeof p === 'object') {
        if (typeof p.privilegeUuid === 'string' && p.privilegeUuid) return p.privilegeUuid;
        const keys = Object.keys(p);
        if (keys.length === 1) {
            const key = keys[0];
            if (typeof key === 'string' && key) return key;
        }
    }
    return null;
};

const mappedSelectedPrivilegeUuids = computed(() => {
    const r = role.value || {};
    const source =
        (Array.isArray(r?.rolePrivileges) && r.rolePrivileges) ||
        (Array.isArray(r?.privilegeName) && r.privilegeName) ||
        (Array.isArray(r?.privileges) && r.privileges) ||
        [];

    return source.map(extractPrivilegeUuid).filter(Boolean);
});

if (!Object.keys(role.value).length) {
    req.send(
        () => getRoleById(roleUuid),
        (res) => {
            if (res.success) {
                role.value = res.data;
            }
        }
    );
}

function update({ values }) {
    if (updateReq.pending.value) return;

    updateReq.send(
        () => updateRolebyId(roleUuid, values),
        async (res) => {
            if (res.success) {
                roleStore.update(roleUuid, { ...role.value, ...values });
                toasted(res.success, 'Successfully Updated', res.error);

                let currentUser = authStore.auth?.user;
                if (!currentUser) {
                    try {
                        const stored = localStorage.getItem('userDetail');
                        currentUser = stored ? JSON.parse(stored)?.user : null;
                    } catch (e) {
                        currentUser = null;
                    }
                }

                const currentUserUuid = currentUser?.userUuid;
                const currentUserRoleUuid = currentUser?.roleUuid;

                const currentUserRoleName = currentUser?.roleName;
                const editedRoleName = values?.roleName || role.value?.roleName;

                const isCurrentUsersRole = Boolean(
                    (currentUserRoleUuid && String(currentUserRoleUuid) === String(roleUuid)) ||
                    (currentUserRoleName && editedRoleName && String(currentUserRoleName) === String(editedRoleName)) ||
                    (!currentUserRoleUuid && !currentUserRoleName)
                );

                if (currentUserUuid && isCurrentUsersRole) {
                    const refreshed = await refreshPrivileges(currentUserUuid);

                    const updatedRoleRes = await getRoleById(roleUuid);
                    const updatedRole = updatedRoleRes?.success ? updatedRoleRes.data : null;

                    const updatedPrivilegeNames =
                        updatedRole?.privilegeName ||
                        updatedRole?.privileges ||
                        res.data?.privilegeName ||
                        res.data?.privileges;

                    const extractPrivilegeName = (priv) => {
                        if (!priv) return null;
                        if (typeof priv === 'string') return priv;
                        if (typeof priv === 'object') {
                            if (typeof priv.authority === 'string' && priv.authority) return priv.authority;
                            if (typeof priv.privilegeName === 'string' && priv.privilegeName) return priv.privilegeName;
                            if (typeof priv.name === 'string' && priv.name) return priv.name;

                            const keys = Object.keys(priv);
                            if (keys.length === 1) {
                                const val = priv[keys[0]];
                                if (typeof val === 'string' && val) return val;
                            }
                        }
                        return null;
                    };

                    const rebuiltFromRole = Array.isArray(updatedPrivilegeNames)
                        ? updatedPrivilegeNames
                              .map((p) => extractPrivilegeName(p))
                              .filter(Boolean)
                              .flatMap((p) =>
                                  String(p) === 'All Privileges'
                                      ? ['All Privileges', 'ROLE_All Privileges']
                                      : [String(p).startsWith('ROLE_') ? String(p) : `ROLE_${p}`]
                              )
                        : null;

                    if (rebuiltFromRole && rebuiltFromRole.length) {
                        const mergedUser = {
                            ...currentUser,
                            roleName: currentUser.roleName ?? editedRoleName,
                            privileges: rebuiltFromRole,
                        };

                        authStore.setAuth(mergedUser);

                        window.dispatchEvent(
                            new CustomEvent('privileges:updated', {
                                detail: {
                                    userId: currentUserUuid,
                                    privileges: rebuiltFromRole,
                                    roleName: mergedUser.roleName,
                                    timestamp: Date.now(),
                                },
                            })
                        );

                    }

                    if (!refreshed) {
                        const rolePrivileges = values?.rolePrivileges || role.value?.rolePrivileges;
                        const rebuilt = Array.isArray(rolePrivileges)
                            ? rolePrivileges
                                  .map((p) => p?.authority || p?.privilegeName || p?.name || p)
                                  .filter(Boolean)
                                  .map((p) => (String(p).startsWith('ROLE_') ? String(p) : `ROLE_${p}`))
                            : null;

                        if (rebuilt && rebuilt.length) {
                            const mergedUser = {
                                ...currentUser,
                                privileges: rebuilt,
                            };

                            authStore.setAuth(mergedUser);

                            window.dispatchEvent(
                                new CustomEvent('privileges:updated', {
                                    detail: {
                                        userId: currentUserUuid,
                                        privileges: rebuilt,
                                        roleName: mergedUser.roleName,
                                        timestamp: Date.now(),
                                    },
                                })
                            );

                        }
                    }
                }

                router.push('/roles');
            }
        }
    );
}
</script>
<template>
  <NewFormParent
    :is-modal="false"
    size="auto"
    class="flex justify-center pb-6 h-full bg-white"
    title="Update Role"
  >
    <PrivilegesDataProvider :pre-page="5000" v-slot="{ privileges, pending }">
      <RoleForm 
        v-if="!pending && Object.keys(role).length" 
        :selectPrivilege="mappedSelectedPrivilegeUuids" 
        :privileges="privileges" 
        :role="role" 
      />
      <p v-else>Loading...</p>
    </PrivilegesDataProvider>

    <template #bottom>
      <Button
        size="sm"
        type="primary"
        class="flex gap-3 justify-center items-center p-2 mt-3 bg-primary"
        :pending="updateReq.pending.value"
        :disabled="updateReq.pending.value"
        @click.prevent="submit(update)"
      >
        Update Role
      </Button>
    </template>
  </NewFormParent>
</template>