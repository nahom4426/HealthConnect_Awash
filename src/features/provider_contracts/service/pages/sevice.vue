<script setup>
import { ref } from "vue";
import icons from "@/utils/icons";
import { toasted } from "@/utils/utils";
import Drugs from "../components/Drugs.vue";
import ServiceList from "../components/ServiceList.vue";
import Button from "@/components/Button.vue";
import { openModal } from "@customizer/modal-x";

const items = ["Services", "Drugs"];
const active = ref(0);

const setActive = (item) => {
  active.value = item;
};
const components = [
  {
    name: "Services",
    component: ServiceList,
  },
  // {
  //   name: "Drugs",
  //   component: Drugs,
  // },
];
const search = ref("");
</script>
<template>
  <div class="flex flex-col gap-6 p-6 bg-white rounded-lg">
    <div class="flex justify-between items-center">
      <div class="flex border border-base-clr rounded w-fit">
        <div
          v-for="(item, index) in components"
          :key="index"
          @click="setActive(index)"
          :class="[
            'px-4 py-3 transition-colors cursor-pointer duration-300',
            active === index
              ? index === 0
                ? 'bg-base-clr w-fit text-white rounded-l font-medium'
                : 'bg-base-clr text-white rounded-r  font-medium'
              : '',
          ]"
        >
          {{ item.name }}
        </div>
      </div>
      <div class="flex gap-3">
        <div
          tabindex="0"
          class="w-full md:m bg-base-clr3 focus-within:border-primary flex items-center rounded-lg overflow-hidden"
        >
          <span
            class="w-10 h-full text-base-clr grid place-items-center"
            v-html="icons.search"
          />
          <input
            v-model="search"
            :placeholder="active === 0 ? 'Search Services' : 'Search Drugs'"
            class="flex-1 bg-transparent px- py-2 h-full outline-none"
          />
        </div>
        <div v-if="active === 0" class="flex gap-2">
          <button
            class="flex gap-2 bg-primary items-center px-6 py-4 rounded-md whitespace-nowrap text-white"
            @click="openModal('AddService')"
          >
            <i v-html="icons.plus_circle" class=""></i>
            Add Service
          </button>
          <button
            class="flex gap-2 bg-primary items-center px-6 py-4 rounded-md whitespace-nowrap text-white"
            @click="openModal('Import')"
          >
            <i v-html="icons.plus_circle" class=""></i>
            Import Service
          </button>
        </div>
        <div v-else class="flex gap-2">
          <button
            class="flex gap-2 bg-primary items-center px-6 py-4 rounded-md whitespace-nowrap text-white"
            @click="openModal('AddDrug')"
          >
            <i v-html="icons.plus_circle" class=""></i>

            Add Drug
          </button>
          <button
            class="flex gap-2 bg-primary items-center px-6 py-4 rounded-md whitespace-nowrap text-white"
            @click="openModal('Import', 'drug')"
          >
            <i v-html="icons.plus_circle" class=""></i>

            Import Drug
          </button>
        </div>
      </div>
    </div>
    <component :search="search" :is="components[active].component"></component>
  </div>
</template>
