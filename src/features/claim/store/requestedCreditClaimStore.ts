import type { CStatus, Status } from "@/types/interface";
import { instructions } from "@/utils/utils";
import { data } from "autoprefixer";
import { defineStore } from "pinia";
import { ref } from "vue";

export interface RequestedClaim {
		claimUuid: string,
		batchCode?: string,
		claimCode?: string,
		paymentCode?: string,
		payerUuid: string,
		providerUuid: string,
		requestPaymentDate?: string,
		providerName: string,
		payerName: string,
		providerPhone: string,
		payerPhone: string,
		insuredPhone: string,
		insuredTitle:string,
		firstName: string,
		fatherName: string,
		grandFatherName: string,
		insuranceId: string,
		institutionName: string,
		totalAmount: number,
		claimDate: string,
		claimStatus?: string,
		dependantUuid: string,
		dependantFirstName: string,
		dependantFatherName: string,
		dependantGrandFatherName: string,
		relationship: string,
		beginDate?: string,
		endDate?: string,
		serviceDate?: string
}

export const useRequestdClaims = defineStore(
  "requestedClaims",
  () => {
    const requestedClaims = ref<RequestedClaim[]>([]);

    function getAll() {
      return requestedClaims.value;
    }

    function set(data: RequestedClaim[]) {
      requestedClaims.value = data;
    }

    function add(data: RequestedClaim) {
      requestedClaims.value.unshift(data);
    }

    function update(id: string, data: RequestedClaim) {
      const idx = requestedClaims.value.findIndex(
        (el) => el.claimUuid == id
      );

      if (idx == -1) return;

      requestedClaims.value.splice(idx, 1, {
        ...requestedClaims.value[idx],
        ...data,
      });
    }

    return {
      requestedClaims,
      getAll,
      set,
      add,
      update,
    };
  }
);
