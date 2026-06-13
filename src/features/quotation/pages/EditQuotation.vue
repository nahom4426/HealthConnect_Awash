<script setup lang="ts">
import DefaultPage from "@/components/DefaultPage.vue";
import QuotationCreationDataProvider from "@/features/quotation/components/QuotationCreationDataProvider.vue";
import { onMounted, ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import QuotationForm from "../form/QuotationForm.vue";
import { getQuotationById, saveQuotationDraft, savedIssueQuotation } from "@/features/quotation/api/quotationApi";
import { toasted } from "@/utils/utils";

const route = useRoute();
const router = useRouter();
const quotationUuid = computed(() => route.params.quotationUuid as string);

const draft = ref<any>(null);
const loading = ref(false);
const error = ref<string | null>(null);

onMounted(async () => {
  if (!quotationUuid.value) return;
  loading.value = true;
  try {
    const resp: any = await getQuotationById(quotationUuid.value);
    draft.value = resp?.data || null;
  } catch (e: any) {
    error.value = e?.message || 'Failed to load quotation';
  } finally {
    loading.value = false;
  }
});

function buildPrefill(packages: any[]): { packageName: string; planType: string; services: any[] }[] {
  if (!draft.value) return [];
  const services = (draft.value.quoatedServices || []) as any[];
  const groups: Record<string, { packageName: string; planType: string; services: any[] }> = {};
  for (const s of services) {
    const pkgName = packages.find((p: any) => p.packageUuid === s.packageUuid)?.packageName || '';
    const key = `${pkgName}__${s.planType}`;
    if (!groups[key]) {
      groups[key] = { packageName: pkgName, planType: s.planType, services: [] };
    }
    groups[key].services.push({ ...s });
  }
  return Object.values(groups);
}

async function onFormSubmit(e: any) {
  if (!e) return;
  const action = e.action;
  const data = e.data || {};
  if (action !== 'save' && action !== 'issue') return;
  const quotedServices = (data.quoatedServices || [])
    .map((s: any) => {
      const raw = s?.description;
      const val = typeof raw === 'object' && raw !== null ? (raw.value ?? raw.id ?? raw) : raw;
      let descNum: number;
      if (typeof val === 'string') {
        const v = val.toLowerCase();
        if (v === 'member') descNum = 1;
        else if (v === 'spouse') descNum = 2;
        else if (v === 'children') descNum = 3;
        else descNum = Number.parseInt(val as any, 10);
      } else {
        descNum = Number(val);
      }
      return {
        ...s,
        description: Number.isFinite(descNum) && !Number.isNaN(descNum) ? descNum : 0,
      };
    });
  const payload = {
    quotationUuid: draft.value?.quotationUuid || '',
    institutionUuid: draft.value?.institutionUuid || '',
    description: draft.value?.description || '',
    quotedServiceUpdateRequests: quotedServices.map((s: any) => ({
      ...s,
      quotationUuid: s.quotationUuid || draft.value?.quotationUuid || '',
    })),
  } as any;
  try {
    if (action === 'save') {
      await saveQuotationDraft(payload);
      toasted(true, 'Quotation saved successfully');
      router.back();
    } else {
      await savedIssueQuotation(draft.value?.quotationUuid || payload.quotationUuid, payload);
      toasted(true, 'Quotation issued successfully');
      router.back();
    }
  } catch (err: any) {
    const apiErr = err?.response?.data || err;
    toasted(false, 'Failed to process quotation', apiErr);
  }
}
</script>

<template>
  <DefaultPage :first="false">
    <template #header>
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-slate-800">Edit Draft Quotation</h1>
        <div class="text-sm text-slate-500">
          <span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">Draft</span>
        </div>
      </div>
    </template>
    
    <div v-if="loading" class="p-8">
      <div class="flex flex-col items-center justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p class="text-slate-600">Loading draft quotation...</p>
      </div>
    </div>
    
    <div v-else-if="error" class="p-8">
      <div class="bg-red-50 border border-red-200 rounded-xl p-6">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-full bg-red-100">
            <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div>
            <h3 class="font-semibold text-red-800">Failed to load quotation</h3>
            <p class="text-red-600 mt-1">{{ error }}</p>
          </div>
        </div>
      </div>
    </div>
    
    <QuotationCreationDataProvider v-else v-slot="{ packages, pending }">
      <div class="max-w-7xl mx-auto w-full">
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
          <div class="px-6 py-5 bg-gradient-to-r from-blue-50 to-blue-100/50 border-b border-slate-200">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-2 h-8 bg-blue-600 rounded"></div>
                <div>
                  <h2 class="text-xl font-semibold text-slate-800">Edit Draft Quotation</h2>
                  <p class="text-sm text-slate-600 mt-1">
                    Modify services and coverage as needed. You can save changes or issue the quotation.
                  </p>
                </div>
              </div>
              
              <div class="text-sm text-slate-600">
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span class="font-medium text-blue-700">Draft Mode</span>
                </div>
              </div>
            </div>
          </div>
          
          <div v-if="pending" class="p-8">
            <div class="flex items-center justify-center">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span class="ml-3 text-slate-600">Loading packages...</span>
            </div>
          </div>
          
          <div v-else-if="!draft" class="p-8 text-center text-slate-500">
            <p>No draft quotation data available</p>
          </div>
          
          <div v-else class="p-6">
            <!-- Quotation Information Summary -->
            <div class="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div class="text-sm text-blue-700 mb-1 font-medium">Quotation ID</div>
                  <div class="font-mono text-sm text-blue-900 truncate">{{ draft.quotationUuid }}</div>
                </div>
                <div>
                  <div class="text-sm text-blue-700 mb-1 font-medium">Institution</div>
                  <div class="font-medium text-blue-900 truncate">{{ draft.institution?.institutionName || 'N/A' }}</div>
                </div>
                <div>
                  <div class="text-sm text-blue-700 mb-1 font-medium">Services Count</div>
                  <div class="font-medium text-blue-900">{{ draft.quoatedServices?.length || 0 }}</div>
                </div>
              </div>
            </div>
            
            <!-- Quotation Form -->
            <QuotationForm
              :packages="packages"
              :prefill="buildPrefill(packages)"
              :onSubmit="onFormSubmit"
              :showHeaderControls="true"
              :readOnlyRows="false"
              :acceptMode="true"
              :quotationUuid="draft.quotationUuid"
            />
            
            <!-- Editing Instructions -->
            <div class="mt-8 pt-6 border-t border-slate-200">
              <div class="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                <div class="p-2 rounded-full bg-slate-200 mt-0.5">
                  <svg class="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <div>
                  <h4 class="font-medium text-slate-800 mb-1">Editing Mode</h4>
                  <ul class="text-sm text-slate-600 space-y-1">
                    <li class="flex items-center gap-2">
                      <div class="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                      <span>You can modify any field in the quotation</span>
                    </li>
                    <li class="flex items-center gap-2">
                      <div class="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                      <span>Add new coverage types using the "Add New Coverage" section</span>
                    </li>
                    <li class="flex items-center gap-2">
                      <div class="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                      <span>Use "Save Changes" to update the draft or "Issue Saved" to finalize</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </QuotationCreationDataProvider>
  </DefaultPage>
</template>