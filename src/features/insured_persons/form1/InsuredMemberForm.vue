<script setup lang="ts">
import Form from '@/components/new_form_builder/Form.vue';
import {Input, Select} from '@/components/new_form_elements';
import { Status, type InsuredPerson } from '@/types/interface';
import { Gender } from '@/utils/utils';
import type { PropType } from 'vue';

const props = defineProps({
	innerValidate: {
		type: Boolean,
		default: true,
	},
	member: Object as PropType<InsuredPerson>
})

</script>
<template>
	<Form :inner="innerValidate" id="members-form" class="member-grid gap-4">
		<Select
			label="Title"
			name="title"
			:options="['Mr.', 'Mrs.', 'Ms.']"
			validation="required"
			:value="member?.title"
			:attributes="{
				type: 'text',
				placeholder: 'Mr.'
			}"
		/>
		<Input
			label='First Name'
			name='firstName'
			:value="member?.firstName"
			validation="required|max-25"
			:attributes="{
				placeholder: 'Enter First Name'
			}"
		/>
		<Input
			label='First Name'
			name='fatherName'
			:value="member?.fatherName"
			validation="required|max-25"
			:attributes="{
				placeholder: 'Father Name'
			}"
		/>
		<Input
			label='First Name'
			name='grandFatherName'
			:value="member?.grandFatherName"
			validation="required|max-25"
			:attributes="{
				placeholder: 'Grand Father Name'
			}"
		/>
		<div class="col-span-4 grid grid-cols-4 gap-4">
			<Input
				label='Phone'
				name='phone'
				:value="member?.phone"
				validation="required|phone"
				:attributes="{
					placeholder: 'Phone'
				}"
			/>
			<Input
				label='Birth Date'
				name='birthDate'
				:value="member?.birthDate"
				validation="required"
				:attributes="{
					type: 'date',
					placeholder: 'Phone'
				}"
			/>
			<Input
				label='Email'
				name='email'
				:value="member?.email"
				validation="required|email"
				:attributes="{
					placeholder: 'Email'
				}"
			/>
			<Select
				label="Gender"
				name="gender"
				:options="Object.values(Gender)"
				validation="required"
				:value="member?.gender"
				:attributes="{
					type: 'text',
					placeholder: 'Gender'
				}"
			/>
		</div>
		<p class="font-semibold col-span-4 text-base">Address</p>
		<div class="col-span-4 grid grid-cols-5 gap-4">
			<Input
				label="Country"
				name="country"
				validation="required|max-25"
				:value="member?.country || 'Ethiopia'"
				:attributes="{
					placeholder: 'Country',
					disabled: true
				}"
			/>
			<Input
				label="Region"
				name="state"
				validation="required|max-25"
				:attributes="{
					placeholder: 'Region',
				}"
				:value="member?.state"
			/>
			<Input
				label="City"
				name="address3"
				validation="required|max-25"
				:attributes="{
					placeholder: 'City',
				}"
				:value="member?.address3"
			/>
			<Input
				label="Sub City"
				name="address2"
				validation="required|max-25"
				:attributes="{
					placeholder: 'Sub City',
				}"
				:value="member?.address2"
			/>
			<Input
				label="Woreda"
				name="address1"
				validation="required|max-25"
				:attributes="{
					placeholder: 'Woreda',
				}"
				:value="member?.address1"
			/>
		</div>
		<p class="font-semibold col-span-4 text-base">Occupation</p>
		<div class="col-span-4 gap-4 grid grid-cols-3">
			<Input
				label="Position"
				name="position"
				validation="required|max-25"
				:attributes="{
					placeholder: 'Position',
				}"
				:value="member?.position"
			/>
			<Input
				label="Branch Office"
				name="branchOffice"
				validation="required|max-25"
				:attributes="{
					placeholder: 'Branch Office',
				}"
				:value="member?.branchOffice"
			/>
			<Input
				label="Insurance Id"
				name="insuranceId"
				validation="required|max-25"
				:attributes="{
					placeholder: 'Insurance Id',
				}"
				:value="member?.insuranceId"
			/>
		</div>
		<div class="col-span-4 gap-4 grid grid-cols-3">
			<Select
				label="Status"
				:options="[Status.ACTIVE, Status.PENDING, Status.SUSPENDED]"
				name='status'
				:attributes="{
					placeholder: 'Status',
					type: 'text'
				}"
				:value="member?.state || Status.ACTIVE"
				validation="required"
			/>
			<div></div>
		</div>
	</Form>
</template>
<style>
	.member-grid {
		display: grid;
		grid-template-columns: 5rem repeat(3, 1fr)
	}
</style>