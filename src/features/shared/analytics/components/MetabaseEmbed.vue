<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';

const props = defineProps<{
  title?: string;
  token?: string;
  instanceUrl?: string;
  withTitle?: boolean;
  withDownloads?: boolean;
}>();

const envToken = computed(() => {
  const value = (import.meta.env.VITE_METABASE_TOKEN || import.meta.env.v_METABASE_TOKEN || '').trim();
  return value;
});

const envInstanceUrl = computed(() => {
  const value = (import.meta.env.VITE_METABASE_INSTANCE_URL || import.meta.env.v_METABASE_INSTANCE_URL || import.meta.env.VITE_METABASE_URL || import.meta.env.v_METABASE_URL || '').trim();
  return value;
});

const normalizedInstanceUrl = computed(() => {
  const value = (props.instanceUrl || envInstanceUrl.value || '').trim();
  if (!value) return '';
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
});

const metabaseToken = computed(() => {
  return (props.token || envToken.value || '').trim();
});

const showTitle = computed(() => props.withTitle ?? true);
const showDownloads = computed(() => props.withDownloads ?? true);
const scriptLoaded = ref(false);
const scriptId = 'metabase-embed-script';

function defineMetabaseConfig() {
  if (!normalizedInstanceUrl.value) return;

  console.log('[MetabaseEmbed] Defining global window.metabaseConfig for URL:', normalizedInstanceUrl.value);
  const config = {
    theme: { preset: 'light' },
    isGuest: true,
    instanceUrl: normalizedInstanceUrl.value,
  };

  if (typeof window !== 'undefined') {
    (window as Window & { metabaseConfig?: unknown; defineMetabaseConfig?: (config: unknown) => void }).metabaseConfig = config;
    (window as Window & { metabaseConfig?: unknown; defineMetabaseConfig?: (config: unknown) => void }).defineMetabaseConfig?.(config);
  }
}

function ensureMetabaseScript() {
  if (!normalizedInstanceUrl.value || document.getElementById(scriptId)) {
    console.log('[MetabaseEmbed] Script already exists or URL is empty. URL:', normalizedInstanceUrl.value);
    scriptLoaded.value = Boolean(document.getElementById(scriptId));
    return;
  }

  const scriptUrl = `${normalizedInstanceUrl.value}/app/embed.js`;
  console.log('[MetabaseEmbed] Creating script tag for:', scriptUrl);
  
  const script = document.createElement('script');
  script.id = scriptId;
  script.defer = true;
  script.src = scriptUrl;
  script.onload = () => {
    console.log('[MetabaseEmbed] embed.js loaded SUCCESSFULLY.');
    scriptLoaded.value = true;
    defineMetabaseConfig();
  };
  script.onerror = (e) => {
    console.error('[MetabaseEmbed] FAILED to load embed.js from', script.src, e);
    scriptLoaded.value = false;
  };
  document.head.appendChild(script);
}

onMounted(() => {
  console.log('[MetabaseEmbed] Component mounted. Token length:', metabaseToken.value?.length);
  defineMetabaseConfig();
  ensureMetabaseScript();
});

watch([normalizedInstanceUrl, metabaseToken], () => {
  console.log('[MetabaseEmbed] URL or Token changed. Token length:', metabaseToken.value?.length);
  defineMetabaseConfig();
  ensureMetabaseScript();
});
</script>

<template>
  <div class="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
    <div v-if="metabaseToken && normalizedInstanceUrl" class="space-y-3">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 class="text-base font-semibold text-slate-800">{{ title || 'Embedded Metabase Dashboard' }}</h3>
          <p class="text-sm text-gray-500">This dashboard is loaded with Metabase’s embed component.</p>
        </div>
      </div>

      <div class="overflow-hidden rounded-xl border border-gray-200 bg-slate-50 p-3">
        <div v-if="scriptLoaded" class="min-h-[720px] w-full">
          <div class="metabase-embed-shell">
            <metabase-dashboard
              :token="metabaseToken"
              :with-title="showTitle ? 'true' : 'false'"
              :with-downloads="showDownloads ? 'true' : 'false'"
            ></metabase-dashboard>
          </div>
        </div>
        <div v-else class="flex min-h-[720px] items-center justify-center text-sm text-gray-600">
          Loading Metabase embed...
        </div>
      </div>
    </div>

    <div v-else class="rounded-xl border border-dashed border-gray-300 bg-slate-50 p-8 text-center">
      <h3 class="text-lg font-semibold text-slate-800">Metabase is not configured yet</h3>
      <p class="mt-2 text-sm text-gray-600">
        Set VITE_METABASE_TOKEN and VITE_METABASE_INSTANCE_URL in your environment to show the dashboard.
      </p>
    </div>
  </div>
</template>
