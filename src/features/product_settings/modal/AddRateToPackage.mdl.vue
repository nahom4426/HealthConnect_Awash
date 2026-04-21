<script setup lang="ts">
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import { closeModal } from "@customizer/modal-x";
import { ref, computed, watch } from 'vue'
import { createBenefitRange } from '@/features/product_settings/api/benefitRangeApi'
import { Plan, SharedlMemberTYpes, allMemberTYpes } from '@/types/interface'
import { useApiRequest } from '@/composables/useApiRequest'
import { useToast } from '@/toast/store/toast'

const props = defineProps<{ data: any }>()

const form = ref({
  packageUuid: props.data?.packageUuid || '',
  planType: Plan['Individual Plan'],
  familySize: props.data?.planType === Plan['Individual Plan'] ? 'Member' : 1,
  minLimit: Number(props.data?.minLimit) || 0,
  maxLimit: Number(props.data?.maxLimit) || 0,
  rate: 0,
  description: ''
})

const familyOptions = computed(() => (
  form.value.planType === Plan['Individual Plan'] ? SharedlMemberTYpes : allMemberTYpes
))

// Watch planType changes and update familySize accordingly
watch(() => form.value.planType, (newPlanType) => {
  if (newPlanType === Plan['Individual Plan']) {
    form.value.familySize = 'Member'
  } else {
    form.value.familySize = 1
  }
})

const { addToast } = useToast();
const api = useApiRequest();

async function submit() {
  try {
    await api.send(
      () => createBenefitRange({
        packageUuid: form.value.packageUuid,
        planType: form.value.planType,
        familySize: form.value.planType === Plan['Individual Plan'] ? form.value.familySize : Number(form.value.familySize),
        minLimit: Number(form.value.minLimit),
        maxLimit: Number(form.value.maxLimit),
        rate: Number(form.value.rate),
        description: form.value.description || undefined,
      })
    );
    addToast({ type: 'success', title: 'Success', message: 'Rate saved successfully' });
    closeModal(true);
  } catch (e: any) {
    addToast({ type: 'error', title: 'Failed to save rate', message: e?.message || '' });
  }
}
</script>

<template>
  <ModalParent>
    <NewFormParent
      size="md"
      title="Add Rate to Package"
      :subtitle="`Package: ${props.data?.packageName || ''}`"
    >
      <div class="grid grid-cols-2 gap-3 p-2">
        <div class="col-span-2">
          <label class="block mb-1 text-sm">Plan Type</label>
          <select v-model="form.planType" class="p-2 w-full rounded border">
            <option :value="Plan['Individual Plan']">Individual Plan</option>
            <option :value="Plan['Family Plan']">Family Plan</option>
            <option :value="Plan['Family Shared Plan']">Family Shared Plan</option>
          </select>
        </div>
        <div>
          <label class="block mb-1 text-sm">Family Type</label>
          <select v-model="form.familySize" class="p-2 w-full rounded border">
            <option v-for="opt in familyOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </div>
        <div>
          <label class="block mb-1 text-sm">Rate</label>
          <input type="number" v-model.number="form.rate" class="p-2 w-full rounded border" placeholder="Rate" />
        </div>
        <div>
          <label class="block mb-1 text-sm">Min Limit</label>
          <input type="number" v-model.number="form.minLimit" class="p-2 w-full rounded border" placeholder="Min Limit" />
        </div>
        <div>
          <label class="block mb-1 text-sm">Max Limit</label>
          <input type="number" v-model.number="form.maxLimit" class="p-2 w-full rounded border" placeholder="Max Limit" />
        </div>
        <div class="col-span-2">
          <label class="block mb-1 text-sm">Description (optional)</label>
          <input type="text" v-model="form.description" class="p-2 w-full rounded border" placeholder="Description" />
        </div>
      </div>
      <div class="flex gap-2 justify-end p-4 pt-0">
        <button class="px-4 py-2 rounded border" :disabled="api.pending.value" @click="closeModal">Cancel</button>
        <button class="px-4 py-2 text-white bg-blue-600 rounded" :disabled="api.pending.value" @click="submit">
          <span v-if="api.pending.value">Saving...</span>
          <span v-else>Save</span>
        </button>
      </div>
    </NewFormParent>
  </ModalParent>
</template>
