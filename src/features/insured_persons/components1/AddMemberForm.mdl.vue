<script setup lang="ts">
import icons from '@/utils/icons';
import InsuredMemberForm from '../form/InsuredMemberForm.vue';
import { closeModal } from '@customizer/modal-x'
import Button from '@/components/Button.vue';
import { useForm } from '@/components/new_form_builder/useForm';

const props = defineProps({
	data: {
		type: Object
	}
})

const { submit } = useForm('members-form')
</script>

<template>
	<div class="grid place-items-center p-4 bg-dark/90 w-full min-h-full">
		<div class="w-[45rem] flex flex-col rounded-md h-[35rem] bg-white shadow-lg">
			<div class="flex px-4 p-3 pr-4 justify-between border-b items-center">
				<p class="font-semibold text-lg">Add Member</p>
				<button @click="closeModal()"><i v-html="icons.close" /></button>
			</div>
			<div class="flex-1 p-6 overflow-auto">
				<InsuredMemberForm :inner-validate="false" />
			</div>
			<div class="p-3 grid grid-cols-1 border-t">
				<Button @click.prevent="submit?.(console.log)" size="lg" type="primary">
					Add Member
				</Button>
			</div>
		</div>
	</div>
</template>