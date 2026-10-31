import { defineStore } from "pinia";
import { ref } from "vue";


export const useAddProviders = defineStore("AddproviderStore", () => {
  const providers = ref([]);
  // Track providers that should be excluded from the list (e.g., already added)
  const excludedIds = ref([]); // array of providerUuid

  function getAll() {
    return providers.value;
  }

  function set(data) {
    const ids = new Set(excludedIds.value);
    providers.value = (data || []).filter((p) => !ids.has(p.providerUuid));
  }

  // Alias for set
  function setProviders(data) {
    set(data);
  }

  // Alias for set
  function setAll(data) {
    set(data);
  }

  function add(data) {
    providers.value.unshift(data);
  }

  function update(id, data) {
    
    // Debug: log all provider UUIDs to check for matches
    
    const idx = providers.value.findIndex((el) => el.providerUuid === id);
    if (idx === -1) {
      console.warn(`[Provider Store] No provider found with UUID: ${id}`);
      // If not found by UUID, try to add it instead
      if (data.providerUuid) {
        add(data);
      }
      return;
    }

    // Use splice for reactive updates
    providers.value.splice(idx, 1, {
      ...providers.value[idx],
      ...data,
    });
  }

  function remove(id) {
    const idx = providers.value.findIndex((el) => el.providerUuid === id);
    if (idx === -1) {
      console.warn(`[Provider Store] No provider found with UUID: ${id}`);
      return;
    }

    providers.value.splice(idx, 1);
    // Also mark as excluded so future fetches keep it hidden
    if (!excludedIds.value.includes(id)) excludedIds.value.push(id);
  }

  // Update provider status
  function updateStatus(id, status) {
    update(id, { status });
  }

  // Exclusion helpers
  function exclude(id) {
    if (!excludedIds.value.includes(id)) excludedIds.value.push(id);
    // Also remove from current list if present
    const idx = providers.value.findIndex(p => p.providerUuid === id);
    if (idx !== -1) providers.value.splice(idx, 1);
  }

  function include(id) {
    excludedIds.value = excludedIds.value.filter(x => x !== id);
  }

  function setExcluded(list = []) {
    excludedIds.value = Array.from(new Set(list));
    set(providers.value);
  }

  return {
    providers,
    excludedIds,
    getAll,
    set,
    setProviders,
    setAll,
    add,
    update,
    updateStatus,
    remove,
    exclude,
    include,
    setExcluded,
  };
});