<script setup>
  import { ref, onMounted } from 'vue'
  import {InputParent} from '@/form_builder'
  import InputLayout from './InputLayout.vue'
  import { mdiAttachment } from '@mdi/js';
import BaseIcon from '../base/BaseIcon.vue';

</script>
<template>
  <InputParent v-slot='{setRef, modelValue, label, asyncValidating, error, attrs}'>
    <InputLayout :class='[attrs.class]' :error='error' :label='label'>
      <label @keydown.enter="$event.target.click()" tabindex=0 class="pr-0 w-full flex h-full gap-2">
        <div class="cursor-pointer overflow-hidden flex h-full w-full">
          <div class="px-2 relative max-w-full flex-1 text-black flex items-center justify-between">
            <span class="text-text-clr whitespace-nowrap overflow-hidden text-ellipsis max-w-full block" v-if='modelValue'>
            {{ modelValue?.name || modelValue}}</span> 
            <span class="placeholder text-gray-400 text-sm" v-else>{{ attrs.placeholder }}</span>
            <span class="bg-gray-200 text-black rounded-r-md w-10 absolute right-0 h-full flex justify-center items-center">
              <BaseIcon :size="20" :path="mdiAttachment" />
            </span>
          </div>
          <input
            :ref="setRef"
            v-bind="attrs"
            type="file"
            class="hidden"
          />
        </div>
      </label>
    </InputLayout>
  </InputParent>
</template>