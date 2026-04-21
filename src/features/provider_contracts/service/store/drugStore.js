import { ref } from "vue";
import { defineStore } from "pinia";

export const useDrugStore = defineStore("drugStore", () => {
  const drugs = ref([]);

  function set(data) {
    drugs.value = data;
    console.log(data);
  }

  function getAll() {
    return drugs.value;
  }

  function update(id, data) {
    const idx = drugs.value.findIndex((el) => el.drugUuid == id);
    if (idx == -1) return;

    drugs.value.splice(idx, 1, data);
  }

  function remove(id) {
    const idx = drugs.value.findIndex((el) => el.drugUuid == id);
    if (idx == -1) return;

    drugs.value.splice(idx, 1);
  }
  function add(data) {
    drugs.value.push(data);
  }

  // function updateStatus(id, status) {
  //   const idx = roles.value.findIndex((el) => el.roleUuid == id);
  //   if (idx == -1) return;

  //   roles.value[idx].roleStatus = status;
  // }

  return {
    drugs,
    getAll,
    update,
    remove,
    add,
    // updateStatus,
    set,
  };
});
