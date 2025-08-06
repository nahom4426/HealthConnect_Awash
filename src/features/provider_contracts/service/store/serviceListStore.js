import { ref } from "vue";
import { defineStore } from "pinia";

export const useServiceListStore = defineStore("serviceList", () => {
  const serviceList = ref([]);

  function set(data) {
    serviceList.value = data;
  }

  function getAll() {
    return serviceList.value;
  }

  function update(id, data) {
    const idx = serviceList.value.findIndex((el) => el.serviceUuid == id);
    if (idx == -1) return;

    serviceList.value.splice(idx, 1, data);
  }

  function remove(id) {
    const idx = serviceList.value.findIndex((el) => el.serviceUuid == id);
    if (idx == -1) return;

    serviceList.value.splice(idx, 1);
  }
  function add(data) {
    serviceList.value.push(data);
  }

  // function updateStatus(id, status) {
  //   const idx = roles.value.findIndex((el) => el.roleUuid == id);
  //   if (idx == -1) return;

  //   roles.value[idx].roleStatus = status;
  // }

  return {
    serviceList,
    getAll,
    update,
    remove,
    add,
    // updateStatus,
    set,
  };
});
