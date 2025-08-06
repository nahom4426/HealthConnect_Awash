import { defineStore } from 'pinia';

export const useRowStore = defineStore({
  id: 'row',
  state: () => ({
    payerProviderContractUuid: '',
    providerName: '',
    contractCode: '',
    beginDate: '',
    endDate: '',
    searchTerm: ''
  }),
  actions: {
    setRowDetails(details) {
      this.payerProviderContractUuid = details.payerProviderContractUuid;
      this.providerName = details.providerName;
      this.contractCode = details.contractCode;
      this.beginDate = details.beginDate;
      this.endDate = details.endDate;
      this.searchTerm = details.searchTerm;
    },
  },
});
