<script setup lang="ts">
import { closeModal } from '@customizer/modal-x';
import Button from './Button.vue';
import ModalParent from './ModalParent.vue';
import Form from './new_form_builder/Form.vue';
import Textarea from './new_form_elements/Textarea.vue';
import NewFormParent from './NewFormParent.vue';
import { ref } from 'vue';
import type { PropType } from 'vue';

const props = defineProps({
	data: {
		type: Object as PropType<{title: string;}>
	}
})

const remark = ref('');

function handleAction(action: 'PROCESSED' | 'REJECTED') {
	const remarkValue = remark.value?.trim() || undefined;
	closeModal({ action, comment: remarkValue });
}
</script>
 
<template>
	<ModalParent>
		<NewFormParent class="w-[25rem]" :title="data?.title || 'Process Claim'" size="sm" >
			<div class="flex flex-col gap-4">
				<div>
					<label class="block text-sm text-gray-600 mb-2">Remark (optional)</label>
					<textarea 
						v-model="remark" 
						rows="3" 
						class="w-full p-3 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-transparent" 
						placeholder="Add a remark (optional)"
					></textarea>
				</div>
				
				<div class="flex items-center justify-end gap-3 pt-2 border-t">
					<Button @click="handleAction('REJECTED')" type="danger">
						Reject
					</Button>
					<Button @click="handleAction('PROCESSED')" type="primary">
						Process
					</Button>
				</div>
			</div>
		</NewFormParent>
	</ModalParent>
</template>