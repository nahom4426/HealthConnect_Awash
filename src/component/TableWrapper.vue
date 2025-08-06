<script setup>
import { inject, ref, useAttrs, watch } from "vue";
import Dropdown from '@/components/Dropdown.vue'
import DropdownBtn from '@/components/DropdownBtn.vue'
import { mdiMenu } from "@mdi/js";
import BaseIcon from "./base/BaseIcon.vue";
const emit = defineEmits(['row', 'action:certificate', 'action:delete', 'action:review', 'action:suspend', 'action:edit', 'bottom'])

const props = defineProps({
  showPagination: {
    type: Boolean,
    default: true
  },
  actionHide: String,
  headers: Array | Object,
  rows: Array,
  photoRow: Object,
  actions: Array,
  exceptions: Array,
  length: Number,
  Fallback: Object,
  pending: Boolean,
  defaultAction: {
    type: Boolean,
    default: true
  },
  counter: {
    type: Boolean,
    default: true
  }
})

function toUpper(str) {
  let words = str.split(" ")
  if (words.length == 0) return str

  for (let i = 1; i < words.length; i++) {
    words[0] += words[i].charAt(0).toUpperCase() + words[i].substring(1)
  }

  return words[0]
}

const spec = ref({ head: [], row: [] })

function format() {
  if (Array.isArray(props.headers)) {
    spec.value.head = props.headers

    const res = props.headers.reduce((state, el) => {
      const temp = el.toLowerCase()
      state.push(toUpper(temp))
      return state
    }, [])

    spec.value.row = res.filter((el) => el != "modify")
  } else {
    spec.value.head = props.headers?.head || []
    spec.value.row = props.headers?.row || []
  }
}

format()

function getUrl(blob) {
  if (blob.toString().includes("File")) {
    const url = URL.createObjectURL(blob)
    return url
  }

  return blob
}

watch(props, () => {
  format()
})

const next = inject('next', () => { })
const previous = inject('previous', () => { })
</script>
<template>
  <table class="cus-table shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg min-w-full divide-y divide-gray-300">
    <thead class="bg-gray-50 border-t-2 border-solid border-gray-800">
      <tr>
        <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 lg:pl-8">
        </th>
        <th v-for="head in spec.head" :key="head" scope="col"
          class="uppercase py-3.5 pl-2 pr-1 text-left text-sm font-semibold text-gray-900 sm:pl-6 lg:pl-8">
          {{ head }}
        </th>
      </tr>
    </thead>
    <tbody class="divide-y divide-gray-200 bg-white">
      <slot name="row">
        <tr @click.self="emit('row', row)" class="even:bg-gray-200 odd:" v-for="(row, index) in rows" :key="row.id">
          <td scope="col" class="py-3 text-sm font-medium text-gray-900 sm:pl-6 lg:pl-8">
            {{ index + 1 }}
          </td>
          <td :key="key" v-for="(key, index) in spec.row"
            class="pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 lg:pl-8">
            {{ row?.[key] }}
          </td>
          <td class="p-2 gap-2 text-sm justify-center font-medium flex items-center text-gray-900"
            v-if="spec.head.map(head => head.toLowerCase()).includes('modify')">
            <Dropdown top="120%" @click.stop="() => { }" v-slot="{ setRef, toggleDropdown }">
              <button type="button" @click="toggleDropdown"
                class="justify-center items-center flex rounded-md border border-gray-300 shadow-sm w-12 h-10 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-indigo-500"
                id="options-menu" aria-haspopup="true" aria-expanded="true">
                <BaseIcon size="20" :path="mdiMenu" />
              </button>
              <div :ref="setRef"
                class="cursor-pointer origin-top-right absolute mb-8 min-w-[8rem] rounded-md shadow-lg bg-gray-200 ring-1 ring-gray ring-opacity-5 z-10">
                <div class="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                  <DropdownBtn v-if="defaultAction" @click.prevent="emit('action:edit', row)">
                    Edit
                  </DropdownBtn>
                  <DropdownBtn v-if="defaultAction" @click.prevent="emit('action:delete', row)">
                    Delete
                  </DropdownBtn>
                  <slot name="actions" :row="row"></slot>
                </div>
              </div>
            </Dropdown>
            <slot :row="row" name="additionalBtns" />
          </td>
        </tr>
      </slot>
      <component v-if="pending" :cols="spec.head.length + 1" :key="num" v-for="num in 25" :is="Fallback" />
    </tbody>
  </table>
  <div v-if="showPagination" class="flex justify-end gap-2">
    <button @click="previous" class="px-4 py-1 border-primary rounded-md border">Previous</button>
    <button @click="next" class="px-4 py-1 border-primary rounded-md border">Next</button>
  </div>
  <slot name="nodata"></slot>
</template>

<style>
.cus-table th:last-of-type {
  /* color: transparent; */
}
</style>