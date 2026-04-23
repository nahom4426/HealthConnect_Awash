<script setup>
import { usePagination } from "@/composables/usePagination";
import { watch, unref } from "vue";
import { useRequestdClaims } from "../store/requestedCreditClaimStore";
import { getNotClaimed } from "../api/claimApi";

const props = defineProps({
  auto: {
    type: Boolean,
    default: true,
  },
  store: Object,
  params: {
    type: Object,
    default: () => ({}),
  },
});

const claimStore = props.store ?? useRequestdClaims();

function normalizeRow(row) {
  if (!row || typeof row !== "object") return row;

  const derivedItemType =
    row?.itemType ||
    row?.providedItemResponses?.[0]?.itemType ||
    "SERVICE";

  return {
    ...row,
    itemType: derivedItemType,
    status: row?.status || row?.serviceClaimStatus,
  };
}

const pagination = usePagination({
  store: null,
  auto: false,
  reset: true,
  cb: (data) => {
    // unwrap any refs from props.params and build params
    const params = { ...data };

    // merge unwrapped params (skip null/undefined)
    Object.keys(props.params || {}).forEach((k) => {
      const v = unref(props.params[k]);
      if (v !== null && v !== undefined && v !== "") {
        params[k] = v;
      }
    });

    // remove empty search and any null/undefined values to avoid sending unwanted query keys
    if (params.search === "" || params.search == null) delete params.search;
    Object.keys(params).forEach((k) => {
      if (params[k] === null || params[k] === undefined) delete params[k];
    });

    if (Object.prototype.hasOwnProperty.call(params, "insuredUuid")) {
      delete params.insuredUuid;
    }
    if (Object.prototype.hasOwnProperty.call(params, "insuredPersonUuid")) {
      delete params.insuredPersonUuid;
    }

    console.log('[cash_claims] getNotClaimed params:', params);
    return getNotClaimed(params);
  },
});


if (props.auto) {
  pagination.send();
}

defineExpose({
  send: pagination.send,
  pending: pagination.pending,
  data: pagination.data,
});

watch(
  () => pagination.data.value,
  (rows) => {
    const list = Array.isArray(rows)
      ? rows
      : (Array.isArray(rows?.content) ? rows.content : []);
    console.log('[cash_claims] provider rows -> store set:', list.length);
    if (list.length) {
      console.log('[cash_claims] first row keys:', Object.keys(list[0] || {}));
    }
    claimStore.set(list.map(normalizeRow));
  },
  { deep: true }
);


watch(
  () => props.params,
  (newParams) => {
    if (!props.auto) return;
    // Clear the store when params change to avoid mixing old and new data
    console.log('[cash_claims] params changed (auto), clearing store and fetching:', newParams);
    claimStore.set([]);
    pagination.send();
  },
  { deep: true }
);
</script>

<template>
  <div>
    <slot
      :claims="(claimStore)?.requestedClaims"
      :pending="pagination.pending.value"
      :search="pagination.search"
      :send="pagination.send"
    />
  </div>
</template>
