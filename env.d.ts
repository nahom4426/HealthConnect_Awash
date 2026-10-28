/// <reference types="vite/client" />

// Variables read from .env.* (envPrefix: VITE_ and v_ in vite.config.ts)
interface ImportMetaEnv {
  readonly VITE_BACKEND_HOST?: string;
  readonly VITE_NOTIFICATION_HOST?: string;
  readonly VITE_API_URL?: string;
  readonly VITE_AUTH_API?: string;
  readonly VITE_ENABLE_ROLE_SWITCHER?: string;
  readonly VITE_METABASE_INSTANCE_URL?: string;
  readonly VITE_METABASE_URL?: string;
  readonly VITE_METABASE_TOKEN?: string;
  readonly v_API_AUTH_URI?: string;
  readonly v_API_URI?: string;
  readonly v_API_PROVIDER_URI?: string;
  readonly v_RECEIPT_URL?: string;
  readonly v_RECEIPT_URL_PROVIDER?: string;
  readonly v_METABASE_URL?: string;
  readonly v_METABASE_TOKEN?: string;
  readonly v_METABASE_INSTANCE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
