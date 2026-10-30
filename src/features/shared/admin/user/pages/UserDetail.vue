<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getUserById, addUserModuleAccess, removeUserModuleAccess } from '../Api/UserApi';
import { getAllRole } from '../../role/Api/RoleApi';
import { useApiRequest } from '@/composables/useApiRequest';
import { toasted } from '@/utils/utils';
import { openModal } from '@customizer/modal-x';
import DefaultPage from "@/components/DefaultPage.vue";
import icons from "@/utils/icons";
import { useAuthStore } from "@/stores/auth";
import { administeredModules } from "@/utils/roleAccess";
import { ADMIN_MODULES, moduleLabel as catalogModuleLabel } from "../../catalog";

const moduleLabel = (m) => catalogModuleLabel(m);
const authStore = useAuthStore();
const caller = computed(() => authStore.auth?.user ?? authStore.auth ?? {});
const managedModules = computed(() => administeredModules(caller.value));

function canManageModule(moduleType) {
  const managed = managedModules.value;
  if (managed == null) return true;
  return managed.includes(String(moduleType || "").toLowerCase());
}

const route = useRoute();
const router = useRouter();
const userUuid = route.params.userUuid;
const user = ref({});
const req = useApiRequest();

function loadUser() {
  return req.send(
    () => getUserById(userUuid),
    (res) => {
      if (res.success) {
        user.value = res.data;
      } else {
        console.error('Failed to fetch user:', res.error);
      }
    }
  );
}

onMounted(() => {
  if (userUuid) loadUser();
});

// ── Module access (one role per module) ──
const memberships = computed(() => (Array.isArray(user.value?.memberships) ? user.value.memberships : []));
const moduleChoices = computed(() => {
  const managed = managedModules.value;
  const values = ADMIN_MODULES.map((item) => item.value);
  if (managed == null) return values;
  return values.filter((value) => managed.includes(value));
});
const availableModules = computed(() =>
  moduleChoices.value.filter((m) => !memberships.value.some((x) => String(x.moduleType).toLowerCase() === m))
);

const newModule = ref('');
const newRoleUuid = ref('');
const moduleRoles = ref([]);
const rolesReq = useApiRequest();
const accessReq = useApiRequest();

function onModuleChange() {
  newRoleUuid.value = '';
  moduleRoles.value = [];
  if (!newModule.value) return;
  const requested = newModule.value;
  rolesReq.send(
    () => getAllRole({ moduleType: requested, page: 1, limit: 500 }),
    (res) => {
      if (requested !== newModule.value) return;
      if (res.success) {
        const list = Array.isArray(res.data) ? res.data : res.data?.content || [];
        moduleRoles.value = list.filter((r) => r.roleUuid && r.roleName);
      } else {
        toasted(false, '', res.error || 'Failed to load roles');
      }
    }
  );
}

function addAccess() {
  if (!newModule.value || !newRoleUuid.value) return;
  accessReq.send(
    () => addUserModuleAccess(userUuid, { moduleType: newModule.value, roleUuid: newRoleUuid.value }),
    async (res) => {
      toasted(res.success, 'Module access added', res.error);
      if (res.success) {
        newModule.value = '';
        newRoleUuid.value = '';
        moduleRoles.value = [];
        await loadUser();
      }
    }
  );
}

function removeAccess(membership) {
  openModal(
    'Confirmation',
    {
      title: 'Remove module access',
      message: `Remove ${moduleLabel(membership.moduleType)} access (${membership.roleName || 'role'}) from this user?`,
      confirmText: 'Remove',
      cancelText: 'Cancel',
      tone: 'danger',
    },
    (yes) => {
      if (!yes) return;
      accessReq.send(
        () => removeUserModuleAccess(userUuid, membership.moduleType),
        async (res) => {
          toasted(res.success, 'Module access removed', res.error);
          if (res.success) await loadUser();
        }
      );
    }
  );
}

const goBack = () => {
  router.push('/Users');
};
</script>

<template>
  <DefaultPage>
    <template #add-action>
      <button
        class="flex justify-center items-center gap-2 rounded-md px-6 py-4 bg-ink-subtle text-white"
        @click="goBack"
      >
        <i v-html="icons.arrow_left"></i>
        <p class="text-base">Back to Users</p>
      </button>
    </template>

    <template #default>
      <div class="bg-white rounded-lg p-6 shadow-sm">
        <div v-if="req.pending.value && !Object.keys(user).length" class="p-8 text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p class="mt-2 text-ink-muted">Loading user details...</p>
        </div>
        
        <div v-else-if="Object.keys(user).length > 0" class="space-y-8">
          <!-- Header -->
          <div class="border-b pb-4">
            <h1 class="text-2xl font-bold text-ink">{{ user.firstName }} {{ user.fatherName }}</h1>
            <p class="text-ink-muted mt-1">User Details</p>
          </div>

          <!-- User Information -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-ink-muted mb-2">Full Name</label>
              <div class="bg-surface-muted p-4 rounded-lg border">
                <p class="text-ink font-medium">{{ user.firstName }} {{ user.fatherName }} {{ user.grandFatherName }}</p>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-ink-muted mb-2">Email</label>
              <div class="bg-surface-muted p-4 rounded-lg border">
                <p class="text-ink">{{ user.email }}</p>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-ink-muted mb-2">Mobile Phone</label>
              <div class="bg-surface-muted p-4 rounded-lg border">
                <p class="text-ink">{{ user.mobilePhone }}</p>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-ink-muted mb-2">Gender</label>
              <div class="bg-surface-muted p-4 rounded-lg border">
                <p class="text-ink capitalize">{{ user.gender }}</p>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-ink-muted mb-2">Role</label>
              <div class="bg-surface-muted p-4 rounded-lg border">
                <p class="text-ink">{{ user.roleName }}</p>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-ink-muted mb-2">Status</label>
              <div class="bg-surface-muted p-4 rounded-lg border">
                <span :class="user.userStatus === 'ACTIVE' ? 'bg-success-soft text-success-strong' : 'bg-error-soft text-error-strong'" 
                      class="px-2 py-1 rounded-full text-sm font-medium">
                  {{ user.userStatus }}
                </span>
              </div>
            </div>
          </div>

          <!-- Branches -->
          <div>
            <h2 class="mb-4 text-lg font-semibold text-ink">Branches</h2>
            <div v-if="user.branches && user.branches.length" class="flex flex-wrap gap-2">
              <span
                v-for="b in user.branches"
                :key="b.branchUuid"
                class="px-3 py-1 text-sm font-medium rounded-full border"
                :class="b.branchUuid === user.primaryBranchUuid
                  ? 'bg-primary/10 text-primary-hover border-primary/20'
                  : 'bg-surface-muted text-ink border-line'"
              >
                {{ b.name }}<span v-if="b.branchUuid === user.primaryBranchUuid"> (primary)</span>
              </span>
            </div>
            <p v-else class="text-sm text-ink-subtle">No branches assigned.</p>
          </div>

          <!-- Module Access -->
          <div>
            <h2 class="mb-4 text-lg font-semibold text-ink">Module access</h2>
            <div class="overflow-x-auto rounded-lg border border-line">
              <table class="w-full text-sm">
                <thead class="bg-surface-muted text-ink-muted">
                  <tr>
                    <th class="p-3 font-medium text-left">Module</th>
                    <th class="p-3 font-medium text-left">Role</th>
                    <th class="p-3 font-medium text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="!memberships.length">
                    <td colspan="3" class="p-4 text-center text-ink-subtle">This user has no module access yet.</td>
                  </tr>
                  <tr v-for="m in memberships" :key="m.moduleType" class="border-t border-line">
                    <td class="p-3 font-medium text-ink">{{ moduleLabel(m.moduleType) }}</td>
                    <td class="p-3 text-ink-muted">{{ m.roleName || '—' }}</td>
                    <td class="p-3">
                      <button
                        v-if="canManageModule(m.moduleType)"
                        type="button"
                        :disabled="accessReq.pending.value"
                        @click="removeAccess(m)"
                        class="flex gap-2 items-center px-3 py-1.5 text-sm font-semibold rounded-xl border transition-all duration-200 text-error bg-error-soft border-error/20 hover:shadow-sm disabled:opacity-50"
                      >
                        <i v-html="icons.deactivate" class="text-error" />
                        <span>Remove</span>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div v-if="availableModules.length" class="grid grid-cols-1 gap-3 items-end mt-4 sm:grid-cols-3">
              <div class="space-y-1">
                <label class="block text-sm font-medium text-ink-muted">Module</label>
                <select
                  v-model="newModule"
                  @change="onModuleChange"
                  class="px-3 py-2 w-full bg-white rounded-lg border text-ink border-line-strong focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="">Select module</option>
                  <option v-for="m in availableModules" :key="m" :value="m">{{ moduleLabel(m) }}</option>
                </select>
              </div>
              <div class="space-y-1">
                <label class="block text-sm font-medium text-ink-muted">Role</label>
                <select
                  v-model="newRoleUuid"
                  :disabled="!newModule || rolesReq.pending.value"
                  class="px-3 py-2 w-full bg-white rounded-lg border text-ink border-line-strong focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-60"
                >
                  <option value="">
                    {{ !newModule ? 'Select module first' : rolesReq.pending.value ? 'Loading roles…' : moduleRoles.length ? 'Select role' : 'No roles for this module' }}
                  </option>
                  <option v-for="r in moduleRoles" :key="r.roleUuid" :value="r.roleUuid">{{ r.roleName }}</option>
                </select>
              </div>
              <button
                type="button"
                :disabled="!newModule || !newRoleUuid || accessReq.pending.value"
                @click="addAccess"
                class="flex gap-2 justify-center items-center px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors bg-primary hover:bg-primary-hover disabled:opacity-50"
              >
                <i v-html="icons.plus_circle" class="w-4 h-4"></i>
                Add access
              </button>
            </div>
          </div>

          <!-- Privileges Section -->
          <div v-if="user.privileges && user.privileges.length > 0">
            <h2 class="text-lg font-semibold text-ink mb-4">User Privileges</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div v-for="privilege in user.privileges" 
                   :key="privilege"
                   class="bg-success-soft border border-success/20 rounded-lg p-4">
                <div class="flex items-center gap-3">
                  <div class="bg-success-soft p-2 rounded-full">
                    <i v-html="icons.shield || icons.check" class="text-success"></i>
                  </div>
                  <p class="font-medium text-success-strong">{{ privilege }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-12">
          <div class="bg-error-soft p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <i v-html="icons.error || icons.warning" class="text-error"></i>
          </div>
          <p class="text-error text-lg">Failed to load user details</p>
          <p class="text-ink-subtle text-sm mt-2">UserUuid: {{ userUuid }}</p>
          <button @click="goBack" class="mt-4 text-primary hover:underline">
            Return to users list
          </button>
        </div>
      </div>
    </template>
  </DefaultPage>
</template>

