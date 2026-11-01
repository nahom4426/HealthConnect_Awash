# Motor claims — backend API changes (full spec with payloads)

For the Motor insurance service. Base path for everything below: **`/api/payer/motor/digital-channel`**
(OpenAPI: `/api/payer/motor/v3/api-docs`). Written 2026-11-01 from the frontend code in
`src/features/motor/claims/` and the live OpenAPI on `192.168.100.251:8888`.

Item codes **M1–M12** match [backend-prompt.md](backend-prompt.md). Please keep them in replies and commit messages.

Contents
1. [Summary of changes](#1-summary-of-changes)
2. [Enums](#2-enums)
3. [Claim status machine and guards](#3-claim-status-machine-and-guards)
4. [Create claim — POST /claims (M1–M4)](#4-create-claim--post-claims-m1m4)
5. [Read claim — GET /claims/{claimUuid} (full response)](#5-read-claim--get-claimsclaimuuid)
6. [Policy validation — GET /policies/validate (M5)](#6-policy-validation--get-policiesvalidate-m5)
7. [Documents — upload, request, marks (M6, M10)](#7-documents-m6-m10)
8. [Status change, reject, withdraw, reopen (M9)](#8-status-change-reject-withdraw-reopen-m9)
9. [Assessment — adjustor and spot survey](#9-assessment--adjustor-and-spot-survey)
10. [Repair quotes — garage bids](#10-repair-quotes--garage-bids)
11. [Excess and salvage (M11)](#11-excess-and-salvage-m11)
12. [Garage assignment and repair](#12-garage-assignment-and-repair)
13. [Recovery from the other party (subrogation)](#13-recovery-from-the-other-party-subrogation)
14. [Activity log (M12)](#14-activity-log-m12)
15. [Lookups — adjustors and garages (M12)](#15-lookups--adjustors-and-garages-m12)
16. [Drafts (M7, optional)](#16-drafts-m7-optional)
17. [Errors](#17-errors)
18. [Suggested database changes](#18-suggested-database-changes)
19. [Frontend fallbacks to remove once done](#19-frontend-fallbacks-to-remove-once-done)

---

## 1. Summary of changes

| Code | What | Kind | Endpoint |
|---|---|---|---|
| M1 | Store the whole notification form as JSON and return it | **new field** | `POST /claims`, `GET /claims/{id}` |
| M2 | Confirm `incidentDate` type (local Addis time) | confirm | `POST /claims` |
| M3 | Server-side validation on create | **new rules** | `POST /claims` |
| M4 | Staff entry: `submittedVia`, `reportedChannel`, `reportedAt`, `createdBy` | **new fields** | `POST /claims`, `GET /claims/{id}` |
| M5 | More vehicle/insured fields from policy validation | **new fields** | `GET /policies/validate` |
| M6 | Motor document types, limits, upload response type | **contract** | `POST /claims/{id}/documents` |
| M7 | Drafts (optional) | new | `POST /claims?draft=true`, `PUT /claims/{id}`, `POST /claims/{id}/submit` |
| M8 | Type the untyped responses in OpenAPI | spec fix | several |
| M9 | `REJECTED` / `WITHDRAWN` with reason; reopen | **new statuses** | `PUT /claims/{id}/status`, `POST /claims/{id}/reopen` |
| M10 | Document marks (received / not applicable / original seen) + representative flag | **new** | `PUT /claims/{id}/documents/{type}/mark`, `PUT /claims/{id}/representative` |
| M11 | Excess and salvage records + guards | **new** | `PUT /claims/{id}/excess`, `PUT /claims/{id}/salvage` |
| M12 | Activity log; adjustor and garage lookups | **new** | `GET /claims/{id}/activity`, `GET /lookups/adjustors`, `GET /lookups/garages` |

What the frontend already calls today, unchanged (please keep them working):
`GET /claims/module/motor`, `GET /claims/{id}`, `GET /claims/{id}/documents`, `GET /claims/{id}/documents/{documentUuid}`,
`GET /claims/{id}/image`, `POST /claims/{id}/documents`, `POST /claims/{id}/request-documents`,
`PUT /claims/{id}/status`, `PUT /claims/{id}/assign-adjustor`, `PUT /claims/{id}/assign-garage`,
`POST /motor/spot-survey`, `GET /motor/garage-bids/{claimUuid}`, `POST /motor/garage-bids`,
`PUT /motor/garage-bids/{bidUuid}/select`, `POST /motor/subrogation`, `GET /policies/validate`.

---

## 2. Enums

All sent and returned as strings.

```text
ClaimStatus          SUBMITTED | IN_PROCESS | BID_ASSIGNED | BID_COMPLETED | ASSIGN_TO_GARAGE |
                     IN_MAINTENANCE | MAINTENANCE_COMPLETED | HANDOVER_COMPLETED |
                     REJECTED (new, M9) | WITHDRAWN (new, M9) | DRAFT (new, M7, optional)

SubmittedVia         STAFF (new — claim entered by staff for a customer) | MOBILE | WEB | ...existing values
ReportedChannel      WALK_IN | PHONE | EMAIL | LETTER | TELEGRAM | FAX                  (M4)
DrivingReason        OWNERSHIP | EMPLOYED | RENT | OTHER                                  (form 3.3)

MotorDocumentType    NOTIFICATION_FORM_SIGNED   required
                     DRIVING_LICENCE            required, original must be seen
                     VEHICLE_TITLE_DEED         required, original must be seen
                     POWER_OF_ATTORNEY          required only if filedByRepresentative
                     POLICE_REPORT              required
                     PROFORMA_INVOICE           required
                     EXCESS_RECEIPT             optional upload
                     VAT_CERTIFICATE            optional upload (form 1.3)
                     ACCIDENT_PHOTO             optional
                     OTHER

DocumentMarkStatus   RECEIVED | NOT_APPLICABLE                                            (M10)
SalvageStatus        RETURNED | NOT_REQUIRED                                              (M11)
BidStatus            PENDING | SELECTED | REJECTED
RecoveryStatus       INITIATED | IN_PROGRESS | RECOVERED | CLOSED
ActivityAction       CREATED | STATUS_CHANGED | ADJUSTOR_ASSIGNED | GARAGE_ASSIGNED | DOCUMENT_UPLOADED |
                     DOCUMENT_MARKED | DOCUMENTS_REQUESTED | SURVEY_RECORDED | BID_ADDED | BID_SELECTED |
                     EXCESS_RECORDED | SALVAGE_RECORDED | RECOVERY_STARTED | REJECTED | WITHDRAWN | REOPENED
```

Motor claim requirements these come from (Standard Insurance website, Motor-Claims-documents.pdf): report promptly,
notification form, driving licence (original + copy), title deed (original + copy), power of attorney where applicable,
police report, proforma invoice, excess / contribution, salvage returned.

---

## 3. Claim status machine and guards

The frontend shows seven stages on top of these statuses:

| Stage (UI) | Status(es) | Leaves the stage by |
|---|---|---|
| 1 Reported | (created) | — |
| 2 Documents | `SUBMITTED` | `PUT status=IN_PROCESS` (after adjustor assigned) |
| 3 Survey & decision | `IN_PROCESS` | `PUT status=BID_ASSIGNED` (approve) or `REJECTED` |
| 4 Repair quotes | `BID_ASSIGNED` | `PUT /motor/garage-bids/{bid}/select` + `PUT status=BID_COMPLETED&approvedAmount=<bid>` |
| 5 Excess | `BID_COMPLETED` | `PUT assign-garage` + `PUT status=ASSIGN_TO_GARAGE&approvedAmount=<bid − excess>` |
| 6 Repair | `ASSIGN_TO_GARAGE`, `IN_MAINTENANCE` | `IN_MAINTENANCE` → `MAINTENANCE_COMPLETED` |
| 7 Salvage & handover | `MAINTENANCE_COMPLETED` | `PUT status=HANDOVER_COMPLETED` |
| done | `HANDOVER_COMPLETED` | — |

**Allowed transitions** (anything else → `409 Conflict`, see [§17](#17-errors)):

```text
SUBMITTED              → IN_PROCESS, REJECTED, WITHDRAWN
IN_PROCESS             → BID_ASSIGNED, REJECTED, WITHDRAWN
BID_ASSIGNED           → BID_COMPLETED, REJECTED, WITHDRAWN
BID_COMPLETED          → ASSIGN_TO_GARAGE, WITHDRAWN
ASSIGN_TO_GARAGE       → IN_MAINTENANCE
IN_MAINTENANCE         → MAINTENANCE_COMPLETED
MAINTENANCE_COMPLETED  → HANDOVER_COMPLETED
REJECTED / WITHDRAWN   → (reopen only, back to statusBeforeClose)
```

**Guards the backend should enforce** (return `422` with `missing` list, see [§17](#17-errors)):

| Transition | Guard |
|---|---|
| `→ IN_PROCESS` | every required document is satisfied (§7.4) **and** an adjustor is assigned |
| `→ BID_ASSIGNED` | a spot survey exists |
| `→ BID_COMPLETED` | a bid is SELECTED; `approvedAmount` = selected `bidAmount` |
| `→ ASSIGN_TO_GARAGE` | excess recorded (§11.1) **and** garage assigned; `approvedAmount` = selected bid − excess (0 if `none`) |
| `→ HANDOVER_COMPLETED` | salvage recorded (§11.2) |
| `→ REJECTED / WITHDRAWN` | `reason` not blank |

---

## 4. Create claim — POST /claims (M1–M4)

### 4.1 Request

This is what the frontend sends today, plus the three M4 fields (`submittedVia`, `reportedChannel`, `reportedAt`),
which it will start sending once you confirm the values. Unknown values there could break enum parsing, so they're
held back until then.

`POST /api/payer/motor/digital-channel/claims` · `Content-Type: application/json` · Bearer token

```json
{
  "policyNumber": "SIC/MOT/2026/00123",
  "productModule": "motor",
  "coverageType": "OWN_DAMAGE",
  "causeOfLoss": "COLLISION",
  "incidentDate": "2026-10-30T14:20:00",
  "incidentTime": "14:20",
  "incidentLocation": "Bole Road, near Edna Mall",
  "description": "The insured vehicle was stopped at the red light when a minibus hit it from behind.",
  "estimatedAmount": 45000,
  "plateNumber": "AA 3-B12345",
  "licenseNumber": "AA-DL-778812",
  "driverName": "Kebede Alemu Gebre",
  "driverLicenseNumber": "AA-DL-778812",
  "driverLicenseType": "Auto 3",
  "driverRelationship": "EMPLOYED",
  "vehicleSpeed": 40,
  "damagedParts": "Rear bumper, boot lid, left tail lamp",
  "thirdPartyName": "Selam Transport",
  "thirdPartyPhone": "0115 50 60 70",
  "thirdPartyPlate": "AA 3-A99887",
  "thirdPartyDetails": "Selam Transport, Plate AA 3-A99887, 0115 50 60 70",

  "submittedVia": "STAFF",
  "reportedChannel": "WALK_IN",
  "reportedAt": "2026-10-30T16:05:00",

  "notificationForm": {
    "policyHolder": {
      "fullName": "Abebe Kebede Tesfaye",
      "profession": "Merchant",
      "address": "Addis Ababa",
      "subCity": "Bole",
      "kebele": "03",
      "houseNo": "1234",
      "phone": "0911 23 45 67",
      "vatRegistered": true,
      "vatNumber": "VAT-0045821"
    },
    "vehicle": {
      "policyNo": "SIC/MOT/2026/00123",
      "plateNo": "AA 3-B12345",
      "typeAndMake": "Toyota Corolla",
      "use": "Private",
      "yearOfMake": "2018"
    },
    "driver": {
      "fullName": "Kebede Alemu Gebre",
      "address": "Addis Ababa",
      "subCity": "Yeka",
      "kebele": "11",
      "houseNo": "567",
      "phone": "0922 11 22 33",
      "reasonForDriving": "EMPLOYED",
      "reasonOther": "",
      "profession": "Driver",
      "age": "34",
      "licenceNo": "AA-DL-778812",
      "grade": "Auto 3",
      "licenceIssueDate": "2019-05-12",
      "licenceExpiryDate": "2027-05-12"
    },
    "accident": {
      "date": "2026-10-30",
      "time": "14:20",
      "place": "Bole Road, near Edna Mall",
      "speed": "40 km/h",
      "distanceFromRoadSide": "1 m",
      "vehicleCondition": "Horn, brake and lights in good working order",
      "goodsCarried": "None",
      "description": "The insured vehicle was stopped at the red light when a minibus hit it from behind.",
      "otherParty": {
        "ownerName": "Selam Transport",
        "ownerSubCity": "Kirkos",
        "ownerWoreda": "08",
        "ownerKebele": "02",
        "ownerPhone": "0115 50 60 70",
        "plateNo": "AA 3-A99887",
        "driverName": "Dawit Hailu",
        "driverSubCity": "Kirkos",
        "driverWoreda": "08",
        "driverKebele": "02",
        "driverHouseNo": "88"
      },
      "responsible": "The minibus driver",
      "otherPolicies": "",
      "police": "Bole Police Station, Sgt. Tadesse Mekonnen, ID 4521",
      "passengers": "Hanna Abebe, Bole 03",
      "witnesses": "Traffic officer at the junction"
    },
    "damage": {
      "insuredVehicle": "Rear bumper, boot lid, left tail lamp",
      "otherProperty": "Front bumper of the minibus"
    },
    "injuries": [
      { "name": "Hanna Abebe", "address": "Bole 03", "identity": "Passenger" }
    ]
  }
}
```

Field notes
- **Existing fields** (already in `ClaimCreateRequest`): everything above `submittedVia`. Keep them as they are.
- **New fields:** `submittedVia: "STAFF"` (value new), `reportedChannel`, `reportedAt` (M4), `notificationForm` (M1).
- `notificationForm` — store as one JSON/jsonb value. All leaf values are strings except `vatRegistered`
  (`true | false | null`) and `injuries` (array). Any value may be `""`. **Keep unknown keys** (don't reject, don't drop):
  the frontend may add form fields without a backend release.
- Dates inside `notificationForm` are `yyyy-MM-dd`, times `HH:mm`.
- `incidentDate` (M2) is **local Addis Ababa time with no offset**. If the column is `Instant`/`OffsetDateTime`, tell us
  and we'll send `+03:00`. Never return it shifted to UTC.
- `vehicleSpeed` is the first whole number from the free-text speed ("about 40 km/h" → `40`); omitted if none.
- `driverRelationship` is the DrivingReason code, or the free text when the reason is `OTHER`.
- Fields that are empty in the form are **omitted** (not sent as `""`) at the top level.

### 4.2 Validation (M3)

Return `400` with `fieldErrors` ([§17](#17-errors)) when:

| Field | Rule | Message (suggested) |
|---|---|---|
| `policyNumber` | required; policy exists and is ACTIVE | "Policy not found or not active" |
| `coverageType` | required | |
| `plateNumber` | required | |
| `driverName` | required | |
| `driverLicenseNumber` | required | |
| `incidentDate` | required; not in the future; within policy `startDate..endDate` | "Accident date is outside the policy period" |
| `incidentLocation` | required | |
| `description` | required | |
| `estimatedAmount` | required, ≥ 100 | |
| `notificationForm.policyHolder.fullName` | required | |
| `notificationForm.policyHolder.phone` | required | |
| `notificationForm.policyHolder.vatNumber` | required when `vatRegistered = true` | |
| `notificationForm.driver.reasonOther` | required when `reasonForDriving = OTHER` | |
| `reportedChannel` | one of ReportedChannel, when given | |
| `reportedAt` | not after `createdAt`; not before `incidentDate` | |

**Warnings, not errors** — return them in the response as `warnings` (string array), and store them:
- driving licence expired before the accident (`notificationForm.driver.licenceExpiryDate < incidentDate`)
- reported more than N days after the accident (N to be given by Standard)

### 4.3 Response `200` (or `201`)

The full claim as in [§5](#5-read-claim--get-claimsclaimuuid), plus:

```json
{
  "claimUuid": "5f0c2a7e-3b1d-4e0a-9a51-0d2b7c9e1f44",
  "claimNumber": "CLM-MOT-2026-000101",
  "status": "SUBMITTED",
  "warnings": ["The driving licence had expired before the accident date."],
  "...": "every field of §5"
}
```

The frontend needs `claimUuid` and `claimNumber` from this response (it opens the print page with them).

---

## 5. Read claim — GET /claims/{claimUuid}

Existing `ClaimResponse` fields stay. **New** fields marked `// new`.

```json
{
  "claimUuid": "5f0c2a7e-3b1d-4e0a-9a51-0d2b7c9e1f44",
  "claimNumber": "CLM-MOT-2026-000101",
  "policyNumber": "SIC/MOT/2026/00123",
  "productModule": "motor",
  "coverageType": "OWN_DAMAGE",
  "causeOfLoss": "COLLISION",
  "incidentDate": "2026-10-30T14:20:00",
  "incidentTime": "14:20",
  "incidentLocation": "Bole Road, near Edna Mall",
  "description": "…",
  "status": "BID_COMPLETED",
  "estimatedAmount": 45000,
  "approvedAmount": 29500,
  "plateNumber": "AA 3-B12345",
  "driverName": "Kebede Alemu Gebre",
  "driverLicenseNumber": "AA-DL-778812",
  "adjustorUuid": "ADJ-102",
  "garageUuid": null,
  "thirdPartyName": "Selam Transport",
  "submittedVia": "STAFF",
  "createdAt": "2026-10-30T16:10:12",
  "updatedAt": "2026-11-01T11:02:40",

  "reportedChannel": "WALK_IN",                               // new (M4)
  "reportedAt": "2026-10-30T16:05:00",                        // new (M4)
  "createdBy": { "userUuid": "…", "name": "Tigist Worku" },   // new (M4)
  "warnings": [],                                             // new (M3)
  "notificationForm": { "…": "exactly as sent in §4.1" },     // new (M1)

  "filedByRepresentative": false,                             // new (M10)
  "documentMarks": [                                          // new (M10), see §7.3
    { "documentType": "DRIVING_LICENCE", "status": "RECEIVED", "originalSeen": true,
      "reason": null, "markedBy": "Tigist Worku", "markedAt": "2026-10-31T09:12:00" }
  ],
  "requiredDocuments": [                                      // new (M10), computed, see §7.4
    { "documentType": "NOTIFICATION_FORM_SIGNED", "required": true, "satisfied": true },
    { "documentType": "DRIVING_LICENCE", "required": true, "satisfied": true },
    { "documentType": "VEHICLE_TITLE_DEED", "required": true, "satisfied": true },
    { "documentType": "POWER_OF_ATTORNEY", "required": false, "satisfied": true },
    { "documentType": "POLICE_REPORT", "required": true, "satisfied": true },
    { "documentType": "PROFORMA_INVOICE", "required": true, "satisfied": true }
  ],

  "closed": null,                                             // new (M9), see §8.2
  "excess": { "none": false, "amount": 2500, "receiptNo": "RC-7781",
              "recordedBy": "Tigist Worku", "recordedAt": "2026-11-01T10:40:00" },   // new (M11)
  "salvage": null,                                            // new (M11)
  "recovery": null,                                           // new, see §13

  "spotSurvey": { "surveyUuid": "…", "surveyorName": "Almaz Wolde", "surveyDate": "2026-10-31T00:00:00",
                  "location": "Bole Road", "isDrivable": true, "towingRequired": false, "towingCost": null,
                  "assessmentNotes": "Rear bumper and boot lid damaged; consistent with report." },
  "garageBids": [
    { "bidUuid": "b1", "garageCode": "GAR-200", "garageName": "AutoTrust Premium Garage",
      "bidAmount": 32000, "estimatedDays": 6, "repairScope": "Bumper, boot lid, paint", "status": "PENDING" },
    { "bidUuid": "b2", "garageCode": "GAR-202", "garageName": "Addis Auto Body Works",
      "bidAmount": 29500, "estimatedDays": 8, "repairScope": "", "status": "SELECTED" }
  ],
  "documents": [
    { "documentUuid": "…", "claimUuid": "…", "documentType": "NOTIFICATION_FORM_SIGNED",
      "originalFileName": "form.pdf", "contentType": "application/pdf", "sizeBytes": 183422,
      "uploadedAt": "2026-10-31T09:05:00", "isImage": false }
  ]
}
```

Please make sure `GET /claims/{id}` **always** includes `spotSurvey`, `garageBids` (with the selected one's
`status = "SELECTED"`) and `documents`. The list endpoint `GET /claims/module/motor` should include `documents`,
`documentMarks`, `filedByRepresentative`, `closed`, `excess`, `salvage`, `reportedAt`, so the list can show
"waiting on" without one call per claim; `notificationForm` may be left out of the list.

---

## 6. Policy validation — GET /policies/validate (M5)

`GET /policies/validate?policyNumber=SIC/MOT/2026/00123&productModule=motor&causeOfLoss=COLLISION`

Response — existing fields plus **new** ones (all optional, send what the policy has):

```json
{
  "valid": true,
  "validationMessage": "Policy active; collision covered.",
  "policyUuid": "…",
  "policyNumber": "SIC/MOT/2026/00123",
  "insuredName": "Abebe Kebede Tesfaye",
  "productModule": "motor",
  "subProductType": "PRIVATE",
  "coverageType": "COMPREHENSIVE",
  "status": "ACTIVE",
  "startDate": "2026-01-15",
  "endDate": "2027-01-14",
  "sumInsured": 1200000,
  "coveredCauses": ["COLLISION", "OVERTURNING", "THEFT", "FIRE"],
  "availableEndorsements": [],

  "insuredUuid": "…",                                   // new
  "insuredPhone": "0911 23 45 67",                      // new
  "insuredProfession": "Merchant",                      // new
  "insuredAddress": { "address": "Addis Ababa", "subCity": "Bole", "kebele": "03", "houseNo": "1234" },  // new
  "vatRegistered": true,                                // new
  "vatNumber": "VAT-0045821",                           // new
  "carUuid": "…",                                       // new
  "plateNumber": "AA 3-B12345",                         // new
  "vehicleTypeAndMake": "Toyota Corolla",               // new
  "vehicleUse": "Private",                              // new
  "yearOfMake": "2018",                                 // new
  "excessAmount": 2500                                  // new — policy excess, pre-fills stage 5
}
```

Unknown policy number → `404` (or `200` with `"valid": false`). Today the frontend can't tell an unknown policy from a
network failure.

---

## 7. Documents (M6, M10)

### 7.1 Upload — existing endpoint, contract to confirm (M6)

`POST /claims/{claimUuid}/documents?documentType=DRIVING_LICENCE` · `multipart/form-data` with one part **`file`**

Response `200` — please type it in OpenAPI as `ClaimDocumentResponse` (M8):

```json
{
  "documentUuid": "8d3e…",
  "claimUuid": "5f0c…",
  "documentType": "DRIVING_LICENCE",
  "originalFileName": "licence.pdf",
  "contentType": "application/pdf",
  "sizeBytes": 183422,
  "uploadedAt": "2026-10-31T09:05:00",
  "isImage": false
}
```

Please confirm: max file size (we suggest 10 MB), allowed types (we suggest `application/pdf`, `image/jpeg`,
`image/png`), and whether several files per type are allowed (we'd like yes). Uploading a file of a type should
count as `RECEIVED` for that type (§7.4). Optional: `DELETE /claims/{claimUuid}/documents/{documentUuid}`.

### 7.2 Request missing documents — existing endpoint

`POST /claims/{claimUuid}/request-documents`

```json
{
  "documentTypes": ["VEHICLE_TITLE_DEED", "PROFORMA_INVOICE"],
  "note": "Please bring or send the missing claim documents."
}
```

Response `200` — please type it (M8), e.g.:

```json
{ "requestedAt": "2026-10-31T09:20:00", "documentTypes": ["VEHICLE_TITLE_DEED", "PROFORMA_INVOICE"], "notified": "SMS" }
```

### 7.3 Document marks — new (M10)

For paper copies kept on file without a scan, "original seen" on the licence and title deed, and "not applicable".

`PUT /claims/{claimUuid}/documents/{documentType}/mark`

```json
{ "status": "RECEIVED", "originalSeen": true, "reason": null }
```

```json
{ "status": "NOT_APPLICABLE", "originalSeen": false, "reason": "Insured came in person" }
```

Clear a mark: `{ "status": null, "originalSeen": false, "reason": null }` (or `DELETE` the same path).
`reason` is required when `status = NOT_APPLICABLE`.

Response `200`:

```json
{ "documentType": "DRIVING_LICENCE", "status": "RECEIVED", "originalSeen": true, "reason": null,
  "markedBy": "Tigist Worku", "markedAt": "2026-10-31T09:12:00" }
```

Representative flag (power of attorney needed):

`PUT /claims/{claimUuid}/representative`

```json
{ "filedByRepresentative": true }
```

Response `200`: the claim (§5).

### 7.4 When is a document type satisfied

```text
POWER_OF_ATTORNEY is required only when filedByRepresentative = true.

satisfied(type) =
     not required(type)
  OR mark.status == NOT_APPLICABLE
  OR ( (has an upload of that type OR mark.status == RECEIVED)
       AND (type not in {DRIVING_LICENCE, VEHICLE_TITLE_DEED} OR mark.originalSeen) )
```

Return this per type in `requiredDocuments` (§5) and enforce it on `→ IN_PROCESS` (§3).

---

## 8. Status change, reject, withdraw, reopen (M9)

### 8.1 Status change — existing endpoint, now guarded

`PUT /claims/{claimUuid}/status?status=BID_COMPLETED&approvedAmount=29500`

Response `200`: the claim (§5). Wrong transition → `409`; guard not met → `422` (§17).

### 8.2 Reject / withdraw — new values with a reason

Either extend the existing call:

`PUT /claims/{claimUuid}/status?status=REJECTED` with body

```json
{ "reason": "Driver had no valid licence on the accident date" }
```

or add `POST /claims/{claimUuid}/close`:

```json
{ "outcome": "REJECTED", "reason": "Driver had no valid licence on the accident date" }
```

Response `200`: the claim with

```json
"status": "REJECTED",
"closed": {
  "outcome": "REJECTED",
  "reason": "Driver had no valid licence on the accident date",
  "statusBeforeClose": "IN_PROCESS",
  "closedBy": "Tigist Worku",
  "closedAt": "2026-11-01T12:43:29"
}
```

`REJECTED` allowed from `SUBMITTED`, `IN_PROCESS`, `BID_ASSIGNED`; `WITHDRAWN` also from `BID_COMPLETED` (§3).

### 8.3 Reopen

`POST /claims/{claimUuid}/reopen`

```json
{ "reason": "Licence renewal proof received" }
```

Response `200`: the claim with `status = closed.statusBeforeClose` and `closed = null`. Claim manager only.

---

## 9. Assessment — adjustor and spot survey

### 9.1 Assign adjustor — existing

`PUT /claims/{claimUuid}/assign-adjustor`

```json
{ "adjustorUuid": "ADJ-102" }
```

Then `PUT /claims/{claimUuid}/status?status=IN_PROCESS`. (Optional: do both in one call with `?andStart=true`.)

### 9.2 Spot survey — existing

`POST /motor/spot-survey`

```json
{
  "claimUuid": "5f0c…",
  "surveyorName": "Almaz Wolde",
  "surveyDate": "2026-10-31T00:00:00",
  "location": "Bole Road, near Edna Mall",
  "isDrivable": true,
  "towingRequired": false,
  "towingCost": null,
  "assessmentNotes": "Rear bumper and boot lid damaged; consistent with report."
}
```

Response `200`: `SpotSurveyResponse`. Please return it afterwards as `spotSurvey` on `GET /claims/{id}`.

### 9.3 Approve

`PUT /claims/{claimUuid}/status?status=BID_ASSIGNED` (guard: survey exists).

---

## 10. Repair quotes — garage bids

### 10.1 Add bid — existing

`POST /motor/garage-bids`

```json
{
  "claimUuid": "5f0c…",
  "garageCode": "GAR-202",
  "garageName": "Addis Auto Body Works",
  "bidAmount": 29500,
  "estimatedDays": 8,
  "repairScope": "Bumper, boot lid, paint"
}
```

Response `200`: `GarageBidResponse` with `"status": "PENDING"`. Only while the claim is `BID_ASSIGNED`.

### 10.2 Select bid — existing

`PUT /motor/garage-bids/{bidUuid}/select` → `GarageBidResponse` with `"status": "SELECTED"`; the other bids of the
claim become `REJECTED`. Then the frontend calls
`PUT /claims/{claimUuid}/status?status=BID_COMPLETED&approvedAmount=29500`.
(Optional: set `BID_COMPLETED` and `approvedAmount` inside the select call.)

---

## 11. Excess and salvage (M11)

### 11.1 Excess / contribution

`PUT /claims/{claimUuid}/excess`

```json
{ "none": false, "amount": 2500, "receiptNo": "RC-7781" }
```

```json
{ "none": true }
```

Rules: when `none = false`, `amount ≥ 0` and `receiptNo` required. Allowed while `BID_COMPLETED`.
Response `200`:

```json
{ "none": false, "amount": 2500, "receiptNo": "RC-7781", "recordedBy": "Tigist Worku", "recordedAt": "2026-11-01T10:40:00" }
```

### 11.2 Salvage

`PUT /claims/{claimUuid}/salvage`

```json
{ "status": "RETURNED", "note": "Bumper and tail lamp received at store" }
```

```json
{ "status": "NOT_REQUIRED", "note": "" }
```

Allowed while `MAINTENANCE_COMPLETED`. Response `200`:

```json
{ "status": "RETURNED", "note": "Bumper and tail lamp received at store", "recordedBy": "Tigist Worku", "recordedAt": "2026-11-01T11:30:00" }
```

---

## 12. Garage assignment and repair

`PUT /claims/{claimUuid}/assign-garage` — existing

```json
{ "garageUuid": "GAR-202" }
```

Then `PUT /claims/{claimUuid}/status?status=ASSIGN_TO_GARAGE&approvedAmount=27000`
(selected bid 29 500 − excess 2 500). Guard: excess recorded.

Repair: `PUT …/status?status=IN_MAINTENANCE`, then `PUT …/status?status=MAINTENANCE_COMPLETED`.
Handover: `PUT …/status?status=HANDOVER_COMPLETED` (guard: salvage recorded).

---

## 13. Recovery from the other party (subrogation)

`POST /motor/subrogation` — existing

```json
{
  "claimUuid": "5f0c…",
  "atFaultPartyName": "Selam Transport",
  "atFaultInsurerName": "Nyala Insurance",
  "atFaultPolicyNumber": "NIC/MOT/2026/7781",
  "recoveryAmount": 29500,
  "recoveryStatus": "INITIATED",
  "notes": "Police report names the minibus driver"
}
```

Response: `ClaimResponse`. Please also return it as `recovery` on the claim:

```json
"recovery": { "atFaultPartyName": "Selam Transport", "atFaultInsurerName": "Nyala Insurance",
              "atFaultPolicyNumber": "NIC/MOT/2026/7781", "recoveryAmount": 29500,
              "recoveryStatus": "INITIATED", "startedBy": "Tigist Worku", "startedAt": "2026-11-01T11:35:00" }
```

---

## 14. Activity log (M12)

`GET /claims/{claimUuid}/activity` — newest first

```json
[
  { "at": "2026-11-01T11:31:02", "byUserUuid": "…", "byName": "Tigist Worku",
    "action": "STATUS_CHANGED", "text": "Vehicle handed over to the insured",
    "data": { "from": "MAINTENANCE_COMPLETED", "to": "HANDOVER_COMPLETED" } },
  { "at": "2026-11-01T11:30:00", "byUserUuid": "…", "byName": "Tigist Worku",
    "action": "SALVAGE_RECORDED", "text": "Salvage returned: Bumper and tail lamp received at store", "data": null },
  { "at": "2026-11-01T10:41:10", "byUserUuid": "…", "byName": "Tigist Worku",
    "action": "GARAGE_ASSIGNED", "text": "Repair order to Addis Auto Body Works; Standard pays ETB 27,000",
    "data": { "garageUuid": "GAR-202", "approvedAmount": 27000 } }
]
```

Write one entry for every action in the ActivityAction enum (§2). The frontend shows `text`, `byName` and `at`.

---

## 15. Lookups — adjustors and garages (M12)

`GET /lookups/adjustors`

```json
[ { "adjustorUuid": "ADJ-100", "name": "Solomon Tadesse", "role": "Vehicle Adjustor", "active": true } ]
```

`GET /lookups/garages`

```json
[ { "garageUuid": "GAR-202", "garageCode": "GAR-202", "name": "Addis Auto Body Works", "phone": "…", "active": true } ]
```

Until these exist the screens use a fixed list: ADJ-100/101/102 and GAR-200/201/202.

---

## 16. Drafts (M7, optional)

Only if Standard wants unfinished claims kept on the server.

- `POST /claims?draft=true` — same body as §4.1; skips §4.2 validation; returns `status: "DRAFT"`, `claimNumber: null`.
- `PUT /claims/{claimUuid}` — same body; only while `DRAFT`.
- `POST /claims/{claimUuid}/submit` — runs §4.2, assigns `claimNumber`, moves to `SUBMITTED`.
- Drafts are excluded from `GET /claims/module/motor` unless `?includeDrafts=true`.

---

## 17. Errors

Keep the existing problem shape:

```json
{
  "type": "validation.failed",
  "title": "Validation failed",
  "status": 400,
  "detail": "Some fields are missing or invalid.",
  "timestamp": "2026-11-01T12:17:04.744669Z",
  "properties": {},
  "fieldErrors": [
    { "field": "notificationForm.policyHolder.phone", "message": "Policy holder phone is required" },
    { "field": "incidentDate", "message": "Accident date is outside the policy period" }
  ]
}
```

Wrong transition — `409`:

```json
{ "type": "claim.invalid-transition", "title": "Not allowed now", "status": 409,
  "detail": "Cannot move from SUBMITTED to BID_COMPLETED.",
  "properties": { "from": "SUBMITTED", "to": "BID_COMPLETED", "allowed": ["IN_PROCESS", "REJECTED", "WITHDRAWN"] },
  "fieldErrors": [] }
```

Guard not met — `422`:

```json
{ "type": "claim.requirements-missing", "title": "Requirements missing", "status": 422,
  "detail": "Required documents are missing.",
  "properties": { "missing": ["VEHICLE_TITLE_DEED", "PROFORMA_INVOICE"] },
  "fieldErrors": [] }
```

`field` names use the request's dotted path. The frontend shows `detail` and highlights `fieldErrors[].field`.

---

## 18. Suggested database changes

On the claim table:

| Column | Type | For |
|---|---|---|
| `notification_form` | `jsonb` | M1 |
| `reported_channel` | `varchar(16)` | M4 |
| `reported_at` | `timestamp` | M4 |
| `created_by_uuid`, `created_by_name` | `varchar` | M4 |
| `warnings` | `jsonb` (string array) | M3 |
| `filed_by_representative` | `boolean default false` | M10 |
| `closed_outcome`, `closed_reason`, `status_before_close`, `closed_by`, `closed_at` | `varchar` / `text` / `timestamp` | M9 |
| `excess_none`, `excess_amount`, `excess_receipt_no`, `excess_recorded_by`, `excess_recorded_at` | `boolean` / `numeric(14,2)` / `varchar` / `timestamp` | M11 |
| `salvage_status`, `salvage_note`, `salvage_recorded_by`, `salvage_recorded_at` | `varchar` / `text` / `timestamp` | M11 |

New tables:

```sql
claim_document_mark (
  claim_uuid      varchar  not null,
  document_type   varchar  not null,
  status          varchar  null,            -- RECEIVED | NOT_APPLICABLE
  original_seen   boolean  not null default false,
  reason          text     null,
  marked_by       varchar,
  marked_at       timestamp,
  primary key (claim_uuid, document_type)
);

claim_activity (
  id              bigserial primary key,
  claim_uuid      varchar   not null,
  at              timestamp not null,
  by_user_uuid    varchar,
  by_name         varchar,
  action          varchar   not null,
  text            text      not null,
  data            jsonb
);
create index on claim_activity (claim_uuid, at desc);
```

---

## 19. Frontend fallbacks to remove once done

Today these are kept in the user's browser (`localStorage`) and only on that computer:

| Browser key | Holds | Replaced by |
|---|---|---|
| `motor.claimNotificationForms.v1` | the notification form per claim, for the printout | M1 `notificationForm` |
| `motor.claimProcess.v1` → `reportedChannel` | how it was reported | M4 |
| `motor.claimProcess.v1` → `representative`, `documents` | document marks | M10 |
| `motor.claimProcess.v1` → `decision`, `closed` | approve / reject / withdraw | M9 |
| `motor.claimProcess.v1` → `excess`, `salvage` | excess and salvage | M11 |
| `motor.claimProcess.v1` → `recovery`, `activity` | recovery, activity log | §13, M12 |

Reply per item (M1–M12) with done / changed shape (show the new JSON) / won't do (why), so the frontend can switch
over each piece as it lands.
