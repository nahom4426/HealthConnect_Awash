<script setup lang="ts">
import DefaultPage from "@/components/DefaultPage.vue";
import Table from "@/components/Table.vue";
import Dropdown from "@/components/new_form_elements/Dropdown.vue";
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { issuedPolicyQuotation } from "@/features/quotation/api/quotationApi";

const route = useRoute();
const router = useRouter();
const pending = ref(false);
const rows = ref<any[]>([]);
const error = ref<string | null>(null);

function goToInsured(row: any) {
  const payerInstitutionContractUuid = route.params.payerInstitutionContractUuid as string;
  const institutionUuid = row?.institutionUuid || (route.params as any).institutionUuid;
  if (institutionUuid && payerInstitutionContractUuid) {
    router.push(`/insured_persons/${payerInstitutionContractUuid}/${institutionUuid}/${row.quotationUuid}`);
  }
}

onMounted(async () => {
  const policyUuid = route.params.payerInstitutionContractUuid as string;
  pending.value = true;
  error.value = null;
  try {
    const resp: any = await issuedPolicyQuotation(policyUuid, { params: { status: 'PAID' } });
    const data = resp?.data ?? resp;
    const listRaw = Array.isArray(data) ? data : (data?.data ?? []);
    rows.value = (listRaw || []).map((r: any) => ({
      quotationUuid: r.quotationUuid,
      institutionUuid: r.institutionUuid,
      quotationCode: r.quotationCode,
      policyDebitNumber: r.policyDebitNumber,
      issuedDate: r.issuedDate,
      acceptedDate: r.acceptedDate,
      poDate: r.poDate,
      description: r.description,
      id: r.quotationUuid || r.id,
    }));
  } catch (e: any) {
    error.value = e?.message || 'Failed to load policy quotations';
  } finally {
    pending.value = false;
  }
});
</script>

<template>
  <DefaultPage>
    <template #header>
      <h1>Policy Quotations</h1>
    </template>

    <div v-if="error" class="p-3 text-red-600">{{ error }}</div>
    <Table
      :pending="pending"
      :headers="{
        head: [
          'quotationCode',
          'policyDebitNumber',
          'issuedDate',
          'acceptedDate',
          'poDate',
          'description',
          'actions',
        ],
        row: [
          
          'quotationCode',
          'policyDebitNumber',
          'issuedDate',
          'acceptedDate',
          'poDate',
          'description',
        ],
      }"
      :cells="{}"
      :rows="rows"
    >
      <template #actions="{ row }">
        <Dropdown v-slot="{ setRef, toggleDropdown }">
          <button
            class="p-1.5 rounded hover:bg-gray-100"
            @click.prevent="toggleDropdown"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
          <div
            class="absolute right-0 shadow-lg border p-2 mt-2 rounded-lg flex flex-col gap-1 w-56 bg-white z-20"
            :ref="setRef"
          >
            <button class="p-2 text-left hover:bg-gray-50 rounded-md" @click.prevent="goToInsured(row)">Insured Person</button>
            <button class="p-2 text-left hover:bg-gray-50 rounded-md" @click.prevent="(row)">Details</button>
          </div>
        </Dropdown>
      </template>
    </Table>
  </DefaultPage>
</template>
