<script setup lang="ts">
import DefaultPage from "@/components/DefaultPage.vue";
import SingleInstitutionDataProvider from "@/features/institutions/components/SingleInstitutionDataProvider.vue";
import { Status } from "@/types/interface";
import QuotationForm from "../form/QuotationForm.vue";
import QuotationCreationDataProvider from "../components/QuotationCreationDataProvider.vue";
import Input from "@/components/new_form_elements/Input.vue";
import { ref } from "vue";
import { saveQuotationDraft, issueQuotation } from "@/features/quotation/api/quotationApi";
import { useRouter } from "vue-router";
import { toasted } from "@/utils/utils";

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

const router = useRouter();

async function onFormSubmit(e: any) {
  if (!e) return;
  const action = e.action;
  const data = e.data || {};
  if (action === 'save' || action === 'issue') {
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
      institutionUuid: currentInstitution.value?.institutionUuid || "",
      description: institutionForm.value.description,
      quoatedServices: quotedServices,
    } as any;
    try {
      if (action === 'save') {
        await saveQuotationDraft(payload);
        toasted(true, 'Quotation saved successfully');
        router.back();
      } else {
        // Directly issue without prior save as requested
        await issueQuotation(payload);
        toasted(true, 'Quotation issued successfully');
        router.back();
      }
    } catch (err: any) {
      const apiErr = err?.response?.data || err;
      toasted(false, 'Failed to process quotation', apiErr);
    }
  }
}

export type CreateQuotaion = {
  institutionUuid: string;
  description: string;
  quoatedServices: QuoatedService[];
};

export type QuoatedService = {
  packageUuid: string;
  serviceQuotedUuid: string;
  numberOfInsured: number;
  description: number;
  rate: number;
  premium: number;
  sumInsured: number;
  coverage: number;
  quotationUuid?: string;
  planType: string;
  individualType:string;
  spouse: boolean;
};
</script>
<template>
  <SingleInstitutionDataProvider v-slot="{ instituton, pending }">
    <!-- <div
      v-if="instituton?.status != Status.ACTIVE"
      class="bg-orange-100 text-xs p-2 rounded-md shadow-lg"
    >
      This institution is not active
    </div> -->
    <DefaultPage :first="false">
      <template #header>
        <h1>Generate Quotaion</h1>
      </template>
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
      <div class="px-4 box-border flex bg-yellow-100 border border-yellow-400 rounded-lg p-4 flex-col gap-3">
        <h2 class="text-2xl font-semibold flex">
         <p> Register new quotation for:</p> <div class="text-green-500">{{ instituton?.institutionName }}</div>
        </h2>
        <QuotationCreationDataProvider v-slot="{ packages, pending }">
          <QuotationForm
            v-if="!pending"
            :packages="packages"
            :onSubmit="onFormSubmit"
            :showHeaderControls="true"
            :readOnlyRows="false"
            :acceptMode="false"
          />
        </QuotationCreationDataProvider>
      </div>
    </DefaultPage>
  </SingleInstitutionDataProvider>
</template>
