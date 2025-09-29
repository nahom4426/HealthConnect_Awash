import CashClaim from "@/features/claim/pages/CashClaim.vue";
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
import VerifyClaimIndex from "@/features/claim/pages/VerifyClaimIndex.vue";
import VerifyClaim from "@/features/claim/pages/verify_claim/VerifyClaim.vue";
import VerifyClaimDeail from "@/features/claim/pages/verify_claim/VerifyClaimDeail.vue";
import VerifyClaimIndividualDetail from "@/features/claim/pages/verify_claim/VerifyClaimIndividualDetail.vue";
import { RouterView } from "vue-router";
import ApproveClaims from "@/features/claim/pages/approve_claim/ApproveClaims.vue";
import ApproveClaimDetail from "@/features/claim/pages/approve_claim/ApproveClaimDetail.vue";
import ApproveClaimIndividualDetail from "@/features/claim/pages/approve_claim/ApproveClaimIndividualDetail.vue";
import AuthorizeClaims from "@/features/claim/pages/authorize_claims/AuthorizeClaims.vue";
import AuthorizeClaimsDetail from "@/features/claim/pages/authorize_claims/AuthorizeClaimsDetail.vue";
import AuthorizeClaimIndividualDetail from "@/features/claim/pages/authorize_claims/AuthorizeClaimIndividualDetail.vue";
import CompletedClaimsDetail from "@/features/claim/pages/completed_claims/CompletedClaimsDetail.vue";
import CompletedClaimsIndividualDetail from "@/features/claim/pages/completed_claims/CompletedClaimsIndividualDetail.vue";

export default [
  {
    path: "cash_claims",
    name: "cash claims",
    component: CashClaim,
  },
  {
    path: "credit_claims",
    component: CreditClaimsIndex,
    name: "Credit claims",
    children: [
      {
        path: "",
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
    path: "process_claims",
    name: "process claims",
    component: ProcessClaimIndex,
    children: [
      {
        path: "",
        component: ProcessClaims,
      },
      {
        path: "detail/:claimUuid",
        name: "Process Claim Batch Detail",
        component: ProcessClaimDetailIndex,
        children: [
          {
            path: "",
            component: ProcessClaimDetail,
          },
          {
            path: "individual/:claimUuid",
            name: "Process individual Detail",
            component: ProcessClaimIndividualDetail,
          },
        ],
      },
      {
        path: "cash_detail/:batchCode",
        name: "Process Cash Claim Batch Detail",
        component: ProcessClaimDetailIndex,
        children: [
          {
            path: "",
            component: ProcessCashClaimDetail,
          },
          {
            path: "individual/:claimUuid",
            name: "Process Cash individual Detail",
            component: ProcessClaimIndividualDetail,
          },
        ],
      },
    ],
  },
  {
    path: "verify_claims",
    name: "verify claims",
    component: VerifyClaimIndex,
    children: [
      {
        path: "",
        component: VerifyClaim,
      },
      {
        path: "detail/:providerUuid/:batchCode",
        name: "Verify Claim Batch Detail",
        component: ProcessClaimDetailIndex,
        children: [
          {
            path: "",
            component: VerifyClaimDeail,
          },
          {
            path: "individual/:claimUuid",
            name: "Verify individual Detail",
            component: VerifyClaimIndividualDetail,
          },
        ],
      },
    ],
  },
  {
    path: "approve_claims",
    name: "approve claims",
    component: RouterView,
    children: [
      {
        path: "",
        component: ApproveClaims,
      },
      {
        path: "detail/:providerUuid/:batchCode",
        name: "Approve Claim Batch Detail",
        component: RouterView,
        children: [
          {
            path: "",
            component: ApproveClaimDetail,
          },
          {
            path: "individual/:claimUuid",
            name: "Approve Individual Detail",
            component: ApproveClaimIndividualDetail,
          },
        ],
      },
    ],
  },
  {
    path: "authorize_claims",
    name: "authorize claims",
    component: RouterView,
    children: [
      {
        path: "",
        component: AuthorizeClaims,
      },
      {
        path: "detail/:providerUuid/:batchCode",
        name: "Authorized Claim Batch Detail",
        component: RouterView,
        children: [
          {
            path: "",
            component: AuthorizeClaimsDetail
          },
          {
            path: "individual/:claimUuid",
            name: "Authorized Individual Detail",
            component: AuthorizeClaimIndividualDetail,
          },
        ],
      },
    ],
  },
  {
    path: "completed_claims",
    name: "completed claims",
    component: RouterView,
    children: [
      {
        path: '',
        component: CompletedClaimss
      },
      {
        path: 'detail/:providerUuid/:batchCode',
        name: "Completed Claim Batch Detail",
        component: RouterView,
        children: [
          {
            path: '',
            component: CompletedClaimsDetail
          },
          {
            path: "individual/:claimUuid",
            name: "Completed Individual Detail",
            component: CompletedClaimsIndividualDetail,
          }
        ]
      }
    ]
  },
];
