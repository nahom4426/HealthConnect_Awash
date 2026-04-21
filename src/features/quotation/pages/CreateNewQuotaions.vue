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

const showInstitution = ref(false)
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
    <DefaultPage :first="false">
      <template #header>
        <h1>Generate Quotation</h1>
      </template>
      <template v-if="prefillOnce(instituton)"></template>
     
      <div class="flex flex-col gap-4 mx-auto w-full max-w-7xl">
        <!-- Institution Details Card -->
        <div class="overflow-hidden bg-white rounded-xl border shadow-sm border-slate-200">
          <!-- Card Header -->
          <div class="px-6 py-4 bg-gradient-to-r from-blue-50 border-b to-blue-100/50 border-slate-200">
            <div class="flex justify-between items-center">
              <div class="flex gap-3 items-center">
                <div class="w-2 h-8 bg-blue-600 rounded"></div>
                <h2 class="text-xl font-semibold text-slate-800">Institution Details</h2>
              </div>
              <button 
                @click.prevent="showInstitution = !showInstitution"
                class="px-3 py-1 text-sm font-medium text-blue-600 rounded-lg transition-colors hover:text-blue-800 hover:bg-blue-50"
              >
                {{ showInstitution ? 'Hide Details' : 'Show Details' }}
              </button>
            </div>
            <div class="flex gap-2 items-center mt-2">
              <span class="text-sm text-slate-600">Registering quotation for:</span>
              <span class="text-sm font-semibold text-green-600">{{ instituton?.institutionName }}</span>
            </div>
          </div>
          
          <!-- Institution Form -->
          <div v-show="showInstitution" class="p-6">
            <div class="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2">
              <div class="space-y-4">
                <div>
                  <label class="block mb-1 text-sm font-medium text-slate-700">Institution Name</label>
                  <Input 
                    name="institutionName" 
                    v-model="institutionForm.institutionName" 
                    :attributes="{
                      class: 'w-full',
                      disabled: true
                    }"
                  />
                </div>
                <div>
                  <label class="block mb-1 text-sm font-medium text-slate-700">Email</label>
                  <Input 
                    name="email" 
                    v-model="institutionForm.email" 
                    :attributes="{
                      class: 'w-full',
                      disabled: true
                    }"
                  />
                </div>
                <div>
                  <label class="block mb-1 text-sm font-medium text-slate-700">TIN Number</label>
                  <Input 
                    name="tinNumber" 
                    v-model="institutionForm.tinNumber" 
                    :attributes="{
                      class: 'w-full',
                      disabled: true
                    }"
                  />
                </div>
                <div>
                  <label class="block mb-1 text-sm font-medium text-slate-700">Telephone</label>
                  <Input 
                    name="telephone" 
                    v-model="institutionForm.telephone" 
                    :attributes="{
                      class: 'w-full',
                      disabled: true
                    }"
                  />
                </div>
              </div>
              
              <div class="space-y-4">
                <div>
                  <label class="block mb-1 text-sm font-medium text-slate-700">Description</label>
                  <Input 
                    name="description" 
                    v-model="institutionForm.description" 
                    :attributes="{
                      class: 'w-full',
                      disabled: true
                    }"
                  />
                </div>
                <div>
                  <label class="block mb-1 text-sm font-medium text-slate-700">Category</label>
                  <Input 
                    name="category" 
                    v-model="institutionForm.category" 
                    :attributes="{
                      class: 'w-full',
                      disabled: true
                    }"
                  />
                </div>
                <div>
                  <label class="block mb-1 text-sm font-medium text-slate-700">Source of Business</label>
                  <Input 
                    name="referralType" 
                    v-model="institutionForm.referralType" 
                    :attributes="{
                      class: 'w-full',
                      disabled: true
                    }"
                  />
                </div>
                <div>
                  <label class="block mb-1 text-sm font-medium text-slate-700">Address</label>
                  <Input 
                    name="address" 
                    v-model="institutionForm.address" 
                    :attributes="{
                      class: 'w-full',
                      disabled: true
                    }"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Quotation Section -->
        <div class="overflow-hidden bg-white rounded-xl border shadow-sm border-slate-200">
          <div class="px-6 py-5 bg-gradient-to-r from-emerald-50 border-b to-emerald-100/50 border-slate-200">
            <div class="flex justify-between items-center">
              <div class="flex gap-3 items-center">
                <div class="w-2 h-8 bg-emerald-600 rounded"></div>
                <div>
                  <h2 class="text-xl font-semibold text-slate-800">Create New Quotation</h2>
                  <p class="mt-1 text-sm text-slate-600">Add coverage types and configure services for {{ instituton?.institutionName }}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div class="p-6">
            <QuotationCreationDataProvider v-slot="{ packages, pending }">
              <div v-if="pending" class="flex justify-center items-center py-12">
                <div class="w-12 h-12 rounded-full border-b-2 border-emerald-600 animate-spin"></div>
              </div>
              <QuotationForm
                v-else
                :packages="packages"
                :onSubmit="onFormSubmit"
                :showHeaderControls="true"
                :readOnlyRows="false"
                :acceptMode="false"
              />
            </QuotationCreationDataProvider>
          </div>
        </div>
      </div>
    </DefaultPage>
  </SingleInstitutionDataProvider>
</template>