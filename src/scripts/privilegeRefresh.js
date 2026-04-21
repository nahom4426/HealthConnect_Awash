import { useAuthStore } from "@/stores/auth";

import { getUserById } from "@/features/admin/user/Api/UserApi.js";



/**

 * Force Refresh Privileges After Update

 * 

 * This utility handles dynamic privilege updates without requiring logout/login.

 * It fetches the latest user data with updated role privileges and refreshes

 * the stored authentication state.

 */



/**

 * Refresh user privileges from the server and update local storage

 * @param {string} userId - The UUID of the user to refresh privileges for

 * @returns {Promise<boolean>} - Returns true if refresh was successful, false otherwise

 */

export async function refreshPrivileges(userId) {

  if (!userId) {

    console.error('❌ [PrivilegeRefresh] User ID is required for privilege refresh');

    return false;

  }



  try {

    console.log('🔄 [PrivilegeRefresh] Starting privilege refresh for user:', userId);

    console.log('[PrivilegeRefresh] userDetail BEFORE refresh:', localStorage.getItem('userDetail'));

    

    const authStore = useAuthStore();

    const currentUser = authStore.auth?.user;

    

    if (!currentUser) {

      console.error('❌ [PrivilegeRefresh] No authenticated user found');

      return false;

    }



    console.log('[PrivilegeRefresh] currentUser.userUuid:', currentUser?.userUuid);

    console.log('[PrivilegeRefresh] currentUser.roleUuid:', currentUser?.roleUuid);

    console.log(

      '[PrivilegeRefresh] currentUser privileges length:',

      Array.isArray(currentUser?.privileges) ? currentUser.privileges.length : 'not-array'

    );



    // Fetch latest user data from server

    const response = await getUserById(userId);

    console.log('📥 [PrivilegeRefresh] API response:', response);



    if (response?.success === false) {

      console.error('❌ [PrivilegeRefresh] Refresh request failed:', response);

      return false;

    }



    let updatedUser = null;

    

    // Handle different response formats

    if (response?.data) {

      updatedUser = response.data;

    } else if (response && typeof response === 'object') {

      updatedUser = response;

    } else {

      console.error('❌ [PrivilegeRefresh] Invalid API response format');

      return false;

    }



    if (!updatedUser) {

      console.error('❌ [PrivilegeRefresh] No user data received from API');

      return false;

    }



    if (updatedUser?.success === false) {

      console.error('❌ [PrivilegeRefresh] API returned an error payload instead of user data:', updatedUser);

      return false;

    }



    console.log('[PrivilegeRefresh] updatedUser keys:', Object.keys(updatedUser || {}));

    console.log('[PrivilegeRefresh] updatedUser.role exists?', !!updatedUser?.role);

    console.log('[PrivilegeRefresh] updatedUser.role.privilegeList length:', Array.isArray(updatedUser?.role?.privilegeList) ? updatedUser.role.privilegeList.length : 'not-array');



    // Merge with existing user data to preserve tokens and other fields

    const mergedUser = {

      ...currentUser, // Preserve existing data (tokens, etc.)

      ...updatedUser, // Override with updated data

      // Ensure critical fields are preserved

      token: currentUser.token,

      refreshToken: currentUser.refreshToken,

      email: currentUser.email,

      firstName: currentUser.firstName || updatedUser.firstName,

    };



    const normalizePrivilege = (priv) => {

      const raw =

        (typeof priv === 'string' && priv) ||

        priv?.authority ||

        priv?.privilegeName ||

        priv?.name ||

        '';



      if (!raw) return null;

      return raw.startsWith('ROLE_') ? raw : `ROLE_${raw}`;

    };



    // Handle privileges - rebuild from role's privilegeList if needed

    if (updatedUser.role?.privilegeList) {

      mergedUser.privileges = updatedUser.role.privilegeList

        .map(normalizePrivilege)

        .filter(Boolean);

      console.log('🔧 [PrivilegeRefresh] Rebuilt privileges from role privilegeList:', mergedUser.privileges);

    } else if (updatedUser.privileges) {

      mergedUser.privileges = updatedUser.privileges

        .map(normalizePrivilege)

        .filter(Boolean);

      console.log('✅ [PrivilegeRefresh] Using privileges from API response:', mergedUser.privileges);

    } else {

      // Fallback to current privileges if none in response

      mergedUser.privileges = currentUser.privileges || [];

      console.log('⚠️ [PrivilegeRefresh] No privileges in response, keeping current:', mergedUser.privileges);

    }



    // Preserve role information

    if (updatedUser.role) {

      mergedUser.roleName = updatedUser.role.roleName || updatedUser.role.name;

      mergedUser.roleUuid = updatedUser.role.roleUuid || updatedUser.role.uuid;

      console.log('👑 [PrivilegeRefresh] Updated role info:', {

        roleName: mergedUser.roleName,

        roleUuid: mergedUser.roleUuid

      });

    }



    // Update auth store with merged user data

    console.log('[PrivilegeRefresh] mergedUser (will be passed to setAuth):', mergedUser);

    authStore.setAuth(mergedUser);



    console.log('[PrivilegeRefresh] userDetail AFTER refresh:', localStorage.getItem('userDetail'));

    

    // Dispatch custom event for UI components to react

    window.dispatchEvent(new CustomEvent('privileges:updated', {

      detail: {

        userId,

        privileges: mergedUser.privileges,

        roleName: mergedUser.roleName,

        timestamp: Date.now()

      }

    }));



    console.log('✅ [PrivilegeRefresh] Privileges refreshed successfully:', {

      userId,

      privilegesCount: mergedUser.privileges.length,

      roleName: mergedUser.roleName,

      privileges: mergedUser.privileges

    });



    return true;



  } catch (error) {

    console.error('❌ [PrivilegeRefresh] Failed to refresh privileges:', error);

    return false;

  }

}



/**

 * Check if current user has specific privilege

 * @param {string|Array} privilege - Privilege name(s) to check

 * @returns {boolean} - Returns true if user has privilege(s)

 */

export function hasPrivilege(privilege) {

  const authStore = useAuthStore();

  let user = authStore.auth?.user;



  if (!user) {

    // Fallback to localStorage if store is empty

    const storedUser = localStorage.getItem("userDetail");

    if (storedUser) {

      user = JSON.parse(storedUser);

    }

  }



  if (!user) return false;



  // Super Admin has all privileges

  if (user.privileges?.includes("All Privileges") || user.roleName === 'Super Admin') {

    return true;

  }



  const privileges = user.privileges || [];



  if (Array.isArray(privilege)) {

    return privilege.some(priv => privileges.includes(`ROLE_${priv}`));

  } else {

    return privileges.includes(`ROLE_${privilege}`);

  }

}



/**

 * Get current user privileges

 * @returns {Array} - Array of current user privileges

 */

export function getCurrentPrivileges() {

  const authStore = useAuthStore();

  let user = authStore.auth?.user;



  if (!user) {

    const storedUser = localStorage.getItem("userDetail");

    if (storedUser) {

      user = JSON.parse(storedUser);

    }

  }



  return user?.privileges || [];

}



/**

 * Listen for privilege updates

 * @param {Function} callback - Callback function to execute when privileges are updated

 * @returns {Function} - Cleanup function to remove the event listener

 */

export function onPrivilegesUpdated(callback) {

  const handler = (event) => {

    console.log('🎯 [PrivilegeRefresh] Privileges updated event received:', event.detail);

    callback(event.detail);

  };



  window.addEventListener('privileges:updated', handler);

  

  // Return cleanup function

  return () => {

    window.removeEventListener('privileges:updated', handler);

  };

}



export default {

  refreshPrivileges,

  hasPrivilege,

  getCurrentPrivileges,

  onPrivilegesUpdated

};

