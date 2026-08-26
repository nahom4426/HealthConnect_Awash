<template>
  <div class="urm-root">
    <!-- Header -->
    <div class="urm-header">
      <div>
        <h1 class="urm-title">User & Role Management</h1>
        <p class="urm-subtitle">Manage system accounts, assign roles, and configure module-level access privileges.</p>
      </div>
      <div class="urm-header-actions">
        <button class="urm-btn-ghost" @click="loadUsers">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:14px;height:14px"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
          Refresh
        </button>
        <button class="urm-btn-primary" @click="openCreateModal">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:14px;height:14px"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m6-6H6"/></svg>
          Add User
        </button>
      </div>
    </div>

    <!-- Summary Stats -->
    <div class="urm-stats-grid">
      <div class="urm-stat-card">
        <div class="urm-stat-icon" style="background:#eff6ff;color:#2563eb">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
        </div>
        <div class="urm-stat-body">
          <span class="urm-stat-val">{{ userRoles.length }}</span>
          <span class="urm-stat-label">Total Users</span>
        </div>
      </div>
      <div class="urm-stat-card">
        <div class="urm-stat-icon" style="background:#ecfdf5;color:#059669">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
        <div class="urm-stat-body">
          <span class="urm-stat-val">{{ userRoles.filter(u => (u.status || 'ACTIVE') === 'ACTIVE').length }}</span>
          <span class="urm-stat-label">Active Accounts</span>
        </div>
      </div>
      <div class="urm-stat-card">
        <div class="urm-stat-icon" style="background:#fef3c7;color:#d97706">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg>
        </div>
        <div class="urm-stat-body">
          <span class="urm-stat-val">{{ new Set(userRoles.map(u => u.role)).size }}</span>
          <span class="urm-stat-label">Roles Configured</span>
        </div>
      </div>
      <div class="urm-stat-card">
        <div class="urm-stat-icon" style="background:#fef2f2;color:#dc2626">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
        </div>
        <div class="urm-stat-body">
          <span class="urm-stat-val">{{ userRoles.filter(u => u.role === 'ROLE_SUPER_ADMIN').length }}</span>
          <span class="urm-stat-label">System Admins</span>
        </div>
      </div>
    </div>

    <!-- Role Filter -->
    <div class="urm-filters">
      <button v-for="f in roleFilters" :key="f.key"
        class="urm-filter-btn" :class="{ active: activeFilter === f.key }"
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
            <th>Email Address</th>
            <th>Privileges</th>
            <th>Status</th>
            <th class="th-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(user, idx) in paginatedUsers" :key="user.id" class="urm-row">
            <td class="td-num">{{ (currentPage - 1) * PAGE_SIZE + idx + 1 }}</td>
            <td>
              <div class="urm-user-name">{{ user.fullName || user.username }}</div>
              <div class="urm-user-handle">@{{ user.username }}</div>
            </td>
            <td>
              <span class="urm-role-tag">{{ roleLabel(user.role) }}</span>
            </td>
            <td class="td-email">{{ user.email }}</td>
            <td>
              <div class="urm-priv-pills">
                <span v-for="p in getUserPrivileges(user)" :key="p" class="urm-priv-pill">{{ p }}</span>
                <span v-if="getUserPrivileges(user).length === 0" class="urm-priv-pill none">—</span>
              </div>
            </td>
            <td>
              <span class="urm-status" :class="(user.status || 'ACTIVE') === 'ACTIVE' ? 'on' : 'off'">
                {{ user.status || 'ACTIVE' }}
              </span>
            </td>
            <td class="td-actions">
              <button class="urm-act-btn" @click="editUserRole(user)" title="Edit">Edit Role</button>
              <button class="urm-act-btn accent" @click="openPrivilegesModal(user)" title="Privileges">Privileges</button>
              <button class="urm-act-btn danger" @click="handleDeleteUser(user.id)" title="Revoke">Revoke</button>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="totalPages > 1" class="urm-pagination">
        <span class="urm-page-info">Showing {{ (currentPage - 1) * PAGE_SIZE + 1 }}–{{ Math.min(currentPage * PAGE_SIZE, filteredUsers.length) }} of {{ filteredUsers.length }}</span>
        <div class="urm-page-btns">
          <button class="urm-page-btn" :disabled="currentPage === 1" @click="currentPage--">← Prev</button>
          <button v-for="p in totalPages" :key="p" class="urm-page-btn" :class="{ active: p === currentPage }" @click="currentPage = p">{{ p }}</button>
          <button class="urm-page-btn" :disabled="currentPage === totalPages" @click="currentPage++">Next →</button>
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

          <div class="urm-priv-section">
            <h4>Module Access Privileges</h4>
            <p class="urm-priv-hint">Control which modules and actions this user can access.</p>
            <div class="urm-priv-grid">
              <div v-for="mod in privilegeModules" :key="mod.id" class="urm-priv-module">
                <div class="urm-priv-mod-head">
                  <label class="urm-check-row">
                    <input type="checkbox" :checked="isModuleFullySelected(mod.id)" @change="toggleModule(mod.id, $event)" />
                    <span class="urm-check-title">{{ mod.name }}</span>
                  </label>
                </div>
                <div class="urm-priv-actions">
                  <label v-for="action in mod.actions" :key="action" class="urm-check-row sub">
                    <input type="checkbox" :checked="form.privileges.includes(`${mod.id}:${action}`)" @change="togglePrivilege(mod.id, action)" />
                    <span>{{ action }}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="urm-modal-footer">
          <button class="urm-btn-ghost" @click="showCreateModal = false">Cancel</button>
          <button class="urm-btn-primary" @click="handleSaveUser">{{ editingId ? 'Update User' : 'Create User' }}</button>
        </div>
      </div>
    </div>

    <!-- Privileges Modal -->
    <div v-if="showPrivModal" class="urm-overlay" @click.self="showPrivModal = false">
      <div class="urm-modal urm-modal-wide">
        <div class="urm-modal-header">
          <h3>Configure Privileges — {{ privUser?.fullName || privUser?.username }}</h3>
          <button class="urm-modal-close" @click="showPrivModal = false">&times;</button>
        </div>
        <div class="urm-modal-body">
          <p class="urm-priv-hint" style="margin-bottom:1rem">Granularly control access to each module for this user.</p>
          <div class="urm-priv-grid wide">
            <div v-for="mod in privilegeModules" :key="mod.id" class="urm-priv-module">
              <div class="urm-priv-mod-head">
                <label class="urm-check-row">
                  <input type="checkbox" :checked="isPrivModuleFullySelected(mod.id)" @change="togglePrivModule(mod.id, $event)" />
                  <span class="urm-check-title">{{ mod.name }}</span>
                </label>
              </div>
              <div class="urm-priv-actions">
                <label v-for="action in mod.actions" :key="action" class="urm-check-row sub">
                  <input type="checkbox" :checked="privForm.includes(`${mod.id}:${action}`)" @change="togglePrivFormItem(mod.id, action)" />
                  <span>{{ action }}</span>
                </label>
              </div>
            </div>
          </div>
        </div>
        <div class="urm-modal-footer">
          <button class="urm-btn-ghost" @click="showPrivModal = false">Cancel</button>
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
  { key: 'ALL', label: 'All Users' },
  { key: 'ROLE_SUPER_ADMIN', label: 'Super Admin' },
  { key: 'ROLE_UNDERWRITER', label: 'Underwriter' },
  { key: 'ROLE_ADJUSTOR', label: 'Adjustor' },
  { key: 'ROLE_CLAIM_MANAGER', label: 'Claim Manager' },
  { key: 'ROLE_PRODUCT_MANAGER', label: 'Product Mgr' },
  { key: 'ROLE_CUSTOMER', label: 'Customer' },
];

const form = ref({
  username: '', fullName: '', email: '',
  role: 'ROLE_UNDERWRITER', status: 'ACTIVE',
  privileges: []
});

function roleLabel(r) {
  const found = availableRoles.find(ar => ar.value === r);
  return found?.label || r;
}

function getUserPrivileges(user) {
  const privs = user.privileges || getDefaultPrivileges(user.role);
  return privs.slice(0, 4).map(p => p.split(':').pop());
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
  --urm-bg: #f9fafb; --urm-card: #fff; --urm-border: #e5e7eb;
  --urm-text: #1f2937; --urm-text-sec: #4b5563; --urm-text-muted: #6b7280;
  --urm-accent: #2563eb;
  min-height: 100%; background: var(--urm-bg); padding: 1.5rem 2rem 3rem;
}

/* Header */
.urm-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
.urm-title { font-size: 1.35rem; font-weight: 800; color: var(--urm-text); letter-spacing: -0.02em; }
.urm-subtitle { font-size: .8rem; color: var(--urm-text-sec); margin-top: .2rem; font-weight: 500; }
.urm-header-actions { display: flex; gap: .5rem; }

/* Buttons */
.urm-btn-primary { display: inline-flex; align-items: center; gap: .4rem; padding: .5rem 1rem; background: var(--urm-accent); color: #fff; font-weight: 700; font-size: .78rem; border: none; border-radius: 8px; cursor: pointer; transition: all .15s; }
.urm-btn-primary:hover { background: #1d4ed8; }
.urm-btn-ghost { display: inline-flex; align-items: center; gap: .4rem; padding: .5rem 1rem; background: transparent; color: var(--urm-text); font-weight: 600; font-size: .78rem; border: 1px solid var(--urm-border); border-radius: 8px; cursor: pointer; transition: all .15s; }
.urm-btn-ghost:hover { background: #f5f5f5; border-color: #d4d4d4; }

/* Stats */
.urm-stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: .75rem; margin-bottom: 1.5rem; }
.urm-stat-card { display: flex; align-items: center; gap: .75rem; padding: .9rem 1rem; background: var(--urm-card); border: 1px solid var(--urm-border); border-radius: 10px; }
.urm-stat-icon { width: 38px; height: 38px; border-radius: 9px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.urm-stat-icon svg { width: 19px; height: 19px; }
.urm-stat-body { display: flex; flex-direction: column; }
.urm-stat-val { font-size: 1.25rem; font-weight: 800; color: var(--urm-text); line-height: 1.1; }
.urm-stat-label { font-size: .66rem; font-weight: 600; color: var(--urm-text-muted); margin-top: .1rem; }

/* Filters */
.urm-filters { display: flex; gap: .35rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
.urm-filter-btn { font-size: .72rem; font-weight: 600; padding: .35rem .7rem; border-radius: 6px; border: 1px solid var(--urm-border); background: var(--urm-card); color: var(--urm-text-sec); cursor: pointer; transition: all .15s; }
.urm-filter-btn:hover { background: #f5f5f5; border-color: #d4d4d4; }
.urm-filter-btn.active { background: var(--urm-accent); color: #fff; border-color: var(--urm-accent); font-weight: 700; box-shadow: 0 1px 4px rgba(37,99,235,.2); }

/* Table */
.urm-table-card { background: var(--urm-card); border: 1px solid var(--urm-border); border-radius: 10px; overflow: hidden; }
.urm-table { width: 100%; border-collapse: collapse; text-align: left; font-size: .8rem; }
.urm-table th { padding: .7rem 1rem; font-size: .68rem; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: var(--urm-text-sec); border-bottom: 1.5px solid var(--urm-border); background: #f9fafb; white-space: nowrap; }
.th-num { width: 40px; text-align: center; }
.th-actions { text-align: right; }
.urm-row { border-bottom: 1px solid #f0f0f0; transition: background .12s; }
.urm-row:nth-child(even) { background: #fafafa; }
.urm-row:hover { background: #f5f5f5; }
.urm-table td { padding: .6rem 1rem; vertical-align: middle; color: var(--urm-text); }
.td-num { text-align: center; font-weight: 600; color: var(--urm-text-muted); }
.td-email { font-family: 'JetBrains Mono', monospace; font-size: .72rem; color: var(--urm-text-sec); }
.td-actions { text-align: right; white-space: nowrap; }

/* User cell */
.urm-user-name { font-weight: 700; color: var(--urm-text); font-size: .8rem; }
.urm-user-handle { font-size: .68rem; color: var(--urm-text-muted); }

/* Role tag */
.urm-role-tag { font-size: .7rem; font-weight: 700; padding: .2rem .55rem; border-radius: 5px; background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; }

/* Privilege pills */
.urm-priv-pills { display: flex; gap: .2rem; flex-wrap: wrap; }
.urm-priv-pill { font-size: .62rem; font-weight: 600; padding: .15rem .4rem; border-radius: 4px; background: #f5f5f5; color: var(--urm-text-sec); border: 1px solid #e5e5e5; }
.urm-priv-pill.none { color: var(--urm-text-muted); }

/* Status */
.urm-status { font-size: .65rem; font-weight: 700; padding: .18rem .45rem; border-radius: 4px; text-transform: uppercase; letter-spacing: .03em; }
.urm-status.on { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
.urm-status.off { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }

/* Action buttons */
.urm-act-btn { font-size: .68rem; font-weight: 700; padding: .28rem .55rem; border-radius: 5px; border: 1px solid var(--urm-border); background: var(--urm-card); color: var(--urm-text-sec); cursor: pointer; transition: all .12s; margin-left: .3rem; }
.urm-act-btn:hover { background: #f5f5f5; border-color: #d4d4d4; }
.urm-act-btn.accent { color: #1d4ed8; border-color: #bfdbfe; background: #eff6ff; }
.urm-act-btn.accent:hover { background: #dbeafe; }
.urm-act-btn.danger { color: #b91c1c; border-color: #fecaca; background: #fef2f2; }
.urm-act-btn.danger:hover { background: #fee2e2; }

/* Pagination */
.urm-pagination { display: flex; align-items: center; justify-content: space-between; padding: .7rem 1rem; border-top: 1px solid var(--urm-border); }
.urm-page-info { font-size: .72rem; font-weight: 600; color: var(--urm-text-muted); }
.urm-page-btns { display: flex; gap: .25rem; }
.urm-page-btn { font-size: .7rem; font-weight: 700; padding: .25rem .55rem; border-radius: 5px; border: 1px solid var(--urm-border); background: var(--urm-card); color: var(--urm-text-sec); cursor: pointer; transition: all .12s; }
.urm-page-btn:hover:not(:disabled) { background: #f5f5f5; border-color: #d4d4d4; }
.urm-page-btn.active { background: var(--urm-accent); color: #fff; border-color: var(--urm-accent); box-shadow: 0 1px 3px rgba(37,99,235,.15); }
.urm-page-btn:disabled { opacity: .35; cursor: not-allowed; }

/* Modal */
.urm-overlay { position: fixed; inset: 0; z-index: 9999; background: rgba(0,0,0,.5); backdrop-filter: blur(3px); display: flex; align-items: center; justify-content: center; padding: 1rem; }
.urm-modal { background: var(--urm-card); border-radius: 14px; width: 100%; max-width: 720px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,.15); }
.urm-modal.urm-modal-wide { max-width: 860px; }
.urm-modal-header { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 2rem; border-bottom: 1px solid var(--urm-border); }
.urm-modal-header h3 { font-size: 1.05rem; font-weight: 800; color: var(--urm-text); }
.urm-modal-close { width: 30px; height: 30px; border: none; background: #f3f4f6; border-radius: 7px; font-size: 1.3rem; cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--urm-text-sec); transition: all .12s; line-height: 1; }
.urm-modal-close:hover { background: #e5e7eb; }
.urm-modal-body { padding: 1.75rem 2rem; }
.urm-modal-footer { display: flex; align-items: center; justify-content: flex-end; gap: .6rem; padding: 1.1rem 2rem; border-top: 1px solid var(--urm-border); }

/* Form */
.urm-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; }
.urm-field { display: flex; flex-direction: column; gap: .35rem; }
.urm-field.full { grid-column: 1 / -1; }
.urm-field label { font-size: .72rem; font-weight: 700; color: var(--urm-text); letter-spacing: .01em; }
.urm-field input, .urm-field select { padding: .6rem .85rem; border: 1px solid var(--urm-border); border-radius: 8px; font-size: .82rem; font-family: inherit; color: var(--urm-text); outline: none; transition: border-color .15s, box-shadow .15s; background: #fff; }
.urm-field input:focus, .urm-field select:focus { border-color: #404040; box-shadow: 0 0 0 3px rgba(0,0,0,.04); }
.urm-field input:disabled { background: #fafafa; color: var(--urm-text-muted); }

/* Privilege Section */
.urm-priv-section { border-top: 1px solid var(--urm-border); padding-top: 1.25rem; }
.urm-priv-section h4 { font-size: .85rem; font-weight: 800; color: var(--urm-text); margin-bottom: .25rem; }
.urm-priv-hint { font-size: .74rem; color: var(--urm-text-muted); margin-bottom: .85rem; }
.urm-priv-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .65rem; }
.urm-priv-grid.wide { grid-template-columns: 1fr 1fr; }
.urm-priv-module { background: #fafafa; border: 1px solid var(--urm-border); border-radius: 9px; padding: .7rem .9rem; }
.urm-priv-mod-head { margin-bottom: .4rem; }
.urm-priv-actions { display: flex; flex-wrap: wrap; gap: .35rem .85rem; padding-left: 1.4rem; }

/* Checkboxes */
.urm-check-row { display: flex; align-items: center; gap: .35rem; cursor: pointer; font-size: .75rem; font-weight: 600; color: var(--urm-text); }
.urm-check-row.sub { font-size: .7rem; font-weight: 500; color: var(--urm-text-sec); }
.urm-check-row input[type="checkbox"] { width: 14px; height: 14px; border-radius: 3px; accent-color: #2563eb; cursor: pointer; }
.urm-check-title { font-weight: 700; }
</style>
