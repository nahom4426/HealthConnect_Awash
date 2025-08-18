<script setup>
import { ref } from "vue";
import icons from "@/utils/icons";
import { toasted } from "@/utils/utils";
import Button from "@/components/Button.vue";
import { openModal } from "@customizer/modal-x";
import InsuredPersons from "./InsuredPersons.vue";
import FamilyGroup from "./FamilyGroup.vue";

const active = ref(0);

const setActive = (item) => {
  active.value = item;  
};
const components = [
  {
    name: "Employee",
    component: InsuredPersons,  
  },
  {
    name: "Coverage",
    component: FamilyGroup,
  },
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
          class="w-full md:m bg-gray-100 focus-within:border-primary flex items-center rounded-lg overflow-hidden"
        >
          <span
            class="w-10 h-full text-base-clr grid place-items-center"
            v-html="icons.search"
          />
          <input
            v-model="search"
            :placeholder="active === 0 ? 'Search employees' : 'Search group'"
            class="flex-1 bg-transparent px- py-2 h-full outline-none"
          />
        </div>
<button
  v-if="active === 0"
            class="flex gap-2 bg-primary items-center px-6 py-4 rounded-md whitespace-nowrap text-white"
            @click="openModal('employeeImport')"
          >
            <i v-html="icons.plus_circle" class=""></i>
            Import Employees
          </button>
        <button
          v-if="active === 0"
          class="flex gap-2 bg-primary items-center px-6 py-4 rounded-md whitespace-nowrap text-white"
          @click="openModal('AddInsured')"
        >
          <i v-html="icons.plus_circle" class=""></i>
          Add Employee
        </button>

        <button
          v-else
          class="flex gap-2 bg-primary items-center px-6 py-4 rounded-md whitespace-nowrap text-white"
          @click="openModal('AddGroup')"
        >
          <i v-html="icons.plus_circle" class=""></i>

          New Coverage
        </button>
      </div>
    </div>
    <component :search="search" :is="components[active].component"></component>
  </div>
</template>
