<script setup>
import ModalParent from "@/components/ModalParent.vue";
import GroupService from "../components/GroupComponents/GroupService.vue";
import GroupDrug from "../components/GroupComponents/GroupDrug.vue";
import { ref } from "vue";

import NewFormParent from "@/components/NewFormParent.vue";
// import ContractProvidersDataProvider from "@/features/providers/components/ContractProvidersDataProvider.vue";

const props = defineProps({
  data: String,
});

const active = ref(0);

const setActive = (item) => {
  active.value = item;
};
const components = [
  {
    name: "Services",
    component: GroupService,
  },
  {
    name: "Drugs",
    component: GroupDrug,
  },
];

const selectedProvider = ref("");
</script>

<template>
  <ModalParent>
    <NewFormParent
      class=""
      size="lg"
      title="New Employee / Family Group"
      subtitle="Create a new group for employees or their families."
    >
      <ContractProvidersDataProvider v-slot="{ providers, pending }">
        <div class="flex flex-col gap-10">
          <div class="flex flex-col gap-6 bg-gray-100 w-full p-6 rounded-lg">
            <div class="grid grid-cols-2 gap-4">
              <div
                class="grid grid-cols-2 border border-base-clr rounded w-full"
              >
                <div
                  v-for="(item, index) in components"
                  :key="index"
                  @click="setActive(index)"
                  :class="[
                    'px-4 py-3 transition-colors text-center cursor-pointer duration-300',
                    active === index
                      ? index === 0
                        ? 'bg-base-clr  text-white rounded-l font-medium'
                        : 'bg-base-clr text-white rounded-r  font-medium'
                      : '',
                  ]"
                >
                  {{ item.name }}
                </div>
              </div>

              <select
                v-model="selectedProvider"
                class="rounded-md bg-white px-4"
                name=""
                id=""
              >
                <option disabled selected value="">Select Provider</option>
                <option
                  v-for="data in providers"
                  :key="data.providerName"
                  :value="data.providerUuid"
                >
                  {{ data.providerName }}
                </option>
              </select>
            </div>

            <component
              :groupId="props.data"
              :id="selectedProvider"
              :search="search"
              :is="components[active].component"
            ></component>
          </div>
        </div>
      </ContractProvidersDataProvider>
    </NewFormParent>
  </ModalParent>
</template>
