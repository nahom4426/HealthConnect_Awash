import { ref } from "vue";
import { defineStore } from "pinia";

export const useAuthorizationStore = defineStore("authorizationStore", () => {
  const authorizations = ref([]);
  const paginationMeta = ref(null);

  function set(data) {
    authorizations.value = Array.isArray(data) ? data : [];
  }

  function getAll() {
    return authorizations.value;
  }

  function update(id, data) {
    const idx = authorizations.value.findIndex(
      (el) => el.authorizationUuid == id || el.authorizationUuId == id
    );
    if (idx == -1) return;

    authorizations.value.splice(idx, 1, data);
  }

  function remove(id) {
    const idx = authorizations.value.findIndex(
      (el) => el.authorizationUuid == id || el.authorizationUuId == id
    );
    if (idx == -1) return;

    authorizations.value.splice(idx, 1);
  }

  function add(data) {
    authorizations.value.push(data);
  }

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
    authorizations,
    paginationMeta,
    set,
    getAll,
    update,
    remove,
    add,
    setPaginationMeta,
    getPaginationMeta,
    clearPaginationMeta,
  };
});
