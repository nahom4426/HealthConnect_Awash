# 10 · Backend prompt (copy everything inside the box)

Self-contained: the backend team doesn't need any other file. Source of every item:
[09-backend-gaps-and-change-requests.md](09-backend-gaps-and-change-requests.md) (gap numbers G1–G13, and items 1–30
under G9). Written 2026-10-29, after frontend stages 1–8.

````text
You are working on the Life Insurance Spring Boot service (OpenAPI at /api/life/v3/api-docs, 169 operations,
25 controllers). The web frontend (Vue, Standard Insurance) is already built against the CURRENT contract:
products & rates, reinsurance, underwriting questionnaire, group quotations → policies, claims, and individual
policies. Everything below is what the frontend needs from you. Gap codes (G1…G13) and item numbers (#1…#30)
match the frontend's tracking document, so please keep them in your replies.

═══════════════════════════════════════════════════════════════════════════════════════════════
BLOCKER — FIX FIRST (found 2026-10-29)
═══════════════════════════════════════════════════════════════════════════════════════════════
With a valid token from the AuthService login (user admin2, role "admin"), EVERY Life endpoint returns
500 {"type":"internal.error","title":"Unexpected error","detail":"An unexpected error occurred."}: e.g.
GET /rider/active, /group-term/list?status=ACTIVE, /reinsurance/reinsurer/list, /reinsurance/medical-parameter/list,
/question?status=ACTIVE, /quotation/list?status=PENDING. An invalid token correctly gets 401 "Invalid JWT token",
so the token is parsed and the failure happens after authentication (user/role lookup from the token, a missing
module or claim in the JWT, or the database). Please look at the Life service log for that request, fix it, and
make the error handler log the root cause instead of a bare 500. Nothing in the frontend can be tested live until
this works.

New privileges and roles: 16 privileges named Life_* (category "Life") and 8 roles named "Life …" were created
through POST /auth/users/privilege/add and /auth/users/role/add, and added to the "admin" role. The AuthService
stored them with moduleType "health" because the request has no module field — add a moduleType (e.g. "life") to
the privilege and role requests, or tell us how a privilege is assigned to the Life module. The Life service must
check these names (G10).

Stale privileges at login: after the 16 Life privileges were added to the "admin" role (155 privileges), signing
in as an admin user still returned the old 139. They only appeared after the user was saved again through
PUT /auth/users/{uuid} with the same role. So the AuthService keeps a per-user copy of the role's privileges and
doesn't refresh it when the role changes. Recompute the user's privileges from the role at login (or refresh every
user of a role when the role is updated). Also: GET /auth/users/user/{uuid} returns no privileges, so the app
can't refresh them without a new login.

═══════════════════════════════════════════════════════════════════════════════════════════════
FOLLOW-UPS AFTER YOUR CONTRACT OF 2026-10 (found 2026-10-31)
═══════════════════════════════════════════════════════════════════════════════════════════════
1. The Life service is unreachable: 192.168.100.251:8194 refuses connections and the gateway on :8888
   returns 500 for /api/life/**. Nothing of the new contract could be checked live yet.
2. AuthService ignores ?moduleType= on GET /auth/users/privilege/list and /auth/users/role/all (every
   module comes back), and the records no longer include moduleType. The admin screens' module filter
   therefore shows everything. Please apply the filter and return moduleType on each record.
3. life.claim.update is the code for preparing, reviewing AND approving a claim (your G10 mapping), so any
   role allowed to prepare a claim may also review and approve it. Please split it (e.g. life.claim.review,
   life.claim.approve) so the agency, the claims officer and the claims manager can be told apart.
4. The 8 frontend roles "Life …" now hold your life.* codes (mapped from your table) plus our Life_* names;
   the screens accept either. Say if you'd rather we used only your default roles (Claims Adjuster, Branch
   Manager, Underwriter).

Found in the live test run (2026-10-31, after the service came back; test data is marked "TEST"):
5. POST /insuredperson returns 500 "constraint.violation / Database error" when position or branchOffice is
   missing, although InsuredRequest marks both optional. Make them required in the DTO with a 400, or allow
   null in the database. (The UI now requires both.)
6. Members whose age has no active group-term rate are priced at 0 (quotation Africa/Policy/Quote/0003/26:
   gross premium 0.00 through issue, pay and policy issue). Your contract says this should be 422 "no matching
   active rate". Please refuse instead of pricing at 0.
7. GET /claim/claim-approver-details?claimUuid= returns 500 for a claim nobody has signed off yet, and
   GET /claim/logs?claimUuid= returns 500 once the claim has been requested. Both should return [] / the log.
8. Data to check with the business: rider "Demeke" has min/max sum assured 0.05–0.1; the older paid quotation
   Africa/Policy/Quote/0002/26 has net premium 250,000 against a gross premium of 4.20.

Found in the claims v2 run (2026-10-31, TEST claim 7843fbd1-e01f-4084-874f-9899ecc2aaac on member
Africa/Policy/Cnt/0005/26/0001):
9.  POST /claim-attachment never answers when a file is sent: a 50-byte PDF or text file hangs for 25 s+
    and nothing is stored. Without a file it answers 500 at once, and without a token 401 at once, so the
    request reaches the service and stalls while storing the file. This blocks every claim at REGISTERED
    (review needs every checklist document). Please check the attachment storage path / disk.
10. Registering a claim again after INFO_REQUESTED gives it a new claimNumberCode (CLN/LIFE/0001/26 became
    CLN/LIFE/0002/26). Keep the number assigned at the first registration.
11. POST /claim/v2 sets requestedDate when the draft is saved (status SAVED). It should stay null until the
    agency submits (PUT /claim/agency/request). The UI ignores it on drafts for now.

═══════════════════════════════════════════════════════════════════════════════════════════════
GENERAL RULES
═══════════════════════════════════════════════════════════════════════════════════════════════
- Never break existing endpoints, paths, field names or enum values. Add new endpoints or optional fields;
  where an old contract is wrong, add the corrected one alongside and mark the old one @Deprecated.
- Follow the existing architecture: controller/service/repository/DTO/mapper layering, BaseEntity/audit
  fields, UUID identifiers, status enums, soft delete with `deleted`, list params page (1-based)/limit/search.
- Reuse existing entities (InsuredPerson, Benefit, Quotation, Claim, Rider, ReinsuranceTreaty…).
- DB changes through migrations (Flyway/Liquibase, whichever the project uses), additive and reversible.
- Money as BigDecimal (JSON number, 2 dp), dates ISO-8601, UUIDs as strings, statuses as enums.
- ALL money and tax calculations stay in the backend (premiums, rider premiums, discounts/loadings,
  pro-rata, withholding tax, revenue stamp, claim amounts). The frontend never computes money and never
  sends a premium it worked out. Where a request DTO has a premium field today, compute it server-side and
  ignore what the client sends.
- Bean validation on every request DTO; 400 with field errors in the existing error format, 401/403 for
  auth, 404 for unknown UUIDs, 409 for invalid status transitions (clear message).
- Enforce Life privileges server-side (G10), not only in the UI.
- Document everything in Swagger: bearer securityScheme, request/response schemas, enums, error responses.
- Tests: controller tests for every new/changed endpoint (happy path, validation error, unauthorized,
  invalid transition) and service tests for business rules.

═══════════════════════════════════════════════════════════════════════════════════════════════
PHASE 1 — QUICK, HIGH VALUE (do first)
═══════════════════════════════════════════════════════════════════════════════════════════════

A. PRICING — the frontend shows "—" for premiums until these exist
 #27 Individual policies: BenefitRequest.termPremium and IndividualRiderBenefitRequest.premium expect the
     client to send premiums, but the API only returns rates (GET /insurance-term/calculate-term-premium
     returns the rate row, not an amount). The frontend sends neither field.
     → On POST/PUT /benefit and POST/PUT /individual-rider-benefit, price the term benefit and each rider
       (rate × sum assured ÷ rateUnit, with discount/loading), ignore client premiums, and return
       termPremium, rider premium, totalPremium, totalBenefit.
     → Add a priced quote: GET /benefit/quote?dateOfBirth&gender&beginDate&term&termBenefit
       &riders=riderUuid:benefit,… returning { age, termRate, rateUnit, termPremium,
       riders:[{riderUuid, rate, premium}], totalPremium } so the form can show the premium before saving.
 #28 Confirm the age basis for rates (age last birthday vs nearest birthday, at cover start). The UI uses
     age last birthday at the start date for the rate lookup; better: the backend derives age itself.
 #16 Group quotations: QuotationResponse has no totals while draft/issued. Return gross premium
     (term + riders), withholding tax, revenue stamp and net premium as soon as the quotation is priced.
     Then PUT /quotation/pay only needs receipt number + date (today finance types all four amounts).

B. CONTRACT FIXES (G9)
 #1  Declare the bearer security scheme in OpenAPI (every Life endpoint already returns 401 without it).
 #2  Bean validation + documented 400/401/403/404/409 responses (@NotNull, @Positive, @DecimalMax("100")
     for shares, minAge ≤ maxAge, lower ≤ upper, date ordering).
 #3  Pagination: add totalElements to paged lists (or { content, page, limit, totalPages, totalElements }
     on new endpoints).
 #4  Fix documented types: GET /quoted-rider/{uuid} → QuotedRiderResponse (documented as QuotationResponse);
     GET /policy-treaty/mapping/list/{quotationUuid} → array (documented as one object);
     PUT /policy/generate/treaty-report/{quotationUuid} → document the response (#21).
 #5  Insured import: accept quotationUuid as an alias of the misspelled qutoationUuid (keep the old name).
 #6  PUT /quotation/pay and PUT /claim/deny take inputs in the query string → accept a JSON body
     (keep the old form working). #26: long deny reasons get cut by URL limits.
 #7  Type claim statuses as an enum (see G3 for values).
 #19 QuotationRequest.quotedByUuid / quotedByFullName are sent by the UI from the signed-in user → take them
     from the token so they can't be spoofed.
 #29 Paging/search on GET /benefit/benefits/{status}; add ?benefitUuid= to
     GET /individual-rider-benefit/active/benefits (today it returns every policy's riders and the UI filters).
     Same for GET /answer (returns every answer in the system): add ?personUuid / ?benefitUuid.
 #9  FclGroupRequest (POST /reinsurance/fcl-group) has no reinsuranceTreatyUuid → add it so a band can be
     added to an existing treaty.
 #10 FclMedicalUnderwritingRangeUpdateRequest has no insuranceType → add it (Group/Individual can't be
     changed after creation today).

C. PRIVILEGES (G10)
 Seed AuthService privileges for Life and enforce them server-side:
 Life_Read, Life_Product_Manage, Life_Rate_Manage, Life_Quotation_Create, Life_Quotation_Issue,
 Life_Payment_Record, Life_Policy_Issue, Life_Policy_Service, Life_Underwriting_Decide,
 Life_Reinsurance_Manage, Life_Claim_Prepare, Life_Claim_Review, Life_Claim_Approve, Life_Claim_Authorize,
 Life_Claim_Pay, Life_Report_View.

═══════════════════════════════════════════════════════════════════════════════════════════════
PHASE 2 — CRITICAL FEATURES
═══════════════════════════════════════════════════════════════════════════════════════════════

G3 · LIFE CLAIMS (claims desk can only review/approve/reject today; authorize and pay don't exist)
 Problem: POST /claim takes only insuredPersonUuid; ClaimRequest is {claimUuid, comment}; ClaimListResponse
 carries travel fields (passportNumber, destinationCountry); there are for-authorization/authorized/paid lists
 but no authorize or pay action; statuses are untyped strings.
 New endpoints (additive):
   POST /claim/v2                        register a claim with data (keep POST /claim working)
   PUT  /claim/{claimUuid}/assessment     assessor records eligible and approved amounts
   PUT  /claim/insurance/authorize        body ClaimRequest
   PUT  /claim/insurance/pay              record payment per payee
   GET  /claim/required-documents?claimType=…   document checklist
   + a register step (#23): how does a claim move from insurance "requested" to "registered"? Add
     PUT /claim/insurance/register (or document the automatic rule).
 LifeClaimRequest: { insuredPersonUuid?, benefitUuid?, claimType: DEATH|ACCIDENTAL_DEATH|
   TOTAL_PERMANENT_DISABILITY|CRITICAL_ILLNESS|MATURITY|SURRENDER|RIDER, eventDate, causeOfEvent,
   placeOfEvent?, notifiedBy:{name, relationship, phone}, claimedAmount,
   payees:[{beneficiaryUuid?, name, sharePercent, bankName, accountNumber}] }
 Assessment: { eligibleAmount, approvedAmount, deductions:[{reason, amount}], outstandingPremiumDeducted,
   decisionNote }
 Payment: { payeeUuid, amount, paymentOrderNumber, paymentVoucherNumber, paymentDate, bankTransactionCode }
 Response: extend ClaimListResponse with the fields above; mark travel fields @Deprecated.
 Rules: event date within cover; claim type covered (term or attached rider); payee shares sum to 100 and
 default to the beneficiary designation (G1); contestability window and suicide exclusion are product
 parameters flagged for the assessor; approvedAmount ≤ sum assured; checklist documents required before review.
 Status enum: SAVED → REQUESTED → REGISTERED → REVIEWED → APPROVED → AUTHORIZED → PAID, plus REJECTED and
 INFO_REQUESTED (back to the agency with a comment).
 Also answer: #24 POST /claim returns the new claimUuid as a plain string — confirm; list the status values.
 #25 POST /claim-attachment fileNames: one name per upload or comma-separated for several? Allowed file
 types and size limit?

G1 · BENEFICIARIES (legal: Ethiopian Commercial Code Art. 701 presumes spouse and children when none named)
   GET /beneficiary/list?insuredUuid=… | ?benefitUuid=…
   PUT /beneficiary/designation          replace the whole designation for one insured, one transaction
   GET /beneficiary/{beneficiaryUuid}
   GET /beneficiary/history?insuredUuid=…
 BeneficiaryDesignationRequest: { insuredUuid?, benefitUuid?, statutoryDefault: boolean,
   beneficiaries:[{ beneficiaryUuid?, type: PRIMARY|CONTINGENT, firstName, fatherName, grandFatherName,
   relationship: SPOUSE|CHILD|PARENT|SIBLING|OTHER, dateOfBirth, gender,
   idType: NATIONAL_ID|KEBELE_ID|PASSPORT|OTHER, idNumber, phone, address, sharePercent,
   guardianName?, guardianPhone? }] }
 Rules: exactly one of insuredUuid/benefitUuid; shares per type sum to 100 (2 dp); ≥1 PRIMARY unless
 statutoryDefault; minors (<18) need guardian fields; locked while a death claim on that insured is open.
 Statuses: ACTIVE, SUPERSEDED. DB: beneficiary, beneficiary_designation_history.

G2 · POLICYHOLDER / CUSTOMER WITH KYC (AML/CFT due diligence; one person can hold several policies)
   POST /customer, PUT /customer/{uuid}, GET /customer/{uuid},
   GET /customer/list?type=INDIVIDUAL|CORPORATE&search&page&limit,
   GET /customer/duplicate-check?idNumber&phone&dateOfBirth, GET /customer/{uuid}/policies
 CustomerRequest: { type, title, firstName, fatherName, grandFatherName, gender, dateOfBirth, nationality,
   idType, idNumber, tin?, occupation, employer?, phone, email?, region, zone?, woreda?, kebele?,
   houseNumber?, sourceOfIncome?, corporate:{ name, tin, licenseNumber, sector, contactPerson,
   contactPhone }? }
 Response: fields + customerUuid, kycStatus (INCOMPLETE|VERIFIED|REJECTED), audit.
 DB: customer; FK customer_uuid on benefit (policyholder) and optional payer_customer_uuid.
 Rules: idNumber unique per idType; age from dateOfBirth; corporate requires TIN.

G4 · UNDERWRITING DECISIONS
   GET /underwriting/queue?quotationUuid|benefitUuid&status
   GET /underwriting/{insuredUuid}        answers + score + required medical tests from the treaty ranges
   PUT /underwriting/{insuredUuid}/decision
   PUT /underwriting/{insuredUuid}/medical-requirement/{requirementUuid}   received / result
 Decision: { decision: STANDARD|LOADED|EXCLUSION|POSTPONED|DECLINED, loadingPercent?, exclusions?: string[],
   postponeUntil?, note }
 Rules: members above the group FCL / individuals above the medical range need requirements received before a
 decision; a critical answer forces manual review; loading ≤ the term's maxLoad; a quotation can't be issued
 while any insured is PENDING_UNDERWRITING. Per-insured status: PENDING_UNDERWRITING,
 REQUIREMENTS_OUTSTANDING, DECIDED.
 Questionnaire questions to answer:
 #12 PossibleAnswerBriefRequest.cascadedQuestion: free follow-up text (UI's current reading, ≤250) or another
     question's UUID?
 #13 How weight and critical are used: how the score is totalled, the threshold that refers a proposal,
     whether one critical answer always refers it.
 #14 Confirm PUT /question/{uuid} replaces answer options and ranges with the lists sent, or add
     PUT /question/{uuid}/status (the UI resends the whole question to change status).
 #15 GET /question requires status (no "all" view) — fine or add it? Can a library answer still used by
     questions be deleted, and what happens to those questions?

G11 · INDIVIDUAL POLICY ISSUANCE
   PUT /benefit/{uuid}/issue   generates policyNumber, sets dates, status ACTIVE (today drafts can't become
   ACTIVE: BenefitRequest has no status and there is no issue endpoint — #30).
 Say what endDate the backend sets (begin + term?) and when policyNumber is generated. Link the policy to the
 customer (G2), questionnaire answers (G4) and beneficiaries (G1).

═══════════════════════════════════════════════════════════════════════════════════════════════
PHASE 3 — SERVICING, MONEY, DOCUMENTS, REPORTING
═══════════════════════════════════════════════════════════════════════════════════════════════

G6 · PREMIUM SCHEDULE AND PAYMENTS
   GET  /premium/schedule?quotationUuid|benefitUuid
   POST /premium/payment                  JSON body
   GET  /premium/payments?…
   GET  /premium/outstanding?…&asOf=
   GET  /premium/receipt/{paymentUuid}    PDF
 Schedule item: { dueDate, grossPremium, withholdingTax, revenueStamp, netPremium,
   status: DUE|PAID|OVERDUE|WAIVED }. Payment: { scheduleItemUuid, amount, receiptNumber, receiptDate,
   method, reference }.
 Rules: taxes calculated by the backend with configurable rates; frequency (annual / semi-annual /
 quarterly / monthly) is a product setting; grace period drives lapse (G5).

G5 · POLICY SERVICING (statuses exist but nothing changes them after issue)
   GET  /policy/{quotationUuid}           policy detail (#20: today the UI reads GET /quotation/{uuid})
   PUT  /policy/{quotationUuid}/cancel | /lapse | /reinstate | /renew   (or document revise as renewal)
   POST /policy/{quotationUuid}/endorsement   ADD_MEMBER | REMOVE_MEMBER | CHANGE_SUM_ASSURED
   + the same under /benefit/{uuid}/… for individual policies
 DTOs: { effectiveDate, reason, note }; endorsement { type, effectiveDate, insured:[…] } returning the
 backend-calculated pro-rata premium.
 Rules: lapse only after the grace period with unpaid premium; reinstatement window (may need new health
 evidence); cancellation refund rule is a product parameter; expiry by a scheduled job at endDate.
 Transitions: ACTIVE→LAPSED→ACTIVE; ACTIVE→CANCELLED; ACTIVE→MODIFIED→ACTIVE; ACTIVE→EXPIRED (new);
 RENEWED for the old term on renewal.

G7 · DOCUMENTS
   POST /document (multipart; ownerType: APPLICATION|INSURED|BENEFICIARY|CUSTOMER|POLICY|CLAIM, ownerUuid,
   documentType), GET /document/list?ownerType&ownerUuid, GET /document/{uuid}/open, DELETE /document/{uuid},
   GET /policy/{uuid}/schedule.pdf (policy schedule / certificate).
 Rules: allowed types and max size configurable; documents on an issued policy are immutable (new version
 instead of overwrite).

G8 · DASHBOARD AND REPORTS
   GET /dashboard/summary?from&to → counts by quotation/policy/claim status, gross written premium, collected
   vs outstanding premium, claims paid, sums assured in force, policies expiring in 30/60/90 days.
   Reports with Excel export: policy register, premium register, claims register, outstanding premium,
   expiring policies, underwriting decisions, reinsurance cession bordereau.
   (The Life dashboard in the UI currently shows placeholder numbers until this exists.)

G13 · AUDIT TIMELINE
   GET /quotation/{uuid}/history and GET /policy/{uuid}/history: status changes and edits with actor and
   time (claims already have logs).

G12 · CREDIT LIFE — only if the product will be sold
   Loan-linked cover: lenderInstitutionUuid, loanAccount, loanAmount, loanTermMonths, interestRate,
   coverBasis LEVEL|DECREASING; backend computes the outstanding-balance sum-assured schedule and single or
   monthly premium; claims pay the lender first.

═══════════════════════════════════════════════════════════════════════════════════════════════
QUESTIONS TO ANSWER (documentation only, no code needed unless the answer is "missing")
═══════════════════════════════════════════════════════════════════════════════════════════════
 #8  Do the bulk PUTs /reinsurance/treaty/member/{treatyUuid}, /reinsurance/fcl-group/{treatyUuid} and
     /reinsurance/fcl/underwriting-range/{treatyUuid} REPLACE the treaty's whole list or update only the rows
     sent? Are rows without a UUID created? (The UI sends the full list, correct either way.)
 #10 What does fclMedicalParameters in the underwriting-range PUT do to the range's existing requirements?
 #11 New rider rate rows: intended default status (the UI uses ACTIVE)? Does pricing read only ACTIVE rows?
 #17 POST /quotation/revise/{uuid}: from which statuses is it allowed? (UI: only a paid quotation whose policy
     is issued.) Confirm it returns the new quotation with its UUID.
 #18 PUT /policy/issue/{quotationUuid} with { beginDate, endDate }: must endDate = beginDate + term? May
     beginDate be before the payment date?
 #21 PUT /policy/generate/treaty-report/{quotationUuid}: JSON summary or a file? Safe to call more than once?
 #22 GET /policy/lists?search: which fields does it match (policy number, quotation number, institution)?
 D5  In claims, who is the "agency" (employer HR, agent, or branch)? It decides who gets Life_Claim_Prepare.
 D9  Group quotations use institutionUuid from the shared institution service (/claimconnect/institution) —
     confirm that is intended for Life.

═══════════════════════════════════════════════════════════════════════════════════════════════
WHAT TO SEND BACK
═══════════════════════════════════════════════════════════════════════════════════════════════
For every new or changed endpoint: method, path, request DTO (fields, types, required, validation), response
DTO, status codes, status transitions, and one example request/response. Plus: migration file names, any
changed behaviour of existing endpoints, the answers to every question above (by number), and anything you
decided NOT to do with the reason. Keep the gap codes and item numbers so the frontend can map each change
to its screen.
````
