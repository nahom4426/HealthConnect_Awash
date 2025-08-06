import { defineStore } from "pinia";
import { ref } from "vue";

export const useService = defineStore("serviceStore", () => {
  const services = ref([]);

  function set(data) {
    console.log(data);

    services.value = data;
  }

  function getAll() {
    return services.value;
  }

  function remove(id) {
    const idx = services.value.findIndex((el) => el.serviceUuid == id);
    if (idx > -1) {
      services.value.splice(idx, 1);
    }
  }

  function add(data) {
    services.value.unshift(data);
  }

  function update(id, data) {
    const idx = services.value.findIndex((el) => el.serviceUuid == id);
    if (idx > -1) {
      services.value.splice(idx, 1, data);
    }
  }

  return {
    set,
    add,
    remove,
    update,
    getAll,
    services,
  };
});
