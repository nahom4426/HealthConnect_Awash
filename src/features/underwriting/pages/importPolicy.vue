<script setup lang="ts">
import Button from '@/components/Button.vue';
import { useForm } from '@/components/new_form_builder/useForm';
import InstitutionForm from '@/features/institutions/form/InstitutionForm.vue';

const { submit } = useForm('institution-form')
</script>
<template>
	<div class="min-h-full w-2/3 mx-auto shadow flex flex-col gap-4 bg-white">
		<p class="font-medium p-4 text-lg border-b pb-2">Add Institution</p>
		<InstitutionForm class="px-4" />
		<div class="px-4 py-2 flex mt-auto">
			<Button @click="submit" class="w-full" type="primary">
				Add institution
			</Button>
		</div>
	</div>
</template>