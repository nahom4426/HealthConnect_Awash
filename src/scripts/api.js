import axios from "axios";
import { useToast } from "vue-toastification";
import * as session from "./session";

const toast = useToast();

const backendUrl = import.meta.env.VITE_API_URL;
const authUrl = import.meta.env.VITE_AUTH_API;

const authApi = axios.create({
  baseURL: authUrl,
  timeout: 30000,
});

const api = axios.create({
  baseURL: backendUrl,
  timeout: 30000,
});

api.interceptors.request.use(
  (config) => {
    if (config.data instanceof FormData) {
      config.headers["Content-Type"] = "multipart/form-data";
    } else {
      config.headers["Content-Type"] = "application/json";
    }
    const token = getAccessToken();
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

authApi.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    return Promise.reject(error);
  }
);

function getAccessToken() {
  const user = session.getUser();
  return user.accessToken;
}

async function makeRequest(config) {
  try {
    const response = await api.request(config);
    return response.data;
  } catch (error) {
    toast.error(error.message);
  }
}

export async function makeAuthenticatedRequest(config) {
  const token = getAccessToken();
  if (token) {
    config.headers = {};
    config.headers["Authorization"] = `Bearer ${token}`;
    try {
      const response = await api.request(config);
      return response.data;
    } catch (error) {
      toast.error(error.message);
    }
  }
}

async function makeAuthRequest(config) {
    try {
      const response = await authApi.request(config);
      return response.data;
    } catch (error) {
      toast.error(error.message);
    }
}

export default {
  get(url) {
    return makeRequest({ method: "get", url });
  },
  authPost(url, data) {
    return makeAuthRequest({method: "post", url, data})
  },
  post(url, data) {
    return makeRequest({ method: "post", url, data });
  },
  put(url, data) {
    return makeRequest({ method: "put", url, data });
  },
  patch(url, data) {
    return makeRequest({ method: "patch", url, data });
  },
  delete(url) {
    return makeRequest({ method: "delete", url });
  },
  makeAuthenticatedRequest
};

