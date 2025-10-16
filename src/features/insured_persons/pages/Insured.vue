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

// ✅ Add function to download sample file
const downloadSample = (type = "employee") => {
  const filename = type === "employee" ? "employee-sample.xlsx" : "coverage-sample.xlsx";
  const filePath = `/src/assets/${filename}`;

  // Create a temporary link to trigger the download
  const link = document.createElement("a");
  link.href = filePath;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Optional: show success message
  toasted(true, `Downloading ${filename} sample file`, "");
};
</script>

<template>
  <div class="flex flex-col gap-6 p-6 bg-white rounded-lg">
    <div class="flex justify-between items-center">
      <!-- Tabs -->
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
                : 'bg-base-clr text-white rounded-r font-medium'
              : '',
          ]"
        >
          {{ item.name }}
        </div>
      </div>

      <!-- Controls -->
      <div class="flex gap-3 items-center">
        <!-- Search input -->
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

        <!-- Employee buttons -->
        <div v-if="active === 0" class="flex gap-3 items-center">
          <button
            class="flex gap-2 bg-primary hover:bg-primary/90 items-center px-6 py-4 rounded-md whitespace-nowrap text-white font-medium transition-all shadow-sm"
            @click="openModal('employeeImport')"
          >
            <i v-html="icons.plus_circle"></i>
            Import Employees
          </button>

          <!-- Sample button - larger and more visible -->
          <button
            class="flex gap-2 items-center px-6 py-4 rounded-md whitespace-nowrap font-semibold text-white bg-gradient-to-r from-gray-700 via-gray-600 to-gray-500 hover:from-gray-800 hover:to-gray-600 transition-all shadow-md border border-gray-400"
            @click="downloadSample('employee')"
            title="Download sample Excel file"
          >
            <i v-html="icons.download" class="text-lg"></i>
            Download Sample
          </button>

          <button
            class="flex gap-2 bg-primary hover:bg-primary/90 items-center px-6 py-4 rounded-md whitespace-nowrap text-white font-medium transition-all shadow-sm"
            @click="openModal('AddInsured')"
          >
            <i v-html="icons.plus_circle"></i>
            Add Employee
          </button>
        </div>

        <!-- Coverage buttons -->
        <div v-else class="flex gap-3 items-center">
          <button
            class="flex gap-2 bg-primary hover:bg-primary/90 items-center px-6 py-4 rounded-md whitespace-nowrap text-white font-medium transition-all shadow-sm"
            @click="openModal('AddGroup')"
          >
            <i v-html="icons.plus_circle"></i>
            New Coverage
          </button>

          <!-- Sample button - large and clear -->
          <button
            class="flex gap-2 items-center px-6 py-4 rounded-md whitespace-nowrap font-semibold text-white bg-gradient-to-r from-gray-700 via-gray-600 to-gray-500 hover:from-gray-800 hover:to-gray-600 transition-all shadow-md border border-gray-400"
            @click="downloadSample('coverage')"
            title="Download sample Excel file"
          >
            <i v-html="icons.download" class="text-lg"></i>
            Download Sample
          </button>
        </div>
      </div>
    </div>

    <component :search="search" :is="components[active].component"></component>
  </div>
</template>
