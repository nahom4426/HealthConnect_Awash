<script setup>
import LoginForm from "./LoginForm.vue";
import { ref, onMounted } from "vue";
import backgroundImage from '../assets/img/ornament.jpg';
import icons from "@/utils/icons";

const isLoading = ref(true);

onMounted(() => {
  setTimeout(() => {
    isLoading.value = false;
  }, 500);
});
</script>

<template>
  <div
    v-if="isLoading"
    class="flex fixed inset-0 z-50 justify-center items-center bg-primary"
  >
    <div class="text-xl text-white animate-pulse">Loading HealthConnect...</div>
  </div>
<div
  class="absolute inset-0 z-0 w-full h-full bg-center bg-no-repeat bg-cover"
  :style="{ backgroundImage: `url(${backgroundImage})` }"
></div> 
  <div class="flex overflow-y-auto relative flex-col w-full h-screen">
    <img
      class="absolute hidden sm:block sm:bottom-10 md:bottom-24 sm:left-5 md:left-20 sm:h-[20rem] md:h-[30rem] z-10"
      src="../assets/img/InsuranceApp.png"
      alt="HealthConnect App"
    />

    <div class="overflow-y-auto flex-1 pt-20">
      <LoginForm
        class="relative z-20 mx-auto sm:mr-10 md:mr-[10%] sm:ml-auto max-w-md"
      />
    </div>

    <div
      class="fixed bottom-0 w-full z-0 h-[10rem] sm:h-[15rem] md:h-[20rem] bg-primary"
    ></div>

    <div class="hidden fixed bottom-4 left-4 z-20 text-white md:block">
      <p class="text-sm">©2026 HealthConnect</p>
      <p class="text-xs opacity-70">
        Connecting healthcare providers and payers
      </p>
    </div>
  </div>
</template>

