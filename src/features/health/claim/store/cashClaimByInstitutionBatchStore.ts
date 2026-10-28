import type { PaymentStatus } from "@/types/interface";
import type { CStatus } from "@/types/interface";
import { defineStore } from "pinia";
import { ref } from "vue";

export interface CashBatchClaim {
  hospitalName: string;
  institutionName: string;
  totalAmount: number;
  claimBatchCode: string;
  paymentCode?: string;
  status: PaymentStatus;
  actionDate: string;
}

export const useCashClaimByInstitutionBatch = defineStore(
  "claimByInstitutionBatch",
  () => {
    const claims = ref<CashBatchClaim[]>([]);

    function getAll() {
      return claims.value;
    }

    function set(data: CashBatchClaim[]) {
      claims.value = data;
    }

    function add(data: CashBatchClaim) {
      claims.value.unshift(data);
    }

    function update(id: string, data: CashBatchClaim) {
      const idx = claims.value.findIndex((el) => el.claimBatchCode == id);

      if (idx == -1) return;

      claims.value.splice(idx, 1, {
        ...claims.value[idx],
        ...data,
      });
    }

    function removeAll(ids: any) {
      claims.value = claims.value.filter((el) => {
        return !ids.find((id: any) => id == el.claimBatchCode);
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
