import { defineStore } from "pinia";
import { ref } from "vue";

export const useInsuredPersonsRefreshStore = defineStore(
  "insuredPersonsRefresh",
  () => {
    const refreshTrigger = ref(0);

    const triggerRefresh = () => {
      refreshTrigger.value++;
    };

    return {
      refreshTrigger,
      triggerRefresh,
    };
  }
);
