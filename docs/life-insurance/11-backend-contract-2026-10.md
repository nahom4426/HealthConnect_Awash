# Life service: contract changes for the frontend

Base path `/api/life`. All endpoints need a bearer token. Errors use `ApiErrorNew` (`type`, `title`, `status`, `detail`, `properties`). Status codes:

- 400: validation; field errors are in `properties.errors`.
- 401: no token or an invalid token.
- 403: missing privilege or no access to the record's branch.
- 404: unknown UUID.
- 409: invalid status transition.
- 422: a valid request the business rules can't process, e.g. no matching active rate or an event outside cover.

Money is a JSON number with 2 decimals, dates are `yyyy-MM-dd`, and statuses are enums. New list endpoints return `{content, page, limit, totalPages, totalElements}` with a 1-based `page`.

## Behaviour changes on existing endpoints

- **Quotation steps run in order.** Issue needs PENDING, accept needs ISSUED, pay needs ACCEPTED, and policy issue needs PAID with the policy PENDING; otherwise 409. Repeating a step returns 409 and no longer consumes a number.
- **Quotation issue** also returns 409 while any member's underwriting case is undecided (G4).
- **`PUT /quotation/{uuid}`**:
  - ignores `quotationStatus`, `quotedByUuid` and `quotedByFullName` (#19: quoted-by comes from the token);
  - returns 409 once the quotation is ACCEPTED or PAID.
- **`PUT /policy/issue/{q}`**:
  - needs `beginDate` and `endDate`, and `endDate` must be after `beginDate`;
  - gives every member their own `insuranceId`;
  - creates the premium schedule;
  - on a renewal, marks the old policy RENEWED.
- **Legacy claim steps** (request, review, approve, deny) now enforce their order with 409. An unknown claim returns 404 instead of HTTP 200 with a message. Payment order numbers now count up.
- **Benefits (individual policies):**
  - Premiums are calculated by the server; the `termPremium` and rider `premium` fields you send are ignored.
  - `endDate` is `beginDate` plus `insuranceTerm` **years**; it used to add days.
  - Changing or deleting a policy after issue returns 409.
- **Bulk PUTs** validate every row.
- **Users without the privilege now get 403.** This used to come back as 500.
- **New response fields on `QuotationResponse`:**
  - `termPremium`, `riderPremium`, `grossPremium` (#16);
  - `calculated*` tax fields, null until the tax rates are configured;
  - `totalElements` on paged lists (#3).

## Phase 1

| # | Change |
|---|---|
| #1 | Bearer `securityScheme` declared and applied to every operation. |
| #2 | Error responses (400/401/403/404/409/422) documented on every operation. Shares must be 0–100, ranges need `minAge ≤ maxAge` and `lower ≤ upper`, and bad params or enums return 400. |
| #3 | `totalElements` on the first item of paged lists, next to `totalPages`. |
| #4 | `GET /quoted-rider/{quotedRiderUuid}` now returns `QuotedRiderResponse`; the lookup was by the wrong UUID. `GET /policy-treaty/mapping/list/{q}` really returns one object, because a quotation has one active mapping. |
| #5 | The insured import accepts `quotationUuid`; `qutoationUuid` still works and is deprecated. |
| #6, #26 | `PUT /quotation/{q}/pay` takes `{receiptNumber, receiptDate, withHoldingTax?, revenueStamp?, netPremium?}`; `requestedPremium` is the server's gross premium. `PUT /claim/{c}/deny` takes `{comment}` (2–500 characters). The query-string versions still work and are deprecated. |
| #9 | `POST /reinsurance/fcl-group` always accepted `reinsuranceTreatyUuid`; Swagger showed the wrong class. An unknown treaty returns 404. |
| #10 | The range PUT accepts `fclMedicalUnderwritingRanges.insuranceType`; leave it out to keep the current type. `fclMedicalParameters`: omitted keeps the requirements, a list replaces them, an empty list clears them. |
| #27 | `GET /benefit/quote?dateOfBirth&gender&beginDate&term&termBenefit&riders=uuid:amount,…` returns `{age, termRate, rateUnit, termPremium, riders[{riderUuid, benefit, rate, rateUnit, premium}], totalPremium, totalBenefit}`. Saving a benefit or rider benefit prices it and keeps `totalPremium` and `totalBenefit` up to date. A draft missing any pricing input (date of birth, gender, start date, term, term benefit) is saved with premium 0. |
| #28 | Age is **age next birthday at beginDate**, the same basis as the rate tables and group pricing. The backend works it out. |
| #29 | `GET /benefit/benefits/{status}?page&limit&search` (without these params it returns everything, as before). `GET /individual-rider-benefit/active/benefits?benefitUuid=`. `GET /answer?benefitUuid=` or `?personUuid=`. |

## G10: privileges

The codes follow `life.<resource>.<action>`. The existing ones keep working. These are new:

- **Claims:** `life.claim.register`, `life.claim.assess`, `life.claim.authorize`, `life.claim.pay`, `life.claim.request_info`
- **Customers:** `life.customer.create`, `life.customer.read`, `life.customer.update`, `life.customer.verify`
- **Beneficiaries:** `life.beneficiary.read`, `life.beneficiary.update`
- **Underwriting:** `life.underwriting.read`, `life.underwriting.decide`
- **Policies:** `life.benefit.issue`, `life.benefit.service`, `life.policy.service`
- **Premiums:** `life.premium.read`, `life.premium.pay`
- **Documents:** `life.document.create`, `life.document.read`, `life.document.delete`
- **Dashboard and reports:** `life.dashboard.read`, `life.report.read`

How your `Life_*` names map:

| Your name | Our code(s) |
|---|---|
| Read | `life.*.read` |
| Product_Manage, Rate_Manage | `life.rider.*`, `life.insurance_term.*`, `life.group_term.*` |
| Quotation_Create | `life.quotation.create` |
| Quotation_Issue | `life.quotation.update` |
| Payment_Record | `life.quotation.update`, `life.premium.pay` |
| Policy_Issue | `life.policy.update`, `life.benefit.issue` |
| Policy_Service | `life.policy.service`, `life.benefit.service` |
| Underwriting_Decide | `life.underwriting.decide` |
| Reinsurance_Manage | `life.reinsurance_*` |
| Claim_Prepare | `life.claim.create`, `life.claim.update` |
| Claim_Review | `life.claim.update`, `life.claim.register`, `life.claim.assess` |
| Claim_Approve | `life.claim.update` |
| Claim_Authorize | `life.claim.authorize` |
| Claim_Pay | `life.claim.pay` |
| Report_View | `life.report.read`, `life.dashboard.read` |

Default roles: Claims Adjuster gets register, assess and request_info. Branch Manager gets authorize, pay and issue. Underwriter gets the underwriting, customer and beneficiary codes.

## G3: claims

**Status** (`LifeClaimStatus`, #7):

- Main path: SAVED → REQUESTED → REGISTERED → REVIEWED → APPROVED → AUTHORIZED → PAID.
- REJECTED is final.
- INFO_REQUESTED sends the claim back to the agency, which can request it again.

**Endpoints:**

| Method and path | What it does |
|---|---|
| `POST /claim/v2` | Registers a claim with `LifeClaimRequest` (below) and returns 201 with `LifeClaimResponse`. The claim is SAVED. |
| `PUT /claim/agency/request` | Existing endpoint, `{claimUuid, comment}`. SAVED or INFO_REQUESTED → REQUESTED. |
| `PUT /claim/insurance/register` | `{claimUuid, comment}`. REQUESTED → REGISTERED, and assigns `claimNumberCode` CLN/LIFE/NNNN/YY (#23). |
| `PUT /claim/insurance/review` | Existing endpoint. REGISTERED → REVIEWED; every checklist document must be attached. |
| `PUT /claim/{c}/assessment` | `{eligibleAmount, approvedAmount, deductions[{reason, amount}], outstandingPremiumDeducted, decisionNote}`. Allowed on REVIEWED. |
| `PUT /claim/insurance/approve` | Existing endpoint. Needs the assessment. Goes to AUTHORIZED at once when `netPayable` ≤ 50,000 (`life.claims.auto-authorize-limit`). |
| `PUT /claim/insurance/authorize` | `{claimUuid, comment}`. APPROVED → AUTHORIZED. |
| `PUT /claim/insurance/pay` | `{claimUuid, payments[{payeeUuid, amount, paymentOrderNumber?, paymentVoucherNumber, paymentDate, bankTransactionCode?}]}`. PAID once every payee is paid. |
| `PUT /claim/{c}/request-info`, `PUT /claim/{c}/reject` | `{comment}`. |
| `GET /claim/v2/{c}` | Claim detail. |
| `GET /claim/v2/list?status&search&page&limit` | Paged list. |
| `GET /claim/required-documents?claimType=` | The document checklist. |

**`LifeClaimRequest`:**

- `insuredPersonUuid` or `benefitUuid` (exactly one)
- `claimType`; plus `riderUuid` for ACCIDENTAL_DEATH, TOTAL_PERMANENT_DISABILITY, CRITICAL_ILLNESS and RIDER
- `eventDate`, `causeOfEvent`, `placeOfEvent?`, `suspectedSuicide`
- `notifiedBy{name, relationship, phone}`
- `claimedAmount`
- `payees[{beneficiaryUuid?, name, sharePercent, bankName, accountNumber}]`

**Rules:**

- The event must fall within the cover and the policy must be ACTIVE, otherwise 422.
- MATURITY and SURRENDER return 422: term cover has neither.
- A rider claim needs a rider attached to the cover.
- `claimedAmount` and `approvedAmount` can't exceed the sum assured.
- Payee shares must add up to 100. With no payees, the active PRIMARY beneficiaries are used; if there are none, you get 422 and must name the statutory heirs.
- `contestable` and `suicideExclusionFlag` are flags for the assessor, set from `life.claims.*`.
- `netPayable` = approved − deductions − outstanding premium deducted. It's split among the payees by share.
- Each payment must equal the payee's amount, and the payee needs bank details.

**Response:** `LifeClaimResponse` carries all of the above plus `documents[{documentType, description, received}]`, `payees`, `payments` and `outstandingPremium`. `ClaimListResponse.passportNumber` and `destinationCountry` are deprecated.

**#24:** `POST /claim` returns the claimUuid as plain text. The legacy step strings are Pending, Requested, Declined, Reviewed, Approved, Authorized and Paid.

**#25:**

- One file per upload; `fileNames` is that file's label. It's cleaned, not split on commas.
- New optional `documentType`, using a type from the checklist.
- Allowed types and size come from `life.documents.*`: pdf, jpg, jpeg and png, up to 10 MB. Wrong type or size returns 400.
- A file-server failure returns 502 instead of 200.

## G1: beneficiaries

- `GET /beneficiary/list?insuredUuid|benefitUuid` returns the current designation. If none was ever made, you get version 0 with `statutoryDefault=true`.
- `PUT /beneficiary/designation` takes `BeneficiaryDesignationRequest`, as you specified, and replaces the whole designation in one transaction.
- `GET /beneficiary/{uuid}` returns one beneficiary.
- `GET /beneficiary/history?…` returns every version, newest first; old versions are SUPERSEDED.
- **Rules:** exactly one subject; shares per type add up to 100; at least one PRIMARY unless `statutoryDefault`; under-18s need `guardianName` and `guardianPhone`; 409 while a death claim on that subject is open.

## G2: customers

- `POST /customer`, `PUT /customer/{uuid}`, `GET /customer/{uuid}`
- `GET /customer/list?type&search&page&limit`
- `GET /customer/duplicate-check?idNumber&phone&dateOfBirth` returns `[{customer, matchedOn}]`.
- `GET /customer/{uuid}/policies`
- **New:** `PUT /customer/{uuid}/kyc {kycStatus, note}`. VERIFIED returns 409 while due-diligence fields are missing.
- **Rules:**
  - `idNumber` is unique per `idType` (409).
  - INDIVIDUAL needs name, gender, date of birth, ID and phone; CORPORATE needs `corporate.name` and `corporate.tin`.
  - The response includes `age`.
  - Editing a VERIFIED customer's identity sets the status back to INCOMPLETE.
- **Benefit link:** `BenefitRequest` accepts `customerUuid`, `payerCustomerUuid` and `paymentFrequency` (ANNUAL, SEMI_ANNUAL, QUARTERLY or MONTHLY).

## G4: underwriting

`{subject}` is an insuredUuid (group member) or a benefitUuid (individual policy).

- `POST /underwriting/evaluate?quotationUuid|benefitUuid` opens cases:
  - **Group:** members above the quotation's FCL, so generate the treaty report first.
  - **Individual:** critical answers, a score at or above `life.underwriting.refer-score`, or a match on the Individual medical range.
- `GET /underwriting/queue?quotationUuid|benefitUuid&status`
- `GET /underwriting/{subject}` returns answers with weights, score, reasons, requirements, `maxLoadPercent` and the decision.
- `PUT /underwriting/{subject}/decision` takes `{decision, loadingPercent?, exclusions?, postponeUntil?, note}`. It returns 409 while requirements are outstanding or once the quotation/policy is past PENDING. LOADED must be at or below `maxLoadPercent`.
- `PUT /underwriting/{subject}/medical-requirement/{r}` takes `{status: RECEIVED|WAIVED|OUTSTANDING, receivedDate, result}`.
- **Effect of the decision:**
  - LOADED raises the term premium.
  - DECLINED or POSTPONED takes a group member out of cover (premium 0) and blocks issuing an individual policy.
  - Case statuses: PENDING_UNDERWRITING, REQUIREMENTS_OUTSTANDING, DECIDED.

**Questionnaire answers:**

- **#12:** `cascadedQuestion` is free follow-up text, up to 500 characters, not a UUID.
- **#13:** score = the sum of the weights of the chosen options (or of the range a numeric answer falls in). Any critical answer refers the proposal. A score threshold applies only once one is configured.
- **#14:** `PUT /question/{uuid}` now replaces the options and ranges you send; leave a list out to keep it. New `PUT /question/{uuid}/status?status=`. `GET /question/{uuid}` now includes options and ranges.
- **#15:** `GET /question` with no `status` returns every status. Deleting a library answer still used by a question returns 409.

## G11: individual policy issue

`PUT /benefit/{uuid}/issue` takes the policy from PENDING to ACTIVE. It needs:

- complete pricing inputs;
- a customer whose KYC is VERIFIED;
- underwriting that is clear or accepted.

It returns 409 if any of those is missing. On success it:

- sets `policyNumber` (Africa/Policy/Ind/NNNN/YY) and `issuedDate`;
- keeps `endDate` = begin + term years;
- re-prices the policy and activates its riders;
- creates the premium schedule.

Questionnaire answers and beneficiaries link through `benefitUuid` (#30).

## G6: premiums

| Method and path | What it does |
|---|---|
| `GET /premium/schedule?quotationUuid\|benefitUuid` | Items `{dueDate, kind: REGULAR\|ENDORSEMENT\|REFUND, grossPremium, withholdingTax, revenueStamp, netPremium, amountDue, amountPaid, status: DUE\|PAID\|OVERDUE\|WAIVED, daysOverdue}` |
| `POST /premium/payment` | `{scheduleItemUuid, amount, receiptNumber, receiptDate, method, reference}`. The amount must equal `amountDue`, and receipt numbers are unique. |
| `GET /premium/payments?…&from&to&page&limit` | Payments, for one policy or by date. |
| `GET /premium/outstanding?…&asOf` | Unpaid items due on or before `asOf`. |
| `GET /premium/receipt/{paymentUuid}` | Receipt PDF. |

- **Group:** one PAID item for the single premium, created at policy issue.
- **Individual:** the annual premium split by `paymentFrequency`; the last installment of each year absorbs the rounding.
- **OVERDUE** means past the due date plus `life.premium.grace-days` (30).
- **Taxes stay null until rates are configured.**

## G5: servicing

- `GET /policy/{quotationUuid}` returns the policy detail: premiums, members, sum assured, schedule, outstanding premium, endorsements and underwriting (#20).
- `PUT /policy/{q}/cancel|lapse|reinstate|renew` and the same under `/benefit/{uuid}/…`. The body is `{effectiveDate, reason, note, healthEvidenceReceived?}`.
- `POST /policy/{q}/endorsement` and `/benefit/{uuid}/endorsement` take `{type, effectiveDate, note, insured[…]}` and return `premiumAdjustment`, the pro-rata premium calculated by the server. Group policies accept ADD_MEMBER, REMOVE_MEMBER and CHANGE_SUM_ASSURED; individual policies accept CHANGE_SUM_ASSURED only.
- `GET …/endorsements` lists them.
- **Lapse** needs a premium unpaid past the grace period (409 otherwise).
- **Reinstate** is allowed within 24 months of lapse, with arrears paid, and needs `healthEvidenceReceived` after 90 days.
- **Cancel** waives future installments and refunds the unearned premium × `life.servicing.cancellation-refund-percent`. With that unset, `refundAmount` is null.
- **Renew** creates a PENDING renewal and returns its UUID as `renewalUuid`. The old policy becomes RENEWED when the renewal is issued.
- **Expiry:** a nightly job moves ACTIVE policies to EXPIRED at `endDate`.

## G7: documents

- `POST /document` (multipart: `ownerType`, `ownerUuid`, `documentType`, `file`)
- `GET /document/list?ownerType&ownerUuid` returns all versions, with `latest=true` marking the current one.
- `GET /document/{uuid}/open`
- `DELETE /document/{uuid}` returns 409 when the owner is an issued policy.
- `GET /policy/{uuid}/schedule.pdf` takes a quotationUuid or a benefitUuid.

Each upload is a new version, and documents are stored in the database. Allowed types and size come from `life.documents.*`.

## G8: dashboard and reports

- `GET /dashboard/summary?from&to` returns:
  - counts by quotation, group policy, individual policy and claim status;
  - `grossWrittenPremium`: premium falling due in the period, less refunds;
  - `premiumCollected`, `premiumOutstanding`, `claimsPaid`;
  - `sumAssuredInForce`;
  - `expiring` within 30, 60 and 90 days.
- `GET /report/{name}?from&to&format=json|xlsx`, where name is one of: `policy-register`, `premium-register`, `claims-register`, `outstanding-premium`, `expiring-policies`, `underwriting-decisions`, `reinsurance-bordereau`.
- Group data is limited to the caller's branches.

## G13: history

`GET /quotation/{q}/history`, `GET /policy/{q}/history` and `GET /benefit/{uuid}/history` return `[{action, fromStatus, toStatus, detail, actorUuid, actorName, occurredAt}]`, oldest first.

## Answers

- **#8:** the three bulk PUTs **upsert the rows you send**. Rows without a UUID, or with an unknown one, are created. Rows you leave out are untouched. FCL groups and ranges are always saved ACTIVE.
- **#10:** see Phase 1.
- **#11:** rider rate rows have no default status, so send ACTIVE. Rate lookups for pricing and `/rate` read only ACTIVE rows.
- **#17:** revise now works as renewal. It's allowed from a PAID quotation whose policy is ACTIVE or EXPIRED, and returns 201 with the new quotation and its new UUID.
- **#18:** `endDate` isn't forced to begin + term; it only has to be after `beginDate`. `beginDate` may be before the payment date.
- **#21:** returns a JSON message. It is now safe to call again: the previous report rows are replaced.
- **#22:** `search` on `/policy/lists` matches `institutionName` only.
- **D5:** the code doesn't decide who the agency is; in the data it is the policyholder institution. Our suggestion is the institution's HR contact (group) or the agent or branch officer (individual), who prepares the claim with `life.claim.create` and `life.claim.update`. This needs a business decision.
- **D9:** yes. Group quotations reference the institution in the party service, and records are scoped by branch.

## Migrations

`0004_history`, `0005_customers`, `0006_beneficiaries`, `0007_claims_v2`, `0008_underwriting`, `0009_premiums_servicing`, `0010_documents`. All are additive and roll back automatically with Liquibase.

## Not done, and why

- **G12 credit life:** the request makes it conditional on selling the product. Not built.
- **Tax rates:** no rates exist anywhere in the system. Until finance confirms the withholding % and the revenue stamp (% or fixed amount), pay still takes the three amounts. Once they're configured, pay needs only the receipt.
- **Cancellation refund %:** the business hasn't set it, so no refund is calculated.
- **Money in the old tables** stays `double` internally; JSON is unchanged. New tables use NUMERIC(15,2).
- **Claim payment order prefix** `CPO//FETAP/` is kept as it is. Changing it changes the number format, so it needs a business decision.
