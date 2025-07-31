<script setup lang="ts">
import { closeModal } from '@customizer/modal-x';
import Button from './Button.vue';
import ModalParent from './ModalParent.vue';
import Form from './new_form_builder/Form.vue';
import Textarea from './new_form_elements/Textarea.vue';
import NewFormParent from './NewFormParent.vue';
import type { PropType } from 'vue';
const props = defineProps({
	data: {
		type: Object as PropType<{title: string;}>
	}
})
</script>
 
<template>
	<ModalParent>
		<NewFormParent class="w-[20rem]" :title="data?.title || 'Add Remark'" size="sm" >
			<Form v-slot="{ submit }" id="comment-form" class="flex flex-col gap-4" >
				<Textarea
					validation="required"
					name="comment" 
					:attributes="{
						placeholder: 'Add a Remark'
					}"
				/>
				<Button @click.prevent="submit(({values}: any) => closeModal(values.comment))" type="primary" >
					Add Remark
				</Button>
			</Form>
		</NewFormParent>
	</ModalParent>
</template>