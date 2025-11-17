import type { CStatus, Status } from "@/types/interface";
import { instructions } from "@/utils/utils";
import { data } from "autoprefixer";
import { defineStore } from "pinia";
import { ref } from "vue";

export interface CashService {
  cashServiceUuid: string;
  eligibleServiceUuid?: string;
  packageUuid: string;
  serviceName: string;
  amount: number;
  serviceDate: string;
}

export interface CashCreditInsured {
  cashCreditUuid: string;
  insuredPersonUuid: string;
  dependantUuid: string;
  institutionUuid: string;
  fullName: string;
  relationship: string;
  hospital: string;
  totalPages: null;
  totalAmount: number;
  status: CStatus;
  modifiedDate?: string;
  cashServiceResponses: CashService[];
}

export const useSearchedCashCreditInsuredByInstitutionStore = defineStore(
  "cashCreditInsuredByInstitutionStore",
  () => {
    const cashCreditInsured = ref<CashCreditInsured[]>([]);

    function getAll() {
      return cashCreditInsured.value;
    }

    function set(data: CashCreditInsured[]) {
      cashCreditInsured.value = data;
    }

    function add(data: CashCreditInsured) {
      cashCreditInsured.value.unshift(data);
    }

    function update(id: string, data: CashCreditInsured) {
      const idx = cashCreditInsured.value.findIndex(
        (el) => el.cashCreditUuid == id
      );

      if (idx == -1) return;

      cashCreditInsured.value.splice(idx, 1, {
        ...cashCreditInsured.value[idx],
        ...data,
      });
    }

    function removeAll(ids: any) {
      cashCreditInsured.value = cashCreditInsured.value.filter(el => {
        return !ids.find((id: any) => id == el.cashCreditUuid) 
      })
    }

    return {
      cashCreditInsured,
      getAll,
      set,
      add,
      update,
      removeAll
    };
  }
);
