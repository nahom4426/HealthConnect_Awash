import { defineStore } from "pinia";
import { ref } from "vue";

export const useGroupInsuredStore = defineStore("groupInsuredStore", () => {
  const insured = ref([]);

  function set(data) {
    insured.value = data?.insuredResponses || [];
  }

  function getAll() {
    return insured.value;
  }

  function remove(id) {
    const idx = insured.value.findIndex((el) => el.serviceUuid == id);
    if (idx > -1) {
      insured.value.splice(idx, 1);
    }
  }

  function add(data) {
    insured.value.unshift(data);
  }

  function update(id, data) {
    const idx = insured.value.findIndex((el) => el.serviceUuid == id);
    if (idx > -1) {
      insured.value.splice(idx, 1, data);
    }
  }

  return {
    set,
    add,
    remove,
    update,
    getAll,
    insured,
  };
});
