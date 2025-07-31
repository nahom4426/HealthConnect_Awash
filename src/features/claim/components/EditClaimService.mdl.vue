<script setup lang="ts">
import { useApiRequest } from '@/composables/useApiRequest';
import { getPackageByInsuredId } from '../api/packagesApi';
import ModalParent from '@/components/ModalParent.vue';
import NewFormParent from '@/components/NewFormParent.vue';
import ClaimServicesForm from './form/ClaimServicesForm.vue';
import Button from '@/components/Button.vue';
import { useForm } from '@/components/new_form_builder/useForm';
import type { PropType } from 'vue';
import { createCashCredit, updateCashCredit } from '../api/cashCreditApi';
import { toasted } from '@/utils/utils';
import { useSearchedCashCreditInsuredByInstitutionStore, type CashCreditInsured, type CashService } from '../store/searchCashCreditInsuredInstitutionStore';

interface Data {
	hospital: string,
	cashCreditUuid: string,
	insuredPersonUuid: string,
	institutionUuid: string,
	dependantUuid: string,
	cashServices: CashService[]
}

const props = defineProps({
	data: {
		type: Object as PropType<Data>,
		required: true
	}
})

const cashCreditInsuredStore = useSearchedCashCreditInsuredByInstitutionStore();

const servicesReq = useApiRequest()
servicesReq.send(
	() => getPackageByInsuredId(props.data.insuredPersonUuid),
	res => {
		console.log(servicesReq.response.value);
	}
)

const { submit } = useForm('service-form', true, 'main-service')

const cashClaimReq = useApiRequest()
function addCashClaim({values, reset}: any) {
	if(cashClaimReq.pending.value) return

	cashClaimReq.send(
		() => updateCashCredit(props.data.cashCreditUuid, {
			cashCredit: {
				...props.data,
				cashServices: undefined,
				hospital: values.hospital
			},
			cashServices: values.cashServices
		}),
		res => {
			if(res.success) {
				toasted(res.success, 'Successfully Created',)
				cashCreditInsuredStore.update(props.data.cashCreditUuid, {
					...props.data as unknown as CashCreditInsured,
					cashServiceResponses: props.data.cashServices,
					hospital: values.hospital,
					totalAmount: values.cashServices.reduce((sum: number, el: any) => sum += parseInt(el.amount) , 0)
				})
				reset()
			}
		}
	)
}
</script>

<template>
	<ModalParent>
		<NewFormParent size="lg" title="Update Services" >
			<ClaimServicesForm
				:service="{
					hospital: data.hospital,
					cashService: data.cashServices
				}"
			  :servicesPending="servicesReq.pending.value"
				:services="servicesReq.response.value"
			/>
			<template #bottom >
				<div class="p-2" >
					<Button :pending="cashClaimReq.pending.value" @click="submit(addCashClaim)" class="w-full" size="lg" type="primary" > 
						Update Services
					</Button>
				</div>
			</template>
		</NewFormParent>
	</ModalParent>
</template>