<script setup>
import { useSlots, computed } from 'vue';
import BaseIcon from '@/components/base/BaseIcon.vue';
import BaseButton from '@/components/base/BaseButton.vue';
import IconRounded from '@/components/base/IconRounded.vue';
import * as session from '@/scripts/session';

const user = session.getUser();

defineProps({
  icon: {
    type: String,
    default: null,
  },
  title: {
    type: String,
    required: true,
  },
  btnLabel: {
    type: String
  },
  to: String,
  main: Boolean,
});

const hasSlot = computed(() => useSlots().default);
</script>

<template>
  <section :class="{ 'pt-6': !main }" class="bg-gray-50 p-2 rounded-lg max-w-full flex items-center justify-between">
    <div class="flex items-center justify-start">
      <IconRounded v-if="icon && main" :icon="icon" color="light" class="mr-3" bg />
      <BaseIcon v-else-if="icon" :path="icon" class="mr-2" size="20" />
      <h1 :class="main ? 'text-xl' : 'text-lg'" class="capitalize leading-tight">
        {{ title }}
      </h1>
    </div>
    <slot v-if="hasSlot" />
    <BaseButton v-else :icon="icon" :to="to" :label="btnLabel" />
  </section>
</template>
