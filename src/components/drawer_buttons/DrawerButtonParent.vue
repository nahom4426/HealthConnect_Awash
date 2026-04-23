<script setup>
import { computed, ref } from "vue";
import Button from "../Button.vue";
import NestedDrawerButton from "./NestedDrawerButton.vue";
import icons from "@/utils/icons";
import { RouterLink } from "vue-router";
import { useRoute } from "vue-router";

// Props
const props = defineProps({
  navs: {
    type: Object,
    required: true,
  },
  isCollapsed: {
    type: Boolean,
    default: false,
  },
});

// Local state
const open = ref(false);

const route = useRoute();

const isGroupActive = computed(() => {
  if (!Array.isArray(props.navs?.navs)) return false;
  return props.navs.navs.some((child) => child?.path === route.path);
});
</script>

<template>
  <div>
    <div
      v-privilage="navs.meta?.permissions"
      class="__drawer"
      v-if="navs?.path && !navs?.navs"
    >
      <RouterLink
        tabindex="-1"
        class="flex-1 rounded transition-all duration-200 ease-linear text-base-clr6"
        :to="navs.path"
      >
        <div class="!bg-transparent flex flex-col gap-2 flex-1">
          <Button
            class="hover:bg-gray-200 text-primary text-bold hover:text-secondary flex-1 max-w-full flex gap-2 !justify-start items-center"
          >
            <div class="grid place-items-center rounded">
              <i v-html="navs.icon" />
            </div>
            <span v-if="!isCollapsed" class="!text-xs Ubuntu">{{ navs.name }}</span>
          </Button>
        </div>
      </RouterLink>
    </div>

    <div
      v-privilage="navs.meta?.permissions"
      class="flex flex-col gap-2"
      v-else-if="navs?.navs"
    >
      <div
        class="flex-1 rounded transition-all duration-200 ease-linear link text-base-clr6"
      >
        <div class="flex flex-1 gap-2 items-center">
          <Button
            @click="open = !open"
            class="flex-1 max-w-full flex gap-2 !justify-start items-center"
            :class="[
              isGroupActive
                ? 'bg-gray-200 text-black hover:bg-secondary'
                : 'hover:bg-gray-200 text-primary hover:text-secondary',
            ]"
          >
            <div class="grid place-items-center rounded">
              <i v-html="navs?.icon" />
            </div>
            <span v-if="!isCollapsed" class="!text-xs">{{ navs?.name }}</span>
            <div class="grid place-items-center ml-auto">
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
        class="flex flex-col gap-2 pl-2 ml-5 border-l"
        v-if="open && navs?.navs"
      >
        <NestedDrawerButton :navs="navs?.navs" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.__drawer .router-link-active button {
  background-color: theme("colors.primary") !important;
  color: white !important;
}

.__drawer .router-link-exact-active button {
  background-color: theme("colors.primary") !important;
  color: white !important;
}
</style>
