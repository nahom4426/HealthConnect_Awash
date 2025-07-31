<script setup lang="ts">
import Drawer from "@/components/Drawer.vue";
import NavBar from "@/components/NavBar.vue";
import { useBreadcrumb } from "@/stores/breadCrumbsStore";
import icons from "@/utils/icons";
import { onMounted, onUnmounted, ref } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const drawerOpen = ref(false);
const isDesktop = ref(false);
function checkScreenSize() {
  isDesktop.value = window.innerWidth >= 768;
  if (!drawerOpen.value && isDesktop.value) {
    drawerOpen.value = false;
  }
}

onMounted(() => {
  checkScreenSize();
  window.addEventListener("resize", checkScreenSize);
});

onUnmounted(() => {
  window.removeEventListener("resize", checkScreenSize);
});

function toggleDrawer() {
  drawerOpen.value = !drawerOpen.value;
}

const breadcrumbs = useBreadcrumb();
</script>

<template>
  <div class="flex h-full w-full">
    <div
      v-ripple
      @click="toggleDrawer"
      class="md:hidden fixed w-fit h-fit z-30 top-4 left-4 bg-primary text-white rounded p-3 shadow-lg"
    >
      <i v-html="drawerOpen ? icons.close : icons.menu"></i>
    </div>
    <div
      class="__drawer fixed md:static z-20 h-full transition-all duration-300 ease-in-out"
      :class="[
        drawerOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        'w-drawer-width',
      ]"
    >
      <Drawer />
    </div>

    <div
      :class="[
        drawerOpen ? 'md:w-[calc(100%-var(--drawer-width))]' : 'md:w-full',
      ]"
      class="flex flex-col"
    >
      <div class="h-navbar-height flex gap-2 items-center px-4">
        <div
          v-ripple
          @click="$router.go(-1)"
          class="cursor-pointer grid place-items-center size-8 rounded"
          v-html="icons.back"
        />
        <div class="flex px-2 border-l">
          <RouterLink
            :to="path.path"
            :key="path.name"
            v-for="(path, idx) in breadcrumbs.breadcrumbs.slice(1)"
            class="flex items-center"
          >
            <p
              :class="
                idx == breadcrumbs.breadcrumbs.length - 2
                  ? 'underlin text-base '
                  : ''
              "
              class="capitalize font-semibold whitespace-nowrap"
            >
              {{ path.name }}
            </p>
            <div v-if="idx < breadcrumbs.breadcrumbs.length - 2">
              <i v-html="icons.slash" />
            </div>
          </RouterLink>
        </div>
        <NavBar />
      </div>
      <div
        class="overflow-y-auto h-[calc(100%-var(--navbar-height))] !p-2 bg-base-clr2 flex-1"
      >
        <RouterView />
      </div>
    </div>
  </div>
</template>
