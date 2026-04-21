import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useNotifications = defineStore("notification", () => {
	const notifications = ref([])

	function setNotifications(message) {
		try {
			const json = JSON.parse(message.body);
			let notis = Array.isArray(json) ? json : [json]
			const ids = notifications.value.map(el => el.notificationUuid)
			notis = notis.filter(el => !ids.includes(el.notificationUuid))
			notifications.value = [
				...notifications.value,
				...notis
			]
		} catch(err) {
			console.error(err.message)
		}
	}
	function seen(id) {
		const idx = notifications.value.findIndex(el => el.notificationUuid == id)
		if(idx > -1) {
			notifications.value.splice(idx, 1, {
				...notifications.value[idx],
				seen: true
			})
		}
	}

	return {
		notifications,
		seen,
		setNotifications
	}
})