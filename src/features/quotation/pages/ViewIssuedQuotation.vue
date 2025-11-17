<script setup lang="ts">
import DefaultPage from "@/components/DefaultPage.vue";
import { Status } from "@/types/interface";
import QuotationForm from "../form/QuotationForm.vue";
import quotationDataProviderByStatus from "../components/quotationDataProviderByStatus.vue";
import Input from "@/components/new_form_elements/Input.vue";
import { onMounted, ref } from "vue";
import { getQuotationById, saveQuotationDraft, issueQuotation, acceptQuotation } from "@/features/quotation/api/quotationApi";
import { useRoute, useRouter } from "vue-router";
import { toasted } from "@/utils/utils";
import SingleInstitutionDataProvider from "@/features/institutions/components/SingleInstitutionDataProvider.vue";
import QuotationCreationDataProvider from "@/features/quotation/components/QuotationCreationDataProvider.vue";

const showInstitution = ref(true)
const showMore = ref(true)
const institutionForm = ref({
  institutionName: "",
  email: "",
  tinNumber: "",
  telephone: "",
  description: "",
  category: "",
  referralType: "",
  address: "",
})

function onIssuedFormSubmit(e: any) {
  if (!e) return;
  const action = e.action;
  const data = e.data || {};
  if (action === 'accept') {
    const qid = (draft.value?.quotationUuid || route.params.quotationUuid) as string;
    acceptQuotation(qid, { quotationUuid: qid })
      .then(() => {
        toasted(true, 'Quotation accepted');
        router.back();
      })
      .catch((err: any) => {
        const apiErr = err?.response?.data || err;
        toasted(false, 'Failed to accept quotation', apiErr);
      });
  }
}

const prefilled = ref(false)
const currentInstitution = ref<any>(null)
function prefillOnce(v: any) {
  if (!prefilled.value && v) {
    institutionForm.value = {
      institutionName: v.institutionName || "",
      email: v.email || "",
      tinNumber: (v.tinNumber as any) || "",
      telephone: v.telephone || "",
      description: v.description || "",
      category: (v.category as any) || "",
      referralType: v.referralType || "Direct",
      address: `${v.address1 || ''} ${v.address2 || ''} ${v.address3 || ''}, ${v.state || ''}`,
    }
    prefilled.value = true
    currentInstitution.value = v
  }
  return true
}

const route = useRoute();
const router = useRouter();

// Load issued quotation to get its institutionUuid
const loading = ref(false)
const error = ref<string | null>(null)
const institutionUuidForProvider = ref<string | null>(null)
const draft = ref<any>(null)
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
onMounted(async () => {
  const quotationUuid = route.params.quotationUuid as string
  if (!quotationUuid) return
  loading.value = true
  try {
    const resp: any = await getQuotationById(quotationUuid)
    const q = resp?.data || {}
    draft.value = q
    institutionUuidForProvider.value = q.institutionUuid || q.institution?.institutionUuid || null
  } catch (e: any) {
    error.value = e?.message || 'Failed to load issued quotation'
  } finally {
    loading.value = false
  }
})


</script>
<template>
  <DefaultPage :first="false">
    <template #header>
      <h1>Generate Quotaion</h1>
    </template>
    <div v-if="loading" class="p-4">Loading...</div>
    <div v-else-if="error" class="p-4 text-red-600">{{ error }}</div>
    <SingleInstitutionDataProvider
      v-else
      v-if="institutionUuidForProvider"
      :institutionUuid="institutionUuidForProvider as any"
      v-slot="{ instituton, pending }"
    >
      <template v-if="prefillOnce(instituton)"></template>
      <div class="px-4 box-border flex bg-sky-100 border-sky-400 border rounded-lg p-4 flex-col gap-3">
        <div class="flex flex-col  p-3 px-2 rounded-md gap-3">
          <div class="flex items-center justify-between border-b pb-2">
            <div class="text-3xl">Institution Detail</div>
            <button class="text-primary" @click.prevent="(showInstitution = !showInstitution)">{{ showInstitution ? 'Hide' : 'Show' }}</button>
          </div>
          <div v-show="showInstitution" class="grid grid-cols-2 gap-3">
            <Input name="institutionName" v-model="institutionForm.institutionName" label="Institution Name" />
            <Input name="email" v-model="institutionForm.email" label="Email" />
            <Input name="tinNumber" v-model="institutionForm.tinNumber" label="Tin Number" />
            <Input name="telephone" v-model="institutionForm.telephone" label="Telephone" />
          </div>
        </div>

        <div class="flex flex-col  p-3 px-2 rounded-md gap-3">
          <div class="flex items-center   justify-between border-b pb-2">
            <div class="text-lg">More Detail</div>
            <button class="text-primary" @click.prevent="(showMore = !showMore)">{{ showMore ? 'Hide' : 'Show' }}</button>
          </div>
          <div v-show="showMore" class="grid grid-cols-2 gap-3">
            <Input name="description" v-model="institutionForm.description" label="Description" />
            <Input name="category" v-model="institutionForm.category" label="Category" />
            <Input name="referralType" v-model="institutionForm.referralType" label="Source Of Business" />
            <Input name="address" v-model="institutionForm.address" label="Address" />
          </div>
        </div>
      </div>

      <div class="px-4 box-border flex bg-yellow-100 border border-yellow-400 rounded-lg p-4 flex-col gap-3 mt-4">
        <h2 class="text-2xl font-semibold flex">
          <p> Issued quotation for:</p>
          <div class="text-green-500 ml-2">{{ instituton?.institutionName }}</div>
        </h2>
        <QuotationCreationDataProvider v-slot="{ packages, pending: pkgPending }">
          <QuotationForm
            v-if="!pkgPending && draft"
            :packages="packages"
            :prefill="buildPrefill(packages)"
            :showHeaderControls="false"
            :readOnlyRows="true"
            :acceptLabel="'Accept'"
            :issueMode="true"
            :onSubmit="onIssuedFormSubmit"
          />
        </QuotationCreationDataProvider>
      </div>
    </SingleInstitutionDataProvider>
  </DefaultPage>
</template>

