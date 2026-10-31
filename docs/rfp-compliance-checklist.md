# RFP Compliance Checklist — Standard Insurance Web Platform

Audit of `medcofrontend-standard` against the RFP checklist (frontend code only; backends were not run).
Date: 2026-10-29.

Legend: ✅ Done (working UI on a real API) · 🟡 Partial · ❌ Missing

## Summary

| Area | Status | One-line verdict |
|---|---|---|
| RBAC | 🟡 | Roles/privileges admin exists; enforcement is fragmented, missing roles |
| Role dashboards / widgets | 🟡 | Only `/analytics` (health) is live; other dashboards hard-coded; no configurable widgets |
| Browser compatibility | 🟡 | Autoprefixer + responsive CSS; no `browserslist` |
| Audit logging | 🟡 | Health field logs + health/life claim history only; no global audit trail |
| Documents (PDF/Excel/photo/video) | 🟡 | PDF/image/Excel yes; **video missing**; motor/other claims have no upload |
| M1 Product config & rating | 🟡 | Rate config UIs exist; generic configs are not used for pricing |
| M1 Multi-line support | 🟡 | Health + Life real; Motor partial; Fire/Marine/Eng/Liability/Burglary shells; **Takaful, Loan Redemption, PEC missing** |
| M1 Policy lifecycle | 🟡 | Health amend/renew, Life issue/renew; no endorsements/cancellation/premium adjust anywhere |
| M2 Configurable underwriting | 🟡 | Form builder exists but its schemas aren't consumed by any flow |
| M2 Real-time validation | ✅/🟡 | Custom validator framework in ~61 forms; motor/life use ad-hoc validation |
| M2 Fayda ID / vehicle registry | ❌ | Not present |
| M3 Claims workspace | 🟡 | Health ✅, Life ✅ basic; Motor & others advance-status only; **no "request documents"** |
| M3 AI claims validation | ❌ | Not present |
| M3 Assessor/surveyor workflows | 🟡 | Motor only, hard-coded assignee lists, no video/survey review |
| M4 Agent/broker onboarding & pipeline | 🟡 | Broker CRUD (health only); no agents, hierarchy, leads, conversion |
| M4 Commissions | 🟡 | Flat % rules, calc, payouts; no tiers, scheduling, statement export |
| M5 Payment gateways | ❌/🟡 | Motor shows gateway status only; no Telebirr/CBE Birr integration in admin |
| M5 Multi-currency / schedules / receipts | ❌ | ETB only; no installments; no downloadable receipts |
| M5 Peachtree ERP | ❌ | Not present |
| M5 Premium financing | ❌ | Not present |
| M6 SMS/Email/WhatsApp/Push + trigger rules | ❌ | Not present |
| M6 In-app alerts / task queues / escalation | 🟡 | Bell shows **hard-coded seed data**; no realtime; no unified inbox; no escalation |
| M7 Operational/financial reports | 🟡 | Health claims reports real; no GWP, turnaround, pending-UW reports |
| M7 Cohort / segmentation / profitability | ❌ | Not present |
| M7 Custom report engine + export | 🟡 | Dynamic report (filters, paging, columns) + Excel; no CSV/PDF, no group-by |
| M8 CSAT / feedback | ❌ | Not present |
| M8 Help desk / FAQ / chatbot | ❌ | Not present |
| NFR Local deployment | 🟡 | Docker + nginx exist; build args ignored; Life `/api/life` not proxied; Google Fonts/Maps external |
| NFR HA / scale (frontend) | 🟡 | Lazy routes + server paging (health); motor loads all records client-side |
| NFR DR / backup / hardware sizing docs | ❌ | No documentation |
| Security basics | 🟡 | Token refresh; tokens in localStorage, no idle timeout, weak guard, demo fallbacks in prod |

---

## 1. Core portal & admin

### RBAC — 🟡
- ✅ Users/roles/privileges admin on real API: `src/features/shared/admin/{user,role,privilege}` — `/users`, `/roles`, `/privileges`.
- ✅ Route guard checks `meta.permissions` (`src/router/index.js`).
- ❌ Motor, Life, form-builder, rate-config routes have **no permission checks** (only `requiresAuth`).
- ❌ All admin routes share one permission `read_user`.
- ❌ `v-privilage` directive (`src/directives/vPrivilage.js`) and `hasPrivilege()` are never used — buttons/actions are not hidden by privilege.
- ❌ Sidebar filtering in `src/layouts/MainLayout.vue` matches hard-coded role names against menu text; `permissions` in `navs.js` are ignored.
- ❌ Second, separate user/role system at `/admin/user-roles` (`UserRoleManagement.vue`) with hard-coded fallback users.
- ❌ Roles: Underwriter ✅, System Admin ✅, Claims Adjuster ~ (`ROLE_ADJUSTOR`), **Surveyor/Loss Assessor and Branch Manager missing**.
- Inconsistent permission names (`Amend_Policy` vs `Amend Policy`).

### Dashboards — 🟡
- ✅ `/analytics` (`features/shared/analytics/pages/Analytics.vue`) — real KPIs/charts from `/claimconnect/reports` (health only).
- ❌ `/dashboard` (`src/views/HomeView.vue`) — KPIs hard-coded ("ETB 2.45M", "61.4%"); chart API call commented out (`src/composables/useChartData.ts`).
- ❌ `/<module>/dashboard` (`src/views/ModuleDashboard.vue`) for all 7 other lines — hard-coded except "Claims Filed".
- ❌ No Underwriter / Surveyor / Branch Manager / Admin dashboards (only motor claim Manager & Garage).
- ❌ No user-configurable widgets or saved layouts.

### Browser compatibility — 🟡
- ✅ Autoprefixer, viewport meta, Tailwind responsive classes.
- ❌ No `browserslist` / `build.target` — add one covering Chrome, Edge, Safari, Opera, Firefox.
- ⚠ Safari 15.4+ needed for `:has()` (`LoginForm.vue`, `NewInputLayout.vue`) and `dvh` (`ModalParent.vue`); 37 native date inputs.

### Audit logging — 🟡
- ✅ `/field-update-logs` (health), health claim logs, life claim history + sign-offs.
- ❌ No system-wide audit trail page (user actions, logins, admin changes).
- ❌ No status/approval history for motor and the other lines; motor "timeline" is computed, not a log.
- ❌ Tamper-evidence is a backend concern — not visible from frontend.

### Documents — 🟡
- ✅ PDF/image upload + preview (`health/claim/components/modals/AttachmentViewer.mdl.vue`, life claim docs).
- ✅ Excel import/export (exceljs, xlsx, jspdf).
- ❌ **Video upload/preview missing everywhere** (no `<video>` in `src`).
- ❌ `/:module/claims/new` (`motor/claims/pages/ClaimNew.vue`) has no file upload — no photo evidence for motor/fire/marine/etc. from the portal.

## 2. Module-by-module

### Module 1 — Product configuration & lifecycle
**Coverage & pricing rules — 🟡**
- ✅ Health benefits/packages/rates (`/benefits`, `/show-rates/:packageUuid`); Life group/individual term rates + riders.
- 🟡 Motor categories/rates/car config — real API with seeded fallback; premium falls back to `buyingPrice*0.025` client-side.
- 🟡 `/rate-config/:typeId` (`src/views/RateConfig/`) for all lines — schema hard-coded, localStorage fallback, **not consumed by any pricing flow**.
- ❌ No deductible/co-pay on health; no business-rules engine UI (life rules hard-coded in JS).

**Multi-line support — 🟡**

| Line | Status |
|---|---|
| Health | ✅ full |
| Life (group term) | ✅ quotation → policy → claims → reinsurance |
| Motor | 🟡 quotation → proposal → inspection → issue (seed/localStorage fallbacks) |
| Fire, Marine, Engineering, Liability, Burglary | 🟡 shell: mock dashboard, rate config, motor-backed claims; **no quotation/policy** |
| PEC | ❌ (only "Professional Indemnity" select option) |
| Loan Redemption | ❌ (only "Credit Life" select option) |
| Takaful | ❌ |

**Policy lifecycle — 🟡**
- Health: issue ✅, amend members ✅, renew ✅, expired ✅; ❌ endorsement, cancellation.
- Life: issue ✅, renew/revise ✅; ❌ endorsements, beneficiary amendment, lapse/cancel (backend gap G5).
- Motor: issue only; ❌ renewal, cancellation, premium adjustment.
- Other lines: ❌ none.

### Module 2 — Underwriting
- 🟡 Form builder `/form-builder` (multi-step, conditional rules, versioning, publish) — **published schemas aren't used** by any quotation/underwriting page; localStorage fallback.
- 🟡 Life questionnaire `/life/underwriting/questions` — real, life only.
- ❌ Approval steps are hard-coded per line, not configurable.
- ✅/🟡 Validation: custom framework `src/components/new_form_builder/` (required, email, phone, eth_mobile9, minmax…) with inline errors; motor/life use ad-hoc submit-time checks. `vee-validate` installed but unused.
- ❌ **Fayda National ID** lookup — not present.
- ❌ **Vehicle registry** lookup — plate/chassis are free text; `MotorProposalDetail.vue` has hard-coded defaults (`3-A98123`, `CHAS-881923091`).

### Module 3 — Claims
- ✅ Health: process → verify → approve L1/L2 → authorize → complete/paid, reject, attachments, eligibility check.
- ✅ Life: claims desk / agency, docs, logs, approve/reject.
- 🟡 Motor + Fire/Marine/Eng/Liability/Burglary: all reuse motor pages on `/api/payer/motor/digital-channel` (`router/motor/motor.routes.js`); only "Advance Status →", **no explicit approve/reject**; workflow is motor-shaped (garage/bids) for non-motor lines; localStorage merged into claim lists; `validatePolicyCoverage` returns `isValid: true` on failure.
- ❌ **"Request additional documents" step missing in every line.**
- ❌ **AI damage recognition / document inconsistency checks missing.** (Only display of mobile-side OCR libre fields on motor proposals.)
- 🟡 Assessor workflow (motor only): adjustor/garage assignment uses **hard-coded IDs** (`ADJ-100…`, `GAR-200…`); APIs for spot survey, garage bids, subrogation, `assignSurveyor` have **no UI**; no video/survey report review; no engineer/loss-adjuster flow for fire/marine/engineering.
- 🐞 Bug: `GarageDashboard.vue:27` filter `c.garageUuid === myUsername || c.garageUuid` shows every garage's claims to every garage.

### Module 4 — Agent & broker
- 🟡 Broker CRUD on real API (`/brokers`, health only, behind `Manages_Brokers`); type hard-coded `BROKER` — **no agent onboarding**.
- ❌ `/broker/dashboard` fully hard-coded with "Charts … will go here" placeholder.
- ❌ Sales hierarchy, lead pipeline, conversion metrics.
- 🟡 Commission rules (percentage only, no tiers), calculation, settle/confirm payouts.
- ❌ Payout scheduling; ❌ exportable commission statements; broker menu not available in other lines.

### Module 5 — Billing, payments & integration
- 🟡 Motor proposal shows gateway result (TELEBIRR/BANK/ETSWITCH, txn ref); payment happens in mobile app; simulation calls marked `@deprecated`; printed contract hard-codes "PAID".
- ❌ No CBE Birr / Chapa / switch integration or gateway config; health & life record payments manually by receipt number.
- ❌ Multi-currency (ETB only); ❌ premium due schedules/installments.
- ❌ Digital receipt generation/download.
- ❌ Stubs: `/other_payments` and finance `PaidClaims.vue` (empty arrays, no API), `/excel_daily_report` (`setTimeout` + `alert`); `/paid_claims` defined in two route files.
- ❌ **Peachtree ERP export/sync** — not present.
- ❌ **Premium financing** hooks — not present (only "Hire Purchase / Financier" fields).

### Module 6 — Communication
- ❌ SMS / email / WhatsApp / push dispatch, trigger-rule config, ad-hoc messaging — none.
- 🟡 Notification bell (`src/components/NotificationCenter.vue`) shows **3 hard-coded demo items** from `src/stores/notificationStore.ts`; `fetchNotifications()` is never called; no websocket/SSE (`BASE_SOCKET_URL` unused).
- 🟡 Task queues = workflow list pages only; ❌ unified "My tasks" inbox; ❌ escalation / SLA ageing.

### Module 7 — Reporting & BI
- ✅ `/analytics` (8 server-defined health claim reports), `/reports/provider-report`.
- ❌ Gross written premium, claim turnaround, pending underwriting task, proper agent performance reports.
- ❌ Demographic segmentation, retention/lapse cohorts, product profitability.
- 🟡 `/reports/dynamic-report`: catalogue, parameter filters, server paging, column show/hide; Excel export only. ❌ CSV, ❌ PDF, ❌ dynamic group-by. Most list tables (`components/Table.vue`) have no export.

### Module 8 — Customer engagement
- ❌ CSAT surveys after settlement/renewal.
- ❌ Help desk ticketing, FAQs, chatbot.

## 3. Non-functional

### Local deployment — 🟡
- ✅ Dockerfile (node build → nginx), self-hosted Geist font.
- ❌ Docker build args (`API_URI`, …) lack the `v_`/`VITE_` prefix → ignored; URLs baked from committed `.env.production`; no runtime config.
- ❌ nginx: no `/api/life` proxy (Life likely broken in Docker), no gzip/caching/security headers.
- ❌ Internet dependencies: Google Fonts in `index.html`, Google Maps iframe in `motor/claims/pages/ClaimDetail.vue` — breaks in an offline/in-country data centre.
- ⚠ `localhost:8080` / `localhost:8888` fallbacks in health insured/provider and motor claim code; unused `googleapis` dependency.

### HA / scale (frontend side) — 🟡
- ✅ Lazy routes, idle prefetch, vendor chunks; health lists server-paged.
- ❌ Motor proposals/claims fetch everything and page client-side; imports with `limit 10000`; some pages load 1000 rows.

### DR, backup & hardware sizing — ❌
- `README.md` is the stock template; `docs/` only has life-insurance notes. Need: deployment guide, DR/backup/restore runbook (RTO/RPO), HA topology, hardware/OS sizing.

### Security — 🟡
- ✅ Token refresh in `src/service/ApiService.ts`.
- ❌ JWT/refresh tokens in `localStorage`; fixed 24h logout, no idle timeout.
- ❌ Route guard treats presence of `token` **or** `roleCode` **or** `email` as logged in.
- ❌ Demo role switcher, seeded data and localStorage fallbacks ship in production code — they also hide backend failures.
- ❌ `.env*` files committed; `.env.example` has a `VITE_METABASE_TOKEN` key (VITE_ vars are bundled into the browser).

---

## Priority list to close the RFP

**P0 — explicitly named in RFP, entirely missing**
1. Fayda National ID + vehicle registry integration (M2).
2. Takaful, Loan Redemption, PEC product lines; quotation/policy for Fire, Marine, Engineering, Liability, Burglary (M1).
3. Payment gateway integration (Telebirr, CBE Birr, switches), receipts, installments, multi-currency (M5).
4. Peachtree ERP export (M5); premium financing endpoints (M5).
5. Communication center: SMS/email/WhatsApp/push + trigger rules (M6).
6. AI damage/document validation (M3).
7. CSAT, help desk, FAQ, chatbot (M8).
8. DR/backup plan + hardware sizing document (NFR).

**P1 — exists but must be completed**
9. RBAC: single role system, guard every route, use `v-privilage` on actions, add Branch Manager & Surveyor roles, per-role dashboards.
10. Replace every hard-coded dashboard/KPI/notification with API data; remove seed/localStorage fallbacks.
11. Claims: request-documents step, explicit approve/reject for non-health lines, line-specific (non-motor) claim flows, video upload/preview, document upload on `/:module/claims/new`.
12. Assessor workflow: real adjustor/garage lists, UI for spot survey, bids, subrogation, surveyor assignment; fix `GarageDashboard.vue:27`.
13. Policy lifecycle: endorsements, beneficiary/coverage amendments, cancellation, premium adjustment for all lines.
14. Wire form-builder schemas and rate configs into quotation/underwriting/pricing.
15. Broker: agents, hierarchy, leads/conversion, tiered commissions, payout schedule, statement export; live broker dashboard.
16. Reports: GWP, loss ratio by line, turnaround, pending UW, cohorts/segmentation; CSV + PDF export and group-by in report engine; export on all tables.
17. Global audit trail page; status history for every line.
18. Realtime alerts (websocket/SSE), "My tasks" inbox, escalation rules.

**P2 — hardening**
19. Deployment: runtime env config, nginx proxy for all APIs + gzip/security headers, self-host fonts, remove Google Maps / `googleapis`.
20. Security: idle timeout, stronger guard, httpOnly cookie or memory token, strip demo code from prod builds, stop committing `.env`.
21. Server-side paging for motor lists; add `browserslist`.
22. Remove stub pages or implement them (`/other_payments`, finance paid claims, `/excel_daily_report`).
