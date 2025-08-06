<script setup>
import { computed, ref, watch } from 'vue';
import RouterButton from './RouterButton.vue';
import BaseIcon from './base/BaseIcon.vue';
import { useRoute, useRouter } from 'vue-router'
import { mdiChevronDoubleDown } from '@mdi/js';

const browserRoute = useRoute()
const router = useRouter()

const props = defineProps({
  route: {
    type: Object,
    required: true
  },
  drawerOpened: {
    type: Boolean,
    default: true
  }
})

function isOpen() {
  if (props.route?.to == browserRoute.path) return true
  if (props.route?.menu?.find(el => el.to == browserRoute.path)) return true

  return false
}

const open = ref(isOpen())

function openPage() {
  if (props.route.to) {
    router.push(props.route.to)
  }
  open.value = !open.value
}

watch(props, () => {
  if (!props.drawerOpened) {
    open.value = false
  }
}, {
  immediate: true
})

const path = computed(() => browserRoute.path)
watch(path, () => {
  open.value = isOpen()
})
</script>

<template>
  <div class="flex flex-col">
    <button :title="route.label"
      :class="[route.to == browserRoute.path ? 'font-largest bg-primary text-white py-[8px] rounded-lg h-[2.875rem]  text-sidebarActive' : 'text-sidebar text-sidebarText font-medium']"
      @click="openPage" class="w-full px-[10px] gap-2 flex items-center">
      <div :class="[open ? '' : 'min-w-[1rem]']" class="grid place-items-center min-h-[3rem]">
        <BaseIcon :size="20" :path="route?.icon || ''" />
      </div>
      <p class="truncate">{{ route?.label }}</p>
      <div :class="[open ? 'rotate-180' : '']"
        class="transition duration-200 ease-linear origin-center grid place-items-center ml-auto h-full"
        v-if="route.menu">
        <BaseIcon :size="18" :path="mdiChevronDoubleDown" />
      </div>
    </button>
    <div v-if="open" class="ml-6 border-l border-primary px-2">
      <RouterButton v-for="innerRoute in route?.menu" :route="innerRoute" :key="innerRoute.label" />
    </div>
  </div>
</template>