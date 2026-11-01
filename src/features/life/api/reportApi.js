// Dashboard and reports (contract 2026-10, G8). Group data is limited to the caller's branches.
import { lifeApi } from "./lifeClient";

/** GET /dashboard/summary · query: from, to (yyyy-MM-dd) · returns: DashboardSummaryResponse (counts by status, premium and claims totals, sum assured in force, expiring) */
export function getDashboardSummary(params = {}) {
  return lifeApi().get(`/dashboard/summary`, { params });
}
/** GET /report/{name} · query: from, to, format=json · returns: { report, from, to, columns: string[], rows: any[][] } */
export function getReport(name, params = {}) {
  return lifeApi().get(`/report/${name}`, { params: { ...params, format: "json" } });
}
/** GET /report/{name}?format=xlsx · returns: Excel workbook */
export function downloadReport(name, params = {}) {
  return lifeApi().get(`/report/${name}`, { params: { ...params, format: "xlsx" }, responseType: "blob" });
}
