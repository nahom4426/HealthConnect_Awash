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
    // Keep the stack short: the oldest goes when a 4th arrives
    if (toasts.value.length > 3) toasts.value.splice(0, toasts.value.length - 3)
  }

  function removeToast(id) {
    const idx = toasts.value.findIndex(el => el.id == id)
    if (idx !== -1) toasts.value.splice(idx, 1)
    
  }

  return { toasts, addToast, removeToast }
})
