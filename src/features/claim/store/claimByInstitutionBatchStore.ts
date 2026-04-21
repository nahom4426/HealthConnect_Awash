import type { PaymentStatus } from "@/types/interface";
import type { CStatus } from "@/types/interface";
import { defineStore } from "pinia";
import { ref } from "vue"

export interface BatchClaim {
  providerUuid: string;
  payerUuid: string;
  batchCode: string;
  institutionInsuranceNumber: string;
  payerInstitutionContractCode: string;
  payerInstitutionContractName: string;
  providerName: string;
  providerPhone: string;
  institutionName: string;
  institutionPhone: string;
  requestPaymentDate: string;
  requestPaymentStatus: PaymentStatus;
  totalAmount: number;
  paymentCode?: string;
  reviewedStatus: CStatus;
  approvedStatus: CStatus;
  authorizedStatus: CStatus;
  paidStatus: CStatus;
  claimStatus: CStatus;
  reviewedDate?: string;
  approvedDate?: string;
  authorizedDate?: string;
  paidDate?: string;
}

export const useClaimByInstitutionBatch = defineStore(
  "claimByInstitutionBatch",
  () => {
    const claims = ref<BatchClaim[]>([]);

    function getAll() {
      return claims.value;
    }

    function set(data: BatchClaim[]) {
      claims.value = data;
    }

    function add(data: BatchClaim) {
      claims.value.unshift(data);
    }

    function update(id: string, data: BatchClaim) {
      const idx = claims.value.findIndex((el) => el.batchCode == id);

      if (idx == -1) return;

      claims.value.splice(idx, 1, {
        ...claims.value[idx],
        ...data,
      });
    }

    function removeAll(ids: any) {
      claims.value = claims.value.filter((el) => {
        return !ids.find((id: any) => id == el.batchCode);
      });
    }

    return {
      claims,
      getAll,
      set,
      add,
      update,
      removeAll,
    };
  }
);
