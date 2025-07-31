<script setup lang="ts">
import Form from '@/components/new_form_builder/Form.vue';
import Input from '@/components/new_form_elements/Input.vue';


</script>
<template>
	<Form :inner="false" id="institution-form" class="grid gap-4 grid-cols-3">
		<Input
			label="Institution Name"
			name="institutionName"
			validation="required|max-25"
			:attributes="{
				placeholder: 'Institution Name'
			}"
		/>
		<Input
			label="Tin Number"
			name="tinNumber"
			validation="required|num|max-25"
			:attributes="{
				placeholder: 'Tin Number'
			}"
		/>
		<Input
			label="Email"
			name="email"
			validation="required|email"
			:attributes="{
				placeholder: 'Email'
			}"
		/>
		<Input
			label="Phone"
			name="telephone"
			validation="required|phone"
			:attributes="{
				placeholder: 'Mobile Phone'
			}"
		/>
		<Input
			label="Category"
			name="category"
			validation="required"
			:attributes="{
				placeholder: 'Category'
			}"
		/>
		<p class="font-semibold col-span-3 text-base">Address</p>
		<div class="col-span-3 grid grid-cols-5 gap-4">
			<Input
				label="Country"
				name="country"
				validation="required|max-25"
				:attributes="{
					placeholder: 'Country',
					disabled: true
				}"
				:value="'Ethiopia'"
			/>
			<Input
				label="Region"
				name="state"
				validation="required|max-25"
				:attributes="{
					placeholder: 'Region',
				}"
			/>
			<Input
				label="City"
				name="address3"
				validation="required|max-25"
				:attributes="{
					placeholder: 'CIty',
				}"
			/>
			<Input
				label="Sub City"
				name="address2"
				validation="required|max-25"
				:attributes="{
					placeholder: 'Sub City',
				}"
			/>
			<Input
				label="Woreda"
				name="address1"
				validation="required|max-25"
				:attributes="{
					placeholder: 'Woreda',
				}"
			/>
		</div>
	</Form>
</template>