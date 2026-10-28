<script setup>
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useApiRequest } from "@/composables/useApiRequest";
import { updatePayerMode } from "../api/settingsApi";
import { toasted } from "@/utils/utils";

const auth = useAuthStore();
const req = useApiRequest();

const payerUuid = computed(() => auth.auth?.user?.payerUuid || "");

const currentMode = ref(null);
const saving = ref(false);

const MODES = [
  {
    value: "DIRECT",
    label: "Direct",
    description: "Claims are processed and paid directly without quotation review.",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
      <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>`,
  },
  {
    value: "QUOTATION",
    label: "Quotation",
    description: "Claims require quotation approval before processing and payment.",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
    </svg>`,
  },
];

function selectMode(mode) {
  if (currentMode.value === mode || saving.value) return;
  currentMode.value = mode;
  saveMode(mode);
}

function saveMode(mode) {
  if (!payerUuid.value) {
    toasted(false, "Payer UUID not found. Please log in again.");
    return;
  }

  saving.value = true;
  req.send(
    () => updatePayerMode(payerUuid.value, mode),
    (res) => {
      saving.value = false;
      if (res.success) {
        toasted(true, `Mode switched to ${mode} successfully`);
      } else {
        toasted(false, res.error || "Failed to update mode");
        currentMode.value = null;
      }
    }
  );
}
</script>

<template>
  <div class="min-h-full p-6 lg:p-10">
    <!-- Page Header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900">Settings</h1>
      <p class="mt-1 text-sm text-gray-500">Manage your payer account configuration and preferences.</p>
    </div>

    <!-- Settings Card -->
    <div class="max-w-3xl space-y-6">

      <!-- Claim Processing Mode Section -->
      <div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <!-- Section Header -->
        <div class="px-6 py-5 border-b border-gray-100">
          <div class="flex items-center gap-3">
            <div class="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-primary">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h2 class="text-base font-semibold text-gray-900">Claim Processing Mode</h2>
              <p class="text-xs text-gray-500 mt-0.5">Choose how claims are processed for your institution</p>
            </div>
          </div>
        </div>

        <!-- Mode Options -->
        <div class="p-6">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <button
              v-for="mode in MODES"
              :key="mode.value"
              @click="selectMode(mode.value)"
              :disabled="saving"
              class="relative flex flex-col gap-3 p-5 rounded-xl border-2 text-left transition-all duration-200 focus:outline-none"
              :class="[
                currentMode === mode.value
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50',
                saving ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
              ]"
            >
              <!-- Selected indicator -->
              <div
                class="absolute top-4 right-4 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200"
                :class="currentMode === mode.value ? 'border-primary bg-primary' : 'border-gray-300 bg-white'"
              >
                <svg v-if="currentMode === mode.value" class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
              </div>

              <!-- Icon -->
              <div
                class="flex items-center justify-center w-10 h-10 rounded-lg transition-colors duration-200"
                :class="currentMode === mode.value ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'"
              >
                <span v-html="mode.icon" />
              </div>

              <!-- Label & Description -->
              <div>
                <p
                  class="font-semibold text-sm transition-colors duration-200"
                  :class="currentMode === mode.value ? 'text-primary' : 'text-gray-800'"
                >
                  {{ mode.label }}
                </p>
                <p class="mt-1 text-xs text-gray-500 leading-relaxed">{{ mode.description }}</p>
              </div>
            </button>
          </div>

          <!-- Status & Info -->
          <div class="mt-5 flex items-start gap-3 p-4 rounded-lg bg-gray-50 border border-gray-100">
            <!-- Spinner while saving -->
            <template v-if="saving">
              <svg class="w-4 h-4 text-primary animate-spin mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <p class="text-xs text-gray-600">Applying mode change, please wait...</p>
            </template>

            <!-- Selected mode info -->
            <template v-else-if="currentMode">
              <svg class="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              <p class="text-xs text-gray-600">
                Active mode: <span class="font-semibold text-gray-800">{{ currentMode }}</span>. Changes take effect immediately for all claim submissions.
              </p>
            </template>

            <!-- No selection yet -->
            <template v-else>
              <svg class="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
              <p class="text-xs text-gray-600">
                Select a mode above to configure how claims are processed for payer <span class="font-mono font-semibold text-gray-800">{{ payerUuid || 'N/A' }}</span>.
              </p>
            </template>
          </div>
        </div>
      </div>

      <!-- Payer Info Card -->
      <div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div class="px-6 py-5 border-b border-gray-100">
          <div class="flex items-center gap-3">
            <div class="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-50">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-blue-600">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
              </svg>
            </div>
            <div>
              <h2 class="text-base font-semibold text-gray-900">Account Information</h2>
              <p class="text-xs text-gray-500 mt-0.5">Current payer account details</p>
            </div>
          </div>
        </div>
        <div class="p-6">
          <dl class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div class="flex flex-col gap-1">
              <dt class="text-xs font-medium text-gray-500 uppercase tracking-wide">Payer UUID</dt>
              <dd class="text-sm font-mono text-gray-800 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 truncate">
                {{ payerUuid || 'Not available' }}
              </dd>
            </div>
            <div class="flex flex-col gap-1">
              <dt class="text-xs font-medium text-gray-500 uppercase tracking-wide">Company</dt>
              <dd class="text-sm text-gray-800 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 truncate">
                {{ auth.auth?.user?.companyName || 'N/A' }}
              </dd>
            </div>
            <div class="flex flex-col gap-1">
              <dt class="text-xs font-medium text-gray-500 uppercase tracking-wide">User Role</dt>
              <dd class="text-sm text-gray-800 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                {{ auth.auth?.user?.roleName || 'N/A' }}
              </dd>
            </div>
            <div class="flex flex-col gap-1">
              <dt class="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</dt>
              <dd class="text-sm text-gray-800 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 truncate">
                {{ auth.auth?.user?.email || 'N/A' }}
              </dd>
            </div>
          </dl>
        </div>
      </div>

    </div>
  </div>
</template>
