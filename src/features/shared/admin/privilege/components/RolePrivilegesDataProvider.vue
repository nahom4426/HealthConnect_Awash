<script setup>
import { usePagination } from "@/composables/usePagination";
import { watch } from "vue";
import { useRolePrivilege } from "../store/roleprivilegeStore";
import { getAllPrivilege } from "../Api/PrivilegeApi";
import { removeUndefined } from "@/utils/utils";

const props = defineProps({
  prePage: {
    type: Number,
    default: 5000,
  },
  search: {
    type: String,
    default: "",
  },
});
const privilegesStore = useRolePrivilege();

const pagination = usePagination({
  auto: false,
  perPage: props.prePage,
  store: privilegesStore,
  cb: (data)=> getAllPrivilege(
    removeUndefined(
      {
    
    ...data,
    search: props.search.trim(),
  })),
});

if (privilegesStore.privilege.length == 0) {
  pagination.send();
}
watch(()=> props.search,()=>{
  pagination.send()
})
</script>
<template>
  <slot
    :pending="pagination.pending.value"
    :error="pagination.error.value"
    :privileges="privilegesStore.privilege"
  />
</template>
