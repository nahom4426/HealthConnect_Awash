<script setup>
import navs from "@/config/navs";
import DrawerButtonParent from "@/components/drawer_buttons/DrawerButtonParent.vue";
</script>
<template>
  <div class="flex flex-col relative h-full bg-primary">
    <img
      class="absolute top-0 w-full"
      src="../assets/img/ornament.svg"
      alt=""
    />
    <div class="flex items-center p-4 pl-8">
      <div class="flex items-center border-b border-primary w-full">
        <img class="w- h-10 object-" src="/src/assets/img/letter-logo.png" />
        <div class="flex flex-col">
          <span class="mx-2 text-xl text-white whitespace-nowrap font-bold"
            >HealthConnect</span
          >
        </div>
      </div>
    </div>
    <div
      class="show-scrollbar z-10 !overflow-y-scroll !py-6 items-center h-[calc(100%-9rem)] flex flex-col justify-start gap-1"
    >
      <div class="w-[85%] flex flex-col gap-3 justify-start">
        <DrawerButtonParent :navs="nav" v-for="nav in navs" />
      </div>
    </div>
  </div>
</template>
