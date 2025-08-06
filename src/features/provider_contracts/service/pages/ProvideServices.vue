<script setup>
import icons from "@/utils/icons";
import { ref, shallowRef } from "vue";
import ServiceSearchResults from "../components/ServiceSearchResults.vue";
import MedicationSearchResults from "../components/MedicationSearchResults.vue";

const insuredDetails = {
  "Full Name": "John Doe",
  "Phone Number": "+251912345678",
  "Institution Name": "ABC Hospital",
  Email: "birhanearaya23@gmail.com",
  "Registration Date": "2024-01-15",
};

const insuranceDetails = {
  "Insurance ID": "INS123456",
  "Insurance Name": "XYZ Insurance",
  "Institution Name": "ABC Hospital",
  "Policy Number": "POL987654",
  "Member Status": "Active",
};

const searchService = ref("");
const searchMedication = ref("");
const activeSearch = ref(null);

function showServiceResults() {
  activeSearch.value = "service";
}

function showMedicationResults() {
  activeSearch.value = "medication";
}
</script>

<template>
  <div class="flex flex-col gap-6 px-4">
    <div class="grid grid-cols-3 gap-6">
      <img
        class="col-span-1 size-full object-fit"
        src="../../../assets//img//profile.png"
        alt="Profile image"
      />
      <div class="col-span-2 grid grid-cols-2 gap-6 bg-white rounded p-6">
        <div>
          <h2 class="text-xl font-semibold border-b py-2">Insured Detail
          <button
    @click="$router.go(-1)"
    class="back-button group relative p-2 rounded-full hover:bg-gray-100 transition-colors"
    aria-label="Back"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      class="w-5 h-5 text-gray-600 group-hover:text-primary transition-colors"
    >
      <path
        fill="currentColor"
        d="M20 11H7.83l5.59-5.59L12 4l-8 8l8 8l1.41-1.41L7.83 13H20v-2z"
      />
    </svg>
    
    <!-- Tooltip -->
    <span class="tooltip">Back</span>
  </button>
          </h2>
          <div class="flex flex-col gap-4 pt-2">
            <template v-for="(value, key) in insuredDetails" :key="key">
              <div class="flex gap-6 pt-3">
                <span class="text-sm text-gray-500 w-32">{{ key }}</span>
                <span class="font-medium">{{ value }}</span>
              </div>
            </template>
          </div>
        </div>

        <div>
          <h2 class="text-xl font-semibold border-b py-2">Insurance Detail</h2>
          <div class="flex flex-col gap-4 pt-2">
            <template v-for="(value, key) in insuranceDetails" :key="key">
              <div class="flex gap-6 pt-3">
                <span class="text-sm text-gray-500 w-32">{{ key }}</span>
                <span class="font-medium">{{ value }}</span>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
    <div class="text-xl font-bold text-primary">Add Services</div>

    <div class="flex flex-col gap-4">
      <div class="flex gap-4">
        <div class="flex-1">
          <div
            class="rounded-lg flex items-center bg-base-clr2 px-4 p-2 gap-4"
            @click="showServiceResults"
          >
            <i v-html="icons.search"></i>
            <input
              type="text"
              v-model="searchService"
              placeholder="Search services..."
              class="w-full py-2 outline-none bg-transparent placeholder:text-text-clr"
            />
          </div>
        </div>

        <div class="flex-1">
          <div
            class="rounded-lg flex items-center bg-base-clr2 px-4 p-2 gap-4"
            @click="showMedicationResults"
          >
            <i v-html="icons.search"></i>
            <input
              type="text"
              v-model="searchMedication"
              placeholder="Search medications"
              class="w-full py-2 outline-none bg-transparent placeholder:text-text-clr"
            />
          </div>
        </div>
      </div>

      <div class="mt-4">
        <ServiceSearchResults
          v-if="activeSearch === 'service'"
          :search="searchService"
        />
        <MedicationSearchResults
          v-else-if="activeSearch === 'medication'"
          :search="searchMedication"
        />
      </div>
    </div>
  </div>
</template>
<style scoped>
.back-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.tooltip {
 
}

.tooltip::before {
  @apply absolute right-full top-1/2 -translate-y-1/2;
  content: "";
  border-width: 5px;
  border-style: solid;
  border-color: transparent theme('colors.gray.800') transparent transparent;
}
</style>