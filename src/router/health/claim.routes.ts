const CashClaim = () => import("@/features/health/claim/pages/CashClaim.vue");
const AddManualServices = () => import("@/features/health/claim/pages/manual_services/AddManualServices.vue");
const CashServices = () => import("@/features/health/claim/pages/cash_services/CashServices.vue");
const CompletedClaimss = () => import("@/features/health/claim/pages/completed_claims/CompletedClaims.vue");
const CreditClaimsIndex = () => import("@/features/health/claim/pages/CreditClaimIndex.vue");
const ProcessClaims = () => import("@/features/health/claim/pages/process_claim/ProcessClaim.vue");
const ProcessClaimIndex = () => import("@/features/health/claim/pages/ProcessClaimIndex.vue");
const CreditClaim = () => import("@/features/health/claim/pages/credit_claim/CreditClaim.vue");
const CreditClaimDetail = () => import("@/features/health/claim/pages/credit_claim/CreditClaimDetail.vue");
const ProcessClaimDetail = () => import("@/features/health/claim/pages/process_claim/ProcessClaimDetail.vue");
const ProcessClaimIndividualDetail = () => import("@/features/health/claim/pages/process_claim/ProcessClaimIndividualDetail.vue");
const ProcessClaimDetailIndex = () => import("@/features/health/claim/pages/process_claim/ProcessClaimDetailIndex.vue");
const ProcessCashClaimDetail = () => import("@/features/health/claim/pages/process_claim/ProcessCashClaimDetail.vue");
// import verifyClaimDetail from "@/features/health/claim/pages/process_claim/verifyClaimDetail.vue";
// import verifyClaimIndividualDetail from "@/features/health/claim/pages/process_claim/verifyClaimIndividualDetail.vue";
// import verifyClaimDetailIndex from "@/features/health/claim/pages/process_claim/verifyClaimDetailIndex.vue";
// import verifyCashClaimDetail from "@/features/health/claim/pages/process_claim/verifyCashClaimDetail.vue";
const ApproveLevel1ClaimIndex = () => import("@/features/health/claim/pages/VerifyClaimIndex.vue");
const ApproveLevel1Claim = () => import("@/features/health/claim/pages/verify_claim/VerifyClaim.vue");
const ApproveLevel1ClaimDetail = () => import("@/features/health/claim/pages/verify_claim/VerifyClaimDeail.vue");
const ApproveLevel1ClaimIndividualDetail = () => import("@/features/health/claim/pages/verify_claim/VerifyClaimIndividualDetail.vue");
import { RouterView } from "vue-router";
const ApproveClaims = () => import("@/features/health/claim/pages/approve_claim/ApproveClaims.vue");
const ApproveClaimDetail = () => import("@/features/health/claim/pages/approve_claim/ApproveClaimDetail.vue");
const ApproveClaimIndividualDetail = () => import("@/features/health/claim/pages/approve_claim/ApproveClaimIndividualDetail.vue");
const AuthorizeClaims = () => import("@/features/health/claim/pages/authorize_claims/AuthorizeClaims.vue");
const AuthorizeClaimsDetail = () => import("@/features/health/claim/pages/authorize_claims/AuthorizeClaimsDetail.vue");
const AuthorizeClaimIndividualDetail = () => import("@/features/health/claim/pages/authorize_claims/AuthorizeClaimIndividualDetail.vue");
const CompletedClaimsDetail = () => import("@/features/health/claim/pages/completed_claims/CompletedClaimsDetail.vue");
const CompletedClaimsIndividualDetail = () => import("@/features/health/claim/pages/completed_claims/CompletedClaimsIndividualDetail.vue");
const ClaimLevelLimits = () => import("@/features/health/claim/pages/ClaimLevelLimits.vue");
const CreateCashClaims = () => import("@/features/health/claim/pages/create_cash_claim/pages/createCashClaims.vue");
const RejectClaimDetailIndex = () => import("@/features/health/claim/pages/reject_claim/RejectClaimDetailIndex.vue");
const RejectClaimDetail = () => import("@/features/health/claim/pages/reject_claim/RejectClaimDetail.vue");
const RejectClaimIndividualDetail = () => import("@/features/health/claim/pages/reject_claim/RejectClaimIndividualDetail.vue");
const RejectClaim = () => import("@/features/health/claim/pages/reject_claim/RejectClaim.vue");
const verifyClaimDetailIndex = () => import("@/features/health/claim/pages/Verify Claim/VerifyClaimDetailIndex.vue");
const verifyClaimDetail = () => import("@/features/health/claim/pages/Verify Claim/VerifyClaimDetail.vue");
const verifyClaimIndividualDetail = () => import("@/features/health/claim/pages/Verify Claim/VerifyClaimIndividualDetail.vue");
const verifyClaim = () => import("@/features/health/claim/pages/Verify Claim/VerifyClaim.vue");
const FieldUpdateLogs = () => import("@/features/health/claim/pages/FieldUpdateLogs.vue");
const PaidClaims = () => import("@/features/health/claim/pages/completed_claims/PaidClaims.vue");

export default [
  {
    path: "/cash_claims",
    name: "Cash Services",
    component: CashClaim,
    meta: { requiresAuth: true, permissions: ["Cash Services"] },
  },
  {
    path: "/cash_claims/manual",
    name: "Add Services Manually",
    component: AddManualServices,
    meta: { requiresAuth: true, permissions: ["Cash Services"] },
  },
  {
    path: "/create_cash_claims",
    name: "Create Cash Claims",
    component: CreateCashClaims,
    meta: { requiresAuth: true, permissions: ["Create Cash Claims"] },
  },
  {
    path: "/create_credit_claims",
    name: "Create Credit Claims",
    component: CreateCashClaims,
    meta: { requiresAuth: true, permissions: ["Credit Services"], serviceType: "CREDIT" },
  },
  {
    path: "/cash_services",
    name: "Cash Service",
    component: CashServices,
    meta: { requiresAuth: true, permissions: ["Cash Services"] },
  },
  {
    path: "/credit_claims",
    component: CreditClaimsIndex,
    meta: { requiresAuth: true, permissions: ["Credit Services"] },
    children: [
      {
        path: "",
        name: "Credit claims",
        component: CreditClaim,
      },
      {
        path: "manual",
        name: "Add Credit Services",
        component: AddManualServices,
        meta: { serviceType: "CREDIT" },
      },
      {
        path: "detail/:claimUuid",
        name: "Claim Detail",
        component: CreditClaimDetail,
      },
    ],
  },
  {
    path: "/process_claims",
    component: ProcessClaimIndex,
    meta: { requiresAuth: true, permissions: ["Process Claims"] },
    children: [
      {
        path: "",
        name: "Process Claims",
        component: ProcessClaims,
      },
      {
        path: "detail/:claimUuid", // Changed parameter name to avoid duplication
        component: ProcessClaimDetailIndex,
        children: [
          {
            path: "",
            name: "Process Claim Batch Detail",
            component: ProcessClaimDetail,
          },
          {
            path: "individual/:claimUuids",
            name: "Process Individual Detail",
            component: ProcessClaimIndividualDetail,
          },
        ],
      },
      {
        path: "cash_detail/:batchCode",
        component: ProcessClaimDetailIndex,
        children: [
          {
            path: "",
            name: "Process Cash Claim Batch Detail",
            component: ProcessCashClaimDetail,
          },
          {
            path: "individual/:claimUuids",
            name: "Process Cash Individual Detail",
            component: ProcessClaimIndividualDetail,
          },
        ],
      },
    ],
  },
  {
    path: "/verify_claims",
    component: verifyClaimDetailIndex,
    meta: { requiresAuth: true, permissions: ["Read_claims"] },
    children: [
      {
        path: "",
        name: "Verify Claims",
        component: verifyClaim,
      },
      {
        path: "detail/:claimUuid", // Changed parameter name to avoid duplication
        component: verifyClaimDetailIndex,
        children: [
          {
            path: "",
            name: "Verify Claim Batch Detail",
            component: verifyClaimDetail,
          },
          {
            path: "individual/:claimUuids",
            name: "Verify Individual Detail",
            component: verifyClaimIndividualDetail,
          },
        ],
      },
      {
        path: "cash_detail/:batchCode",
        component: ProcessClaimDetailIndex,
        children: [
          {
            path: "",
            name: "Verify Cash Claim Batch Detail",
            component: ProcessCashClaimDetail,
          },
          {
            path: "individual/:claimUuids",
            name: "Verify Cash Individual Detail",
            component: ProcessClaimIndividualDetail,
          },
        ],
      },
    ],
  },
  {
    path: "/reject_claims",
    component: RejectClaimDetailIndex,
    meta: { requiresAuth: true, permissions: ["Read_claims"] },
    children: [
      {
        path: "",
        name: "Rejected Claims",
        component: RejectClaim,
      },
      {
        path: "detail/:claimUuid", // Changed parameter name to avoid duplication
        component: RejectClaimDetailIndex,
        children: [
          {
            path: "",
            name: "Reject Claim Batch Detail",
            component: RejectClaimDetail,
          },
          {
            path: "individual/:claimUuids",
            name: "Reject Individual Detail",
            component: RejectClaimIndividualDetail,
          },
        ],
      },
      {
        path: "cash_detail/:batchCode",
        component: ProcessClaimDetailIndex,
        children: [
          {
            path: "",
            name: "Reject Cash Claim Batch Detail",
            component: ProcessCashClaimDetail,
          },
          {
            path: "individual/:claimUuids",
            name: "Reject Cash Individual Detail",
            component: ProcessClaimIndividualDetail,
          },
        ],
      },
    ],
  },
  {
    path: "/approveL1_claims",
    component: ApproveLevel1ClaimIndex,
    meta: { requiresAuth: true, permissions: ["Check_claim"] },
    children: [
      {
        path: "",
        name: "Approve Level 1 claims",
        component: ApproveLevel1Claim,
      },
      {
        path: "detail/:claimUuid", // Changed parameter name to avoid duplication
        component: ProcessClaimDetailIndex,
        children: [
          {
            path: "",
            name: "Approve Level 1 Claim Batch Detail",
            component: ApproveLevel1ClaimDetail,
          },
          {
            path: "individual/:claimUuids",
            name: "Approve Level 1 Individual Detail",
            component: ApproveLevel1ClaimIndividualDetail,
          },
        ],
      },
    ],
  },
  {
    path: "/approve_claims",
    component: RouterView,
    meta: { requiresAuth: true, permissions: ["Read_claims"] },
    children: [
      {
        path: "",
        name: "Approve Claims",
        component: ApproveClaims,
      },
      {
        path: "detail/:claimUuid", // Changed parameter name to avoid duplication
        component: RouterView,
        children: [
          {
            path: "",
            name: "Approve Claim Batch Detail",
            component: ApproveClaimDetail,
          },
          {
            path: "individual/:claimUuids",
            name: "Approve Individual Detail",
            component: ApproveClaimIndividualDetail,
          },
        ],
      },
    ],
  },
  {
    path: "/authorize_claims",
    component: RouterView,
    meta: { requiresAuth: true, permissions: ["Read_claims"] },
    children: [
      {
        path: "",
        name: "Authorize Claims",
        component: AuthorizeClaims,
      },
      {
        path: "detail/:claimUuid", // Changed parameter name to avoid duplication
        component: RouterView,
        children: [
          {
            path: "",
            name: "Authorized Claim Batch Detail",
            component: AuthorizeClaimsDetail
          },
          {
            path: "individual/:claimUuids", // Fixed parameter name (was claimUuids)
            name: "Authorized Individual Detail",
            component: AuthorizeClaimIndividualDetail,
          },
        ],
      },
    ],
  },
  {
    path: "/paid_claims",
    component: RouterView,
    meta: { requiresAuth: true, permissions: ["Paid Claims"] },
    children: [
      {
        path: "",
        name: "Paid Claims", // Moved name to child with empty path
        component: PaidClaims,
      }
    ],
  },
  {
    path: "/completed_claims",
    component: RouterView,
    meta: { requiresAuth: true, permissions: ["Read_claims"] },
    children: [
      {
        path: '',
        name: "Completed Claims",
        component: CompletedClaimss
      },
      {
        path: 'detail/:claimUuid', // Changed parameter name to avoid duplication
        component: RouterView,
        children: [
          {
            path: '',
            name: "Completed Claim Batch Detail",
            component: CompletedClaimsDetail
          },
          {
            path: "individual/:claimUuids",
            name: "Completed Individual Detail",
            component: CompletedClaimsIndividualDetail,
          }
        ]
      }
    ]
  },
  {
    path: '/claim-level-limits',
    name: 'Claim Level Limits',
    component: ClaimLevelLimits,
    meta: { requiresAuth: true, permissions: ["Read_claims"] },
  },
  {
    path: "/field-update-logs",
    name: "Field Update Logs",
    component: FieldUpdateLogs,
    meta: { requiresAuth: true, permissions: ["Read_claims"] },
  },
];