import CashClaim from "@/features/claim/pages/CashClaim.vue";
import CashServices from "@/features/claim/pages/cash_services/CashServices.vue";
import CompletedClaimss from "@/features/claim/pages/completed_claims/CompletedClaims.vue";
import CreditClaimsIndex from "@/features/claim/pages/CreditClaimIndex.vue";
import ProcessClaims from "@/features/claim/pages/process_claim/ProcessClaim.vue";
import ProcessClaimIndex from "@/features/claim/pages/ProcessClaimIndex.vue";
import CreditClaim from "@/features/claim/pages/credit_claim/CreditClaim.vue";
import CreditClaimDetail from "@/features/claim/pages/credit_claim/CreditClaimDetail.vue";
import ProcessClaimDetail from "@/features/claim/pages/process_claim/ProcessClaimDetail.vue";
import ProcessClaimIndividualDetail from "@/features/claim/pages/process_claim/ProcessClaimIndividualDetail.vue";
import ProcessClaimDetailIndex from "@/features/claim/pages/process_claim/ProcessClaimDetailIndex.vue";
import ProcessCashClaimDetail from "@/features/claim/pages/process_claim/ProcessCashClaimDetail.vue";
// import verifyClaimDetail from "@/features/claim/pages/process_claim/verifyClaimDetail.vue";
// import verifyClaimIndividualDetail from "@/features/claim/pages/process_claim/verifyClaimIndividualDetail.vue";
// import verifyClaimDetailIndex from "@/features/claim/pages/process_claim/verifyClaimDetailIndex.vue";
// import verifyCashClaimDetail from "@/features/claim/pages/process_claim/verifyCashClaimDetail.vue";
import ApproveLevel1ClaimIndex from "@/features/claim/pages/VerifyClaimIndex.vue";
import ApproveLevel1Claim from "@/features/claim/pages/verify_claim/VerifyClaim.vue";
import ApproveLevel1ClaimDetail from "@/features/claim/pages/verify_claim/VerifyClaimDeail.vue";
import ApproveLevel1ClaimIndividualDetail from "@/features/claim/pages/verify_claim/VerifyClaimIndividualDetail.vue";
import { RouterView } from "vue-router";
import ApproveClaims from "@/features/claim/pages/approve_claim/ApproveClaims.vue";
import ApproveClaimDetail from "@/features/claim/pages/approve_claim/ApproveClaimDetail.vue";
import ApproveClaimIndividualDetail from "@/features/claim/pages/approve_claim/ApproveClaimIndividualDetail.vue";
import AuthorizeClaims from "@/features/claim/pages/authorize_claims/AuthorizeClaims.vue";
import AuthorizeClaimsDetail from "@/features/claim/pages/authorize_claims/AuthorizeClaimsDetail.vue";
import AuthorizeClaimIndividualDetail from "@/features/claim/pages/authorize_claims/AuthorizeClaimIndividualDetail.vue";
import CompletedClaimsDetail from "@/features/claim/pages/completed_claims/CompletedClaimsDetail.vue";
import CompletedClaimsIndividualDetail from "@/features/claim/pages/completed_claims/CompletedClaimsIndividualDetail.vue";
import ClaimLevelLimits from "@/features/claim/pages/ClaimLevelLimits.vue";
import CreateCashClaims from "@/features/claim/pages/create_cash_claim/pages/createCashClaims.vue";
import RejectClaimDetailIndex from "@/features/claim/pages/reject_claim/RejectClaimDetailIndex.vue";
import RejectClaimDetail from "@/features/claim/pages/reject_claim/RejectClaimDetail.vue";
import RejectClaimIndividualDetail from "@/features/claim/pages/reject_claim/RejectClaimIndividualDetail.vue";
import RejectClaim from "@/features/claim/pages/reject_claim/RejectClaim.vue";
import verifyClaimDetailIndex from "@/features/claim/pages/Verify Claim/VerifyClaimDetailIndex.vue";
import verifyClaimDetail from "@/features/claim/pages/Verify Claim/VerifyClaimDetail.vue";
import verifyClaimIndividualDetail from "@/features/claim/pages/Verify Claim/VerifyClaimIndividualDetail.vue";
import verifyClaim from "@/features/claim/pages/Verify Claim/VerifyClaim.vue";
import FieldUpdateLogs from "@/features/claim/pages/FieldUpdateLogs.vue";

export default [
  {
    path: "/cash_claims",
    name: "Cash Services",
    component: CashClaim,
    meta: { requiresAuth: true, permissions: ["Cash Services"] },
  },
  {
    path: "/create_cash_claims",
    name: "Create Cash Claims",
    component: CreateCashClaims,
    meta: { requiresAuth: true, permissions: ["Create Cash Claims"] },
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
        name: "Credit claims", // Moved name to child with empty path
        component: CreditClaim,
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
        name: "Process Claims", // Moved name to child with empty path
        component: ProcessClaims,
      },
      {
        path: "detail/:claimUuid", // Changed parameter name to avoid duplication
        component: ProcessClaimDetailIndex,
        children: [
          {
            path: "",
            name: "Process Claim Batch Detail", // Moved name to child with empty path
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
            name: "Process Cash Claim Batch Detail", // Moved name to child with empty path
            component: ProcessCashClaimDetail,
          },
          {
            path: "individual/:claimUuids",
            name: "Process Cash individual Detail",
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
        name: "Verify Claims", // Moved name to child with empty path
        component: verifyClaim,
      },
      {
        path: "detail/:claimUuid", // Changed parameter name to avoid duplication
        component: verifyClaimDetailIndex,
        children: [
          {
            path: "",
            name: "Verify Claim Batch Detail", // Moved name to child with empty path
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
            name: "Process Cash Claim Batch Detail", // Moved name to child with empty path
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
    path: "/reject_claims",
    component: RejectClaimDetailIndex,
    meta: { requiresAuth: true, permissions: ["Read_claims"] },
    children: [
      {
        path: "",
        name: "Rejected Claims", // Moved name to child with empty path
        component: RejectClaim,
      },
      {
        path: "detail/:claimUuid", // Changed parameter name to avoid duplication
        component: RejectClaimDetailIndex,
        children: [
          {
            path: "",
            name: "Reject Claim Batch Detail", // Moved name to child with empty path
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
            name: "Process Cash Claim Batch Detail", // Moved name to child with empty path
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
    path: "/approveL1_claims",
    component: ApproveLevel1ClaimIndex,
    meta: { requiresAuth: true, permissions: ["Check_claim"] },
    children: [
      {
        path: "",
        name: "Approve Level 1 claims", // Moved name to child with empty path
        component: ApproveLevel1Claim,
      },
      {
        path: "detail/:claimUuid", // Changed parameter name to avoid duplication
        component: ProcessClaimDetailIndex,
        children: [
          {
            path: "",
            name: "Approve Level 1 Claim Batch Detail", // Moved name to child with empty path
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
        name: "Approve Claims", // Moved name to child with empty path
        component: ApproveClaims,
      },
      {
        path: "detail/:claimUuid", // Changed parameter name to avoid duplication
        component: RouterView,
        children: [
          {
            path: "",
            name: "Approve Claim Batch Detail", // Moved name to child with empty path
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
        name: "Authorize Claims", // Moved name to child with empty path
        component: AuthorizeClaims,
      },
      {
        path: "detail/:claimUuid", // Changed parameter name to avoid duplication
        component: RouterView,
        children: [
          {
            path: "",
            name: "Authorized Claim Batch Detail", // Moved name to child with empty path
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
    path: "/completed_claims",
    component: RouterView,
    meta: { requiresAuth: true, permissions: ["Read_claims"] },
    children: [
      {
        path: '',
        name: "Completed Claims", // Moved name to child with empty path
        component: CompletedClaimss
      },
      {
        path: 'detail/:claimUuid', // Changed parameter name to avoid duplication
        component: RouterView,
        children: [
          {
            path: '',
            name: "Completed Claim Batch Detail", // Moved name to child with empty path
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