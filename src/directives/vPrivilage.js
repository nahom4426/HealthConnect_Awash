import { useAuthStore } from "@/stores/auth";

function checkPrivilage(el, { value, modifiers }) {
  console.log(value);
  if (!value && !modifiers) return;

  const authStore = useAuthStore();
  let user = authStore.auth?.user;

  if (!user) {
    let storedUser = localStorage.getItem("userDetail");
    if (storedUser) {
      user = JSON.parse(storedUser);
      if (!user.privileges) {
        user.privileges = []; // Default to empty array
      }
    }
  }

  if (user?.privileges.includes("All Privileges") || user?.roleName === 'Super Admin') return;

  if (modifiers?.role && value) {
    if (user?.roleName !== value) {
      el.remove();
    }
    return;
  }

  if (value instanceof Array) {
    let privileges = user?.privileges || []; // Default to empty array
    const found = value.find((privilage) => privileges.includes(`ROLE_${privilage}`));

    if (!found) {
      el.remove();
    }
  }
}

const vPrivilage = {
  mounted: checkPrivilage,
  updated: checkPrivilage,
};

export default vPrivilage;
