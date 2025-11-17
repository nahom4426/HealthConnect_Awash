<script setup lang="ts">
import { ref, computed } from 'vue'
import { createBenefitRange } from '@/features/product_settings/api/benefitRangeApi'
import { Plan, allMemberTYpes, SharedlMemberTYpes } from '@/types/interface'
import ModalParent from '@/components/ModalParent.vue'
const props = defineProps<{ data: any }>()
const emit = defineEmits(['close', 'saved'])

const form = ref({
  packageUuid: props.data?.packageUuid || '',
  planType: Plan['Individual Plan'],
  familySize: 1,
  minLimit: props.data?.minLimit || 0,
  maxLimit: props.data?.maxLimit || 0,
  rate: 0,
  description: ''
})

const familyOptions = computed(() =>
  form.value.planType === Plan['Individual Plan'] ? SharedlMemberTYpes : allMemberTYpes
)

async function submit() {
  await createBenefitRange({
    packageUuid: form.value.packageUuid,
    planType: form.value.planType,
    familySize: Number(form.value.familySize),
    minLimit: Number(form.value.minLimit),
    maxLimit: Number(form.value.maxLimit),
    rate: Number(form.value.rate),
    description: form.value.description || undefined,
  })
  emit('saved')
  emit('close')
}
</script>

<template>
 
    
      

  <div class="p-4 space-y-4 w-[28rem]">
    <h3 class="text-lg font-semibold">Add Rate</h3>
    <div class="grid grid-cols-2 gap-3">
      <div class="col-span-2 text-sm text-gray-600">Package: {{ props.data?.packageName }}</div>
      <div class="col-span-2">
        <label class="block text-sm mb-1">Plan Type</label>
        <select v-model="form.planType" class="w-full border rounded p-2">
          <option :value="Plan['Individual Plan']">Individual Plan</option>
          <option :value="Plan['Family Plan']">Family Plan</option>
          <option :value="Plan['Family Shared Plan']">Family Shared Plan</option>
        </select>
      </div>
      <div>
        <label class="block text-sm mb-1">Family Type</label>
        <select v-model="form.familySize" class="w-full border rounded p-2">
          <option v-for="opt in familyOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>
      <div>
        <label class="block text-sm mb-1">Rate</label>
        <input type="number" v-model.number="form.rate" class="w-full border rounded p-2" placeholder="Rate" />
      </div>
      <div>
        <label class="block text-sm mb-1">Min Limit</label>
        <input type="number" v-model.number="form.minLimit" class="w-full border rounded p-2" placeholder="Min Limit" />
      </div>
      <div>
        <label class="block text-sm mb-1">Max Limit</label>
        <input type="number" v-model.number="form.maxLimit" class="w-full border rounded p-2" placeholder="Max Limit" />
      </div>
      <div class="col-span-2">
        <label class="block text-sm mb-1">Description (optional)</label>
        <input type="text" v-model="form.description" class="w-full border rounded p-2" placeholder="Description" />
      </div>
    </div>
    <div class="flex justify-end gap-2 pt-2">
      <button class="px-4 py-2 rounded border" @click="$emit('close')">Cancel</button>
      <button class="px-4 py-2 rounded bg-blue-600 text-white" @click="submit">Save</button>
    </div>
  </div>
  </template>
