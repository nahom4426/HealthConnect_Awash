# 9 · Backend gaps and change requests

Compared against the Life Insurance OpenAPI document (169 operations, read 2026-10-28). Nothing below has been
worked around in the frontend; screens that depend on a gap are blocked until the change exists.

## A. Fully supported (frontend can build now)

| Capability | Endpoints |
|---|---|
| Rider catalogue with versioning (pending → active, revise/replicate) | `rider-controller` |
| Rate tables: group term (age × gender), individual term (age × term × gender, max discount/load), individual & group rider rates, Excel import | `group-term`, `individual-term`, `individual-rider`, `group-rider` |
| Premium lookup for individual term and riders | `calculate-term-premium`, `individual-rider/rate`, `rider/rates/byage` |
| Underwriting questionnaire setup (questions, answer library, numeric ranges, weights, critical flags) | `question`, `possible-answer` |
| Reinsurance setup: reinsurers, treaties (surplus / risk premium), members & shares, group FCL, medical tests, medical underwriting ranges by age × sum assured | 8 reinsurance controllers |
| Group quotation pipeline: create → insured persons (manual / Excel) → riders → issue → accept → pay (with withholding tax, revenue stamp) → revise | `quotation`, `quoted-rider`, `insured` |
| Issue group policy from a paid quotation; list policies by status | `policy` |

## B. Partially supported

| Capability | What exists | What is missing | Gap |
|---|---|---|---|
| Claims | Work queues per stage, review/approve/deny, attachments, logs | Claim data (type, event date, cause, claimant, amounts), authorize and pay actions, life-specific fields (response has travel fields: passport, destination country) | G3 |
| Individual term policy ("benefit") | Create/update with person + term + benefit + premium; rider benefits | Policyholder entity & KYC, issue/activate step, policy number rules, paging/search, beneficiaries, questionnaire link | G1 G2 G11 |
| Underwriting | Questionnaire config, recorded answers, FCL medical requirement rules | A decision per insured/application (accept / load / exclude / decline / postpone), medical requirement tracking, filtered answers | G4 |
| Policy statuses | ACTIVE, PENDING, MODIFIED, DISABLED, LAPSED, CANCELLED exist | No endpoint changes them after issue (cancel, lapse, reinstate, renew, endorse) | G5 |
| Payment | One-off `pay` on a quotation (query params) | Instalments, due dates, grace period, receipts, payment history, outstanding | G6 |
| Documents | Claim attachments only | Application, KYC, beneficiary, medical, policy documents; policy schedule PDF | G7 |
| Lists | Paged arrays with `totalPages` | `totalElements`, summary counts for dashboards and reports | G8 |

## C. Missing

| # | Capability | Priority |
|---|---|---|
| G1 | Beneficiaries | Critical (legal; Commercial Code Art. 701) |
| G2 | Policyholder / customer with KYC | Critical for individual business |
| G3 | Life claims data model + authorize/pay actions | Critical |
| G4 | Underwriting decisions | High |
| G5 | Policy servicing transitions | High |
| G6 | Premium schedule and payments | High |
| G7 | Documents for application/policy/KYC | Medium |
| G8 | Dashboard and report summaries | Medium |
| G9 | API contract hygiene (security scheme, validation, pagination, doc fixes) | High (cheap) |
| G10 | Life privileges in AuthService | High (cheap) |
| G11 | Individual policy issuance | Medium |
| G12 | Credit life (loan-linked, decreasing cover) | Later, if the product is offered |
| G13 | Audit timeline for quotations/policies | Medium |

---

## Change requests

Conventions used below: UUIDs as strings, money as `BigDecimal` (JSON number, 2 dp), dates ISO-8601. Status
fields are enums. Every new list endpoint takes `page` (1-based, like the existing ones), `limit`, `search` and
returns the existing array convention **plus** `totalElements` on each item (or, preferably, a page envelope —
see G9).

### G1 · Beneficiaries

**Problem:** No beneficiary entity anywhere. **Why:** a life policy pays its death benefit to named beneficiaries;
Ethiopian Commercial Code Art. 701 is read as presuming spouse and children when none are named, so the system
must record named beneficiaries (or record explicitly that the statutory default applies). Needed for claims
settlement.
**Current API:** none. **Required API:**

| Method | Path | Purpose |
|---|---|---|
| GET | `/beneficiary/list?insuredUuid=…` or `?benefitUuid=…` | Beneficiaries of one insured life (group member or individual policy) |
| PUT | `/beneficiary/designation` | Replace the whole designation for one insured in one transaction |
| GET | `/beneficiary/{beneficiaryUuid}` | Detail |
| GET | `/beneficiary/history?insuredUuid=…` | Previous designations (who changed what, when) |

**Request DTO** `BeneficiaryDesignationRequest`:
`{ insuredUuid?, benefitUuid?, statutoryDefault: boolean, beneficiaries: [ { beneficiaryUuid?, type: PRIMARY|CONTINGENT, firstName, fatherName, grandFatherName, relationship: SPOUSE|CHILD|PARENT|SIBLING|OTHER, dateOfBirth, gender, idType: NATIONAL_ID|KEBELE_ID|PASSPORT|OTHER, idNumber, phone, address, sharePercent, guardianName?, guardianPhone? } ] }`
**Response DTO** `BeneficiaryResponse`: all fields + `beneficiaryUuid`, `status`, `audit`.
**DB:** `beneficiary` (FK insured_person or benefit), `beneficiary_designation_history`.
**Rules / validation:** exactly one of insuredUuid/benefitUuid; per type, `sharePercent` sums to 100 (2 dp);
at least one PRIMARY unless `statutoryDefault=true`; minors (age < 18 at designation) require guardian fields;
designation locked while a death claim on that insured is open.
**Statuses:** ACTIVE, SUPERSEDED.
**Example:** `PUT /beneficiary/designation` `{ "insuredUuid":"…","statutoryDefault":false,"beneficiaries":[{"type":"PRIMARY","firstName":"Selam","fatherName":"Kebede","grandFatherName":"Ayele","relationship":"SPOUSE","dateOfBirth":"1990-02-01","gender":"Female","idType":"NATIONAL_ID","idNumber":"…","phone":"0911…","sharePercent":100}] }` → `[BeneficiaryResponse]`.

### G2 · Policyholder / customer with KYC

**Problem:** Individual policies embed the person in `BenefitRequest`; there is no reusable customer, no ID or
KYC data, no duplicate check. Group business points at `institutionUuid` (from the existing institution service)
with no life-side contact/KYC. **Why:** AML/CFT customer due diligence applies to insurers; one person can hold
several policies; policyholder, insured and payer can differ.
**Required API:** `POST /customer`, `PUT /customer/{uuid}`, `GET /customer/{uuid}`, `GET /customer/list?type=INDIVIDUAL|CORPORATE&search&page&limit`, `GET /customer/duplicate-check?idNumber&phone&dateOfBirth`, `GET /customer/{uuid}/policies`.
**Request DTO** `CustomerRequest`: `{ type, title, firstName, fatherName, grandFatherName, gender, dateOfBirth, nationality, idType, idNumber, tin?, occupation, employer?, phone, email?, region, zone?, woreda?, kebele?, houseNumber?, sourceOfIncome?, corporate: { name, tin, licenseNumber, sector, contactPerson, contactPhone }? }`.
**Response DTO:** fields + `customerUuid`, `kycStatus`, `audit`.
**DB:** `customer`; FK `customer_uuid` on `benefit` (policyholder) and optional `payer_customer_uuid`.
**Rules:** idNumber unique per idType; age from dateOfBirth; corporate requires TIN.
**Statuses:** `kycStatus`: INCOMPLETE, VERIFIED, REJECTED.

### G3 · Life claims

**Problem:** `POST /claim` takes only `insuredPersonUuid`; `ClaimRequest` is `{claimUuid, comment}`; the list DTO
carries travel-insurance fields (`passportNumber`, `destinationCountry`); there are *for-authorization*,
*authorized* and *paid* lists but no authorize or pay action; claim statuses are untyped strings.
**Required API (additive):**

| Method | Path | Purpose |
|---|---|---|
| POST | `/claim/v2` | Register a claim with data (keep `/claim` working) |
| PUT | `/claim/{claimUuid}/assessment` | Assessor records eligible and approved amounts |
| PUT | `/claim/insurance/authorize` | Authorize (body `ClaimRequest`) |
| PUT | `/claim/insurance/pay` | Record payment per payee |
| GET | `/claim/required-documents?claimType=…` | Document checklist |

**Request DTO** `LifeClaimRequest`: `{ insuredPersonUuid?, benefitUuid?, claimType: DEATH|ACCIDENTAL_DEATH|TOTAL_PERMANENT_DISABILITY|CRITICAL_ILLNESS|MATURITY|SURRENDER|RIDER, eventDate, causeOfEvent, placeOfEvent?, notifiedBy: { name, relationship, phone }, claimedAmount, payees: [ { beneficiaryUuid?, name, sharePercent, bankName, accountNumber } ] }`.
**Assessment DTO:** `{ eligibleAmount, approvedAmount, deductions:[{reason, amount}], outstandingPremiumDeducted, decisionNote }`.
**Payment DTO:** `{ payeeUuid, amount, paymentOrderNumber, paymentVoucherNumber, paymentDate, bankTransactionCode }`.
**Response:** extend `ClaimListResponse` with the fields above; mark the travel fields deprecated.
**Rules:** event date within cover period; claim type must be covered (term or attached rider); payees' shares
sum to 100 and default to the beneficiary designation; contestability window (e.g. 2 years) and suicide
exclusion are product parameters, flagged on the claim for the assessor; approvedAmount ≤ sum assured for the
cover; documents in the checklist required before review.
**Statuses (enum):** SAVED → REQUESTED → REGISTERED → REVIEWED → APPROVED → AUTHORIZED → PAID, plus REJECTED and
`INFO_REQUESTED` (back to the agency with a comment).

### G4 · Underwriting decisions

**Problem:** Questionnaire answers and FCL medical rules exist, but no endpoint records a decision. `GET /answer`
returns every answer in the system.
**Required API:** `GET /underwriting/queue?quotationUuid|benefitUuid&status`, `PUT /underwriting/{insuredUuid}/decision`, `GET /underwriting/{insuredUuid}` (answers + score + required medical tests from the treaty ranges), `PUT /underwriting/{insuredUuid}/medical-requirement/{requirementUuid}` (received/result), `GET /answer?personUuid|benefitUuid`.
**Decision DTO:** `{ decision: STANDARD|LOADED|EXCLUSION|POSTPONED|DECLINED, loadingPercent?, exclusions?: string[], postponeUntil?, note }`.
**Rules:** members above the group FCL or an individual's sum assured above the medical range must have their
medical requirements received before a decision; a critical answer forces manual review; loading within the
term's `maxLoad`; quotation cannot be issued while any insured is PENDING_UNDERWRITING.
**Statuses (per insured):** PENDING_UNDERWRITING, REQUIREMENTS_OUTSTANDING, DECIDED.

### G5 · Policy servicing

**Problem:** Statuses exist but nothing transitions them after issue.
**Required API:** `PUT /policy/{quotationUuid}/cancel`, `/lapse`, `/reinstate`, `/renew` (or reuse `revise` and document it), `POST /policy/{quotationUuid}/endorsement` (add/remove members, change sum assured mid-term), `GET /policy/{quotationUuid}` (detail; today there is only the list), and the same for individual policies under `/benefit/{uuid}/…`.
**DTOs:** `{ effectiveDate, reason, note }`; endorsement `{ type: ADD_MEMBER|REMOVE_MEMBER|CHANGE_SUM_ASSURED, effectiveDate, insured: [...] }` returning the pro-rata premium (backend-calculated).
**Rules:** lapse only after the grace period with unpaid premium; reinstatement within a configured window,
possibly with new health evidence; cancellation refund rule is a product parameter; maturity/expiry set by a
scheduled job at `endDate`.
**Status transitions:** ACTIVE→LAPSED→ACTIVE (reinstate); ACTIVE→CANCELLED; ACTIVE→MODIFIED (endorsement pending)
→ACTIVE; ACTIVE→EXPIRED (new) at end date; RENEWED for the old term on renewal.

### G6 · Premium schedule and payments

**Problem:** One `pay` call with money passed as query parameters; no schedule, history or outstanding balance.
**Required API:** `GET /premium/schedule?quotationUuid|benefitUuid`, `POST /premium/payment` (JSON body), `GET /premium/payments?…`, `GET /premium/outstanding?…&asOf=`, `GET /premium/receipt/{paymentUuid}` (PDF).
**DTOs:** schedule item `{ dueDate, grossPremium, withholdingTax, revenueStamp, netPremium, status: DUE|PAID|OVERDUE|WAIVED }`; payment `{ scheduleItemUuid, amount, receiptNumber, receiptDate, method, reference }`.
**Rules:** tax amounts calculated by the backend (rates configurable, not hard-coded in the UI); frequency
(annual/semi-annual/quarterly/monthly) is a product setting; grace period drives G5 lapse.

### G7 · Documents

**Required API:** generic `POST /document` (multipart; `ownerType: APPLICATION|INSURED|BENEFICIARY|CUSTOMER|POLICY|CLAIM, ownerUuid, documentType`), `GET /document/list?ownerType&ownerUuid`, `GET /document/{uuid}/open`, `DELETE /document/{uuid}`; `GET /policy/{uuid}/schedule.pdf` (policy schedule/certificate).
**Rules:** allowed types and max size configured; documents attached to an issued policy are immutable (new version instead of overwrite).

### G8 · Dashboard and reports

**Required API:** `GET /dashboard/summary?from&to` returning counts by quotation/policy/claim status, gross written
premium, collected vs outstanding premium, claims paid, sums assured in force, policies expiring in 30/60/90 days;
report endpoints (policy register, premium register, claims register, outstanding premium, expiring policies,
underwriting decisions, reinsurance cession bordereau) with Excel export.

### G9 · API contract hygiene

1. Declare the bearer security scheme in OpenAPI (endpoints already require it).
2. Add bean validation and expose it (`@NotNull`, `@Positive`, `@DecimalMax("100")` for shares, `minAge ≤ maxAge`, `lower ≤ upper`), and document 400/401/403/404/409 responses with the error body.
3. Pagination: add `totalElements` (or return `{ content, page, limit, totalPages, totalElements }` on new endpoints).
4. Fix documented types: `GET /quoted-rider/{uuid}` → `QuotedRiderResponse`; `GET /policy-treaty/mapping/list/{quotationUuid}` → array; `generateTreatyReport` response schema.
5. Accept `quotationUuid` as an alias of the misspelled `qutoationUuid` on insured import (keep the old name).
6. Move `pay` and `deny` inputs from query string to JSON body (keep the old forms working).
7. Type claim statuses as an enum.

### G10 · Privileges

Seed AuthService privileges for Life so the existing `meta.permissions` / `v-privilage` checks work, e.g.
`Life_Read`, `Life_Product_Manage`, `Life_Rate_Manage`, `Life_Quotation_Create`, `Life_Quotation_Issue`,
`Life_Payment_Record`, `Life_Policy_Issue`, `Life_Policy_Service`, `Life_Underwriting_Decide`,
`Life_Reinsurance_Manage`, `Life_Claim_Prepare`, `Life_Claim_Review`, `Life_Claim_Approve`,
`Life_Claim_Authorize`, `Life_Claim_Pay`, `Life_Report_View`. Enforce the same privileges server-side.

### G11 · Individual policy issuance

`PUT /benefit/{uuid}/issue` (generates `policyNumber`, sets dates and ACTIVE), paging/search on
`GET /benefit/benefits/{status}`, link to customer (G2), questionnaire (G4) and beneficiaries (G1).

### G12 · Credit life (only if offered)

Loan-linked cover for banks/MFIs: `lenderInstitutionUuid`, `loanAccount`, `loanAmount`, `loanTermMonths`,
`interestRate`, `coverBasis: LEVEL|DECREASING`; backend computes the outstanding-balance sum assured schedule and
single or monthly premium; claims pay the lender first.

### G13 · Audit timeline

`GET /quotation/{uuid}/history` and `GET /policy/{uuid}/history`: status changes and edits with actor and time
(claims already have logs).

---

## Copy-paste prompt for the backend session

```text
You are working on the Life Insurance Spring Boot service (OpenAPI at /api/life/v3/api-docs, currently 169
operations, 25 controllers). The web frontend (Vue) has been built against the existing contract; the attached
document "09-backend-gaps-and-change-requests.md" lists what is missing. Implement the changes in this order:
G9 → G10 → G1 → G3 → G4 → G6 → G5 → G2 → G11 → G7 → G8 → G13 (G12 only if asked).

Rules:
- Do not break existing endpoints, paths, field names or enum values. Add new endpoints or optional fields;
  where an old contract is wrong, add the corrected one alongside and mark the old one @Deprecated.
- Follow the existing architecture: same controller/service/repository/DTO/mapper layering, the existing
  BaseEntity/audit fields, UUID identifiers, status enums, soft delete with the `deleted` flag, and the existing
  list convention (page/limit/search query params) — add totalElements.
- Reuse existing entities (InsuredPerson, Benefit, Quotation, Claim, Rider, ReinsuranceTreaty, etc.) instead of
  creating parallel ones.
- Database changes via migrations (Flyway/Liquibase, whichever the project uses), additive and reversible; no
  destructive changes to existing columns.
- Bean validation on every request DTO (required fields, positive amounts, percentages ≤ 100, shares summing to
  100 where stated, date ordering, age ranges). Return 400 with field errors in the existing error format;
  404 for unknown UUIDs; 409 for invalid status transitions with a clear message.
- All money and tax calculations (premiums, pro-rata, withholding tax, revenue stamp, claim amounts) stay in the
  backend; never expect the client to compute them.
- Enforce the Life privileges server-side (G10), not only in the UI.
- Document everything in Swagger: securityScheme (bearer), request/response schemas, enums, error responses.
- Write tests: controller tests for every new endpoint (happy path, validation error, unauthorized, invalid
  transition) and service tests for the business rules.

When done, reply with, for every new or changed endpoint: method, path, request DTO (fields, types, required,
validation), response DTO, status codes, status transitions, and one example request/response, plus the
migration file names and any changed behavior of existing endpoints.
```
