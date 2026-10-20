<script setup>
import PersonAvatar from "@/components/PersonAvatar.vue";
import { ref, onMounted } from 'vue';
import DefaultPage from '@/components/DefaultPage.vue';
import Button from '@/components/Button.vue';
import icons from '@/utils/icons';
import EligibilityCheck from '@/features/claim/components/cash_services/EligibilityCheck.vue';
import ServiceSelection from '@/features/claim/components/cash_services/ServiceSelection.vue';
import { useRouter, useRoute } from 'vue-router';
import { useApiRequest } from '@/composables/useApiRequest';
import { getServiceProvidedById } from '@/features/claim/api/claimApi';
import { canEditServiceProvided, editLockReason } from '@/features/claim/utils/serviceEditLock';
import { toasted } from '@/utils/utils';

const router = useRouter();
const route = useRoute();

const editReq = useApiRequest();
const editServiceProvided = ref(null);

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
      if (!canEditServiceProvided(data)) {
        toasted(false, '', editLockReason(data));
        router.replace({ path: '/cash_claims' });
        return;
      }
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
  active.value = 1;
}

function handleCashServiceSubmitted(action = 'add') {
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
                  ? 'bg-gradient-to-r from-primary to-primary text-white shadow-lg'
                  : i === 0 || selection.person
                  ? 'text-ink-muted hover:text-ink hover:bg-surface-muted'
                  : 'text-ink-subtle'
              ]"
            >
              <span v-if="i === 0">✓</span>
              <span v-else>💰</span>
              {{ tab }}
            </div>
            <!-- Underline Animation -->
            <div
              v-if="active === i"
              class="absolute right-0 bottom-0 left-0 h-1 bg-gradient-to-r from-primary to-primary rounded-full"
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
            class="flex gap-3 items-center px-4 py-2 mx-4 bg-gradient-to-r from-primary/5 to-primary/5 rounded-lg border border-primary/20"
          >
            <div class="relative">
              <PersonAvatar
                :photo="selection.person.profile"
                :gender="selection.person.gender"
                alt="Profile"
                class="w-8 h-8 rounded-full border-2 border-white shadow-sm"
              />
            </div>
            <div class="min-w-0">
              <p class="text-xs font-semibold tracking-wide text-ink-subtle uppercase truncate">Current Person</p>
              <p class="text-sm font-bold text-ink truncate">{{ selection.person?.name }}</p>
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
