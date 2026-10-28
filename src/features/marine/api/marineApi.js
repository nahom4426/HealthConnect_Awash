// Marine & Cargo endpoints (plan sections 4 to 8).
// Lists are server-paged: params { q, status, page (0-based), size, sort: "field,desc", ...filters }
// and the response is { content, page, size, totalElements }.
import { get, post, put } from "./marineClient";

// ── masters ──
export const listVessels = (params) => get("/vessels", params);
export const getVessel = (imo) => get(`/vessels/${imo}`);
export const createVessel = (body) => post("/vessels", body);
export const updateVessel = (imo, body) => put(`/vessels/${imo}`, body);

export const listPorts = (params) => get("/ports", params);
export const createPort = (body) => post("/ports", body);
export const updatePort = (code, body) => put(`/ports/${code}`, body);

export const listCommodities = (params) => get("/commodities", params);
export const createCommodity = (body) => post("/commodities", body);
export const updateCommodity = (hsCode, body) => put(`/commodities/${hsCode}`, body);
export const listCommodityClasses = () => get("/commodities/classes");

export const listParties = (params) => get("/parties", params);
export const getParty = (id) => get(`/parties/${id}`);
export const createParty = (body) => post("/parties", body);
export const updateParty = (id, body) => put(`/parties/${id}`, body);

export const getAudit = (entity, id) => get("/audit", { entity, id });

// ── FX rates (MAR-24, MAR-25) ──
export const listFxRates = (params) => get("/fx-rates", params);
export const getTodayFxRates = () => get("/fx-rates/today");
export const createFxRate = (body) => post("/fx-rates", body);
export const importFxRates = (file) => {
  const fd = new FormData();
  fd.append("file", file);
  return post("/fx-rates/import", fd, { headers: { "Content-Type": "multipart/form-data" } });
};

// ── users ──
export const listUsers = (params) => get("/users", params);
export const createUser = (body) => post("/users", body);
export const updateUser = (id, body) => put(`/users/${id}`, body);
export const setUserEnabled = (id, enabled) => post(`/users/${id}/${enabled ? "enable" : "disable"}`);

// ── quotes ──
export const listQuotes = (params) => get("/quotes", params);
export const getQuote = (id) => get(`/quotes/${id}`);
export const createQuote = (body) => post("/quotes", body);
export const updateQuote = (id, body) => put(`/quotes/${id}`, body);
export const rateQuote = (id) => post(`/quotes/${id}/rate`);
export const bindQuote = (id) => post(`/quotes/${id}/bind`);

// ── policies ──
export const listPolicies = (params) => get("/policies", params);
export const getPolicy = (id) => get(`/policies/${id}`);

// ── certificates (MAR-37, MAR-40) ──
export const listCertificates = (params) => get("/certificates", params);
export const getCertificate = (id) => get(`/certificates/${id}`);
export const getCertificatePdf = (id) => get(`/certificates/${id}/pdf`, undefined, { responseType: "blob" });
export const emailCertificate = (id, body) => post(`/certificates/${id}/email`, body);
export const logCertificateEvent = (id, kind) => post(`/certificates/${id}/events`, { kind });

// ── rate tables (MAR-26 to MAR-29) ──
export const listRateTables = (params) => get("/rate-tables", params);
export const getRateTable = (id) => get(`/rate-tables/${id}`);
export const createRateTable = (body) => post("/rate-tables", body);
export const updateRateTable = (id, body) => put(`/rate-tables/${id}`, body);
export const activateRateTable = (id) => post(`/rate-tables/${id}/activate`);

// ── phase 2: underwriting (MAR-31 to MAR-36, MAR-39) ──
export const getDashboard = () => get("/dashboard");
export const listReferrals = (params) => get("/referrals", params);
export const getReferral = (id) => get(`/referrals/${id}`);
export const assignReferral = (id) => post(`/referrals/${id}/assign`);
export const decideReferral = (id, body) => post(`/referrals/${id}/decide`, body);
export const reviewScreening = (id, body) => post(`/screenings/${id}/review`, body);
export const amendCertificate = (id, body) => post(`/certificates/${id}/amend`, body);
export const cancelCertificate = (id, body) => post(`/certificates/${id}/cancel`, body);
export const getRules = () => get("/rules");
export const saveRules = (section, body) => put(`/rules/${section}`, body);

// ── phase 3: open covers (MAR-02 to MAR-05) ──
export const listOpenCovers = (params) => get("/open-covers", params);
export const getOpenCover = (id) => get(`/open-covers/${id}`);
export const createOpenCover = (body) => post("/open-covers", body);
export const updateOpenCover = (id, body) => put(`/open-covers/${id}`, body);
export const createDeclaration = (id, body) => post(`/open-covers/${id}/declarations`, body);
export const runAdjustment = (id, body) => post(`/open-covers/${id}/adjustment`, body);

// ── phase 4: claims (MAR-41 to MAR-46) ──
export const listClaims = (params) => get("/claims", params);
export const getClaim = (id) => get(`/claims/${id}`);
export const createClaim = (body) => post("/claims", body);
export const updateClaim = (id, body) => put(`/claims/${id}`, body);
export const saveClaimTask = (id, body) => (body.id ? put(`/claims/${id}/tasks/${body.id}`, body) : post(`/claims/${id}/tasks`, body));
export const uploadClaimDocument = (id, form, onUploadProgress) => post(`/claims/${id}/documents`, form, { headers: { "Content-Type": "multipart/form-data" }, onUploadProgress });
export const assessClaim = (id, body) => post(`/claims/${id}/assess`, body);
export const settleClaim = (id, body) => post(`/claims/${id}/settle`, body);
export const closeClaim = (id) => post(`/claims/${id}/close`);
export const markDeadlineMet = (id, body) => post(`/deadlines/${id}/met`, body);

// ── public (no sign-in) ──
export const verifyCertificate = (token) => get(`/public/verify/${encodeURIComponent(token)}`);
