import { ref } from 'vue';
import { getActingRole, roleSwitcherEnabled, setActingRole } from '@/utils/actingRole';

const ROLES = [
  { code: 'ROLE_UNDERWRITER', name: 'Solomon Tadesse (Underwriter)', badge: 'bg-blue-100 text-blue-800 border-blue-200' },
  { code: 'ROLE_ADJUSTOR', name: 'Dawit Tesfaye (Field Adjustor)', badge: 'bg-purple-100 text-purple-800 border-purple-200' },
  { code: 'ROLE_CLAIM_MANAGER', name: 'Tigist Worku (Claim Manager)', badge: 'bg-amber-100 text-amber-800 border-amber-200' },
  { code: 'ROLE_PRODUCT_MANAGER', name: 'Abebe Kebede (Product Manager)', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { code: 'ROLE_CUSTOMER', name: 'Biruk Hagoss (Customer)', badge: 'bg-slate-100 text-slate-800 border-slate-200' },
];

// Demo builds fall back to Underwriter so the motor flow has a role to show;
// production only ever uses the signed-in user's role.
const activeRole = ref(getActingRole() || (roleSwitcherEnabled ? 'ROLE_UNDERWRITER' : ''));

function setRole(roleCode) {
  if (!roleSwitcherEnabled) return;
  activeRole.value = roleCode;
  setActingRole(roleCode);
}

export function useRoleContext() {
  activeRole.value = getActingRole() || activeRole.value;
  return {
    activeRole,
    setRole,
    ROLES,
    roleSwitcherEnabled,
  };
}
