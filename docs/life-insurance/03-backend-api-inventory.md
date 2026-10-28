# 3 · Backend API inventory and API-to-screen mapping

Source of truth: `http://192.168.100.251:8194/api/life/v3/api-docs` (OpenAPI 3.0.1, "Life Insurance" 1.0),
read on 2026-10-28. **169 operations, 25 controllers, 73 schemas.** The frontend client in
`src/features/life/api/*.js` is generated one-to-one from this document (function name = `operationId`).

## Cross-cutting facts (verified)

| Topic | Finding |
|---|---|
| Base URL | `<host>:8194/api/life` (dev: `http://192.168.100.251:8194/api/life`) |
| Authentication | **Every endpoint returns 401 "Full authentication is required"** without a bearer token, but the OpenAPI document declares **no `securitySchemes`** → backend gap G9. The client sends the signed-in user's token (same as the rest of the app). |
| CORS | A direct browser call from `http://localhost:5173` fails; dev uses the Vite proxy `/api/life` → `VITE_LIFE_API_HOST`. Production needs either a reverse-proxy route or CORS on the service (decision D3). |
| Pagination | `page` + `limit` query params on list endpoints; responses are **plain arrays** with `totalPages` repeated inside each item (same convention as the health backend, so `usePagination` already handles it). **No `totalElements`** → exact counts for dashboards aren't available (gap G8). |
| Errors | Spring default error body `{ path, error, message, status }` (seen on 401); only `200` responses are documented. `ApiResponseHandler` already maps `message` to a toast. |
| Files | Uploads: `multipart/form-data` (insured import, rate imports, claim attachments). Downloads: insured import template, claim attachment (`responseType: 'blob'`). |
| Audit | Most responses carry `audit: { createdByUuid, updatedByUuid, createdAt, updatedAt }`. |

## Business grouping (derived from Swagger)

| Module | Controllers | Ops |
|---|---|---|
| Products & rates | rider, individual-rider, group-rider, individual-term, group-term | 40 |
| Underwriting questionnaire | question, possible-answer, answer | 15 |
| Group quotations | quotation, quoted-rider | 14 |
| Insured persons | insured | 8 |
| Policies (group) | policy | 3 |
| Individual policies | benefit, individual-rider-benefit | 10 |
| Claims | claim, claim-logs, claim-attachment | 30 |
| Reinsurance | reinsurer, reinsurance-treaty, treaty-member, fcl-group, fcl-medical-parameter, fcl-medical-underwriting-range, fcl-underwriting-range-medical-requirement, policy-treaty-mapping | 49 |

**Not present at all:** customer/policyholder, beneficiary, payment schedule / premium history, policy documents,
policy servicing (cancel, lapse, reinstate, renew, endorse), maturity/surrender, dashboard/report summaries,
underwriting decisions. See [09-backend-gaps-and-change-requests.md](09-backend-gaps-and-change-requests.md).

## Classification summary

| Classification | Count | Meaning |
|---|---|---|
| Used | 130 | Called by a planned screen |
| Admin | 32 | Single-row reads and deletes used from admin/detail screens only |
| Needs clarification | 5 | Contract is ambiguous or wrong in Swagger (listed below) |
| Not currently required | 1 | `getClaimLogs_1` duplicates the paged `getClaimLogs` |
| Backend gap | 1 | `createClaim` takes no claim data |

**Needs clarification:** `getQuotedRider` (documented to return `QuotationResponse`), `getPolicyTreatyMappingList`
(a "list" documented as one object), `getAnswers` and `getIndividualRiderBenefits` (no filter, so they return every
record in the system), `updateClaim` (body is only `claimUuid` + `comment`). Also: `importInsuredPerson` takes the
query parameter `qutoationUuid` (backend spelling, must be sent exactly so).

## Endpoint inventory

### Products & rates (40)

| Method | Path | operationId | Query (* required) | Body | 200 response | Frontend screen | Classification |
|---|---|---|---|---|---|---|---|
| `GET` | `/group-rider/{groupRiderUuid}` | getGroupRider | — | — | GroupRiderResponse | Rider rates (group) row | Admin |
| `PUT` | `/group-rider/{groupRiderUuid}` | updateGroupRider | — | GroupRiderRequest | GroupRiderResponse | Rider rates (group) edit row | Used |
| `DELETE` | `/group-rider/{groupRiderUuid}` | deleteGroupRider | — | — | MessageResponse | Rider rates (group) delete row | Admin |
| `GET` | `/group-rider/active` | getGroupRiders | — | — | GroupRiderResponse[] | Rider rates (group) | Used |
| `PUT` | `/group-rider/create-update` | updateGroupRiders | — | GroupRiderRequest[] | GroupRiderResponse[] | Rider rates (group) bulk save | Used |
| `POST` | `/group-rider/import` | importGroupRiderData | riderUuid* | multipart file | GroupRiderResponse[] | Rider rates (group) Excel import | Used |
| `POST` | `/group-rider` | createGroupRider | — | GroupRiderRequest | GroupRiderResponse | Rider rates (group) add row | Used |
| `GET` | `/group-term/{groupTermUuid}` | getGroupTerm | — | — | GroupTermResponse | Group term rates row | Admin |
| `PUT` | `/group-term/{groupTermUuid}` | updateGroupTerm | — | GroupTermRequest | GroupTermResponse | Group term rates edit row | Used |
| `DELETE` | `/group-term/{groupTermUuid}` | deleteGroupTerm | — | — | MessageResponse | Group term rates delete row | Admin |
| `POST` | `/group-term/import` | importTerm | — | multipart file | MessageResponse | Group term rates Excel import | Used |
| `GET` | `/group-term/list` | getGroupTerms | status* (ACTIVE/PENDING/DISABLED) | — | GroupTermResponse[] | Group term rates | Used |
| `PUT` | `/group-term/update` | updateGroupTerms | — | GroupTermRequest[] | GroupTermResponse[] | Group term rates bulk save | Used |
| `POST` | `/group-term` | createGroupTerm | — | GroupTermRequest | GroupTermResponse | Group term rates add row | Used |
| `GET` | `/individual-rider/{individualRiderUuid}` | getIndividualRider | — | — | IndividualRiderResponse | Rider rates (individual) row | Admin |
| `PUT` | `/individual-rider/{individualRiderUuid}` | updateIndividualRider | — | IndividualRiderRequest | IndividualRiderResponse | Rider rates (individual) edit row | Used |
| `DELETE` | `/individual-rider/{individualRiderUuid}` | deleteIndividualRider | — | — | MessageResponse | Rider rates (individual) delete row | Admin |
| `GET` | `/individual-rider/active` | getIndividualRiders | — | — | IndividualRiderResponse[] | Rider rates (individual) | Used |
| `PUT` | `/individual-rider/create-update` | updateIndividualRiders | — | IndividualRiderRequest[] | IndividualRiderResponse[] | Rider rates (individual) bulk save | Used |
| `POST` | `/individual-rider/import` | importData | riderUuid* | multipart file | IndividualRiderResponse[] | Rider rates (individual) Excel import | Used |
| `GET` | `/individual-rider/rate` | getIndividualRiderRate | age*, riderUuid* | — | IndividualRiderResponse[] | Individual policy wizard → rider rate | Used |
| `POST` | `/individual-rider` | createIndividualRider | — | IndividualRiderRequest | IndividualRiderResponse | Rider rates (individual) add row | Used |
| `GET` | `/insurance-term/{insuranceTermUuid}` | getInsuranceTerm | — | — | IndividualTermResponse | Individual term rates row | Admin |
| `PUT` | `/insurance-term/{insuranceTermUuid}` | updateInsuranceTerm | — | IndividualTermRequest | IndividualTermResponse | Individual term rates edit row | Used |
| `DELETE` | `/insurance-term/{insuranceTermUuid}` | deleteInsuranceTerm | — | — | MessageResponse | Individual term rates delete row | Admin |
| `GET` | `/insurance-term/active` | getInsuranceTerms | — | — | IndividualTermResponse[] | Individual term rates | Used |
| `GET` | `/insurance-term/calculate-term-premium` | geTermPremium | age*, term* | — | IndividualTermResponse | Individual policy wizard → term premium | Used |
| `PUT` | `/insurance-term/create-update` | updateInsuranceTerms | — | IndividualTermRequest[] | IndividualTermResponse[] | Individual term rates bulk save | Used |
| `POST` | `/insurance-term` | createInsuranceTerm | — | IndividualTermRequest | IndividualTermResponse | Individual term rates add row | Used |
| `GET` | `/rider/{riderUuid}` | getRider | — | — | RiderResponse | Rider detail (with rate tables) | Used |
| `PUT` | `/rider/{riderUuid}` | updateRider | — | RiderRequest | RiderResponse | Edit rider | Used |
| `DELETE` | `/rider/{riderUuid}` | deleteRider | — | — | MessageResponse | Rider detail (admin delete) | Admin |
| `PUT` | `/rider/activate/{riderUuid}` | activateRider | — | — | RiderResponse | Rider detail → Activate | Used |
| `GET` | `/rider/active/lists` | getRiderList | — | — | RiderListResponse[] | Rider pickers (quotation, individual policy) | Used |
| `GET` | `/rider/active` | getRiders | — | — | RiderResponse[] | Riders list | Used |
| `GET` | `/rider/modified` | getModifiedRiders | — | — | RiderResponse[] | Riders → Modified tab | Used |
| `GET` | `/rider/pending` | getPendingRiders | — | — | RiderResponse[] | Riders → Pending tab | Used |
| `GET` | `/rider/rates/byage` | getRiderRatesByAge | age* | — | RiderResponse[] | Individual policy wizard → rider premiums | Used |
| `POST` | `/rider/replicate/{riderUuid}` | modifyRider | — | — | RiderResponse | Rider detail → Revise (new version) | Used |
| `POST` | `/rider` | createRider | — | RiderRequest | RiderResponse | New rider | Used |

### Underwriting questionnaire (15)

| Method | Path | operationId | Query (* required) | Body | 200 response | Frontend screen | Classification |
|---|---|---|---|---|---|---|---|
| `GET` | `/answer/{answerUuid}` | getAnswer | — | — | AnswerResponse | Underwriting → answer | Used |
| `PUT` | `/answer/{answerUuid}` | updateAnswer | — | AnswerRequest | AnswerResponse | Health declaration edit | Used |
| `DELETE` | `/answer/{answerUuid}` | deleteAnswer | — | — | MessageResponse | Health declaration remove | Admin |
| `GET` | `/answer` | getAnswers | — | — | AnswerResponse[] | Underwriting → recorded answers | Needs clarification (unfiltered: no person/quotation/benefit filter) |
| `POST` | `/answer` | createAnswer | — | AnswerRequest | AnswerResponse | Health declaration capture | Used |
| `GET` | `/possible-answer/{answerUuid}` | getPossibleAnswer | — | — | PossibleAnswerResponse | Answer library row | Admin |
| `PUT` | `/possible-answer/{possibleAnswerUuid}` | updatePossibleAnswer | — | PossibleAnswerRequest | PossibleAnswerResponse | Answer library edit | Used |
| `DELETE` | `/possible-answer/{possibleAnswerUuid}` | deletePossibleAnswer | — | — | MessageResponse | Answer library delete | Admin |
| `GET` | `/possible-answer/active` | getAllPossibleAnswers | — | — | PossibleAnswerResponse[] | Answer library | Used |
| `POST` | `/possible-answer` | createPossibleAnswer | — | PossibleAnswerRequest | PossibleAnswerResponse | Answer library add | Used |
| `GET` | `/question/{questionUuid}` | getQuestion | — | — | QuestionResponse | Question editor | Used |
| `PUT` | `/question/{questionUuid}` | updateQuestion | — | QuestionRequest | QuestionResponse | Question editor | Used |
| `DELETE` | `/question/{questionUuid}` | deleteQuestion | — | — | MessageResponse | Questionnaire setup delete | Admin |
| `GET` | `/question` | getQuestions | page, limit, status* (ACTIVE/PENDING/DISABLED), search | — | QuestionResponse[] | Questionnaire setup | Used |
| `POST` | `/question` | createQuestion | — | QuestionRequest | QuestionResponse | Question editor (new) | Used |

### Group quotations (14)

| Method | Path | operationId | Query (* required) | Body | 200 response | Frontend screen | Classification |
|---|---|---|---|---|---|---|---|
| `GET` | `/quotation/{quotationUuid}` | getQuotation | — | — | QuotationResponse | Quotation detail | Used |
| `PUT` | `/quotation/{quotationUuid}` | updateQuotation | — | QuotationRequest | QuotationResponse | Quotation detail → Edit | Used |
| `DELETE` | `/quotation/{quotationUuid}` | deleteQuotation | — | — | object | Quotation detail → Delete draft | Used |
| `PUT` | `/quotation/accept/{quotationUuid}` | acceptQuotation | — | — | QuotationResponse | Quotation detail → Mark accepted | Used |
| `PUT` | `/quotation/issue/{quotationUuid}` | issueQuotation | — | — | QuotationResponse | Quotation detail → Issue | Used |
| `GET` | `/quotation/list` | getQuotations | page, limit, status* (PENDING/ISSUED/ACCEPTED/PAID), search | — | QuotationResponse[] | Quotations list (tabs per status) | Used |
| `PUT` | `/quotation/pay/{quotationUuid}` | payQuotation | receiptNumber, withHoldingTax*, revenueStamp*, netPremium*, receiptDate*, requestedPremium* | — | QuotationResponse | Quotation detail → Record payment | Used |
| `POST` | `/quotation/revise/{quotationUuid}` | reviseQuotation | — | — | QuotationResponse | Policy/quotation detail → Revise (renewal / change) | Used |
| `POST` | `/quotation` | createQuotation | — | QuotationRequest | QuotationResponse | New quotation (step 1) | Used |
| `GET` | `/quoted-rider/{quotedRiderUuid}` | getQuotedRider | — | — | QuotationResponse | Quoted rider detail | Needs clarification (documented to return QuotationResponse) |
| `DELETE` | `/quoted-rider/{quotedRiderUuid}` | deleteQuotedRider | — | — | object | Quotation → Riders tab remove | Admin |
| `GET` | `/quoted-rider` | getQuotedRiders | quotationUuid* | — | QuotedRiderResponse[] | Quotation → Riders tab | Used |
| `PUT` | `/quoted-rider` | updateQuotedRider | — | QuotedRiderUpdateRequest[] | QuotedRiderResponse[] | Quotation → Riders tab edit SA | Used |
| `POST` | `/quoted-rider` | createQuotedRider | — | QuotedRiderRequest[] | QuotedRiderResponse[] | Quotation → Riders tab add | Used |

### Insured persons (8)

| Method | Path | operationId | Query (* required) | Body | 200 response | Frontend screen | Classification |
|---|---|---|---|---|---|---|---|
| `GET` | `/insuredperson/{insuredUuid}` | getInsuredPerson | — | — | InsuredResponse | Insured person drawer | Used |
| `PUT` | `/insuredperson/{insuredUuid}` | updateInsuredPerson | — | InsuredRequest | MessageResponse | Insured persons → Edit | Used |
| `DELETE` | `/insuredperson/{insuredUuid}` | deleteInsuredPerson | — | — | MessageResponse | Insured persons → Remove | Admin |
| `GET` | `/insuredperson/import-insured-person/sample` | exportInsuredPersonSample | — | — | file | Insured persons → Download template | Used |
| `POST` | `/insuredperson/import-insured-person` | importInsuredPerson | institutionUuid*, qutoationUuid* | multipart file | MessageResponse | Insured persons → Excel import | Used |
| `GET` | `/insuredperson/list/{quotationUuid}` | getInsuredPersons | search, page, limit | — | InsuredResponse[] | Quotation/Policy → Insured persons tab | Used |
| `GET` | `/insuredperson/reinsurance/list/{quotationUuid}` | getInsuredPersonListReinsured | search, page, limit | — | InsuredResponse[] | Quotation → Reinsurance tab (members above retention) | Used |
| `POST` | `/insuredperson` | createInsuredPerson | — | InsuredRequest | MessageResponse | Insured persons → Add | Used |

### Policies (3)

| Method | Path | operationId | Query (* required) | Body | 200 response | Frontend screen | Classification |
|---|---|---|---|---|---|---|---|
| `PUT` | `/policy/generate/treaty-report/{quotationUuid}` | generateTreatyReport | — | — | object | Policy → Reinsurance tab → Generate treaty report | Used (response shape undocumented) |
| `PUT` | `/policy/issue/{quotationUuid}` | issuePolicy | — | PolicyRequest | PolicyResponse | Paid quotation → Issue policy | Used |
| `GET` | `/policy/lists` | getPolicies | page, limit, status* (ACTIVE/PENDING/MODIFIED/DISABLED/LAPSED/CANCELLED), search | — | PolicyResponse[] | Policies list (tabs per status) | Used |

### Individual policies (10)

| Method | Path | operationId | Query (* required) | Body | 200 response | Frontend screen | Classification |
|---|---|---|---|---|---|---|---|
| `GET` | `/benefit/{benefitUuid}` | getBenefit | — | — | BenefitResponse | Individual policy detail | Used |
| `PUT` | `/benefit/{benefitUuid}` | updateBenefit | — | BenefitRequest | BenefitResponse | Individual policy → Edit | Used |
| `DELETE` | `/benefit/{benefitUuid}` | deleteBenefit | — | — | MessageResponse | Individual policy → Delete draft | Used |
| `GET` | `/benefit/benefits/{status}` | getBenefits | — | — | BenefitResponse[] | Individual policies list (tabs per status) | Used (no paging/search) |
| `POST` | `/benefit` | createBenefit | — | BenefitRequest | BenefitResponse | New individual policy wizard | Used |
| `GET` | `/individual-rider-benefit/{individualRiderBenefitUuid}` | getIndividualRiderBenefit | — | — | IndividualRiderBenefitResponse | Individual policy rider row | Used |
| `PUT` | `/individual-rider-benefit/{individualRiderBenefitUuid}` | updateIndividualRiderBenefit | — | IndividualRiderBenefitRequest | IndividualRiderBenefitResponse | Individual policy → edit rider | Used |
| `DELETE` | `/individual-rider-benefit/{individualRiderBenefitUuid}` | deleteIndividualRiderBenefit | — | — | MessageResponse | Individual policy → remove rider | Admin |
| `GET` | `/individual-rider-benefit/active/benefits` | getIndividualRiderBenefits | — | — | IndividualRiderBenefitResponse[] | Individual policy → Riders tab | Needs clarification (unfiltered: no benefitUuid filter) |
| `POST` | `/individual-rider-benefit` | createIndividualRiderBenefit | — | IndividualRiderBenefitRequest[] | IndividualRiderBenefitResponse[] | Individual policy wizard → riders | Used |

### Claims (30)

| Method | Path | operationId | Query (* required) | Body | 200 response | Frontend screen | Classification |
|---|---|---|---|---|---|---|---|
| `PUT` | `/claim-attachment/{claimAttachmentUuid}` | updateClaimAttachment | fileNames* | multipart file | object | Claim → Documents replace | Used |
| `DELETE` | `/claim-attachment/{claimAttachmentUuid}` | deleteClaimAttachment | — | — | object | Claim → Documents remove | Admin |
| `GET` | `/claim-attachment/{claimUuid}` | getClaimAttachments | — | — | ClaimAttachmentResponse[] | Claim → Documents list | Used |
| `GET` | `/claim-attachment/open` | getAttachment | claimAttachmentUuid* | — | file | Claim → Documents view/download | Used |
| `POST` | `/claim-attachment` | createClaimAttachment | claimUuid*, fileNames* | multipart file | object | Claim → Documents upload | Used |
| `GET` | `/claim-log/{claimUuid}` | getClaimLogs_1 | — | — | ClaimLogsResponse[] | Claim detail → timeline (unpaged) | Not currently required (duplicate of getClaimLogs) |
| `GET` | `/claim/{claimUuid}` | getClaim | — | — | ClaimResponse | Claim detail (ids & stage owners) | Used |
| `PUT` | `/claim/{claimUuid}` | updateClaim | — | ClaimRequest | object | Claim detail → save comment | Needs clarification (body is only claimUuid+comment) |
| `DELETE` | `/claim/{claimUuid}` | deleteClaim | — | — | object | Claim detail → delete draft | Admin |
| `GET` | `/claim/agency/approved/list` | getAgencyApprovedClaims | search, page, limit | — | ClaimListResponse[] | Agency claims → Approved | Used |
| `GET` | `/claim/agency/paid/list` | getAgencyPaidClaims | search, page, limit | — | ClaimListResponse[] | Agency claims → Paid | Used |
| `GET` | `/claim/agency/rejected/list` | getAgencyRejectedClaims | search, page, limit | — | ClaimListResponse[] | Agency claims → Rejected | Used |
| `PUT` | `/claim/agency/request` | setProviderApprovePreparedBy | — | ClaimRequest | object | Claim (agency) → Submit request | Used |
| `GET` | `/claim/agency/requested/list` | getAgencyRequestedClaims | search, page, limit | — | ClaimListResponse[] | Agency claims → Requested | Used |
| `GET` | `/claim/agency/saved/list` | getSavedClaims | search, page, limit | — | ClaimListResponse[] | Agency claims → Saved | Used |
| `GET` | `/claim/claim-approver-details` | getClaimApproverResponse | claimUuid* | — | ClaimApproverResponse[] | Claim detail → approval trail | Used |
| `PUT` | `/claim/deny` | denyClaim | claimUuid*, comment* | — | object | Claim → Reject (with reason) | Used |
| `GET` | `/claim/details/{claimUuid}` | getClaimDetails | — | — | ClaimListResponse | Claim detail (display data) | Used |
| `PUT` | `/claim/insurance/approve` | setInsuranceApproveApprovedBy | — | ClaimRequest | object | Claim (insurance) → Approve | Used |
| `GET` | `/claim/insurance/approved/list` | getAuditedClaimsByPayer | search, page, limit | — | ClaimListResponse[] | Claims → Approved | Used |
| `GET` | `/claim/insurance/authorized/list` | getAuthorizedClaimsByInsurance | search, page, limit | — | ClaimListResponse[] | Claims → Authorized | Used |
| `GET` | `/claim/insurance/for-authorization/list` | getClaimsForAuthorization | search, page, limit | — | ClaimListResponse[] | Claims → Awaiting authorization | Used |
| `GET` | `/claim/insurance/paid/list` | getInsurancePaidClaims | search, page, limit | — | ClaimListResponse[] | Claims → Paid | Used |
| `GET` | `/claim/insurance/registered/list` | getRegisteredClaims | search, page, limit | — | ClaimListResponse[] | Claims → Registered | Used |
| `GET` | `/claim/insurance/rejected/list` | getRejectedClaimsByPayer | search, page, limit | — | ClaimListResponse[] | Claims → Rejected | Used |
| `GET` | `/claim/insurance/requested/list` | getRequestedClaims | search, page, limit | — | ClaimListResponse[] | Claims → Requested | Used |
| `PUT` | `/claim/insurance/review` | setInsuranceApproveRevieweBy | — | ClaimRequest | object | Claim (insurance) → Review | Used |
| `GET` | `/claim/insurance/reviewed/list` | getReviewedClaimsByPayer | search, page, limit | — | ClaimListResponse[] | Claims → Reviewed | Used |
| `GET` | `/claim/logs` | getClaimLogs | claimUuid*, search, page, limit | — | ClaimLogsResponse[] | Claim detail → timeline | Used |
| `POST` | `/claim` | createClaim | insuredPersonUuid* | — | string | Claims → New claim | Backend gap (no claim body: type, cause, date of event, claimant, amount) |

> There is no "authorize" or "pay" action endpoint even though there are *for-authorization*, *authorized* and
> *paid* lists and `ClaimListResponse` has payment order/voucher fields. See gap G3.

### Reinsurance (49)

| Method | Path | operationId | Query (* required) | Body | 200 response | Frontend screen | Classification |
|---|---|---|---|---|---|---|---|
| `GET` | `/policy-treaty/mapping/{policyTreatyMappingUuid}` | getPolicyTreatyMapping | — | — | PolicyTreatyMappingResponse | Policy → Reinsurance tab | Admin |
| `PUT` | `/policy-treaty/mapping/{policyTreatyMappingUuid}` | updatePolicyTreatyMapping | — | PolicyTreatyMappingRequest | PolicyTreatyMappingResponse | Policy → Reinsurance tab | Used |
| `DELETE` | `/policy-treaty/mapping/{policyTreatyMappingUuid}` | deletePolicyTreatyMapping | — | — | object | Policy → Reinsurance tab | Admin |
| `GET` | `/policy-treaty/mapping/list/{quotationUuid}` | getPolicyTreatyMappingList | — | — | PolicyTreatyMappingResponse | Policy → Reinsurance tab | Needs clarification (list endpoint documented as single object) |
| `PUT` | `/policy-treaty/mapping/update/status/{policyTreatyMappingUuid}` | updatePolicyTreatyMappingStatus | status* (ACTIVE/PENDING/REVISED) | — | PolicyTreatyMappingResponse | Policy → Reinsurance tab | Used |
| `POST` | `/policy-treaty/mapping` | createPolicyTreatyMapping | — | PolicyTreatyMappingRequest | PolicyTreatyMappingResponse | Policy → Reinsurance tab | Used |
| `GET` | `/reinsurance/fcl-group/{fclGroupUuid}` | getFclGroup | — | — | FclGroupResponse | Treaty detail → Group FCL | Admin |
| `DELETE` | `/reinsurance/fcl-group/{fclGroupUuid}` | deleteFclGroup | — | — | object | Treaty detail → Group FCL | Admin |
| `PUT` | `/reinsurance/fcl-group/{reinsuranceTreatyUuid}` | updateFclGroup | — | FclGroupUpdateRequest[] | FclGroupResponse[] | Treaty detail → Group FCL | Used |
| `GET` | `/reinsurance/fcl-group/list/{reinsuranceTreatyUuid}` | getFclGroups | status* (ACTIVE/PENDING/REVISED) | — | FclGroupResponse[] | Treaty detail → Group FCL | Used |
| `POST` | `/reinsurance/fcl-group` | createFclGroup | — | FclGroupRequest[] | FclGroupResponse[] | Treaty detail → Group FCL | Used |
| `GET` | `/reinsurance/fcl/underwriting-range/{fclMedicalUnderwritingRangeUuid}` | getFclMedicalUnderwritingRange | — | — | FclMedicalUnderwritingRangeResponse | Treaty detail → Medical underwriting ranges | Admin |
| `DELETE` | `/reinsurance/fcl/underwriting-range/{fclMedicalUnderwritingRangeUuid}` | deleteFclMedicalUnderwritingRange | — | — | object | Treaty detail → Medical underwriting ranges | Admin |
| `PUT` | `/reinsurance/fcl/underwriting-range/{reinsuranceTreatyUuid}` | updateFclMedicalUnderwritingRange | — | FclUnderwritingRangeWithMedicalParametersRequest[] | FclWithMedicalParameterResponse[] | Treaty detail → Medical underwriting ranges | Used |
| `GET` | `/reinsurance/fcl/underwriting-range/list/{reinsuranceTreatyUuid}` | getFclMedicalUnderwritingRanges | status* (ACTIVE/PENDING/REVISED) | — | FclMedicalUnderwritingRangeResponse[] | Treaty detail → Medical underwriting ranges | Used |
| `GET` | `/reinsurance/fcl/underwriting-range/list/with-medical/parameters/{reinsuranceTreatyUuid}` | getFclMedicalUnderwritingRangesWithMedicalParameters | status* (ACTIVE/PENDING/REVISED) | — | FclWithMedicalParameterResponse[] | Treaty detail → Medical underwriting ranges | Used |
| `PUT` | `/reinsurance/fcl/underwriting-range/update/status/{fclMedicalUnderwritingRangeUuid}` | updateFclMedicalUnderwritingRangeStatus | status* (ACTIVE/PENDING/REVISED) | — | FclMedicalUnderwritingRangeResponse | Treaty detail → Medical underwriting ranges | Used |
| `POST` | `/reinsurance/fcl/underwriting-range` | createFclMedicalUnderwritingRange | — | FclMedicalUnderwritingRangeRequest | FclMedicalUnderwritingRangeResponse | Treaty detail → Medical underwriting ranges | Used |
| `GET` | `/reinsurance/medical-parameter/{FclMedicalParameterUuid}` | getFclMedicalParameter | — | — | FclMedicalParameterResponse | Reinsurance → Medical tests | Admin |
| `PUT` | `/reinsurance/medical-parameter/{FclMedicalParameterUuid}` | updateFclMedicalParameter | — | FclMedicalParameterRequest | FclMedicalParameterResponse | Reinsurance → Medical tests | Used |
| `DELETE` | `/reinsurance/medical-parameter/{FclMedicalParameterUuid}` | deleteFclMedicalParameter | — | — | object | Reinsurance → Medical tests | Admin |
| `GET` | `/reinsurance/medical-parameter/list` | getFclMedicalParameters | page, limit, status* (ACTIVE/PENDING/REVISED), search | — | FclMedicalParameterResponse[] | Reinsurance → Medical tests | Used |
| `PUT` | `/reinsurance/medical-parameter/update/status/{FclMedicalParameterUuid}` | updateFclMedicalParameterStatus | status* (ACTIVE/PENDING/REVISED) | — | FclMedicalParameterResponse | Reinsurance → Medical tests | Used |
| `POST` | `/reinsurance/medical-parameter` | createFclMedicalParameter | — | FclMedicalParameterRequest | FclMedicalParameterResponse | Reinsurance → Medical tests | Used |
| `GET` | `/reinsurance/treaty/{reinsuranceTreatyUuid}` | getReinsuranceTreaty | — | — | ReinsuranceTreatyResponse | Reinsurance → Treaties | Used |
| `PUT` | `/reinsurance/treaty/{reinsuranceTreatyUuid}` | updateReinsuranceTreaty | — | ReinsuranceTreatyRequest | ReinsuranceTreatyResponse | Reinsurance → Treaties | Used |
| `DELETE` | `/reinsurance/treaty/{reinsuranceTreatyUuid}` | deleteReinsuranceTreaty | — | — | object | Reinsurance → Treaties | Admin |
| `POST` | `/reinsurance/treaty/all` | createReinsuranceAllTreaty | — | TreatyRequest | ReinsuranceTreaty | Reinsurance → New treaty wizard | Used |
| `GET` | `/reinsurance/treaty/list` | getReinsuranceTreatys | page, limit, status* (ACTIVE/PENDING/REVISED), search | — | ReinsuranceTreatyResponse[] | Reinsurance → Treaties | Used |
| `GET` | `/reinsurance/treaty/medical-requirement/{fclUnderwritingRangeMedicalRequirementUuid}` | getFclUnderwritingRangeMedicalRequirement | — | — | FclUnderwritingRangeMedicalRequirementResponse | Treaty detail → Medical requirements | Admin |
| `PUT` | `/reinsurance/treaty/medical-requirement/{fclUnderwritingRangeMedicalRequirementUuid}` | updateFclUnderwritingRangeMedicalRequirement | — | FclUnderwritingRangeMedicalRequirementRequest | FclUnderwritingRangeMedicalRequirementResponse | Treaty detail → Medical requirements | Used |
| `DELETE` | `/reinsurance/treaty/medical-requirement/{fclUnderwritingRangeMedicalRequirementUuid}` | deleteFclUnderwritingRangeMedicalRequirement | — | — | object | Treaty detail → Medical requirements | Admin |
| `GET` | `/reinsurance/treaty/medical-requirement/list/{fclMedicalUnderwritingRangeUuid}` | getFclUnderwritingRangeMedicalRequirements | status* (ACTIVE/PENDING/REVISED) | — | FclUnderwritingRangeMedicalRequirementResponse[] | Treaty detail → Medical requirements | Used |
| `PUT` | `/reinsurance/treaty/medical-requirement/update/status/{fclUnderwritingRangeMedicalRequirementUuid}` | updateFclUnderwritingRangeMedicalRequirementStatus | status* (ACTIVE/PENDING/REVISED) | — | FclUnderwritingRangeMedicalRequirementResponse | Treaty detail → Medical requirements | Used |
| `POST` | `/reinsurance/treaty/medical-requirement` | createFclUnderwritingRangeMedicalRequirement | — | FclUnderwritingRangeMedicalRequirementRequest | FclUnderwritingRangeMedicalRequirementResponse | Treaty detail → Medical requirements | Used |
| `PUT` | `/reinsurance/treaty/member/{reinsuranceTreatyUuid}` | updateTreatyMember | — | TreatyMemberUpdateRequest[] | TreatyMemberResponse[] | Treaty detail → Members | Used |
| `GET` | `/reinsurance/treaty/member/{treatyMemberUuid}` | getTreatyMember | — | — | TreatyMemberResponse | Treaty detail → Members | Admin |
| `DELETE` | `/reinsurance/treaty/member/{treatyMemberUuid}` | deleteTreatyMember | — | — | object | Treaty detail → Members | Admin |
| `GET` | `/reinsurance/treaty/member/list/{reinsuranceTreatyUuid}` | getTreatyMembers | status* (ACTIVE/PENDING/REVISED) | — | TreatyMemberResponse[] | Treaty detail → Members | Used |
| `PUT` | `/reinsurance/treaty/member/update/status/{treatyMemberUuid}` | updateTreatyMemberStatus | status* (ACTIVE/PENDING/REVISED) | — | TreatyMemberResponse | Treaty detail → Members | Used |
| `POST` | `/reinsurance/treaty/member` | createTreatyMember | — | TreatyMemberRequest | TreatyMemberResponse | Treaty detail → Members | Used |
| `PUT` | `/reinsurance/treaty/update/status/{reinsuranceTreatyUuid}` | updateReinsuranceTreatyStatus | status* (ACTIVE/PENDING/REVISED) | — | ReinsuranceTreatyResponse | Reinsurance → Treaties | Used |
| `POST` | `/reinsurance/treaty` | createReinsuranceTreaty | — | ReinsuranceTreatyRequest | ReinsuranceTreatyResponse | Reinsurance → Treaties | Used |
| `GET` | `/reinsurer/{reinsurerUuid}` | getReinsurer | — | — | ReinsurerResponse | Reinsurance → Reinsurers | Used |
| `PUT` | `/reinsurer/{reinsurerUuid}` | updateReinsurer | — | ReinsurerRequest | ReinsurerResponse | Reinsurance → Reinsurers | Used |
| `DELETE` | `/reinsurer/{reinsurerUuid}` | deleteReinsurer | — | — | object | Reinsurance → Reinsurers | Admin |
| `GET` | `/reinsurer/list` | getReinsurers | page, limit, status* (ACTIVE/PENDING/DISABLED), search | — | ReinsurerResponse[] | Reinsurance → Reinsurers | Used |
| `PUT` | `/reinsurer/update/status/{reinsurerUuid}` | updateReinsurerStatus | status* (ACTIVE/PENDING/DISABLED) | — | ReinsurerResponse | Reinsurance → Reinsurers | Used |
| `POST` | `/reinsurer` | createReinsurer | — | ReinsurerRequest | ReinsurerResponse | Reinsurance → Reinsurers | Used |

## Key request DTOs and their validation (from the schemas)

Backend validation is authoritative; the frontend mirrors these for better messages.

| DTO | Required | Length / format rules | Notes |
|---|---|---|---|
| `QuotationRequest` | — (none marked) | institutionName ≤ 100, contactPersonFullName ≤ 60, contactPhone ≤ 13 | `term` integer (years); status PENDING/ISSUED/ACCEPTED/PAID |
| `InsuredRequest` | title, firstName, fatherName, grandFatherName, birthDate, phone, address1–3, state, country | names ≤ 25, phone ≤ 13, email ≤ 50, addresses ≤ 50, idNumber ≤ 50 | `sumAssured`, `premium` numbers; gender free text |
| `QuotedRiderRequest` | — | — | riderUuid, quotationUuid, sumAssured |
| `PolicyRequest` | — | beginDate, endDate (date-time) | |
| `BenefitRequest` | beginDate | names ≤ 25, gender ≤ 8, personPhone ≤ 13 | insuranceTerm, termBenefit, termPremium |
| `IndividualRiderBenefitRequest` | benefitUuid, riderUuid | ≤ 40 | benefits, premium |
| `RiderRequest` | — | riderName ≤ 100, riderDescription ≤ 250 | minLimit, maxLimit (sum-assured bounds) |
| `GroupTermRequest` / `IndividualTermRequest` | — | — | age (+ term), maleRate, femaleRate, rateUnit; individual adds maxDiscount, maxLoad |
| `QuestionRequest` | question | question ≤ 250, category ≤ 50 | questionType Text/Multiselect/Numeric/Radio; ranges with weight + critical |
| `AnswerRequest` | — | answer ≤ 250 | questionUuid, possibleAnswerUuid, benefitUuid |
| `ClaimRequest` | — | comment ≤ 1000 | claimUuid |
| `ReinsuranceTreatyRequest` | — | treatyDescription ≤ 500, treatyCode ≤ 60 | treatyType Surplus/Risk_Premium; reinsuranceCoverage Term_Only/Term_And_Riders; retention limits |
| `TreatyMemberRequest` | — | — | participationType Leader/Follower; share, commissions |
| `ReinsurerRequest` | — | name ≤ 100, phone ≤ 13, email ≤ 50, address ≤ 50 | |

Numbers have **no** min/max in the schemas (e.g. negative sums assured, shares over 100 %, age ranges where
min > max are not rejected by the contract) → gap G9 asks the backend to add bean validation and expose it.
