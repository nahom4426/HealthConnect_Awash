import type { NitroFetchOptions } from 'nitropack'
export const useBaseFetch = (url: string, options: NitroFetchOptions<"", "head" | "get" | "patch" | "post" | "put" | "delete" | "connect" | "options" | "trace">) => $fetch(`http://localhost:4000/api${url}`, options)

