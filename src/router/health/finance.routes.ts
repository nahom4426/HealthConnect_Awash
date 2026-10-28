import ClaimPayment from "@/features/health/finance/pages/ClaimPayment.vue";
import OtherPayments from "@/features/health/finance/pages/OtherPayments.vue";
import PaidClaims from "@/features/health/finance/pages/PaidClaims.vue";
import PremiumReceipt from "@/features/health/finance/pages/PremiumReceipt.vue";
import ExcelDailyReport from "@/features/health/finance/pages/ExcelDailyReport.vue";

export default [
	{
		path: '/premium_receipt',
		name: 'premium receipt',
		component: PremiumReceipt,
		meta: { requiresAuth: true, permissions: ["Finance"] },
	},
	{
		path: '/claim_payment',
		name: 'claim payment',
		component: ClaimPayment,
		meta: { requiresAuth: true, permissions: ["Finance", "Read_claims"] },
	},
	{
		path: '/paid_claims',
		name: 'paid claims',
		component: PaidClaims,
		meta: { requiresAuth: true, permissions: ["Finance", "Read_claims"] },
	},
	{
		path: '/other_payments',
		name: 'other payments',
		component: OtherPayments,
		meta: { requiresAuth: true, permissions: ["Finance"] },
	},
	{
		path: '/excel_daily_report',
		name: 'excel daily report',
		component: ExcelDailyReport,
		meta: { requiresAuth: true, permissions: ["Finance"] },
	}
]