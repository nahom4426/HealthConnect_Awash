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
    console.log("Setting providers in store:", data);
    const ids = new Set(excludedIds.value);
    providers.value = (data || []).filter((p) => !ids.has(p.providerUuid));
  }

  // Alias for set
  function setProviders(data) {
    console.log("Setting providers with setProviders:", data);
    set(data);
  }

  // Alias for set
  function setAll(data) {
    console.log("Setting providers with setAll:", data);
    set(data);
  }

  function add(data) {
    console.log("Adding provider to store:", data);
    providers.value.unshift(data);
  }

  function update(id, data) {
    console.log(`Updating provider with UUID: ${id}`, data);
    
    // Debug: log all provider UUIDs to check for matches
    console.log("Available provider UUIDs:", providers.value.map(p => p.providerUuid));
    
    const idx = providers.value.findIndex((el) => el.providerUuid === id);
    if (idx === -1) {
      console.warn(`[Provider Store] No provider found with UUID: ${id}`);
      // If not found by UUID, try to add it instead
      if (data.providerUuid) {
        console.log("Provider not found for update, adding instead:", data);
        add(data);
      }
      return;
    }

    // Use splice for reactive updates
    providers.value.splice(idx, 1, {
      ...providers.value[idx],
      ...data,
    });
    console.log("Provider updated successfully");
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
    console.log(`Updating status for provider with UUID: ${id} to ${status}`);
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