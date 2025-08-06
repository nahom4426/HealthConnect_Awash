<script setup>
import { mdiArrowLeftCircle, mdiLogout } from "@mdi/js";
import { computed, ref, onMounted, onBeforeUnmount } from "vue";
import IconButton from "@/components/IconButt.vue";
import * as session from "@/scripts/session";

const user = session.getUser();

const FullName = computed(() => {
  return user.personalInfos.firstName + " " + user.personalInfos.lastName;
});

const actions = [
  {
    name: "chat",
    icon: "mdiChat",
    action: [],
  },
  {
    name: "notification",
    icon: "mdiBellCircleOutline",
    action: [],
  },
];

const Role = computed(() => {
  if (user.personalInfos.role == "PayerClaimReviewer") {
    return "Reviewer";
  } else if (user.personalInfos.role == "PayerClaimAuditor") {
    return "Auditor";
  } else if (user.personalInfos.role == "PayerClaimApprover") {
    return "Approver";
  } else if (user.personalInfos.role == "Payer-Finance") {
    return "Finance";
  }
});

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
});

const Back = () => {
  router.back();
};

function logout() {
  localStorage.clear();
  location.href = "/login";
}
</script>

<template>
  <div class="flex w-full items-center">
    <div class="h-full flex items-center gap-3 px-4">
      <IconButton
        @click="() => action.action?.forEach((fun) => fun())"
        class="rounded-full shadow-sm w-10 h-10 bg-gray-200"
        :icon="action.icon"
        v-for="action in actions"
        :key="action.name"
      >
      </IconButton>
    </div>
    <div
      class="w-[2rem] h-[2rem] flex items-center justify-center overflow-hidden rounded-full border-primary border"
    >
      <div class="text-primary" v-if="user != null">
        {{ user.personalInfos.firstName.slice(0, 1) }}
      </div>
    </div>
    <div
      class="h-full flex flex-col text-sm px-2 items-start justify-center overflow-hidden rounded-full"
    >
      <span class="font-semibold">{{ FullName }}</span>
      <span class="font-base text-gray-600">{{ Role }}</span>
    </div>
    <button
      @click="logout"
      :class="[open ? '' : 'flex items-center h-8 w-8']"
      class="flex items-center h-12 w-20 text-black"
    >
      <div :class="[open ? 'flex items-center mx-4' : 'rounded-xl']" class="">
        <BaseIcon :size="20" :path="mdiLogout" />
        Logout
      </div>
    </button>
    <!-- <div
      class="w-[6rem] h-[2rem] p-4 flex items-center justify-center rounded-lg overflow-hidden border-primary cursor-pointer border"
      @click="Back">
      <BaseIcon :path="mdiArrowLeftCircle" :size="20" />
      <span class="px-2">Back</span>
    </div> -->
  </div>
</template>
