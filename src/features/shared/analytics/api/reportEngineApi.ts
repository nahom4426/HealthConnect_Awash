import ApiService from "@/service/ApiService";

const api = new ApiService();

export interface ReportParam {
  name: string;
  label: string;
  type: "DATE" | "TEXT" | "NUMBER" | "SELECT" | "MULTI_SELECT" | "BOOLEAN";
  required?: boolean;
  options?: string[];
  optionsSource?: string;
  defaultValue?: string;
}

export interface ReportCatalog {
  reportUuid: string;
  name: string;
  description: string;
  category: string;
  parameters: string; // JSON string → parse with JSON.parse()
}

export interface PagedData<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface DynamicReportResponse {
  columns: string[];
  data: PagedData<Record<string, unknown>>;
}

/**
 * Fetch all available report definitions from the catalog.
 */
export function getReportCatalog(): Promise<ReportCatalog[]> {
  return api.addAuthenticationHeader()
    .get("/claimconnect/reports")
    .then((r) => r.data || r);
}

/**
 * Execute a report by UUID with optional filter parameters and server-side pagination.
 */
export function executeReport(
  reportUuid: string,
  params: Record<string, unknown> = {},
  page = 1,
  pageSize = 50
): Promise<DynamicReportResponse> {
  return api.addAuthenticationHeader()
    .post(`/claimconnect/reports/${reportUuid}/execute`, { params, page, pageSize })
    .then((r) => r.data || r);
}

/**
 * Get Provider Credit Services Report (legacy endpoint)
 */
export function getProviderCreditServicesReport(query: Record<string, unknown> = {}) {
  return api.addAuthenticationHeader()
    .get("/claimconnect/reports/provider-credit-services", { params: query })
    .then((r) => r.data || r);
}
