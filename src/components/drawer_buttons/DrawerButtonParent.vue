<script setup>
import { ref } from "vue";
import Button from "../Button.vue";
import NestedDrawerButton from "./NestedDrawerButton.vue";
import icons from "@/utils/icons";
import { RouterLink } from "vue-router";

// Props
const props = defineProps({
  navs: {
    type: Object,
    required: true,
  },
});

// Local state
const open = ref(false);
</script>

<template>
  <div
    v-privilage="navs.meta?.permissions"
    class="__drawer"
    v-if="navs?.path && !navs?.navs"
  >
    <RouterLink
      tabindex="-1"
      class="flex-1 rounded text-base-clr6 transition-all duration-200 ease-linear"
      :to="navs.path"
    >
      <div class="!bg-transparent flex flex-col gap-2 flex-1">
        <Button
          class="hover:bg-gray-200 text-white hover:text-primary flex-1 max-w-full flex gap-2 !justify-start items-center"
        >
          <div class="grid place-items-center rounded">
            <i v-html="navs.icon" />
          </div>
          <span class="!text-xs Ubuntu">{{ navs.name }}</span>
        </Button>
      </div>
    </RouterLink>
  </div>

  <div
    v-privilage="navs.meta?.permissions"
    class="flex flex-col gap-2"
    v-if="navs?.navs"
  >
    <div
      class="link flex-1 rounded text-base-clr6 transition-all duration-200 ease-linear"
    >
      <div class="flex items-center gap-2 flex-1">
        <Button
          @click="open = !open"
          class="hover:bg-gray-200 text-white hover:text-primary flex-1 max-w-full flex gap-2 !justify-start items-center"
        >
          <div class="grid place-items-center rounded">
            <i v-html="navs?.icon" />
          </div>
          <span class="!text-xs">{{ navs?.name }}</span>
          <div class="ml-auto grid place-items-center">
            <i
              class="transition-all duration-100"
              :class="[open ? 'rotate-180' : 'rotate-0']"
              v-html="icons.downAngle"
            />
          </div>
        </Button>
      </div>
    </div>

    <div
      class="border-l flex flex-col gap-2 ml-5 pl-2"
      v-if="open && navs?.navs"
    >
      <NestedDrawerButton :navs="navs?.navs" />
    </div>
  </div>
</template>

<style scoped>
.__drawer .router-link-active button {
  background-color: #0002;
}

.__drawer .router-link-exact-active button {
  background-color: white;
  color: theme("colors.primary");
  font-size: 1rem;
  font-weight: 700;
}
</style>
