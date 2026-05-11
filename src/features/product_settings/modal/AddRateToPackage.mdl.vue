<script setup lang="ts">
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import { closeModal } from "@customizer/modal-x";
import { computed, ref } from 'vue'
import { createBenefitRange } from '@/features/product_settings/api/benefitRangeApi'
import { Plan, allMemberTYpes } from '@/types/interface'
import { useApiRequest } from '@/composables/useApiRequest'
import Form from '@/components/new_form_builder/Form.vue'
import Input from '@/components/new_form_elements/Input.vue'
import Select from '@/components/new_form_elements/Select.vue'
import Button from '@/components/Button.vue'
import { toasted } from '@/utils/utils'

const props = defineProps<{ data: any }>()

type RateRow = {
  familyBenefitRangeUuid?: string;
  packageUuid: string;
  planType: string;
  familySize: number;
  minLimit: number;
  maxLimit: number;
  rate: number;
  status?: string;
  description?: string;
  _isNew?: boolean;
}

const packageUuid = String(props.data?.packageUuid || '')

const memberOnlyOption = { label: 'Member Only', value: 1 }

const rateRows = ref<RateRow[]>(
  (Array.isArray(props.data?.existingRates) ? props.data.existingRates : []).map((r: any) => ({
    familyBenefitRangeUuid: r.familyBenefitRangeUuid,
    packageUuid: String(r.packageUuid || packageUuid),
    planType: String(r.planType || Plan['Individual Plan']),
    familySize: Number(r.familySize) || 1,
    minLimit: Number(r.minLimit) || 0,
    maxLimit: Number(r.maxLimit) || 0,
    rate: Number(r.rate) || 0,
    status: r.status || 'ACTIVE',
    description: r.description || '',
    _isNew: false,
  }))
)

const api = useApiRequest();

const usedByPlan = computed(() => {
  const map = new Map<string, Set<number>>()
  for (const r of rateRows.value || []) {
    const plan = String(r?.planType || '')
    if (!plan) continue
    if (!map.has(plan)) map.set(plan, new Set())
    map.get(plan)!.add(Number(r?.familySize) || 1)
  }
  return map
})

function familySizeOptionsForPlan(planType: string) {
  if (String(planType) === Plan['Individual Plan']) return [memberOnlyOption]
  return allMemberTYpes
}

function availableFamilySizeOptions(planType: string) {
  const options = familySizeOptionsForPlan(planType)
  const used = usedByPlan.value.get(String(planType)) || new Set<number>()
  return options.filter((o: any) => !used.has(Number(o?.value)))
}

function addRateRow() {
  const planType = Plan['Family Plan']
  const candidates = [Plan['Family Plan'], Plan['Family Shared Plan'], Plan['Individual Plan']]

  for (const p of candidates) {
    const opts = availableFamilySizeOptions(p)
    if (opts.length > 0) {
      rateRows.value.push({
        packageUuid,
        planType: p,
        familySize: Number(opts[0]?.value) || 1,
        minLimit: Number(props.data?.minLimit) || 0,
        maxLimit: Number(props.data?.maxLimit) || 0,
        rate: 0,
        status: 'ACTIVE',
        description: '',
        _isNew: true,
      })
      return
    }
  }

  toasted(false, '', 'All member types are already added')
}

function removeNewRow(idx: number) {
  const row = rateRows.value[idx]
  if (!row?._isNew) return
  rateRows.value.splice(idx, 1)
}

function handlePlanTypeChange(idx: number) {
  const row = rateRows.value[idx]
  if (!row || !row._isNew) return

  const options = availableFamilySizeOptions(row.planType)
  if (String(row.planType) === Plan['Individual Plan']) {
    row.familySize = 1
    return
  }

  if (options.length > 0) {
    row.familySize = Number(options[0]?.value) || 1
    return
  }
}

function handleSubmit() {
  if (!packageUuid) {
    toasted(false, '', 'Package UUID is missing')
    return
  }

  if (!Array.isArray(rateRows.value) || rateRows.value.length === 0) {
    toasted(false, '', 'Please add at least one rate')
    return
  }

  const payload = rateRows.value.map((r) => ({
    familyBenefitRangeUuid: r.familyBenefitRangeUuid || undefined,
    packageUuid: String(r.packageUuid || packageUuid),
    minLimit: Number(r.minLimit) || 0,
    maxLimit: Number(r.maxLimit) || 0,
    familySize: Number(r.familySize) || 1,
    rate: Number(r.rate) || 0,
    status: r.status || 'ACTIVE',
    planType: String(r.planType || Plan['Individual Plan']),
    description: r.description || undefined,
  }))

  api
    .send(
      () => createBenefitRange(payload as any),
      (res: any) => {
        if (res?.success) {
          toasted(true, 'Rates saved successfully!', res?.error);
          closeModal(true);
          return;
        }
        toasted(false, '', res?.error || 'Failed to save rates');
      }
    )
    .catch((e: any) => {
      toasted(false, '', e?.message || 'Failed to save rates');
    });
}
</script>

<template>
  <ModalParent>
    <NewFormParent
      size="md"
      title="Manage Package Rates"
      :subtitle="`Package: ${props.data?.packageName || ''}`"
    >
      <Form id="add-rate-to-package" class="p-4" @submit.prevent="handleSubmit">
        <div class="flex justify-between items-center pb-4">
          <div>
            <p class="text-sm text-gray-600">Add all rates then save once.</p>
          </div>
          <Button type="secondary" size="sm" @click.prevent="addRateRow">
            + Add
          </Button>
        </div>

        <div class="space-y-4">
          <div
            v-for="(row, idx) in rateRows"
            :key="row.familyBenefitRangeUuid || `${row.planType}-${row.familySize}-${idx}`"
            class="p-4 bg-gray-50 rounded-lg border border-gray-200"
          >
            <div class="grid grid-cols-2 gap-4">
              <Select
                class="col-span-2"
                name="planType"
                label="Plan Type"
                v-model="row.planType"
                :options="[
                  { label: 'Individual Plan', value: Plan['Individual Plan'] },
                  { label: 'Family Plan', value: Plan['Family Plan'] },
                  { label: 'Family Shared Plan', value: Plan['Family Shared Plan'] },
                ]"
                :obj="true"
                :attributes="{ placeholder: 'Select Plan Type', disabled: !row._isNew }"
                validation="required"
                @update:modelValue="() => handlePlanTypeChange(idx)"
              />

              <Select
                name="familySize"
                label="Family Size"
                v-model="row.familySize"
                :options="row._isNew ? availableFamilySizeOptions(row.planType) : familySizeOptionsForPlan(row.planType)"
                :obj="true"
                :attributes="{ placeholder: 'Select Family Size', disabled: !row._isNew || String(row.planType) === Plan['Individual Plan'] }"
                validation="required"
              />

              <Input
                name="rate"
                label="Rate"
                v-model="row.rate"
                validation="required"
                :attributes="{ type: 'number', placeholder: 'Rate' }"
              />

              <Input
                name="minLimit"
                label="Min Limit"
                v-model="row.minLimit"
                validation="required"
                :attributes="{ type: 'number', placeholder: 'Min Limit' }"
              />

              <Input
                name="maxLimit"
                label="Max Limit"
                v-model="row.maxLimit"
                validation="required"
                :attributes="{ type: 'number', placeholder: 'Max Limit' }"
              />

              <Input
                class="col-span-2"
                name="description"
                label="Description (optional)"
                v-model="row.description"
                :attributes="{ placeholder: 'Description' }"
              />
            </div>

            <div v-if="row._isNew" class="flex justify-end pt-3">
              <button
                type="button"
                class="text-sm text-red-600 hover:text-red-700"
                @click.prevent="removeNewRow(idx)"
              >
                Remove
              </button>
            </div>
          </div>
        </div>

        <div class="flex gap-3 justify-end pt-6">
          <Button
            type="secondary"
            html-type="button"
            @click="closeModal"
            class="p-2 bg-white border border-primary"
          >
            Cancel
          </Button>

          <Button
            type="primary"
            html-type="submit"
            class="p-2 text-white bg-primary"
            :pending="api.pending.value"
          >
            Save
          </Button>
        </div>
      </Form>
    </NewFormParent>
  </ModalParent>
</template>
