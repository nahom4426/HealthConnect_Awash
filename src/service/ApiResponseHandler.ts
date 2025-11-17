import type { AsyncResponse } from "@/types/interface";
import type { AxiosError, AxiosResponse } from "axios";
import { toasted } from "@/utils/utils";

export async function responseHandler<T>(
  request: Promise<AxiosResponse<T>>
): Promise<AsyncResponse<T>> {
  try {
    const res = await request;
    return {
      status: 200,
      data: res.data as T,
      success: true,
      error: "",
    };
  } catch (error: any) {
    // this is true when the request gets to the server
    // and there is some error on the server
    if (error.response) {
      // Some backends return error.data as a JSON string. Try to parse.
      const rawData = error.response?.data;
      let data = rawData as any;
      if (typeof rawData === "string") {
        try {
          data = JSON.parse(rawData);
        } catch (_) {
          // leave as string
        }
      }

      // Normalize potential validation containers
      const propErrors = data?.properties?.errors || data?.properties?.Errors;
      const fieldErrors = data?.fieldErrors;

      // If backend returns validation error shape, toast detailed field errors
      if (data && typeof data === "object" && (propErrors || (Array.isArray(fieldErrors) && fieldErrors.length))) {
        // Pass the whole object so toasted() can format it nicely
        toasted(false, "", data);

        // Also return a readable string in the response
        const messages: string[] = [];
        if (propErrors) {
          for (const [field, errs] of Object.entries<any>(propErrors)) {
            const fieldName = String(field)
              .replace(/([A-Z])/g, " $1")
              .replace(/^./, (s) => s.toUpperCase());
            if (Array.isArray(errs)) {
              messages.push(`${fieldName}: ${errs.join(", ")}`);
            } else {
              messages.push(`${fieldName}: ${errs}`);
            }
          }
        }
        if (Array.isArray(fieldErrors) && fieldErrors.length) {
          for (const fe of fieldErrors) {
            const name = String(fe?.field || fe?.name || "Field");
            const fieldName = name.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
            const msg = fe?.message || fe?.defaultMessage || fe?.error || "Invalid";
            messages.push(`${fieldName}: ${msg}`);
          }
        }

        if (!messages.length) {
          // fallback to detail/title
          const fallback = data?.detail || data?.title || error.message || "Validation error";
          messages.push(fallback);
        }

        return {
          success: false,
          status: error.response.status,
          error: messages.join("; "),
        };
      }

      // Non-validation server error
      const errMsg = (typeof data === "object" ? (data?.message || data?.detail || data?.title) : undefined) || error.message || "Request failed";
      toasted(false, "", errMsg);
      return {
        success: false,
        status: error.response.status,
        error: errMsg,
      };
    }
    // this is true when the request cant get to the server
    // eg. connection error
    if (error.request) {
      if (error.code != "ERR_CANCELED") {
        toasted(false, "", error.message);
      }

      return {
        success: false,
        status: error.code,
        error: error.message,
      };
    }
  }

  return {
    success: false,
    status: 500,
    error: "Unexpected error",
  };
}