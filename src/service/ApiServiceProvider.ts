import axios from "axios";
import type { AxiosInstance, AxiosRequestConfig } from "axios";
import { responseHandler } from "./ApiResponseHandler";
import { useAuthStore } from "@/stores/auth";
import { useSignal } from "@/composables/useSignal";

export const backendApi = import.meta.env?.v_API_PROVIDER_URI;

export default class ApiServiceProvider {
  api: AxiosInstance;

  constructor(baseURL?: string) {
    this.api = axios.create({
      baseURL: baseURL || backendApi,
      validateStatus: (status: number) => status >= 200 && status < 300,
    });
  }

  async get(url: string, config: AxiosRequestConfig = {}) {
    const signal = useSignal();
    return await responseHandler(
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

  async post(url: string, data?: any, config: AxiosRequestConfig = {}) {
    const signal = useSignal();
    return await responseHandler(
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

  async put(url: string, data?: any, config: AxiosRequestConfig = {}) {
    const signal = useSignal();
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

  async patch(url: string, data?: any, config: AxiosRequestConfig = {}) {
    const signal = useSignal();
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

  async delete(url: string, config: AxiosRequestConfig = {}) {
    const signal = useSignal();
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
    const auth = useAuthStore();
    this.api.defaults.headers.common.Authorization = `Bearer ${auth.auth.token}`;
    return this;
  }
}
