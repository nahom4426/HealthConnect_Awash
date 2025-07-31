import ActiveContracts from "@/features/provider_contracts/pages/ActiveContracts.vue";
import CreateContract from "@/features/provider_contracts/pages/CreateContract.vue";
import SuspendedContracts from "@/features/provider_contracts/pages/SuspendedContracts.vue";

export default [
	{
		path: '/create_contract',
		name: 'Create Contract',
		component: CreateContract
	},
	{
		path: '/active_contracts',
		name: 'Active Contracts',
		component: ActiveContracts
	},
	{
		path: '/suspended_contracts',
		name: 'suspended contracts',
		component: SuspendedContracts
	}
]