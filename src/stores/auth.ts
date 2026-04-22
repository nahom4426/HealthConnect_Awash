import { defineStore } from "pinia";
import { ref, watch } from "vue";
import router from "@/router"; // ✅ IMPORT ROUTER DIRECTLY

export const useAuthStore = defineStore("authStore", () => {
  /* =======================
   * STATE
   * ======================= */
  const auth = ref<any>(null);
  const imageData = ref<string>("");
  const logoutTimer = ref<number | null>(null);

  /* =======================
   * CONSTANTS
   * ======================= */
  const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24h
  const LOGIN_TIMESTAMP_KEY = "login_timestamp";
  const USER_DETAIL_KEY = "userDetail";
  const IMAGE_DATA_KEY = "image_data";

  /* =======================
   * INITIALIZATION
   * ======================= */
  initializeSession();

  /* =======================
   * ACTIONS
   * ======================= */
  function setAuth(val: any) {
    if (!val) {
      clearAuthData();
      return;
    }

    const stripWrapperKeys = (obj: any) => {
      if (!obj || typeof obj !== "object") return obj;
      const clone = { ...obj };
      delete clone.success;
      delete clone.status;
      delete clone.error;
      delete clone.data;
      delete clone.totalPages;
      delete clone.totalElements;
      delete clone.page;
      delete clone.size;
      delete clone.content;
      return clone;
    };

    const storedUser = getStoredUser();

    // Case 1: Already wrapped (from localStorage)
    if (val?.user?.token) {
      auth.value = val;
    }
    // Case 2: Login response (flat object)
    else if (val?.token) {
      const cleanVal = stripWrapperKeys(val);
      auth.value = {
        user: {
          ...(storedUser || {}),
          ...cleanVal,
          token: cleanVal.token,
          refreshToken: cleanVal.refreshToken,
        },
      };
    } else {
      clearAuthData();
      return;
    }

    persistAuth();
    startLogoutTimer();
  }

  function setProfile(val: string) {
    imageData.value = val || "";
    val
      ? localStorage.setItem(IMAGE_DATA_KEY, val)
      : localStorage.removeItem(IMAGE_DATA_KEY);
  }

  function logout() {
    clearLogoutTimer();
    clearAuthData();
    auth.value = null;
    imageData.value = "";

    // ✅ SPA redirect (NO reload)
    router.replace("/login");
  }

  function resetLogoutTimer() {
    if (!auth.value) return;
    localStorage.setItem(LOGIN_TIMESTAMP_KEY, Date.now().toString());
    startLogoutTimer();
  }

  /* =======================
   * SESSION HANDLING
   * ======================= */
  function initializeSession() {
    const userDetail = localStorage.getItem(USER_DETAIL_KEY);
    const img = localStorage.getItem(IMAGE_DATA_KEY);
    const loginTime = localStorage.getItem(LOGIN_TIMESTAMP_KEY);

    if (userDetail) {
      try {
        const parsedUser = JSON.parse(userDetail);
        setAuth(parsedUser);
      } catch {
        clearAuthData();
        auth.value = null;
      }
    }
    if (img) imageData.value = img;

    if (!loginTime || !auth.value) return;

    const elapsed = Date.now() - Number(loginTime);
    const remaining = SESSION_DURATION - elapsed;

    if (remaining > 0) {
      startLogoutTimer(remaining);
    } else {
      clearAuthData(); // ❗ DO NOT call logout here
      auth.value = null;
    }
  }

  function startLogoutTimer(duration = SESSION_DURATION) {
    clearLogoutTimer();
    logoutTimer.value = window.setTimeout(logout, duration);
  }

  function clearLogoutTimer() {
    if (logoutTimer.value) {
      clearTimeout(logoutTimer.value);
      logoutTimer.value = null;
    }
  }

  /* =======================
   * HELPERS
   * ======================= */
  function persistAuth() {
    localStorage.setItem(USER_DETAIL_KEY, JSON.stringify(auth.value));
    localStorage.setItem(LOGIN_TIMESTAMP_KEY, Date.now().toString());
  }

  function clearAuthData() {
    localStorage.removeItem(USER_DETAIL_KEY);
    localStorage.removeItem(LOGIN_TIMESTAMP_KEY);
    localStorage.removeItem(IMAGE_DATA_KEY);
  }

  function getStoredUser() {
    try {
      const stored = localStorage.getItem(USER_DETAIL_KEY);
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      return parsed?.user ?? parsed;
    } catch {
      return null;
    }
  }

  /* =======================
   * GETTERS
   * ======================= */
  const isAuthenticated = () => !!auth.value?.user?.token;

  /* =======================
   * WATCHERS
   * ======================= */
  watch(auth, (val) => {
    if (!val) clearLogoutTimer();
  });

  return {
    auth,
    imageData,
    setAuth,
    setProfile,
    logout,
    resetLogoutTimer,
    isAuthenticated,
  };
});
