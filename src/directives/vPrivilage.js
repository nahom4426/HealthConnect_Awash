import { useAuthStore } from "@/stores/auth";
import { onPrivilegesUpdated } from "@/scripts/privilegeRefresh";

function checkPrivilage(el, { value, modifiers }) {
  
  const hasAnyModifier = modifiers && Object.keys(modifiers).length > 0;

  if (!value && !hasAnyModifier) {
    el.style.display = '';
    return;
  }

  const authStore = useAuthStore();
  let user = authStore.auth?.user;

  if (!user) {
    let storedUser = localStorage.getItem("userDetail");
    if (storedUser) {
      user = JSON.parse(storedUser);
      if (!user.privileges) {
        user.privileges = [];
      }
    }
  }

  // Super Admin has all privileges
  if (user?.privileges.includes("All Privileges") || user?.roleName === 'Super Admin') {
    el.style.display = '';
    return;
  }

  let hasAccess = false;

  // Role-based check
  if (modifiers?.role && value) {
    hasAccess = user?.roleName === value;
  }
  // Privilege-based check
  else if (value instanceof Array) {
    let privileges = user?.privileges || [];
    const found = value.find((privilage) => privileges.includes(`ROLE_${privilage}`));
    hasAccess = !!found;
  }
  // Single privilege check
  else if (value) {
    let privileges = user?.privileges || [];
    hasAccess = privileges.includes(`ROLE_${value}`);
  }

  // Hide/show instead of remove
  el.style.display = hasAccess ? '' : 'none';
  
  if (!hasAccess) {
  } else {
  }
}

const vPrivilage = {
  mounted(el, binding) {
    checkPrivilage(el, binding);
    
    // Store original display value
    el._originalDisplay = el.style.display;
    
    // Listen for privilege updates
    el._privilegeCleanup = onPrivilegesUpdated(() => {
      checkPrivilage(el, binding);
    });
  },
  
  updated(el, binding) {
    checkPrivilage(el, binding);
  },
  
  unmounted(el) {
    // Cleanup event listener
    if (el._privilegeCleanup) {
      el._privilegeCleanup();
    }
    // Restore original display
    if (el._originalDisplay !== undefined) {
      el.style.display = el._originalDisplay;
    }
  }
};

export default vPrivilage;
