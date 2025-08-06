<script setup>
  import { onMounted, ref } from 'vue';
import BaseIcon from './base/BaseIcon.vue';
import { mdiCheckAll, mdiSend } from '@mdi/js';
import { genId, secondDateFormat } from '@/util/utils';

  const textarea = ref()
  const message = ref('')

  function oninput() {
    textarea.value.style.height = '5px'
    textarea.value.style.height = `${textarea.value.scrollHeight}px`
  }

  onMounted(() => {
    console.log(textarea.value)
    textarea.value.style.maxHeight = `160px`
    // textarea.value.style.height = `40px`
    textarea.value.addEventListener('input', oninput)
  })

  const messages = ref([])

  function send() {
    messages.value.unshift({
      id: genId.next().value,
      message: message.value
    })
    message.value = ''
    textarea.value.focus()
		textarea.value.style.height = '2.5rem'
  }
</script>

<template>
  <div class="overflow-hidden h-full w-full chat-grid justify-between">
      <div class="border-b">

      </div>
      <div class="text-black bg-gray-200 flex flex-col-reverse gap-3 py-1 overflow-y-auto">
        <div v-for="message in messages" :key="message.id" class="items-end flex-col w-full flex justify-end">
          <div class="px-1 flex gap-1 items-end justify-end">
            <div class="bg-primary shadow-md text-white px-4 py-1 rounded-md rounded-br-none max-w-[80%] whitespace-pre-wrap">
              <p class="flex text-sm">{{message.message}}</p>
            </div>
            <div class="shadow-md w-8 h-8 rounded-full bg-gray-300"></div>
          </div>
          <div class="flex justify-end items-center">
            <p class="text-[10px] px-2">{{ secondDateFormat(new Date(), true) }}</p>
            <BaseIcon :path="mdiCheckAll" />
          </div>
        </div>
      </div>
      <div class="border-t flex ">
				<textarea v-model="message" id="chat_box_textarea" ref='textarea' class='text-sm text-gray-800 border border-gray-300 focus:border-none overflow-hidden h-10 bg-secondary resize-none rounded-sm p-2 w-full placeholder:text-primary text-primary' placeholder='write something...' />
        <div class="w-12 h-10 text-black border-l self-end grid place-items-center">
          <button @click="send">
            <BaseIcon :path="mdiSend" :size="20" />
          </button>
        </div>
      </div>
    </div>
</template>

<style>
  #chat_box_textarea {
    border: none
  }
  
  #chat_box_textarea:focus {
    outline: none;
    box-shadow: none;
  }

  #chat_box_textarea:focus {
    outline: none;
    box-shadow: none;
    outline-offset: 0;
  }
</style>