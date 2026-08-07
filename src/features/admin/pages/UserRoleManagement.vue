<template>
  <div class="p-6 bg-slate-50 min-h-screen font-sans text-slate-800">
    
    <!-- Top Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-xl bg-blue-900 text-white flex items-center justify-center font-black text-base shadow">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
          </div>
          Nyala System User & Privilege Access Control
        </h1>
        <p class="text-xs text-slate-500 mt-1 font-medium">Manage corporate user credentials, persona roles, and functional privilege assignments.</p>
      </div>

      <div class="flex items-center gap-3">
        <button @click="showCreateModal = true" class="px-4 py-2.5 bg-blue-950 hover:bg-blue-900 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
          Add New System User
        </button>
      </div>
    </div>

    <!-- Users & Roles Table -->
    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div>
          <h2 class="text-sm font-bold text-slate-900">Configured System Accounts</h2>
          <p class="text-[11px] text-slate-500">Active role privileges control UI permissions and server-side X-User-Role guards.</p>
        </div>
        <span class="px-3 py-1 bg-blue-50 text-blue-900 font-bold text-xs rounded-full border border-blue-200">
          {{ userRoles.length }} Accounts
        </span>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
              <th class="py-3 px-6">User Account</th>
              <th class="py-3 px-6">Role & Privileges</th>
              <th class="py-3 px-6">Email Address</th>
              <th class="py-3 px-6">Status</th>
              <th class="py-3 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 font-medium">
            <tr v-for="user in userRoles" :key="user.id" class="hover:bg-slate-50/80 transition">
              <td class="py-3.5 px-6">
                <div class="font-bold text-slate-950">{{ user.fullName || user.username }}</div>
                <div class="text-[11px] font-mono text-slate-500">@{{ user.username }}</div>
              </td>

              <td class="py-3.5 px-6">
                <span :class="roleBadgeClass(user.role)" class="px-2.5 py-1 rounded-lg text-[11px] font-bold border">
                  {{ roleLabel(user.role) }}
                </span>
              </td>

              <td class="py-3.5 px-6 font-mono text-slate-600">
                {{ user.email }}
              </td>

              <td class="py-3.5 px-6">
                <span :class="user.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'" class="px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase">
                  {{ user.status || 'ACTIVE' }}
                </span>
              </td>

              <td class="py-3.5 px-6 text-right space-x-2">
                <button @click="editUserRole(user)" class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-lg cursor-pointer transition">
                  Edit Role
                </button>
                <button @click="handleDeleteUser(user.id)" class="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-[11px] rounded-lg cursor-pointer transition">
                  Revoke
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create / Edit User Modal -->
    <div v-if="showCreateModal" class="fixed inset-0 z-[9999] bg-slate-900/80 backdrop-blur-sm p-4 flex items-center justify-center">
      <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
        <h3 class="text-base font-extrabold text-slate-900 mb-1">
          {{ editingId ? 'Update System User Privileges' : 'Create New System User' }}
        </h3>
        <p class="text-xs text-slate-500 mb-5">Assign persona access role for Nyala Digital Channel.</p>

        <div class="space-y-4 text-xs font-semibold">
          <div>
            <label class="block text-slate-700 mb-1">Username / Account ID</label>
            <input v-model="form.username" :disabled="!!editingId" type="text" placeholder="e.g. underwriter_solomon" class="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-900 outline-none" />
          </div>

          <div>
            <label class="block text-slate-700 mb-1">Full Name</label>
            <input v-model="form.fullName" type="text" placeholder="e.g. Solomon Tadesse" class="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-900 outline-none" />
          </div>

          <div>
            <label class="block text-slate-700 mb-1">Corporate Email Address</label>
            <input v-model="form.email" type="email" placeholder="underwriter@nyalainsurance.com" class="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-900 outline-none" />
          </div>

          <div>
            <label class="block text-slate-700 mb-1">Assigned Privilege Role</label>
            <select v-model="form.role" class="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-900 outline-none bg-white font-bold text-slate-900">
              <option value="ROLE_UNDERWRITER">Underwriter (ROLE_UNDERWRITER)</option>
              <option value="ROLE_ADJUSTOR">Vehicle Adjustor (ROLE_ADJUSTOR)</option>
              <option value="ROLE_CLAIM_MANAGER">Claim Manager (ROLE_CLAIM_MANAGER)</option>
              <option value="ROLE_PRODUCT_MANAGER">Product Manager (ROLE_PRODUCT_MANAGER)</option>
              <option value="ROLE_CUSTOMER">Insured Customer (ROLE_CUSTOMER)</option>
              <option value="ROLE_SUPER_ADMIN">System Super Admin (ROLE_SUPER_ADMIN)</option>
            </select>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-slate-100">
          <button @click="showCreateModal = false" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer">
            Cancel
          </button>
          <button @click="handleSaveUser" class="px-4 py-2 bg-blue-950 hover:bg-blue-900 text-white font-bold text-xs rounded-xl cursor-pointer shadow">
            Save Access User
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { fetchUserRoles, createUserRole, updateUserRole, deleteUserRole } from '@/features/digitalChannel/api/digitalChannelApi';
import { useRoleContext } from '@/features/motor/composables/useRoleContext';

const { setRole } = useRoleContext();

const userRoles = ref([]);
const showCreateModal = ref(false);
const editingId = ref(null);

const form = ref({
  username: '',
  fullName: '',
  email: '',
  role: 'ROLE_UNDERWRITER',
  status: 'ACTIVE'
});

const testCredentials = [
  { role: 'ROLE_UNDERWRITER', roleLabel: 'Underwriter', name: 'Solomon Tadesse', username: 'admin_underwriter' },
  { role: 'ROLE_ADJUSTOR', roleLabel: 'Adjustor', name: 'Dawit Tesfaye', username: 'adjustor_dawit' },
  { role: 'ROLE_CLAIM_MANAGER', roleLabel: 'Claim Manager', name: 'Tigist Worku', username: 'claim_manager' },
  { role: 'ROLE_PRODUCT_MANAGER', roleLabel: 'Product Mgr', name: 'Abebe Kebede', username: 'product_manager' },
  { role: 'ROLE_CUSTOMER', roleLabel: 'Customer', name: 'Biruk Hagoss', username: 'customer_biruk' },
];

import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

onMounted(() => {
  const user = authStore.auth?.user ?? authStore.auth;
  const roleName = user?.roleName;
  const roleCode = user?.roleCode || user?.role;
  const isSuperAdmin = roleName === 'Super Admin' || roleCode === 'ROLE_SUPER_ADMIN';

  if (!isSuperAdmin) {
    alert('Access Restricted: User & Role management is reserved for Super Admin users.');
    router.replace('/module-select');
    return;
  }
  loadUsers();
});

async function loadUsers() {
  userRoles.value = await fetchUserRoles();
}

function quickSwitchRole(r) {
  setRole(r);
  alert(`Testing persona switched to: ${r}`);
}

function roleLabel(r) {
  const map = {
    ROLE_UNDERWRITER: 'Underwriter',
    ROLE_ADJUSTOR: 'Vehicle Adjustor',
    ROLE_CLAIM_MANAGER: 'Claim Manager',
    ROLE_PRODUCT_MANAGER: 'Product Manager',
    ROLE_CUSTOMER: 'Insured Customer',
    ROLE_SUPER_ADMIN: 'Super Admin'
  };
  return map[r] || r;
}

function roleBadgeClass(r) {
  const map = {
    ROLE_UNDERWRITER: 'bg-blue-50 text-blue-900 border-blue-200',
    ROLE_ADJUSTOR: 'bg-purple-50 text-purple-900 border-purple-200',
    ROLE_CLAIM_MANAGER: 'bg-amber-50 text-amber-900 border-amber-200',
    ROLE_PRODUCT_MANAGER: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    ROLE_CUSTOMER: 'bg-slate-100 text-slate-800 border-slate-300',
    ROLE_SUPER_ADMIN: 'bg-rose-50 text-rose-900 border-rose-200'
  };
  return map[r] || 'bg-slate-100 text-slate-800 border-slate-300';
}

function editUserRole(u) {
  editingId.value = u.id;
  form.value = { ...u };
  showCreateModal.value = true;
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
    form.value = { username: '', fullName: '', email: '', role: 'ROLE_UNDERWRITER', status: 'ACTIVE' };
    await loadUsers();
  } catch (e) {
    alert(e?.response?.data?.message || e.message || 'Failed to save user role');
  }
}

async function handleDeleteUser(id) {
  if (!confirm('Are you sure you want to revoke access for this user account?')) return;
  try {
    await deleteUserRole(id);
    await loadUsers();
  } catch (e) {
    alert('Failed to delete user');
  }
}
</script>
