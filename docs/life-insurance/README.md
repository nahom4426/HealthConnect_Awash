# Life Insurance implementation analysis

Status: analysis complete; Stages 1–8 implemented (API, products & rates, reinsurance, underwriting questionnaire, group quotations, group policies, claims and individual policies on the existing API). Screens checked with Swagger-shaped data, not yet against the live Life service.
together first. Prepared 2026-10-28 against the Life service OpenAPI document at
`http://192.168.100.251:8194/api/life/v3/api-docs`.

| Document | Covers (requested phase) |
|---|---|
| This file | 1 business flow, 2 international vs Ethiopian model, 5 module architecture, 6 roles, 9 roadmap, testing, risks |
| [03-backend-api-inventory.md](03-backend-api-inventory.md) | 3 API inventory (all 169 endpoints) and 8 API-to-screen mapping, validation rules |
| [07-status-lifecycle.md](07-status-lifecycle.md) | 7 status lifecycle and state diagrams |
| [09-backend-gaps-and-change-requests.md](09-backend-gaps-and-change-requests.md) | 4 gap analysis, 10 backend change requests, copy-paste backend prompt |

---

## 1. Existing frontend architecture

| Area | What the project already has (reuse it) |
|---|---|
| Framework | Vue 3.5, Vite 5, Pinia, vue-router 4 with lazy routes and idle prefetch of sidebar pages |
| Structure | `src/features/<product>/` per insurance product (`life/` has only `navs.js`), `shared/` for auth, admin, analytics; routes in `src/router/<product>/` |
| Module switch | `stores/moduleStore.js` already lists **Life Insurance** (`id: 'life'`, `/life/dashboard`); `MainLayout` picks the sidebar from `features/life/navs.js` |
| API layer | `service/ApiService.ts` (axios, bearer header, token refresh on 401) + `ApiResponseHandler` (never throws; returns `{ success, data, error, status }` and toasts errors) + `composables/useApiRequest` |
| Lists & paging | `composables/usePagination` (reads `totalPages` inside array items — the same convention the Life API uses), `Table`, `TablePagination`, `DataTable`, row components, *DataProvider* components |
| Forms | `components/new_form_builder` (`Form`, `useForm`, string validation rules such as `required`) + `new_form_elements` (Input, Select, Textarea, InputFile…) |
| Modals | `@customizer/modal-x`: `openModal('Name', data, cb)` loads `*.mdl.vue` by name; names are now type-checked (`npm run type-check`) |
| Feedback | `toasted()` toasts, `AppLoader`, route loading bar, `TableRowSkeleton` |
| Permissions | Route `meta.permissions` checked in the router guard against `ROLE_…` privileges from AuthService, `v-privilage` directive, `scripts/privileges.js` |
| Theme | Design tokens (`ink`, `surface`, `line`, `success/warning/error` soft/strong) in light and dark mode |
| Closest existing analogue | `features/health/quotation` + `underwriting` + `insured_persons`: institution quotations, Excel insured import, payment with withholding tax and revenue stamp. The Life group flow mirrors it, so its page and data-provider patterns are the template. |
| Placeholders to replace | `features/life/navs.js` (dashboard, claims, "Life Rates" → `/rate-config/life`), `views/RateConfig/*` life entry and `ModuleDashboard` KPIs are **hard-coded demo data**, not backed by the Life API. |

**Stage 1 (done):** `src/features/life/api/` — `lifeClient.js` plus six files generated one-to-one from Swagger
(169 functions, name = `operationId`, every call authenticated); `constants/statuses.js` with the Swagger enums;
dev proxy `/api/life` → `VITE_LIFE_API_HOST` in `vite.config.ts` and `.env.development`.

## 2. Existing backend APIs

169 operations in 8 business groups — full table in [03](03-backend-api-inventory.md):

| Group | Ops | Summary |
|---|---|---|
| Products & rates | 40 | Riders with versioning; group term rates (age × gender); individual term rates (age × term × gender, max discount/load); individual & group rider rates; Excel imports; premium lookups |
| Underwriting questionnaire | 15 | Questions (Text/Multiselect/Numeric/Radio), answer library, numeric ranges with weights and critical flags, recorded answers |
| Group quotations | 14 | PENDING → ISSUED → ACCEPTED → PAID, revise, quoted riders |
| Insured persons | 8 | Individual policies: list per status (client-side search and paging), new / edit policy with rate check for the age and term, riders with their limits and rate, policy page with riders (add, change, remove on drafts); no premium is sent from the UI | 6 | **Done for the existing API** (checked with Swagger-shaped data). Issue, pricing, beneficiaries, questionnaire and KYC wait on G11, G9 item 27, G1, G4, G2; open questions in 09 §G9 items 27–30 |
| Policies | 3 | Issue from paid quotation, list by status, treaty report |
| Individual policies | 10 | "Benefit" = individual term policy with embedded person, plus rider benefits |
| Claims | 30 | Agency and insurance work queues, review, approve, deny, attachments, logs |
| Reinsurance | 49 | Reinsurers, treaties (surplus / risk premium), members, group FCL, medical tests and underwriting ranges, policy↔treaty mapping |

Verified on the live service: every endpoint requires a bearer token (401 otherwise) although Swagger declares
no security; lists use `page`/`limit` and return arrays with `totalPages`; no `totalElements`.

**What the backend is:** a **group term life** system with reinsurance-driven underwriting (free cover limits and
medical evidence by age × sum assured), plus a basic **individual term** product and riders. It has no
customer, beneficiary, payment-schedule, servicing, document or reporting model.

## 3. International life insurance model (reference, not a template)

| Concept | Common practice |
|---|---|
| Parties | Policyholder (owner/contract party), insured life, beneficiary (primary/contingent, shares = 100 %, guardian for minors), payer, and for group cover the employer/sponsor as policyholder with employees as insured members |
| Products | **Term** (level, decreasing for credit life), **group term** (employer schemes, often a multiple of salary, free cover limit up to which no medical evidence is needed), **credit life** (lender as beneficiary, cover follows outstanding loan), **endowment** and **whole life** (savings element, maturity and surrender values), **universal / investment-linked** (account value; need actuarial and investment systems) |
| Riders | Accidental death benefit, total & permanent disability, critical illness, waiver of premium, funeral expense |
| Underwriting | Age and sum-assured bands decide evidence (health declaration → medical report → tests); decisions: standard, loaded (extra premium), exclusion, postponed, declined; reinsurer's FCL and retention limits drive cession |
| Premium | Frequency annual/semi/quarterly/monthly, grace period (typically 30 days), lapse, reinstatement window with evidence of health |
| Claims | Death/disability notification, document checklist (death certificate, ID, claim form, medical/police report), contestability period (~2 years), suicide exclusion (~1–2 years), payment to beneficiaries; maturity and surrender for savings products |
| Reinsurance | Surplus or quota-share treaties, retention per life, cession bordereaux to reinsurers |

## 4. Ethiopian life insurance model

**Requirements and context relevant to Ethiopia (with confidence level):**

| Topic | Finding | Confidence |
|---|---|---|
| Law and supervisor | Insurance Business Proclamation No. 746/2012, amended 2019; supervised by the National Bank of Ethiopia through directives | High |
| Long-term business | NBE's draft financial-reporting directive defines long-term business as life, annuity, pension, group life, group credit, investment-linked and permanent health, and requires long-term accounts separate from general and takaful ([NBE draft directive](https://nbe.gov.et/wp-content/uploads/2025/01/Draft-Financial-Reporting-and-Related-Matters-Directive-.pdf)) → the Life module must keep its own policy, premium and claims records and reports | Medium (draft) |
| Composite licences | NBE directive SIB/63/2026 defines a composite insurer as licensed for both long-term and general business ([SIB/63/2026](https://nbe.gov.et/wp-content/uploads/2026/03/DIRECTIVE-NO.-SIB-63-2026-REQUIREMENTS-FOR-PERSONS-WITH-SIGNIFICANT-INFLUENCE-IN-AN-INSURANCE-COMPANY-.pdf)); a draft proclamation would separate the two licences and create an insurance regulatory authority, still awaiting approval ([NBE news](https://nbe.gov.et/nbe_news/nbe-hosts-consultative-discussion-on-draft-insurance-proclamation/), [The Reporter](https://www.thereporterethiopia.com/50628/)) → design Life so it can stand alone | Medium |
| Contract law and beneficiaries | The 1960 Commercial Code governs insurance contracts ([WIPO Lex](https://www.wipo.int/wipolex/en/text/492654)); Art. 701 on beneficiary designation is read as presuming spouse and children when none are named, though courts have differed ([Journal of Ethiopian Law](https://ejol.aau.edu.et/index.php/JEL/article/view/7604), [Journal of African Law](https://core-cms.cambridgecore.org/core/journals/journal-of-african-law/article/some-issues-relating-to-life-insurance-under-the-ethiopian-commercial-code/5D2A1978AB5F17A873DA8ECD69351B77)) → named beneficiaries with shares, plus an explicit "statutory default" flag | Medium — confirm with legal |
| KYC / AML | Insurers are in scope of Ethiopia's AML/CFT framework ([overview](https://dojah.io/blog/kyc-in-ethiopia)); no insurer-specific FIS directive found → capture ID type/number, TIN for corporates, occupation, address down to kebele | Low–medium — confirm with compliance |
| Market | Products offered locally: term, endowment, whole life, group life and credit life; **credit life is the common entry point** via MFIs and banks; life premium only ~2.7 bn birr in 2024/25; no local credentialed actuaries reported ([Insurance News BD](https://eng.insurancenewsbd.com/article/news/6500), [Milliman](https://us.milliman.com/en/insight/Pricing-microinsurance-products-in-Ethiopia), [AAU study](https://etd.aau.edu.et/items/16910ce7-6305-4e4f-883f-1d3cb4002e7e)) | Medium |
| Taxes on premium | The backend already models **withholding tax** and **revenue stamp** on payment; VAT was extended to general-insurance premiums in 2024 ([Capital Ethiopia](https://www.capitalethiopia.com/2024/09/02/new-vat-on-insurance-premiums-sparks-concerns-among-stakeholders/)); rates for life must come from the backend, not the UI | Low — confirm with finance |
| Standard Insurance | Licensed 1 Oct 2025; non-life and life (individual & group) lines; Takaful on its roadmap ([standardinsurancesc.com](https://standardinsurancesc.com/)) | High |

**Recommended product scope for Standard:**

| Product | Recommendation | Why |
|---|---|---|
| Group term life (+ group riders) | **Phase 1** | Fully modelled by the backend (quotation, rates, insured import, FCL, reinsurance); matches the employer-sponsored market |
| Individual term (+ riders) | Phase 2 | Partly modelled; needs customer, beneficiaries, issuance (G1, G2, G11) |
| Credit life | Phase 3, if sold | Largest local demand, but needs loan-linked decreasing cover (G12) |
| Endowment, whole life | Defer | Need maturity/surrender values and actuarial tables the backend doesn't have |
| Universal / investment-linked | Not now | No local actuarial/investment infrastructure; not in backend |
| Family Takaful | Separate decision | Must be accounted separately under the draft directive |

## 5. Recommended business workflow (what the backend supports today)

**Group term life**

1. **Set-up (once):** riders and rate tables → questionnaire → reinsurers and treaty (members, group FCL, medical underwriting ranges and required tests).
2. **Quotation (PENDING):** pick institution, term, contact; add insured persons manually or by Excel (sum assured per member; backend prices by age and gender from the group term table); add riders with sums assured.
3. **Reinsurance check:** members above retention/FCL (`insuredperson/reinsurance/list`) need the medical tests from the treaty ranges; map the quotation to a treaty.
4. **Issue quotation (ISSUED)** → client **accepts (ACCEPTED)** → finance **records payment (PAID)** with receipt, withholding tax, revenue stamp, net and requested premium.
5. **Issue policy (ACTIVE)** with begin and end dates; generate the treaty report.
6. **Claims:** agency prepares and submits → insurance registers → review → approve → (authorize → pay: missing) or reject with reason; attachments and timeline throughout.
7. **Renewal / change:** `revise` creates a new quotation version from the policy.

**Target workflow once the gaps are closed** adds: customer/KYC (G2) before quotation; underwriting decision per
member (G4) between steps 3 and 4; beneficiaries (G1) per insured; premium schedule and instalments (G6);
servicing — endorsements, lapse, reinstatement, cancellation, expiry (G5); documents and policy schedule (G7);
life-specific claim data and settlement to beneficiaries (G3).

## 6. User roles

Use the existing AuthService roles/privileges (`meta.permissions`, `v-privilage`); the Life privileges themselves
must be seeded in AuthService (G10).

| Role | Screens / operations | Privileges (proposed, G10) |
|---|---|---|
| Life product manager | Riders, rate tables, imports, questionnaire | Life_Product_Manage, Life_Rate_Manage |
| Underwriter / sales officer | Quotations, insured persons, riders on quotation, issue quotation, underwriting decisions | Life_Quotation_Create, Life_Quotation_Issue, Life_Underwriting_Decide |
| Reinsurance officer | Reinsurers, treaties, FCL, medical ranges, policy–treaty mapping, treaty report | Life_Reinsurance_Manage |
| Finance officer | Record premium payment; pay claims (G3) | Life_Payment_Record, Life_Claim_Pay |
| Policy administrator | Issue policy, servicing (G5) | Life_Policy_Issue, Life_Policy_Service |
| Agency / employer HR / agent | Prepare and submit claims, upload documents | Life_Claim_Prepare |
| Claims officer → manager → authorizer | Review, approve, authorize, reject | Life_Claim_Review, Life_Claim_Approve, Life_Claim_Authorize |
| Manager / auditor | Dashboards, reports (read-only) | Life_Read, Life_Report_View |
| Super Admin | Everything | existing bypass |

## 7. Frontend modules

Sidebar for the Life module (replaces the placeholder `features/life/navs.js`):

| Module | Content | Backend | Build in |
|---|---|---|---|
| Dashboard | Counts per status from list endpoints, pending work queues | Partial — no totals (G8) | after G8; interim: work-queue counts only |
| Products & rates | Riders (active/pending/modified, activate, revise), group term rates, individual term rates, rider rates, Excel import | Full | Stage 2 |
| Reinsurance | Reinsurers, treaties wizard (`treaty/all`), members, FCL groups, medical tests, underwriting ranges & requirements | Full | Stage 3 |
| Underwriting set-up | Questionnaire builder, answer library | Full | Stage 4 |
| Group quotations | List per status, wizard (details → insured → riders → review), issue, accept, pay, revise | Full | Stage 5 |
| Policies | Policy list per status, detail (insured, riders, reinsurance, treaty report) | Partial (no detail endpoint, no servicing) | Stage 6 |
| Claims | Agency and insurance queues, new claim, review/approve/reject, documents, timeline, approval trail | Partial (G3) | Stage 7 (read + existing actions), rest after G3 |
| Individual policies | Premium quote, create policy with riders | Partial (G1/G2/G11) | Stage 8 |
| Customers, Beneficiaries, Premium schedule, Documents, Reports | — | Missing | after backend |

UX rules that apply everywhere: status badges from [07](07-status-lifecycle.md); confirmation modal (existing
`Confirmation.mdl.vue`) for issue quotation, record payment, issue policy, reject claim, approve claim, delete
anything, deactivate rider; money shown with `formatCurrency` (now keeps cents); every premium, tax and claim
amount displayed as returned by the backend, never computed in the UI.

## 8. API-to-frontend mapping

All 169 endpoints are mapped to a screen and classified in [03](03-backend-api-inventory.md): 130 used,
32 admin, 5 needing clarification, 1 duplicate, 1 backend gap — none unexplained.

## 9. Backend gaps

Thirteen gaps, G1–G13, with DTOs, rules and statuses in [09](09-backend-gaps-and-change-requests.md). The
critical ones: **beneficiaries (G1)**, **customer/KYC (G2)**, **life claims data and authorize/pay (G3)**; cheap
and high-value: **contract hygiene (G9)** and **privileges (G10)**.

## 10. Backend change prompts

A single copy-paste prompt for the backend session is at the end of [09](09-backend-gaps-and-change-requests.md).
It fixes the order (G9 → G10 → G1 → G3 → G4 → G6 → G5 → G2 → G11 → G7 → G8 → G13) and the rules: no breaking
changes, existing architecture, migrations, validation, Swagger, tests, and an exact endpoint report back.

## 11. Implementation order

Adjusted from the requested order so each stage is buildable against the current backend; blocked stages wait
for their gap.

| Stage | Scope | Depends on | Status |
|---|---|---|---|
| 1 | API integration: generated client, enums, dev proxy, auth | — | **Done** |
| 2 | Products & rates: riders (versions, activate, revise), group & individual term rates, rider rates, Excel import, rate lookup | — | **Done** (UI checked with Swagger-shaped data; not yet against the live service — needs a Life login) |
| 3 | Reinsurance set-up: reinsurers, medical tests, treaties (list, 5-step create wizard, detail with members, group FCL, medical ranges and required tests, activate / revise / delete) | — | **Done** (UI checked with Swagger-shaped data; open questions in 09 §G9 items 8–11) |
| 4 | Underwriting questionnaire set-up: questions list (active / draft / disabled), question editor (single choice, multiple choice, number ranges, free text; scores, critical flags, follow-up text; applicant preview), shared answer library | — | **Done** (UI checked with Swagger-shaped data; open questions in 09 §G9 items 12–15) |
| 5 | Group quotation pipeline: list per status, create (institution search), members (add / edit / remove, Excel template and import, above-retention filter), riders within rider limits, treaty link, issue → accept → record payment → issue policy, revise | 2, 3 | **Done** (UI checked with Swagger-shaped data; open questions in 09 §G9 items 16–19) |
| 6 | Group policies: list per status (cover period, days left), policy page read from its quotation (members with cover dates, riders, treaty, details, timeline), treaty report, renew / revise; issue policy lives on the paid quotation | 5 | **Done** (UI checked with Swagger-shaped data; servicing waits on G5; open questions in 09 §G9 items 20–22) |
| 7 | Claims: agency queues (drafts, submitted, approved, paid, rejected) and claims desk queues (new → registered → reviewed → approved → to authorize → authorized → paid, rejected); new claim (policy → member); claim page with documents (attach, replace, open, remove), comments by stage, history, sign-offs; submit, review, approve, reject with reason | 6 | **Done for the existing API** (checked with Swagger-shaped data). Authorize, pay, claim type / event / amount and the document checklist wait on G3; open questions in 09 §G9 items 23–26 |
| 8 | Individual term policies | 2 | After G2/G11 for issuance |
| 9 | Beneficiaries | G1 | Blocked |
| 10 | Customers / KYC | G2 | Blocked |
| 11 | Premium schedule & payments | G6 | Blocked |
| 12 | Policy servicing | G5 | Blocked |
| 13 | Documents | G7 | Blocked |
| 14 | Dashboard & reports | G8 | Blocked (interim queue counts) |
| 15 | Role-specific actions | G10 | Needs privileges seeded |
| 16 | Final integration testing | all | — |

## 12. Testing plan

| Level | What | How |
|---|---|---|
| API client | Each generated function hits the documented method, path, params and body | Vitest (started: `src/features/life/api/__tests__/lifeClient.spec.ts`) |
| Contract | Client stays in sync with Swagger | Regenerate from `/v3/api-docs` and diff on each backend release |
| Functional | CRUD, search, paging, status actions per module | Against the dev service with a real Life user (needs credentials) |
| Business | Invalid age/term vs rate table, sum assured outside rider min/max, FCL breach needs medical tests, beneficiary shares ≠ 100 (after G1), invalid status transitions return 409 (after G9), unauthorized role blocked | Manual + Vitest where logic is client-side |
| UI | Loading, empty, error states; confirmation modals; responsive; dark mode; refresh keeps filters | Browser pane checks per stage |

Not mocked permanently: screens call the real service; mocks only inside unit tests.

## 13. Risks and decisions for review

| # | Item | Proposal |
|---|---|---|
| D1 | Scope of phase 1 | Group term life + riders + reinsurance + claims queues; individual term after G2/G11 |
| D2 | Claims API looks copied from travel insurance (passport, destination country) and lacks authorize/pay | Treat as G3 before building claim settlement |
| D3 | Production URL for the Life service and CORS | Route `/api/life` through the same gateway/nginx in production, or set `v_API_LIFE_URI` and enable CORS |
| D4 | Credentials for testing | A Life test user with each role on the dev service (I couldn't sign in — no credentials, and I won't enter real ones) |
| D5 | Who is the "agency" in claims | Confirm: employer HR, agent, or branch |
| D6 | Tax rates (WHT, revenue stamp, VAT on life?) | Finance/compliance to confirm; backend owns the calculation |
| D7 | Beneficiary legal default (Art. 701) and KYC depth | Legal/compliance to confirm before G1/G2 |
| D8 | Takaful | Separate product line and accounts; out of scope until decided |
| D9 | Institutions | Group quotations reference `institutionUuid`; confirm it is the shared institution service used by health |
| D10 | The existing `/rate-config/life` and module dashboard placeholders | Replace with the real Products & rates screens and remove the demo data |
| R1 | No list totals | Dashboards can't show exact counts until G8 |
| R2 | Unfiltered `getAnswers` / `getIndividualRiderBenefits` | Will return all records; must be filtered server-side before use at scale |
| R3 | Earlier branch `feature/nyala-realistic-backend-8-modules` | Checked: no Life work beyond the same placeholder `life.navs.js`; nothing to reuse |
