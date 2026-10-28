import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Institution } from './institutionsStore'

export const useSingleInstitution = defineStore('singleInstitutionStore', () => {
	const institutions = ref<Institution[]>([])

	function add(data: Institution) {
		institutions.value.push(data)
	}
	
	function get(id: string) {
		return institutions.value.find(el => el.institutionUuid == id)
	} 
	return {
		add,
		get,
		institutions
	}
})