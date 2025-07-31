import { ref, onUnmounted } from "vue"

export function useSignal() {
	let controller = new AbortController()
	const sig = ref(controller?.signal)

	onUnmounted(() => {
		controller.abort()
	})

	return {signal: sig, cancel: controller.abort}
}