import type { CStatus, Status, StoreForPagination } from "@/types/interface";
import { defineStore, type StoreActions, type StoreDefinition } from "pinia";
import { ref } from "vue";

export interface Provider {
  providerUuid: string;
  email: string;
  providerName: string;
  description: string;
  telephone: string;
  category: string;
  level: string;
  address1: string;
  address2: string;
  address3: string;
  state: string;
  country: string;
  latitude: 0;
  longitude: 0;
  status: Status;
}

export const useProviders = defineStore("providerStore", () => {
  const providers = ref<Provider[]>([]);

  function getAll() {
    return providers.value;
  }

  function set(data: Provider[]) {
    providers.value = data;
  }

  return {
    providers,
    getAll,
    set,
  };
});
