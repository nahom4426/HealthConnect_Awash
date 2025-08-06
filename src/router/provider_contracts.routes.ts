
import ActiveContracts from "@/features/provider_contracts/pages/ActiveContracts.vue";
import ActiveProviderContractIndex from "@/features/provider_contracts/pages/ActiveProviderContractIndex.vue";
import CreateContract from "@/features/provider_contracts/pages/CreateContract.vue";
import PendingContracts from "@/features/provider_contracts/pages/PendingContracts.vue";
import ProviderContractIndex from "@/features/provider_contracts/pages/ProviderContractIndex.vue";
import SuspendedContracts from "@/features/provider_contracts/pages/SuspendedContracts.vue";
import service from "@/features/provider_contracts/service/pages/sevice.vue";
export default [
	{
		path: '/create_contract',
		name: 'Create Contract',
		component: ProviderContractIndex,
		children: [
			{
				path: '',
				name: 'Create Contracts', // Adjusted name for clarity
				component: PendingContracts,
			},
			{
				path: 'new', // Removed leading slash
				name: 'Create New Contracts', // Adjusted name for clarity
				component: CreateContract,
			}
		]
	},
	{
		path: '/active_contract',
		name: 'Active Contract Index', // Changed name to avoid conflict
		component: ActiveProviderContractIndex,
		children: [
			{
				path: '',
				name: 'Active Contracts', // Changed name to avoid conflict
				component: ActiveContracts,
			},
			{
				path: 'services/:id',
				name: 'Provider Contract Services',
				component: service,
				props: true,
			}
		]
	},
	{
		path: '/active_contracts',
		name: 'Active Contracts Standalone', // Renamed for clarity
		component: ActiveContracts
	},
	{
		path: '/suspended_contracts',
		name: 'Suspended Contracts', // Adjusted name for clarity
		component: SuspendedContracts
	},
	{
		path: '/pending_contracts',
		name: 'Pending Contracts', // Adjusted name for clarity
		component: PendingContracts
	}
];