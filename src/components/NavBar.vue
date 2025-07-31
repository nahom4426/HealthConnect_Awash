<script setup>
import Dropdown from "@/components/Dropdown.vue";
import icons from "@/utils/icons";
import { useRoute } from "vue-router";
function logout() {
  localStorage.removeItem("userDetail");
  window.location.href = "/login";
}
</script>
<template>
  <div class="flex justify-between w-full">
    <div></div>
    <div>
      <Dropdown position="right-bottom" v-slot="{ setRef, toggle }">
  <div
    @click.prevent="toggle"
    class="flex items-center gap-4 cursor-pointer px-4 py-2 rounded hover:bg-gray-100 transition"
    role="button"
    aria-label="Toggle user menu"
  >
    <div class="flex flex-col text-left">
      <h1 class="text-sm font-bold text-gray-900">Semere</h1>
      <h2 class="text-xs text-gray-600">Super admin</h2>
    </div>
    <button type="button" aria-label="Dropdown icon">
      <i v-html="icons.chevron_down"></i>
    </button>
  </div>

  <div
    :ref="setRef"
    class="absolute right-4 mt-2 w-fit bg-white border border-gray-200 rounded shadow-lg z-50 flex flex-col gap-2 p-2"
  >
    <button
      @click="logout()"
      class="w-32 px-4 py-2 text-sm font-semibold text-gray-800 bg-gray-100 rounded hover:bg-gray-200 hover:shadow transition"
    >
      Logout
    </button>
  </div>
</Dropdown>

    </div>
  </div>
</template>
