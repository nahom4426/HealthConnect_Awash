import { ref } from "vue";
import { defineStore } from "pinia";


export const useContractStore = defineStore("contractStore", () => {
  const contracts = ref([]);

  function set(data) {
    contracts.value = data;
  }

  function getAll() {
    return contracts.value;
  }

  function add(data) {
    contracts.value.push(data); // ✅ fixed from pushing "add"
  }

  function update(id, data) {
    const idx = contracts.value.findIndex((el) => el.payerProviderContractUuid === id);
    if (idx !== -1) {
      contracts.value.splice(idx, 1, data);
    }
  }

  function remove(id) {
    const idx = contracts.value.findIndex((el) => el.payerProviderContractUuid === id);
    if (idx !== -1) {
      contracts.value.splice(idx, 1);
    }
  }

  function updateStatus(id, status) {
    const idx = contracts.value.findIndex((el) => el.payerProviderContractUuid === id);
    if (idx !== -1) {
      contracts.value[idx].contractstatus = status;
    }
  }



  return {
    contracts,
    set,
    getAll,
    add,
    update,
    remove,
    updateStatus,

  };
});

// Optional alias for backward compatibility
export const usecontracts = useContractStore;
