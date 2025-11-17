import axios from "axios";
import { responseHandler } from "./ApiResponseHandler";
import { useAuthStore } from "@/stores/auth";
import { useSignal } from "@/composables/useSignal";

export const backendApi = import.meta.env?.v_API_PROVIDER_URI;

export default class ApiServiceProvider {
  constructor(baseURL) {
    this.api = axios.create({
      baseURL: baseURL || backendApi,
      validateStatus: (status) => status >= 200 && status < 300,
    });
  }

  async get(url, config = {}) {
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

  async post(url, data, config = {}) {
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

  async put(url, data, config = {}) {
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

  async patch(url, data, config = {}) {
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

  async delete(url, config = {}) {
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
