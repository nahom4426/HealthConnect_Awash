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
    
    // Debug: log all contract UUIDs to check for matches
    
    const idx = contracts.value.findIndex((el) => el.payerProviderContractUuid === id);
    if (idx === -1) {
      console.warn(`[Contract Store] No contract found with UUID: ${id}`);
      // If not found by UUID, try to add it instead
      if (data.payerProviderContractUuid) {
        add(data);
      }
      return;
    }

    // Use splice for reactive updates
    contracts.value.splice(idx, 1, {
      ...contracts.value[idx],
      ...data,
    });
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
      contracts.value[idx] = {
        ...contracts.value[idx],
        status,
      };
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
