import { ref } from 'vue'
import { defineStore } from 'pinia'

function* getId() {
  let id = 0;
  while (true) { 
    yield `${++id}`
  }
}

const id = getId()

export const useToast = defineStore('toast', () => {

  const toasts = ref([])

  function addToast(toast) {
    // Several failing requests often report the same message — show it once
    const duplicate = toasts.value.some(
      (t) => t.toast?.message === toast?.message && t.toast?.type === toast?.type
    )
    if (duplicate) return
    toasts.value.push({ id: id.next().value, toast })
  }

  function removeToast(id) {
    toasts.value.splice(toasts.value.findIndex(el => el.id == id), 1)
    
  }

  return { toasts, addToast, removeToast }
})
