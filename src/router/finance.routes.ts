import ClaimPayment from "@/features/finance/pages/ClaimPayment.vue";
import OtherPayments from "@/features/finance/pages/OtherPayments.vue";
import PaidClaims from "@/features/finance/pages/PaidClaims.vue";
import PremiumReceipt from "@/features/finance/pages/PremiumReceipt.vue";

export default [
	{
		path: '/premium_receipt',
		name: 'premium receipt',
		component: PremiumReceipt
	},
	{
		path: '/claim_payment',
		name: 'claim payment',
		component: ClaimPayment
	},
	{
		path: '/paid_claims',
		name: 'paid claims',
		component: PaidClaims
	},
	{
		path: '/other_payments',
		name: 'other payments',
		component: OtherPayments
	}
]