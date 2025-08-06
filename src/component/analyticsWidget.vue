<script setup>
import { mdiCog } from '@mdi/js';
import CardBox from '@/components/cardbox/CardBox.vue';
import NumberDynamic from '@/components/base/NumberDynamic.vue';
import BaseIcon from '@/components/base/BaseIcon.vue';
import BaseLevel from '@/components/base/BaseLevel.vue';
import PillTagTrend from '@/components/pill-tag/PillTagTrend.vue';
import BaseButton from '@/components/base/BaseButton.vue';

defineProps({
  number: {
    type: Number,
    default: 0,
  },
  icon: {
    type: String,
    default: null,
  },
  prefix: {
    type: String,
    default: null,
  },
  suffix: {
    type: String,
    default: null,
  },
  label: {
    type: String,
    default: null,
  },
  color: {
    type: String,
    default: null,
  },
  trend: {
    type: String,
    default: null,
  },
  trendType: {
    type: String,
    default: null,
  },
});
</script>

<template>
  <CardBox class="flex w-full border border-primary bg-white rounded-lg">
    <div class="flex justify-between w-full">
      <BaseLevel v-if="trend" class="" mobile>
        <PillTagTrend :trend="trend" :trend-type="trendType" small />
      </BaseLevel>
      <BaseLevel class="">
        <div>
          <h3 class="text-lg leading-tight text-gray-500 dark:text-slate-400">
            {{ label }}
          </h3>
          <h1 class="text-3xl leading-tight font-semibold">
            <NumberDynamic :value="number" :prefix="prefix" :suffix="suffix" />
          </h1>
        </div>
      </BaseLevel>
    </div>
  </CardBox>
</template>
