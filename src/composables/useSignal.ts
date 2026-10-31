import { ref } from "vue"

export function useSignal() {
  let controller = new AbortController()
  const sig = ref(controller?.signal)

  return {
    signal: sig, 
    cancel: () => controller.abort()
  }
}