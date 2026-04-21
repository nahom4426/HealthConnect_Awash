import { defineStore } from "pinia";
import { ref, watch } from "vue";
import { useRouter } from "vue-router";

export const useAuthStore = defineStore("authStore", () => {
  // State
  const auth = ref<any>(null);
  const imageData = ref<string>("");
  const logoutTimer = ref<number | null>(null);

  // Constants (1 second for testing)
  const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24h: 24 * 60 * 60 * 1000
  const LOGIN_TIMESTAMP_KEY = "login_timestamp";
  const AUTH_DATA_KEY = "auth_data";
  const IMAGE_DATA_KEY = "image_data";

  // Router must be called inside functions
  const getRouter = () => useRouter();

  // Initialize session on store creation
  initializeSession();

  // Actions
  function setAuth(val: any) {
    auth.value = val;

    if (val) {
      localStorage.setItem(AUTH_DATA_KEY, JSON.stringify(val));
      localStorage.setItem(LOGIN_TIMESTAMP_KEY, Date.now().toString());
      startLogoutTimer();
      console.log("Auth set, timer started");
    } else {
      clearAuthData();
    }
  }

  function setProfile(val: string) {
    imageData.value = val;
    if (val) localStorage.setItem(IMAGE_DATA_KEY, val);
    else localStorage.removeItem(IMAGE_DATA_KEY);
  }

function logout() {
  // Clear all state
  auth.value = null;
  imageData.value = "";
  clearLogoutTimer();
  
  // Clear ALL auth-related localStorage (not just Pinia's)
  localStorage.removeItem("userDetail"); // Add your app-specific keys
  localStorage.removeItem(AUTH_DATA_KEY);
  localStorage.removeItem(LOGIN_TIMESTAMP_KEY);
  localStorage.removeItem(IMAGE_DATA_KEY);

  // Force reload to ensure clean state (avoid Vue/Pinia cache issues)
  try {
    const router = useRouter();
    router.push("/login").then(() => {
      window.location.reload(); // Hard refresh after redirect
    });
  } catch (e) {
    window.location.href = "/login"; // Fallback if router fails
  }
}
  function resetLogoutTimer() {
    if (auth.value) {
      localStorage.setItem(LOGIN_TIMESTAMP_KEY, Date.now().toString());
      startLogoutTimer();
    }
  }

  // Private functions
  function initializeSession() {
    const loginTime = localStorage.getItem(LOGIN_TIMESTAMP_KEY);
    const authData = localStorage.getItem(AUTH_DATA_KEY);
    const imgData = localStorage.getItem(IMAGE_DATA_KEY);

    if (authData) auth.value = JSON.parse(authData);
    if (imgData) imageData.value = imgData;

    if (loginTime && auth.value) {
      const elapsed = Date.now() - parseInt(loginTime);
      const remaining = SESSION_DURATION - elapsed;

      if (remaining > 0) {
        startLogoutTimer(remaining);
      } else {
        logout();
      }
    }
  }

function startLogoutTimer(duration: number = SESSION_DURATION) {
  clearLogoutTimer();
  console.log("[AuthStore] Timer started - will logout in", duration, "ms");
  
  logoutTimer.value = setTimeout(() => {
    console.log("[AuthStore] Timer expired - executing logout");
    logout();
  }, duration);
}

  function clearLogoutTimer() {
    if (logoutTimer.value) {
      clearTimeout(logoutTimer.value);
      logoutTimer.value = null;
    }
  }

  function clearAuthData() {
    localStorage.removeItem(AUTH_DATA_KEY);
    localStorage.removeItem(LOGIN_TIMESTAMP_KEY);
    localStorage.removeItem(IMAGE_DATA_KEY);
  }

  // Watch for auth changes (clear timer if manually logged out)
  watch(auth, (newVal) => {
    if (!newVal) clearLogoutTimer();
  });

  return {
    auth,
    imageData,
    setAuth,
    setProfile,
    logout,
    resetLogoutTimer,
  };
});