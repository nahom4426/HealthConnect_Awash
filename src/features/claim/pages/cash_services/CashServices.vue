<script setup>
import { ref, onMounted } from 'vue';
import DefaultPage from '@/components/DefaultPage.vue';
import Button from '@/components/Button.vue';
import icons from '@/utils/icons';
import EligibilityCheck from '@/features/claim/components/cash_services/EligibilityCheck.vue';
import ServiceSelection from '@/features/claim/components/cash_services/ServiceSelection.vue';
import { useRouter, useRoute } from 'vue-router';
import { useApiRequest } from '@/composables/useApiRequest';
import { getServiceProvidedById } from '@/features/claim/api/claimApi';

const router = useRouter();
const route = useRoute();

const editReq = useApiRequest();
const editServiceProvided = ref(null);

// Format profile image source to handle both URLs and base64
const formatImageSource = (profile) => {
  if (!profile) return '';
  // Check if it's a base64 string (starts with iVBOR for PNG or /9j/ for JPEG)
  const isBase64 = profile.startsWith('iVBOR') || profile.startsWith('/9j/');
  // If it's base64, add the data URL prefix, otherwise return as is
  return isBase64 ? `data:image/png;base64,${profile}` : profile;
};

const active = ref(0);

const eligibilityRef = ref();

// Collected from step 1
const selection = ref({
  institutionUuid: '',
  institutionName: '',
  payerInstitutionContractUuid: '',
  insuredUuid: '',
  dependantUuid: null,
  person: null,
  cashPeriodLimitPerDay: null,
});

async function loadEditServiceProvided() {
  const id = route.query?.editServiceProvidedUuid;
  if (!id) return;
  editReq.send(
    () => getServiceProvidedById(String(id)),
    (res) => {
      if (!res?.success) return;
      const data = res?.data ?? res;
      editServiceProvided.value = data;

      selection.value = {
        ...selection.value,
        institutionUuid: data?.institutionUuid || '',
        institutionName: data?.institutionName || '',
        payerInstitutionContractUuid: data?.contractUuid || '',
        insuredUuid: data?.insuredPersonUuid || '',
        dependantUuid: data?.dependantUuid || null,
        person: {
          name: data?.insuredName || data?.dependantName || '',
          firstName: (data?.insuredName || data?.dependantName || '').split(' ')?.[0] || '',
          profile: null,
          gender: null,
        },
        cashPeriodLimitPerDay: selection.value.cashPeriodLimitPerDay,
      };

      active.value = 1;
    }
  );
}

function handleEligibilityComplete(payload) {
  selection.value = { ...selection.value, ...payload };
  console.log('[cash_services] eligibility complete -> selection:', selection.value);
  active.value = 1;
}

function handleCashServiceSubmitted(action = 'add') {
  console.log('[cash_services] service submitted action:', action, 'current selection:', selection.value);
  editServiceProvided.value = null;
  if (route.query?.editServiceProvidedUuid) {
    router.replace({ path: '/cash_services' });
  }
  if (action === 'generate') {
    goToCreateCashClaims(true);
    return;
  }
  // return to eligibility (step 1) to add another person for the SAME institution
  active.value = 0;
  selection.value = {
    ...selection.value,
    insuredUuid: '',
    dependantUuid: null,
    person: null,
  };

  if (eligibilityRef.value?.resetForNextPerson) {
    eligibilityRef.value.resetForNextPerson();
  }
}

function goToCreateCashClaims(autoGenerate = false) {
  if (!selection.value?.institutionUuid) return;
  const query = {
    institutionUuid: selection.value.institutionUuid,
    institutionName: selection.value.institutionName,
  };

  if (autoGenerate) {
    query.autoGenerate = '1';
  }
  router.push({
    path: '/create_cash_claims',
    query,
  });
}

onMounted(() => {
  loadEditServiceProvided();
});
</script>

<template>
  <DefaultPage :hideSearch="true">
    <template #header>
      <div class="flex justify-between items-center w-full">
        <!-- Modern Step Indicator -->
        <div class="flex gap-8 items-center">
          <div
            v-for="(tab, i) in ['Eligibility Check', 'Cash Services']"
            :key="i"
            @click="i === 0 || selection.person ? active = i : null"
            :class="[
              'relative group',
              i === 0 || selection.person ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
            ]"
          >
            <!-- Tab Button -->
            <div
              :class="[
                'px-4 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2',
                active === i
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                  : i === 0 || selection.person
                  ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  : 'text-gray-400'
              ]"
            >
              <span v-if="i === 0">✓</span>
              <span v-else>💰</span>
              {{ tab }}
            </div>
            <!-- Underline Animation -->
            <div
              v-if="active === i"
              class="absolute right-0 bottom-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
            ></div>
          </div>
        </div>

        <div class="flex gap-3 items-center">
          <Button
            type="button"
            :disabled="!selection.institutionUuid"
            @click="goToCreateCashClaims(true)"
            class="whitespace-nowrap"
          >
            Generate & Submit Cash Claims
          </Button>

          <!-- Person Info Card -->
        <Transition name="slide-left">
          <div
            v-if="selection.person"
            class="flex gap-3 items-center px-4 py-2 mx-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg border border-blue-200"
          >
            <div class="relative">
              <div v-if="selection.person.profile" class="flex overflow-hidden justify-center items-center w-8 h-8 rounded-full border-2 border-white shadow-sm">
                <img :src="formatImageSource(selection.person.profile)" class="object-cover w-full h-full" alt="Profile" />
              </div>
              <div v-else class="flex justify-center items-center w-8 h-8 text-sm font-bold text-white bg-gradient-to-br from-blue-400 to-blue-600 rounded-full shadow-sm">
                {{ selection.person.firstName?.charAt(0)?.toUpperCase() || selection.person?.name?.charAt(0)?.toUpperCase() }}
              </div>
            </div>
            <div class="min-w-0">
              <p class="text-xs font-semibold tracking-wide text-gray-500 uppercase truncate">Current Person</p>
              <p class="text-sm font-bold text-gray-900 truncate">{{ selection.person?.name }}</p>
            </div>
          </div>
        </Transition>
        </div>
      </div>
    </template>

    <!-- Content Area -->
    <div class="py-6">
      <Transition name="fade" mode="out-in">
        <div>
          <EligibilityCheck
            ref="eligibilityRef"
            v-show="active === 0"
            @complete="handleEligibilityComplete"
          />

          <ServiceSelection
            v-if="active === 1 && selection.person"
            :institutionUuid="selection.institutionUuid"
            :payerInstitutionContractUuid="selection.payerInstitutionContractUuid"
            :insuredUuid="selection.insuredUuid"
            :dependantUuid="selection.dependantUuid"
            :person="selection.person"
            :cashPeriodLimitPerDay="selection.cashPeriodLimitPerDay"
            :editServiceProvided="editServiceProvided"
            :contractBeginDate="selection.beginDate"
            :contractEndDate="selection.endDate"
            @submitted="handleCashServiceSubmitted"
          />
        </div>
      </Transition>
    </div>
  </DefaultPage>
</template>

<style scoped>
.slide-left-enter-active,
.slide-left-leave-active {
  transition: all 0.3s ease;
}

.slide-left-enter-from {
  opacity: 0;
  transform: translateX(10px);
}

.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
