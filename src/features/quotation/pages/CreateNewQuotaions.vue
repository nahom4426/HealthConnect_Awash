<script setup lang="ts">
import DefaultPage from "@/components/DefaultPage.vue";
import InfoCard from "@/components/InfoCard.vue";
import SingleInstitutionDataProvider from "@/features/institutions/components/SingleInstitutionDataProvider.vue";
import { Status } from "@/types/interface";
import QuotationForm from "../form/QuotationForm.vue";
import QuotationCreationDataProvider from "../components/QuotationCreationDataProvider.vue";

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
  individualType: 'NA' | 'Member' | 'Spouse' | 'Children' | number;
  spouse: boolean;
};
</script>
<template>
  <SingleInstitutionDataProvider v-slot="{ instituton, pending }">
    <div
      v-if="instituton?.status != Status.ACTIVE"
      class="bg-orange-100 text-xs p-2 rounded-md shadow-lg"
    >
      This institution is not active
    </div>
    <DefaultPage>
      <template #header>
        <h1>Generate Quotaion</h1>
      </template>
      <div class="p-4 grid grid-cols-2 gap-6">
        <InfoCard
          title="Institution Detail"
          :info="[{
						label: 'Institution Name',
						value: instituton?.institutionName || ''
					},{
						label: 'Email',
						value: instituton?.email || ''
					},
					{
						label: 'Tin Number',
						value: (instituton?.tinNumber || '') as string
					},
					{
						label: 'Telephone',
						value: instituton?.telephone || ''
					}]"
        />
        <InfoCard
          title="More Detail"
          :info="[{
						label: 'Description',
						value: instituton?.description || ''
					},{
						label: 'Address',
						value: instituton?.email || ''
					},
					{
						label: 'category',
						value: (instituton?.category || '') as string
					},
					{
						label: 'Source Of Business',
						value: instituton?.referralType || 'Direct'
					}]"
        >
          <template #Address>
            woreda
            {{
              `${instituton?.address1} ${instituton?.address2} ${instituton?.address3}, ${instituton?.state}`
            }}
          </template>
        </InfoCard>
      </div>
      <div class="px-4 box-border flex flex-col gap-3">
        <h2 class="text-3xl font-semibold">
          Register new Quotation for {{ instituton?.institutionName }}
        </h2>
        <QuotationCreationDataProvider v-slot="{ packages, pending }">
          <QuotationForm v-if="!pending" :packages="packages" />
        </QuotationCreationDataProvider>
      </div>
    </DefaultPage>
  </SingleInstitutionDataProvider>
</template>
