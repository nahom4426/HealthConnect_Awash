Claim
<script setup lang="ts">
import { formatCurrency, formatNumber, secondDateFormat } from "@/utils/utils";
import DefaultPage from "@/components/DefaultPage.vue";
import { computed, type PropType } from "vue";
import Table from "@/components/Table.vue";
import Button from "@/components/Button.vue";
import type {
  ClaimAttacment,
  ClaimDetail,
  ClaimedService,
  ClaimLogs,
} from "../types/claimTypes";
import InfoCard from "@/components/InfoCard.vue";

const props = defineProps({
  detail: Object as PropType<ClaimDetail>,
  claimedServices: Array as PropType<ClaimedService[]>,
  claimLogs: Array as PropType<ClaimLogs[]>,
  claimAttachments: Array as PropType<ClaimAttacment[]>,
});

const detail = computed(() => {
  return {
    policyHolder: !props.detail?.relationship
      ? `${props.detail?.title} ${props.detail?.firstName} ${props.detail?.fatherName} ${props.detail?.grandFatherName}`
      : `${props.detail?.dependantFirstName} ${props.detail?.dependantFatherName} ${props.detail?.dependantGrandFatherName}`,
    policyHolderMainMember: `${props.detail?.title} ${props.detail?.firstName} ${props.detail?.fatherName} ${props.detail?.grandFatherName}`,
    providerName: props.detail?.providerName,
    policyNumber: props.detail?.insuranceId,
    insuredPhoneNumber: props.detail?.insuredPhone,
  };
});

const detail1 = computed(() => {
  return [
    {
      label: "Full name",
      value: !props.detail?.relationship
        ? `${props.detail?.title} ${props.detail?.firstName} ${props.detail?.fatherName} ${props.detail?.grandFatherName}`
        : `${props.detail?.dependantFirstName} ${props.detail?.dependantFatherName} ${props.detail?.dependantGrandFatherName}`,
    },
    {
      label: "Provider Name",
      value: props.detail?.providerName || "",
    },
    {
      label: "Policy Number",
      value: props.detail?.insuranceId || "",
    },
    {
      label: "Phone Number",
      value: props.detail?.insuredPhone || "",
    },
  ];
});

const detail2 = computed(() => {
  return [
    {
      label: "Group Name",
      value: props.detail?.institutionName || '',
    },
    {
      label: "Group Policy Number",
      value: props.detail?.payerInstitutionContractCode || "",
    }
  ];
});

interface Comments {
  [key: string]: {name: string, value: string}
}

const comments = computed<Comments>(() => {
  return {
    'processorComment': {
      name: "Processor Comment",
      value: props.detail?.processorComment || '',
    },
    'checkerComment': {
      name: "Checker Comment",
      value: props.detail?.checkerComment || '',
    },
    'approverComment': {
      name: "Approver Comment",
      value: props.detail?.approverComment || '',
    },
    'authorizerComment': {
      name: "Authorizer Comment",
      value: props.detail?.authorizerComment || '',
    },
  };
});
</script>
<template>
  <DefaultPage>
    <template #header>
      <h1>Claim Detail</h1>
    </template>
    <template #more>
      <div class="flex-1 flex gap-2 justify-end items-center">
        <slot name="claimActions"> </slot>
      </div>
    </template>
    <div class="grid grid-cols-2 gap-4 p-4">
      <InfoCard :info="detail1">
        <template #title>
          Policy Holder Info (<span class="font-semibold"
            >{{ detail.policyHolderMainMember }})</span
          >
        </template>
        <template #PolicyNumber="{value}" >
          <span class="font-mono" >{{ value }}</span>
        </template>
        <template #PhoneNumber="{value}" >
          <span class="font-mono" >{{ value }}</span>
        </template>
      </InfoCard>
      <InfoCard :info="detail2" title="Group Info">
        <template #GroupPolicyNumber="{value}" >
          <span class="font-mono" >{{ value }}</span>
        </template>
      </InfoCard>
    </div>
    <section
      v-if="Object.keys(comments).length"
      class="mb-4 px-4 grid grid-cols-2 gap-4"
    >
      <h2 class="col-span-2 font-semibold text-base border-b pb-2">Comments</h2>
      <div :key="key" v-for="key in Object.keys(comments)">
        <p>{{ comments[key].name }}</p>
        <p class="quote p-2 bg-gray-100 font-base italic">
          {{ comments[key].value }}
        </p>
      </div>
    </section>
    <section class="px-4 flex flex-col gap-4">
      <h2 class="font-semibold text-base border-b pb-2">Services</h2>
      <Table
        class="shadow-md"
        :headers="{
          head: [
            'Service Date',
            'Service Category',
            'Service Code',
            'Service Name',
            'Quantity',
            'Unit Price',
            'Total Price',
            'Attachment',
          ],
          row: [
            'providedDate',
            'category',
            'itemCode',
            'item',
            'qty',
            'unitPrice',
            'amount',
          ],
        }"
        :cells="{
          providedDate: secondDateFormat,
          qty: formatNumber,
          unitPrice: formatCurrency,
          amount: formatCurrency,
        }"
        :rows="claimedServices || []"
      />
    </section>
    <section class="px-4 grid gap-8 grid-cols-2 box-border">
      <div>
        <h2 class="font-semibold py-5 text-base border-b pb-2">Claim Logs</h2>
        <table class="w-full border rounded-md bg-base-clr4">
          <thead>
            <tr
              class="box-border w-full border-b flex p-2 items-center *:flex-1"
            >
              <th class="max-w-12 w-12">#</th>
              <th
                :key="th"
                v-for="th in ['Action Date', 'Fullname', 'phone', 'comment']"
              >
                {{ th }}
              </th>
            </tr>
          </thead>
          <tbody>
            <template v-if="claimLogs && claimLogs?.length">
              <tr
                class="box-border flex border-b p-2 items-center *:flex-1"
                v-for="(log, idx) in claimLogs"
              >
                <td class="max-w-12">{{ idx }}</td>
                <td>
                  {{ secondDateFormat(log.actionDate) }}
                </td>
                <td>
                  {{
                    `${log?.title} ${log?.firstName} ${log?.fatherName} ${log?.grandFatherName}`
                  }}
                </td>
                <td>
                  {{ log?.phone }}
                </td>
                <td>
                  {{ log?.comment }}
                </td>
              </tr>
            </template>
            <tr class="border-b">
              <td colspan="4">
                <p class="p-2 text-center">No Logs Found</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div>
        <h2 class="font-semibold py-5 text-base border-b pb-2">
          Claim Attachments
        </h2>
        <table class="w-full border rounded-md bg-base-clr4">
          <thead>
            <tr
              class="box-border w-full border-b flex p-2 items-center *:flex-1"
            >
              <th class="max-w-12 w-12">#</th>
              <th :key="th" v-for="th in ['File Name', 'File Size', 'Actions']">
                {{ th }}
              </th>
            </tr>
          </thead>
          <tbody>
            <template v-if="claimAttachments && claimAttachments?.length">
              <tr
                class="box-border flex border-b p-2 items-center *:flex-1"
                v-for="(file, idx) in claimAttachments"
              >
                <td class="max-w-12">{{ idx }}</td>
                <td>
                  {{ file.fileName }}
                </td>
                <td>
                  {{ file.fileSize }}
                </td>
                <td>
                  <Button type="elevated"> view </Button>
                </td>
              </tr>
            </template>
            <tr class="border-b">
              <td colspan="4">
                <p class="p-2 text-center">No Claim Attachemts Found</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </DefaultPage>
</template>

<style>
.quote {
  position: relative;
  isolation: isolate;
}
.quote::before {
  content: open-quote;
  padding-inline: 2px;
  font-size: 20px;
  z-index: -1;
}
.quote::after {
  content: close-quote;
  padding-inline: 2px;
  font-size: 20px;
  z-index: -1;
}
</style>
