# Motor claims · Backend prompt (copy everything inside the box)

Self-contained: the backend team doesn't need any other file. Full request/response JSON for every item: [backend-api-changes.md](backend-api-changes.md). Written 2026-11-01 against the live
`/api/payer/motor/v3/api-docs` on 192.168.100.251:8888, after the frontend built the staff claim-entry wizard
and the printable "Notification of Motor Accident" form (frontend code: `src/features/motor/claims/`).

````text
You are working on the Motor insurance Spring Boot service (OpenAPI at /api/payer/motor/v3/api-docs,
digital-channel claims under /api/payer/motor/digital-channel). The Vue frontend for Standard Insurance S.C.
now lets claims staff enter a motor claim on behalf of a customer from Standard's paper form
"Notification of Motor Accident" (Motor-Claims-Notification-Form.pdf, sections 1–6), and prints that form back
filled in, for the insured and the driver to sign. Below is what the frontend needs from you. Item numbers
(M1…M8) are the frontend's tracking numbers; please keep them in your replies.

═══════════════════════════════════════════════════════════════════════════════════════
WHAT THE FRONTEND ALREADY SENDS (no change needed, please confirm)
═══════════════════════════════════════════════════════════════════════════════════════
POST /digital-channel/claims with your existing ClaimCreateRequest fields:
policyNumber, productModule="motor", coverageType, causeOfLoss, incidentDate, incidentTime ("HH:mm"),
incidentLocation, description, estimatedAmount, plateNumber, licenseNumber, driverName, driverLicenseNumber,
driverLicenseType (licence grade), driverRelationship (OWNERSHIP | EMPLOYED | RENT | or free text when "other"),
vehicleSpeed (integer km/h), damagedParts (damage to the insured vehicle), thirdPartyName, thirdPartyPhone,
thirdPartyPlate, thirdPartyDetails.
The frontend reads claimUuid and claimNumber from the ClaimResponse to open the print page.

═══════════════════════════════════════════════════════════════════════════════════════
M1 — STORE THE WHOLE NOTIFICATION FORM (main ask)
═══════════════════════════════════════════════════════════════════════════════════════
About half of the paper form has no field in ClaimCreateRequest (policy holder address and VAT, vehicle
type/use/year, driver address/age/licence dates, road-side distance, vehicle condition, goods carried, other
party's woreda/kebele/driver, who is responsible, other policies, police details, passengers, witnesses,
damage to the other vehicle, injured persons). The frontend already sends all of it as ONE JSON object:

  "notificationForm": {
    "policyHolder": { "fullName", "profession", "address", "subCity", "kebele", "houseNo", "phone",
                      "vatRegistered": true|false|null, "vatNumber" },
    "vehicle":      { "policyNo", "plateNo", "typeAndMake", "use", "yearOfMake" },
    "driver":       { "fullName", "address", "subCity", "kebele", "houseNo", "phone",
                      "reasonForDriving": "OWNERSHIP|EMPLOYED|RENT|OTHER|", "reasonOther",
                      "profession", "age", "licenceNo", "grade",
                      "licenceIssueDate": "yyyy-MM-dd", "licenceExpiryDate": "yyyy-MM-dd" },
    "accident":     { "date": "yyyy-MM-dd", "time": "HH:mm", "place", "speed", "distanceFromRoadSide",
                      "vehicleCondition", "goodsCarried", "description",
                      "otherParty": { "ownerName", "ownerSubCity", "ownerWoreda", "ownerKebele", "ownerPhone",
                                      "plateNo", "driverName", "driverSubCity", "driverWoreda",
                                      "driverKebele", "driverHouseNo" },
                      "responsible", "otherPolicies", "police", "passengers", "witnesses" },
    "damage":       { "insuredVehicle", "otherProperty" },
    "injuries":     [ { "name", "address", "identity" } ]
  }
  (all values are strings unless shown otherwise; any may be empty)

Please:
  a) Add `notificationForm` (object) to ClaimCreateRequest and persist it as-is (a JSON/jsonb column on the
     claim is enough; we don't need it split into columns).
  b) Return it on GET /digital-channel/claims/{claimUuid} as the same object. It can be left out of the list
     endpoints.
  c) Unknown keys inside it should be kept, not rejected, so the frontend can add a field without a backend
     release.
Today the frontend falls back to a copy in the submitting browser's localStorage, so the printout is complete
only on the computer that entered the claim. M1 removes that.

═══════════════════════════════════════════════════════════════════════════════════════
M2 — incidentDate FORMAT
═══════════════════════════════════════════════════════════════════════════════════════
The frontend sends incidentDate as local Addis Ababa time without an offset, e.g. "2026-10-30T14:20:00".
Tell us if the field is an Instant/OffsetDateTime (then we'll send "+03:00") or a LocalDateTime (then this is
fine). Please don't shift it to UTC when you return it: the printout shows the date the customer wrote.

═══════════════════════════════════════════════════════════════════════════════════════
M3 — SERVER-SIDE CHECKS ON CREATE (return 400 with fieldErrors)
═══════════════════════════════════════════════════════════════════════════════════════
Same rules the frontend applies, so a bad request can't slip in from another client:
  - required: policyNumber, coverageType, plateNumber, driverName, driverLicenseNumber, incidentDate,
    incidentLocation, description, estimatedAmount >= 100, notificationForm.policyHolder.fullName and .phone
  - incidentDate not in the future, and inside the policy's startDate..endDate; policy ACTIVE
  - if notificationForm.policyHolder.vatRegistered is true, vatNumber is required
  - licence expired before the accident date: do NOT reject; return a warning (e.g. "warnings": [...]) or tell us
    how you'd like it flagged for the adjustor.
Please use your existing error shape ({type,title,status,detail,fieldErrors:[{field,message}]}) with field names
matching the request (e.g. "notificationForm.policyHolder.phone"), so the frontend can highlight the right box.

═══════════════════════════════════════════════════════════════════════════════════════
M4 — STAFF ENTRY: WHO AND HOW IT WAS REPORTED
═══════════════════════════════════════════════════════════════════════════════════════
Claims entered by staff on behalf of a customer need:
  a) The allowed values of `submittedVia` (and of `claimType`, `driverRelationship` if they're enums). We'd like
     a value for staff entry, e.g. "STAFF".
  b) A new optional `reportedChannel`: WALK_IN | PHONE | EMAIL | LETTER | TELEGRAM | FAX (the website says
     customers may report by letter, email, telephone, telegram or fax), and `reportedAt` (date-time the customer
     first reported; may be earlier than createdAt).
  c) Record the signed-in staff user who created the claim (createdBy uuid + name) and return it.
  d) Which privilege allows creating a claim for another person? The frontend currently lets roles
     ADJUSTOR, CLAIM_MANAGER, CUSTOMER, SUPER_ADMIN, PRODUCT_MANAGER, GARAGE into claim pages; a CUSTOMER should
     only be able to file for their own policy.

═══════════════════════════════════════════════════════════════════════════════════════
M5 — MORE ON GET /digital-channel/policies/validate (to auto-fill sections 1–2)
═══════════════════════════════════════════════════════════════════════════════════════
After "Verify", staff should not retype what the policy already knows. PolicyValidationResponse has insuredName
and dates; please add, when known: insuredPhone, insuredAddress {subCity, kebele, houseNo}, insuredProfession,
vatRegistered + vatNumber, insuredUuid, carUuid, plateNumber, vehicleMake/model ("typeAndMake"), vehicleUse,
yearOfMake. Also: for an unknown policy number, return 404 or valid=false — today the frontend can't tell a
network failure from an unknown policy.

═══════════════════════════════════════════════════════════════════════════════════════
M6 — REQUIRED DOCUMENTS (next frontend step; please confirm the contract)
═══════════════════════════════════════════════════════════════════════════════════════
The frontend will use your existing POST /digital-channel/claims/{claimUuid}/documents (multipart "file",
query documentType) for Standard's motor document list. Please accept these documentType values:
  NOTIFICATION_FORM_SIGNED, DRIVING_LICENCE, VEHICLE_TITLE_DEED, POWER_OF_ATTORNEY, POLICE_REPORT,
  PROFORMA_INVOICE, EXCESS_RECEIPT, VAT_CERTIFICATE, ACCIDENT_PHOTO, OTHER
and tell us: max file size, allowed content types, and whether a document can be deleted/replaced.
Also: may a claim be created before all documents are in (we'd like yes), and should the claim be blocked from
moving to IN_PROCESS until POLICE_REPORT, DRIVING_LICENCE, VEHICLE_TITLE_DEED, NOTIFICATION_FORM_SIGNED and
PROFORMA_INVOICE are uploaded? If yes, enforce it in PUT /claims/{claimUuid}/status and return which are missing.

═══════════════════════════════════════════════════════════════════════════════════════
M7 — DRAFTS (decide; small)
═══════════════════════════════════════════════════════════════════════════════════════
Staff often start a claim while the customer is still fetching the police report. Options:
  (a) a DRAFT status: POST with "draft": true creates the claim without a claimNumber and without running M3
      checks; PUT /claims/{claimUuid} updates it; POST /claims/{claimUuid}/submit runs M3, assigns the
      claimNumber and moves it to SUBMITTED. Drafts don't appear in manager/garage lists.
  (b) no backend drafts; the frontend keeps unfinished entries in the browser only.
Tell us which you prefer.

═══════════════════════════════════════════════════════════════════════════════════════
M8 — SMALL FIXES SEEN WHILE READING THE SPEC
═══════════════════════════════════════════════════════════════════════════════════════
  - POST /digital-channel/claims/{claimUuid}/documents and /request-documents return a bare "object" in the
    OpenAPI; please type them (ClaimDocumentResponse) so we know what comes back.
  - The OpenAPI lists servers "/api/payer/motor" and "http://localhost:8989/api/payer/motor"; the digital-channel
    api-docs path (/api/payer/motor/digital-channel/v3/api-docs) answers 401. Fine if intended — just confirm
    /api/payer/motor/v3/api-docs is the one to follow.

═══════════════════════════════════════════════════════════════════════════════════════
M9–M12 — THE CLAIM PROCESS AFTER REGISTRATION (added 2026-11-01)
═══════════════════════════════════════════════════════════════════════════════════════
The claim page now runs the claim through seven stages built on Standard's published motor requirements:
  1 Reported → 2 Documents → 3 Survey & decision → 4 Repair quotes → 5 Excess → 6 Repair → 7 Salvage & handover
mapped onto your statuses: SUBMITTED = stage 2, IN_PROCESS = 3, BID_ASSIGNED = 4, BID_COMPLETED = 5,
ASSIGN_TO_GARAGE / IN_MAINTENANCE = 6, MAINTENANCE_COMPLETED = 7, HANDOVER_COMPLETED = done.
Calls it makes, in order: POST /claims/{id}/documents (per document) · POST /claims/{id}/request-documents ·
PUT assign-adjustor + PUT status=IN_PROCESS · POST /motor/spot-survey · PUT status=BID_ASSIGNED ·
POST /motor/garage-bids · PUT /motor/garage-bids/{bidUuid}/select + PUT status=BID_COMPLETED&approvedAmount=<bid> ·
PUT assign-garage + PUT status=ASSIGN_TO_GARAGE&approvedAmount=<bid − excess> · PUT status=IN_MAINTENANCE ·
PUT status=MAINTENANCE_COMPLETED · PUT status=HANDOVER_COMPLETED · POST /motor/subrogation.
Until the items below exist, the frontend keeps these on the user's computer only:

M9 — Closed outcomes. Accept status REJECTED and WITHDRAWN on PUT /claims/{id}/status with a required `reason`
     (query or body), allowed only before ASSIGN_TO_GARAGE. Store who/when/reason and return them on the claim.
     Allow reopening (back to the status it had) by a claim manager.

M10 — Document marks. Per claim and document type: { status: RECEIVED | NOT_APPLICABLE, reason, originalSeen:
     bool, markedBy, markedAt }, for paper copies kept on file without an upload and for "original seen" on the
     driving licence and title deed. Suggest PUT /claims/{id}/documents/{documentType}/mark and return the marks
     on GET /claims/{id}. Also store `filedByRepresentative` (bool) on the claim (power of attorney needed).

M11 — Excess and salvage. On the claim: excess { none: bool, amount, receiptNo, recordedBy, recordedAt } and
     salvage { status: RETURNED | NOT_REQUIRED, note, recordedBy, recordedAt }. Suggest PUT /claims/{id}/excess and
     PUT /claims/{id}/salvage. Enforce: no ASSIGN_TO_GARAGE without excess recorded; no HANDOVER_COMPLETED without
     salvage recorded. approvedAmount at ASSIGN_TO_GARAGE = selected bid − excess.

M12 — Activity log. GET /claims/{id}/activity → [{ at, byUserUuid, byName, action, text }], written by the
     backend on every status change, assignment, upload, mark, bid, survey, excess, salvage and recovery.
     Also: return spotSurvey and garageBids (with the selected bid's status = SELECTED) on GET /claims/{id}, and
     list adjustors and garages from an endpoint (the screens use a fixed list today: ADJ-100/101/102,
     GAR-200/201/202).

Reply per item (M1…M12): done / changed shape (with the new shape) / won't do (why). A sample request and
response for M1 and M3 would let us switch the frontend over the same day.
````
