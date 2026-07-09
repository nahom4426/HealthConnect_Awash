<script setup>
import { computed, ref, watch } from 'vue';
import ModalParent from '@/components/ModalParent.vue';
import NewFormParent from '@/components/NewFormParent.vue';
import Form from '@/components/new_form_builder/Form.vue';
import Button from '@/components/Button.vue';
import { closeModal } from '@customizer/modal-x';
import { toasted } from '@/utils/utils';
import { useApiRequest } from '@/composables/useApiRequest';
import { renewInstitutionContract } from '../api/underwritingApi';

const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
});

const req = useApiRequest();

const beginDate = ref('');
const endDate = ref('');
const policyNumber = ref('');
const endDateTouched = ref(false);

function toInputDate(dateString) {
  if (!dateString) return '';
  try {
    return String(dateString).split('T')[0];
  } catch (e) {
    return '';
  }
}

function addDays(dateStr, days) {
  if (!dateStr) return '';
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return '';
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function addYears(dateStr, years) {
  if (!dateStr) return '';
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return '';
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString().split('T')[0];
}

function appendRenewSuffix(policy) {
  const base = String(policy || '').trim();
  if (!base) return '';
  const suffix = '-Renewed';
  if (base.toLowerCase().endsWith(suffix)) return base;
  return `${base}${suffix}`;
}

const previousEndDate = computed(() => {
  return toInputDate(props.data?.previousEndDate || props.data?.contract?.endDate || '');
});

const beginDateMin = computed(() => {
  return previousEndDate.value ? addDays(previousEndDate.value, 1) : '';
});

const suggestedBeginDate = computed(() => {
  return beginDateMin.value || '';
});

const suggestedEndDate = computed(() => {
  // Ex: begin Apr 5, 2027 -> end Apr 4, 2028
  // end = (begin + 1 year) - 1 day
  if (!beginDate.value) return '';
  const plusOneYear = addYears(beginDate.value, 1);
  return plusOneYear ? addDays(plusOneYear, -1) : '';
});

const endDateMin = computed(() => {
  return beginDate.value ? addDays(beginDate.value, 1) : beginDateMin.value;
});

// Prefill defaults for renewal
beginDate.value = suggestedBeginDate.value;
endDate.value = beginDate.value ? suggestedEndDate.value : '';
policyNumber.value = appendRenewSuffix(
  props.data?.policyNumber || props.data?.contract?.policyNumber || ''
);

watch(
  () => beginDate.value,
  (newBegin) => {
    if (!newBegin) return;

    const suggestedEnd = (() => {
      const plusOneYear = addYears(newBegin, 1);
      return plusOneYear ? addDays(plusOneYear, -1) : '';
    })();

    if (!endDate.value || !endDateTouched.value) {
      endDate.value = suggestedEnd;
      endDateTouched.value = false;
      return;
    }

    if (endDateMin.value && new Date(endDate.value) < new Date(endDateMin.value)) {
      endDate.value = suggestedEnd;
    }
  }
);

function handleSubmit() {
  const contractUuid = props.data?.contractUuid;
  if (!contractUuid) {
    toasted(false, '', 'Missing contractUuid');
    return;
  }
  if (!beginDate.value || !endDate.value || !policyNumber.value) {
    toasted(false, '', 'Please fill begin date, end date, and policy number');
    return;
  }

  if (beginDateMin.value && new Date(beginDate.value) < new Date(beginDateMin.value)) {
    toasted(false, '', 'Begin date must be after the previous end date');
    return;
  }
  if (endDateMin.value && new Date(endDate.value) < new Date(endDateMin.value)) {
    toasted(false, '', 'End date must be after the begin date');
    return;
  }

  const payload = {
    beginDate: beginDate.value,
    endDate: endDate.value,
    policyNumber: policyNumber.value,
  };

  req.send(
    () => renewInstitutionContract(contractUuid, payload),
    (res) => {
      if (res?.success) {
        toasted(true, 'Contract renewed successfully', '');
        window.dispatchEvent(new CustomEvent('renewContractSuccess'));
        closeModal();
      } else {
        // toasted(false, '', res?.error || 'Failed to renew contract');
      }
    }
  );
}
</script>

<template>
  <ModalParent>
    <NewFormParent
      size="xmd"
      class="flex flex-col max-h-[90vh] overflow-hidden"
      title="Renew Contract"
      subtitle="Enter new policy dates and policy number"
    >
      <div class="overflow-y-auto overflow-x-hidden form-scrollbar">
        <Form class="p-6 space-y-6" id="renewContractForm" @submit.prevent="handleSubmit">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div class="space-y-1">
              <label class="block text-xs font-medium text-gray-600">Begin Date</label>
              <input
                type="date"
                v-model="beginDate"
                :min="beginDateMin"
                class="px-3 py-2 w-full text-sm rounded-lg border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div class="space-y-1">
              <label class="block text-xs font-medium text-gray-600">End Date</label>
              <input
                type="date"
                v-model="endDate"
                :min="endDateMin"
                @input="endDateTouched = true"
                class="px-3 py-2 w-full text-sm rounded-lg border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div class="space-y-1">
            <label class="block text-xs font-medium text-gray-600">Policy Number</label>
            <input
              type="text"
              v-model="policyNumber"
              class="px-3 py-2 w-full text-sm rounded-lg border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Policy number"
            />
          </div>

          <div class="flex gap-3 justify-end pt-4 border-t">
            <Button type="button" @click="closeModal" class="p-2 bg-red-500 border border-primary">
              Cancel
            </Button>
            <Button type="primary" html-type="submit" class="p-2 pt-4 text-white bg-primary" :pending="req.pending.value">
              Renew
            </Button>
          </div>
        </Form>
      </div>
    </NewFormParent>
  </ModalParent>
</template>
