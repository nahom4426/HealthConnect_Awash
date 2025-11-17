<script setup lang="ts">
import Button from "@/components/Button.vue";
import { useApiRequest } from "@/composables/useApiRequest";
import icons from "@/utils/icons";
import { fakeReq, toasted } from "@/utils/utils";

const props = defineProps({
  focusedInsured: {
    type: Object,
    required: true,
  },
});

const codeReq = useApiRequest();
const verifyReq = useApiRequest();

function sendCode() {
  if (codeReq.pending.value) return;

  codeReq.send(
    () => fakeReq(),
    (res) => {}
  );
}

function verify() {
  if (verifyReq.pending.value) return;

  verifyReq.send(
    () => fakeReq(),
    (res) => {
      toasted(true, "Insured Verified");
      codeReq.reset();
    }
  );
}
</script>
<template>
  <div class="hidden absolute group-hover:block pl-4 top-0 left-full">
    <div
      tabindex="0"
      class="rounded-md w-64 p-4 flex flex-col items-center gap-2 justify-center bg-base-clr4 shadow-lg border"
    >
      <div class="size-20 bg-black/10 shadow-md rounded-full"></div>
      <span
        :title="focusedInsured?.insuredName"
        class="font-semibold truncate"
        >{{ focusedInsured?.insuredName }}</span
      >
      <div class="w-full flex justify-between px-4">
        <p class="flex flex-col gap-1">
          <span class="leading-none">{{ focusedInsured?.insuranceId }}</span>
          <span class="text-[9px] leading-none text-primary">insurance id</span>
        </p>
        <div class="flex flex-col gap-2">
          <p class="flex flex-col gap-1">
            <span class="leading-none">{{ focusedInsured?.phone }}</span>
            <span class="text-[9px] leading-none text-primary">phone</span>
          </p>
        </div>
      </div>
      <div class="border-t w-full py-2 flex flex-col">
        <Button
          @click="sendCode"
          :pending="codeReq.pending.value"
          v-if="!codeReq.response.value"
          v-ripple
          type="elevated"
          class="!bg-primary/20 py-1 px-2 rounded-md"
        >
          Verify Phone
        </Button>
        <div
          v-else
          class="focus-within:sys-focus border input-style overflow-hidden rounded-md flex items-center pr-0"
        >
          <input
            @keydown.enter="verify"
            autofocus
            placeholder="Enter Verification Code"
            class="flex-1 focus:shadow-none"
          />
          <button
            @click="codeReq.reset()"
            class="size-10 grid place-items-center"
          >
            <i
              v-html="icons.spinner"
              class="animate-spin"
              v-if="verifyReq.pending.value"
            />
            <i v-html="icons.close" v-else />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
