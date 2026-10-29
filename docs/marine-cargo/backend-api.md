# Marine & Cargo — backend API the frontend needs

**For:** the backend team building the Marine & Cargo service.
**From:** the Marine & Cargo frontend (`src/features/marine/`, branch `feature/standard-web-rebranding`).
**Status:** the frontend is complete and runs against an in-browser mock. Updated 29 Oct 2026 with
**customer registration** (§12) and **finance** (§13): premium is paid before cover starts, so binding
raises a debit note and the certificate waits until Finance records the receipt. Every endpoint below is what the
frontend already calls; the mock in `src/features/marine/mock/` is the reference implementation — its rules,
validation messages and error codes are the behaviour the screens expect.

To switch the frontend to the real service, set `VITE_MARINE_MOCK=false`. Nothing else in the frontend changes.

---

## 1. Conventions (all endpoints)

| Topic | Rule |
|---|---|
| Base path | `/api/marine/v1` |
| Auth | The app's existing bearer token (same login as the other modules) |
| Content type | JSON, except the two uploads (`multipart/form-data`) and the PDF (`application/pdf`) |
| IDs | Strings. Natural keys where they exist: vessel = IMO, port = UN/LOCODE, commodity = HS code |
| Money | **Decimal strings**, never floats: `"115500.00"`. FX rates have 4 decimals, rates in % up to 4 decimals |
| Dates | `YYYY-MM-DD`; timestamps ISO 8601 UTC. The UI shows them in Africa/Addis_Ababa |
| Numbers | Record numbers are `Q-2026-00001` (quote), `P-…` (policy), `C-…` (certificate), `OC-…` (open cover), `MP-…` (master policy), `CL-…` (claim) |
| Correlation | Send `X-Correlation-Id` on every response; the UI shows it on error screens |

### Lists (every `GET` that returns many records)

Request: `?page=0&size=20&sort=field,desc` plus the filters listed per endpoint. Multi-value filters are
comma-separated (`status=QUOTED,APPROVED`) or repeated.

Response (Spring `Page` shape):

```json
{ "content": [ … ], "page": 0, "size": 20, "totalElements": 57 }
```

### Errors

```json
{
  "status": 422,
  "code": "VALIDATION",
  "message": "Some fields need attention.",
  "fields": [{ "field": "invoiceValue", "message": "Invoice value must be greater than 0" }],
  "correlationId": "4f1c9a2e"
}
```

| Status | When | Frontend behaviour |
|---|---|---|
| 401 | Token missing or expired | Back to login |
| 403 | Role not allowed, or above authority (`code: ABOVE_AUTHORITY`) | Shows the message |
| 404 | Not found **or not yours** (brokers get 404 for other brokers' records, never 403) | Not-found page |
| 409 | Wrong state; `code` says which (table in §15) | Shows the message, refreshes the record |
| 422 | Field validation; `fields[].field` must match the request field name (dot paths for nested: `lc.expiry`, `commodities.2.ratePct`) | Shows each message under its field |
| 5xx | Anything else | Error screen with the correlation id |

Spring's `fieldErrors: [{ field, defaultMessage }]` is also accepted.

### Roles

`ADMIN`, `BROKER`, `UNDERWRITER`, `SENIOR_UNDERWRITER`, `CLAIMS_HANDLER`, `CLAIMS_MANAGER`, `FINANCE`.
A user can hold several. FINANCE records every money movement (receipts, refunds, claim payments, commission);
ADMIN can read the finance screens but not post. **A user whose only role is BROKER sees only business where `brokerId` is their own
party** — on every list, detail, dashboard figure and audit entry. This must be enforced on the server.

---

## 2. What we need added to existing services

| # | Request | Why |
|---|---|---|
| 1 | **Marine roles in AuthService** — return them on the login/user payload (e.g. `marineRoles: ["UNDERWRITER"]` or privileges named `ROLE_MARINE_UNDERWRITER`) | The frontend hides menus, buttons and pages by role. Today it guesses from privilege names |
| 2 | **Broker ↔ party link** — each BROKER user carries `brokerPartyId` | Broker scoping (above). Quotes a broker creates must get `brokerId` = their party automatically |
| 3 | **`GET /config`** → `{ "features": { "hull": false, "inlandTransit": true }, "currencies": ["USD","EUR",…] }` | Feature flags (Hull stays hidden until ready) |
| 4 | **`POST /auth/logout`** | Ends the session on the server, not just in the browser |
| 5 | **Scheduled jobs** — expire quotes after `validUntil`; send deadline alerts (§11) | The mock does these on read; a real service should do them on a schedule |
| 6 | **Email sending** for certificates (§7) | Queue and send; the UI only needs `202` |

---

## 3. Master data

### Vessels — key: IMO
| Method | Path | Notes |
|---|---|---|
| GET | `/vessels` | Filters: `q` (IMO or name), `flag`, `minAge`, `maxAge`. Default sort `name,asc` |
| GET | `/vessels/{imo}` | 404 `"No vessel with this IMO number"` |
| POST | `/vessels` | 201 |
| PUT | `/vessels/{imo}` | IMO can't change |

```json
{ "imo": "9074729", "name": "MV Abay Star", "flag": "Ethiopia", "yearBuilt": 2012,
  "classSociety": "Lloyd's Register", "grossTonnage": 28000, "owner": "Ethiopian Shipping & Logistics",
  "source": "MANUAL", "age": 14 }
```
Validation: IMO = 7 digits **with a valid check digit**, unique; name, flag, classSociety required; yearBuilt 1900…this year; grossTonnage > 0 if given. `age` is computed.

### Ports — key: UN/LOCODE
GET `/ports` (`q`, `country`; sort `code,asc`) · POST `/ports` · PUT `/ports/{code}`
```json
{ "code": "DJJIB", "name": "Djibouti", "country": "Djibouti" }
```
Code = 2 letters + 3 letters/digits, unique. Ethiopian dry ports (`ETMJO` Modjo, `ETKLT` Kality, `ETDDA` Dire Dawa, `ETSML` Semera) are the inland-transit destinations.

### Commodities — key: HS code
GET `/commodities` (`q`, `commodityClass`, `restricted`; sort `hsCode,asc`) · GET `/commodities/classes` → `["GENERAL","BULK",…]` (the classes in the active rate table) · POST · PUT `/commodities/{hsCode}`
```json
{ "hsCode": "300490", "description": "Medicaments, packaged for retail sale", "commodityClass": "PHARMA", "restricted": false }
```
HS code 6–10 digits, unique. `restricted: true` always refers the quote.

### Parties (insured, consignee, bank, broker, carrier, surveyor)
GET `/parties` (`q` = name/TIN/email, `type`; sort `name,asc`) · GET `/parties/{id}` · POST · PUT `/parties/{id}`
```json
{ "id": "3", "name": "Abyssinia Agro Industries PLC", "types": ["INSURED"], "tin": "0012345678",
  "phone": "+251 11 …", "email": "ops@example.et", "address": "Addis Ababa", "contactPerson": "…" }
```
`types` ⊂ `INSURED, CONSIGNEE, BANK, BROKER, CARRIER, SURVEYOR`, at least one. TIN = 10 digits if given (format to confirm — open question 4).

### Audit trail
GET `/audit?entity=quote&id=6` → array, newest first:
```json
[{ "id": "41", "entity": "quote", "entityId": "6", "action": "Rated: quoted", "by": "Dev Tester",
   "at": "2026-10-28T09:12:00Z", "changes": [{ "field": "freight", "before": "3000", "after": "4000" }] }]
```
Entities: `quote, policy, certificate, openCover, claim, rateTable, rules, vessel, port, commodity, party, user`. Every write in this API adds an entry.

---

## 4. FX rates (role FINANCE to write)

| Method | Path | Notes |
|---|---|---|
| GET | `/fx-rates/today` | One row per foreign currency: `{ currency, date, rate \| null, source \| null }` — `null` means missing today (dashboard warns Finance) |
| GET | `/fx-rates` | Filters `currency` (multi), `from`, `to`. Sort `date,desc` |
| POST | `/fx-rates` | `{ currency, date, rate }` → 201 row |
| POST | `/fx-rates/import` | multipart `file` (CSV `currency,date,rate`) → `{ imported, rejected, errors: [{ row, message }] }` |

Row: `{ id, currency, date, rate: "156.0412", source: "MANUAL"|"IMPORT", enteredBy, createdAt }`.
Rules: currencies `USD, EUR, GBP, CNY, AED` (ETB is always 1); date not in the future; one rate per currency per day (422 `"A rate for this day already exists."`); rate > 0, max 4 decimals.
**Fallback:** if today's rate is missing, rating uses the latest earlier rate and returns `fx.fallback: true`; if there is none at all → 409 `NO_FX_RATE`.

---

## 5. Users (role ADMIN)

GET `/users` (`q`, `role`, `status=ENABLED|DISABLED`) · POST `/users` · PUT `/users/{id}` · POST `/users/{id}/enable` · POST `/users/{id}/disable`
```json
{ "id": "4", "username": "selam.t", "fullName": "Selam Tesfaye", "email": "selam@…", "roles": ["SENIOR_UNDERWRITER"],
  "enabled": true, "lastSignInAt": "2026-10-27T07:00:00Z",
  "brokerPartyId": null }   // new: the broker's party (section 2, item 2)
```
Username 3–40 of `a-z 0-9 . _ -`, unique (case-insensitive); at least one role. How a new user gets a first password is open question 1.

---

## 6. Quotes

### Status flow
`DRAFT → (rate) → QUOTED | REFERRED | DECLINED`; `REFERRED → (underwriter) → APPROVED | DECLINED`;
`QUOTED | APPROVED → (bind) → BOUND`; `QUOTED | APPROVED` past `validUntil` → `EXPIRED`.
Editable in `DRAFT, QUOTED, DECLINED, REFERRED` (an edit sends it back to `DRAFT` and clears the premium).

| Method | Path | Roles | Notes |
|---|---|---|---|
| GET | `/quotes` | all | Filters `q` (quote no / insured), `status` (multi), `product`, `brokerId`, `createdFrom`, `createdTo`, `expiring` (days). Rows add `premiumTotal`, `sumInsuredTotal` |
| GET | `/quotes/{id}` | all | Full quote (below) |
| POST | `/quotes` | BROKER, UW, SENIOR_UW | Saves a draft; partial data allowed. 201 |
| PUT | `/quotes/{id}` | same | 409 `WRONG_STATE` if not editable |
| POST | `/quotes/{id}/rate` | same | Validates (422), prices, runs every check, sets status, `validUntil = today + 30` |
| POST | `/quotes/{id}/bind` | same | Creates policy + certificate (below) |

### Request body (create / update)
```json
{
  "product": "SINGLE_SHIPMENT",            // or INLAND_TRANSIT (HULL behind a flag)
  "insuredId": "3", "insuredRole": "BUYER", // BUYER | SELLER (Incoterm check)
  "consigneeId": null, "brokerId": "8", "incoterm": "CFR",
  "mode": "SEA",                            // SEA | AIR | SEA_ROAD (ROAD is set for inland transit)
  "vesselImo": "9074729",                   // required for SEA and SEA_ROAD
  "portOfLoading": "INNSA", "transshipmentPorts": [], "portOfDischarge": "DJJIB",
  "finalDestination": "Kality",
  "sailingDate": "2026-10-16",              // not more than 30 days in the past
  "hsCode": "300490", "goodsDescription": "Packaged medicines", "packing": "",
  "currency": "USD", "invoiceValue": "80000.00", "freight": "4000.00",
  "invoiceNo": "", "blNo": "", "containers": ["MSCU1234567"],   // 4 letters + 7 digits
  "clause": "ICC_C", "warCover": false, "strikesCover": false,
  "deductible": "", "specialConditions": "",                     // ≤ 2000 chars
  "lc": { "enabled": false, "number": "", "bankId": null, "amount": "", "expiry": "" },
  "inland": { "from": "DJJIB", "to": "ETKLT", "truckPlate": "", "driverName": "", "convoyRef": "" },
  "openCoverId": null
}
```

Rate-time validation (422): product, insured, insuredRole, incoterm, mode, vessel (valid IMO check digit) for sea modes, both ports (different), final destination, sailing date, commodity (in master list), goods description, invoice > 0, freight ≥ 0, clause; inland leg (`from`, `to`, `truckPlate`, `driverName`) for `INLAND_TRANSIT` and `SEA_ROAD`; LC number/bank/amount/expiry when `lc.enabled`, and **LC expiry after sailing date**.
**The insured must be an approved customer** (§12): otherwise 422 on `insuredId` — "… is waiting for approval and can't be insured yet" (or "… was rejected …").

### Response (quote)
All request fields, plus:
```json
{
  "id": "6", "quoteNo": "Q-2026-00006", "status": "QUOTED",
  "insured": { "id": "3", "name": "…", "email": "…", "phone": "…" }, "consignee": null, "broker": null,
  "vessel": { "imo": "9074729", "name": "MV Abay Star", "flag": "Ethiopia", "yearBuilt": 2012, "classSociety": "Lloyd's Register", "age": 14 },
  "loadingPort": { "code": "INNSA", "name": "Nhava Sheva", "country": "India" },
  "dischargePort": { … }, "transshipments": [], "inlandFrom": null, "inlandTo": null,
  "commodity": { "hsCode": "300490", "description": "…", "commodityClass": "PHARMA", "restricted": false },
  "lcBank": null,
  "premium": {
    "sumInsured": { "base": "84000.00", "uplift": "8400.00", "total": "92400.00" },
    "sumInsuredEtb": "14418206.88",
    "lines": [
      { "key": "base",     "label": "Base rate (PHARMA)",            "rate": "0.3500%", "amount": "50463.72" },
      { "key": "clause",   "label": "Clause factor (ICC C)",          "rate": "× 0.60",  "amount": "-20185.49" },
      { "key": "route",    "label": "Route factor (Asia → Djibouti, SEA)", "rate": "× 1.00", "amount": "0.00" },
      { "key": "age",      "label": "Vessel age loading (14 years)",  "rate": "0%",      "amount": "0.00" },
      { "key": "war",      "label": "War",                            "rate": "Not covered", "amount": "0.00" },
      { "key": "strikes",  "label": "Strikes",                        "rate": "Not covered", "amount": "0.00" },
      { "key": "minimum",  "label": "Minimum premium adjustment",     "rate": "min ETB 500.00", "amount": "0.00" },
      { "key": "vat",      "label": "VAT",                            "rate": "15%",     "amount": "4541.74" },
      { "key": "stamp",    "label": "Stamp duty",                     "rate": "fixed",   "amount": "5.00" }
    ],
    "total": "34824.97", "currency": "ETB", "rateTableId": "1", "rateTableVersion": "2026 v1", "agreedRate": false
  },
  "fx": { "currency": "USD", "rate": "156.0412", "date": "2026-10-28", "fallback": false },
  "referralReasons": [ { "code": "VALUE", "message": "Sum insured is above ETB 50,000,000 (High value)." } ],
  "declineNote": "",
  "checks": {
    "screenings": [ { "id": "12", "type": "Vessel", "name": "MV Abay Star", "identifier": "IMO 9074729",
                      "result": "CLEAR", "matches": [], "screenedAt": "…" } ],
    "accumulation": { "current": "0.00", "thisQuote": "14418206.88", "total": "14418206.88",
                      "softLimit": "150000000", "hardLimit": "300000000", "level": "OK" },
    "warranties": [ { "id": "w2", "name": "Vessel not over 20 years", "action": "LOAD", "loadPct": "10",
                      "detail": "Age 14 years, maximum 20", "result": "PASS" } ],
    "inland": null
  },
  "sanctionsConfirmed": false,
  "validUntil": "2026-11-27", "ratedAt": "…",
  "policy": { "id": "3", "policyNo": "P-2026-00003" },          // once bound
  "openCover": null,                                             // { id, coverNo } for declarations
  "late": false, "limits": null,                                 // declarations only (§9)
  "referral": { "id": "2", "status": "OPEN", "assigneeName": null, "authorityNeeded": "UNDERWRITER", "note": null },
  "createdBy": "…", "createdAt": "…", "updatedAt": "…"
}
```
**Broker-only callers:** while `REFERRED`, return `referralReasons: []`, `checks: null`, `underReview: true` (they see "Under review by underwriting", not the reasons — open question 5).

### Pricing (backend owns this; the UI only displays the lines)
1. Sum insured = (invoice + freight) × (1 + `upliftPct`) — CIF + 10 %.
2. Convert to ETB at the day's FX rate.
3. Base = SI × commodity-class rate % (or the open cover's agreed rate, or an underwriter's override).
4. × clause factor, × route factor (origin region → destination, mode; fallback `Any`).
5. + vessel-age loading (age band), + warranty loading (breached LOAD warranties).
6. + war %, + strikes % of SI if chosen.
7. Raise to the minimum premium; + VAT %; + stamp duty.
Age band action `DECLINE` → status `DECLINED` with `declineNote`.

### Checks run on every rating → `REFERRED` if any reason
| Code | Rule (from §11 rules / rate table) |
|---|---|
| `VALUE` | SI (ETB) over the "High value" threshold |
| `COMMODITY` | Commodity restricted, or class in a referral list (e.g. DANGEROUS) |
| `ROUTE` | Any port in a referral list (e.g. SOBBO, ERMSW) |
| `VESSEL_AGE` | Age band says REFER, or "very old vessels" rule |
| `SANCTIONS` | Any screening `POTENTIAL` (insured, consignee, LC bank, vessel, owner/operator, route countries; fuzzy name match ≥ 60 %) |
| `WARRANTY` | A breached warranty with action REFER (e.g. vessel unclassed) |
| `ACCUMULATION` | Same vessel + sailing date total over soft/hard limit; inland per-truck / per-convoy limit |
| `DECLARATION_LIMIT` | Open cover: commodity not listed, over per-conveyance limit, or over remaining balance |

A screening already reviewed (CLEAR / CONFIRMED) is kept when the quote is re-rated. Any `CONFIRMED` match blocks binding for good.
`authorityNeeded`: `SENIOR_UNDERWRITER` if accumulation is over the hard limit or SI is above the underwriter's limit, else `UNDERWRITER`.

### Bind
Allowed when `QUOTED` with no referral reasons, or `APPROVED`. Otherwise 409 `WRONG_STATE` ("Referral pending: an underwriter must approve before binding.") or `SANCTIONS_CONFIRMED`.
Creates the policy (`periodFrom = sailingDate`, `periodTo` + 90 days, inland + 30 days; wording `ICC 1/1/2009` [+ inland extension]) and certificate v1, and freezes a snapshot of the quote on both.

**Pay before cover:** binding also raises a **debit note** for the premium (§13). The certificate is
`AWAITING_PAYMENT` — no PDF, no email, no claims — until Finance records the premium in full; it then
becomes `PENDING` (PDF being generated) and `ISSUED`. **Declarations under an open cover are the
exception:** no debit note, the certificate issues straight away (the cover's deposit and year-end
adjustment bill them).
```json
{ "quote": { …quote… }, "policy": { "id": "3", "policyNo": "P-2026-00003" },
  "certificate": { "id": "3", "certNo": "C-2026-00003", "awaitingPayment": true },
  "debitNote": { "id": "3", "noteNo": "DN-2026-00003", "total": "62183.52" },   // null for declarations
  "openCover": null }
```

---

## 7. Policies and certificates

| Method | Path | Notes |
|---|---|---|
| GET | `/policies` | Filters `q` (policy no / insured / IMO), `status` (`ACTIVE, EXPIRED, CANCELLED`), `product`, `periodFrom`, `periodTo`. Rows add `premiumTotal`, `sumInsuredTotal` |
| GET | `/policies/{id}` | The bound quote's fields + `policyNo, status, periodFrom, periodTo, wordingVersion, openCoverId, quoteId, quoteNo, refund, certificates: [{ id, certNo, version, status, issuedAt }], billing: [note summary]` |
| GET | `/certificates` | Filters `q` (cert no / B/L), `status`, `vesselImo`, `issuedFrom`, `issuedTo`. Sort `createdAt,desc` |
| GET | `/certificates/{id}` | Below |
| GET | `/certificates/{id}/pdf` | `application/pdf`. 409 `AWAITING_PAYMENT` before the premium is paid, `PDF_PENDING` while generating |
| POST | `/certificates/{id}/email` | `{ recipients: ["a@b.et"] }` → **202** `{ queued: true }`. 422 if empty / invalid; 409 `AWAITING_PAYMENT` |
| POST | `/certificates/{id}/events` | `{ kind: "DOWNLOAD" \| "PRINT" }` — logged in the certificate's history |
| POST | `/certificates/{id}/amend` | UW / SENIOR_UW. See below |
| POST | `/certificates/{id}/cancel` | UW / SENIOR_UW. See below |
| GET | `/public/verify/{token}` | **No login.** The QR code target |

Certificate statuses: `AWAITING_PAYMENT, PENDING, ISSUED, AMENDED, EXPIRED, CANCELLED` (`AWAITING_PAYMENT` until its debit note is paid in full; `EXPIRED` once the policy period has ended).

```json
{
  "id": "1", "certNo": "C-2026-00001", "version": 1, "status": "ISSUED", "policyId": "1",
  "token": "4f9e…", "createdAt": "…", "issuedAt": "…",
  "events": [ { "kind": "EMAIL", "by": "…", "at": "…", "to": "ops@…" } ],
  "product": "SINGLE_SHIPMENT", "mode": "SEA", "clause": "ICC_A", "inland": null, "openCover": null,
  "hasOpenClaim": false,
  "policy": { "id": "1", "policyNo": "P-2026-00001", "periodFrom": "…", "periodTo": "…" },
  "insured": { … }, "vessel": { … }, "loadingPort": { … }, "dischargePort": { … },
  "finalDestination": "Modjo dry port", "sailingDate": "…", "blNo": "", "lcBank": null,
  "goodsDescription": "…", "currency": "USD", "sumInsured": "115500.00", "premiumTotal": "62183.52",
  "emails": ["insured@…", "broker@…"],      // suggested recipients
  "versions": [ { "id": "1", "version": 1, "status": "ISSUED", "issuedAt": "…" } ],
  "billing": [ { "id": "1", "noteNo": "DN-2026-00001", "kind": "DEBIT", "source": "BIND", "status": "PAID",
                 "total": "62183.52", "paid": "62183.52", "outstanding": "0.00", "issuedAt": "…", "dueDate": "…" } ]
}
```

**PDF:** the backend generates it (Standard Insurance letterhead, certificate data, special conditions, QR code linking to `{app}/verify/{token}`). Generation can be async — `status: PENDING` until done; the UI polls.

**Amend** — `{ dryRun: true|false, reason: "…", changes: { vesselImo?, sailingDate?, invoiceValue?, freight?, lc?, specialConditions? } }`
- `dryRun: true` → preview, nothing saved:
  `{ oldPremium, newPremium, difference, oldSumInsured, newSumInsured, screenings: [vessel/owner/bank], referralReasons: [] }`
- `dryRun: false` → reason ≥ 10 chars; if the change would refer → 409 `NEEDS_REFERRAL` (open question 6). Otherwise the current version becomes `AMENDED`, a new version is created (`version + 1`, new token, `PENDING`), the policy snapshot updates → `{ id, certNo, version }`.
- **Billing the change:** extra premium (net + VAT) raises an `ENDORSEMENT` debit note; the new version is `AWAITING_PAYMENT` and **the current version stays valid until it's paid**, then becomes `AMENDED`. Lower premium raises a credit note (refund) and the new version takes over at once. Declarations: no notes. `{ id, certNo, version, awaitingPayment }`.
- Only the latest version of an `ISSUED`/`PENDING` certificate can be amended or cancelled (409 `WRONG_STATE`). An unpaid version 1 (`AWAITING_PAYMENT`) can be cancelled.

**Cancel** — `{ reason: "SHIPMENT_CANCELLED" | "ISSUED_IN_ERROR" | "REPLACED", note: "…" }`
409 `OPEN_CLAIM` if a claim is open. Unpaid or part-paid debit notes on the policy are **cancelled**. If premium was received, a `CANCELLATION` credit note refunds it (the full premium, or what was received if less); `REPLACED` refunds nothing. The amount is also stored as `policy.refund`. Policy becomes `CANCELLED` when all its certificates are cancelled/amended. Returns the certificate.

**Public verify** (no auth, no personal data beyond this):
```json
{ "status": "VALID", "certNo": "C-2026-00001", "version": 1, "insuredName": "…", "vesselName": "MV Abay Star",
  "voyage": "Shanghai → Djibouti → Modjo dry port", "sumInsured": "115500.00", "currency": "USD",
  "issuedAt": "…", "insurerPhone": "+251 11 551 8400" }
```
`status`: `VALID, SUPERSEDED` (older version / amended — a newer version only supersedes once it's paid for), `EXPIRED, CANCELLED, PENDING` (also shown while awaiting payment). Unknown token → 404. Please rate-limit this endpoint.

---

## 8. Rate tables (ADMIN, SENIOR_UNDERWRITER to edit)

| Method | Path | Notes |
|---|---|---|
| GET | `/rate-tables` | Summaries `{ id, name, product, effectiveFrom, effectiveTo, status, createdBy, createdAt }` |
| GET | `/rate-tables/{id}` | Full table |
| POST | `/rate-tables` | `{ copyFrom?: id, product? }` → new `DRAFT` copied from that table (or the active one), named `2026 v2`, effective tomorrow |
| PUT | `/rate-tables/{id}` | Drafts only (409 `WRONG_STATE`). Any of `name, effectiveFrom, general, commodityRates, clauseFactors, routeFactors, ageBands, warStrikes` |
| POST | `/rate-tables/{id}/activate` | Validates (422 with dot-path fields); the current `ACTIVE` table of the same product → `RETIRED` with `effectiveTo = new.effectiveFrom − 1` |

```json
{
  "id": "1", "name": "2026 v1", "product": "SINGLE_SHIPMENT", "status": "ACTIVE",
  "effectiveFrom": "2026-01-01", "effectiveTo": null,
  "general": { "upliftPct": "10", "minPremium": "500.00", "vatPct": "15", "stampDuty": "5.00" },
  "commodityRates": [ { "commodityClass": "GENERAL", "ratePct": "0.2500" }, … ],
  "clauseFactors": { "ICC_A": "1.00", "ICC_B": "0.75", "ICC_C": "0.60" },
  "routeFactors": [ { "originRegion": "Asia", "destination": "Djibouti", "mode": "SEA", "factor": "1.00" }, … ],
  "ageBands": [ { "fromAge": 0, "toAge": 15, "loadingPct": "0", "action": "LOAD" },
                { "fromAge": 26, "toAge": 30, "loadingPct": "50", "action": "REFER" },
                { "fromAge": 31, "toAge": 99, "loadingPct": "0", "action": "DECLINE" } ],
  "warStrikes": { "warRatePct": "0.0500", "strikesRatePct": "0.0250", "routes": [] }
}
```
Activation must respect `effectiveFrom` (the mock activates immediately — a real service should switch on that date). The validation rules are in `src/features/marine/utils/rateTable.js` (age bands contiguous with no gaps/overlaps, factors > 0, …).

---

## 9. Underwriting

### Referrals (UNDERWRITER, SENIOR_UNDERWRITER)
| Method | Path | Notes |
|---|---|---|
| GET | `/referrals` | Filters `status` (`OPEN, APPROVED, DECLINED, WITHDRAWN`), `reason` (codes), `assignee=me\|none`, `raisedFrom`, `raisedTo`. Default sort `raisedAt,asc` (oldest first) |
| GET | `/referrals/{id}` | Row + `quote` (full) + `authority` = the caller's limits |
| POST | `/referrals/{id}/assign` | Assign to self. 409 if already decided |
| POST | `/referrals/{id}/decide` | Below |
| POST | `/screenings/{id}/review` | `{ decision: "CLEAR" \| "CONFIRM", note }` (note ≥ 10). Re-rates the quote; a cleared false positive with nothing else to refer goes straight back to `QUOTED`. Returns the screening |

Referral row:
```json
{ "id": "2", "quoteId": "4", "quoteNo": "Q-2026-00004", "insured": { … }, "status": "OPEN",
  "reasons": [ { "code": "VALUE", "message": "…" } ], "reasonCodes": ["VALUE"],
  "sumInsuredEtb": "60125000.00", "authorityNeeded": "SENIOR_UNDERWRITER",
  "raisedAt": "…", "waitingHours": 17, "assigneeName": null,
  "history": [ { "at": "…", "by": "…", "action": "Raised", "note": "" } ] }
```
`authority`: `{ "role": "UNDERWRITER", "maxSumInsured": "20000000", "canOverrideRate": false, "canWaiveWarranty": false }`

**Decide** — `{ decision: "APPROVE" | "DECLINE" | "ESCALATE", note, rateOverridePct?, waiveWarrantyIds? }`
- `DECLINE`: note ≥ 10 → quote `DECLINED`.
- `APPROVE` / `ESCALATE`: 409 `SANCTIONS_PENDING` if any screening is `POTENTIAL`, `SANCTIONS_CONFIRMED` if confirmed.
- `ESCALATE`: `authorityNeeded = SENIOR_UNDERWRITER`, unassigned.
- `APPROVE`: 403 `ABOVE_AUTHORITY` if SI (ETB) > caller's `maxSumInsured` or a senior is needed; 403 if overriding the rate / waiving warranties without that right. Re-prices with the override and waivers → quote `APPROVED`, `validUntil = today + 30`.
- A referral is `WITHDRAWN` automatically when re-rating leaves no reasons.

### Rules admin
GET `/rules` · PUT `/rules/{section}` (ADMIN) with `{ note: "what changed and why", data: … }`. Sections and `data`:
```json
{
  "referral":     [ { "id": "r1", "name": "High value", "condition": "SUM_INSURED_OVER", "value": "50000000", "active": true },
                    { "id": "r2", "name": "Dangerous goods", "condition": "COMMODITY_CLASS_IN", "value": ["DANGEROUS"], "active": true },
                    { "id": "r3", "name": "Somali and Eritrean ports", "condition": "ROUTE_IN", "value": ["SOBBO","ERMSW"], "active": true },
                    { "id": "r4", "name": "Very old vessels", "condition": "VESSEL_AGE_OVER", "value": "25", "active": false },
                    { "id": "r5", "name": "Possible sanctions match", "condition": "SANCTIONS_RESULT_IS", "value": "POTENTIAL", "active": true } ],
  "accumulation": { "softLimit": "150000000", "hardLimit": "300000000" },
  "warranties":   [ { "id": "w1", "name": "Vessel must be classed", "condition": "CLASS_REQUIRED", "value": "", "action": "REFER", "loadPct": "", "active": true },
                    { "id": "w2", "name": "Vessel not over 20 years", "condition": "VESSEL_AGE_MAX", "value": "20", "action": "LOAD", "loadPct": "10", "active": true } ],
  "authority":    [ { "role": "UNDERWRITER", "maxSumInsured": "20000000", "canOverrideRate": false, "canWaiveWarranty": false },
                    { "role": "SENIOR_UNDERWRITER", "maxSumInsured": "500000000", "canOverrideRate": true, "canWaiveWarranty": true },
                    { "role": "CLAIMS_HANDLER", "maxSumInsured": "500000", … }, { "role": "CLAIMS_MANAGER", "maxSumInsured": "10000000", … } ],
  "inland":       { "perVehicle": "15000000", "perConvoy": "60000000" },
  "deadlines":    [ { "kind": "SURVEY", "base": "NOTIFIED_DATE", "days": 7, "alerts": [3, 1] },
                    { "kind": "CARRIER_NOTICE", "base": "DELIVERY_DATE", "days": 3, "alerts": [1] },
                    { "kind": "DOCUMENTS", "base": "NOTIFIED_DATE", "days": 30, "alerts": [14, 7, 3, 1] },
                    { "kind": "SUIT_TIME_BAR", "base": "DELIVERY_DATE", "days": 365, "alerts": [30, 14, 7, 3, 1] } ],
  "changes":      [ { "section": "accumulation", "note": "…", "by": "…", "at": "…" } ]
}
```
Validation: note required; soft limit > 0 and hard > soft; per-convoy ≥ per-vehicle; deadline days > 0; referral rule name required. Returns the whole rules object.

---

## 10. Open covers (annual contracts) and declarations

| Method | Path | Roles | Notes |
|---|---|---|---|
| GET | `/open-covers` | all (broker-scoped) | Filters `q`, `status` (`ACTIVE, EXPIRED, ADJUSTED`), `brokerId`, `activeOn` (date) |
| GET | `/open-covers/{id}` | all | Cover + `declarations[]` + `masterPolicyNo` |
| POST | `/open-covers` | UW, SENIOR_UW | 201 |
| PUT | `/open-covers/{id}` | UW, SENIOR_UW | 409 once adjusted |
| POST | `/open-covers/{id}/declarations` | BROKER, UW, SENIOR_UW | Quote body (§6) → a `DRAFT` quote locked to the cover. 409 unless cover `ACTIVE` |
| POST | `/open-covers/{id}/adjustment` | FINANCE | `{ dryRun }`. 409 `PERIOD_OPEN` before period end, `ALREADY_ADJUSTED` |

```json
{
  "id": "1", "coverNo": "OC-2026-00001", "masterPolicyNo": "MP-2026-00001", "status": "ACTIVE",
  "insuredId": "3", "insured": { … }, "brokerId": "8", "broker": { … },
  "periodFrom": "2026-01-01", "periodTo": "2026-12-31", "currency": "USD",
  "annualLimit": "5000000.00", "perConveyanceLimit": "500000.00", "declarationDays": 15,
  "clause": "ICC_A", "warCover": false, "strikesCover": false,
  "commodities": [ { "hsCode": "310530", "ratePct": "0.2000", "commodity": { … } } ],
  "provisionalPremium": "25000.00",
  "used": "115500.00", "remaining": "4884500.00", "usedPct": 2.31,
  "declarationCount": 1, "lateCount": 0, "adjustment": null,
  "declarations": [ { "quoteId": "5", "quoteNo": "Q-2026-00005", "policyId": "2", "policyNo": "…", "certificateId": "2",
                      "certNo": "…", "sailingDate": "…", "declaredAt": "…", "vessel": "Maersk Kalahari",
                      "commodity": { … }, "sumInsured": "115500.00", "premium": "57001.97", "late": false, "status": "ISSUED" } ]
}
```
Validation: insured (**an approved customer**, 422 on `insured` otherwise), both dates (to after from), annual limit > 0, per-conveyance > 0 and ≤ annual, declaration days 1–60, clause, ≥ 1 commodity (no duplicates, rate > 0), provisional premium ≥ 0.

**Billing:** creating a cover raises an `OPEN_COVER_DEPOSIT` debit note for the provisional premium (ETB, no VAT line).

**Declarations** are quotes with `openCoverId`. The server forces `product = SINGLE_SHIPMENT` and copies insured, broker, currency, clause, war/strikes from the cover. Rating uses the cover's **agreed rate** for that commodity (`premium.agreedRate: true`), adds `DECLARATION_LIMIT` reasons (§6), and returns:
```json
"late": true,
"limits": { "currency": "USD", "annualLimit": "…", "perConveyanceLimit": "…",
            "remainingBefore": "…", "thisDeclaration": "…", "remainingAfter": "…" }
```
`late` = sailed more than `declarationDays` ago. Cancelled certificates give their amount back to the balance.

**Year-end adjustment** statement (dry run returns this; posting stores it on the cover, status → `ADJUSTED`, adds `postedAt, postedBy, exportRef: "ACC-2026-00001"`, and raises an `ADJUSTMENT` debit note for `DUE_FROM_INSURED` or credit note for `REFUND_TO_INSURED`, whose number is stored as `adjustment.noteNo`):
```json
{ "declarationCount": 12, "totalSumInsured": "…", "currency": "USD", "earnedPremium": "…",
  "provisionalPremium": "25000.00", "difference": "…", "direction": "DUE_FROM_INSURED" }   // or REFUND_TO_INSURED
```

---

## 11. Claims (CLAIMS_HANDLER, CLAIMS_MANAGER)

### Status flow
`REGISTERED → SURVEYED` (survey report uploaded) `→ APPROVED | DECLINED` (assess) `→ PAYMENT_REQUESTED` (claims manager settles) `→ PAID` (Finance pays, §13) `→ CLOSED`.
Displayed as `RECOVERY` while `PAID` with an open carrier recovery.

| Method | Path | Notes |
|---|---|---|
| GET | `/claims` | Filters `q` (claim / cert / B/L / insured), `status`, `type`, `handler`, `policyId`, `certificateId`, `lossFrom`, `lossTo`, `overdue=true`. **Default sort: next deadline soonest, none last** |
| GET | `/claims/{id}` | Full claim (below) |
| POST | `/claims` | Register. Body below |
| PUT | `/claims/{id}` | Loss details, only while `REGISTERED` |
| POST | `/claims/{id}/tasks` · PUT `/claims/{id}/tasks/{taskId}` | Survey, general average, salvage, recovery |
| POST | `/claims/{id}/documents` | multipart `file` + `kind` |
| POST | `/claims/{id}/assess` | Covered + reserve, or not covered + reason |
| PUT | `/claims/{id}/reserve` | `{ reserve }` > 0 |
| POST | `/claims/{id}/settle` | CLAIMS_MANAGER only — creates a payment request for Finance |
| POST | `/claims/{id}/close` | |
| GET | `/deadlines?claimId=…` | Deadline views |
| POST | `/deadlines/{id}/met` | `{ note }` required |

**Register / update body**
```json
{ "certificateId": "3", "lossDate": "2026-10-25", "notifiedDate": "2026-10-28", "deliveryDate": "2026-10-26",
  "type": "PARTICULAR_AVERAGE",          // GENERAL_AVERAGE | SALVAGE | TOTAL_LOSS
  "cause": "THEFT",                      // WATER_DAMAGE | THEFT | BREAKAGE | FIRE | SINKING | OVERTURNING | HIJACK | OTHER
  "description": "Two pallets missing on delivery at Kality warehouse",   // ≤ 2000
  "estimatedAmount": "9000.00", "payeeId": "12", "payeeNote": "" }
```
Validation: loss date not future; notified ≥ loss; delivery ≥ loss; certificate exists, is not cancelled and **is paid for** (422 on `certificate`: "The premium for this certificate isn't paid, so there is no cover"). Currency comes from the certificate.
The server sets: `claimNo`, `handlerName` (caller), `clauseCheck`, `outsidePeriod` (loss date outside the policy period), creates deadlines.

**Clause check** (`clauseCheck: { result: "COVERED" | "NOT_COVERED" | "CHECK", message }`):
ICC A covers every cause (all risks); ICC B names water damage, fire, sinking, overturning; ICC C names fire, sinking, overturning; `OTHER` → `CHECK` manually. Shown as a warning, never blocks.

**Claim response**
```json
{
  "id": "1", "claimNo": "CL-2026-00001", "status": "REGISTERED", "certificateId": "3", "certNo": "C-2026-00003", "policyId": "3",
  "type": "…", "cause": "THEFT", "lossDate": "…", "notifiedDate": "…", "deliveryDate": "…", "description": "…",
  "currency": "USD", "estimatedAmount": "9000.00", "reserve": null, "handlerName": "Dev Tester",
  "insured": { … }, "payee": { … }, "lossPayee": { … } ,      // LC bank when the certificate has an LC
  "clauseCheck": { "result": "NOT_COVERED", "message": "Not covered under ICC C: theft or non-delivery is not a named peril" },
  "outsidePeriod": false, "deductible": "0", "voyage": "Shanghai → Djibouti",
  "certificate": { "id": "3", "certNo": "…", "version": 1, "status": "ISSUED", "sumInsured": "…", "clause": "ICC_C", "vessel": "MV Abay Star" },
  "policy": { "id": "3", "policyNo": "…", "periodFrom": "…", "periodTo": "…" },
  "money": { "currency": "USD", "estimated": "9000.00", "reserve": null, "paid": "0.00", "gaSalvage": "0.00", "recovered": "0.00", "net": "0.00" },
  "documentsChecklist": [ { "kind": "BILL_OF_LADING", "label": "Bill of lading", "mandatory": true, "status": "MISSING", "files": [] } ],
  "missingDocuments": ["Original certificate", "Bill of lading", "…"],
  "deadlines": [ { "id": "1", "kind": "CARRIER_NOTICE", "dueDate": "2026-10-29", "status": "OPEN", "daysLeft": 0, "overdue": false,
                   "alertsSent": ["2026-10-28"], "escalatedAt": null, "baseDate": "…", "base": "DELIVERY_DATE" } ],
  "nextDeadline": { … },
  "survey": null, "ga": [], "salvage": [], "recovery": null, "recoveryResolved": true,
  "assessment": null, "payments": [], "documents": [],
  "vouchers": [ { "id": "1", "voucherNo": "PV-2026-00001", "amount": "10000.00", "status": "REQUESTED", "payee": { … }, … } ],
  "recoveryReceipts": [],
  "history": [ { "at": "…", "by": "…", "action": "Registered against C-2026-00003", "note": "" } ],
  "createdAt": "…", "updatedAt": "…"
}
```
`net = paid + GA/salvage − recovered`.

**Tasks** — body has `kind` (and `id` when editing a GA / salvage row) plus:
| kind | Fields | Rules / effects |
|---|---|---|
| `SURVEY` (one per claim) | `surveyorId, appointedDate, dueDate, surveyDate, findings, fee` (server sets `reportReceivedAt`) | due > appointed; sets the SURVEY deadline's due date |
| `GA` (many) | `declarationDate, adjusterId, securityType (GA_BOND \| GUARANTEE), securityAmount, contributionAmount` | contribution ≥ 0 |
| `SALVAGE` (many) | `salvorId, amount, security, notes` | amount > 0 |
| `RECOVERY` (one) | `carrierId, noticeSentDate, amountClaimed, amountRecovered, status (OPEN \| RECOVERED \| PARTLY_RECOVERED \| WRITTEN_OFF), notes` | recovered ≤ claimed; first `noticeSentDate` meets the CARRIER_NOTICE deadline |
409 if the claim is `CLOSED` / `DECLINED`. Returns the claim.

**Documents** — PDF, JPG, PNG only, ≤ 20 MB (422 otherwise). Kinds: `CERTIFICATE*, BILL_OF_LADING*, INVOICE*, PACKING_LIST, SURVEY_REPORT*, CARRIER_NOTICE*, OTHER` (* mandatory). Effects: a `SURVEY_REPORT` marks the survey received, meets the SURVEY deadline and moves `REGISTERED → SURVEYED`; a `CARRIER_NOTICE` meets that deadline; when all mandatory kinds are present the DOCUMENTS deadline is met. Store the file (the mock keeps metadata only) and return `{ id, kind, name, size, type, uploadedBy, uploadedAt }` inside `documents`.

**Assess** — only from `REGISTERED` / `SURVEYED`.
`{ covered: true, reserve: "8000.00" }` → `APPROVED` · `{ covered: false, reason: "≥ 10 chars" }` → `DECLINED`.

**Settle** (CLAIMS_MANAGER) — only `APPROVED`. `{ amount, payeeId, payeeNote }` (no payment reference: Finance adds it when paying).
- amount > 0, payee required;
- **paying anyone other than the LC bank (loss payee) needs `payeeNote`**;
- 422 `MISSING_DOCUMENTS` (with `fields: documents.<KIND>`) if a mandatory document is missing;
- 403 `ABOVE_AUTHORITY` if amount (ETB) > the claims manager's authority limit.
Creates a **payment voucher** `PV-2026-00001` (§13) → claim `PAYMENT_REQUESTED`. When Finance pays it, `{ id, voucherId, amount, payeeId, payeeNote, paymentRef, paidAt, paidBy, exportRef: "PV-…" }` is added to `payments` and the claim becomes `PAID`. Two people per payment: the claims manager approves, Finance pays.

**Close** — only `PAID`; 409 `RECOVERY_OPEN` while the recovery is open. Marks open deadlines met.

### Deadlines
Created from the rules (§9 `deadlines`) once their base date is known; kept in step when dates change.
`alertsSent` = the alert days already passed; `escalatedAt` = due date once overdue. **The backend should actually send these alerts** (email / in-app) on a schedule; the dashboard and bell read them.

---

## 12. Customer registration (KYC)

Customers are the parties that can be insured (type `INSURED`), with identity, address and documents.
**A new customer is `PENDING_APPROVAL`; only `APPROVED` customers can be quoted or given an open cover.**
Records that existed before registration (no status) count as approved.

| Method | Path | Roles | Notes |
|---|---|---|---|
| GET | `/customers` | staff and brokers (a broker sees only their own) | Filters `q` (name, customer no, TIN, licence, ID, phone, email), `status` (multi), `kind`, `brokerId`. Sort `name,asc` |
| GET | `/customers/{id}` | same | Customer (below); another broker's customer is 404 |
| POST | `/customers` | ADMIN, BROKER, UNDERWRITER, SENIOR_UW | 201, status `PENDING_APPROVAL`, number `CU-2026-00001` |
| PUT | `/customers/{id}` | same | Changing an **approved** customer's name, TIN, trade licence or ID sends it back to `PENDING_APPROVAL`; editing a rejected one resubmits it. Type (company / individual) can't change |
| POST | `/customers/{id}/documents` | same | multipart `file` + `kind`; PDF/JPG/PNG ≤ 20 MB |
| POST | `/customers/{id}/approve` | ADMIN, UNDERWRITER, SENIOR_UW | `{ note? }`. 422 `MISSING_DOCUMENTS` (fields `documents.<KIND>`) if a mandatory document is missing; 409 unless pending |
| POST | `/customers/{id}/reject` | same | `{ reason }` ≥ 10 chars |
| GET | `/customers/{id}/account` | FINANCE, ADMIN, UW, SENIOR_UW, BROKER | Notes, receipts and balance (§13) |

**Company** body:
```json
{ "kind": "COMPANY", "name": "Lalibela Textiles PLC", "tin": "0099887766", "tradeLicenceNo": "AM/05/1/0099887",
  "tradeLicenceExpiry": "2027-06-30", "vatRegNo": "", "businessType": "IMPORTER", "contactPerson": "Selamawit Tadesse",
  "phone": "+251 58 220 1100", "email": "info@lalibela.example",
  "addressParts": { "region": "Amhara", "city": "Bahir Dar", "subCity": "", "woreda": "", "houseNo": "" },
  "brokerId": "8" }
```
**Individual** body: `kind: "INDIVIDUAL"`, `firstName`, `fatherName`, `grandfatherName` (the server sets `name` from them), `idType` (`NATIONAL_ID | KEBELE_ID | PASSPORT | DRIVING_LICENCE`), `idNumber`, `dateOfBirth?`, `tin?`, plus phone, email, address, broker.

Validation (422):
- Company: name; TIN 10 digits; trade licence number; licence expiry **not passed**; business type (`IMPORTER, EXPORTER, IMPORTER_EXPORTER, MANUFACTURER, TRADER, OTHER`); contact person.
- Individual: all three names; ID type and number; TIN 10 digits if given; date of birth not in the future.
- Everyone: phone with ≥ 9 digits; valid email if given; region (one of Ethiopia's regions / city administrations); city.
- **Duplicates refused:** the same TIN, trade licence, or ID type + number already registered (message names who has it).
- A broker-only caller's customers always get `brokerId` = their party.

Mandatory documents for approval — company: `TRADE_LICENCE`, `TIN_CERTIFICATE` (optional `VAT_CERTIFICATE`, `MEMORANDUM`, `OTHER`); individual: `ID_COPY`.

Customer response: the body fields plus
```json
{ "id": "16", "customerNo": "CU-2026-00007", "status": "PENDING_APPROVAL", "types": ["INSURED"], "address": "Bahir Dar, Amhara",
  "broker": { … }, "documents": [ { "id", "kind", "name", "size", "type", "uploadedBy", "uploadedAt" } ],
  "documentsChecklist": [ { "kind": "TRADE_LICENCE", "label": "Trade licence", "mandatory": true, "status": "MISSING", "files": [] } ],
  "missingDocuments": ["Trade licence", "TIN certificate"],
  "registeredBy", "registeredAt", "approvedBy", "approvedAt", "rejectReason", "rejectedBy", "rejectedAt",
  "policyCount": 0, "activePolicyCount": 0, "outstanding": "0.00" }
```
Customers also appear in `GET /parties?type=INSURED`, so every existing reference to a party id keeps working.

---

## 13. Finance (role FINANCE posts; ADMIN reads)

All finance amounts are **ETB**. Every receipt and payment takes:
`{ method: "BANK_TRANSFER" | "CHEQUE" | "CASH" | "TELEBIRR", reference, bank?, date }` — reference required except for cash; date not in the future.

### Debit and credit notes
Raised automatically, never by hand:

| Source | Raised when | Kind |
|---|---|---|
| `BIND` | A quote is bound (not declarations) | Debit — releases the certificate when paid in full |
| `ENDORSEMENT` | A certificate amendment changes the premium | Debit (more) or credit (less) |
| `CANCELLATION` | A paid certificate is cancelled | Credit (refund) |
| `OPEN_COVER_DEPOSIT` | An open cover is created | Debit for the provisional premium |
| `ADJUSTMENT` | An open cover's year-end adjustment is posted | Debit or credit |

```json
{ "id": "3", "noteNo": "DN-2026-00003", "kind": "DEBIT", "source": "BIND", "status": "UNPAID",
  "customerId": "3", "brokerId": "8", "policyId": "3", "certificateId": "3", "openCoverId": null,
  "currency": "ETB", "net": "54068.28", "vat": "8110.24", "stamp": "5.00", "total": "62183.52", "paid": "0.00",
  "description": "Premium for P-2026-00003", "issuedAt": "…", "dueDate": "2026-11-28", "raisedBy": "…",
  // views add:
  "customer": { … }, "broker": { … }, "policy": { "id", "policyNo" }, "certificate": { "id", "certNo", "version" },
  "openCover": null, "outstanding": "62183.52", "ageDays": 0, "overdue": false, "receipts": [ … ] }
```
Numbers: `DN-` debit, `CN-` credit. Statuses: `UNPAID → PARTLY_PAID → PAID`, or `CANCELLED`. Due date = issue + 30 days (open question).
Net / VAT / stamp come from the premium breakdown lines (`vat`, `stamp`); net = total − VAT − stamp.

| Method | Path | Notes |
|---|---|---|
| GET | `/finance/notes` | Filters `kind` (`DEBIT`/`CREDIT`), `status` (multi), `source`, `customerId`, `overdue=true`, `q` (note, customer, policy, certificate, cover). Sort `issuedAt,desc` |
| GET | `/finance/notes/{id}` | Note with receipts (debit) or `payment` (credit) |
| GET | `/finance/ageing` | Outstanding debit notes by age since issue: `{ total, buckets: { current, d31, d61, d90: { amount, count } } }` (0–30, 31–60, 61–90, 90+ days) |
| POST | `/finance/receipts` | `{ noteId, amount, …payment }` — debit notes only; part payments allowed; amount ≤ outstanding (422). Returns the note. Paid in full → certificate released (and an unpaid amendment takes over from the old version) |
| POST | `/finance/notes/{id}/refund` | Credit note, `UNPAID` only, `…payment` → `PAID` |

Receipt: `{ id, receiptNo: "RC-2026-00001", noteId, amount, method, reference, bank, date, recordedBy, recordedAt }`.

### Claim payments
| Method | Path | Notes |
|---|---|---|
| GET | `/finance/vouchers` | Filters `status` (`REQUESTED, PAID, CANCELLED`), `q`. Sort `requestedAt,desc` |
| POST | `/finance/vouchers/{id}/pay` | `…payment`. Marks the voucher and the claim `PAID` (§11) |
| GET | `/finance/recoveries` | Claims with an amount recovered from the carrier: `[{ claimId, claimNo, currency, carrier, agreed, collected, toCollect, receipts }]` |
| POST | `/finance/recoveries/{claimId}/receipts` | `{ amount, …payment }` ≤ still to collect |

Voucher: `{ id, voucherNo: "PV-2026-00001", claimId, claimNo, currency, amount, rate, amountEtb, payeeId, payee, payeeNote, insured, status, requestedBy, requestedAt, method?, reference?, bank?, paidOn?, paidBy?, paidAt? }` — amount in the claim's currency; `amountEtb` at the day's FX rate.

### Broker commission
Earned on **net premium** (no VAT, no stamp duty) **when it's received**: each receipt on a debit note with a broker adds a commission line (`base = net share of the receipt`, `amount = base × rate`); a paid refund adds a negative line (claw-back). Lines are billed in statements.

| Method | Path | Notes |
|---|---|---|
| GET | `/finance/commission-rates` | `{ defaultPct: "10", brokers: [{ brokerId, pct, broker }] }` |
| PUT | `/finance/commission-rates` | FINANCE or ADMIN. Rates 0–50 %, no broker twice. Apply to receipts from then on |
| GET | `/finance/commissions` | Unbilled lines grouped by broker: `[{ broker, lines: [{ id, noteNo, policyNo, base, pct, amount, earnedOn }], total, months }]` |
| GET | `/finance/commission-statements` | Filters `status` (`OPEN, PAID`), `brokerId` |
| POST | `/finance/commission-statements` | `{ brokerId, month: "2026-10" }` — every unbilled line up to the end of that month. 409 `NOTHING_TO_BILL` if none or the total is ≤ 0. Number `CS-2026-00001` |
| POST | `/finance/commission-statements/{id}/pay` | `…payment` → `PAID` |

### Customer account
`GET /customers/{id}/account` → `{ notes: [note views], receipts: [receipt + noteNo], owed, refundsDue, balance, paidToDate }`.

---

## 14. Dashboard and alerts bell

`GET /dashboard` — polled every 60 s while any Marine page is open. Widgets appear only for the roles that need them:

```json
{
  "bell": 3,                                   // my open referrals + overdue deadlines (claims roles)
  "widgets": {
    "myReferrals":         { "count": 1, "rows": [ referralRow ] },            // UW
    "unassignedReferrals": { "count": 2, "rows": [ … ] },                      // UW, oldest first
    "expiringQuotes":      { "count": 0, "rows": [ { "id", "quoteNo", "insured", "validUntil" } ] },   // BROKER, UW: within 5 days
    "missingFx":           { "count": 1, "rows": [ { "currency": "EUR" } ] },  // FINANCE
    "lateDeclarations":    { "count": 0, "rows": [ { "id", "quoteNo", "coverId", "coverNo", "insured", "sailingDate" } ] },  // UW
    "deadlines":           { "count": 1, "rows": [ deadline + "claimNo" ] },   // claims roles: open, due within 7 days
    "recentCertificates":  { "count": 3, "rows": [ { "id", "certNo", "version", "status", "issuedAt" } ] },  // broker-only
    "customersToApprove":  { "count": 1, "rows": [ { "id", "customerNo", "name", "registeredBy", "registeredAt" } ] },  // ADMIN, UW
    "unpaidPremiums":      { "count": 2, "rows": [ { "id", "noteNo", "customer", "amount", "issuedAt" } ] },  // FINANCE, oldest first
    "refundsToPay":        { "count": 0, "rows": [ … ] },                                                     // FINANCE
    "claimPayments":       { "count": 1, "rows": [ { "id", "voucherNo", "claimNo", "currency", "amount", "payee" } ] }  // FINANCE
  },
  "summary": {
    "kpis": {
      "premium":           { "value": "154010.00", "trendPct": 12.5, "boundCount": 3 },   // ETB; trend = this month vs last, null if no data
      "activePolicies":    { "value": 3, "of": 3 },
      "openClaims":        { "value": 1, "of": 1 },
      "validCertificates": { "value": 3, "of": 3 }
    },
    "pipeline": [ { "status": "DRAFT", "count": 0 }, { "status": "QUOTED", "count": 1 }, … ],   // all 7 quote statuses
    "insights": { "conversionPct": 50, "referralPct": 50, "averagePremium": "51336.82", "lossRatioPct": 0 },
    "activity": [ { "id", "entity": "quote", "entityId": "6", "number": "Q-2026-00006", "action": "Rated: quoted", "by", "at" } ]  // last 5 audit entries
  }
}
```
Each widget's `rows` holds at most 5; `count` is the full number. Everything is broker-scoped for broker-only callers.

---

## 15. 409 / 403 codes the UI recognises

| Code | Meaning |
|---|---|
| `WRONG_STATE` | Action not allowed in the record's current status |
| `SANCTIONS_PENDING` | Resolve possible sanctions matches first |
| `SANCTIONS_CONFIRMED` | Confirmed match — can never be bound |
| `NO_RATE_TABLE` | No active rate table for the product |
| `NO_FX_RATE` | No exchange rate at all for the currency |
| `NEEDS_REFERRAL` | Certificate amendment would need underwriting |
| `OPEN_CLAIM` | Certificate has an open claim |
| `PDF_PENDING` | Certificate PDF still generating |
| `AWAITING_PAYMENT` | Certificate has no cover until its premium is paid |
| `NOTHING_TO_BILL` | No (positive) unbilled commission for that broker and month |
| `PERIOD_OPEN` / `ALREADY_ADJUSTED` | Open cover adjustment |
| `RECOVERY_OPEN` | Close blocked by an open recovery |
| `MISSING_DOCUMENTS` (422) | Settlement or customer approval blocked; `fields` lists the documents |
| `ABOVE_AUTHORITY` (403) | Above the caller's authority limit |
| `VALIDATION` (422) | Field errors in `fields` |

---

## 16. Endpoint checklist (96)

- [ ] GET/POST `/vessels`, GET/PUT `/vessels/{imo}`
- [ ] GET/POST `/ports`, PUT `/ports/{code}`
- [ ] GET/POST `/commodities`, PUT `/commodities/{hsCode}`, GET `/commodities/classes`
- [ ] GET/POST `/parties`, GET/PUT `/parties/{id}`
- [ ] GET `/audit`
- [ ] GET `/fx-rates`, GET `/fx-rates/today`, POST `/fx-rates`, POST `/fx-rates/import`
- [ ] GET/POST `/users`, PUT `/users/{id}`, POST `/users/{id}/enable`, POST `/users/{id}/disable`
- [ ] GET/POST `/quotes`, GET/PUT `/quotes/{id}`, POST `/quotes/{id}/rate`, POST `/quotes/{id}/bind`
- [ ] GET `/policies`, GET `/policies/{id}`
- [ ] GET `/certificates`, GET `/certificates/{id}`, GET `/certificates/{id}/pdf`, POST `/certificates/{id}/email`, POST `/certificates/{id}/events`, POST `/certificates/{id}/amend`, POST `/certificates/{id}/cancel`
- [ ] GET `/public/verify/{token}` (no auth)
- [ ] GET/POST `/rate-tables`, GET/PUT `/rate-tables/{id}`, POST `/rate-tables/{id}/activate`
- [ ] GET `/referrals`, GET `/referrals/{id}`, POST `/referrals/{id}/assign`, POST `/referrals/{id}/decide`
- [ ] POST `/screenings/{id}/review`
- [ ] GET `/rules`, PUT `/rules/{section}`
- [ ] GET/POST `/open-covers`, GET/PUT `/open-covers/{id}`, POST `/open-covers/{id}/declarations`, POST `/open-covers/{id}/adjustment`
- [ ] GET/POST `/claims`, GET/PUT `/claims/{id}`, POST `/claims/{id}/tasks`, PUT `/claims/{id}/tasks/{taskId}`, POST `/claims/{id}/documents`, POST `/claims/{id}/assess`, PUT `/claims/{id}/reserve`, POST `/claims/{id}/settle`, POST `/claims/{id}/close`
- [ ] GET `/deadlines`, POST `/deadlines/{id}/met`
- [ ] GET `/dashboard`
- [ ] GET/POST `/customers`, GET/PUT `/customers/{id}`, POST `/customers/{id}/documents`, POST `/customers/{id}/approve`, POST `/customers/{id}/reject`, GET `/customers/{id}/account`
- [ ] GET `/finance/notes`, GET `/finance/notes/{id}`, GET `/finance/ageing`, POST `/finance/receipts`, POST `/finance/notes/{id}/refund`
- [ ] GET `/finance/vouchers`, POST `/finance/vouchers/{id}/pay`, GET `/finance/recoveries`, POST `/finance/recoveries/{claimId}/receipts`
- [ ] GET/PUT `/finance/commission-rates`, GET `/finance/commissions`, GET/POST `/finance/commission-statements`, POST `/finance/commission-statements/{id}/pay`
- [ ] Changed behaviour: bind raises a debit note and holds the certificate; amend / cancel / open cover / adjustment raise notes; settle creates a voucher; rate and open cover check the customer is approved
- [ ] Added services: Marine roles + broker party in AuthService, GET `/config`, POST `/auth/logout`, scheduled expiry + deadline alerts, email sending

---

## 17. Open questions (business decisions needed)

1. How new users get their first password.
2. Branding / logo on the certificate PDF.
3. Whether Amharic is needed, and when.
4. The exact TIN format (the mock accepts 10 digits).
5. What a broker may see on a referred quote (the mock: status only, no reasons).
6. Whether a certificate amendment that would refer goes through the referral queue (the mock: blocked with `NEEDS_REFERRAL`).
7. Which error-reporting tool to use.
8. Whether claims staff need to work from phones.
9. Payment terms: the mock gives debit notes a 30-day due date; is any credit allowed, or is it strictly pay before cover?
10. Should a different person approve a customer than the one who registered it (four-eyes)?
11. Is VAT charged on the open cover deposit, or only on each declaration's premium at adjustment?
12. Commission: are there withholding-tax deductions on broker commission, and the agreed rates per broker?
13. Accounting export: which ledger system receives debit/credit notes, receipts and payments, and in what format?
14. Does a Finance payment above some amount need a second approver?
