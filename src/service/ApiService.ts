import axios from "axios";
import { responseHandler } from "./ApiResponseHandler";
import type { AsyncResponse } from "@/types/interface";
import type {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { useAuthStore } from "@/stores/auth";
import { onUnmounted } from 'vue'
import { useSignal } from "@/composables/useSignal";

export const backendApi = import.meta.env?.v_API_URI

const authApiBase = import.meta.env?.v_API_AUTH_URI;
const refreshEndpointPath = "/users/refresh-token";

let refreshPromise: Promise<{ newToken: string; refreshToken?: string } | null> | null = null;

function extractErrorMessage(data: any): string {
  if (!data) return "";

  if (typeof data === "string") {
    try {
      const parsed = JSON.parse(data);
      return String(parsed?.message || parsed?.error || "");
    } catch {
      return data;
    }
  }

  if (typeof data === "object") return String(data?.message || data?.error || "");
  return "";
}

function shouldForceLogoutOn401(status: any, data: any): boolean {
  if (status !== 401) return false;

  // Only force logout when backend explicitly says session is invalid.
  // Do NOT force logout for all 401s (e.g., JWT expiry should go through refresh flow).
  let message = "";

  if (typeof data === "string") {
    try {
      const parsed = JSON.parse(data);
      message = String(parsed?.message || "");
    } catch {
      message = "";
    }
  } else if (data && typeof data === "object") {
    message = String((data as any)?.message || "");
  }

  return message.trim().toLowerCase() === "session invalid";
}

async function refreshAccessToken(): Promise<{ newToken: string; refreshToken?: string } | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const authStore = useAuthStore();
    const refreshToken = authStore.auth?.user?.refreshToken;
    if (!refreshToken) return null;
    if (!authApiBase) return null;

    const res = await axios.post<any, AxiosResponse<any>>(
      `${authApiBase}${refreshEndpointPath}`,
      { token: refreshToken },
      { withCredentials: true }
    );

    const newToken = res?.data?.newToken;
    const newRefreshToken = res?.data?.refreshToken;

    if (!newToken || typeof newToken !== "string") return null;

    authStore.setAuth({
      ...(authStore.auth?.user || {}),
      token: newToken,
      refreshToken:
        typeof newRefreshToken === "string" && newRefreshToken ? newRefreshToken : refreshToken,
    });

    return {
      newToken,
      refreshToken: typeof newRefreshToken === "string" ? newRefreshToken : undefined,
    };
  })()
    .catch(() => null)
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

export default class ApiService {

  api: AxiosInstance

  constructor(baseURL?: string) {
    if (baseURL){
      this.api = axios.create({
        //timeout: 3000,
        baseURL,
        withCredentials: true,
        validateStatus: (status: number) => {
          return status < 300 && status >= 200;
        },
      })
    } else {
      this.api = axios.create({
        //timeout: 3000,
        baseURL: backendApi,
        withCredentials: true,
        validateStatus: (status: number) => {
          return status < 300 && status >= 200;
        },
      })
    }

    this.api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
      const authStore = useAuthStore();
      const token = authStore.auth?.user?.token;
      if (token) {
        config.headers = config.headers || {};
        (config.headers as any).Authorization = `Bearer ${token}`;
      }
      return config;
    });

    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const status = error?.response?.status;
        const data = error?.response?.data;
        const msg = extractErrorMessage(data);
        const originalConfig = error?.config as
          | (InternalAxiosRequestConfig & { _retry?: boolean })
          | undefined;

        if (shouldForceLogoutOn401(status, data)) {
          const authStore = useAuthStore();
          authStore.logout();
          return Promise.reject(error);
        }

        const isExpired =
          status === 401 &&
          (msg === "JWT token is expired" || msg.toLowerCase().includes("token is expired"));

        if (!isExpired || !originalConfig || originalConfig._retry) {
          return Promise.reject(error);
        }

        originalConfig._retry = true;

        const refreshed = await refreshAccessToken();
        if (!refreshed?.newToken) {
          const authStore = useAuthStore();
          authStore.logout();
          return Promise.reject(error);
        }

        originalConfig.headers = originalConfig.headers || {};
        (originalConfig.headers as any).Authorization = `Bearer ${refreshed.newToken}`;

        return this.api(originalConfig);
      }
    );
  }

  async get<T>(url: string, config: AxiosRequestConfig = {}): Promise<AsyncResponse<T>> {
    const signal = useSignal()
  
    // console.log("Sending token:", config?.headers?.Authorization ?? this.api.defaults.headers.common.Authorization);
  
    return await responseHandler<T>(
      this.api({
        signal: signal.signal.value,
        ...config,
        headers: {
          ...(config?.headers || {}),
        },
        url,
        method: "get",
      })
    );
  }
  

  async post<T, D = any>(url: string, data: D, config: AxiosRequestConfig = {}) {
    const signal = useSignal()
    return await responseHandler<T>(
      this.api({
        signal: signal.signal.value,
        ...config,
        headers: {
          ...(config?.headers || {}),
        },
        data,
        url,
        method: "post",
      })
    );
  }

  async put<T>(url: string, data: T, config: AxiosRequestConfig = {}) {
    const signal = useSignal()
    return await responseHandler(
      this.api({
        signal: signal.signal.value,
        ...config,
        headers: {
          ...(config?.headers || {}),
        },
        data,
        url,
        method: "put",
      })
    );
  }

  async patch<T>(url: string, data: T, config: AxiosRequestConfig = {}) {
    const signal = useSignal()
    return await responseHandler(
      this.api({
        signal: signal.signal.value,
        ...config,
        headers: {
          ...(config?.headers || {}),
        },
        data,
        url,
        method: "patch",
      })
    );
  }

  async delete<T>(url: string, config: AxiosRequestConfig = {}) {
    const signal = useSignal()
    return await responseHandler(
      this.api({
        signal: signal.signal.value,
        ...config,
        headers: {
          ...(config?.headers || {}),
        },
        url,
        method: "delete",
      })
    );
  }

  addAuthenticationHeader() {
    const authStore = useAuthStore()
    const token = authStore.auth?.user?.token;
    if (token) {
      this.api.defaults.headers.common.Authorization = `Bearer ${token}`;
      // console.log("✓ Authorization header set successfully");
    } else {
      console.warn("⚠ Token not found in auth store");
    }
    return this;
  }
}