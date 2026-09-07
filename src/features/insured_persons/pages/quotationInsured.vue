<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import icons from "@/utils/icons";
import { toasted } from "@/utils/utils";
import Button from "@/components/Button.vue";
import Dropdown from "@/components/new_form_elements/Dropdown.vue";
import { openModal } from "@customizer/modal-x";
import InsuredPersons from "./InsuredPersons.vue";
import FamilyGroup from "./FamilyGroup.vue";
import { useNavigationState } from "@/composables/useNavigationState";

const route = useRoute();
const router = useRouter();
const { getShowActionButtons, resetNavigationState } = useNavigationState();

const active = ref(0);
const institutionName = computed(() => route.params.institutionName || 'Institution');
const showActionButtons = computed(() => getShowActionButtons());
const pageContext = computed(() => route.query.pageContext || 'insured');
const actionPage = route.query.pageContext;
const hasInstitution = computed(() => route.query.hasInstitution || 'true');

// If this contract was renewed from a previous one, show the import button
const renewedFromPayerInstitutionContractUuid = computed(
  () => route.query.renewedFromPayerInstitutionContractUuid || null
);

function openImportInsuredsPage() {
  router.push({
    name: 'Import Insureds',
    params: { payerInstitutionContractUuid: route.params.payerInstitutionContractUuid },
    query: { renewedFromPayerInstitutionContractUuid: renewedFromPayerInstitutionContractUuid.value },
  });
}

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

import {
  exportQuotedMainMembersTemplate,
  exportQuotedDependantsTemplate,
} from "../api/insuredPersonsApi";

import { insuredMembers as insuredMembersStore } from "../store/insuredPersonsStore";
const insuredStore = insuredMembersStore();

const quotationUuid = computed(() => {
  return route.params.quotationUuid || route.params.payerInstitutionContractUuid;
});

const hasAnyInsured = computed(() => {
  const list = insuredStore?.insuredMembers?.value ?? insuredStore?.insuredMembers;
  return Array.isArray(list) && list.length > 0;
});

const downloadFile = (blob, filename) => {
  const url = window.URL.createObjectURL(new Blob([blob]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

const downloadSample = async (type = "employee") => {
  try {
    if (!quotationUuid.value) {
      toasted(false, "Quotation UUID not found in route", "");
      return;
    }

    if (type === "quoted-main") {
      const response = await exportQuotedMainMembersTemplate(quotationUuid.value);
      downloadFile(response.data, "quoted-main-members-template.xlsx");
      toasted(true, "Main members template downloaded successfully", "");
      return;
    }

    if (type === "quoted-dependants") {
      if (!hasAnyInsured.value) {
        toasted(
          false,
          "Add at least 1 insured member before exporting dependants template",
          ""
        );
        return;
      }
      const response = await exportQuotedDependantsTemplate(quotationUuid.value);
      downloadFile(response.data, "quoted-dependants-template.xlsx");
      toasted(true, "Dependants template downloaded successfully", "");
      return;
    }
  } catch (error) {
    console.error('Error downloading template:', error);
    toasted(false, 'Failed to download template. Please try again.', '');
  }
};

onMounted(() => {
  return () => {
    resetNavigationState();
  };
});
</script>

<template>
  <div class="flex flex-col gap-6 p-6 bg-white rounded-lg">
    <div class="flex justify-between items-center">
      <!-- Tabs -->
      <div class="flex gap-4 items-center px-2 py-1 rounded-xl border border-base-clr w-fit">
        <!-- Tabs -->
        <div
          v-if="actionPage !== 'amend' && actionPage !== 'history'"
          class="flex overflow-hidden rounded-lg">
          <div
            v-for="(item, index) in components"
            :key="index"
            @click="setActive(index)"
            :class="[
              'px-4 py-2.5 transition-all cursor-pointer duration-300 text-sm',
              active === index
                ? index === 0
                  ? 'bg-base-clr text-white font-medium rounded-l-lg shadow-sm'
                  : 'bg-base-clr text-white font-medium rounded-r-lg shadow-sm'
                : 'text-gray-500 hover:text-base-clr hover:bg-base-clr/10',
            ]"
          >
            {{ item.name }}
          </div>
        </div>

        <!-- Institution Header -->
        <div
          v-if="institutionName"
          class="flex gap-3 items-center px-4 py-2 bg-gradient-to-r rounded-lg border shadow-sm from-base-clr/10 to-base-clr/5 border-base-clr/20"
        >
          <span class="w-2.5 h-2.5 rounded-full shadow bg-base-clr"></span>
          <h2 class="max-w-xs text-sm font-semibold tracking-tight truncate md:text-base text-base-clr">
            {{ institutionName }}
          </h2>
        </div>
      </div>

      <!-- Controls -->
      <div class="flex gap-3 items-center">
        <!-- Search input -->
        <div
          tabindex="0"
          class="flex items-center pr-10 w-full bg-gray-100 rounded-lg overflow-hidden md:m focus-within:border-primary"
        >
          <span
            class="grid place-items-center w-10 h-full text-base-clr"
            v-html="icons.search"
          />
          <input
            v-model="search"
            :placeholder="active === 0 ? (hasInstitution === 'true' ? 'Search employees' : 'Search insureds') : 'Search group'"
            class="flex-1 py-2 h-full bg-transparent outline-none px-"
          />
        </div>

        <!-- Employee / Insured buttons - Shown for both institution and individual policies -->
        <div v-if="active === 0" class="flex gap-3 items-center">
          <button
            v-if="actionPage !== 'amend' && actionPage !== 'history'"
            class="flex gap-2 items-center px-6 py-4 font-medium text-white whitespace-nowrap rounded-md shadow-sm transition-all bg-primary hover:bg-primary/90"
            @click="openModal('quotationInsured')"
          >
            <i v-html="icons.plus_circle"></i>
            {{ hasInstitution === 'true' ? 'Import Employees' : 'Import Insureds' }}
          </button>

          <!-- Import from previous contract — only shown on renewed policies -->
          <button
            v-if="renewedFromPayerInstitutionContractUuid && actionPage !== 'amend' && actionPage !== 'history'"
            class="flex gap-2 items-center px-6 py-4 font-semibold text-white whitespace-nowrap rounded-md shadow-sm transition-all bg-purple-600 hover:bg-purple-700"
            @click="openImportInsuredsPage"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Import Existing Insureds
          </button>

          <button
            v-if="actionPage === 'amend'"
            class="flex gap-2 items-center px-6 py-4 font-semibold text-white whitespace-nowrap bg-gradient-to-r from-gray-700 via-gray-600 to-gray-500 rounded-md border border-gray-400 shadow-md transition-all hover:from-gray-800 hover:to-gray-600"
            @click="openModal('AddBenefitsForAllInsured', { payerInstitutionContractUuid: route.params.id })"
          >
            <i v-html="icons.Benefits || icons.plus_circle"></i>
            Add Benefits For All Insured
          </button>

          <!-- Export Dropdown -->
          <Dropdown v-if="actionPage !== 'amend' && actionPage !== 'history'" v-slot="{ setRef, toggleDropdown }">
            <button
              class="flex gap-2 items-center px-6 py-4 font-semibold text-white whitespace-nowrap bg-gradient-to-r from-gray-700 via-gray-600 to-gray-500 rounded-md border border-gray-400 shadow-md transition-all hover:from-gray-800 hover:to-gray-600"
              @click.prevent="toggleDropdown"
              title="Export insured templates"
            >
              <i v-html="icons.download" class="text-lg"></i>
              Export Insured
            </button>

            <div
              class="flex absolute right-0 z-20 flex-col gap-1 p-2 mt-2 w-64 bg-white rounded-lg border shadow-lg"
              :ref="setRef"
            >
              <button
                class="p-2 text-left rounded-md hover:bg-gray-50"
                @click.prevent="downloadSample('quoted-main')"
              >
                Export insured and dependant format
              </button>

              <button
                v-if="hasAnyInsured"
                class="p-2 text-left rounded-md hover:bg-gray-50"
                @click.prevent="downloadSample('quoted-dependants')"
              >
                Export dependant format
              </button>

              <button
                v-else
                class="p-2 text-left rounded-md opacity-50 cursor-not-allowed"
                disabled
                title="Add at least 1 insured member to enable dependant export"
              >
                Export dependant format
              </button>
            </div>
          </Dropdown>

          <!-- Add Employee button - REMOVED -->
        </div>

        <!-- Coverage buttons -->
        <div v-else-if="active === 1" class="flex gap-3 items-center">
          <button
            v-if="actionPage !== 'amend' && actionPage !== 'history'"
            class="flex gap-2 items-center px-6 py-4 font-medium text-white whitespace-nowrap rounded-md shadow-sm transition-all bg-primary hover:bg-primary/90"
            @click="openModal('AddGroup')"
          >
            <i v-html="icons.plus_circle"></i>
            New Coverage
          </button>
        </div>
      </div>
    </div>

    <component 
      :search="search" 
      :pageContext="pageContext" 
      :showActionButtons="showActionButtons" 
      :is="components[active].component"
    />
  </div>
</template>