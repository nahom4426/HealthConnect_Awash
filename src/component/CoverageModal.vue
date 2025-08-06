<script setup>
import { useRouter } from "vue-router";
import { ref, computed } from "vue";
import {
  Dialog,
  DialogPanel,
  TransitionChild,
  TransitionRoot,
} from "@headlessui/vue";
import IconRounded from "./base/IconRounded.vue";
import { mdiWindowClose } from "@mdi/js";
const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  name: {type:String},

  icon: {
    type: String,
    required: false,
  },
  title: {
    type: Object,
    required: false,
  },
  titleClass: {
    type: String,
    required: false,
  },
  autoClose: {
    type: Boolean,
    default: false,
  },
});
console.log('mounted')
console.log('props',props.value)
const emits = defineEmits(["close"]);
const open = computed({
  get() {
    return props.open;
  },
  set(newVal) {
    emits("close", newVal);
  },
});
</script>
<template>
  <TransitionRoot as="template" :show="open">
    <Dialog as="div" class="relative z-50">
      <TransitionChild
        as="template"
        enter="ease-out duration-300"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="ease-in duration-200"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div
          class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        ></div>
      </TransitionChild>

      <div class="fixed inset-0 z-10 w-full overflow-y-auto">
        <div
          class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0"
        >
          <TransitionChild
            as="template"
            enter="ease-out duration-300"
            enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enter-to="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leave-from="opacity-100 translate-y-0 sm:scale-100"
            leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <DialogPanel
              class="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-fit sm:p-6"
            >
              <div class="sm:flex sm:items-start sm:flex-col px-6">
                <div
                  class="flex justify-between w-full items-center"
                  :class="titleClass"
                >
                  <div class="flex items-center">
                    <IconRounded
                      v-if="icon"
                      :icon="icon"
                      color="black"
                      class="mr-3 border-2"
                      bg
                    />
                    <div class="text-bold text-black text-xl font-bold">
                      {{ title }} <span class="text-primary">{{name.packageName}}</span>
                    </div>
                  </div>
                  <IconRounded
                    :icon="mdiWindowClose"
                    color="black"
                    class="mr-3 text-black cursor-pointer absolute top-3 right-1"
                    open
                    @click="open = false"
                  />
                  <!-- @click="$emit('close')" -->
                </div>
                <slot />
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
<script setup></script>
