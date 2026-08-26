<template>
  <div class="urm-root">
    <!-- Header -->
    <div class="urm-header">
      <div>
        <h1 class="urm-title">
          <span class="urm-title-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
          </span>
          User & Role Management
        </h1>
        <p class="urm-subtitle">Manage system accounts, assign roles, and configure granular module privileges.</p>
      </div>
      <div class="urm-header-actions">
        <button class="urm-btn-secondary" @click="loadUsers">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:14px;height:14px"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
          Refresh
        </button>
        <button class="urm-btn-primary" @click="openCreateModal">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:14px;height:14px"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m6-6H6"/></svg>
          Add New User
        </button>
      </div>
    </div>

    <!-- KPI Cards -->
    <div class="urm-kpi-grid">
      <div v-for="kpi in kpis" :key="kpi.label" class="urm-kpi" :style="`--kc:${kpi.color}`">
        <span class="urm-kpi-val">{{ kpi.value }}</span>
        <span class="urm-kpi-label">{{ kpi.label }}</span>
      </div>
    </div>

    <!-- Role Filter Pills -->
    <div class="urm-filters">
      <button v-for="f in roleFilters" :key="f.key"
        class="urm-filter-btn" :class="{ active: activeFilter === f.key }"
        :style="`--fc:${f.color}`"
        @click="activeFilter = f.key">
        {{ f.label }}
      </button>
    </div>

    <!-- Users Table -->
    <div class="urm-table-card">
      <table class="urm-table">
        <thead>
          <tr>
            <th class="th-num">#</th>
            <th>User Account</th>
            <th>Role</th>
            <th>Email</th>
            <th>Privileges</th>
            <th>Status</th>
            <th class="th-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(user, idx) in paginatedUsers" :key="user.id" class="urm-row">
            <td class="td-num">{{ (currentPage - 1) * PAGE_SIZE + idx + 1 }}</td>
            <td>
              <div class="urm-user-cell">
                <div class="urm-avatar" :style="`background:${getRoleColor(user.role)}`">{{ getInitials(user.fullName || user.username) }}</div>
                <div>
                  <div class="urm-user-name">{{ user.fullName || user.username }}</div>
                  <div class="urm-user-handle">@{{ user.username }}</div>
                </div>
              </div>
            </td>
            <td>
              <span class="urm-role-badge" :style="`--rc:${getRoleColor(user.role)}`">
                {{ roleLabel(user.role) }}
              </span>
            </td>
            <td class="td-email">{{ user.email }}</td>
            <td>
              <div class="urm-priv-pills">
                <span v-for="p in getUserPrivileges(user)" :key="p" class="urm-priv-pill">{{ p }}</span>
                <span v-if="getUserPrivileges(user).length === 0" class="urm-priv-pill urm-priv-none">No privileges</span>
              </div>
            </td>
            <td>
              <span class="urm-status" :class="user.status === 'ACTIVE' ? 'active' : 'inactive'">
                {{ user.status || 'ACTIVE' }}
              </span>
            </td>
            <td class="td-actions">
              <button class="urm-action-btn edit" @click="editUserRole(user)" title="Edit role & privileges">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
              </button>
              <button class="urm-action-btn privileges" @click="openPrivilegesModal(user)" title="Configure privileges">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
              </button>
              <button class="urm-action-btn revoke" @click="handleDeleteUser(user.id)" title="Revoke access">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="totalPages > 1" class="urm-pagination">
        <span class="urm-page-info">{{ (currentPage - 1) * PAGE_SIZE + 1 }}–{{ Math.min(currentPage * PAGE_SIZE, filteredUsers.length) }} of {{ filteredUsers.length }}</span>
        <div class="urm-page-btns">
          <button class="urm-page-btn" :disabled="currentPage === 1" @click="currentPage--">←</button>
          <button v-for="p in totalPages" :key="p" class="urm-page-btn" :class="{ active: p === currentPage }" @click="currentPage = p">{{ p }}</button>
          <button class="urm-page-btn" :disabled="currentPage === totalPages" @click="currentPage++">→</button>
        </div>
      </div>
    </div>

    <!-- Create/Edit User Modal -->
    <div v-if="showCreateModal" class="urm-overlay" @click.self="showCreateModal = false">
      <div class="urm-modal">
        <div class="urm-modal-header">
          <h3>{{ editingId ? 'Edit User Account' : 'Create New User' }}</h3>
          <button class="urm-modal-close" @click="showCreateModal = false">&times;</button>
        </div>

        <div class="urm-modal-body">
          <div class="urm-form-grid">
            <div class="urm-field">
              <label>Username</label>
              <input v-model="form.username" :disabled="!!editingId" type="text" placeholder="e.g. solomon_tadesse" />
            </div>
            <div class="urm-field">
              <label>Full Name</label>
              <input v-model="form.fullName" type="text" placeholder="e.g. Solomon Tadesse" />
            </div>
            <div class="urm-field full">
              <label>Email Address</label>
              <input v-model="form.email" type="email" placeholder="user@nyalainsurance.com" />
            </div>
            <div class="urm-field">
              <label>System Role</label>
              <select v-model="form.role">
                <option v-for="r in availableRoles" :key="r.value" :value="r.value">{{ r.label }}</option>
              </select>
            </div>
            <div class="urm-field">
              <label>Account Status</label>
              <select v-model="form.status">
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          <!-- Privilege Assignment -->
          <div class="urm-priv-section">
            <h4>Module Privileges</h4>
            <p class="urm-priv-desc">Select which modules and actions this user can access.</p>
            <div class="urm-priv-grid">
              <div v-for="mod in privilegeModules" :key="mod.id" class="urm-priv-module">
                <div class="urm-priv-module-header">
                  <label class="urm-checkbox-wrap">
                    <input type="checkbox" :checked="isModuleFullySelected(mod.id)" @change="toggleModule(mod.id, $event)" />
                    <span class="urm-checkbox-label">{{ mod.name }}</span>
                  </label>
                </div>
                <div class="urm-priv-actions">
                  <label v-for="action in mod.actions" :key="action" class="urm-checkbox-wrap small">
                    <input type="checkbox" :checked="form.privileges.includes(`${mod.id}:${action}`)" @change="togglePrivilege(mod.id, action)" />
                    <span>{{ action }}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="urm-modal-footer">
          <button class="urm-btn-secondary" @click="showCreateModal = false">Cancel</button>
          <button class="urm-btn-primary" @click="handleSaveUser">
            {{ editingId ? 'Update User' : 'Create User' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Privileges Detail Modal -->
    <div v-if="showPrivModal" class="urm-overlay" @click.self="showPrivModal = false">
      <div class="urm-modal urm-modal-lg">
        <div class="urm-modal-header">
          <h3>Configure Privileges — {{ privUser?.fullName || privUser?.username }}</h3>
          <button class="urm-modal-close" @click="showPrivModal = false">&times;</button>
        </div>
        <div class="urm-modal-body">
          <p class="urm-priv-desc" style="margin-bottom:1rem">Granularly control access to each module and its actions for this user.</p>
          <div class="urm-priv-grid detailed">
            <div v-for="mod in privilegeModules" :key="mod.id" class="urm-priv-module">
              <div class="urm-priv-module-header">
                <label class="urm-checkbox-wrap">
                  <input type="checkbox" :checked="isPrivModuleFullySelected(mod.id)" @change="togglePrivModule(mod.id, $event)" />
                  <span class="urm-checkbox-label">{{ mod.name }}</span>
                </label>
              </div>
              <div class="urm-priv-actions">
                <label v-for="action in mod.actions" :key="action" class="urm-checkbox-wrap small">
                  <input type="checkbox" :checked="privForm.includes(`${mod.id}:${action}`)" @change="togglePrivFormItem(mod.id, action)" />
                  <span>{{ action }}</span>
                </label>
              </div>
            </div>
          </div>
        </div>
        <div class="urm-modal-footer">
          <button class="urm-btn-secondary" @click="showPrivModal = false">Cancel</button>
          <button class="urm-btn-primary" @click="savePrivileges">Save Privileges</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { fetchUserRoles, createUserRole, updateUserRole, deleteUserRole } from '@/features/digitalChannel/api/digitalChannelApi';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

const userRoles = ref([]);
const showCreateModal = ref(false);
const showPrivModal = ref(false);
const editingId = ref(null);
const activeFilter = ref('ALL');
const currentPage = ref(1);
const PAGE_SIZE = 8;
const privUser = ref(null);
const privForm = ref([]);

const availableRoles = [
  { value: 'ROLE_SUPER_ADMIN', label: 'Super Admin' },
  { value: 'ROLE_UNDERWRITER', label: 'Underwriter' },
  { value: 'ROLE_ADJUSTOR', label: 'Vehicle Adjustor' },
  { value: 'ROLE_CLAIM_MANAGER', label: 'Claim Manager' },
  { value: 'ROLE_PRODUCT_MANAGER', label: 'Product Manager' },
  { value: 'ROLE_CUSTOMER', label: 'Insured Customer' },
  { value: 'ROLE_GARAGE', label: 'Garage Partner' },
  { value: 'ROLE_FINANCE', label: 'Finance Officer' },
];

const privilegeModules = [
  { id: 'claims', name: 'Claims Management', actions: ['View', 'Create', 'Approve', 'Reject', 'Assign', 'Close'] },
  { id: 'underwriting', name: 'Underwriting', actions: ['View', 'Create', 'Approve', 'Configure Rates'] },
  { id: 'quotation', name: 'Quotation', actions: ['View', 'Create', 'Edit', 'Delete'] },
  { id: 'policies', name: 'Policies', actions: ['View', 'Issue', 'Amend', 'Cancel'] },
  { id: 'finance', name: 'Finance', actions: ['View', 'Process Payments', 'Generate Reports'] },
  { id: 'users', name: 'User Management', actions: ['View', 'Create', 'Edit Roles', 'Revoke'] },
  { id: 'settings', name: 'System Settings', actions: ['View', 'Configure', 'Audit Logs'] },
];

const roleFilters = [
  { key: 'ALL', label: 'All', color: '#6366f1' },
  { key: 'ROLE_SUPER_ADMIN', label: 'Super Admin', color: '#dc2626' },
  { key: 'ROLE_UNDERWRITER', label: 'Underwriter', color: '#3b82f6' },
  { key: 'ROLE_ADJUSTOR', label: 'Adjustor', color: '#8b5cf6' },
  { key: 'ROLE_CLAIM_MANAGER', label: 'Claim Manager', color: '#f59e0b' },
  { key: 'ROLE_PRODUCT_MANAGER', label: 'Product Mgr', color: '#10b981' },
  { key: 'ROLE_CUSTOMER', label: 'Customer', color: '#64748b' },
];

const form = ref({
  username: '', fullName: '', email: '',
  role: 'ROLE_UNDERWRITER', status: 'ACTIVE',
  privileges: []
});

const roleColorMap = {
  ROLE_SUPER_ADMIN: '#dc2626', ROLE_UNDERWRITER: '#3b82f6', ROLE_ADJUSTOR: '#8b5cf6',
  ROLE_CLAIM_MANAGER: '#f59e0b', ROLE_PRODUCT_MANAGER: '#10b981', ROLE_CUSTOMER: '#64748b',
  ROLE_GARAGE: '#06b6d4', ROLE_FINANCE: '#d97706'
};

function getRoleColor(role) { return roleColorMap[role] || '#6366f1'; }

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function roleLabel(r) {
  const found = availableRoles.find(ar => ar.value === r);
  return found?.label || r;
}

function getUserPrivileges(user) {
  const privs = user.privileges || getDefaultPrivileges(user.role);
  return privs.slice(0, 3).map(p => p.split(':').pop());
}

function getDefaultPrivileges(role) {
  const defaults = {
    ROLE_SUPER_ADMIN: privilegeModules.flatMap(m => m.actions.map(a => `${m.id}:${a}`)),
    ROLE_UNDERWRITER: ['underwriting:View', 'underwriting:Create', 'underwriting:Approve', 'quotation:View', 'quotation:Create', 'policies:View', 'policies:Issue'],
    ROLE_ADJUSTOR: ['claims:View', 'claims:Assign', 'claims:Approve'],
    ROLE_CLAIM_MANAGER: ['claims:View', 'claims:Create', 'claims:Approve', 'claims:Reject', 'claims:Assign', 'claims:Close'],
    ROLE_PRODUCT_MANAGER: ['underwriting:View', 'underwriting:Configure Rates', 'quotation:View', 'quotation:Edit', 'policies:View'],
    ROLE_CUSTOMER: ['claims:View', 'claims:Create', 'quotation:View', 'policies:View'],
    ROLE_GARAGE: ['claims:View'],
    ROLE_FINANCE: ['finance:View', 'finance:Process Payments', 'finance:Generate Reports'],
  };
  return defaults[role] || [];
}

const filteredUsers = computed(() => {
  if (activeFilter.value === 'ALL') return userRoles.value;
  return userRoles.value.filter(u => u.role === activeFilter.value);
});

const totalPages = computed(() => Math.max(1, Math.ceil(filteredUsers.value.length / PAGE_SIZE)));
const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE;
  return filteredUsers.value.slice(start, start + PAGE_SIZE);
});

const kpis = computed(() => [
  { label: 'Total Users', value: userRoles.value.length, color: '#6366f1' },
  { label: 'Active', value: userRoles.value.filter(u => (u.status || 'ACTIVE') === 'ACTIVE').length, color: '#10b981' },
  { label: 'Roles Used', value: new Set(userRoles.value.map(u => u.role)).size, color: '#f59e0b' },
  { label: 'Admins', value: userRoles.value.filter(u => u.role === 'ROLE_SUPER_ADMIN').length, color: '#dc2626' },
]);

watch(activeFilter, () => { currentPage.value = 1; });

function isModuleFullySelected(modId) {
  const mod = privilegeModules.find(m => m.id === modId);
  return mod.actions.every(a => form.value.privileges.includes(`${modId}:${a}`));
}

function toggleModule(modId, event) {
  const mod = privilegeModules.find(m => m.id === modId);
  if (event.target.checked) {
    mod.actions.forEach(a => { if (!form.value.privileges.includes(`${modId}:${a}`)) form.value.privileges.push(`${modId}:${a}`); });
  } else {
    form.value.privileges = form.value.privileges.filter(p => !p.startsWith(`${modId}:`));
  }
}

function togglePrivilege(modId, action) {
  const key = `${modId}:${action}`;
  const idx = form.value.privileges.indexOf(key);
  if (idx >= 0) form.value.privileges.splice(idx, 1);
  else form.value.privileges.push(key);
}

function isPrivModuleFullySelected(modId) {
  const mod = privilegeModules.find(m => m.id === modId);
  return mod.actions.every(a => privForm.value.includes(`${modId}:${a}`));
}

function togglePrivModule(modId, event) {
  const mod = privilegeModules.find(m => m.id === modId);
  if (event.target.checked) {
    mod.actions.forEach(a => { if (!privForm.value.includes(`${modId}:${a}`)) privForm.value.push(`${modId}:${a}`); });
  } else {
    privForm.value = privForm.value.filter(p => !p.startsWith(`${modId}:`));
  }
}

function togglePrivFormItem(modId, action) {
  const key = `${modId}:${action}`;
  const idx = privForm.value.indexOf(key);
  if (idx >= 0) privForm.value.splice(idx, 1);
  else privForm.value.push(key);
}

function openCreateModal() {
  editingId.value = null;
  form.value = { username: '', fullName: '', email: '', role: 'ROLE_UNDERWRITER', status: 'ACTIVE', privileges: [...getDefaultPrivileges('ROLE_UNDERWRITER')] };
  showCreateModal.value = true;
}

function editUserRole(u) {
  editingId.value = u.id;
  form.value = { ...u, privileges: u.privileges || [...getDefaultPrivileges(u.role)] };
  showCreateModal.value = true;
}

function openPrivilegesModal(user) {
  privUser.value = user;
  privForm.value = [...(user.privileges || getDefaultPrivileges(user.role))];
  showPrivModal.value = true;
}

async function savePrivileges() {
  if (privUser.value?.id) {
    try {
      await updateUserRole(privUser.value.id, { ...privUser.value, privileges: privForm.value });
      showPrivModal.value = false;
      await loadUsers();
    } catch (e) {
      alert('Failed to save privileges');
    }
  }
}

async function loadUsers() {
  userRoles.value = await fetchUserRoles();
}

async function handleSaveUser() {
  if (!form.value.username) return alert('Username is required');
  try {
    if (editingId.value) {
      await updateUserRole(editingId.value, form.value);
    } else {
      await createUserRole(form.value);
    }
    showCreateModal.value = false;
    editingId.value = null;
    await loadUsers();
  } catch (e) {
    alert(e?.response?.data?.message || e.message || 'Failed to save user');
  }
}

async function handleDeleteUser(id) {
  if (!confirm('Revoke access for this user account? This action cannot be undone.')) return;
  try {
    await deleteUserRole(id);
    await loadUsers();
  } catch (e) {
    alert('Failed to revoke user');
  }
}

onMounted(() => {
  const user = authStore.auth?.user ?? authStore.auth;
  const roleName = user?.roleName;
  const roleCode = user?.roleCode || user?.role;
  const isSuperAdmin = roleName === 'Super Admin' || roleCode === 'ROLE_SUPER_ADMIN';

  if (!isSuperAdmin) {
    alert('Access Restricted: User & Role management is reserved for Super Admin.');
    router.replace('/module-select');
    return;
  }
  loadUsers();
});
</script>

<style scoped>
.urm-root {
  font-family: 'Inter', system-ui, sans-serif;
  --urm-bg: #f8fafc; --urm-card: #fff; --urm-border: #e2e8f0;
  --urm-title: #0f172a; --urm-sub: #64748b; --urm-muted: #94a3b8;
  --urm-accent: #4f46e5;
  min-height: 100%; background: var(--urm-bg); padding: 1.5rem 2rem 3rem;
}

/* Header */
.urm-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
.urm-title { font-size: 1.3rem; font-weight: 800; color: var(--urm-title); display: flex; align-items: center; gap: .6rem; }
.urm-title-icon { width: 34px; height: 34px; border-radius: 10px; background: var(--urm-accent); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.urm-title-icon svg { width: 18px; height: 18px; color: #fff; }
.urm-subtitle { font-size: .78rem; color: var(--urm-sub); margin-top: .25rem; font-weight: 500; }
.urm-header-actions { display: flex; gap: .5rem; }

/* Buttons */
.urm-btn-primary { display: inline-flex; align-items: center; gap: .4rem; padding: .5rem 1rem; background: var(--urm-accent); color: #fff; font-weight: 700; font-size: .78rem; border: none; border-radius: 10px; cursor: pointer; transition: all .2s; box-shadow: 0 2px 8px rgba(79,70,229,.2); }
.urm-btn-primary:hover { background: #4338ca; transform: translateY(-1px); }
.urm-btn-secondary { display: inline-flex; align-items: center; gap: .4rem; padding: .5rem 1rem; background: var(--urm-card); color: var(--urm-title); font-weight: 700; font-size: .78rem; border: 1px solid var(--urm-border); border-radius: 10px; cursor: pointer; transition: all .2s; }
.urm-btn-secondary:hover { border-color: var(--urm-accent); color: var(--urm-accent); }

/* KPI */
.urm-kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: .6rem; margin-bottom: 1.25rem; }
.urm-kpi { display: flex; flex-direction: column; align-items: center; padding: .7rem .5rem; background: color-mix(in srgb, var(--kc) 5%, var(--urm-card)); border: 1px solid color-mix(in srgb, var(--kc) 18%, transparent); border-radius: 11px; transition: all .2s; }
.urm-kpi:hover { border-color: color-mix(in srgb, var(--kc) 40%, transparent); transform: translateY(-1px); }
.urm-kpi-val { font-size: 1.3rem; font-weight: 800; color: var(--kc); }
.urm-kpi-label { font-size: .66rem; font-weight: 600; color: var(--urm-sub); margin-top: .15rem; }

/* Filters */
.urm-filters { display: flex; gap: .4rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
.urm-filter-btn { font-size: .72rem; font-weight: 600; padding: .35rem .7rem; border-radius: 18px; border: 1px solid color-mix(in srgb, var(--fc) 20%, transparent); background: color-mix(in srgb, var(--fc) 6%, var(--urm-card)); color: var(--fc); cursor: pointer; transition: all .2s; }
.urm-filter-btn:hover { background: color-mix(in srgb, var(--fc) 12%, var(--urm-card)); border-color: color-mix(in srgb, var(--fc) 35%, transparent); }
.urm-filter-btn.active { background: var(--fc); color: #fff; border-color: var(--fc); font-weight: 700; box-shadow: 0 2px 8px color-mix(in srgb, var(--fc) 25%, transparent); }

/* Table Card */
.urm-table-card { background: var(--urm-card); border: 1px solid var(--urm-border); border-radius: 14px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.03); }
.urm-table { width: 100%; border-collapse: collapse; text-align: left; font-size: .8rem; }
.urm-table th { padding: .7rem 1rem; font-size: .7rem; font-weight: 800; text-transform: uppercase; letter-spacing: .05em; color: var(--urm-title); border-bottom: 1.5px solid var(--urm-border); background: #f8fafc; white-space: nowrap; }
.th-num { width: 40px; text-align: center; }
.th-actions { text-align: right; }
.urm-row { border-bottom: 1px solid var(--urm-border); transition: background .15s; }
.urm-row:nth-child(even) { background: #f8fafc; }
.urm-row:hover { background: #eef2ff; }
.urm-table td { padding: .65rem 1rem; vertical-align: middle; }
.td-num { text-align: center; font-weight: 600; color: var(--urm-muted); }
.td-email { font-family: 'JetBrains Mono', monospace; font-size: .72rem; color: var(--urm-sub); }
.td-actions { text-align: right; white-space: nowrap; }

/* User cell */
.urm-user-cell { display: flex; align-items: center; gap: .6rem; }
.urm-avatar { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 800; font-size: .65rem; flex-shrink: 0; }
.urm-user-name { font-weight: 700; color: var(--urm-title); font-size: .8rem; }
.urm-user-handle { font-size: .68rem; color: var(--urm-muted); font-family: monospace; }

/* Role badge */
.urm-role-badge { font-size: .68rem; font-weight: 700; padding: .2rem .55rem; border-radius: 6px; border: 1px solid color-mix(in srgb, var(--rc) 25%, transparent); background: color-mix(in srgb, var(--rc) 8%, transparent); color: var(--rc); }

/* Privilege pills */
.urm-priv-pills { display: flex; gap: .25rem; flex-wrap: wrap; }
.urm-priv-pill { font-size: .62rem; font-weight: 600; padding: .15rem .4rem; border-radius: 4px; background: #f1f5f9; color: var(--urm-sub); border: 1px solid var(--urm-border); }
.urm-priv-none { color: var(--urm-muted); font-style: italic; border-style: dashed; }

/* Status */
.urm-status { font-size: .65rem; font-weight: 700; padding: .2rem .5rem; border-radius: 5px; text-transform: uppercase; }
.urm-status.active { background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }
.urm-status.inactive { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }

/* Action buttons */
.urm-action-btn { width: 28px; height: 28px; border-radius: 7px; border: 1px solid var(--urm-border); background: var(--urm-card); cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: all .15s; margin-left: .25rem; }
.urm-action-btn svg { width: 14px; height: 14px; }
.urm-action-btn.edit { color: #3b82f6; }
.urm-action-btn.edit:hover { background: #eff6ff; border-color: #93c5fd; }
.urm-action-btn.privileges { color: #f59e0b; }
.urm-action-btn.privileges:hover { background: #fffbeb; border-color: #fcd34d; }
.urm-action-btn.revoke { color: #dc2626; }
.urm-action-btn.revoke:hover { background: #fef2f2; border-color: #fca5a5; }

/* Pagination */
.urm-pagination { display: flex; align-items: center; justify-content: space-between; padding: .7rem 1rem; border-top: 1px solid var(--urm-border); }
.urm-page-info { font-size: .72rem; font-weight: 600; color: var(--urm-sub); }
.urm-page-btns { display: flex; gap: .25rem; }
.urm-page-btn { font-size: .7rem; font-weight: 700; padding: .25rem .55rem; border-radius: 6px; border: 1px solid var(--urm-border); background: var(--urm-card); color: var(--urm-sub); cursor: pointer; transition: all .15s; }
.urm-page-btn:hover:not(:disabled) { border-color: var(--urm-accent); color: var(--urm-accent); }
.urm-page-btn.active { background: var(--urm-accent); color: #fff; border-color: var(--urm-accent); }
.urm-page-btn:disabled { opacity: .4; cursor: not-allowed; }

/* Modal */
.urm-overlay { position: fixed; inset: 0; z-index: 9999; background: rgba(15,23,42,.7); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; padding: 1rem; }
.urm-modal { background: var(--urm-card); border-radius: 16px; width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,.2); }
.urm-modal.urm-modal-lg { max-width: 680px; }
.urm-modal-header { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--urm-border); }
.urm-modal-header h3 { font-size: 1rem; font-weight: 800; color: var(--urm-title); }
.urm-modal-close { width: 28px; height: 28px; border: none; background: #f1f5f9; border-radius: 7px; font-size: 1.2rem; cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--urm-sub); transition: all .15s; }
.urm-modal-close:hover { background: #e2e8f0; color: var(--urm-title); }
.urm-modal-body { padding: 1.25rem 1.5rem; }
.urm-modal-footer { display: flex; align-items: center; justify-content: flex-end; gap: .5rem; padding: 1rem 1.5rem; border-top: 1px solid var(--urm-border); }

/* Form */
.urm-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; margin-bottom: 1.25rem; }
.urm-field { display: flex; flex-direction: column; gap: .3rem; }
.urm-field.full { grid-column: 1 / -1; }
.urm-field label { font-size: .7rem; font-weight: 700; color: var(--urm-title); letter-spacing: .02em; }
.urm-field input, .urm-field select { padding: .55rem .8rem; border: 1px solid var(--urm-border); border-radius: 9px; font-size: .8rem; font-family: inherit; color: var(--urm-title); outline: none; transition: border-color .2s, box-shadow .2s; background: #fff; }
.urm-field input:focus, .urm-field select:focus { border-color: var(--urm-accent); box-shadow: 0 0 0 3px rgba(79,70,229,.08); }
.urm-field input:disabled { background: #f8fafc; color: var(--urm-muted); }

/* Privilege Section */
.urm-priv-section { border-top: 1px solid var(--urm-border); padding-top: 1rem; }
.urm-priv-section h4 { font-size: .82rem; font-weight: 800; color: var(--urm-title); margin-bottom: .25rem; }
.urm-priv-desc { font-size: .72rem; color: var(--urm-sub); margin-bottom: .75rem; }
.urm-priv-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .6rem; }
.urm-priv-grid.detailed { grid-template-columns: 1fr; }
.urm-priv-module { background: #f8fafc; border: 1px solid var(--urm-border); border-radius: 10px; padding: .6rem .8rem; }
.urm-priv-module-header { margin-bottom: .4rem; }
.urm-priv-actions { display: flex; flex-wrap: wrap; gap: .3rem .6rem; padding-left: 1.4rem; }

/* Checkboxes */
.urm-checkbox-wrap { display: flex; align-items: center; gap: .4rem; cursor: pointer; font-size: .75rem; font-weight: 600; color: var(--urm-title); }
.urm-checkbox-wrap.small { font-size: .7rem; font-weight: 500; color: var(--urm-sub); }
.urm-checkbox-wrap input[type="checkbox"] { width: 15px; height: 15px; border-radius: 4px; accent-color: var(--urm-accent); cursor: pointer; }
.urm-checkbox-label { font-weight: 700; }
</style>
