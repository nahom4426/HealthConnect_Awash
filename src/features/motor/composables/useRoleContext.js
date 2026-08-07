import { ref } from 'vue';

const STORAGE_KEY = 'nyala_active_testing_role';

const ROLES = [
  { code: 'ROLE_UNDERWRITER', name: 'Solomon Tadesse (Underwriter)', badge: 'bg-blue-100 text-blue-800 border-blue-200' },
  { code: 'ROLE_ADJUSTOR', name: 'Dawit Tesfaye (Field Adjustor)', badge: 'bg-purple-100 text-purple-800 border-purple-200' },
  { code: 'ROLE_CLAIM_MANAGER', name: 'Tigist Worku (Claim Manager)', badge: 'bg-amber-100 text-amber-800 border-amber-200' },
  { code: 'ROLE_PRODUCT_MANAGER', name: 'Abebe Kebede (Product Manager)', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { code: 'ROLE_CUSTOMER', name: 'Biruk Hagoss (Customer)', badge: 'bg-slate-100 text-slate-800 border-slate-200' },
];

const activeRole = ref(
  localStorage.getItem(STORAGE_KEY) ||
  localStorage.getItem('user_role') ||
  localStorage.getItem('role') ||
  'ROLE_UNDERWRITER'
);

function setRole(roleCode) {
  activeRole.value = roleCode;
  localStorage.setItem(STORAGE_KEY, roleCode);
  localStorage.setItem('user_role', roleCode);
}

export function useRoleContext() {
  const currentRole = localStorage.getItem('user_role') || localStorage.getItem('role');
  if (currentRole && !localStorage.getItem(STORAGE_KEY)) {
    activeRole.value = currentRole;
  }
  return {
    activeRole,
    setRole,
    ROLES
  };
}
