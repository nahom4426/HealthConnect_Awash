import { defineStore } from "pinia";
import { ref } from "vue";

export const useMappedContractsStore = defineStore("mappedContractsStore", () => {
  const mappedContracts = ref([]);
  const excludedIds = ref([]); // For mapContractUuid or providerUuid (based on your API)

  // Pagination
  const page = ref(0);
  const size = ref(10);
  const totalPages = ref(0);
  const totalElements = ref(0);

  // ----------------------------
  // GET ALL
  // ----------------------------
  function getAll() {
    return mappedContracts.value;
  }

  // ----------------------------
  // SET DATA (MAIN METHOD)
  // ----------------------------
  function set(data) {
    console.log("Setting mapped contracts:", data);

    const ids = new Set(excludedIds.value);

    // Handle pagination response or raw array
    const list =
      data?.content ||
      data?.data ||
      data?.items ||
      data ||
      [];

    mappedContracts.value = list.filter(
      (c) => !ids.has(c.mapContractUuid)
    );

    // Pagination fields
    page.value = data?.page || 0;
    size.value = data?.size || 10;
    totalPages.value = data?.totalPages || 0;
    totalElements.value = data?.totalElements || list.length;
  }

  // Aliases
  function setMappedContracts(data) {
    console.log("setMappedContracts called");
    set(data);
  }

  function setAll(data) {
    console.log("setAll called");
    set(data);
  }

  // ----------------------------
  // ADD
  // ----------------------------
  function add(data) {
    console.log("Adding mapped contract:", data);
    mappedContracts.value.unshift(data);
  }

  // ----------------------------
  // UPDATE
  // ----------------------------
  function update(id, data) {
    console.log(`Updating mapped contract UUID: ${id}`, data);

    // Find by mapContractUuid
    const idx = mappedContracts.value.findIndex(
      (el) => el.mapContractUuid === id
    );

    if (idx === -1) {
      console.warn("[Store] No mapped contract found for update:", id);
      if (data.mapContractUuid) add(data);
      return;
    }

    mappedContracts.value.splice(idx, 1, {
      ...mappedContracts.value[idx],
      ...data,
    });
  }

  // ----------------------------
  // REMOVE
  // ----------------------------
  function remove(id) {
    const idx = mappedContracts.value.findIndex(
      (el) => el.mapContractUuid === id
    );

    if (idx === -1) {
      console.warn("[Store] No mapped contract found to remove:", id);
      return;
    } 

    mappedContracts.value.splice(idx, 1);

    if (!excludedIds.value.includes(id)) {
      excludedIds.value.push(id);
    }
  }

  // ----------------------------
  // UPDATE STATUS
  // ----------------------------
  function updateStatus(id, status) {
    update(id, { status });
  }

  // ----------------------------
  // EXCLUSION HELPERS
  // ----------------------------
  function exclude(id) {
    if (!excludedIds.value.includes(id)) {
      excludedIds.value.push(id);
    }

    const idx = mappedContracts.value.findIndex(
      (el) => el.mapContractUuid === id
    );

    if (idx !== -1) {
      mappedContracts.value.splice(idx, 1);
    }
  }

  function include(id) {
    excludedIds.value = excludedIds.value.filter((x) => x !== id);
  }

  function setExcluded(list = []) {
    excludedIds.value = Array.from(new Set(list));
    set(mappedContracts.value);
  }

  // ----------------------------
  // RESET STORE
  // ----------------------------
  function reset() {
    mappedContracts.value = [];
    excludedIds.value = [];
    page.value = 0;
    size.value = 10;
    totalPages.value = 0;
    totalElements.value = 0;
  }

  return {
    // State
    mappedContracts,
    excludedIds,
    page,
    size,
    totalPages,
    totalElements,

    // Methods
    getAll,
    set,
    setMappedContracts,
    setAll,
    add,
    update,
    updateStatus,
    remove,
    exclude,
    include,
    setExcluded,
    reset,
  };
});
