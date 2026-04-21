import { ref } from "vue";
import { defineStore } from "pinia";

export const usePrivilege = defineStore("Privilegestore", () => {
  const privilege = ref([]);
  const paginationMeta = ref(null); // Add this for pagination metadata

  function set(data) {
    privilege.value = data;
  }

  function getAll() {
    return privilege.value;
  }

  function update(id, data) {
    const idx = privilege.value.findIndex((el) => el.privilegeUuid == id);
    if (idx == -1) return;
    privilege.value.splice(idx, 1, data);
  }

  function remove(id) {
    const idx = privilege.value.findIndex((el) => el.privilegeUuid == id);
    if (idx == -1) return;
    privilege.value.splice(idx, 1);
  }

  function add(data) {
    console.log(data);
    privilege.value.push(data);
  }

  // Add these new functions for pagination metadata
  function setPaginationMeta(meta) {
    paginationMeta.value = meta;
  }

  function getPaginationMeta() {
    return paginationMeta.value;
  }

  function clearPaginationMeta() {
    paginationMeta.value = null;
  }

  return {
    privilege,
    getAll,
    update,
    remove,
    add,
    set,
    // Export the new pagination functions
    setPaginationMeta,
    getPaginationMeta,
    clearPaginationMeta,
  };
});