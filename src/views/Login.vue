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
    class="fixed inset-0 bg-primary flex items-center justify-center z-50"
  >
    <div class="animate-pulse text-white text-xl">Loading HealthConnect...</div>
  </div>
<div
  class="absolute inset-0 bg-no-repeat h-full w-full bg-center bg-cover z-0"
  :style="{ backgroundImage: `url(${backgroundImage})` }"
></div> 
  <div class="flex flex-col h-screen w-full relative overflow-y-auto">
    <img
      class="absolute hidden sm:block sm:bottom-10 md:bottom-24 sm:left-5 md:left-20 sm:h-[20rem] md:h-[30rem] z-10"
      src="../assets/img/InsuranceApp.png"
      alt="HealthConnect App"
    />

    <div class="flex-1 overflow-y-auto pt-20 ">
      <LoginForm
        class="relative z-20 mx-auto sm:mr-10 md:mr-[10%] sm:ml-auto max-w-md"
      />
    </div>

    <div
      class="fixed bottom-0 w-full z-0 h-[10rem] sm:h-[15rem] md:h-[20rem] bg-primary"
    ></div>

    <div class="fixed bottom-4 left-4 text-white z-20 hidden md:block">
      <p class="text-sm">© 2024 HealthConnect</p>
      <p class="text-xs opacity-70">
        Connecting healthcare providers and payers
      </p>
    </div>
  </div>
</template>

