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
  const quotedServices = (data.quotations || [])
    .flatMap((q: any) => q.services || [])
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
      <h1>Edit Draft Quotation</h1>
    </template>
    <div v-if="loading" class="p-4">Loading...</div>
    <div v-else-if="error" class="p-4 text-red-600">{{ error }}</div>
    <QuotationCreationDataProvider v-else v-slot="{ packages, pending }">
      <QuotationForm
        v-if="!pending && draft"
        :packages="packages"
        :prefill="buildPrefill(packages)"
        :onSubmit="onFormSubmit"
      />
    </QuotationCreationDataProvider>
  </DefaultPage>
</template>
